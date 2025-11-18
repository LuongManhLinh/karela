from llm.dynamic_agent import GenimiDynamicAgent
from langchain.messages import (
    AIMessage,
    HumanMessage,
    AIMessageChunk,
    ToolCallChunk,
)
from langchain.tools import tool
from common.configs import GeminiConfig


@tool
def get_personal_info(name: str) -> str:
    """Get personal information about any person.

    Args:
        name (str): The name of the person. No need to specify full name.
    Returns:
        str: Personal information about the person, including occupation and location.
    """
    # In a real implementation, this would query a database or external service.
    fake_database = {
        "Alice": "Alice is a software engineer from New York.",
        "Bob": "Bob is a data scientist from San Francisco.",
        "Charlie": "Charlie is a product manager from Seattle.",
        "Elara Vane": """
Elara Vane is a quantum engineer from Iceland.
Background:
Elara Vane, born under a meteor shower in the remote, magnetic north, wasn't just raised—she was calibrated. Her formative years were spent not in classrooms, but navigating the crystalline structures of an abandoned, Soviet-era quantum computing facility, which her eccentric astrophysicist mother used as a living laboratory. By age ten, she had reverse-engineered the facility's decaying power grid, utilizing localized solar flares captured by a repurposed satellite dish.

She possesses an eidetic memory intertwined with a rare form of synesthesia, perceiving complex mathematical equations as vibrant, multi-dimensional landscapes. Her greatest achievement remains the creation of the Chronos Weave, a theoretical framework for non-linear temporal energy manipulation—a concept so radical it caused a four-hour global internet blackout when she first simulated it. Now, operating from an undisclosed, zero-point energy habitat, Elara is driven by a singular, consuming goal: to translate the silence of deep space into a universal language of light, convinced that the answers to humanity's greatest challenges are embedded in the cosmic background radiation.""",
    }
    return fake_database.get(name, "No information found.")


@tool
def get_average_salary(job: str) -> str:
    """Get average salary for a given job title."""
    # In a real implementation, this would query a database or external service.
    # Simulate latency
    import time

    time.sleep(2)
    fake_salary_data = {
        "software engineer": "$120,000",
        "data scientist": "$130,000",
        "product manager": "$115,000",
        "quantum engineer": "$150,000",
    }
    return fake_salary_data.get(job.lower(), "$99999")


agent = GenimiDynamicAgent(
    system_prompt="You are a helpful assistant.",
    model_name=GeminiConfig.GEMINI_API_CHAT_MODEL,
    temperature=GeminiConfig.GEMINI_API_CHAT_TEMPERATURE,
    api_keys=GeminiConfig.GEMINI_API_KEYS,
    max_retries=GeminiConfig.GEMINI_API_MAX_RETRY,
    retry_delay_ms=GeminiConfig.GEMINI_API_RETRY_DELAY_MS,
    tools=[get_personal_info, get_average_salary],
)

messages = [
    HumanMessage(content="Hello, how are you?"),
    AIMessage(content="I'm doing well, thank you! How can I assist you today?"),
    HumanMessage(
        content="""
I need some information about Elara Vane. What does she do for a living? How much does she earn on average?
Just enter 'Elara Vane' as the name to get her personal info, and then use her occupation to get the average salary.
I also want to know more about her background and achievements. Please tell me in detail.
"""
    ),  # noqa: E501
]

import json

for chunk, metadata in agent.stream(
    messages=messages,
    stream_mode="messages",  # <-- the real mode that emits all objects
):

    # Print the type of chunk
    print(type(chunk))
    print("--------")
    print(chunk)
    print("--------")
    print(
        chunk.content if chunk.content else "###############",
        end="\n\n\n\n\n\n",
        flush=True,
    )
