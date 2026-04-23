import pandas as pd
from graphrag.query.indexer_adapters import (
    read_indexer_entities,
    read_indexer_relationships,
    read_indexer_reports,
    read_indexer_text_units,
    read_indexer_communities,
)


INPUT_DIR = ".workspace/515b536d-ab6f-4c9c-9e8e-caf2147d0aed/VBS/output"
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
entity_df = pd.read_parquet(f"{INPUT_DIR}/{ENTITY_TABLE}.parquet")
relationship_df = pd.read_parquet(f"{INPUT_DIR}/{RELATIONSHIP_TABLE}.parquet")
# text_unit_df = pd.read_parquet(f"{INPUT_DIR}/{TEXT_UNIT_TABLE}.parquet")
# document_df = pd.read_parquet(f"{INPUT_DIR}/{DOCUMENT_TABLE}.parquet")

# Log all entity_df[title, type]  to a file and log all relationship_df[source, target, description] to another file

# entity_set = set(entity_df["title"])
# with open("entities.txt", "w") as f:
#     for title in entity_set:
#         f.write(f"{title}\n")

# entity_type_set = set(entity_df["type"])
# with open("entity_types.txt", "w") as f:
#     for entity_type in entity_type_set:
#         f.write(f"{entity_type}\n")

# with open("relationships.txt", "w") as f:
#     for _, row in relationship_df.iterrows():
#         f.write(f"{row['source']} -> {row['target']}: {row['description']}\n")


# Print all columns of relationship
for column in relationship_df.columns:
    print(column)
