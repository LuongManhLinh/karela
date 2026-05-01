import json

from .schemas import DefectByLlm, StoryMinimal
import re


def format_stories(stories: list[StoryMinimal]) -> str:
    """Format a list of stories into a readable text block for prompt injection."""
    if not stories:
        return "No stories provided."

    parts = []
    for s in stories:
        parts.append(
            f"**[{s.key}]** {s.summary or 'No summary'}\n"
            f"Description: {s.description or 'No description'}\n"
        )
        if hasattr(s, "tags") and s.tags:
            parts.append(f"Tags: {', '.join(s.tags)}\n")
        if hasattr(s, "reason") and s.reason:
            parts.append(f"Reason for relevance: {s.reason}\n")

    return "\n---\n".join(parts)


def format_raw_defects(defects: list[DefectByLlm]) -> str:
    """Format raw defects into a readable text block for the validator."""
    if not defects:
        return "No defects to validate."

    parts = []
    for idx, d in enumerate(defects):
        parts.append(
            f"**[Index {idx}]** Type: {d.type} | Severity: {d.severity} | "
            f"Confidence: {d.confidence}\n"
            f"Stories: {', '.join(d.story_keys)}\n"
            f"Explanation: {d.explanation}\n"
            f"Suggested Fix: {d.suggested_fix}"
        )
    return "\n\n---\n\n".join(parts)


def get_last_langchain_message(response) -> str:
    if isinstance(response, dict):
        # Agent returns the last AI message content
        msgs = response.get("messages", [])
        if msgs:
            content = (
                msgs[-1].content if hasattr(msgs[-1], "content") else str(msgs[-1])
            )
        else:
            content = str(response)
    else:
        content = str(response)
    return content


def _parse_last_message(response) -> dict | list[dict] | None:
    """Extract related stories from the relational graph search agent's response."""
    content = get_last_langchain_message(response)
    # Because the agent can use tools -> their response are text only
    # Therefore, they may not output strict JSON, or may include additional text around the JSON. We will try to extract the JSON part using regex.
    json_pattern = r"\{.*\}|\[.*\]"  # Matches JSON objects or arrays
    match = re.search(json_pattern, content, re.DOTALL)
    if match:
        json_str = match.group(0)
        try:
            data = json.loads(json_str)
            return data
        except:
            return None
    return None


def parse_last_message(response, Clazz):
    data = _parse_last_message(response)
    if data is None:
        return None
    try:
        if isinstance(data, list) and len(data) > 0:
            return Clazz(**data[0])
        return Clazz(**data)
    except:
        return None


def get_response_as_schema(response, Clazz):
    output = None
    try:
        output = response["structured_response"]
    except Exception as e:
        print(f"| ERROR parsing {Clazz.__name__}: {e}")

    if not output:
        print(f"| Try to parse last message")
        output = parse_last_message(response, Clazz=Clazz)
    if not output:
        print(f"| Failed to parse response into {Clazz.__name__}")
    return output
