"""LangGraph setup for taxonomy generation.

Initialization flow:
    START → context_gatherer
         → seed_selector
         → seed_extraction → seed_validation ↻ (INVALID → seed_extraction)
         → extension_extraction (agent.batch, concurrent)
         → extension_validation ↻ (INVALID → reprocess_failed_extensions)
         → categorize (agent.batch on ALL stories)
         → END

Update flow:
    START → context_gatherer
         → update_setup
         → extension_extraction (agent.batch, concurrent)
         → extension_validation ↻ (INVALID → reprocess_failed_extensions)
         → categorize (agent.batch on ALL stories)
         → END
"""

import json
import random
from typing import Literal
from sqlalchemy.orm import Session

from langgraph.graph import StateGraph, START, END
from langchain_core.messages import HumanMessage
from langgraph.runtime import Runtime

from app.analysis.agents.target import state
from common.schemas import StoryMinimal
from common.database import get_db
from app.analysis.agents.utils import format_stories, get_response_as_schema
from app.analysis.agents.nodes import build_context_gatherer_agent, run_context_gatherer

from ..schemas import (
    NewBucket,
    StoryCategorization,
    TaxonomyDraft,
    TaxonomySeedResponse,
    TaxonomyUpdateResponse,
    TaxonomyCategorizationResponse,
    TaxonomyValidationResponse,
    SeedValidationResponse,
)

from .agents import (
    build_seed_agent,
    build_extension_agent,
    build_categorizer_agent,
    build_validator_agent,
    build_seed_validator_agent,
)
from .prompts import (
    SEED_MESSAGE,
    EXTENSION_MESSAGE,
    CATEGORIZER_MESSAGE,
    VALIDATOR_MESSAGE,
    SEED_VALIDATOR_MESSAGE,
)
from .fake_history import (
    SEED_FEW_SHOT,
    EXTENSION_FEW_SHOT,
    CATEGORIZE_FEW_SHOT,
    VALIDATE_TAXONOMY_FEW_SHOT,
    SEED_VALIDATE_FEW_SHOT,
)
from .state import TaxonomyState, TaxonomyContext

context_agent = build_context_gatherer_agent()
seed_agent = build_seed_agent()
extension_agent = build_extension_agent()
categorization_agent = build_categorizer_agent()
validator_agent = build_validator_agent()
seed_validator_agent = build_seed_validator_agent()

MAX_SEED_ITERATIONS = 3
MAX_EXTENSION_ITERATIONS = 6


# ─── Helpers ──────────────────────────────────────────────────────────────────


def _format_taxonomy_new_bucket(taxonomy: list[NewBucket]) -> str:
    if not taxonomy:
        return "No taxonomy exists yet."
    return "\n".join(f"- **{b.name}**: {b.description}" for b in taxonomy)


def _format_taxonomy_draft(draft: TaxonomyDraft) -> str:
    parts = []
    if draft.new_buckets:
        parts.append(
            "### New Buckets\n"
            + "\n".join(f"- **{b.name}**: {b.description}" for b in draft.new_buckets)
        )
    if draft.bucket_updates:
        parts.append(
            "### Bucket Updates\n"
            + "\n".join(
                f"- **{u.name}**: {u.reason} (update to: {u.updated_description})"
                for u in draft.bucket_updates
            )
        )
    return "\n\n".join(parts) if parts else "No changes proposed."


def _merge_draft_into_taxonomy(current: list[NewBucket], drafts: list[TaxonomyDraft]):
    """Apply multiple drafts sequentially to current taxonomy."""
    tax = {b.name: b.description for b in current}
    for draft in drafts:
        for nb in draft.new_buckets:
            tax[nb.name] = nb.description

        for bu in draft.bucket_updates:
            if bu.name in tax:
                # Append the updated_description to existing one with a tag [UPDATED]
                tax[bu.name] = f"{tax[bu.name]}\n[UPDATED] {bu.updated_description}"

    return [NewBucket(name=k, description=v) for k, v in tax.items()]


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

    msg = SEED_MESSAGE.format(
        project_context=state.get("project_context", "N/A") or "N/A",
        stories=stories_text,
        errors=error_text,
    )
    messages = SEED_FEW_SHOT + [HumanMessage(content=msg)]
    response = seed_agent.invoke(messages)

    output: TaxonomySeedResponse = get_response_as_schema(
        response, TaxonomySeedResponse
    )
    if not output:
        print("| Seed extraction: parse failed, returning with error")
        return {
            "errors": [
                "Failed to parse TaxonomySeedResponse from previous JSON response."
            ],
        }

    return {"seed_results": output.new_buckets, "errors": []}


def seed_validation_node(state: TaxonomyState):
    """LLM-based validation of seed taxonomy using dedicated seed validator."""
    print(f"| Taxonomy Graph -> [seed_validation] (iter={state.get('iterations', 0)})")

    seed_results: list[NewBucket] = state.get("seed_results", [])

    if not seed_results:
        print("| Seed validation: no seed results to validate")
        return {
            "errors": ["No seed taxonomy generated."] + state.get("errors", []),
            "iterations": state.get("iterations", 0) + 1,
        }

    # Format proposed taxonomy as a readable list for the reviewer
    proposed_text = _format_taxonomy_new_bucket(seed_results)
    stories_text = format_stories(state["seed_stories"])

    msg = SEED_VALIDATOR_MESSAGE.format(
        proposed_taxonomy=proposed_text,
        stories=stories_text,
    )
    messages = SEED_VALIDATE_FEW_SHOT + [HumanMessage(content=msg)]
    response = seed_validator_agent.invoke(messages)

    output: SeedValidationResponse = get_response_as_schema(
        response, SeedValidationResponse
    )
    if not output:
        print("| Seed validation: parse failed, treating as VALID")
        return {"final_taxonomy": seed_results, "errors": []}

    if output.status == "VALID":
        print(f"| Seed validation: VALID - {output.reasoning}")
        return {
            "final_taxonomy": seed_results,
            "errors": [],
            "iterations": 0,  # Reset iterations on success
        }

    if output.status == "ADJUSTED":
        print(f"| Seed validation: ADJUSTED - {output.reasoning}")
        return {
            "final_taxonomy": output.adjusted_new_buckets or seed_results,
            "errors": [],
            "iterations": 0,  # Reset iterations on success
        }

    # INVALID
    print(f"| Seed validation: INVALID - {output.reasoning}")
    return {
        "errors": [f"Validator rejected seed taxonomy: {output.reasoning}"],
        "iterations": state.get("iterations", 0) + 1,
    }


def route_after_seed_validation(
    state: TaxonomyState,
) -> Literal["seed_extraction", "extension_extraction"]:
    if state.get("errors") and state.get("iterations", 0) < MAX_SEED_ITERATIONS:
        return "seed_extraction"
    return "extension_extraction"


def extension_extraction_node(state: TaxonomyState):
    """Process all extension batches concurrently via agent.batch."""
    batches: list[list[StoryMinimal]] = state.get("extension_batches", [])
    failed_indices: list[int] = state.get("failed_extension_indices", [])

    if not batches:
        print(
            "| Taxonomy Graph -> [extension_extraction] no extension batches to process"
        )
        return {
            "extension_results": [],
            "failed_extension_indices": [],
        }

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

    taxonomy_text = _format_taxonomy_new_bucket(state.get("final_taxonomy", []))
    project_context = state.get("project_context", "N/A") or "N/A"
    extension_errors = state.get("extension_errors", {})
    # Build messages for each batch
    msg_lists = []
    for idx in indices_to_process:
        batch = batches[idx]
        stories_text = format_stories(batch)

        err = extension_errors.get(idx, "")
        error_text = f"## Validation Errors to Fix: {err}" if err else ""

        msg = EXTENSION_MESSAGE.format(
            project_context=project_context,
            existing_taxonomy=taxonomy_text,
            stories=stories_text,
            errors=error_text,
        )
        msg_lists.append(EXTENSION_FEW_SHOT + [HumanMessage(content=msg)])

    # Run all concurrently
    responses = extension_agent.batch(msg_lists)

    # Build results list: reuse existing on reprocess, create fresh on first run
    existing_results: list[TaxonomyDraft] = list(state.get("extension_results", []))
    if not existing_results:
        existing_results = [TaxonomyDraft()] * len(batches)

    for i, idx in enumerate(indices_to_process):
        output: TaxonomyUpdateResponse = get_response_as_schema(
            responses[i], TaxonomyUpdateResponse
        )
        if output:
            existing_results[idx] = TaxonomyDraft(
                new_buckets=output.new_buckets,
                bucket_updates=output.bucket_updates,
            )

    print(
        f"| Extension extraction complete: {len(indices_to_process)} batches processed"
    )
    return {
        "extension_results": existing_results,
        "errors": [],
        "failed_extension_indices": indices_to_process,  # keep the same failed indices for now, will update in validation node
    }


def extension_validation_node(state: TaxonomyState):
    """LLM-based validation of all extension batch results."""
    results: list[TaxonomyDraft] = state.get("extension_results", [])

    if not results:
        print("| Taxonomy Graph -> [extension_validation] no results to validate")
        return {"errors": []}

    print(
        f"| Taxonomy Graph -> [extension_validation] validating {len(results)} batches"
    )

    batches: list[list[StoryMinimal]] = state.get("extension_batches", [])
    taxonomy_text = _format_taxonomy_new_bucket(state.get("final_taxonomy", []))
    # Only check failed batches if we have any, otherwise check all
    indices_to_check = state.get("failed_extension_indices", [])
    if not indices_to_check:
        indices_to_check = list(range(len(batches)))
    project_context = state.get("project_context", "N/A") or "N/A"
    msg_lists = []

    for idx in indices_to_check:
        batch = batches[idx]
        draft = results[idx]
        draft_text = _format_taxonomy_draft(draft)
        stories_text = format_stories(batch)

        msg = VALIDATOR_MESSAGE.format(
            project_context=project_context,
            existing_taxonomy=taxonomy_text,
            proposed_updates=draft_text,
            stories=stories_text,
        )
        msg_lists.append(VALIDATE_TAXONOMY_FEW_SHOT + [HumanMessage(content=msg)])

    responses = validator_agent.batch(msg_lists)
    failed_indices = []
    errors = {}
    for i, idx in enumerate(indices_to_check):
        output: TaxonomyValidationResponse = get_response_as_schema(
            responses[i], TaxonomyValidationResponse
        )
        if not output:
            print(
                f"| Extension validation batch {idx}: parse failed, treating as VALID"
            )
            continue

        if output.status == "VALID":
            print(f"| Extension validation batch {idx}: VALID - {output.reasoning}")
        elif output.status == "ADJUSTED":
            print(f"| Extension validation batch {idx}: ADJUSTED - {output.reasoning}")
            adjusted_draft = TaxonomyDraft(
                new_buckets=output.adjusted_new_buckets or results[idx].new_buckets,
                bucket_updates=output.adjusted_bucket_updates
                or results[idx].bucket_updates,
            )
            results[idx] = adjusted_draft
        else:
            print(f"| Extension validation batch {idx}: INVALID - {output.reasoning}")
            errors[idx] = output.reasoning
            failed_indices.append(idx)
    return {
        "extension_results": results,
        "extension_errors": errors,
        "failed_extension_indices": failed_indices,
        "errors": [],
        "iterations": state.get("iterations", 0) + 1,
    }


def route_after_extension_validation(
    state: TaxonomyState,
) -> Literal["extension_extraction", "join_buckets"]:
    if (
        state.get("failed_extension_indices")
        and state.get("iterations", 0) < MAX_EXTENSION_ITERATIONS
    ):
        return "extension_extraction"
    return "join_buckets"


def join_buckets_node(state: TaxonomyState):
    """Helper node to merge extension results to final results after validation."""
    current_taxonomy = state.get("final_taxonomy", [])
    extension_drafts: list[TaxonomyDraft] = state.get("extension_results", [])
    current_taxonomy = _merge_draft_into_taxonomy(current_taxonomy, extension_drafts)
    return {"final_taxonomy": current_taxonomy}


def categorize_node(state: TaxonomyState, runtime: Runtime[TaxonomyContext]):
    """Categorize ALL stories (seed + extension) via agent.batch."""
    all_stories: list[StoryMinimal] = state.get("all_stories", [])

    if not all_stories:
        print("| Taxonomy Graph -> [categorize] no stories to categorize")
        return {"categorizations": []}

    # Batch stories for categorization
    batch_size = runtime.context.extension_batch_size
    story_batches = [
        all_stories[i : i + batch_size] for i in range(0, len(all_stories), batch_size)
    ]

    print(
        f"| Taxonomy Graph -> [categorize] categorizing {len(all_stories)} stories in {len(story_batches)} batches"
    )

    taxonomy_text = _format_taxonomy_new_bucket(state.get("final_taxonomy", []))

    msg_lists = []
    for batch in story_batches:
        stories_text = format_stories(batch)
        msg = CATEGORIZER_MESSAGE.format(
            taxonomy=taxonomy_text,
            stories=stories_text,
            errors="",
        )
        msg_lists.append(CATEGORIZE_FEW_SHOT + [HumanMessage(content=msg)])

    responses = categorization_agent.batch(msg_lists)

    all_categorizations = []
    for response in responses:
        output: TaxonomyCategorizationResponse = get_response_as_schema(
            response, TaxonomyCategorizationResponse
        )
        if output:
            all_categorizations.extend(output.categorizations)

    print(f"| Categorize complete: {len(all_categorizations)} total categorizations")
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
    builder.add_node("update_setup", update_setup_node)
    builder.add_node("extension_extraction", extension_extraction_node)
    builder.add_node("extension_validation", extension_validation_node)
    builder.add_node("join_buckets", join_buckets_node)
    builder.add_node("categorize", categorize_node)

    # START → context_gatherer
    builder.add_edge(START, "context_gatherer")

    # context_gatherer routes based on is_update
    builder.add_conditional_edges("context_gatherer", route_from_context)

    # Init path: seed_selector → seed_extraction → seed_validation ↻ → extension_extraction
    builder.add_edge("seed_selector", "seed_extraction")
    builder.add_edge("seed_extraction", "seed_validation")
    builder.add_conditional_edges("seed_validation", route_after_seed_validation)

    # Update path: update_setup → extension_extraction
    builder.add_edge("update_setup", "extension_extraction")

    builder.add_edge("extension_extraction", "extension_validation")
    builder.add_conditional_edges(
        "extension_validation", route_after_extension_validation
    )
    builder.add_edge("join_buckets", "categorize")
    builder.add_edge("categorize", END)

    return builder.compile()


taxonomy_graph = build_taxonomy_graph()


def run_taxonomy_graph(
    user_stories: list[StoryMinimal],
    current_taxonomy: list[NewBucket],
    project_description: str,
    connection_id: str,
    project_key: str,
    db: Session | None = None,
    is_update: bool = False,
    seed_strategy: Literal["first", "random", "hybrid"] = "hybrid",
    seed_size: int = 50,
    seed_hybrid_first_pct: float = 0.6,
    extension_batch_size: int = 20,
) -> tuple[list[NewBucket], list[StoryCategorization]]:
    """Entry point to run the taxonomy generation LangGraph workflow."""
    if not db:
        db = next(get_db())

    initial_state = TaxonomyState(
        all_stories=[],
        seed_stories=[],
        extension_batches=[],
        current_taxonomy=current_taxonomy,
        seed_results=TaxonomyDraft(),
        final_taxonomy=current_taxonomy if is_update else [],
        extension_results=[],
        failed_extension_indices=[],
        categorizations=[],
        errors=[],
        extension_errors={},
        iterations=0,
        project_context="",
    )

    context = TaxonomyContext(
        db=db,
        connection_id=connection_id,
        project_key=project_key,
        user_stories=user_stories,
        project_description=project_description,
        is_update=is_update,
        seed_strategy=seed_strategy,
        seed_size=seed_size,
        extension_batch_size=extension_batch_size,
        seed_hybrid_first_pct=seed_hybrid_first_pct,
    )

    final_state = taxonomy_graph.invoke(initial_state, context=context)
    return final_state.get("final_taxonomy", []), final_state.get("categorizations", [])
