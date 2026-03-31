from ..schemas import UserStoryMinimal, DefectInput
from ..input_schemas import ContextInput
from ..output_schemas import DefectByLlm

from langchain_core.runnables import RunnableConfig

from .prompts import (
    CROSS_CHECK_SYSTEM_PROMPT,
    SINGLE_CHECK_SYSTEM_PROMPT,
    DEFECT_VALIDATOR_SYSTEM_PROMPT,
    DEFECT_FILTER_SYSTEM_PROMPT,
)
from .fake_history import (
    CROSS_CHECK_FAKE_HISTORY,
    SINGLE_CHECK_FAKE_HISTORY,
    VALIDATOR_FAKE_HISTORY,
    FILTER_FAKE_HISTORY,
)

from ..base.graph import State, Context, build_graph

graph = build_graph(
    targeted=True,
    cross_check_prompt=CROSS_CHECK_SYSTEM_PROMPT,
    single_check_prompt=SINGLE_CHECK_SYSTEM_PROMPT,
    validator_prompt=DEFECT_VALIDATOR_SYSTEM_PROMPT,
    filter_prompt=DEFECT_FILTER_SYSTEM_PROMPT,
    cross_check_history=CROSS_CHECK_FAKE_HISTORY,
    single_check_history=SINGLE_CHECK_FAKE_HISTORY,
    validator_history=VALIDATOR_FAKE_HISTORY,
    filter_history=FILTER_FAKE_HISTORY,
)


def run_analysis(
    target_user_story: UserStoryMinimal,
    user_stories: list[UserStoryMinimal],
    context_input: ContextInput = None,
    existing_defects: list[DefectInput] = [],
    extra_prompt: str = None,
) -> list[DefectByLlm]:
    res = None

    def on_done(defects: list[DefectByLlm]):
        nonlocal res
        res = defects

    graph.invoke(
        State(
            done_adapter=False,
            done_cross_check=False,
            done_single_check=False,
            done_validation=False,
            done_filtering=False,
            done_signing=False,
            raw_defects=[],
            defects=[],
        ),
        context=Context(
            target_story=target_user_story,
            user_stories=user_stories,
            on_done=on_done,
            context_input=context_input,
            existing_defects=existing_defects or [],
            extra_prompt=extra_prompt,
        ),
        config=RunnableConfig(max_concurrency=3),
    )

    return res
