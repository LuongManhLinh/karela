from dataclasses import dataclass, field
from typing import Optional
from langchain_core.messages import BaseMessage

from app.proposal.schemas import DefectForProposal


from .schemas import (
    Proposal,
)

from common.schemas import StoryMinimal
from common.agents.schemas import LlmContext


@dataclass
class ProposalState:
    """State for the COMPLEX proposal generation workflow."""

    highest_id: int = 0  # To generate unique temporary keys
    temp_to_original_key: dict[str, str] = field(default_factory=dict)
    loop_modified_story_keys: set[str] = field(default_factory=set)

    # refiner_stories is the user_stories in context
    working_stories: list[StoryMinimal] = field(default_factory=list)

    # Routed defect groups
    splitter_defects: list[DefectForProposal] = field(default_factory=list)
    refiner_defects: list[DefectForProposal] = field(default_factory=list)
    resolver_defects: list[DefectForProposal] = field(default_factory=list)

    proposals: list[Proposal] = field(default_factory=list)  # Proposals from all nodes

    # Validation loop
    validation_attempt: int = 0
    max_validation_attempts: int = 3
    project_context: str = ""
    new_defects: list[DefectForProposal] = field(
        default_factory=list
    )  # Defects found during validation

    key_to_story: dict[str, StoryMinimal] = field(
        default_factory=dict
    )  # story_key -> StoryMinimal

    # For deep workflow
    story_to_tags: dict[str, set[str]] = field(
        default_factory=dict
    )  # story_key -> set of tags
    tag_to_stories: dict[str, set[str]] = field(
        default_factory=dict
    )  # tag -> set of story_keys


class ProposalContext(LlmContext):
    """Context shared across all nodes."""

    user_stories: list[StoryMinimal]
    defects: list[DefectForProposal]
    extra_instruction: Optional[str] = None
    clarifications: Optional[str] = None
    project_description: Optional[str] = None
