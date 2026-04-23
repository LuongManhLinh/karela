from langchain_core.messages import HumanMessage, BaseMessage
from typing_extensions import TypedDict
from typing import Optional, Callable, Annotated
import operator
from langgraph.graph import StateGraph
from langgraph.runtime import Runtime
from langchain.agents.middleware import dynamic_prompt, ModelRequest

from ..schemas import UserStoryMinimal, DefectByLlm
from llm.dynamic_agent import GenimiDynamicAgent
from .schemas import (
    CrossCheckInput,
    CrossCheckTargetedInput,
    SingleCheckInput,
    SingleCheckTargetedInput,
    ValidateDefectsInput,
    ValidateDefectsTargetedInput,
    ValidateDefectsOutput,
    FilterDefectsInput,
    FilterDefectsOutput,
)
from ..output_schemas import DetectDefectOutput
from common.agents.schemas import LlmContext
from common.configs import GeminiConfig
from app.documentation.llm_tools import doc_tools


class State(TypedDict):
    done_adapter: bool
    done_cross_check: bool
    done_single_check: bool
    done_validation: bool
    done_filtering: bool
    done_signing: bool
    # Use reducer for parallel accumulation
    raw_defects: Annotated[list[DefectByLlm], operator.add]
    # Final processed defects (overwritten in sequential steps)
    defects: list[DefectByLlm]


class Context(LlmContext):
    target_story: UserStoryMinimal | None = None
    user_stories: list[UserStoryMinimal]
    on_done: Callable
    existing_defects: list[DefectByLlm] = []
    extra_prompt: Optional[str] = None
    initial_messages: Optional[list[BaseMessage]] = None


potential_cross_defects = ["CONFLICT", "DUPLICATION"]
potential_single_defects = ["OUT_OF_SCOPE", "AMBIGUITY"]


def build_graph(
    targeted: bool,
    cross_check_prompt: str,
    single_check_prompt: str,
    validator_prompt: str,
    filter_prompt: str,
    cross_check_history: list[HumanMessage],
    single_check_history: list[HumanMessage],
    validator_history: list[HumanMessage],
    filter_history: list[HumanMessage],
):
    def get_dynamic_prompt_middleware_for_node(node_name: str) -> str:
        @dynamic_prompt
        def user_context_prompt(request: ModelRequest) -> str:
            extra_prompt = request.runtime.context.extra_prompt or ""
            if node_name == "cross_check":
                return cross_check_prompt.format(extra_prompt=extra_prompt)
            elif node_name == "single_check":
                return single_check_prompt.format(extra_prompt=extra_prompt)
            elif node_name == "defect_validator":
                return validator_prompt.format(extra_prompt=extra_prompt)
            elif node_name == "defect_filter":
                return filter_prompt.format(extra_prompt=extra_prompt)
            else:
                return ""

        return user_context_prompt

    # Agent for cross-checking target story against competitors
    cross_check_agent = GenimiDynamicAgent(
        model_name=GeminiConfig.GEMINI_API_DEFECT_MODEL,
        temperature=GeminiConfig.GEMINI_API_DEFECT_TEMPERATURE,
        response_mime_type="application/json",
        response_schema=DetectDefectOutput,
        api_keys=GeminiConfig.GEMINI_API_KEYS,
        max_retries=GeminiConfig.GEMINI_API_MAX_RETRY,
        middleware=[get_dynamic_prompt_middleware_for_node("cross_check")],
        tools=doc_tools,
    )

    # Agent for single-story defect checking
    single_check_agent = GenimiDynamicAgent(
        model_name=GeminiConfig.GEMINI_API_DEFECT_MODEL,
        temperature=GeminiConfig.GEMINI_API_DEFECT_TEMPERATURE,
        response_schema=DetectDefectOutput,
        response_mime_type="application/json",
        api_keys=GeminiConfig.GEMINI_API_KEYS,
        max_retries=GeminiConfig.GEMINI_API_MAX_RETRY,
        middleware=[get_dynamic_prompt_middleware_for_node("single_check")],
        tools=doc_tools,
    )

    # Agent for validating detected defects
    validator_agent = GenimiDynamicAgent(
        model_name=GeminiConfig.GEMINI_API_DEFECT_MODEL,
        temperature=GeminiConfig.GEMINI_API_DEFECT_TEMPERATURE,
        response_mime_type="application/json",
        response_schema=ValidateDefectsOutput,
        api_keys=GeminiConfig.GEMINI_API_KEYS,
        max_retries=GeminiConfig.GEMINI_API_MAX_RETRY,
        middleware=[get_dynamic_prompt_middleware_for_node("defect_validator")],
        tools=doc_tools,
    )

    # Agent for filtering defects
    filter_agent = GenimiDynamicAgent(
        model_name=GeminiConfig.GEMINI_API_DEFECT_MODEL,
        temperature=GeminiConfig.GEMINI_API_DEFECT_TEMPERATURE,
        response_mime_type="application/json",
        response_schema=FilterDefectsOutput,
        api_keys=GeminiConfig.GEMINI_API_KEYS,
        max_retries=GeminiConfig.GEMINI_API_MAX_RETRY,
        middleware=[get_dynamic_prompt_middleware_for_node("defect_filter")],
        tools=doc_tools,
    )

    def defect_adapter_node(state: State, runtime: Runtime[Context]) -> dict:

        return {"done_adapter": True}

    def single_check_node(state: State, runtime: Runtime[Context]) -> dict:
        target_story = runtime.context.target_story
        user_stories = runtime.context.user_stories

        detected = []
        if user_stories and (targeted and target_story or not targeted):
            existing_defects = runtime.context.existing_defects

            # Filter existing defects for single check, keeping only those have type
            filtered_existing_defects = [
                defect
                for defect in existing_defects
                if defect.type in potential_single_defects
                and any([not targeted, target_story.key in defect.story_keys])
            ]

            input_data = (
                SingleCheckTargetedInput(
                    target_user_story=target_story,
                    user_stories=user_stories,
                    existing_defects=filtered_existing_defects,
                )
                if targeted
                else SingleCheckInput(
                    user_stories=user_stories,
                    existing_defects=filtered_existing_defects,
                )
            )

            # Inject History
            messages = single_check_history + [
                HumanMessage(
                    content="Here is the input data:\n"
                    + input_data.model_dump_json(indent=2)
                )
            ]

            init_messages = runtime.context.initial_messages
            if init_messages:
                messages = init_messages + messages

            resp = single_check_agent.invoke(messages)
            # Dump it to debug
            import pickle

            with open("data/temp.pkl", "wb") as f:
                pickle.dump(resp, f)
            output: DetectDefectOutput = resp["structured_response"]

            if output.defects:
                detected = output.defects

        return {"done_single_check": True, "raw_defects": detected}

    def cross_check_node(state: State, runtime: Runtime[Context]) -> dict:
        user_stories = runtime.context.user_stories
        print(
            f"""
    {"-"*100}
    | Cross Check Node
    | Number of work items to check: {len(user_stories)}
    {"-"*100}
    """
        )

        detected = []
        if user_stories:
            existing_defects = runtime.context.existing_defects
            filtered_existing_defects = [
                defect
                for defect in existing_defects
                if defect.type in potential_cross_defects
            ]
            print(
                "Filtered existing defects for cross check:", filtered_existing_defects
            )
            input_data = (
                CrossCheckTargetedInput(
                    target_user_story=runtime.context.target_story,
                    user_stories=user_stories,
                    existing_defects=filtered_existing_defects,
                )
                if targeted
                else CrossCheckInput(
                    user_stories=user_stories,
                    existing_defects=filtered_existing_defects,
                )
            )

            # Inject History
            messages = cross_check_history + [
                HumanMessage(
                    content="Here is the input data:\n"
                    + input_data.model_dump_json(indent=2)
                )
            ]

            init_messages = runtime.context.initial_messages
            if init_messages:
                messages = init_messages + messages

            resp = cross_check_agent.invoke(messages)
            print(f"Cross check raw response: {resp}")
            output: DetectDefectOutput = resp["structured_response"]

            if output.defects:
                print(f"Cross check found defects: {output.defects}")
                detected = output.defects
            else:
                print("Cross check found no defects.")

        return {"done_cross_check": True, "raw_defects": detected}

    def defect_validator_node(state: State, runtime: Runtime[Context]) -> dict:
        """Validate detected defects for correctness and quality."""
        user_stories = runtime.context.user_stories
        # Read from gathered raw_defects
        defects = state.get("raw_defects", [])
        # Sort defects to ensure deterministic order for the validator
        defects.sort(key=lambda x: (x.type, sorted(x.story_keys)))

        print(
            f"""
    {"-"*100}
    | Defect Validator Node
    | Number of defects to validate: {len(defects)}
    {"-"*100}
    """
        )

        if not defects:
            print("No defects to validate, skipping validation.")
            return {"done_validation": True, "defects": []}

        validator_input = (
            ValidateDefectsTargetedInput(
                target_user_story=runtime.context.target_story,
                user_stories=user_stories,
                defects=defects,
            )
            if targeted
            else ValidateDefectsInput(
                user_stories=user_stories,
                defects=defects,
            )
        )

        # Inject History
        messages = validator_history + [
            HumanMessage(
                content="Please validate these detected defects:\n"
                + validator_input.model_dump_json(indent=2)
            )
        ]

        init_messages = runtime.context.initial_messages
        if init_messages:
            messages = init_messages + messages

        output: ValidateDefectsOutput = validator_agent.invoke(messages)[
            "structured_response"
        ]

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

        print(
            f"Validated defects: {len(validated_defects)}/{len(defects)} passed validation"
        )

        return {"done_validation": True, "defects": validated_defects}

    def defect_filter_node(state: State, runtime: Runtime[Context]) -> dict:
        """Filter defects to show only high-value, actionable items."""
        # Read from validated defects
        defects = state.get("defects", [])

        print(
            f"""
    {"-"*100}
    | Defect Filter Node
    | Number of defects to filter: {len(defects)}
    {"-"*100}
    """
        )

        if not defects:
            print("No defects to filter, skipping filtering.")
            return {"done_filtering": True, "defects": []}

        filter_input = FilterDefectsInput(defects=defects)

        # Inject History
        messages = filter_history + [
            HumanMessage(
                content="Please filter these defects to show only valuable ones:\n"
                + filter_input.model_dump_json(indent=2)
            )
        ]

        output: FilterDefectsOutput = filter_agent.invoke(messages)[
            "structured_response"
        ]

        # Apply filtering results
        filtered_defects = []
        for decision in output.filter_decisions:
            idx = decision.defect_index
            if idx < len(defects) and decision.should_include:
                filtered_defects.append(defects[idx])
                print(f"Defect {idx}: INCLUDED - {decision.reasoning}")
            else:
                print(f"Defect {idx}: EXCLUDED - {decision.reasoning}")

        print(f"Filtered defects: {len(filtered_defects)}/{len(defects)} included")

        return {"done_filtering": True, "defects": filtered_defects}

    def defect_signer_node(state: State, runtime: Runtime[Context]) -> dict:
        """Final node that delivers the processed defects."""
        defects = state.get("defects", [])
        on_done = runtime.context.on_done

        print(
            f"""
    {"-"*100}
    | Defect Signer Node
    | Number of final defects: {len(defects)}
    {"-"*100}
    """
        )

        if on_done:
            on_done(defects)

        return {"done_signing": True}

    graph = StateGraph(state_schema=State, context_schema=Context)

    # Add all nodes
    graph.add_node("defect_adapter", defect_adapter_node)
    graph.add_node("single_check", single_check_node)
    # graph.add_node("cross_check", cross_check_node)
    graph.add_node("defect_validator", defect_validator_node)
    graph.add_node("defect_filter", defect_filter_node)
    graph.add_node("defect_signer", defect_signer_node)

    # Set entry point
    graph.set_entry_point("defect_adapter")

    # Parallel detection phase
    graph.add_edge("defect_adapter", "single_check")
    # graph.add_edge("defect_adapter", "cross_check")

    # Sequential validation and filtering phase
    graph.add_edge("single_check", "defect_validator")
    # graph.add_edge("cross_check", "defect_validator")
    graph.add_edge("defect_validator", "defect_filter")
    graph.add_edge("defect_filter", "defect_signer")

    # Set finish point
    graph.set_finish_point("defect_signer")

    return graph.compile()
