import pickle

with open("data/temp.pkl", "rb") as f:
    data = pickle.load(f)

for msg in data["messages"]:
    print("Type:", type(msg))
    print(msg.model_dump_json(indent=2))
