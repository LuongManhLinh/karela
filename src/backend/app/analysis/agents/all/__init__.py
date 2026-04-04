from sqlalchemy.orm import Session

from ..schemas import UserStoryMinimal, DefectInput
from ..output_schemas import DefectByLlm

from langchain_core.runnables import RunnableConfig
from langchain_core.messages import BaseMessage

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
    targeted=False,
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
    user_stories: list[UserStoryMinimal],
    db: Session,
    connection_id: str,
    project_key: str,
    existing_defects: list[DefectInput] = [],
    extra_prompt: str = None,
    initial_messages: list[BaseMessage] = None,
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
            connection_id=connection_id,
            project_key=project_key,
            db=db,
            user_stories=user_stories,
            on_done=on_done,
            existing_defects=existing_defects or [],
            extra_prompt=extra_prompt,
            initial_messages=initial_messages,
        ),
        config=RunnableConfig(max_concurrency=3),
    )

    return res
