"""Shared node functions used by both TARGETED and ALL workflows."""

from langchain_core.messages import HumanMessage
from langchain.agents.middleware import dynamic_prompt, ModelRequest

from llm.dynamic_agent import GenimiDynamicAgent
from common.configs import LlmConfig
from common.agents.schemas import LlmContext

from .schemas import DefectByLlm, StoryMinimal, RelatedStory
from .response_schemas import (
    SelfDefectResponse,
    PairwiseDefectResponse,
    PairwiseDefectGroupsResponse,
    ValidatorResponse,
    DependencyMatrixResponse,
)
from .prompts import (
    CONTEXT_GATHERER_PROMPT,
    RELATIONAL_GRAPH_SEARCH_PROMPT,
    SELF_DEFECT_ANALYZER_PROMPT,
    SELF_DEFECT_ANALYZER_MESSAGE,
    PAIRWISE_DEFECT_ANALYZER_PROMPT,
    PAIRWISE_DEFECT_ANALYZER_MESSAGE,
    PAIRWISE_DEFECT_ANALYZER_TARGETED_PROMPT,
    PAIRWISE_DEFECT_ANALYZER_TARGETED_MESSAGE,
    PAIRWISE_DEFECT_ANALYZER_TARGETED_GROUPED_PROMPT,
    PAIRWISE_DEFECT_ANALYZER_TARGETED_GROUPED_MESSAGE,
    DEFECT_VALIDATOR_PROMPT,
    DEFECT_VALIDATOR_MESSAGE,
    DEPENDENCY_MATRIX_PROMPT,
    DEPENDENCY_MATRIX_MESSAGE,
)
from .tools import (
    context_gatherer_tools,
    relational_search_tools,
)
from app.documentation.services import DocumentationService

from app.documentation.llm_tools import doc_tools

from .utils import (
    format_stories,
    format_raw_defects,
    get_last_langchain_message,
    get_response_as_schema,
)


def _build_agent(
    system_prompt: str = None,
    response_schema=None,
    tools=None,
    response_mime_type="text/plain",
):
    """Helper to create a GenimiDynamicAgent with standard config."""

    @dynamic_prompt
    def user_context_prompt(request: ModelRequest) -> str:
        extra_instruction = request.runtime.context.extra_instruction or ""
        try:
            return system_prompt.format(extra_instruction=extra_instruction)
        except:
            return system_prompt

    return GenimiDynamicAgent(
        model_name=LlmConfig.GEMINI_DEFECT_MODEL,
        temperature=LlmConfig.LLM_DEFECT_TEMPERATURE,
        response_mime_type=response_mime_type,
        response_schema=response_schema,
        api_keys=LlmConfig.GEMINI_API_KEYS,
        max_retries=LlmConfig.GEMINI_API_MAX_RETRY,
        system_prompt=system_prompt,
        tools=tools,
        middleware=[user_context_prompt] if system_prompt else None,
        top_p=LlmConfig.LLM_DEFECT_TOP_P,
    )


# Lazy agent builders - instantiated at graph build time
def build_context_gatherer_agent():
    return _build_agent(
        system_prompt=CONTEXT_GATHERER_PROMPT,
        tools=doc_tools + context_gatherer_tools,
    )


def build_relational_search_agent():
    return _build_agent(
        system_prompt=RELATIONAL_GRAPH_SEARCH_PROMPT,
        tools=relational_search_tools,
    )


def build_self_defect_agent():
    return _build_agent(
        system_prompt=SELF_DEFECT_ANALYZER_PROMPT,
        response_schema=SelfDefectResponse,
        response_mime_type="application/json",
    )


def build_pairwise_defect_agent(targeted: bool = False, grouped: bool = False):
    if grouped and not targeted:
        raise ValueError(
            "Grouped pairwise analysis currently supports targeted mode only"
        )

    if grouped:
        system_prompt = PAIRWISE_DEFECT_ANALYZER_TARGETED_GROUPED_PROMPT
        response_schema = PairwiseDefectGroupsResponse
    elif targeted:
        system_prompt = PAIRWISE_DEFECT_ANALYZER_TARGETED_PROMPT
        response_schema = PairwiseDefectResponse
    else:
        system_prompt = PAIRWISE_DEFECT_ANALYZER_PROMPT
        response_schema = PairwiseDefectResponse

    return _build_agent(
        system_prompt=system_prompt,
        response_schema=response_schema,
        response_mime_type="application/json",
    )


def build_validator_agent():
    return _build_agent(
        system_prompt=DEFECT_VALIDATOR_PROMPT,
        response_schema=ValidatorResponse,
        response_mime_type="application/json",
    )


def build_dependency_matrix_agent():
    return _build_agent(
        system_prompt=DEPENDENCY_MATRIX_PROMPT,
        response_schema=DependencyMatrixResponse,
        response_mime_type="application/json",
    )


def run_context_gatherer(
    agent: GenimiDynamicAgent,
    context: LlmContext,
    target_stories: list[StoryMinimal] = None,
    project_desc: str = None,
) -> str:
    """Run the Context Gatherer agent to retrieve project-level context.

    Returns:
        The project context as a summarized string.
    """
    print(f"\n{'='*80}\n| Context Gatherer Node - Starting\n{'='*80}")
    doc_service = DocumentationService(db=context.db)
    doc_count = doc_service.count_docs_for_project(
        connection_id=context.connection_id,
        project_key=context.project_key,
    )
    if doc_count == 0:
        print(
            f"| Context Gatherer Node - No documentation found for project {context.project_key}"
        )
        project_context = (
            f"Project Description:\n{project_desc}" if project_desc else ""
        )
        return project_context

    if target_stories:
        story_text = format_stories(target_stories)
        message = f"Gather project-level context relevant to the following target stories:\n{story_text}"
    else:
        message = (
            "Gather general project-level context relevant to user story analysis."
        )

    messages = [HumanMessage(content=message)]

    response = agent.invoke(messages, context=context)

    # Extract text response (this agent returns plain text, not JSON)
    gathered_context = get_last_langchain_message(response)
    project_context = (
        f"# Project Description:\n{project_desc}\n\n# Documentation Context:\n{gathered_context}"
        if project_desc
        else f"Documentation Context:\n{gathered_context}"
    )

    print(
        f"| Context Gatherer - Retrieved {len(gathered_context)} chars of project context"
    )
    return project_context


def run_self_defect_analyzer(
    agent: GenimiDynamicAgent,
    stories: list[StoryMinimal],
    project_context: str,
    batch_size: int = 1,
) -> list[DefectByLlm]:
    """Analyze stories for self-defects (INVEST criteria violations).

    Returns:
        List of DefectByLlm for detected self-defects.
    """
    print(
        f"\n{'='*80}\n| Self-Defect Analyzer Node\n"
        f"| Stories to analyze: {len(stories)}\n{'='*80}"
    )
    if not stories:
        print("| No stories to analyze. Skipping.")
        return []

    msg_lists = []
    for i in range(0, len(stories), batch_size):
        batch_stories = stories[i : i + batch_size]
        stories_text = format_stories(batch_stories)

        msg = SELF_DEFECT_ANALYZER_MESSAGE.format(
            project_context=project_context or "N/A",
            stories=stories_text,
        )
        msg_lists.append(HumanMessage(content=msg))

    defects = []

    responses = agent.batch(msg_lists)
    for response in responses:
        output: SelfDefectResponse = get_response_as_schema(
            response, SelfDefectResponse
        )

        if not output:
            print("| No structured response found in this response.")
            continue

        for d in output.defects:
            defects.append(
                DefectByLlm(
                    type=d.type,
                    story_keys=[d.story_key],
                    severity=d.severity,
                    explanation=d.explanation,
                    confidence=d.confidence,
                    suggested_fix=d.suggested_fix,
                )
            )

    print(f"| Self-Defect Analyzer - Found {len(defects)} defects")
    return defects


def run_pairwise_defect_analyzer(
    agent: GenimiDynamicAgent,
    buckets: list[tuple[StoryMinimal, list[StoryMinimal]]],
    project_context: str,
    group: bool = False,
    grouped_story_threshold: int = 10,
) -> list[DefectByLlm]:
    """Compare stories pairwise for CONFLICT and DUPLICATION.

    If target_story is provided, uses the targeted prompt (compares target vs. others).
    Otherwise, uses the batch prompt (compares all vs. all within the group).

    Returns:
        List of DefectByLlm for detected pairwise defects.
    """
    print(
        f"\n{'='*80}\n| Pairwise Defect Analyzer Node\n"
        f"| Buckets to analyze: {len(buckets)}\n{'='*80}"
    )

    if not buckets:
        print("| Not enough buckets for pairwise comparison. Skipping.")
        return []

    valid_buckets = [
        (target_story, related_stories)
        for target_story, related_stories in buckets
        if related_stories
    ]

    if not valid_buckets:
        print("| No non-empty buckets for pairwise comparison. Skipping.")
        return []

    defects = []

    if not group or grouped_story_threshold < 2:
        msg_lists = []
        for target_story, related_stories in valid_buckets:
            target_text = format_stories([target_story])
            stories_text = format_stories(related_stories)
            msg = PAIRWISE_DEFECT_ANALYZER_TARGETED_MESSAGE.format(
                project_context=project_context or "N/A",
                target_story=target_text,
                related_stories=stories_text,
            )
            msg_lists.append(HumanMessage(content=msg))

        responses = agent.batch(msg_lists)
        for response in responses:
            output: PairwiseDefectResponse = get_response_as_schema(
                response, PairwiseDefectResponse
            )

            if not output:
                print("| No structured response found in this response.")
                continue

            for d in output.defects:
                defects.append(
                    DefectByLlm(
                        type=d.type,
                        story_keys=sorted([d.story_key_a, d.story_key_b]),
                        severity=d.severity,
                        explanation=d.explanation,
                        confidence=d.confidence,
                        suggested_fix=d.suggested_fix,
                    )
                )
    else:
        # Sort small buckets first so each request can pack more buckets under the threshold.
        sorted_valid_buckets = sorted(valid_buckets, key=lambda bucket: len(bucket[1]))

        grouped_chunks: list[list[tuple[StoryMinimal, list[StoryMinimal]]]] = []
        current_chunk: list[tuple[StoryMinimal, list[StoryMinimal]]] = []
        current_story_total = 0

        for target_story, related_stories in sorted_valid_buckets:
            # k = target story + related stories
            k = len(related_stories) + 1

            # Single oversized bucket: send it alone.
            if k >= grouped_story_threshold:
                if current_chunk:
                    grouped_chunks.append(current_chunk)
                    current_chunk = []
                    current_story_total = 0
                grouped_chunks.append([(target_story, related_stories)])
                continue

            if current_chunk and current_story_total + k >= grouped_story_threshold:
                grouped_chunks.append(current_chunk)
                current_chunk = []
                current_story_total = 0

            current_chunk.append((target_story, related_stories))
            current_story_total += k

        if current_chunk:
            grouped_chunks.append(current_chunk)

        msg_lists = []
        next_bucket_id = 1

        for chunk in grouped_chunks:
            bucket_sections = []
            chunk_story_total = 0

            for target_story, related_stories in chunk:
                bucket_id = next_bucket_id
                next_bucket_id += 1
                chunk_story_total += len(related_stories) + 1

                target_text = format_stories([target_story])
                stories_text = format_stories(related_stories)
                bucket_sections.append(
                    f"### Bucket {bucket_id}\n\n"
                    f"#### Target Story\n"
                    f"{target_text}\n\n"
                    f"#### Related Stories\n"
                    f"{stories_text}"
                )

            msg = PAIRWISE_DEFECT_ANALYZER_TARGETED_GROUPED_MESSAGE.format(
                project_context=project_context or "N/A",
                buckets_markdown="\n\n".join(bucket_sections),
            )
            msg_lists.append(HumanMessage(content=msg))

            print(
                f"| Grouped request prepared with {len(chunk)} buckets and "
                f"total stories k={chunk_story_total}"
            )

        print(
            f"| Pairwise Defect Analyzer - Group mode enabled\n"
            f"| Non-empty buckets: {len(valid_buckets)}\n"
            f"| API calls after grouping: {len(msg_lists)}\n"
            f"| Story threshold per API call: {grouped_story_threshold}"
        )

        responses = agent.batch(msg_lists)
        for response in responses:
            output: PairwiseDefectGroupsResponse = get_response_as_schema(
                response, PairwiseDefectGroupsResponse
            )

            if not output:
                continue

            for group_result in output.results:
                for d in group_result.defects:
                    story_key_a = d.story_key_a
                    story_key_b = d.story_key_b

                    defects.append(
                        DefectByLlm(
                            type=d.type,
                            story_keys=sorted([story_key_a, story_key_b]),
                            severity=d.severity,
                            explanation=d.explanation,
                            confidence=d.confidence,
                            suggested_fix=d.suggested_fix,
                        )
                    )

    print(f"| Pairwise Defect Analyzer - Found {len(defects)} defects")
    return defects


def run_defect_validator(
    agent: GenimiDynamicAgent,
    raw_defects: list[DefectByLlm],
    stories: list[StoryMinimal] | str,
) -> list[DefectByLlm]:
    """Validate and filter raw defects, returning only confirmed defects.

    Returns:
        List of DefectByLlm that passed validation.
    """
    print(
        f"\n{'='*80}\n| Defect Validator & Formatter Node\n"
        f"| Raw defects to validate: {len(raw_defects)}\n{'='*80}"
    )

    if not raw_defects:
        print("| No defects to validate. Returning empty list.")
        return []

    # Sort for deterministic ordering
    sorted_defects = sorted(raw_defects, key=lambda x: (x.type, sorted(x.story_keys)))

    raw_defects_text = format_raw_defects(sorted_defects)
    stories_text = format_stories(stories) if isinstance(stories, list) else stories

    prompt = DEFECT_VALIDATOR_MESSAGE.format(
        raw_defects=raw_defects_text,
        stories=stories_text,
    )

    messages = [HumanMessage(content=prompt)]
    response = agent.invoke(messages)

    output: ValidatorResponse = get_response_as_schema(
        response=response, Clazz=ValidatorResponse
    )

    if not output:
        print(
            "| Failed to parse structured ValidatorResponse. Returning default defects"
        )
        return sorted_defects

    # Apply validation decisions
    final_defects = []
    for validation in output.validated_defects:
        idx = validation.original_index
        if idx < 0 or idx >= len(sorted_defects):
            print(f"| WARNING: Invalid defect index {idx}, skipping")
            continue

        defect = sorted_defects[idx]

        if validation.status == "VALID":
            final_defects.append(defect)
            print(f"| Defect {idx}: VALID - {validation.reasoning}")
        elif validation.status == "ADJUSTED":
            # Apply corrections
            if validation.adjusted_severity:
                defect.severity = validation.adjusted_severity
            if validation.adjusted_explanation:
                defect.explanation = validation.adjusted_explanation
            final_defects.append(defect)
            print(f"| Defect {idx}: ADJUSTED - {validation.reasoning}")
        else:
            # INVALID - skip
            print(f"| Defect {idx}: INVALID - {validation.reasoning}")

    print(f"| Validator - {len(final_defects)}/{len(sorted_defects)} defects passed")
    return final_defects


def run_defect_filter(
    existing_defects: list[DefectByLlm] | None,
    new_defects: list[DefectByLlm],
) -> list[DefectByLlm]:
    """Filter to get only new defects that are not in existing_defects."""
    if not existing_defects:
        return new_defects

    existing_set = set((d.type, tuple(sorted(d.story_keys))) for d in existing_defects)
    filtered = []
    for d in new_defects:
        key = (d.type, tuple(sorted(d.story_keys)))
        if key not in existing_set:
            filtered.append(d)
            existing_set.add(key)

    print(f"| Defect Filter - {len(filtered)}/{len(new_defects)} defects are new")
    return filtered


def run_dependency_matrix_analyzer(
    agent: GenimiDynamicAgent,
    stories: list[StoryMinimal],
) -> list[DefectByLlm]:
    """Analyze stories for dependency defects (circular deps, extreme bottlenecks).

    Builds a logical dependency graph from the stories and identifies
    structural defects like circular dependencies and extreme bottlenecks,
    all reported as NOT_INDEPENDENT defect type.

    Returns:
        List of DefectByLlm for detected dependency defects.
    """
    print(
        f"\n{'='*80}\n| Dependency Matrix Analyzer Node\n"
        f"| Stories to analyze: {len(stories)}\n{'='*80}"
    )

    if len(stories) < 2:
        print("| Need at least 2 stories to analyze dependencies. Skipping.")
        return []

    stories_text = format_stories(stories)

    msg = DEPENDENCY_MATRIX_MESSAGE.format(stories=stories_text)

    messages = [HumanMessage(content=msg)]
    response = agent.invoke(messages)

    output: DependencyMatrixResponse = get_response_as_schema(
        response=response, Clazz=DependencyMatrixResponse
    )

    defects = []
    for d in output.defects:
        defects.append(
            DefectByLlm(
                type="NOT_INDEPENDENT",
                story_keys=d.story_keys,
                severity=d.severity,
                explanation=f"[{d.type}] {d.explanation}",
                confidence=d.confidence,
                suggested_fix=d.suggested_fix,
            )
        )

    print(f"| Dependency Matrix Analyzer - Found {len(defects)} defects")
    return defects
