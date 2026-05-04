from llm.dynamic_agent import GenimiDynamicAgent
from common.configs import LlmConfig

from pydantic import BaseModel, Field
from langchain.messages import HumanMessage
from app.analysis.agents.utils import get_response_as_schema


class ResponseSchema(BaseModel):
    name: str = Field(description="The name of the person")
    age: int = Field(description="The age of the person")
    job: str = Field(description="The job of the person")


system_prompt = "You are a extractor that helps to extract structured information from unstructured text"

agent = GenimiDynamicAgent(
    model_name=LlmConfig.GEMINI_TAXONOMY_MODEL,
    api_keys=LlmConfig.GEMINI_API_KEYS,
    response_mime_type="application/json",
    response_schema=ResponseSchema,
    system_prompt=system_prompt,
    temperature=0,
)

messages = [
    [
        HumanMessage(
            content="Extract the name, age and job from the following text: 'John is a 30 year old software engineer living in New York.'"
        )
    ],
    [
        HumanMessage(
            content="I am a graphic designer named Alice, 25 years old, living in San Francisco."
        )
    ],
    [HumanMessage(content="Bob is a 40 year old doctor from Chicago.")],
]


results = agent.batch(messages)

for res in results:
    resp: ResponseSchema = get_response_as_schema(res, ResponseSchema)
    print(resp.model_dump_json(indent=2))
