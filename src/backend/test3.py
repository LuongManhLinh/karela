from utils.file_processor import _process_langchain
import json

for c in _process_langchain("data/stories_s.md"):
    print(json.dumps(c, indent=4))
