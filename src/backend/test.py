import json

ans = []

with open("data/IntelligenceBank/chat_questions_en.txt", "r") as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    ans.append(
        {
            "id": idx + 1,
            "question": line.strip(),
            "answer": "",
        }
    )

with open("test.json", "w") as f:
    json.dump(ans, f, indent=2)
