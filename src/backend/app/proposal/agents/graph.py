from dataclasses import dataclass, field
from typing import Literal, Optional
from langchain_core.messages import HumanMessage, BaseMessage
from langgraph.graph import StateGraph, START, END
from langgraph.runtime import Runtime
from langchain.agents.middleware import dynamic_prompt, ModelRequest
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from llm.dynamic_agent import GenimiDynamicAgent
from .prompts import (
    SPLITTER_SYSTEM_PROMPT,
    REFINER_SYSTEM_PROMPT,
    RESOLVER_SYSTEM_PROMPT,
    SIMPLE_SYSTEM_PROMPT,
    MEDIUM_VALIDATOR_SYSTEM_PROMPT,
)
from .schemas import (
    ProposalOutput,
    Proposal,
)
from app.analysis.agents.schemas import DefectByLlm, BucketGroup, StoryTag
from common.schemas import StoryMinimal
from common.agents.schemas import LlmContext
from common.configs import LlmConfig
from .fake_history import (
    DRAFTER_FAKE_HISTORY,
    SPLITTER_FAKE_HISTORY,
    REFINER_FAKE_HISTORY,
    RESOLVER_FAKE_HISTORY,
)
from app.analysis.agents.utils import (
    get_response_as_schema,
    format_stories,
    format_raw_defects,
)

# ---------------------------------------------------------------------------
# Defect type → drafter track mapping
# ---------------------------------------------------------------------------
_SPLITTER_TYPES = {"NOT_SMALL", "NOT_INDEPENDENT"}
_REFINER_TYPES = {"NOT_ESTIMABLE", "NOT_VALUABLE"}
_RESOLVER_TYPES = {"CONFLICT", "DUPLICATION"}


# ---------------------------------------------------------------------------
# Agent factory
# ---------------------------------------------------------------------------
def _build_agent(
    system_prompt: str,
    response_schema=ProposalOutput,
):
    @dynamic_prompt
    def user_context_prompt(request: ModelRequest) -> str:
        extra_instruction = request.runtime.context.extra_instruction or ""
        try:
            return system_prompt.format(extra_instruction=extra_instruction)
        except Exception:
            return system_prompt

    return GenimiDynamicAgent(
        model_name=LlmConfig.GEMINI_DEFECT_MODEL,
        temperature=LlmConfig.LLM_DEFECT_TEMPERATURE,
        response_mime_type="application/json",
        response_schema=response_schema,
        api_keys=LlmConfig.GEMINI_API_KEYS,
        max_retries=LlmConfig.GEMINI_API_MAX_RETRY,
        middleware=[user_context_prompt],
        top_p=LlmConfig.LLM_DEFECT_TOP_P,
    )


class ValidatorOutput(BaseModel):
    defects: list[DefectByLlm] = Field(description="List of detected defects, if any.")


# Agents (no tools: response_mime_type="application/json" is incompatible with tool calling)
splitter_agent = _build_agent(SPLITTER_SYSTEM_PROMPT)
refiner_agent = _build_agent(REFINER_SYSTEM_PROMPT)
resolver_agent = _build_agent(RESOLVER_SYSTEM_PROMPT)
simple_agent = _build_agent(SIMPLE_SYSTEM_PROMPT)
medium_validator_agent = _build_agent(
    MEDIUM_VALIDATOR_SYSTEM_PROMPT, response_schema=ValidatorOutput
)


# ---------------------------------------------------------------------------
# State & Context
# ---------------------------------------------------------------------------
@dataclass
class State:
    """State for the COMPLEX proposal generation workflow."""

    # Routed defect groups
    splitter_defects: list[DefectByLlm] = field(default_factory=list)
    refiner_defects: list[DefectByLlm] = field(default_factory=list)
    resolver_defects: list[DefectByLlm] = field(default_factory=list)

    # Per-drafter proposals
    splitter_proposals: list[Proposal] = field(default_factory=list)
    refiner_proposals: list[Proposal] = field(default_factory=list)
    resolver_proposals: list[Proposal] = field(default_factory=list)

    # Merged final proposals
    proposals: list[Proposal] = field(default_factory=list)

    # Validation loop
    validation_attempt: int = 0
    max_validation_attempts: int = 3
    validation_feedback: str = ""
    inter_story_context: str = ""
    retry_drafters: list[str] = field(default_factory=list)


class Context(LlmContext):
    """Context shared across all nodes."""

    user_stories: list[StoryMinimal]
    defects: list[DefectByLlm]
    extra_instruction: Optional[str] = None
    clarifications: Optional[str] = None
    initial_messages: Optional[list[BaseMessage]] = None
    project_description: Optional[str] = None


# ---------------------------------------------------------------------------
# Helper: build human message for a specialized drafter
# ---------------------------------------------------------------------------
def _build_drafter_message(
    stories: list[StoryMinimal],
    defects: list[DefectByLlm],
    clarifications: str | None = None,
    inter_story_context: str | None = None,
    validation_feedback: str | None = None,
) -> str:
    msg = (
        "Here is the input data for generating proposals:\n\n"
        "## USER STORIES\n"
        f"{format_stories(stories)}\n\n"
        "## DEFECTS\n"
        f"{format_raw_defects(defects)}"
    )

    if inter_story_context:
        msg += f"\n\n## Inter-Story Context\n{inter_story_context}"

    if clarifications:
        msg += f"\n\nClarifications:\n{clarifications}"

    if validation_feedback:
        msg += (
            f"\n\n## VALIDATION FAILURE - PREVIOUS ATTEMPT INTRODUCED NEW DEFECTS\n"
            f"Your previous proposals were run through defect detection and the following new defects were found. "
            f"You MUST fix these issues in your new proposals:\n{validation_feedback}"
        )

    return msg


# ---------------------------------------------------------------------------
# Helper: get relevant stories for a defect group
# ---------------------------------------------------------------------------
def _get_stories_for_defects(
    defects: list[DefectByLlm], all_stories: list[StoryMinimal]
) -> list[StoryMinimal]:
    keys = set()
    for d in defects:
        keys.update(d.story_keys)
    story_map = {s.key: s for s in all_stories}
    return [story_map[k] for k in sorted(keys) if k in story_map]


# ---------------------------------------------------------------------------
# Node functions
# ---------------------------------------------------------------------------
def defect_router(state: State, runtime: Runtime[Context]) -> State:
    """Categorize defects into the three resolution tracks."""
    print(f"\n{'='*80}\n| Defect Router - Starting\n{'='*80}")
    context = runtime.context

    defects = context.defects
    splitter, refiner, resolver = [], [], []

    for d in defects:
        dtype = d.type.upper()
        if dtype in _SPLITTER_TYPES:
            splitter.append(d)
        elif dtype in _REFINER_TYPES:
            refiner.append(d)
        elif dtype in _RESOLVER_TYPES:
            resolver.append(d)
        else:
            # Unknown defect type → default to refiner (safest: UPDATE only)
            refiner.append(d)

    state.splitter_defects = splitter
    state.refiner_defects = refiner
    state.resolver_defects = resolver

    print(
        f"| Routed: {len(splitter)} splitter, {len(refiner)} refiner, {len(resolver)} resolver"
    )

    print(f"| Defect Router - Complete\n{'='*80}")
    return state


def context_gatherer_node(state: State, runtime: Runtime[Context]) -> State:
    """Gather inter-story context for all input stories via tool-calling agent."""
    context = runtime.context
    if not context.user_stories or state.inter_story_context:
        print("| Context Gatherer - Skipped (no stories or context already gathered)")
        return state

    print(f"\n{'='*80}\n| Context Gatherer - Starting\n{'='*80}")
    from app.analysis.agents.nodes import (
        build_context_gatherer_agent,
        run_context_gatherer,
    )

    ctx_agent = build_context_gatherer_agent()
    state.inter_story_context = run_context_gatherer(
        agent=ctx_agent,
        context=context,
        target_stories=context.user_stories,
        project_desc=context.project_description,
    )

    print(f"| Context Gatherer - Complete\n{'='*80}")
    return state


def _run_specialized_drafter(
    agent: GenimiDynamicAgent,
    fake_history: list,
    defects: list[DefectByLlm],
    state: State,
    runtime: Runtime[Context],
    drafter_name: str,
) -> list[Proposal]:
    """Shared logic for all three specialized drafters."""
    if not defects:
        print(f"| {drafter_name} - No defects, skipping")
        return []

    context = runtime.context
    stories = _get_stories_for_defects(defects, context.user_stories)

    human_message = _build_drafter_message(
        stories=stories,
        defects=defects,
        clarifications=context.clarifications,
        inter_story_context=state.inter_story_context,
        validation_feedback=(
            state.validation_feedback if state.validation_attempt > 0 else None
        ),
    )

    messages = fake_history + [HumanMessage(content=human_message)]
    if context.initial_messages:
        messages = context.initial_messages + messages

    response = agent.invoke(messages=messages, context=context)
    result: ProposalOutput = get_response_as_schema(response, ProposalOutput)

    if not result:
        print(f"| {drafter_name} - Failed to parse response")
        return []

    print(f"| {drafter_name} - Drafted {len(result.proposals)} proposals")
    return result.proposals


def splitter_drafter(state: State, runtime: Runtime[Context]) -> State:
    """Draft proposals for NOT_SMALL / NOT_INDEPENDENT defects."""
    print(f"\n{'='*80}\n| Splitter Drafter - Starting\n{'='*80}")
    state.splitter_proposals = _run_specialized_drafter(
        agent=splitter_agent,
        fake_history=SPLITTER_FAKE_HISTORY,
        defects=state.splitter_defects,
        state=state,
        runtime=runtime,
        drafter_name="Splitter",
    )
    return state


def refiner_drafter(state: State, runtime: Runtime[Context]) -> State:
    """Draft proposals for NOT_ESTIMABLE / NOT_VALUABLE defects."""
    print(f"\n{'='*80}\n| Refiner Drafter - Starting\n{'='*80}")
    state.refiner_proposals = _run_specialized_drafter(
        agent=refiner_agent,
        fake_history=REFINER_FAKE_HISTORY,
        defects=state.refiner_defects,
        state=state,
        runtime=runtime,
        drafter_name="Refiner",
    )
    return state


def resolver_drafter(state: State, runtime: Runtime[Context]) -> State:
    """Draft proposals for CONFLICT / DUPLICATION defects."""
    print(f"\n{'='*80}\n| Resolver Drafter - Starting\n{'='*80}")
    state.resolver_proposals = _run_specialized_drafter(
        agent=resolver_agent,
        fake_history=RESOLVER_FAKE_HISTORY,
        defects=state.resolver_defects,
        state=state,
        runtime=runtime,
        drafter_name="Resolver",
    )
    return state


def proposal_merger(state: State, runtime: Runtime[Context]) -> State:
    """Merge proposals from all three drafters, de-duplicating by story_key.

    Precedence: resolver > splitter > refiner (inter-story fixes are harder
    to redo, so they win conflicts).
    """
    print(f"\n{'='*80}\n| Proposal Merger - Starting\n{'='*80}")

    # Track which story_keys have been claimed by a proposal
    claimed_keys: set[str] = set()
    merged: list[Proposal] = []

    # Process in precedence order
    for label, proposals in [
        ("resolver", state.resolver_proposals),
        ("splitter", state.splitter_proposals),
        ("refiner", state.refiner_proposals),
    ]:
        for proposal in proposals:
            proposal_keys = {c.story_key for c in proposal.contents if c.story_key}
            # Skip if any key already claimed (de-dup)
            if proposal_keys & claimed_keys:
                print(
                    f"| Merger - Skipping {label} proposal (keys {proposal_keys} already claimed)"
                )
                continue
            merged.append(proposal)
            claimed_keys.update(proposal_keys)

    state.proposals = merged
    print(f"| Proposal Merger - {len(merged)} proposals merged\n{'='*80}")
    return state


def _process_validation_defects(
    state: State,
    new_defects: list[DefectByLlm],
    proposed_stories: list[StoryMinimal],
    drafter_map: dict,
) -> State:
    """Helper to process feedback and select drafters to retry."""
    state.validation_attempt += 1

    if new_defects:
        feedback_lines = []
        retry_drafters_set = set()

        # Build mapping of synthetic key to drafter source
        key_to_drafter: dict[str, str] = {}
        proposed_idx = 1

        for proposal in state.proposals:
            drafter_source = None
            for d_name, p_list in drafter_map.items():
                if proposal in p_list:
                    drafter_source = d_name
                    break

            for content in proposal.contents:
                if content.type == "DELETE":
                    continue
                if content.type == "CREATE":
                    key = f"PROPOSED-{proposed_idx}"
                    proposed_idx += 1
                else:
                    key = content.story_key

                if drafter_source:
                    key_to_drafter[key] = drafter_source

        for d in new_defects:
            feedback_lines.append(
                f"- [{d.type}] Stories: {d.story_keys} | {d.explanation}"
            )
            for key in d.story_keys:
                if key in key_to_drafter:
                    retry_drafters_set.add(key_to_drafter[key])

        state.validation_feedback = "\n".join(feedback_lines)
        # If we couldn't map it, retry all that had proposals
        if not retry_drafters_set:
            for d_name, p_list in drafter_map.items():
                if p_list:
                    retry_drafters_set.add(d_name)

        state.retry_drafters = list(retry_drafters_set)

        print(
            f"| Validation - Found {len(new_defects)} new defects. "
            f"{'Retrying ' + ', '.join(state.retry_drafters) + '...' if state.validation_attempt < state.max_validation_attempts else 'Max attempts reached, returning as-is.'}"
        )
    else:
        state.validation_feedback = ""
        state.retry_drafters = []
        print("| Validation - Clean! No new defects found.")

    return state


def validation_node(state: State, runtime: Runtime[Context]) -> State:
    """Run the FULL defect detection pipeline on generated proposals."""
    print(
        f"\n{'='*80}\n| Complex Validation Node - Attempt {state.validation_attempt + 1}/{state.max_validation_attempts}\n{'='*80}"
    )
    context = runtime.context

    proposed_stories: list[StoryMinimal] = []
    generated_to_original: dict[str, set[str]] = {}

    for proposal in state.proposals:
        for content in proposal.contents:
            if content.type == "DELETE":
                continue

            if content.type == "CREATE":
                key = f"PROPOSED-{len(proposed_stories) + 1}"
            else:
                key = content.story_key

            proposed_stories.append(
                StoryMinimal(
                    key=key,
                    summary=content.summary,
                    description=content.description,
                )
            )

            original_keys = set()
            for c in proposal.contents:
                if c.story_key:
                    original_keys.add(c.story_key)
            generated_to_original[key] = original_keys

    if not proposed_stories:
        print("| No proposed stories to validate. Skipping.")
        state.validation_attempt = state.max_validation_attempts
        return state

    from app.taxonomy.services import TaxonomyService

    taxonomy_service = TaxonomyService(db=context.db)
    story_to_tags_map, tag_to_stories_map = taxonomy_service.get_project_stories_tags(
        connection_id=context.connection_id,
        project_key=context.project_key,
    )

    bucket_groups: list[BucketGroup] = []
    checked_pairs: set[tuple[str, str]] = set()
    proposed_story_map = {s.key: s for s in proposed_stories}

    for proposed_story in proposed_stories:
        original_keys = generated_to_original.get(proposed_story.key, set())
        all_tags: set[str] = set()
        for orig_key in original_keys:
            all_tags.update(story_to_tags_map.get(orig_key, set()))

        related_original_keys: set[str] = set()
        for tag in all_tags:
            related_original_keys.update(tag_to_stories_map.get(tag, set()))

        related_proposed_keys: set[str] = set()
        for proposed_key, orig_keys in generated_to_original.items():
            if proposed_key == proposed_story.key:
                continue
            if orig_keys & related_original_keys:
                related_proposed_keys.add(proposed_key)

        related_stories = []
        for related_key in related_proposed_keys:
            pair = tuple(sorted([proposed_story.key, related_key]))
            if pair in checked_pairs:
                continue
            checked_pairs.add(pair)

            related = proposed_story_map.get(related_key)
            if related:
                related_stories.append(
                    StoryTag(
                        key=related.key,
                        summary=related.summary,
                        description=related.description,
                        tags=list(all_tags),
                    )
                )

        if related_stories:
            bucket_groups.append(
                BucketGroup(
                    target_story=StoryTag(
                        key=proposed_story.key,
                        summary=proposed_story.summary,
                        description=proposed_story.description,
                        tags=list(all_tags),
                    ),
                    related_stories=related_stories,
                )
            )

    from app.analysis.agents.all import run_analysis

    new_defects = run_analysis(
        connection_id=context.connection_id,
        project_key=context.project_key,
        info_provided=True,
        all_stories=proposed_stories,
        bucket_groups=bucket_groups,
        db=context.db,
        project_description=context.project_description,
    )

    drafter_map = {
        "splitter_drafter": state.splitter_proposals,
        "refiner_drafter": state.refiner_proposals,
        "resolver_drafter": state.resolver_proposals,
    }

    return _process_validation_defects(
        state, new_defects, proposed_stories, drafter_map
    )


def medium_validation_node(state: State, runtime: Runtime[Context]) -> State:
    """Run lightweight LLM-based validation on generated proposals."""
    print(
        f"\n{'='*80}\n| Medium Validation Node - Attempt {state.validation_attempt + 1}/{state.max_validation_attempts}\n{'='*80}"
    )
    context = runtime.context

    proposed_stories: list[StoryMinimal] = []

    for proposal in state.proposals:
        for content in proposal.contents:
            if content.type == "DELETE":
                continue

            if content.type == "CREATE":
                key = f"PROPOSED-{len(proposed_stories) + 1}"
            else:
                key = content.story_key

            proposed_stories.append(
                StoryMinimal(
                    key=key,
                    summary=content.summary,
                    description=content.description,
                )
            )

    if not proposed_stories:
        print("| No proposed stories to validate. Skipping.")
        state.validation_attempt = state.max_validation_attempts
        return state

    msg = (
        "Here are the proposed user stories generated in the current iteration:\n\n"
        f"{format_stories(proposed_stories)}"
    )

    response = medium_validator_agent.invoke(
        messages=[HumanMessage(content=msg)], context=context
    )
    result: ValidatorOutput = get_response_as_schema(response, ValidatorOutput)

    new_defects = []
    if result and result.defects:
        new_defects = result.defects

    drafter_map = {
        "splitter_drafter": state.splitter_proposals,
        "refiner_drafter": state.refiner_proposals,
        "resolver_drafter": state.resolver_proposals,
    }

    return _process_validation_defects(
        state, new_defects, proposed_stories, drafter_map
    )


def should_retry_validation(state: State) -> list[str]:
    """Conditional edge after validation_node."""
    if not state.validation_feedback:
        # Clean - no new defects
        return ["end"]
    if state.validation_attempt >= state.max_validation_attempts:
        # Max retries exhausted
        return ["end"]
    # Retry: route back specifically to the drafters that caused the issues
    if not state.retry_drafters:
        return ["end"]
    return state.retry_drafters


# ---------------------------------------------------------------------------
# Graph builders
# ---------------------------------------------------------------------------
def _build_base_workflow() -> StateGraph:
    """Build the base workflow shared by COMPLEX and MEDIUM pipelines."""
    workflow = StateGraph(State, context=Context)

    workflow.add_node("defect_router", defect_router)
    workflow.add_node("context_gatherer", context_gatherer_node)
    workflow.add_node("splitter_drafter", splitter_drafter)
    workflow.add_node("refiner_drafter", refiner_drafter)
    workflow.add_node("resolver_drafter", resolver_drafter)
    workflow.add_node("proposal_merger", proposal_merger)

    workflow.add_edge(START, "defect_router")

    # Context gatherer runs before all drafters to provide global inter-story context
    workflow.add_edge("defect_router", "context_gatherer")

    workflow.add_edge("context_gatherer", "splitter_drafter")
    workflow.add_edge("context_gatherer", "refiner_drafter")
    workflow.add_edge("context_gatherer", "resolver_drafter")

    workflow.add_edge("splitter_drafter", "proposal_merger")
    workflow.add_edge("refiner_drafter", "proposal_merger")
    workflow.add_edge("resolver_drafter", "proposal_merger")

    return workflow


def build_complex_graph() -> StateGraph:
    """Build the COMPLEX mode proposal generation graph."""
    workflow = _build_base_workflow()
    workflow.add_node("validation_node", validation_node)
    workflow.add_edge("proposal_merger", "validation_node")

    workflow.add_conditional_edges(
        "validation_node",
        should_retry_validation,
        {
            "end": END,
            "splitter_drafter": "splitter_drafter",
            "refiner_drafter": "refiner_drafter",
            "resolver_drafter": "resolver_drafter",
        },
    )
    return workflow.compile()


def build_medium_graph() -> StateGraph:
    """Build the MEDIUM mode proposal generation graph."""
    workflow = _build_base_workflow()
    workflow.add_node("validation_node", medium_validation_node)
    workflow.add_edge("proposal_merger", "validation_node")

    workflow.add_conditional_edges(
        "validation_node",
        should_retry_validation,
        {
            "end": END,
            "splitter_drafter": "splitter_drafter",
            "refiner_drafter": "refiner_drafter",
            "resolver_drafter": "resolver_drafter",
        },
    )
    return workflow.compile()


_deep_graph = build_complex_graph()
_complex_graph = build_medium_graph()


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------
def run_proposal_generation(
    mode: Literal["SIMPLE", "COMPLEX", "DEEP"],
    user_stories: list[StoryMinimal],
    defects: list[DefectByLlm],
    db: Session,
    connection_id: str,
    project_key: str,
    max_rewrite_attempts: int = 3,
    extra_instruction: Optional[str] = None,
    initial_messages: Optional[list[BaseMessage]] = None,
    clarifications: Optional[str] = None,
    project_description: Optional[str] = None,
) -> list[Proposal]:
    """
    Generate Jira proposal improvements from existing defects.

    Args:
        mode: "SIMPLE" for one-shot, "COMPLEX" for LLM validation, "DEEP" for full analysis validation.
        user_stories: List of existing user stories
        defects: List of identified defects
        max_rewrite_attempts: Maximum validation loop retries (COMPLEX/DEEP only)

    Returns:
        List of approved proposals
    """

    context = Context(
        user_stories=user_stories,
        defects=defects,
        extra_instruction=extra_instruction,
        connection_id=connection_id,
        project_key=project_key,
        db=db,
        initial_messages=initial_messages,
        clarifications=clarifications,
        project_description=project_description,
    )

    if mode in ("COMPLEX", "DEEP"):
        initial_state = State(max_validation_attempts=max_rewrite_attempts)
        graph_to_run = _deep_graph if mode == "DEEP" else _complex_graph
        final_state = graph_to_run.invoke(initial_state, context=context)

        if isinstance(final_state, dict):
            return final_state.get("proposals", [])
        elif hasattr(final_state, "proposals"):
            return final_state.proposals
        else:
            return []
    else:
        # Simple mode: one-shot generation without analysis/rewriting loop
        msg = (
            "Here is the input data for generating proposals:\n\n"
            "## USER STORIES\n"
            f"{format_stories(user_stories)}\n\n"
            "## DEFECTS\n"
            f"{format_raw_defects(defects)}"
        )
        if clarifications:
            msg += f"\n\nClarifications:\n{clarifications}"

        messages = DRAFTER_FAKE_HISTORY + [HumanMessage(content=msg)]

        if initial_messages:
            messages = initial_messages + messages

        response = simple_agent.invoke(messages=messages, context=context)
        result: ProposalOutput = get_response_as_schema(response, ProposalOutput)
        if not result:
            print("Failed to parse response into ProposalOutput schema.")
            print(f"Here is the raw response for debugging:\n{response}")
            return []

        return result.proposals
