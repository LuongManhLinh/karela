from utils.file_processor import _process_langchain, _process_unstructured
import json

# a, b = _process_unstructured("data/example.md")


# print(json.dumps(a, indent=2))
# print(json.dumps(b, indent=2))

a, b = _process_langchain("data/example.md")
print(json.dumps(a, indent=2))
