from typing import List, Optional
from langchain_core.messages import HumanMessage

from llm.dynamic_agent import GenimiDynamicAgent
from .prompts import GENERATOR_SYSTEM_PROMPT
from .schemas import ProposalOutput, Proposal
from ..schemas import (
    WorkItemMinimal,
    DefectByLlm,
)
from ..input_schemas import ContextInput
from common.configs import GeminiConfig

agent = GenimiDynamicAgent(
    system_prompt=GENERATOR_SYSTEM_PROMPT,
    model_name=GeminiConfig.GEMINI_API_DEFECT_MODEL,
    temperature=GeminiConfig.GEMINI_API_DEFECT_TEMPERATURE,
    response_mime_type="application/json",
    response_schema=ProposalOutput,
    api_keys=GeminiConfig.GEMINI_API_KEYS,
    max_retries=GeminiConfig.GEMINI_API_MAX_RETRY,
    retry_delay_ms=GeminiConfig.GEMINI_API_RETRY_DELAY_MS,
)


def generate_proposals(
    user_stories: List[WorkItemMinimal],
    context_input: Optional[ContextInput],
    defects: List[DefectByLlm],
) -> List[Proposal]:

    response = agent.invoke(
        messages=[
            HumanMessage(
                content=f"""
USER STORIES:
{user_stories}


CONTEXT INPUT:
{context_input}


DEFECTS:
{defects}
"""
            )
        ]
    )
    return response["structured_response"].proposals
