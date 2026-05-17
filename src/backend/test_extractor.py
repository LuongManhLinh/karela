import json
import random


def extract():
    with open("data/IntelligenceBank/500_us.json", "r") as f:
        data = json.load(f)

    # Pick 100 random stories and write to a new file

    sampled_stories = random.sample(data, 100)

    # Sort by story[id]
    sampled_stories.sort(key=lambda x: x["id"])

    with open("data/sample_100_us.json", "w") as f:
        json.dump(sampled_stories, f, indent=2)


def write_to_markdown():
    with open("data/sample_100_us.json", "r") as f:
        data = json.load(f)

    with open("data/sample_100_us.md", "w") as f:
        for story in data:
            f.write(f"## ID: {story['id']}\n")
            f.write(f"### Summary:\n{story['user_story']}\n")
            f.write(f"### Description:\n{story['requirements']}\n\n\n")


if __name__ == "__main__":
    extract()
    write_to_markdown()
