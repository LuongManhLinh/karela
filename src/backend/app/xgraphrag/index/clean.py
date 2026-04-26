import os
import ast
import numpy as np
import pandas as pd
import re
from common.vectorstore import default_embeddings
from ..defines import ENTITY_TABLE, RELATIONSHIP_TABLE
import pickle

from .judge import llm_judge_is_duplicate
from ..logger import Logger


def calculate_centroid(vec1: np.ndarray, vec2: np.ndarray) -> np.ndarray:
    """Calculates the average of two vectors and normalizes it."""
    centroid = (vec1 + vec2) / 2.0
    return centroid / np.linalg.norm(centroid)


def cosine_similarity(vec1: np.ndarray, vec2: np.ndarray) -> float:
    """Safely calculates cosine similarity between two vectors."""
    norm1 = np.linalg.norm(vec1)
    norm2 = np.linalg.norm(vec2)
    if norm1 == 0 or norm2 == 0:
        return 0.0
    return np.dot(vec1, vec2) / (norm1 * norm2)


def process_entities_sequentially(
    entities_df: pd.DataFrame,
    threshold: float = 0.85,
    batch_size: int = 100,
    llm_batch_size: int = 10,  # New parameter to control case batching,
    logger: Logger = Logger.default(),
) -> tuple[dict[str, dict], dict[str, str]]:
    """
    Batches embeddings for performance, then simulates the Check-Before-Insert pipeline locally.
    Batches potential matches into groups before calling the LLM Judge.
    Returns the cleaned entity registry and a mapping of old IDs to new canonical IDs.
    """
    logger.info(f"Preparing to embed {len(entities_df)} entities...")

    # ==========================================
    # PHASE 1: BATCH EMBEDDING
    # ==========================================
    texts_to_embed = []
    for _, row in entities_df.iterrows():
        title = row["title"]
        description = row.get("description", "")
        texts_to_embed.append(f"{title}: {description}")

    all_embeddings = []

    for i in range(0, len(texts_to_embed), batch_size):
        batch_texts = texts_to_embed[i : i + batch_size]
        batch_embs = default_embeddings.embed_documents(
            batch_texts, output_dimensionality=512
        )
        all_embeddings.extend(batch_embs)
        logger.info(f"Embedded batch {i // batch_size + 1}...")

    entities_df["embedding"] = [np.array(emb) for emb in all_embeddings]

    # ==========================================
    # PHASE 2: SEQUENTIAL DEDUPLICATION
    # ==========================================
    logger.info("Sequentially processing and deduplicating entities...")
    processed_entities = {}
    id_translation_map = {}

    pending_cases = []
    batch_count = 0

    def flush_pending_cases():
        nonlocal batch_count, processed_entities, id_translation_map, pending_cases
        if not pending_cases:
            return

        batch_count += 1
        logger.info(
            f"Batch {batch_count}. Invoking LLM Judge for {len(pending_cases)} batched cases..."
        )

        # Call the modified LLM function
        batch_judgment = llm_judge_is_duplicate(pending_cases, logger)

        # Map judgments by case_id for quick lookup
        judgment_map = {}
        if batch_judgment:
            judgment_map = {case.case_id: case for case in batch_judgment.cases}

        # Sequentially apply the LLM's decisions for this batch
        for case in pending_cases:
            current_entity = case["new_entity"]
            title = current_entity["title"]
            judgment = judgment_map.get(case["case_id"])

            if judgment and judgment.has_any_match and judgment.final_canonical_title:
                canonical_title = judgment.final_canonical_title
                matched_titles = [
                    eval_obj.candidate_title
                    for eval_obj in judgment.evaluations
                    if eval_obj.is_match
                ]

                canonical_node = current_entity.copy()
                canonical_node["title"] = canonical_title
                canonical_node["frequency"] = current_entity.get("frequency", 1)
                canonical_node["degree"] = current_entity.get("degree", 1)

                for m_title in matched_titles:
                    m_node = processed_entities.pop(m_title, None)
                    if not m_node:
                        continue

                    canonical_node["embedding"] = calculate_centroid(
                        canonical_node["embedding"], m_node["embedding"]
                    )
                    canonical_node["description"] = (
                        f"{canonical_node.get('description', '')}\n[Alias ({m_title}): {m_node.get('description', '')}]"
                    )
                    canonical_node["text_unit_ids"] = list(
                        set(
                            list(canonical_node.get("text_unit_ids", []))
                            + list(m_node.get("text_unit_ids", []))
                        )
                    )
                    canonical_node["frequency"] += m_node.get("frequency", 1)
                    canonical_node["degree"] += m_node.get("degree", 1)

                processed_entities[canonical_title] = canonical_node
                id_translation_map[title] = canonical_title

                for old_title, mapped_to in id_translation_map.items():
                    if mapped_to in matched_titles:
                        id_translation_map[old_title] = canonical_title
            else:
                processed_entities[title] = current_entity
                id_translation_map[title] = title

        pending_cases.clear()

    for _, row in entities_df.iterrows():
        current_entity = row.to_dict()
        title = current_entity["title"]
        current_embedding = current_entity["embedding"]

        # 1. Vector Search
        potential_matches = []
        for proc_title, proc_data in processed_entities.items():
            current_type = current_entity.get("type", "UNKNOWN")
            if current_type != proc_data.get("type", "UNKNOWN") or current_type in [
                "KEY",
                "EPIC",
            ]:
                continue

            similarity = cosine_similarity(current_embedding, proc_data["embedding"])
            if similarity > threshold:
                potential_matches.append(proc_data)

        # 2. Queue for LLM or Insert Immediately
        if potential_matches:
            pending_cases.append(
                {
                    "case_id": f"case_{title}",  # Unique identifier for the batch mapping
                    "new_entity": current_entity,
                    "potential_matches": potential_matches,
                }
            )

            # Flush if we hit the batch limit
            if len(pending_cases) >= llm_batch_size:
                flush_pending_cases()
        else:
            processed_entities[title] = current_entity
            id_translation_map[title] = title

    # Flush any remaining cases at the end of the dataframe
    flush_pending_cases()

    return processed_entities, id_translation_map


def process_relationships_sequentially(
    relationships_df: pd.DataFrame, id_translation_map: dict[str, str]
) -> list[dict]:
    """
    Folds relationships based on Entity merges, but STRICTLY segregates edges by their [TYPE].
    This preserves parallel edges (Multi-Graph) for advanced Neo4j defect queries.
    """
    print("Folding relationships (Grouping by Source, Target, and Type)...")

    folded_edges = {}  # Key: (source, target, edge_type), Value: edge_data

    # Regex to extract the [TYPE] from the description.
    # Matches patterns like "[MODIFIES]", "[DEPENDS_ON]" at the start or inside the text.
    type_pattern = re.compile(r"\[([A-Z_]+)\]")

    for _, row in relationships_df.iterrows():
        edge = row.to_dict()

        # 1. Translate Source and Target based on Entity Merges
        mapped_source = id_translation_map.get(edge["source"], edge["source"])
        mapped_target = id_translation_map.get(edge["target"], edge["target"])

        # Prevent self-loops caused by entities merging into themselves
        if mapped_source == mapped_target:
            continue

        # 2. Extract the Relationship Type
        description = str(edge.get("description", ""))
        match = type_pattern.search(description)
        edge_type = (
            match.group(1) if match else "RELATED"
        )  # Fallback if no type is found

        # 3. Create the Composite Key
        edge_key = (mapped_source, mapped_target, edge_type)

        # 4. Merge Logic (Only merges if the exact [TYPE] matches)
        if edge_key in folded_edges:
            existing_edge = folded_edges[edge_key]

            # Sum weights and degrees
            existing_edge["weight"] = existing_edge.get("weight", 1.0) + edge.get(
                "weight", 1.0
            )
            existing_edge["combined_degree"] = existing_edge.get(
                "combined_degree", 1
            ) + edge.get("combined_degree", 1)

            # Concatenate descriptions safely
            old_desc = str(existing_edge.get("description", ""))
            new_desc = description
            if new_desc not in old_desc:
                existing_edge["description"] = f"{old_desc}\n{new_desc}"

            # Merge text_unit_ids (provenance mapping)
            curr_units = existing_edge.get("text_unit_ids", [])
            new_units = edge.get("text_unit_ids", [])
            existing_edge["text_unit_ids"] = list(set(curr_units + new_units))

        else:
            # Insert as a new distinct edge
            edge["source"] = mapped_source
            edge["target"] = mapped_target
            # You can optionally store the extracted type in a new dictionary key
            # if you want it explicitly available later when pushing to Neo4j
            edge["extracted_type"] = edge_type
            folded_edges[edge_key] = edge

    return list(folded_edges.values())


def clean_entities_and_relationships(folder_path: str, logger: Logger):
    """Main Orchestrator for Stage 2 (Sequential Pipeline)."""

    # 1. Load Data
    entity_path = os.path.join(folder_path, "output", f"{ENTITY_TABLE}.parquet")
    rel_path = os.path.join(folder_path, "output", f"{RELATIONSHIP_TABLE}.parquet")

    entities_df = pd.read_parquet(entity_path)
    relationships_df = pd.read_parquet(rel_path)

    # 2. Process Entities Sequentially (Check-Before-Insert simulation)
    processed_entities, id_translation_map = process_entities_sequentially(
        entities_df, threshold=0.9, logger=logger
    )

    # 3. Process Relationships Sequentially
    final_relationships_list = process_relationships_sequentially(
        relationships_df, id_translation_map
    )

    embeddings_dict = {}

    for entity_title, entity_data in processed_entities.items():
        embeddings_dict[entity_title] = entity_data.pop("embedding", None)

    # Now it is safe to convert to DataFrame
    clean_entities_df = pd.DataFrame(processed_entities.values())
    clean_rels_df = pd.DataFrame(final_relationships_list)

    # 5. Save and Overwrite
    clean_entities_df.to_parquet(entity_path, index=False)
    clean_rels_df.to_parquet(rel_path, index=False)

    # Save the embeddings
    with open(os.path.join(folder_path, "output", "entity_embeddings.pkl"), "wb") as f:
        pickle.dump(embeddings_dict, f)

    logger.info(
        f"Stage 2 Complete. Reduced entities from {len(entities_df)} to {len(clean_entities_df)}."
    )
