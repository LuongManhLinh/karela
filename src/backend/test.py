from utils.file_processor import process_document
import json


a, b = process_document(
    extension="md",
    file_path="data/x.md",
    max_characters=500,
    combine_text_under_n_chars=20,
)
for chunk in a:
    print(json.dumps(chunk["metadata"], indent=2))
    print("Len of content:", len(chunk["content"]))
    print("Content:", chunk["content"][:50], "...", chunk["content"][-50:])
print("===" * 20)
print(json.dumps(b, indent=2))
