from app.xgraphrag.index import index_user_stories
import json

with open("data/extracted_data.json", "r") as f:
    stories = json.load(f)

story_dicts = [
    {
        "key": f"EX-{story['id']}",
        "summary": story["user_story"] or f"Story {story['id']}",
        "full_content": f"KEY: EX-{story['id']}\n\nSUMMARY: {story['user_story']}\n\nDESCRIPTION:\n{story['requirements']}",
    }
    for story in stories[:10]
]

index_user_stories(
    connection_id="root",
    project_key="EX",
    user_stories=story_dicts,
)
