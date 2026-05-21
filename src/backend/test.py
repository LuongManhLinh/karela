import json


def normalize_data(path, save_path):
    with open(path, "r") as f:
        data = json.load(f)
    defect_ids = set()
    contents = []
    for item in data:
        defect_ids.update(item["target_defect_ids"])
        contents.extend(item["contents"])

    defect_ids = sorted(list(defect_ids))
    contents = sorted(contents, key=lambda x: x["type"])

    data = [
        {
            "defect_ids": defect_ids,
            "contents": contents,
        }
    ]

    with open(save_path, "w") as f:
        json.dump(data, f, indent=2)


def count_proposal_types(path):
    with open(path, "r") as f:
        data = json.load(f)

    type_count = {}
    for item in data:
        for content in item["contents"]:
            ctype = content["type"]
            if ctype not in type_count:
                type_count[ctype] = 0
            type_count[ctype] += 1

    print(f"Proposal type counts for {path}:")
    total = sum(type_count.values())
    print(f"Total: {total}", end="    ")
    for k, v in type_count.items():
        print(f"{k}: {v}", end="    ")
    print("\n")


for i in range(1, 4):
    path = f"data/IntelligenceBank/proposal/gpt/{i}_IB2_proposals.json"
    count_proposal_types(path)

for i in range(1, 4):
    path = f"data/IntelligenceBank/proposal/gemini/{i}_IB2_proposals.json"
    count_proposal_types(path)
