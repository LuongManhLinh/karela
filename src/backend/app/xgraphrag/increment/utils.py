import yaml
import hashlib
import tiktoken
from pathlib import Path
from langchain_text_splitters import TokenTextSplitter
from typing import List, Dict, Any


def load_settings(settings_path: str) -> Dict[str, Any]:
    """
    Load GraphRAG settings from yaml file.
    """
    path = Path(settings_path)
    if not path.exists():
        raise FileNotFoundError(f"Settings file not found at {settings_path}")

    with open(path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)


def generate_new_text_units(
    document_text: str,
    document_id: str,
    settings: Dict[str, Any],
) -> List[Dict[str, Any]]:
    """
    Generate Text Units from a new/updated document based on chunking settings.
    """

    # 1. Read chunking params from settings
    chunking_config = settings.get("chunking", {})
    chunk_size = chunking_config.get("size", 300)
    chunk_overlap = chunking_config.get("overlap", 100)
    encoding_name = chunking_config.get("encoding_model", "cl100k_base")

    # Backup encoding name if not supported
    try:
        enc = tiktoken.get_encoding(encoding_name)
    except ValueError:
        # Fallback to standard OpenAI encoding used by most
        encoding_name = "cl100k_base"
        enc = tiktoken.get_encoding(encoding_name)

    # 2. Configure Splitter
    splitter = TokenTextSplitter(
        encoding_name=encoding_name, chunk_size=chunk_size, chunk_overlap=chunk_overlap
    )

    # 3. Split the text
    chunks = splitter.split_text(document_text)

    text_units = []

    for chunk in chunks:
        # 4. Hash content to generate idempotent ID
        chunk_id = hashlib.sha256(chunk.encode("utf-8")).hexdigest()

        # 5. Count accurate tokens
        n_tokens = len(enc.encode(chunk))

        # 6. Build Text Unit schema
        text_unit = {
            "id": chunk_id,
            "human_readable_id": None,
            "text": chunk,
            "n_tokens": n_tokens,
            "document_id": document_id,
            "entity_ids": [],
            "relationship_ids": [],
            "covariate_ids": [],
        }

        text_units.append(text_unit)

    return text_units
