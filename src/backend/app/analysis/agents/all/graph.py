from langgraph.graph import StateGraph, START, END
from langgraph.runtime import Runtime
from typing import Literal
from .state import AllState, AllContext
from ..schemas import BucketGroup, StoryMinimal, StoryTag
from ..nodes import (
    build_context_gatherer_agent,
    build_self_defect_agent,
    build_pairwise_defect_agent,
    build_validator_agent,
    build_dependency_matrix_agent,
    run_context_gatherer,
    run_self_defect_analyzer,
    run_pairwise_defect_analyzer,
    run_defect_validator,
    run_defect_filter,
    run_dependency_matrix_analyzer,
)

from app.taxonomy.query import get_project_stories_tags


def build_all_graph():
    """Build and compile the ALL (batch) analysis LangGraph workflow."""

    # Instantiate agents
    context_agent = build_context_gatherer_agent()
    self_defect_agent = build_self_defect_agent()
    pairwise_agent = build_pairwise_defect_agent(targeted=True)
    validator_agent = build_validator_agent()
    dependency_matrix_agent = build_dependency_matrix_agent()

    def initial_route_node(
        state: AllState,
    ) -> Literal["bucket_mapper", "context_gatherer"]:
        if (
            state.get("info_provided", False)
            and state.get("all_stories", [])
            and state.get("bucket_groups", [])
        ):
            return "context_gatherer"
        return "bucket_mapper"

    def bucket_mapper_node(state: AllState, runtime: Runtime[AllContext]) -> dict:
        print(f"\n{'='*80}\n| Bucket Mapper Node - Starting\n{'='*80}")
        from app.connection.jira.services import JiraService

        context = runtime.context

        jira_service = JiraService(context.db)
        story_dtos = jira_service.fetch_stories(
            connection_id=context.connection_id,
            project_key=context.project_key,
        )

        key_to_story = {
            dto.key: StoryMinimal(
                key=dto.key,
                summary=dto.summary,
                description=dto.description,
            )
            for dto in story_dtos
        }

        story_to_tags, tag_to_stories = get_project_stories_tags(
            db=context.db,
            connection_id=context.connection_id,
            project_key=context.project_key,
        )

        all_stories = []
        bucket_groups = []
        checked_pairs = set()

        for key in sorted(key_to_story.keys()):
            story = key_to_story[key]
            all_stories.append(story)

            tags = story_to_tags.get(key, set())
            related_keys = set()
            for tag in tags:
                related_keys.update(tag_to_stories.get(tag, set()))

            related_keys.discard(key)  # Remove self from related keys

            related_stories = []
            for related_key in related_keys:
                pair = tuple(sorted([key, related_key]))
                if pair in checked_pairs:
                    continue
                checked_pairs.add(pair)

                related_story = key_to_story.get(related_key)
                if related_story:
                    related_stories.append(
                        StoryTag(
                            key=related_story.key,
                            summary=related_story.summary,
                            description=related_story.description,
                            tags=list(story_to_tags.get(related_story.key, set())),
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

        # print bucket for debugging
        for i, group in enumerate(bucket_groups):
            print(f"Bucket Group {i+1}")
            print(f"Target Story: {group.target_story.key}")
            print(f"Related Stories: {[s.key for s in group.related_stories]}")
            print("---")
        print(
            f"| Bucket Mapper Node - Completed with {len(all_stories)} stories and {len(bucket_groups)} bucket groups\n{'='*80}"
        )
        return {
            "all_stories": all_stories,
            "bucket_groups": bucket_groups,
        }

    def context_gatherer_node(state: AllState, runtime: Runtime[AllContext]) -> dict:
        """Gather project context if not already provided."""
        print("\n| ALL Graph -> [context_gatherer]")
        all_stories = state.get("all_stories", [])
        info_provided = state.get("info_provided", False)

        pj_context = run_context_gatherer(
            agent=context_agent,
            context=runtime.context,
            project_desc=runtime.context.project_description,
            target_stories=all_stories if info_provided else None,
        )
        return {"project_context": pj_context}

    def batch_self_defect_analyzer_node(
        state: AllState, runtime: Runtime[AllContext]
    ) -> dict:
        print(f"\n{'='*80}\n| Batch Self-Defect Analyzer Node - Starting\n{'='*80}")
        all_stories = state.get("all_stories", [])
        project_context = state.get("project_context", "")
        batch_size = runtime.context.self_batch_size

        print(
            f"\n{'='*80}\n| Batch Self-Defect Analyzer\n"
            f"| Total unique stories: {len(all_stories)}\n{'='*80}"
        )
        defects = run_self_defect_analyzer(
            agent=self_defect_agent,
            stories=all_stories,
            project_context=project_context,
            batch_size=batch_size,
        )
        return {"raw_defects": defects}

    def pairwise_defect_analyzer_node(
        state: AllState, runtime: Runtime[AllContext]
    ) -> dict:
        print(f"\n{'='*80}\n| Pairwise Defect Analyzer Node - Starting\n{'='*80}")
        bucket_groups = state.get("bucket_groups", [])
        project_context = state.get("project_context", "")

        print(
            f"\n{'='*80}\n| Pairwise Defect Analyzer\n"
            f"| Total bucket groups: {len(bucket_groups)}\n{'='*80}"
        )
        buckets = [
            (group.target_story, group.related_stories) for group in bucket_groups
        ]
        defects = run_pairwise_defect_analyzer(
            agent=pairwise_agent,
            buckets=buckets,
            project_context=project_context,
        )
        return {"raw_defects": defects}

    def defect_validator_node(state: AllState) -> dict:
        print(f"\n{'='*80}\n| Defect Validator Node - Starting\n{'='*80}")
        raw_defects = state.get("raw_defects", [])
        all_stories = state.get("all_stories", [])

        final = run_defect_validator(
            agent=validator_agent,
            raw_defects=raw_defects,
            stories=all_stories,
        )
        print(
            f"| Defect Validator Node - Completed with {len(final)} final defects\n{'='*80}"
        )
        return {"final_defects": final}

    def defect_filter_node(state: AllState, runtime: Runtime[AllContext]) -> dict:
        print(f"\n{'='*80}\n| Defect Filter Node - Starting\n{'='*80}")
        final_defects = state.get("final_defects", [])
        existing_defects = runtime.context.existing_defects

        filtered = run_defect_filter(
            existing_defects=existing_defects,
            new_defects=final_defects,
        )
        return {"final_defects": filtered}

    def dependency_matrix_node(state: AllState) -> dict:
        all_stories = state.get("all_stories", [])

        print(
            f"\n{'='*80}\n| Dependency Matrix (ALL)\n"
            f"| Total stories: {len(all_stories)}\n{'='*80}"
        )

        defects = run_dependency_matrix_analyzer(
            agent=dependency_matrix_agent,
            stories=all_stories,
        )
        return {"raw_defects": defects}

    # -------------------------------------------------------------------------
    # Build the graph
    # -------------------------------------------------------------------------
    graph = StateGraph(AllState)

    # Add nodes
    graph.add_node("context_gatherer", context_gatherer_node)
    graph.add_node("bucket_mapper", bucket_mapper_node)
    graph.add_node("batch_self_defect_analyzer", batch_self_defect_analyzer_node)
    graph.add_node("pairwise_defect_analyzer", pairwise_defect_analyzer_node)
    graph.add_node("dependency_matrix", dependency_matrix_node)
    graph.add_node("defect_validator", defect_validator_node)
    graph.add_node("defect_filter", defect_filter_node)

    # Don't process context_gatherer and bucket_mapper in parallel because of sqlalchemy session concurrency issues.
    # Instead, run bucket_mapper first to gather all stories/tags,
    # then context_gatherer to get project context while batch analyzers run.
    # graph.add_edge(START, "bucket_mapper")
    graph.add_conditional_edges(START, initial_route_node)
    graph.add_edge("bucket_mapper", "context_gatherer")
    graph.add_edge("context_gatherer", "batch_self_defect_analyzer")
    graph.add_edge("context_gatherer", "pairwise_defect_analyzer")
    graph.add_edge("context_gatherer", "dependency_matrix")

    graph.add_edge("batch_self_defect_analyzer", "defect_validator")
    graph.add_edge("pairwise_defect_analyzer", "defect_validator")
    graph.add_edge("dependency_matrix", "defect_validator")
    graph.add_edge("defect_validator", "defect_filter")
    graph.add_edge("defect_filter", END)

    return graph.compile()
