from typing import List, Optional
from langchain_core.messages import HumanMessage

from llm.dynamic_agent import GenimiDynamicAgent
from .prompts import GENERATOR_SYSTEM_PROMPT
from .schemas import ProposalInput, ProposalOutput, Proposal
from ..schemas import WorkItemMinimal, DefectInput
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
    defects: List[DefectInput],
    context_input: Optional[ContextInput] = None,
) -> List[Proposal]:

    proposal_input = ProposalInput(
        user_stories=user_stories,
        defects=defects,
        context_input=context_input,
    )

    response = agent.invoke(
        messages=[
            HumanMessage(
                content=f"Here is the input data for generating proposals:\n{proposal_input.model_dump_json(indent=2)}"
            )
        ]
    )
    return response["structured_response"].proposals
