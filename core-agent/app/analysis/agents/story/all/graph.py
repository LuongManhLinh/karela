from langchain_core.runnables import RunnableConfig
from langchain_core.messages import HumanMessage
from typing_extensions import TypedDict
from typing import Optional, List, Callable
from langgraph.graph import StateGraph
from langgraph.runtime import Runtime

from ...schemas import WorkItemMinimal, DefectByLlm, DefectInput
from llm.dynamic_agent import GenimiDynamicAgent
from .schemas import CrossCheckInput, SingleCheckInput
from ...output_schemas import DetectDefectOutput
from ...input_schemas import ContextInput
from .prompts import CROSS_CHECK_SYSTEM_PROMPT, SINGLE_CHECK_SYSTEM_PROMPT
from common.configs import GeminiConfig


class State(TypedDict):
    done_adapter: bool
    done_cross_check: bool
    done_single_check: bool
    done_signing: bool


class Context(TypedDict):
    work_items: List[WorkItemMinimal]
    on_done: Callable
    context_input: ContextInput
    existing_defects: List[DefectByLlm] = []

    defects: List[DefectByLlm] = []


potential_cross_defects = ["CONFLICT", "DUPLICATION"]
potential_single_defects = ["OUT_OF_SCOPE", "IRRELEVANCE"]


cross_check_agent = GenimiDynamicAgent(
    system_prompt=CROSS_CHECK_SYSTEM_PROMPT,
    model_name=GeminiConfig.GEMINI_API_DEFECT_MODEL,
    temperature=GeminiConfig.GEMINI_API_DEFECT_TEMPERATURE,
    response_mime_type="application/json",
    response_schema=DetectDefectOutput,
    api_keys=GeminiConfig.GEMINI_API_KEYS,
    max_retries=GeminiConfig.GEMINI_API_MAX_RETRY,
    retry_delay_ms=GeminiConfig.GEMINI_API_RETRY_DELAY_MS,
)

single_check_agent = GenimiDynamicAgent(
    system_prompt=SINGLE_CHECK_SYSTEM_PROMPT,
    model_name=GeminiConfig.GEMINI_API_DEFECT_MODEL,
    temperature=GeminiConfig.GEMINI_API_DEFECT_TEMPERATURE,
    response_mime_type="application/json",
    response_schema=DetectDefectOutput,
    api_keys=GeminiConfig.GEMINI_API_KEYS,
    max_retries=GeminiConfig.GEMINI_API_MAX_RETRY,
    retry_delay_ms=GeminiConfig.GEMINI_API_RETRY_DELAY_MS,
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


def defect_signer_node(state: State, runtime: Runtime[Context]) -> dict:
    defects = runtime.context.get("defects", [])
    on_done = runtime.context.get("on_done")
    print(
        f"""
{"-"*100}
| Defect Signer Node
| State: {state}
| Number of defects to sign: {len(defects)}
{"-"*100}
"""
    )
    if on_done:
        on_done(defects)

    # return {"done_signing": True}
    return {"Message": "Defect signing completed."}


def build_graph():
    graph = StateGraph(state_schema=State, context_schema=Context)

    graph.add_node("defect_adapter", defect_adapter_node)
    graph.add_node("single_check", single_check_node)
    graph.add_node("cross_check", cross_check_node)
    graph.add_node("defect_signer", defect_signer_node)

    graph.set_entry_point("defect_adapter")

    graph.add_edge("defect_adapter", "single_check")
    graph.add_edge("defect_adapter", "cross_check")

    graph.add_edge("single_check", "defect_signer")
    graph.add_edge("cross_check", "defect_signer")

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
            done_single_item_check=False,
            done_cross_type_check=False,
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
    "defect_adapter": "Checking for defects...",
    "single_check": "Single Item Check completed.",
    "cross_check": "Cross Type Check completed.",
    "defect_signer": "All processes completed.",
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

    yield {"message": "Starting Analysis..."}

    for step in compiled.stream(
        State(
            done_adapter=False,
            done_single_item_check=False,
            done_cross_type_check=False,
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
