"""LangGraph setup for taxonomy generation.

Initialization flow:
    START → context_gatherer
         → seed_selector
         → seed_extraction → seed_validation ↻ (INVALID → seed_extraction)
         → seed_categorize
         → extension_extraction (agent.batch, concurrent)
         → extension_validation ↻ (INVALID → reprocess_failed_extensions)
         → extension_categorize (agent.batch, concurrent)
         → END

Update flow:
    START → context_gatherer
         → extension_extraction (agent.batch, concurrent)
         → extension_validation ↻ (INVALID → reprocess_failed_extensions)
         → extension_categorize (agent.batch, concurrent)
         → END
"""

import json
import random
from typing import Literal

from langgraph.graph import StateGraph, START, END
from langchain_core.messages import HumanMessage
from langgraph.runtime import Runtime

from common.schemas import StoryMinimal
from app.analysis.agents.utils import format_stories, get_response_as_schema
from app.analysis.agents.nodes import build_context_gatherer_agent, run_context_gatherer

from ..schemas import (
    TaxonomyUpdateResponse,
    TaxonomyCategorizationResponse,
    TaxonomyValidationResponse,
)
from .agents import (
    build_seed_agent,
    build_extension_agent,
    build_categorizer_agent,
    build_validator_agent,
)
from .prompts import (
    UPDATE_TAXONOMY_SEED_MESSAGE,
    UPDATE_TAXONOMY_EXTENSION_MESSAGE,
    CATEGORIZE_STORIES_MESSAGE,
    VALIDATE_TAXONOMY_MESSAGE,
)
from .fake_history import (
    UPDATE_TAXONOMY_SEED_FEW_SHOT,
    UPDATE_TAXONOMY_EXTENSION_FEW_SHOT,
    CATEGORIZE_FEW_SHOT,
    VALIDATE_TAXONOMY_FEW_SHOT,
)
from .state import TaxonomyState, TaxonomyContext

# ─── Instantiate agents ──────────────────────────────────────────────────────
context_agent = build_context_gatherer_agent()
seed_agent = build_seed_agent()
extension_agent = build_extension_agent()
categorization_agent = build_categorizer_agent()
validator_agent = build_validator_agent()

MAX_SEED_ITERATIONS = 3
MAX_EXTENSION_ITERATIONS = 6  # total across all reprocess loops


# ─── Helpers ──────────────────────────────────────────────────────────────────


def _format_taxonomy_text(taxonomy: list[dict]) -> str:
    if not taxonomy:
        return "No taxonomy exists yet."
    return "\n".join(f"- **{b['name']}**: {b['description']}" for b in taxonomy)


def _merge_draft_into_taxonomy(current: list[dict], draft: dict) -> list[dict]:
    """Apply draft new_buckets and bucket_updates to current taxonomy, return new list."""
    tax = {b["name"]: b["description"] for b in current}
    for bu in draft.get("bucket_updates", []):
        if bu["name"] in tax:
            tax[bu["name"]] = bu["updated_description"]
    for nb in draft.get("new_buckets", []):
        tax[nb["name"]] = nb["description"]
    return [{"name": k, "description": v} for k, v in tax.items()]


# ─── Nodes ────────────────────────────────────────────────────────────────────


def context_gatherer_node(state: TaxonomyState, runtime: Runtime[TaxonomyContext]):
    """Gather project context."""
    print("\n| Taxonomy Graph -> [context_gatherer]")
    context_text = run_context_gatherer(
        context_agent,
        runtime.context,
        project_desc=runtime.context.project_description,
    )
    return {"project_context": context_text}


def seed_selector_node(state: TaxonomyState, runtime: Runtime[TaxonomyContext]):
    """Select seed stories using the configured strategy and chunk extensions."""
    ctx = runtime.context
    stories = ctx.user_stories
    strategy = ctx.seed_strategy
    k = min(ctx.seed_size, len(stories))
    batch_size = ctx.extension_batch_size

    print(f"| Taxonomy Graph -> [seed_selector] strategy={strategy}, k={k}")

    if strategy == "first":
        seed = stories[:k]
    elif strategy == "random":
        seed = random.sample(stories, k)
    else:  # hybrid
        first_count = int(ctx.seed_hybrid_first_pct * k)
        random_count = k - first_count
        first_part = stories[:first_count]
        remaining = stories[first_count:]
        random_part = random.sample(remaining, min(random_count, len(remaining)))
        seed = first_part + random_part

    seed_keys = {s.key for s in seed}
    remaining_stories = [s for s in stories if s.key not in seed_keys]

    extension_batches = [
        remaining_stories[i : i + batch_size]
        for i in range(0, len(remaining_stories), batch_size)
    ]

    print(f"| Seed: {len(seed)} stories, Extensions: {len(extension_batches)} batches")
    return {
        "seed_stories": seed,
        "extension_batches": extension_batches,
        "all_stories": stories,
    }


def seed_extraction_node(state: TaxonomyState):
    """Pass 1 seed: generate initial taxonomy from seed stories."""
    print(f"| Taxonomy Graph -> [seed_extraction] (iter={state.get('iterations', 0)})")

    stories_text = format_stories(state["seed_stories"])
    errors = state.get("errors", [])
    error_text = (
        f"## Validation Errors to Fix\n{chr(10).join(errors)}\n" if errors else ""
    )

    msg = UPDATE_TAXONOMY_SEED_MESSAGE.format(
        project_context=state.get("project_context", "N/A") or "N/A",
        stories=stories_text,
        errors=error_text,
    )
    messages = UPDATE_TAXONOMY_SEED_FEW_SHOT + [HumanMessage(content=msg)]
    response = seed_agent.invoke(messages)

    output: TaxonomyUpdateResponse = get_response_as_schema(
        response, TaxonomyUpdateResponse
    )
    if not output:
        return {
            "errors": ["Failed to parse TaxonomyUpdateResponse from seed agent."],
            "iterations": state.get("iterations", 0) + 1,
        }

    draft = {
        "new_buckets": [b.model_dump() for b in output.new_buckets],
        "bucket_updates": [b.model_dump() for b in output.bucket_updates],
    }
    return {"draft_taxonomy_updates": draft, "errors": []}


def seed_validation_node(state: TaxonomyState):
    """LLM-based validation of seed taxonomy."""
    print(f"| Taxonomy Graph -> [seed_validation] (iter={state.get('iterations', 0)})")

    draft = state.get("draft_taxonomy_updates", {})
    current = state.get("current_taxonomy", [])
    taxonomy_text = _format_taxonomy_text(current)

    proposed_text = f"### Batch 0\n```json\n{json.dumps(draft, indent=2)}\n```"
    stories_text = format_stories(state["seed_stories"])

    msg = VALIDATE_TAXONOMY_MESSAGE.format(
        existing_taxonomy=taxonomy_text,
        proposed_updates=proposed_text,
        stories=stories_text,
    )
    messages = VALIDATE_TAXONOMY_FEW_SHOT + [HumanMessage(content=msg)]
    response = validator_agent.invoke(messages)

    output: TaxonomyValidationResponse = get_response_as_schema(
        response, TaxonomyValidationResponse
    )
    if not output or not output.decisions:
        # If parsing fails, treat as valid and continue
        print("| Seed validation: parse failed, treating as VALID")
        final = _merge_draft_into_taxonomy(current, draft)
        return {"final_taxonomy": final, "errors": []}

    decision = output.decisions[0]

    if decision.status == "VALID":
        print(f"| Seed validation: VALID — {decision.reasoning}")
        final = _merge_draft_into_taxonomy(current, draft)
        return {"final_taxonomy": final, "errors": []}

    if decision.status == "ADJUSTED":
        print(f"| Seed validation: ADJUSTED — {decision.reasoning}")
        adjusted_draft = {
            "new_buckets": [b.model_dump() for b in decision.adjusted_new_buckets],
            "bucket_updates": [
                b.model_dump() for b in decision.adjusted_bucket_updates
            ],
        }
        final = _merge_draft_into_taxonomy(current, adjusted_draft)
        return {
            "draft_taxonomy_updates": adjusted_draft,
            "final_taxonomy": final,
            "errors": [],
        }

    # INVALID
    print(f"| Seed validation: INVALID — {decision.reasoning}")
    return {
        "errors": [f"Validator rejected seed taxonomy: {decision.reasoning}"],
        "iterations": state.get("iterations", 0) + 1,
    }


def route_after_seed_validation(
    state: TaxonomyState,
) -> Literal["seed_extraction", "seed_categorize"]:
    if state.get("errors") and state.get("iterations", 0) < MAX_SEED_ITERATIONS:
        return "seed_extraction"
    return "seed_categorize"


def seed_categorize_node(state: TaxonomyState):
    """Pass 2 seed: categorize seed stories using validated taxonomy."""
    print("| Taxonomy Graph -> [seed_categorize]")

    stories_text = format_stories(state["seed_stories"])
    taxonomy_text = _format_taxonomy_text(state["final_taxonomy"])

    msg = CATEGORIZE_STORIES_MESSAGE.format(
        taxonomy=taxonomy_text,
        stories=stories_text,
        errors="",
    )
    messages = CATEGORIZE_FEW_SHOT + [HumanMessage(content=msg)]
    response = categorization_agent.invoke(messages)

    output: TaxonomyCategorizationResponse = get_response_as_schema(
        response, TaxonomyCategorizationResponse
    )
    if not output:
        print("| Seed categorize: parse failed, returning empty categorizations")
        return {"categorizations": []}

    return {"categorizations": [c.model_dump() for c in output.categorizations]}


def extension_extraction_node(state: TaxonomyState):
    """Process all extension batches concurrently via agent.batch."""
    batches = state.get("extension_batches", [])
    failed_indices = state.get("failed_extension_indices")

    # If we have failed indices, only reprocess those
    if failed_indices:
        indices_to_process = failed_indices
        print(
            f"| Taxonomy Graph -> [extension_extraction] reprocessing {len(indices_to_process)} failed batches"
        )
    else:
        indices_to_process = list(range(len(batches)))
        print(
            f"| Taxonomy Graph -> [extension_extraction] processing {len(indices_to_process)} batches"
        )

    if not indices_to_process:
        return {
            "extension_results": state.get("extension_results", []),
            "failed_extension_indices": [],
        }

    taxonomy_text = _format_taxonomy_text(state["final_taxonomy"])
    project_context = state.get("project_context", "N/A") or "N/A"

    # Build messages for each batch
    msg_lists = []
    for idx in indices_to_process:
        batch = batches[idx]
        stories_text = format_stories(batch)

        # Include per-batch errors if reprocessing
        errors = state.get("errors", [])
        error_text = (
            f"## Validation Errors to Fix\n{chr(10).join(errors)}\n" if errors else ""
        )

        msg = UPDATE_TAXONOMY_EXTENSION_MESSAGE.format(
            project_context=project_context,
            existing_taxonomy=taxonomy_text,
            stories=stories_text,
            errors=error_text,
        )
        msg_lists.append(
            UPDATE_TAXONOMY_EXTENSION_FEW_SHOT + [HumanMessage(content=msg)]
        )

    # Run all concurrently
    responses = extension_agent.batch(msg_lists)

    # Merge results into extension_results
    existing_results = list(state.get("extension_results", []))
    # Pad if needed
    while len(existing_results) < len(batches):
        existing_results.append(None)

    for i, idx in enumerate(indices_to_process):
        output: TaxonomyUpdateResponse = get_response_as_schema(
            responses[i], TaxonomyUpdateResponse
        )
        if output:
            existing_results[idx] = {
                "new_buckets": [b.model_dump() for b in output.new_buckets],
                "bucket_updates": [b.model_dump() for b in output.bucket_updates],
            }
        else:
            # Mark as empty on parse failure
            existing_results[idx] = {"new_buckets": [], "bucket_updates": []}

    print(
        f"| Extension extraction complete: {len(indices_to_process)} batches processed"
    )
    return {
        "extension_results": existing_results,
        "errors": [],
        "failed_extension_indices": [],
    }


def extension_validation_node(state: TaxonomyState):
    """LLM-based validation of all extension batch results."""
    results = state.get("extension_results", [])
    batches = state.get("extension_batches", [])

    if not results:
        print("| Taxonomy Graph -> [extension_validation] no results to validate")
        return {"errors": []}

    print(
        f"| Taxonomy Graph -> [extension_validation] validating {len(results)} batches"
    )

    taxonomy_text = _format_taxonomy_text(state["final_taxonomy"])

    # Format all batch proposals
    proposed_parts = []
    all_stories_text_parts = []
    for i, result in enumerate(results):
        if result is None:
            continue
        proposed_parts.append(
            f"### Batch {i}\n```json\n{json.dumps(result, indent=2)}\n```"
        )
        if i < len(batches):
            all_stories_text_parts.append(
                f"### Batch {i} stories\n{format_stories(batches[i])}"
            )

    proposed_text = "\n\n".join(proposed_parts)
    stories_text = "\n\n".join(all_stories_text_parts)

    msg = VALIDATE_TAXONOMY_MESSAGE.format(
        existing_taxonomy=taxonomy_text,
        proposed_updates=proposed_text,
        stories=stories_text,
    )
    messages = VALIDATE_TAXONOMY_FEW_SHOT + [HumanMessage(content=msg)]
    response = validator_agent.invoke(messages)

    output: TaxonomyValidationResponse = get_response_as_schema(
        response, TaxonomyValidationResponse
    )
    if not output:
        print("| Extension validation: parse failed, treating all as VALID")
        # Apply all results to taxonomy
        final = list(state["final_taxonomy"])
        for result in results:
            if result:
                final = _merge_draft_into_taxonomy(final, result)
        return {"final_taxonomy": final, "errors": [], "failed_extension_indices": []}

    # Process decisions
    failed_indices = []
    updated_results = list(results)
    final = list(state["final_taxonomy"])

    for decision in output.decisions:
        idx = decision.batch_index
        if idx < 0 or idx >= len(updated_results):
            continue

        if decision.status == "VALID":
            print(f"| Batch {idx}: VALID — {decision.reasoning}")
            final = _merge_draft_into_taxonomy(final, updated_results[idx])

        elif decision.status == "ADJUSTED":
            print(f"| Batch {idx}: ADJUSTED — {decision.reasoning}")
            adjusted = {
                "new_buckets": [b.model_dump() for b in decision.adjusted_new_buckets],
                "bucket_updates": [
                    b.model_dump() for b in decision.adjusted_bucket_updates
                ],
            }
            updated_results[idx] = adjusted
            final = _merge_draft_into_taxonomy(final, adjusted)

        else:  # INVALID
            print(f"| Batch {idx}: INVALID — {decision.reasoning}")
            failed_indices.append(idx)

    errors = []
    if failed_indices:
        errors = [f"Batches {failed_indices} were rejected and need re-extraction."]

    return {
        "final_taxonomy": final,
        "extension_results": updated_results,
        "failed_extension_indices": failed_indices,
        "errors": errors,
        "iterations": state.get("iterations", 0) + 1,
    }


def route_after_extension_validation(
    state: TaxonomyState,
) -> Literal["extension_extraction", "extension_categorize"]:
    if (
        state.get("failed_extension_indices")
        and state.get("iterations", 0) < MAX_EXTENSION_ITERATIONS
    ):
        return "extension_extraction"
    return "extension_categorize"


def extension_categorize_node(state: TaxonomyState):
    """Categorize all extension stories concurrently via agent.batch."""
    batches = state.get("extension_batches", [])

    if not batches:
        print("| Taxonomy Graph -> [extension_categorize] no extension batches")
        return {}

    print(
        f"| Taxonomy Graph -> [extension_categorize] categorizing {len(batches)} batches"
    )

    taxonomy_text = _format_taxonomy_text(state["final_taxonomy"])

    msg_lists = []
    for batch in batches:
        stories_text = format_stories(batch)
        msg = CATEGORIZE_STORIES_MESSAGE.format(
            taxonomy=taxonomy_text,
            stories=stories_text,
            errors="",
        )
        msg_lists.append(CATEGORIZE_FEW_SHOT + [HumanMessage(content=msg)])

    responses = categorization_agent.batch(msg_lists)

    all_categorizations = list(state.get("categorizations", []))
    for response in responses:
        output: TaxonomyCategorizationResponse = get_response_as_schema(
            response, TaxonomyCategorizationResponse
        )
        if output:
            all_categorizations.extend([c.model_dump() for c in output.categorizations])

    print(
        f"| Extension categorize complete: {len(all_categorizations)} total categorizations"
    )
    return {"categorizations": all_categorizations}


# ─── Route from START ─────────────────────────────────────────────────────────


def route_from_context(
    state: TaxonomyState, runtime: Runtime[TaxonomyContext]
) -> Literal["seed_selector", "update_setup"]:
    """Skip seeding nodes for update mode."""
    if runtime.context.is_update:
        return "update_setup"
    return "seed_selector"


# ─── Setup node for update mode ──────────────────────────────────────────────


def update_setup_node(state: TaxonomyState, runtime: Runtime[TaxonomyContext]):
    """For update mode: chunk stories into extension batches."""
    ctx = runtime.context
    batch_size = ctx.extension_batch_size
    stories = ctx.user_stories

    extension_batches = [
        stories[i : i + batch_size] for i in range(0, len(stories), batch_size)
    ]

    return {
        "all_stories": stories,
        "seed_stories": [],
        "extension_batches": extension_batches,
    }


# ═════════════════════════════════════════════════════════════════════════════
# Graph Compilation
# ═════════════════════════════════════════════════════════════════════════════


def build_taxonomy_graph():
    """Build and compile the taxonomy generation LangGraph workflow."""
    builder = StateGraph(TaxonomyState)

    # Add nodes
    builder.add_node("context_gatherer", context_gatherer_node)
    builder.add_node("seed_selector", seed_selector_node)
    builder.add_node("seed_extraction", seed_extraction_node)
    builder.add_node("seed_validation", seed_validation_node)
    builder.add_node("seed_categorize", seed_categorize_node)
    builder.add_node("update_setup", update_setup_node)
    builder.add_node("extension_extraction", extension_extraction_node)
    builder.add_node("extension_validation", extension_validation_node)
    builder.add_node("extension_categorize", extension_categorize_node)

    # START → context_gatherer
    builder.add_edge(START, "context_gatherer")

    # context_gatherer routes based on is_update
    builder.add_conditional_edges("context_gatherer", route_from_context)

    # Init path: seed_selector → seed_extraction → seed_validation ↻ → seed_categorize
    builder.add_edge("seed_selector", "seed_extraction")
    builder.add_edge("seed_extraction", "seed_validation")
    builder.add_conditional_edges("seed_validation", route_after_seed_validation)
    builder.add_edge("seed_categorize", "extension_extraction")

    # Update path: update_setup → extension_extraction
    builder.add_edge("update_setup", "extension_extraction")

    # Extension path (shared): extraction → validation ↻ → categorize → END
    builder.add_edge("extension_extraction", "extension_validation")
    builder.add_conditional_edges(
        "extension_validation", route_after_extension_validation
    )
    builder.add_edge("extension_categorize", END)

    return builder.compile()


taxonomy_graph = build_taxonomy_graph()


def run_taxonomy_graph(
    user_stories: list[StoryMinimal],
    current_taxonomy: list[dict],
    project_description: str,
    connection_id: str,
    project_key: str,
    is_update: bool = False,
    seed_strategy: Literal["first", "random", "hybrid"] = "hybrid",
    seed_size: int = 50,
    extension_batch_size: int = 20,
) -> dict:
    """Entry point to run the taxonomy generation LangGraph workflow."""

    initial_state = TaxonomyState(
        all_stories=[],
        seed_stories=[],
        extension_batches=[],
        current_taxonomy=current_taxonomy,
        draft_taxonomy_updates={},
        final_taxonomy=current_taxonomy if is_update else [],
        extension_results=[],
        failed_extension_indices=[],
        categorizations=[],
        errors=[],
        iterations=0,
        project_context="",
    )

    context = TaxonomyContext(
        connection_id=connection_id,
        project_key=project_key,
        user_stories=user_stories,
        project_description=project_description,
        is_update=is_update,
        seed_strategy=seed_strategy,
        seed_size=seed_size,
        extension_batch_size=extension_batch_size,
    )

    final_state = taxonomy_graph.invoke(initial_state, context=context)
    return final_state
