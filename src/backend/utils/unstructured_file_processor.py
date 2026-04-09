from unstructured.partition.auto import partition
from unstructured.chunking.title import chunk_by_title
from unstructured.documents.elements import Element
from unstructured_client import UnstructuredClient
from unstructured_client.models import shared, operations
from unstructured_client.models.errors import SDKError
import os
from typing import Literal
from pydantic import BaseModel
import base64
import zlib
import json
from common.configs import UnstructuredConfig


os.environ["CUDA_VISIBLE_DEVICES"] = ""


def process_document(
    extension: Literal["pdf", "docx", "txt", "md", "doc"],
    file_path: str | None = None,
    file_binary: bytes | None = None,
    max_characters=2000,
    combine_text_under_n_chars=500,
    new_after_n_chars=1500,
    languages=["en", "vi"],
    # non_pdf_strategy: Literal["langchain", "unstructured"] = "langchain",
) -> tuple[list[dict], list[dict]]:
    """Main function to process a document and return chunks with header metadata.

    Returns a tuple of (chunks, headers) where:
        - chunks: A list of dictionaries, each containing 'metadata' (a dict of header levels and their text) and 'content' (the chunk's text).
        - headers: A list of dictionaries representing the header hierarchy in the document, where each dictionary has keys like '#', '##', etc. corresponding to header levels and their text.
    """
    if not file_path and not file_binary:
        raise ValueError("Either file_path or file_binary must be provided.")

    print(f"Processing document with extension {extension} using Unstructured API...")
    if extension in ["docx", "txt", "md", "doc"]:
        return _process_unstructured(
            file_path=file_path,
            file_binary=file_binary,
            max_characters=max_characters,
            combine_text_under_n_chars=combine_text_under_n_chars,
            new_after_n_chars=new_after_n_chars,
            languages=languages,
        )
    else:
        return _call_unstructured_api(
            file_path=file_path,
            file_binary=file_binary,
            max_characters=max_characters,
            combine_text_under_n_chars=combine_text_under_n_chars,
            new_after_n_chars=new_after_n_chars,
            languages=languages,
        )


def _call_unstructured_api(
    file_path: str | None = None,
    file_binary: bytes | None = None,
    max_characters=2000,
    combine_text_under_n_chars=500,
    new_after_n_chars=1500,
    languages=["en", "vi"],
):
    if file_path:
        with open(file_path, "rb") as f:
            files = shared.Files(
                content=f.read(),
                file_name=file_path,
            )
    elif file_binary:
        files = shared.Files(
            content=file_binary,
            file_name="uploaded_file",
        )
    else:
        raise ValueError("Either file_path or file_binary must be provided.")

    params = shared.PartitionParameters(
        files=files,
        strategy="hi_res",
        chunking_strategy="by_title",  # <--- Chunking happens on the server!
        include_orig_elements=True,
        max_characters=max_characters,
        combine_under_n_chars=combine_text_under_n_chars,
        new_after_n_chars=new_after_n_chars,
        languages=languages,
        multipage_sections=True,  # Allows sections to span multiple pages
    )

    req = operations.PartitionRequest(
        partition_parameters=params, unstructured_api_key=UnstructuredConfig.API_KEY
    )

    try:
        with UnstructuredClient() as s:
            res = s.general.partition(request=req)
        return _build_chunks_dict_with_header_metadata(res.elements)
    except SDKError as e:
        print(f"Error processing {file_path} with Unstructured API: {e}")
        return [], []


def _process_unstructured(
    file_path: str | None = None,
    file_binary: bytes | None = None,
    max_characters=2000,
    combine_text_under_n_chars=500,
    new_after_n_chars=1500,
    languages=["en", "vi"],
):
    # 1. Partition: Identifies what is a Title, NarrativeText, List, etc.
    if file_path:
        elements = partition(
            filename=file_path,
            languages=languages,
        )
    elif file_binary:
        elements = partition(
            file=file_binary,
            languages=languages,
        )
    else:
        raise ValueError("Either file_path or file_binary must be provided.")

    # 2. Logical Chunking:
    # This specifically looks for 'Titles' and starts a new chunk there.
    # It ensures a sub-section doesn't get split across chunks.
    chunks = chunk_by_title(
        elements,
        max_characters=max_characters,
        combine_text_under_n_chars=combine_text_under_n_chars,
        new_after_n_chars=new_after_n_chars,
        multipage_sections=True,  # Allows sections to span multiple pages
    )

    return _build_chunks_obj_with_header_metadata(chunks)


class PseudoElement(BaseModel):
    id: str
    text: str


def _build_chunks_obj_with_header_metadata(chunks: list[Element]):
    id_to_parent = {}
    header_level = {}
    id_to_elem = {}

    results = []
    header_1_ids = []

    for chunk in chunks:
        chunk_headers = []

        highest_header = 10
        highest_header_id = None
        local_header_ids = []

        for e in chunk.metadata.orig_elements:
            e_id = e.id
            id_to_elem[e_id] = e

            if e.category == "Title":
                parent_id = e.metadata.parent_id
                local_header_ids.append(e_id)
                if parent_id:
                    id_to_parent[e_id] = parent_id
                    header = header_level[parent_id] + 1
                    header_level[e_id] = header
                    if header < highest_header:
                        highest_header = header
                        highest_header_id = e_id
                else:
                    header = 1
                    header_level[e_id] = 1
                    highest_header = 1
                    header_1_ids.append(e_id)
                chunk_headers.append({header * "#": e.text})

        # If no headers are found, take the first 20 words as a pseudo-header
        if not chunk_headers:
            title_elem = None
            for orig_elem in chunk.metadata.orig_elements:
                parent_id = orig_elem.metadata.parent_id
                found = False

                while parent_id:
                    elem = id_to_elem.get(parent_id)
                    if elem and elem.category == "Title":
                        title_elem = elem
                        found = True
                        break
                    parent_id = elem.metadata.parent_id
                if found:
                    break

            if title_elem:
                highest_header_id = title_elem.id
                highest_header = header_level[highest_header_id]
                chunk_headers.append(
                    {highest_header * "#": id_to_elem[highest_header_id].text}
                )

            else:
                pseudo_header = " ".join(chunk.text.split()[:20])
                chunk_headers.append({"#": pseudo_header})
                id_to_elem[chunk.id] = PseudoElement(id=chunk.id, text=pseudo_header)
                header_1_ids.append(chunk.id)

        if highest_header_id:
            while highest_header > 1:
                highest_header_id = id_to_parent[highest_header_id]
                highest_header = header_level[highest_header_id]
                chunk_headers.append(
                    {highest_header * "#": id_to_elem[highest_header_id].text}
                )
        # Sort headers by their level (e.g., # before ##)
        chunk_headers.sort(key=lambda x: len(list(x.keys())[0]))

        results.append({"headers": chunk_headers, "content": chunk.text})

    # Build a table of headers
    id_to_children = {}
    for child_id, parent_id in id_to_parent.items():
        if parent_id not in id_to_children:
            id_to_children[parent_id] = []
        id_to_children[parent_id].append(child_id)

    headers = []

    def create_headers(header_id, level):
        header = {
            "level": "#" * level,
            "text": id_to_elem[header_id].text,
        }
        children_headers = []

        for child_id in id_to_children.get(header_id, []):
            children_headers.append(create_headers(child_id, level + 1))
        if children_headers:
            header["children"] = children_headers
        return header

    for header_1_id in header_1_ids:
        headers.append(create_headers(header_1_id, 1))

    return results, headers


def _build_chunks_dict_with_header_metadata(chunks: list[dict]):
    id_to_parent = {}
    header_level = {}
    id_to_elem = {}

    results = []
    header_1_ids = []

    for chunk in chunks:
        chunk_headers = []

        highest_header = 10
        highest_header_id = None

        orig_elements_base64 = chunk["metadata"].get("orig_elements")
        decoded = base64.b64decode(orig_elements_base64)
        decompressed = zlib.decompress(decoded)
        orig_elements = json.loads(decompressed.decode("utf-8"))

        for e in orig_elements:
            if e.get("type") == "Title":
                e_id = e["element_id"]
                parent_id = e["metadata"].get("parent_id")
                id_to_elem[e_id] = e
                if parent_id:
                    id_to_parent[e_id] = parent_id
                    header = header_level[parent_id] + 1
                    header_level[e_id] = header
                    if header < highest_header:
                        highest_header = header
                        highest_header_id = e_id
                else:
                    header = 1
                    header_level[e_id] = 1
                    highest_header = 1
                    header_1_ids.append(e_id)
                chunk_headers.append({header * "#": e["text"]})

        if highest_header_id:
            while highest_header > 1:
                highest_header_id = id_to_parent[highest_header_id]
                highest_header = header_level[highest_header_id]
                chunk_headers.append(
                    {highest_header * "#": id_to_elem[highest_header_id]["text"]}
                )

        # If no headers are found, take the first 20 words as a pseudo-header
        if not chunk_headers:
            title_elem = None
            for orig_elem in orig_elements:
                parent_id = orig_elem.get("metadata", {}).get("parent_id")
                found = False

                while parent_id:
                    elem = id_to_elem.get(parent_id)
                    if elem and elem.get("type") == "Title":
                        title_elem = elem
                        found = True
                        break
                    if not elem:
                        break
                    parent_id = elem.get("metadata", {}).get("parent_id")
                if found:
                    break

            if title_elem:
                highest_header_id = title_elem["element_id"]
                highest_header = header_level[highest_header_id]
                chunk_headers.append(
                    {highest_header * "#": id_to_elem[highest_header_id]["text"]}
                )
            else:
                pseudo_header = " ".join(chunk["text"].split()[:20])
                chunk_headers.append({"#": pseudo_header})
                e_id = chunk["element_id"]
                id_to_elem[e_id] = {"element_id": e_id, "text": pseudo_header}
                header_1_ids.append(e_id)

        if highest_header_id:
            while highest_header > 1:
                highest_header_id = id_to_parent[highest_header_id]
                highest_header = header_level[highest_header_id]
                chunk_headers.append(
                    {highest_header * "#": id_to_elem[highest_header_id]["text"]}
                )

        # Sort headers by their level (e.g., # before ##)
        chunk_headers.sort(key=lambda x: len(list(x.keys())[0]))

        results.append({"headers": chunk_headers, "content": chunk["text"]})

    # Build a table of headers
    id_to_children = {}
    for child_id, parent_id in id_to_parent.items():
        if parent_id not in id_to_children:
            id_to_children[parent_id] = []
        id_to_children[parent_id].append(child_id)

    headers = []

    def create_headers(header_id, level):
        header = {
            "level": "#" * level,
            "text": id_to_elem[header_id]["text"],
        }
        children_headers = []

        for child_id in id_to_children.get(header_id, []):
            children_headers.append(create_headers(child_id, level + 1))
        if children_headers:
            header["children"] = children_headers
        return header

    for header_1_id in header_1_ids:
        headers.append(create_headers(header_1_id, 1))

    return results, headers
