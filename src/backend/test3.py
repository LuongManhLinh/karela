import pandas as pd
from graphrag.query.indexer_adapters import (
    read_indexer_entities,
    read_indexer_relationships,
    read_indexer_reports,
    read_indexer_text_units,
    read_indexer_communities,
)


INPUT_DIR = ".workspace/root/EX/output"
LANCEDB_URI = f"{INPUT_DIR}/lancedb"

COMMUNITY_REPORT_TABLE = "community_reports"
ENTITY_TABLE = "entities"
COMMUNITY_TABLE = "communities"
RELATIONSHIP_TABLE = "relationships"
TEXT_UNIT_TABLE = "text_units"
DOCUMENT_TABLE = "documents"
COMMUNITY_LEVEL = 2


# Read ALL and print columns of each table
community_df = pd.read_parquet(f"{INPUT_DIR}/{COMMUNITY_TABLE}.parquet")
# report_df = pd.read_parquet(f"{INPUT_DIR}/{COMMUNITY_REPORT_TABLE}.parquet")
# entity_df = pd.read_parquet(f"{INPUT_DIR}/{ENTITY_TABLE}.parquet")
# relationship_df = pd.read_parquet(f"{INPUT_DIR}/{RELATIONSHIP_TABLE}.parquet")
# text_unit_df = pd.read_parquet(f"{INPUT_DIR}/{TEXT_UNIT_TABLE}.parquet")
# document_df = pd.read_parquet(f"{INPUT_DIR}/{DOCUMENT_TABLE}.parquet")

# print(len(text_unit_df))
# print(len(document_df))

# print("Community Table Columns:", community_df.columns)
# print("Community Report Table Columns:", report_df.columns)
# print("Entity Table Columns:", entity_df.columns)
# print("Relationship Table Columns:", relationship_df.columns)
# print("Text Unit Table Columns:", text_unit_df.columns)
# print("Document Table Columns:", document_df.columns)

# print(document_df.columns)

# # Print first row ["text"] and ["raw_data"] columns
# print("First row of text column:", document_df["text"].iloc[0])
# print("First row of raw_data column:", document_df["raw_data"].iloc[0])
