from app.xgraphrag.index import index_user_stories
import json
import os

# Read all json files in data/test
story_dicts = []
for file_name in os.listdir("data/test"):
    if file_name.endswith(".json"):
        with open(os.path.join("data/test", file_name), "r") as f:
            story_dicts.append(json.load(f))


system_context = """The Vehicle Booking System is designed to facilitate the booking of rides for passengers, the acceptance and completion of rides by drivers, and the management of the overall system by admins. The main functions of the system include searching rides, booking rides, accepting rides, completing rides, and managing user accounts, etc.. The system is intended to provide a seamless and efficient experience for all users while ensuring the safety and reliability of the service."""

index_user_stories(
    connection_id="sudo",
    project_key="ORG51",
    user_stories=story_dicts,
    system_context=system_context,
)
