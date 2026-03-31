from utils.file_processor import _process_unstructured
import pickle
from unstructured.documents.elements import Element
import json

# with open("data/elements.pkl", "rb") as f:
#     elements: list[Element] = pickle.load(f)

chunks = _process_unstructured("data/stories_s.md")


def build_chunks_with_header_metadata(chunks: list[Element]):
    header_hierarchy = {}
    header_marker = {}
    id_to_elem = {}

    results = []

    for chunk in chunks:
        metadata = {}
        highest_header = 10
        highest_header_id = None
        for e in chunk.metadata.orig_elements:
            if e.category == "Title":
                parent_id = e.metadata.parent_id
                id_to_elem[e.id] = e
                if parent_id:
                    header_hierarchy[e.id] = parent_id
                    header = header_marker[parent_id] + 1
                    header_marker[e.id] = header
                    if header < highest_header:
                        highest_header = header
                        highest_header_id = e.id
                else:
                    header = 1
                    header_marker[e.id] = 1
                    highest_header = 1
                metadata[f"Header {header}"] = e.text

        if highest_header_id:
            while highest_header > 1:
                highest_header_id = header_hierarchy[highest_header_id]
                highest_header = header_marker[highest_header_id]
                metadata[f"Header {highest_header}"] = id_to_elem[
                    highest_header_id
                ].text

        results.append({"metadata": metadata, "content": chunk.text})
    return results


for c in build_chunks_with_header_metadata(chunks):
    print(json.dumps(c, indent=4))
