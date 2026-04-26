import shutil
import os
import json
import subprocess

from app.connection.jira.schemas import StoryDto

from .clean import clean_entities_and_relationships

from ..db.importer import import_from_graphrag_output
from ..utils import story_to_doc
from ..logger import Logger


def _index_phase(folder_path: str, phase: int):
    # Rename settings_1.yaml to settings.yaml
    os.rename(
        os.path.join(folder_path, f"settings_{phase}.yaml"),
        os.path.join(folder_path, "settings.yaml"),
    )

    # Run graphrag index
    subprocess.run(["graphrag", "index"], cwd=folder_path)

    # Rename settings.yaml back to settings_1.yaml
    os.rename(
        os.path.join(folder_path, "settings.yaml"),
        os.path.join(folder_path, f"settings_{phase}.yaml"),
    )


def _index_phase_1(folder_path: str):
    _index_phase(folder_path, phase=1)


def _index_phase_2(folder_path: str):
    _index_phase(folder_path, phase=2)


def _write_user_stories_to_files(user_stories: list[StoryDto | dict], folder_path: str):
    input_folder_path = os.path.join(folder_path, "input")
    for user_story in user_stories:
        if isinstance(user_story, StoryDto):
            key = user_story.key
            item = story_to_doc(user_story)
        else:
            key = user_story["key"]
            item = user_story
        file_path = os.path.join(input_folder_path, f"{key}.json")
        with open(file_path, "w") as f:
            json.dump(
                item,
                f,
                indent=4,
            )


def _update_prompts_with_system_context(folder_path: str, system_context: str):
    # Update prompts with system context
    extract_graph_context = f"-Global System Context-\n{system_context}"
    community_context = f"# Global System Context\n{system_context}"

    extract_graph_path = os.path.join(folder_path, "prompts", "extract_graph.txt")
    community_report_graph_path = os.path.join(
        folder_path, "prompts", "community_report_graph.txt"
    )
    community_report_text_path = os.path.join(
        folder_path, "prompts", "community_report_text.txt"
    )

    # Read the existing prompt files
    with open(extract_graph_path, "r") as f:
        extract_graph_prompt = f.read()
    with open(community_report_graph_path, "r") as f:
        community_report_graph_prompt = f.read()
    with open(community_report_text_path, "r") as f:
        community_report_text_prompt = f.read()

    # Update the prompts with the system context
    # Cannot use format because there are more {}. So we just use replace
    extract_graph_prompt = extract_graph_prompt.replace(
        "{system_context}", extract_graph_context
    )
    community_report_graph_prompt = community_report_graph_prompt.replace(
        "{system_context}", community_context
    )
    community_report_text_prompt = community_report_text_prompt.replace(
        "{system_context}", community_context
    )

    # Write the updated prompts back to the files
    with open(extract_graph_path, "w") as f:
        f.write(extract_graph_prompt)
    with open(community_report_graph_path, "w") as f:
        f.write(community_report_graph_prompt)
    with open(community_report_text_path, "w") as f:
        f.write(community_report_text_prompt)


def index_user_stories(
    connection_id: str,
    project_key: str,
    user_stories: list[StoryDto | dict],
    system_context: str | None = None,
):
    """Index user stories using graphrag.
    Expected user story format:

        {
            "key": "STR-123",
            "full_content": key + summary + description,
        }

    Please run this function in a separate thread or process to avoid blocking the main thread, as it will run a subprocess that may take some time to complete.
    """
    # Create folder .workspace/connection_id/project_key if not exists
    # If exists, remove it first
    folder_path = f".workspace/{connection_id}/{project_key}"
    logger = Logger(connection_id=connection_id, project_key=project_key)

    # if os.path.exists(folder_path):
    #     print(
    #         f"Folder {folder_path} already exists. Removing it for a clean indexing process."
    #     )
    #     shutil.rmtree(folder_path)
    # os.makedirs(folder_path)

    # # Copy data/graphrag_root to the new folder
    # shutil.copytree("data/graphrag_root", folder_path, dirs_exist_ok=True)

    # os.makedirs(f"{folder_path}/input", exist_ok=True)
    # os.makedirs(f"{folder_path}/logs", exist_ok=True)

    # logger.info(
    #     f"Starting indexing process for project {project_key} with {len(user_stories)} user stories."
    # )

    # # For each user story, create a json file inside folder_path/input
    # _write_user_stories_to_files(user_stories, folder_path)

    # if system_context:
    #     logger.info("Updating prompts with system context...")
    #     _update_prompts_with_system_context(folder_path, system_context)

    # logger.info(f"Processing phase 1 indexing for {len(user_stories)} user stories...")
    # _index_phase_1(folder_path)

    logger.info("Cleaning entities and relationships...")
    clean_entities_and_relationships(folder_path, logger)

    logger.info(f"Processing phase 2 indexing for {len(user_stories)} user stories...")
    _index_phase_2(folder_path)

    # Import the generated graph data into Neo4j
    import_from_graphrag_output(
        connection_id=connection_id,
        project_key=project_key,
        logger=logger,
    )
