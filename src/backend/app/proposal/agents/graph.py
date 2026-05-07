from typing import Literal, Optional
from langchain_core.messages import HumanMessage
from langgraph.graph import StateGraph, START, END
from langgraph.runtime import Runtime
from langchain.agents.middleware import dynamic_prompt, ModelRequest
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from app.proposal.schemas import DefectForProposal
from llm.dynamic_agent import GenimiDynamicAgent
from .prompts import (
    SPLITTER_SYSTEM_PROMPT,
    REFINER_SYSTEM_PROMPT,
    RESOLVER_SYSTEM_PROMPT,
    SIMPLE_SYSTEM_PROMPT,
    VALIDATOR_SYSTEM_PROMPT,
)
from .schemas import ProposalOutput, Proposal, ProposalContent, ValidatorOutput
from app.analysis.agents.schemas import BucketGroup, StoryTag, DefectByLlm
from common.schemas import StoryMinimal
from common.configs import LlmConfig

from .fake_history import (
    SPLITTER_FAKE_HISTORY,
    REFINER_FAKE_HISTORY,
    RESOLVER_FAKE_HISTORY,
)
from app.analysis.agents.utils import get_response_as_schema, format_stories
from .state import ProposalState, ProposalContext
from app.analysis.agents.nodes import (
    build_context_gatherer_agent,
    run_context_gatherer,
)
from app.connection.jira.services import JiraService
from app.taxonomy.services import TaxonomyService
from app.analysis.agents.all import run_analysis

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
    temperature: float = LlmConfig.LLM_DEFECT_TEMPERATURE,
    top_p: float = LlmConfig.LLM_DEFECT_TOP_P,
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
        response_mime_type="application/json",
        response_schema=response_schema,
        api_keys=LlmConfig.GEMINI_API_KEYS,
        max_retries=LlmConfig.GEMINI_API_MAX_RETRY,
        middleware=[user_context_prompt],
        temperature=temperature,
        top_p=top_p,
    )


# Agents (no tools: response_mime_type="application/json" is incompatible with tool calling)
splitter_agent = _build_agent(SPLITTER_SYSTEM_PROMPT, temperature=0.2, top_p=0.8)
refiner_agent = _build_agent(REFINER_SYSTEM_PROMPT, temperature=0.2, top_p=0.8)
resolver_agent = _build_agent(RESOLVER_SYSTEM_PROMPT, temperature=0.2, top_p=0.8)

simple_agent = _build_agent(SIMPLE_SYSTEM_PROMPT, temperature=0.2, top_p=0.8)
validator_agent = _build_agent(
    VALIDATOR_SYSTEM_PROMPT,
    response_schema=ValidatorOutput,
    temperature=0.0,
    top_p=0.1,
)

ctx_agent = build_context_gatherer_agent()

# ---------------------------------------------------------------------------
# Helper: build human message for a specialized drafter
# ---------------------------------------------------------------------------


def _format_raw_defects(defects: list[DefectForProposal]) -> str:
    """Format raw defects into a readable text block for the drafters."""
    if not defects:
        return "No defects provided."

    parts = []
    for d in defects:
        parts.append(
            f"**[ID: {d.id}]** Type: {d.type} | Severity: {d.severity}\n"
            f"Stories: {', '.join(d.story_keys)}\n"
            f"Explanation: {d.explanation}\n"
            f"Suggested Fix: {d.suggested_fix}"
        )
    return "\n\n---\n\n".join(parts)


def _build_drafter_message(
    stories: list[StoryMinimal],
    defects: list[DefectForProposal],
    clarifications: str | None = None,
    inter_story_context: str | None = None,
    validation_feedback: str | None = None,
) -> str:
    msg = (
        "Here is the input data for generating proposals:\n\n"
        "## USER STORIES\n"
        f"{format_stories(stories)}\n\n"
        "## DEFECTS\n"
        f"{_format_raw_defects(defects)}"
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
    defects: list[DefectForProposal], all_stories: list[StoryMinimal]
) -> list[StoryMinimal]:
    keys = set()
    for d in defects:
        keys.update(d.story_keys)
    story_map = {s.key: s for s in all_stories}
    return [story_map[k] for k in sorted(keys) if k in story_map]


# ---------------------------------------------------------------------------
# Node functions
# ---------------------------------------------------------------------------


def context_gatherer_node(
    state: ProposalState, runtime: Runtime[ProposalContext]
) -> ProposalState:
    """Gather inter-story context for all input stories via tool-calling agent."""
    context = runtime.context
    if not context.user_stories:
        print("| Context Gatherer - Skipped (no stories or context already gathered)")
        return state

    print(f"\n{'='*80}\n| Context Gatherer - Starting\n{'='*80}")

    state.project_context = run_context_gatherer(
        agent=ctx_agent,
        context=context,
        target_stories=state.user_stories,
        project_desc=context.project_description,
    )

    print(f"| Context Gatherer - Complete\n{'='*80}")

    taxonomy_service = TaxonomyService(db=context.db)
    story_to_tags, tag_to_stories = taxonomy_service.get_project_stories_tags(
        connection_id=context.connection_id,
        project_key=context.project_key,
    )

    jira_service = JiraService(db=context.db)
    all_story_dtos = jira_service.fetch_stories(
        connection_id=context.connection_id,
        project_key=context.project_key,
    )
    key_to_story = {dto.key: dto for dto in all_story_dtos}
    state.story_to_tags = story_to_tags
    state.tag_to_stories = tag_to_stories
    state.key_to_story = key_to_story
    return state


def defect_router(
    state: ProposalState, runtime: Runtime[ProposalContext]
) -> ProposalState:
    """Categorize defects into the three resolution tracks."""
    print(f"\n{'='*80}\n| Defect Router - Starting\n{'='*80}")
    context = runtime.context

    if state.validation_attempt == 0:
        defects = context.defects
        state.working_stories = (
            context.user_stories.copy()
        )  # All stories are relevant for resolver track
    else:
        defects = state.new_defects
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
    state.loop_modified_story_keys = set()  # Reset for the new loop

    print(
        f"| Routed: {len(splitter)} splitter, {len(refiner)} refiner, {len(resolver)} resolver"
    )

    print(f"| Defect Router - Complete\n{'='*80}")
    return state


def _run_specialized_drafter(
    agent: GenimiDynamicAgent,
    fake_history: list,
    defects: list[DefectForProposal],
    stories: list[StoryMinimal],
    state: ProposalState,
    context: ProposalContext,
    drafter_name: str,
) -> list[Proposal]:
    """Shared logic for all three specialized drafters."""
    if not defects:
        print(f"| {drafter_name} - No defects, skipping")
        return []

    if not stories:
        print(f"| {drafter_name} - No stories, skipping")
        return []
    human_message = _build_drafter_message(
        stories=stories,
        defects=defects,
        clarifications=context.clarifications,
        inter_story_context=state.project_context,
        validation_feedback=(
            state.validation_feedback if state.validation_attempt > 0 else None
        ),
    )

    messages = fake_history + [HumanMessage(content=human_message)]

    response = agent.invoke(messages=messages, context=context)
    result: ProposalOutput = get_response_as_schema(response, ProposalOutput)

    if not result:
        print(f"| {drafter_name} - Failed to parse response")
        return []

    print(f"| {drafter_name} - Drafted {len(result.proposals)} proposals")
    return result.proposals


def resolver_drafter(
    state: ProposalState, runtime: Runtime[ProposalContext]
) -> ProposalState:
    """Draft proposals for CONFLICT / DUPLICATION defects."""
    print(f"\n{'='*80}\n| Resolver Drafter - Starting\n{'='*80}")
    context = runtime.context

    proposals = _run_specialized_drafter(
        agent=resolver_agent,
        fake_history=RESOLVER_FAKE_HISTORY,
        defects=state.resolver_defects,
        stories=_get_stories_for_defects(state.resolver_defects, state.working_stories),
        state=state,
        context=context,
        drafter_name="Resolver",
    )

    # Preparing for next node
    old_to_new_keys: dict[str, set[str]] = {}
    delete_keys = set()
    for proposal in proposals:
        for content in proposal.contents:
            if content.type == "CREATE":
                # Generate a unique temporary key for this proposed story
                state.highest_id += 1
                # Simulate a real key to reduce hallucination
                temp_key = f"{context.project_key}-{state.highest_id}"
                state.working_stories.append(
                    StoryMinimal(
                        key=temp_key,
                        summary=content.summary,
                        description=content.description,
                    )
                )
                state.loop_modified_story_keys.add(temp_key)
                orig_key = content.original_story_key
                if orig_key:
                    old_to_new_keys.setdefault(orig_key, set()).add(temp_key)
                    state.temp_to_original_key[temp_key] = orig_key

            elif content.type == "UPDATE" and content.story_key:
                # Update the existing story in user_stories
                state.loop_modified_story_keys.add(content.story_key)
                for s in state.working_stories:
                    if s.key == content.story_key:
                        s.summary = content.summary
                        s.description = content.description
                        break
            elif content.type == "DELETE" and content.story_key:
                story_key = content.story_key
                # Remove the story from user_stories
                state.working_stories = [
                    s for s in state.working_stories if s.key != story_key
                ]

                delete_keys.add(story_key)

    # Modify the defects
    splitter_defects = []
    refiner_defects = []
    for d in state.splitter_defects:
        story_keys = []
        remove = False
        for k in d.story_keys:
            if k in delete_keys:
                new_keys = old_to_new_keys.get(k, set())
                if not new_keys:
                    remove = True
                else:
                    story_keys.extend(new_keys)
            elif k in old_to_new_keys:
                # Append both old and new keys because old story still exists
                story_keys.append(k)
                story_keys.extend(old_to_new_keys[k])
            else:
                story_keys.append(k)
        if remove:
            continue
        d.story_keys = story_keys
        splitter_defects.append(d)

    for d in state.refiner_defects:
        story_keys = []
        remove = False
        for k in d.story_keys:
            if k in delete_keys:
                new_keys = old_to_new_keys.get(k, set())
                if not new_keys:
                    remove = True
                else:
                    story_keys.extend(new_keys)
            elif k in old_to_new_keys:
                # Append both old and new keys because old story still exists
                story_keys.append(k)
                story_keys.extend(old_to_new_keys[k])
            else:
                story_keys.append(k)
        if remove:
            continue
        d.story_keys = story_keys
        refiner_defects.append(d)

    state.splitter_defects = splitter_defects
    state.refiner_defects = refiner_defects
    return state


def splitter_drafter(
    state: ProposalState, runtime: Runtime[ProposalContext]
) -> ProposalState:
    """Draft proposals for NOT_SMALL / NOT_INDEPENDENT defects."""
    print(f"\n{'='*80}\n| Splitter Drafter - Starting\n{'='*80}")
    context = runtime.context
    proposals = _run_specialized_drafter(
        agent=splitter_agent,
        fake_history=SPLITTER_FAKE_HISTORY,
        defects=state.splitter_defects,
        user_stories=_get_stories_for_defects(
            state.splitter_defects, state.working_stories
        ),
        state=state,
        context=context,
        drafter_name="Splitter",
    )

    # Preparing for next node
    old_to_new_keys: dict[str, set[str]] = {}
    delete_keys = set()
    for proposal in proposals:
        for content in proposal.contents:
            if content.type == "CREATE":
                # Generate a unique temporary key for this proposed story
                state.highest_id += 1
                # Simulate a real key to reduce hallucination
                temp_key = f"{context.project_key}-{state.highest_id}"
                state.working_stories.append(
                    StoryMinimal(
                        key=temp_key,
                        summary=content.summary,
                        description=content.description,
                    )
                )
                state.loop_modified_story_keys.add(temp_key)
                orig_key = content.original_story_key
                if orig_key:
                    old_to_new_keys.setdefault(orig_key, set()).add(temp_key)
                    state.temp_to_original_key[temp_key] = orig_key

            elif content.type == "UPDATE" and content.story_key:
                # Update the existing story in user_stories
                state.loop_modified_story_keys.add(content.story_key)
                for s in state.working_stories:
                    if s.key == content.story_key:
                        s.summary = content.summary
                        s.description = content.description
                        break
            elif content.type == "DELETE" and content.story_key:
                story_key = content.story_key
                # Remove the story from user_stories
                state.working_stories = [
                    s for s in state.working_stories if s.key != story_key
                ]

                delete_keys.add(story_key)
    # Modify the defects
    refiner_defects = []

    for d in state.refiner_defects:
        story_keys = []
        remove = False
        for k in d.story_keys:
            if k in delete_keys:
                new_keys = old_to_new_keys.get(k, set())
                if not new_keys:
                    remove = True
                else:
                    story_keys.extend(new_keys)
            elif k in old_to_new_keys:
                # Append both old and new keys because old story still exists
                story_keys.append(k)
                story_keys.extend(old_to_new_keys[k])
            else:
                story_keys.append(k)
        if remove:
            continue
        d.story_keys = story_keys
        refiner_defects.append(d)

    state.refiner_defects = refiner_defects

    return state


def refiner_drafter(
    state: ProposalState, runtime: Runtime[ProposalContext]
) -> ProposalState:
    """Draft proposals for NOT_ESTIMABLE / NOT_VALUABLE defects."""
    print(f"\n{'='*80}\n| Refiner Drafter - Starting\n{'='*80}")
    context = runtime.context
    proposals = _run_specialized_drafter(
        agent=refiner_agent,
        fake_history=REFINER_FAKE_HISTORY,
        defects=state.refiner_defects,
        stories=_get_stories_for_defects(state.refiner_defects, state.refiner_stories),
        state=state,
        context=context,
        drafter_name="Refiner",
    )

    for proposal in proposals:
        for content in proposal.contents:
            if content.type == "CREATE":
                # Generate a unique temporary key for this proposed story
                state.highest_id += 1
                # Simulate a real key to reduce hallucination
                temp_key = f"{context.project_key}-{state.highest_id}"
                state.working_stories.append(
                    StoryMinimal(
                        key=temp_key,
                        summary=content.summary,
                        description=content.description,
                    )
                )
                state.loop_modified_story_keys.add(temp_key)
                orig_key = content.original_story_key
                if orig_key:
                    state.temp_to_original_key[temp_key] = orig_key

            elif content.type == "UPDATE" and content.story_key:
                # Update the existing story in user_stories
                state.loop_modified_story_keys.add(content.story_key)
                for s in state.working_stories:
                    if s.key == content.story_key:
                        s.summary = content.summary
                        s.description = content.description
                        break
            elif content.type == "DELETE" and content.story_key:
                story_key = content.story_key
                # Remove the story from user_stories
                state.working_stories = [
                    s for s in state.working_stories if s.key != story_key
                ]
    return state


def deep_validation_node(
    state: ProposalState, runtime: Runtime[ProposalContext]
) -> ProposalState:
    """Run the FULL defect detection pipeline on generated proposals."""
    print(
        f"\n{'='*80}\n| Complex Validation Node - Attempt {state.validation_attempt + 1}/{state.max_validation_attempts}\n{'='*80}"
    )
    context = runtime.context

    proposed_stories: list[StoryMinimal] = [
        s for s in state.working_stories if s.key in state.loop_modified_story_keys
    ]

    if not proposed_stories:
        print("| No proposed stories to validate. Skipping.")
        state.validation_attempt = state.max_validation_attempts
        return state

    proposed_stories.sort(key=lambda s: s.key)  # Sort for consistent ordering

    bucket_groups: list[BucketGroup] = []
    checked_pairs: set[tuple[str, str]] = set()

    # Update story_to_tags
    for story in proposed_stories:
        orig_key = state.temp_to_original_key.get(story.key)
        if orig_key:
            tags = state.story_to_tags.get(orig_key, set())
            state.story_to_tags[story.key] = tags
        state.key_to_story[story.key] = story

    # Now, all the temp_key are in story_to_tags
    for story in proposed_stories:
        tags = state.story_to_tags.get(story.key, set())

        related_keys: set[str] = set()
        for tag in tags:
            related_keys.update(state.tag_to_stories.get(tag, set()))

        related_stories = []
        for related_key in related_keys:
            pair = tuple(sorted([story.key, related_key]))
            if pair in checked_pairs:
                continue
            checked_pairs.add(pair)

            related = state.key_to_story.get(related_key)
            if related:
                related_stories.append(
                    StoryTag(
                        key=related.key,
                        summary=related.summary,
                        description=related.description,
                        tags=list(state.story_to_tags.get(related.key, set())),
                    )
                )

        if related_stories:
            bucket_groups.append(
                BucketGroup(
                    target_story=StoryTag(
                        key=story.key,
                        summary=story.summary,
                        description=story.description,
                        tags=list(tags),
                    ),
                    related_stories=related_stories,
                )
            )

    new_defects = run_analysis(
        connection_id=context.connection_id,
        project_key=context.project_key,
        info_provided=True,
        all_stories=proposed_stories,
        bucket_groups=bucket_groups,
        db=context.db,
        project_description=context.project_description,
    )

    final_new_defects = []
    counter = 1
    for d in new_defects:
        final_new_defects.append(
            DefectForProposal(
                id=f"{context.project_key}-DEF-{counter}",
                type=d.type,
                story_keys=d.story_keys,
                severity=d.severity,
                explanation=d.explanation,
                confidence=d.confidence,
                suggested_fix=d.suggested_fix,
            )
        )
        counter += 1

    state.new_defects = final_new_defects
    state.validation_attempt += 1
    return state


def complex_validation_node(
    state: ProposalState, runtime: Runtime[ProposalContext]
) -> ProposalState:
    """Run lightweight LLM-based validation on generated proposals."""
    print(
        f"\n{'='*80}\n| Medium Validation Node - Attempt {state.validation_attempt + 1}/{state.max_validation_attempts}\n{'='*80}"
    )
    context = runtime.context

    proposed_stories: list[StoryMinimal] = [
        s for s in state.working_stories if s.key in state.loop_modified_story_keys
    ]

    if not proposed_stories:
        print("| No proposed stories to validate. Skipping.")
        state.validation_attempt = state.max_validation_attempts
        return state

    msg = (
        "Here are the proposed user stories generated in the current iteration:\n\n"
        f"{format_stories(proposed_stories)}"
    )

    response = validator_agent.invoke(
        messages=[HumanMessage(content=msg)], context=context
    )
    result: ValidatorOutput = get_response_as_schema(response, ValidatorOutput)

    final_new_defects = []
    counter = 1
    for d in result.defects:
        final_new_defects.append(
            DefectForProposal(
                id=f"{context.project_key}-DEF-{counter}",
                type=d.type,
                story_keys=d.story_keys,
                severity=d.severity,
                explanation=d.explanation,
                confidence=d.confidence,
                suggested_fix=d.suggested_fix,
            )
        )
        counter += 1

    state.new_defects = final_new_defects
    state.validation_attempt += 1
    return state


def route_after_validation(state: ProposalState) -> list[str]:
    """Conditional edge after validation_node."""
    if state.new_defects and state.validation_attempt < state.max_validation_attempts:
        print(
            f"| Validation found {len(state.new_defects)} new defects. Retrying drafters. Attempt {state.validation_attempt}/{state.max_validation_attempts}"
        )
        return "retry"
    return "synthesis"


def synthesis_node(
    state: ProposalState, runtime: Runtime[ProposalContext]
) -> ProposalState:
    """Synthesize final proposals after successful validation."""
    print(f"\n{'='*80}\n| Synthesis Node - Starting\n{'='*80}")
    # Compare state.working_stories with context.user_stories
    # If a key not exists -> CREATE
    # If a key exists but summary or description changed -> UPDATE
    # If a key in user_stories but not in working_stories -> DELETE

    working_stories = state.working_stories
    original_stories = runtime.context.user_stories
    final_proposals: list[Proposal] = []

    # Build quick lookup maps
    work_map: dict[str, StoryMinimal] = {s.key: s for s in working_stories}
    orig_map: dict[str, StoryMinimal] = {s.key: s for s in original_stories}

    work_keys = set(work_map.keys())
    orig_keys = set(orig_map.keys())

    create_keys = sorted(work_keys - orig_keys)
    delete_keys = sorted(orig_keys - work_keys)
    possible_update_keys = sorted(work_keys & orig_keys)

    update_keys: list[str] = []
    for k in possible_update_keys:
        w = work_map[k]
        o = orig_map[k]
        w_summary = (w.summary or "").strip()
        o_summary = (o.summary or "").strip()
        w_desc = (w.description or "").strip()
        o_desc = (o.description or "").strip()
        if w_summary != o_summary or w_desc != o_desc:
            update_keys.append(k)

    contents: list[ProposalContent] = []

    # CREATEs
    for k in create_keys:
        s = work_map[k]
        orig_key = None
        if hasattr(state, "temp_to_original_key"):
            orig_key = state.temp_to_original_key.get(k)
        contents.append(
            ProposalContent(
                type="CREATE",
                story_key=None,
                original_story_key=orig_key,
                summary=s.summary,
                description=s.description,
            )
        )

    # UPDATEs
    for k in update_keys:
        s = work_map[k]
        contents.append(
            ProposalContent(
                type="UPDATE",
                story_key=k,
                original_story_key=None,
                summary=s.summary,
                description=s.description,
            )
        )

    # DELETEs
    for k in delete_keys:
        contents.append(ProposalContent(type="DELETE", story_key=k))

    final_proposals = state.proposals.copy() if state.proposals else []
    if contents:
        # Single combined proposal for all deltas
        proposal = Proposal(target_defect_ids=[], contents=contents)
        final_proposals.append(proposal)

    print(
        f"| Synthesis - CREATE: {len(create_keys)}, UPDATE: {len(update_keys)}, DELETE: {len(delete_keys)}"
    )

    state.proposals = final_proposals
    return state



# ---------------------------------------------------------------------------
# Graph builders
# ---------------------------------------------------------------------------
def _build_base_workflow() -> StateGraph:
    """Build the base workflow shared by COMPLEX and MEDIUM pipelines."""
    workflow = StateGraph(ProposalState, context=ProposalContext)
    workflow.add_node("context_gatherer", context_gatherer_node)
    workflow.add_node("defect_router", defect_router)
    workflow.add_node("splitter_drafter", splitter_drafter)
    workflow.add_node("refiner_drafter", refiner_drafter)
    workflow.add_node("resolver_drafter", resolver_drafter)
    workflow.add_node("synthesis_node", synthesis_node)

    workflow.add_edge(START, "context_gatherer")

    # Context gatherer runs before all drafters to provide global inter-story context
    workflow.add_edge("context_gatherer", "defect_router")

    workflow.add_edge("defect_router", "resolver_drafter")
    workflow.add_edge("resolver_drafter", "splitter_drafter")
    workflow.add_edge("splitter_drafter", "refiner_drafter")
    workflow.add_edge("synthesis_node", END)

    return workflow


def build_deep_graph() -> StateGraph:
    """Build the COMPLEX mode proposal generation graph."""
    workflow = _build_base_workflow()
    workflow.add_node("validation_node", deep_validation_node)
    workflow.add_edge("refiner_drafter", "validation_node")

    workflow.add_conditional_edges(
        "validation_node",
        route_after_validation,
        {
            "synthesis": "synthesis_node",
            "retry": "defect_router",
        },
    )
    return workflow.compile()


def build_complex_graph() -> StateGraph:
    """Build the MEDIUM mode proposal generation graph."""
    workflow = _build_base_workflow()
    workflow.add_node("validation_node", complex_validation_node)
    workflow.add_edge("refiner_drafter", "validation_node")

    workflow.add_conditional_edges(
        "validation_node",
        route_after_validation,
        {
            "synthesis": "synthesis_node",
            "retry": "defect_router",
        },
    )
    return workflow.compile()


_deep_graph = build_deep_graph()
_complex_graph = build_complex_graph()


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------
def run_proposal_generation(
    mode: Literal["SIMPLE", "COMPLEX", "DEEP"],
    user_stories: list[StoryMinimal],
    defects: list[DefectForProposal],
    db: Session,
    connection_id: str,
    project_key: str,
    max_rewrite_attempts: int = 3,
    extra_instruction: Optional[str] = None,
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

    if not user_stories or not defects:
        print("No user stories or defects provided. Returning empty proposal list.")
        return []

    context = ProposalContext(
        user_stories=user_stories,
        defects=defects,
        extra_instruction=extra_instruction,
        connection_id=connection_id,
        project_key=project_key,
        db=db,
        clarifications=clarifications,
        project_description=project_description,
    )

    max_key = user_stories[0].key
    for story in user_stories:
        if story.key > max_key:
            max_key = story.key
    print(f"Max story key: {max_key}")
    highest_id = int(max_key.split("-")[-1]) + 10

    if mode in ("COMPLEX", "DEEP"):
        initial_state = ProposalState(
            highest_id=highest_id,
            max_validation_attempts=max_rewrite_attempts,
        )
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
            f"{_format_raw_defects(defects)}"
        )
        if clarifications:
            msg += f"\n\nClarifications:\n{clarifications}"

        messages = [HumanMessage(content=msg)]

        response = simple_agent.invoke(messages=messages, context=context)
        result: ProposalOutput = get_response_as_schema(response, ProposalOutput)
        if not result:
            print("Failed to parse response into ProposalOutput schema.")
            print(f"Here is the raw response for debugging:\n{response}")
            return []

        return result.proposals
