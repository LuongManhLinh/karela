import json

folder1 = "data/IntelligenceBank/defect/gemini"
folder2 = "data/IntelligenceBank/defect/gpt"

count = 5


def process_data(data: list[dict]):
    defect_type_count = {}
    for d in data:
        dtype = d["type"]
        if dtype not in defect_type_count:
            defect_type_count[dtype] = 0
        defect_type_count[dtype] += 1
    return defect_type_count


for idx in range(count):
    file_path = f"{folder1}/{idx + 1}_IB2_defects.json"
    with open(file_path, "r") as f:
        data = json.load(f)
    defect_type_count = process_data(data)
    print(f"File: {file_path}")
    for k in sorted(defect_type_count.keys()):
        print(f"{k}: {defect_type_count[k]}")
    print()

print("=" * 40)
for idx in range(count):
    file_path = f"{folder2}/{idx + 1}_IB2_defects.json"
    with open(file_path, "r") as f:
        data = json.load(f)
    defect_type_count = process_data(data)
    print(f"File: {file_path}")
    for k in sorted(defect_type_count.keys()):
        print(f"{k}: {defect_type_count[k]}")
    print()
