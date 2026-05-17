from .schemas import ACGeneratorInput, ACReviewerInput, ACRewriterInput


def format_ac_generator_input(data: ACGeneratorInput) -> str:
    parts = []
    parts.append(f"## **Story Summary:**\n{data.summary}")
    parts.append(f"## **Story Description:**\n{data.description}")
    if data.existing_ac:
        parts.append(f"## **Existing Acceptance Criteria:**\n{data.existing_ac}")
    if data.user_feedback:
        parts.append(f"## **User Feedback:**\n{data.user_feedback}")

    if data.project_description:
        parts.append(f"## **Project Description:**\n{data.project_description}")

    return "\n\n".join(parts)


def format_ac_reviewer_input(data: ACReviewerInput) -> str:
    parts = []
    parts.append(f"## **Story Summary:**\n{data.user_story_title}")
    parts.append(f"## **Story Description:**\n{data.user_story_description}")
    parts.append(f"## **Generated Acceptance Criteria:**\n{data.generated_ac}")
    if data.project_description:
        parts.append(f"## **Project Description:**\n{data.project_description}")
    return "\n\n".join(parts)


def format_ac_rewriter_input(data: ACRewriterInput) -> str:
    parts = []
    parts.append(f"## **Story Summary:**\n{data.summary}")
    parts.append(f"## **Story Description:**\n{data.description}")
    if data.existing_ac:
        parts.append(
            f"## **Original Existing Acceptance Criteria:**\n{data.existing_ac}"
        )
    if data.user_feedback:
        parts.append(f"## **User Feedback:**\n{data.user_feedback}")
    parts.append(f"## **Current Generated Acceptance Criteria:**\n{data.current_ac}")
    parts.append(f"## **Reviewer Feedback:**\n{data.reviewer_feedback}")
    if data.project_description:
        parts.append(f"## **Project Description:**\n{data.project_description}")

    return "\n\n".join(parts)
