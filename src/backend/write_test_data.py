conflict = [["VBS-1", "VBS-2"], ["VBS-3", "VBS-4"]]
duplication = [["VBS-301", "VBS-302"], ["VBS-401", "VBS-402"]]

not_independent = ["VBS-801", "VBS-802"]
not_valuable = ["VBS-501", "VBS-502"]
not_estimable = ["VBS-701", "VBS-702"]
not_small = ["VBS-601", "VBS-602"]

test_data_folder = "data/test"

# Write all test data to a single file
# Read each {key}.json file in data/test, write data["full_content"]
# Also write the kind of defect above each

import json
import os

with open(os.path.join(test_data_folder, "test_data.md"), "w") as f:
    f.write("# Conflict User Stories\n")
    for pair in conflict:
        f.write(f"## {pair[0]} and {pair[1]}\n")
        for key in pair:
            file_path = os.path.join(test_data_folder, f"{key}.json")
            with open(file_path, "r") as json_file:
                data = json.load(json_file)
                f.write(f"### {key}\n")
                f.write(f"{data['full_content']}\n\n")

    f.write("# Duplication User Stories\n")
    for pair in duplication:
        f.write(f"## {pair[0]} and {pair[1]}\n")
        for key in pair:
            file_path = os.path.join(test_data_folder, f"{key}.json")
            with open(file_path, "r") as json_file:
                data = json.load(json_file)
                f.write(f"### {key}\n")
                f.write(f"{data['full_content']}\n\n")

    f.write("# Not Independent User Stories\n")
    for key in not_independent:
        file_path = os.path.join(test_data_folder, f"{key}.json")
        with open(file_path, "r") as json_file:
            data = json.load(json_file)
            f.write(f"## {key}\n")
            f.write(f"{data['full_content']}\n\n")

    f.write("# Not Valuable User Stories\n")
    for key in not_valuable:
        file_path = os.path.join(test_data_folder, f"{key}.json")
        with open(file_path, "r") as json_file:
            data = json.load(json_file)
            f.write(f"## {key}\n")
            f.write(f"{data['full_content']}\n\n")

    f.write("# Not Estimable User Stories\n")
    for key in not_estimable:
        file_path = os.path.join(test_data_folder, f"{key}.json")
        with open(file_path, "r") as json_file:
            data = json.load(json_file)
            f.write(f"## {key}\n")
            f.write(f"{data['full_content']}\n\n")

    f.write("# Not Small User Stories\n")
    for key in not_small:
        file_path = os.path.join(test_data_folder, f"{key}.json")
        with open(file_path, "r") as json_file:
            data = json.load(json_file)
            f.write(f"## {key}\n")
            f.write(f"{data['full_content']}\n\n")
