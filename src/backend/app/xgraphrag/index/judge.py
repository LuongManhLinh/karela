import json
from typing import Optional, List, Dict
from pydantic import BaseModel, Field
from llm.dynamic_agent import GenimiDynamicAgent
from common.configs import LlmConfig
from langchain_core.messages import HumanMessage
from ..logger import Logger

system_prompt = """You are an expert Software Architect and Ontology Manager for a Requirement Engineering Knowledge Graph.
Your task is to evaluate MULTIPLE CASES. In each case, evaluate a Newly Extracted Entity against a list of Candidate Entities retrieved via vector search.

**Core Directives & Edge Cases:**
1. **Independent Case Evaluation:** Process each case independently.
2. **Strict Semantic Equivalence:** Within a case, only mark `is_match: true` if the candidate represents the EXACT same architectural concept, actor, or component as the New Entity. 
   - *Edge Case (Sub-types):* A "System Admin" is a type of "User", but they have different privileges. DO NOT merge them. They must be exact equivalents.
   - *Edge Case (Action Synonyms):* "Sign In" and "Log In" are exact equivalents. Merge them.
3. **The Canonical Title:** If you find one or more matches in a case, you must provide a `final_canonical_title`. Choose the most specific, domain-accurate, and universally understood software engineering term among the matched entities and the new entity.
4. **Rejection:** If a Candidate is just structurally similar but functionally different (e.g., "Driver" vs "Passenger"), reject it (`is_match: false`).

Return a strict JSON object mapping to the requested schema containing all cases."""


# 1. Sub-Schema for individual candidate evaluation
class CandidateEvaluation(BaseModel):
    candidate_title: str = Field(
        description="The exact title of the candidate being evaluated."
    )
    is_match: bool = Field(
        description="True ONLY if this specific candidate means the exact same thing as the New Entity."
    )
    reasoning: str = Field(
        description="A 1-sentence architectural justification for why they do or do not match."
    )


# 2. Schema for a single Case
class CaseEvaluation(BaseModel):
    case_id: str = Field(
        description="The unique identifier for the case provided in the prompt."
    )
    evaluations: List[CandidateEvaluation] = Field(
        description="Evaluations for EVERY candidate provided in this specific case."
    )
    has_any_match: bool = Field(
        description="True if at least ONE candidate was marked as a match in this case."
    )
    final_canonical_title: Optional[str] = Field(
        description="If has_any_match is true, provide the single most specific title for the merged cluster. If false, leave null.",
    )


# 3. Main Response Schema wrapper
class BatchResponseSchema(BaseModel):
    cases: List[CaseEvaluation] = Field(
        description="A list containing the evaluation results for every case provided in the prompt."
    )


llm = GenimiDynamicAgent(
    system_prompt=system_prompt,
    model_name=LlmConfig.GEMINI_CHAT_MODEL,
    temperature=0.0,  # Dropped to 0.0 for maximum consistency on batched arrays
    api_keys=LlmConfig.GEMINI_API_KEYS,
    max_retries=LlmConfig.GEMINI_API_MAX_RETRY,
    response_mime_type="application/json",
    response_schema=BatchResponseSchema,
)


def llm_judge_is_duplicate(
    cases: List[Dict], logger: Logger = Logger.default()
) -> Optional[BatchResponseSchema]:
    """
    LLM evaluates multiple cases in a single prompt to save tokens and roundtrips.
    """
    if not cases:
        return None

    # 1. Format the Human Message payload clearly using Markdown for separation
    content = "Please evaluate the following cases:\n\n"

    for case in cases:
        case_id = case["case_id"]
        new_ent = case["new_entity"]
        matches = case["potential_matches"]

        content += f"### Case ID: {case_id}\n"
        content += f"**New Entity:**\n- Title: {new_ent['title']}\n- Description: {new_ent.get('description', '')}\n\n"
        content += "**Candidates to Evaluate:**\n"

        for idx, match in enumerate(matches):
            content += f"[{idx + 1}] Title: {match['title']}\n    Description: {match.get('description', '')}\n"

        content += "---\n\n"

    logger.info(f"LLM Judge prompt:\n{content}")  # Log the prompt content for debugging

    messages = [HumanMessage(content=content)]

    # 2. Invoke LLM
    response = llm.invoke(messages)

    # 3. Extract the structured Pydantic object
    result: BatchResponseSchema = response.get("structured_response", None)

    if not result:
        logger.warning("Warning: LLM did not return a structured batch response.")
        return None

    logger.info(
        f"LLM Judge response:\n{result.model_dump_json(indent=4)}"
    )  # Log the structured response for debugging
    return result
