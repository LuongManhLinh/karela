from langchain.agents import create_agent
from langchain.agents.structured_output import ProviderStrategy
from langchain_core.runnables import RunnableConfig
from typing_extensions import TypedDict
from typing import Optional, List, Callable
from langgraph.graph import StateGraph
from langgraph.runtime import Runtime

from ..general_schemas import (
    WorkItemWithRef,
    WorkItem,
    WorkItemMinimal,
    DefectByLlm,
)
from llm.dynamic_agent import GenimiDynamicAgent
from ..input_schemas import (
    ContextInput,
    DetectDefectSingleItemInput,
    DetectDefectSingleTypeInput,
    ReportDefectInput,
)
from ..output_schemas import DetectDefectOutput, ReportDefectOutput
from .prompts import (
    SINGLE_ITEM_SYSTEM_PROMPT,
    SINGLE_TYPE_SYSTEM_PROMPT,
    REPORT_SYSTEM_PROMPT,
)
from common.configs import GeminiConfig


class State(TypedDict):
    done_adapter: bool
    done_single_item_check: bool
    done_single_type_checks: dict[str, bool]
    done_cross_type_check: bool
    done_report: bool
    done_signing: bool


class Context(TypedDict):
    work_items_with_ref: List[WorkItemWithRef]
    on_done: Callable

    context_input: Optional[ContextInput]
    work_items: Optional[List[WorkItem]]
    # work_items_minimal: Optional[List[WorkItemMinimal]]
    defects: List[DefectByLlm] = []
    report: Optional[ReportDefectOutput] = None


single_item_agent = GenimiDynamicAgent(
    system_prompt=SINGLE_ITEM_SYSTEM_PROMPT,
    model_name=GeminiConfig.GEMINI_API_DEFECT_MODEL,
    temperature=GeminiConfig.GEMINI_API_DEFECT_TEMPERATURE,
    response_schema=DetectDefectOutput,
    api_keys=GeminiConfig.GEMINI_API_KEYS,
    max_retries=GeminiConfig.GEMINI_API_MAX_RETRY,
    retry_delay_ms=GeminiConfig.GEMINI_API_RETRY_DELAY_MS,
)

single_type_agent = GenimiDynamicAgent(
    system_prompt=SINGLE_TYPE_SYSTEM_PROMPT,
    model_name=GeminiConfig.GEMINI_API_DEFECT_MODEL,
    temperature=GeminiConfig.GEMINI_API_DEFECT_TEMPERATURE,
    response_schema=ReportDefectOutput,
    api_keys=GeminiConfig.GEMINI_API_KEYS,
    max_retries=GeminiConfig.GEMINI_API_MAX_RETRY,
    retry_delay_ms=GeminiConfig.GEMINI_API_RETRY_DELAY_MS,
)


# cross_type_agent = create_agent(
#     model=model,
#     system_prompt=CROSS_TYPE_SYSTEM_PROMPT,
#     response_format=ProviderStrategy(DetectDefectOutput),
# )

report_agent = GenimiDynamicAgent(
    system_prompt=REPORT_SYSTEM_PROMPT,
    model_name="gemini-2.0-flash-lite",
    temperature=GeminiConfig.GEMINI_API_DEFECT_TEMPERATURE,
    response_schema=ReportDefectOutput,
    api_keys=GeminiConfig.GEMINI_API_KEYS,
    max_retries=GeminiConfig.GEMINI_API_MAX_RETRY,
    retry_delay_ms=GeminiConfig.GEMINI_API_RETRY_DELAY_MS,
)


def defect_adapter_node(state: State, runtime: Runtime[Context]) -> dict:

    work_items_with_ref = runtime.context.get("work_items_with_ref", [])

    print(
        f"""
{"-"*100}
| Defect Adapter Node
| State: {state}
| Number of work items to adapt: {len(work_items_with_ref)}
{"-"*100}
"""
    )
    if work_items_with_ref:
        work_items = [WorkItem(**item.model_dump()) for item in work_items_with_ref]
        # work_items_minimal = [
        #     WorkItemMinimal(**item.model_dump()) for item in work_items_with_ref
        # ]
        runtime.context["work_items"] = work_items
        # runtime.context["work_items_minimal"] = work_items_minimal
    return {"done_adapter": True}


def single_item_check_node(state: State, runtime: Runtime[Context]) -> dict:
    work_items = runtime.context.get("work_items", [])
    print(
        f"""
{"-"*100}
| Single Item Check Node
| State: {state}
| Number of work items to check: {len(work_items)}
{"-"*100}
"""
    )
    if work_items:
        input_data = DetectDefectSingleItemInput(
            work_items=work_items, context=runtime.context.get("context_input")
        )

        output: DetectDefectOutput = single_item_agent.invoke(
            "Here is the input data:\n" + input_data.model_dump_json()
        )

        runtime.context.get("defects").extend(output.defects or [])

    return {"done_single_item_check": True}


def single_type_check_node_builder(type_: str) -> dict:
    def node(state: State, runtime: Runtime[Context]) -> dict:
        work_items = runtime.context.get("work_items", [])
        work_items_minimal = [
            WorkItemMinimal(**wi.model_dump())
            for wi in work_items
            if wi.type.lower() == type_.lower()
        ]
        print(
            f"""
{"-"*100}
| Single Type Check Node for type '{type_}'
| Number of work items to check: {len(work_items_minimal)}
{"-"*100}
"""
        )
        if work_items_minimal:
            # Filter work items relevant to the type if needed

            input_data = DetectDefectSingleTypeInput(
                work_items=work_items_minimal,
                type=type_,
                context=runtime.context.get("context_input"),
            )
            output: DetectDefectOutput = single_type_agent.invoke(
                "Here is the input data:\n" + input_data.model_dump_json()
            )
            runtime.context.get("defects").extend(output.defects or [])

        types_state = state.get("done_single_type_checks", {})
        types_state[type_] = True
        return {"done_single_type_checks": types_state}

    return node


def cross_type_check_node(state: State, runtime: Runtime[Context]) -> dict:
    print(
        f"""
{"-"*100}
| Cross Type Check Node
| State: {state}
{"-"*100}
"""
    )
    return {"done_cross_type_check": True}


def report_node(state: State, runtime: Runtime[Context]) -> dict:
    defects = runtime.context.get("defects", [])
    analyzed_work_items = runtime.context.get("work_items", [])
    print(
        f"""
{"-"*100}
| Report Node
| State: {state}
| Number of defects to report: {len(defects)}
| Number of analyzed work items: {len(analyzed_work_items)}
{"-"*100}
"""
    )

    input_data = ReportDefectInput(
        defects=defects,
        analyzed_work_items=analyzed_work_items,
    )

    output: ReportDefectOutput = report_agent.invoke(
        "Here is the input data:\n" + input_data.model_dump_json()
    )

    print(
        f"""
{"-"*100}
| Report Node
| State: {state}
| Report Title: {output.title}
| Report Content: {output.content}
{"-"*100}
"""
    )
    runtime.context["report"] = output

    return {"done_report": True}


def defect_signer_node(state: State, runtime: Runtime[Context]) -> dict:
    defects = runtime.context.get("defects", [])
    report = runtime.context.get("report")
    on_done = runtime.context.get("on_done")
    defects_as_json_str = (
        "[\n"
        + ",\n".join([defect.model_dump_json(indent=2) for defect in defects])
        + "\n]"
    )
    print(
        f"""
{"-"*100}
| Defect Signer Node
| State: {state}
| All the defects as json: { defects_as_json_str }
{"-"*100}
"""
    )
    if on_done:
        on_done(defects, report)

    return {"done_signing": True}


def build_graph(types: List[str]):
    graph = StateGraph(state_schema=State, context_schema=Context)

    graph.add_node("defect_adapter", defect_adapter_node)
    graph.add_node("single_item_check", single_item_check_node)
    graph.add_node("cross_type_check", cross_type_check_node)
    graph.add_node("report", report_node)
    graph.add_node("defect_signer", defect_signer_node)

    graph.set_entry_point("defect_adapter")

    graph.add_edge("defect_adapter", "single_item_check")
    graph.add_edge("defect_adapter", "cross_type_check")

    graph.add_edge("single_item_check", "report")
    graph.add_edge("cross_type_check", "report")

    graph.add_edge("report", "defect_signer")

    for type_ in types:
        graph.add_node(
            f"single_type_check_{type_}", single_type_check_node_builder(type_)
        )
        graph.add_edge("defect_adapter", f"single_type_check_{type_}")
        graph.add_edge(f"single_type_check_{type_}", "report")

    graph.set_finish_point("defect_signer")
    return graph.compile()


async def run_analysis_async(
    work_items_with_ref: List[WorkItemWithRef],
    on_done: Callable[[List[DefectByLlm]], None],
    work_item_types: List[str],
    context_input: Optional[ContextInput] = None,
) -> dict:
    compiled = build_graph(work_item_types)
    return await compiled.ainvoke(
        State(stage="started"),
        context=Context(
            work_items_with_ref=work_items_with_ref,
            context_input=context_input,
            on_done=on_done,
        ),
        config=RunnableConfig(max_concurrency=3),
    )


def run_analysis(
    work_items_with_ref: List[WorkItemWithRef],
    on_done: Callable[[List[DefectByLlm], ReportDefectOutput], None],
    work_item_types: List[str],
    context_input: Optional[ContextInput] = None,
) -> dict:
    compiled = build_graph(work_item_types)
    return compiled.invoke(
        State(
            done_adapter=False,
            done_single_item_check=False,
            done_single_type_checks={type_: False for type_ in work_item_types},
            done_cross_type_check=False,
            done_signing=False,
        ),
        context=Context(
            work_items_with_ref=work_items_with_ref,
            context_input=context_input,
            on_done=on_done,
            defects=[],
        ),
        config=RunnableConfig(max_concurrency=3),
    )
