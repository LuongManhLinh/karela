from unstructured.partition.auto import partition
from unstructured.chunking.title import chunk_by_title
from unstructured.documents.elements import Element
from unstructured_client import UnstructuredClient
from unstructured_client.models import shared, operations
from unstructured_client.models.errors import SDKError
import os
from typing import Literal
from langchain_text_splitters import (
    MarkdownHeaderTextSplitter,
    RecursiveCharacterTextSplitter,
)
from markitdown import MarkItDown
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


def _process_langchain(
    file_path,
    max_characters=2000,
    chunk_overlap=50,
):
    extension = "md"

    if extension == ".docx":
        markdown_text = MarkItDown().convert(file_path).markdown
    else:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            markdown_text = f.read()

    headers_to_split_on = [
        ("#", "#"),
        ("##", "##"),
        ("###", "###"),
        ("####", "####"),
    ]

    header_splitter = MarkdownHeaderTextSplitter(
        headers_to_split_on=headers_to_split_on,
        strip_headers=False,
    )
    header_splits = header_splitter.split_text(markdown_text)

    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=max_characters, chunk_overlap=chunk_overlap
    )

    final_chunks = text_splitter.split_documents(header_splits)
    return [
        {"metadata": chunk.metadata, "content": chunk.page_content}
        for chunk in final_chunks
    ]


class PseudoElement(BaseModel):
    id: str
    text: str


def _build_chunks_obj_with_header_metadata(chunks: list[Element]):
    header_hierarchy = {}
    header_marker = {}
    id_to_elem = {}

    results = []
    header_1_ids = []
    for chunk in chunks:
        metadata = {}
        highest_header = 10
        highest_header_id = None
        for e in chunk.metadata.orig_elements:
            e_id = e.id
            if e.category == "Title":
                parent_id = e.metadata.parent_id
                id_to_elem[e_id] = e
                if parent_id:
                    header_hierarchy[e_id] = parent_id
                    header = header_marker[parent_id] + 1
                    header_marker[e_id] = header
                    if header < highest_header:
                        highest_header = header
                        highest_header_id = e_id
                else:
                    header = 1
                    header_marker[e_id] = 1
                    highest_header = 1
                    header_1_ids.append(e_id)
                metadata[header * "#"] = e.text

        if highest_header_id:
            while highest_header > 1:
                highest_header_id = header_hierarchy[highest_header_id]
                highest_header = header_marker[highest_header_id]
                metadata[header * "#"] = id_to_elem[highest_header_id].text

        # If no headers are found, take the first 20 words as a pseudo-header
        if not metadata:
            pseudo_header = " ".join(chunk.text.split()[:20])
            metadata["#"] = pseudo_header
            id_to_elem[chunk.id] = PseudoElement(id=chunk.id, text=pseudo_header)
            header_1_ids.append(chunk.id)

        results.append({"metadata": metadata, "content": chunk.text})

    # Build a table of headers
    id_to_children = {}
    for child_id, parent_id in header_hierarchy.items():
        if parent_id not in id_to_children:
            id_to_children[parent_id] = []
        id_to_children[parent_id].append(child_id)

    headers = []

    # Append all top-level headers (Header 1)
    # For example:
    # Header 1: Introduction
    # Header 2: Background (child of Introduction)
    # Header 3: Details (child of Background)
    # Header 4: More Details (child of Details)
    # Header 2: Methodology (child of Introduction)
    # Header 3: Data Collection (child of Methodology)
    def add_headers(header_id, level):
        headers.append({f"{level * '#'}": id_to_elem[header_id].text})
        for child_id in id_to_children.get(header_id, []):
            add_headers(child_id, level + 1)

    for header_1_id in header_1_ids:
        add_headers(header_1_id, 1)

    return results, headers


def _build_chunks_dict_with_header_metadata(chunks: list[dict]):
    print("Processing num chunks returned by Unstructured API:", len(chunks))
    header_hierarchy = {}
    header_marker = {}
    id_to_elem = {}

    results = []
    header_1_ids = []

    for chunk in chunks:
        metadata = {}
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
                    header_hierarchy[e_id] = parent_id
                    header = header_marker[parent_id] + 1
                    header_marker[e_id] = header
                    if header < highest_header:
                        highest_header = header
                        highest_header_id = e_id
                else:
                    header = 1
                    header_marker[e_id] = 1
                    highest_header = 1
                    header_1_ids.append(e_id)
                metadata[header * "#"] = e["text"]

        if highest_header_id:
            while highest_header > 1:
                highest_header_id = header_hierarchy[highest_header_id]
                highest_header = header_marker[highest_header_id]
                metadata[header * "#"] = id_to_elem[highest_header_id]["text"]
        # If no headers are found, take the first 20 words as a pseudo-header
        if not metadata:
            pseudo_header = " ".join(chunk["text"].split()[:20])
            metadata["#"] = pseudo_header
            e_id = chunk["element_id"]
            id_to_elem[e_id] = {"id": e_id, "text": pseudo_header}
            header_1_ids.append(e_id)
        results.append({"metadata": metadata, "content": chunk["text"]})

    headers = []
    # Build a table of headers
    id_to_children = {}
    for child_id, parent_id in header_hierarchy.items():
        if parent_id not in id_to_children:
            id_to_children[parent_id] = []
        id_to_children[parent_id].append(child_id)

    def add_headers(header_id, level):
        headers.append({f"{level * '#'}": id_to_elem[header_id]["text"]})
        for child_id in id_to_children.get(header_id, []):
            add_headers(child_id, level + 1)

    for header_1_id in header_1_ids:
        add_headers(header_1_id, 1)
    print("Extracted headers from document:", headers)
    return results, headers
