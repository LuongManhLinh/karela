from langchain_core.runnables import RunnableConfig
from langchain_core.messages import HumanMessage
from typing_extensions import TypedDict
from typing import Optional, List, Callable
from langgraph.graph import StateGraph
from langgraph.runtime import Runtime

from ..schemas import WorkItemMinimal, DefectByLlm, DefectInput
from llm.dynamic_agent import GenimiDynamicAgent
from .schemas import (
    CrossCheckInput,
    SingleCheckInput,
    ValidateDefectsInput,
    ValidateDefectsOutput,
    FilterDefectsInput,
    FilterDefectsOutput,
)
from ..output_schemas import DetectDefectOutput
from common.agents.input_schemas import ContextInput
from .prompts import (
    CROSS_CHECK_SYSTEM_PROMPT,
    SINGLE_CHECK_SYSTEM_PROMPT,
    DEFECT_VALIDATOR_SYSTEM_PROMPT,
    DEFECT_FILTER_SYSTEM_PROMPT,
)
from common.configs import GeminiConfig


class State(TypedDict):
    done_adapter: bool
    done_cross_check: bool
    done_single_check: bool
    done_validation: bool
    done_filtering: bool
    done_signing: bool


class Context(TypedDict):
    work_items: List[WorkItemMinimal]
    on_done: Callable
    context_input: ContextInput
    existing_defects: List[DefectByLlm] = []

    defects: List[DefectByLlm] = []


potential_cross_defects = ["CONFLICT", "DUPLICATION"]
potential_single_defects = ["OUT_OF_SCOPE", "IRRELEVANCE"]


# Agent for cross-checking defects between stories
cross_check_agent = GenimiDynamicAgent(
    system_prompt=CROSS_CHECK_SYSTEM_PROMPT,
    model_name=GeminiConfig.GEMINI_API_DEFECT_MODEL,
    temperature=GeminiConfig.GEMINI_API_DEFECT_TEMPERATURE,
    response_mime_type="application/json",
    response_schema=DetectDefectOutput,
    api_keys=GeminiConfig.GEMINI_API_KEYS,
    max_retries=GeminiConfig.GEMINI_API_MAX_RETRY,
)

# Agent for single-story defect checking
single_check_agent = GenimiDynamicAgent(
    system_prompt=SINGLE_CHECK_SYSTEM_PROMPT,
    model_name=GeminiConfig.GEMINI_API_DEFECT_MODEL,
    temperature=GeminiConfig.GEMINI_API_DEFECT_TEMPERATURE,
    response_mime_type="application/json",
    response_schema=DetectDefectOutput,
    api_keys=GeminiConfig.GEMINI_API_KEYS,
    max_retries=GeminiConfig.GEMINI_API_MAX_RETRY,
)

# Agent for validating detected defects
validator_agent = GenimiDynamicAgent(
    system_prompt=DEFECT_VALIDATOR_SYSTEM_PROMPT,
    model_name=GeminiConfig.GEMINI_API_DEFECT_MODEL,
    temperature=GeminiConfig.GEMINI_API_DEFECT_TEMPERATURE,
    response_mime_type="application/json",
    response_schema=ValidateDefectsOutput,
    api_keys=GeminiConfig.GEMINI_API_KEYS,
    max_retries=GeminiConfig.GEMINI_API_MAX_RETRY,
)

# Agent for filtering defects
filter_agent = GenimiDynamicAgent(
    system_prompt=DEFECT_FILTER_SYSTEM_PROMPT,
    model_name=GeminiConfig.GEMINI_API_DEFECT_MODEL,
    temperature=GeminiConfig.GEMINI_API_DEFECT_TEMPERATURE,
    response_mime_type="application/json",
    response_schema=FilterDefectsOutput,
    api_keys=GeminiConfig.GEMINI_API_KEYS,
    max_retries=GeminiConfig.GEMINI_API_MAX_RETRY,
)


def defect_adapter_node(state: State, runtime: Runtime[Context]) -> dict:
    work_items = runtime.context.get("work_items", [])
    defects = runtime.context.get("defects")

    print(
        f"""
{"-"*100}
| Defect Adapter Node ALL
| State: {state}
| Number of work items to adapt: {len(work_items)}
| Defects before adapter: {defects} {defects is not None}
{"-"*100}
"""
    )

    return {"done_adapter": True}


def single_check_node(state: State, runtime: Runtime[Context]) -> dict:
    work_items = runtime.context.get("work_items", [])
    context_input = runtime.context.get("context_input", None)
    defects = runtime.context.get("defects")

    print(
        f"""
{"-"*100}
| Single Check Node
| State: {state}
| Number of work items to check: {len(work_items)}
| Having Context Input: {context_input is not None}
| Defects before single check: {defects} {defects is not None}
{"-"*100}
"""
    )
    if work_items and context_input:
        existing_defects = runtime.context.get("existing_defects", [])

        # Filter existing defects for single check, keeping only those have type
        filtered_existing_defects = [
            defect
            for defect in existing_defects
            if defect.type in potential_single_defects
        ]
        input_data = SingleCheckInput(
            user_stories=work_items,
            context_input=context_input,
            existing_defects=filtered_existing_defects,
        )
        output: DetectDefectOutput = single_check_agent.invoke(
            HumanMessage(
                content="Here is the input data:\n"
                + input_data.model_dump_json(indent=2)
            )
        )["structured_response"]

        if defects is not None:
            print(f"Single check found defects: {output.defects}")
            defects.extend(output.defects or [])
        else:
            print("No defects list found in context!")

    return {"done_single_check": True}


def cross_check_node(state: State, runtime: Runtime[Context]) -> dict:
    work_items = runtime.context.get("work_items", [])
    defects = runtime.context.get("defects")

    print(
        f"""
{"-"*100}
| Cross Check Node
| State: {state}
| Number of work items to check: {len(work_items)}
| Defects before cross check: {defects}
{"-"*100}
"""
    )

    if work_items:
        existing_defects = runtime.context.get("existing_defects", [])
        filtered_existing_defects = [
            defect
            for defect in existing_defects
            if defect.type in potential_cross_defects
        ]
        input_data = CrossCheckInput(
            user_stories=work_items, existing_defects=filtered_existing_defects
        )
        output: DetectDefectOutput = cross_check_agent.invoke(
            HumanMessage(
                content="Here is the input data:\n"
                + input_data.model_dump_json(indent=2)
            )
        )["structured_response"]

        if defects is not None:
            print(f"Cross check found defects: {output.defects}")
            defects.extend(output.defects or [])
        else:
            print("No defects list found in context!")
    return {"done_cross_check": True}


def defect_validator_node(state: State, runtime: Runtime[Context]) -> dict:
    """Validate detected defects for correctness and quality."""
    work_items = runtime.context.get("work_items", [])
    context_input = runtime.context.get("context_input", None)
    defects = runtime.context.get("defects", [])

    print(
        f"""
{"-"*100}
| Defect Validator Node
| State: {state}
| Number of defects to validate: {len(defects)}
{"-"*100}
"""
    )

    if not defects:
        print("No defects to validate, skipping validation.")
        return {"done_validation": True}

    validator_input = ValidateDefectsInput(
        user_stories=work_items,
        defects=defects,
        context_input=context_input,
    )

    output: ValidateDefectsOutput = validator_agent.invoke(
        HumanMessage(
            content="Please validate these detected defects:\n"
            + validator_input.model_dump_json(indent=2)
        )
    )["structured_response"]

    # Apply validation results
    validated_defects = []
    for validation in output.validations:
        idx = validation.defect_index
        if idx < len(defects):
            defect = defects[idx]

            if validation.status == "VALID":
                validated_defects.append(defect)
            elif validation.status == "NEEDS_CLARIFICATION":
                # Apply corrections if suggested
                if validation.suggested_severity:
                    defect.severity = validation.suggested_severity
                if validation.suggested_explanation:
                    defect.explanation = validation.suggested_explanation
                validated_defects.append(defect)
            # INVALID defects are not added (filtered out)

            print(f"Defect {idx}: {validation.status} - {validation.reasoning}")

    # Update context with validated defects
    runtime.context["defects"] = validated_defects
    print(
        f"Validated defects: {len(validated_defects)}/{len(defects)} passed validation"
    )

    return {"done_validation": True}


def defect_filter_node(state: State, runtime: Runtime[Context]) -> dict:
    """Filter defects to show only high-value, actionable items."""
    defects = runtime.context.get("defects", [])

    print(
        f"""
{"-"*100}
| Defect Filter Node
| State: {state}
| Number of defects to filter: {len(defects)}
{"-"*100}
"""
    )

    if not defects:
        print("No defects to filter, skipping filtering.")
        return {"done_filtering": True}

    filter_input = FilterDefectsInput(defects=defects)

    output: FilterDefectsOutput = filter_agent.invoke(
        HumanMessage(
            content="Please filter these defects to show only valuable ones:\n"
            + filter_input.model_dump_json(indent=2)
        )
    )["structured_response"]

    # Apply filtering results
    filtered_defects = []
    for decision in output.filter_decisions:
        idx = decision.defect_index
        if idx < len(defects) and decision.should_include:
            filtered_defects.append(defects[idx])
            print(f"Defect {idx}: INCLUDED - {decision.reasoning}")
        else:
            print(f"Defect {idx}: EXCLUDED - {decision.reasoning}")

    # Update context with filtered defects
    runtime.context["defects"] = filtered_defects
    print(f"Filtered defects: {len(filtered_defects)}/{len(defects)} included")

    return {"done_filtering": True}


def defect_signer_node(state: State, runtime: Runtime[Context]) -> dict:
    """Final node that delivers the processed defects."""
    defects = runtime.context.get("defects", [])
    on_done = runtime.context.get("on_done")

    print(
        f"""
{"-"*100}
| Defect Signer Node
| State: {state}
| Number of final defects: {len(defects)}
{"-"*100}
"""
    )

    if on_done:
        on_done(defects)

    return {"done_signing": True}


def build_graph():
    """Build the complete defect detection workflow with validation and filtering."""
    graph = StateGraph(state_schema=State, context_schema=Context)

    # Add all nodes
    graph.add_node("defect_adapter", defect_adapter_node)
    graph.add_node("single_check", single_check_node)
    graph.add_node("cross_check", cross_check_node)
    graph.add_node("defect_validator", defect_validator_node)
    graph.add_node("defect_filter", defect_filter_node)
    graph.add_node("defect_signer", defect_signer_node)

    # Set entry point
    graph.set_entry_point("defect_adapter")

    # Parallel detection phase
    graph.add_edge("defect_adapter", "single_check")
    graph.add_edge("defect_adapter", "cross_check")

    # Sequential validation and filtering phase
    graph.add_edge("single_check", "defect_validator")
    graph.add_edge("cross_check", "defect_validator")
    graph.add_edge("defect_validator", "defect_filter")
    graph.add_edge("defect_filter", "defect_signer")

    # Set finish point
    graph.set_finish_point("defect_signer")

    return graph.compile()


compiled = build_graph()


async def run_analysis_async(
    user_stories: List[WorkItemMinimal],
    context_input: Optional[ContextInput] = None,
    existing_defects: List[DefectInput] = [],
) -> List[DefectByLlm]:
    res = None

    def on_done(defects: List[DefectByLlm]):
        nonlocal res
        res = defects

    await compiled.ainvoke(
        State(
            done_adapter=False,
            done_cross_check=False,
            done_single_check=False,
            done_validation=False,
            done_filtering=False,
            done_signing=False,
        ),
        context={
            "work_items": user_stories,
            "on_done": on_done,
            "context_input": context_input,
            "existing_defects": existing_defects or [],
            "defects": [],
        },
        config=RunnableConfig(max_concurrency=3),
    )

    return res


def run_analysis(
    user_stories: List[WorkItemMinimal],
    context_input: Optional[ContextInput] = None,
    existing_defects: List[DefectInput] = [],
) -> List[DefectByLlm]:
    res = None

    def on_done(defects: List[DefectByLlm]):
        nonlocal res
        res = defects

    compiled.invoke(
        State(
            done_adapter=False,
            done_cross_check=False,
            done_single_check=False,
            done_validation=False,
            done_filtering=False,
            done_signing=False,
        ),
        context={
            "work_items": user_stories,
            "on_done": on_done,
            "context_input": context_input,
            "existing_defects": existing_defects or [],
            "defects": [],
        },
        config=RunnableConfig(max_concurrency=3),
    )

    return res


_node_completed_msg = {
    "defect_adapter": "Initializing defect detection...",
    "single_check": "Checking individual stories...",
    "cross_check": "Checking story interactions...",
    "defect_validator": "Validating detected defects...",
    "defect_filter": "Filtering high-value defects...",
    "defect_signer": "Analysis complete.",
}


def stream_analysis(
    user_stories: List[WorkItemMinimal],
    context_input: Optional[ContextInput] = None,
    existing_defects: List[DefectInput] = [],
):
    res = None

    def on_done(defects: List[DefectByLlm]):
        nonlocal res
        res = defects

    yield {"message": "Starting defect analysis..."}

    for step in compiled.stream(
        State(
            done_adapter=False,
            done_cross_check=False,
            done_single_check=False,
            done_validation=False,
            done_filtering=False,
            done_signing=False,
        ),
        context={
            "work_items": user_stories,
            "on_done": on_done,
            "context_input": context_input,
            "existing_defects": existing_defects or [],
            "defects": [],
        },
        config=RunnableConfig(max_concurrency=3, stream=True),
    ):
        yield {"message": _node_completed_msg.get(list(step.keys())[0], "")}

    yield {"data": res}
