import json

with open("data/IntelligenceBank/ac/gemini/resultsx.md", "w") as fw:
    with open(f"data/IntelligenceBank/ac/gemini/1_IB2_ac.json", "r") as f:
        data = json.load(f)
        print(data["description"])
