from langgraph.graph import StateGraph, START, END
from langgraph.runtime import Runtime

from .state import TargetedState, TargetedContext
from ..schemas import StoryMinimal
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


from app.taxonomy.query import get_story_tags, get_stories_by_tags


def build_targeted_graph():
    """Build and compile the TARGETED analysis LangGraph workflow."""

    context_agent = build_context_gatherer_agent()
    self_defect_agent = build_self_defect_agent()
    pairwise_agent = build_pairwise_defect_agent(targeted=True)
    validator_agent = build_validator_agent()
    dependency_matrix_agent = build_dependency_matrix_agent()

    def context_gatherer_node(
        state: TargetedState, runtime: Runtime[TargetedContext]
    ) -> dict:
        print("\n| TARGETED Graph -> [context_gatherer]")
        pj_context = run_context_gatherer(
            agent=context_agent,
            context=runtime.context,
            project_desc=runtime.context.project_description,
            target_stories=[state["target_story"]],
        )
        return {"project_context": pj_context}

    def relational_graph_search_node(
        state: TargetedState, runtime: Runtime[TargetedContext]
    ) -> dict:
        from app.connection.jira.services import JiraService

        target = state["target_story"]
        print(
            f"\n{'='*80}\n| Relational Graph Search Node\n"
            f"| Target story: {target.key}\n{'='*80}"
        )
        context = runtime.context
        tags = get_story_tags(
            db=context.db,
            connection_id=context.connection_id,
            project_key=context.project_key,
            story_key=target.key,
        )

        # Get the set of related story keys from the taxonomy service
        related_keys = get_stories_by_tags(
            db=context.db,
            connection_id=context.connection_id,
            project_key=context.project_key,
            tag_names=tags,
        )

        # Remove duplicates and the target story key
        related_keys = list(set(related_keys) - {target.key})

        service = JiraService(context.db)

        related_stories = [
            StoryMinimal(
                key=s.key,
                summary=s.summary,
                description=s.description,
            )
            for s in service.fetch_stories(
                connection_id=context.connection_id,
                project_key=context.project_key,
                story_keys=related_keys,
            )
        ]

        # print(f"| Found {len(related_stories)} related stories")
        return {"related_stories": related_stories}

    def self_defect_analyzer_node(state: TargetedState) -> dict:
        target = state["target_story"]
        project_context = state.get("project_context", "")

        defects = run_self_defect_analyzer(
            agent=self_defect_agent,
            stories=[target],
            project_context=project_context,
        )
        return {"raw_defects": defects}

    def pairwise_defect_analyzer_node(state: TargetedState) -> dict:
        target = state["target_story"]
        related_stories = state.get("related_stories", [])
        project_context = state.get("project_context", "")

        defects = run_pairwise_defect_analyzer(
            agent=pairwise_agent,
            buckets=[(target, related_stories)],
            project_context=project_context,
        )
        return {"raw_defects": defects}

    def defect_validator_node(state: TargetedState) -> dict:
        raw_defects = state.get("raw_defects", [])
        target = state["target_story"]
        related = state.get("related_stories", [])

        # Combine all stories for reference
        all_stories = [target] + related

        final = run_defect_validator(
            agent=validator_agent,
            raw_defects=raw_defects,
            stories=all_stories,
        )
        return {"final_defects": final}

    def defect_filter_node(
        state: TargetedState, runtime: Runtime[TargetedContext]
    ) -> dict:
        final_defects = state.get("final_defects", [])
        filtered = run_defect_filter(
            existing_defects=runtime.context.existing_defects, new_defects=final_defects
        )
        return {"final_defects": filtered}

    def dependency_matrix_node(state: TargetedState) -> dict:
        target = state["target_story"]
        related = state.get("related_stories", [])

        # Combine target + related stories for dependency analysis
        all_stories = [target]
        if isinstance(related, list):
            all_stories.extend(related)

        defects = run_dependency_matrix_analyzer(
            agent=dependency_matrix_agent,
            stories=all_stories,
        )
        return {"raw_defects": defects}

    graph = StateGraph(TargetedState)

    # Add nodes
    graph.add_node("context_gatherer", context_gatherer_node)
    graph.add_node("relational_graph_search", relational_graph_search_node)
    graph.add_node("self_defect_analyzer", self_defect_analyzer_node)
    graph.add_node("pairwise_defect_analyzer", pairwise_defect_analyzer_node)
    graph.add_node("dependency_matrix", dependency_matrix_node)
    graph.add_node("defect_validator", defect_validator_node)
    graph.add_node("defect_filter", defect_filter_node)

    # Don't process context_gatherer and bucket_mapper in parallel because of sqlalchemy session concurrency issues.
    # Instead, run bucket_mapper first to gather all stories/tags,
    # then context_gatherer to get project context while batch analyzers run.
    graph.add_edge(START, "relational_graph_search")
    graph.add_edge("relational_graph_search", "context_gatherer")
    graph.add_edge("context_gatherer", "self_defect_analyzer")
    graph.add_edge("context_gatherer", "pairwise_defect_analyzer")
    graph.add_edge("context_gatherer", "dependency_matrix")

    graph.add_edge("self_defect_analyzer", "defect_validator")
    graph.add_edge("pairwise_defect_analyzer", "defect_validator")
    graph.add_edge("dependency_matrix", "defect_validator")
    graph.add_edge("defect_validator", "defect_filter")
    graph.add_edge("defect_filter", END)

    return graph.compile()
