import json


def list_defects_still_exists(orig_defects: list[dict], new_defects: list[dict]):
    """Check if the defect still exists in the new defects list.
    Check by defect["type"] + defect["story_keys"]
    """
    orig_defect_set = set()
    still_exist_defects = []
    for defect in orig_defects:
        key = (defect["type"], tuple(sorted(defect["story_keys"])))
        orig_defect_set.add(key)

    for defect in new_defects:
        key = (defect["type"], tuple(sorted(defect["story_keys"])))
        if key in orig_defect_set:
            still_exist_defects.append(key)

    return still_exist_defects


with open("data/IntelligenceBank/defect/final_defects.json", "r") as f:
    orig_defects = json.load(f)


paths_to_check = [
    "data/IntelligenceBank/proposal/gpt/1_IB2_defects.json",
    "data/IntelligenceBank/proposal/gpt/2_IB2_defects.json",
    "data/IntelligenceBank/proposal/gpt/3_IB2_defects.json",
    "data/IntelligenceBank/proposal/gemini/1_IB2_defects.json",
    "data/IntelligenceBank/proposal/gemini/2_IB2_defects.json",
    "data/IntelligenceBank/proposal/gemini/3_IB2_defects.json",
]

with open("data/IntelligenceBank/proposal/defect_results.md", "w") as f:
    f.write("# Defects Still Exist After Proposals\n\n")
    for path in paths_to_check:
        with open(path, "r") as f2:
            new_defects = json.load(f2)
        still_exist_defects = list_defects_still_exists(orig_defects, new_defects)
        f.write(f"## Path: {path}\n")
        f.write(f"Total defects still exist: {len(still_exist_defects)}\n\n")
        for key in still_exist_defects:
            f.write(f"- Type: {key[0]}, Story Keys: {key[1]}\n")
        f.write("\n")
