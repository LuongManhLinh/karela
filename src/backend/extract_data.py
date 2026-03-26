import pandas as pd
import json

data_path = "data/requirements.xlsx"

col_id = "ID"
col_user_story = "User Story"
col_requirements = "Requirements"
col_scenarios = "Manual Scenario"


def extract_data(path=data_path):
    df = pd.read_excel(path)
    data = []
    for _, row in df.iterrows():
        data.append(
            {
                "id": row[col_id],
                "user_story": row[col_user_story],
                "requirements": row[col_requirements],
                "scenarios": row[col_scenarios],
            }
        )
    return data


if __name__ == "__main__":
    with open("data/extracted_data.json", "r") as f:
        data = json.load(f)
    with open("data/extracted_data.md", "w") as f:
        for item in data:
            f.write(f"## ID: {item['id']}\n")
            f.write(f"### User Story:\n{item['user_story']}\n")
            f.write(f"### Requirements:\n{item['requirements']}\n")
            # f.write(f"### Manual Scenario:\n{item['scenarios']}\n\n")
            # Scenarios should be print with a bullet point list
            f.write("### Manual Scenario:\n")
            scenarios = item["scenarios"].split("\n")
            for scenario in scenarios:
                f.write(f"- {scenario}\n")
            f.write("\n")
