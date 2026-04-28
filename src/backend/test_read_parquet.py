from itertools import count

import pandas as pd
from graphrag.query.indexer_adapters import (
    read_indexer_entities,
    read_indexer_relationships,
    read_indexer_reports,
    read_indexer_text_units,
    read_indexer_communities,
)
import json

conn_id = "sudo"
project_key = "ORG51"

INPUT_DIR = f".workspace/{conn_id}/{project_key}/output"
LANCEDB_URI = f"{INPUT_DIR}/lancedb"

COMMUNITY_REPORT_TABLE = "community_reports"
ENTITY_TABLE = "entities"
COMMUNITY_TABLE = "communities"
RELATIONSHIP_TABLE = "relationships"
TEXT_UNIT_TABLE = "text_units"
DOCUMENT_TABLE = "documents"
COMMUNITY_LEVEL = 2


# Read ALL and print columns of each table
# community_df = pd.read_parquet(f"{INPUT_DIR}/{COMMUNITY_TABLE}.parquet")
# report_df = pd.read_parquet(f"{INPUT_DIR}/{COMMUNITY_REPORT_TABLE}.parquet")
entity_df = pd.read_parquet(f"{INPUT_DIR}/{ENTITY_TABLE}.parquet")
# # relationship_df = pd.read_parquet(f"{INPUT_DIR}/{RELATIONSHIP_TABLE}.parquet")
# text_unit_df = pd.read_parquet(f"{INPUT_DIR}/{TEXT_UNIT_TABLE}.parquet")
# document_df = pd.read_parquet(f"{INPUT_DIR}/{DOCUMENT_TABLE}.parquet")

# Count entities having text_unit_ids lens
len_to_count = {}
for idx, row in entity_df.iterrows():
    text_unit_ids = row.get("text_unit_ids", [])
    length = len(text_unit_ids)
    if length in len_to_count:
        len_to_count[length] += 1
    else:
        len_to_count[length] = 1

print("Length of text_unit_ids and their counts:")
# Sort by length and print
for length in sorted(len_to_count.keys()):
    count = len_to_count[length]
    print(f"Related to {length} stories, Count: {count}")
