"""Tool stubs for the defect detection agent workflows.

These are empty function definitions that describe the tools available to agents.
Actual implementations will be provided by the respective service layers.
"""

from langchain.tools import tool, ToolRuntime
from sqlalchemy.orm import Session

from app.connection.jira.models import Project
from common.agents.schemas import LlmContext


@tool
def DocumentationVectorSearch(
    runtime: ToolRuntime,
    query: str,
) -> str:
    """Search the project documentation vector database for relevant information.

    Use this tool to retrieve project constraints, Product Vision statements,
    Non-Functional Requirements (NFRs), architectural guidelines, and any
    other project-level documentation that provides context for evaluating
    user stories.

    Args:
        query: A natural language search query describing the information
            you need. Be specific about what aspect of the project you're
            investigating (e.g., "authentication requirements",
            "performance NFRs", "project scope boundaries").

    Returns:
        A JSON string containing the most relevant documentation chunks
        matching the query, with metadata about the source document.
    """
    pass


# =============================================================================
# Relational Graph Search Tools (TARGETED workflow)
# =============================================================================


@tool
def GraphRAG_LocalSearch(
    runtime: ToolRuntime,
    query: str,
) -> str:
    """Execute a local search on the GraphRAG knowledge graph to find stories
    related to a specific query.

    Use this tool to find existing user stories that might contradict,
    duplicate, or be closely related to a target story. The local search
    focuses on the immediate neighborhood of entities in the graph.

    Args:
        query: A natural language query describing what you're looking for.
            For best results, frame it as a question about potential
            conflicts or redundancies, e.g., "Are there any existing stories
            that contradict or are redundant with a story about user
            authentication via OAuth?"

    Returns:
        A JSON string containing related stories and their relationships
        to the queried entities, including relevance scores.
    """
    pass


@tool
def Neo4j_GetCommunityStories(
    runtime: ToolRuntime,
    entity_ids: list[str],
) -> str:
    """Retrieve all user stories that belong to the same GraphRAG community
    (cluster) as the specified entities.

    Use this tool after identifying key entities from a target story to
    find all other stories in the same semantic neighborhood. Communities
    are automatically detected clusters of highly connected entities.

    Args:
        entity_ids: A list of entity IDs (from GraphRAG) that were
            identified in the target story. The tool will find the
            communities these entities belong to and return all stories
            in those communities.

    Returns:
        A JSON string containing a list of user stories (with key,
        summary, description) that share a community with the given
        entities.
    """
    pass


# =============================================================================
# Community Mapper Tools (ALL workflow)
# =============================================================================


@tool
def Neo4j_GetAllCommunities(
    runtime: ToolRuntime,
) -> str:
    """Retrieve a list of all detected communities (clusters) from the
    GraphRAG knowledge graph.

    Use this tool to get an overview of how the project's user stories
    are organized into semantic groups. Each community represents a
    cluster of highly connected entities and stories.

    Returns:
        A JSON string containing a list of communities, each with:
        - community_id: The unique identifier for the community
        - title: A human-readable label for the community theme
        - size: The number of stories in the community
    """
    pass


@tool
def Neo4j_GetStoriesInCommunity(
    runtime: ToolRuntime,
    community_id: int,
) -> str:
    """Fetch all user stories that belong to a specific GraphRAG community.

    Use this tool after calling Neo4j_GetAllCommunities to retrieve the
    actual story content for each community. This data is needed for
    intra-community pairwise defect analysis.

    Args:
        community_id: The integer ID of the community to retrieve
            stories from (obtained from Neo4j_GetAllCommunities).

    Returns:
        A JSON string containing a list of user stories in the community,
        each with key, summary, and description fields.
    """
    pass


# =============================================================================
# Inter-Community Search Tools (ALL workflow)
# =============================================================================


@tool
def GraphRAG_GlobalSearch(
    runtime: ToolRuntime,
    query: str,
) -> str:
    """Execute a global search across the entire GraphRAG knowledge graph
    to find project-wide conflicts or duplications.

    Use this tool to detect defects that span across different communities
    (modules/features). Unlike LocalSearch which focuses on a neighborhood,
    GlobalSearch synthesizes information from community reports across
    the entire project.

    Args:
        query: A high-level query about potential cross-module issues,
            e.g., "Are there any conflicting rules or duplicate features
            across different modules in this project?"

    Returns:
        A JSON string containing any cross-community conflicts or
        duplications found, with references to the specific stories
        and communities involved.
    """
    pass


# =============================================================================
# Tool Groups for Agent Configuration
# =============================================================================

context_gatherer_tools = []

relational_search_tools = [GraphRAG_LocalSearch, Neo4j_GetCommunityStories]

community_mapper_tools = [Neo4j_GetAllCommunities, Neo4j_GetStoriesInCommunity]

inter_community_tools = [GraphRAG_GlobalSearch]
