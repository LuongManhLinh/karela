import shutil
import os
import json
import subprocess


def index_user_stories(connection_id: str, project_key: str, user_stories: list[dict]):
    """Index user stories using graphrag.
    Expected user story format:

        {
            "key": "VBS-123",
            "summary": "User story summary",
            "full_content": summary + description,
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
    for i, user_story in enumerate(user_stories):
        file_path = os.path.join(input_folder_path, f"user_story_{i}.json")
        with open(file_path, "w") as f:
            json.dump(user_story, f, indent=4)

    # Run graphrag index
    subprocess.run(["graphrag", "index"], cwd=folder_path)
