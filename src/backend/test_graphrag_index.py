from app.xgraphrag.index import index_user_stories
import json
import os

# Read all json files in data/test
story_dicts = []
for file_name in os.listdir("data/test"):
    if file_name.endswith(".json"):
        with open(os.path.join("data/test", file_name), "r") as f:
            story_dicts.append(json.load(f))

# A simple system context for a Vehicle Booking System, with three main actors are: Passenger, Driver and Admin. The system allows passengers to book rides, drivers to accept and complete rides, and admins to manage the overall system. This context provides a basic understanding of the system's functionality and can be used to generate relevant prompts for indexing the user stories.
# which can be used for testing the indexing process.
# In a real scenario, this would be more detailed and specific to the project being indexed.
system_context = """The Vehicle Booking System is designed to facilitate the booking of rides for passengers, the acceptance and completion of rides by drivers, and the management of the overall system by admins. The main functions of the system include searching rides, booking rides, accepting rides, completing rides, and managing user accounts, etc.. The system is intended to provide a seamless and efficient experience for all users while ensuring the safety and reliability of the service."""

index_user_stories(
    connection_id="sudo",
    project_key="ORG51",
    user_stories=story_dicts,
    system_context=system_context,
)
