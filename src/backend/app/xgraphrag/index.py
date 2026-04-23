import shutil
import os
import json
import subprocess

from app.connection.jira.schemas import StoryDto

from .db.importer import import_from_graphrag_output
from .utils import story_to_doc


def index_user_stories(
    connection_id: str, project_key: str, user_stories: list[StoryDto]
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
    if os.path.exists(folder_path):
        shutil.rmtree(folder_path)
    os.makedirs(folder_path)

    # Copy data/graphrag_root to the new folder
    shutil.copytree("data/graphrag_root", folder_path, dirs_exist_ok=True)

    # For each user story, create a json file inside folder_path/input
    input_folder_path = os.path.join(folder_path, "input")
    for user_story in user_stories:
        file_path = os.path.join(input_folder_path, f"{user_story.key}.json")
        with open(file_path, "w") as f:
            json.dump(
                story_to_doc(user_story),
                f,
                indent=4,
            )

    # Run graphrag index
    subprocess.run(["graphrag", "index"], cwd=folder_path)

    # Import the generated graph data into Neo4j
    import_from_graphrag_output(
        input_dir=os.path.join(folder_path, "output"),
        bucket_name=f"{connection_id}_{project_key}",
    )
