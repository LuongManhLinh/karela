import pandas as pd
from graphrag.query.indexer_adapters import (
    read_indexer_entities,
    read_indexer_relationships,
    read_indexer_reports,
    read_indexer_text_units,
    read_indexer_communities,
)

conn_id = "sudo"
project_key = "ORG31"

DIR = f".workspace/{conn_id}/{project_key}/output"
LANCEDB_URI = f"{DIR}/lancedb"

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
entity_df = pd.read_parquet(f"{DIR}/{ENTITY_TABLE}.parquet")
relationship_df = pd.read_parquet(f"{DIR}/{RELATIONSHIP_TABLE}.parquet")
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

# Print each value of first entity_df row in a line
# for col in entity_df.columns:
#     print(f"{col}: {entity_df.iloc[0][col]}")


# For each entity, write to file: title\ntype\ndescription\n\n\n if type != "KEY"
with open(f"{DIR}/entities_detailed.txt", "w") as f:
    for _, row in entity_df.iterrows():
        if row["type"] != "KEY":
            f.write(
                f"Title: {row['title']}\nType: {row['type']}\nDescription: {row['description']}\n\n\n"
            )

# For each relationship, write to file: source -> target\ndescription\n\n\n
# If source or target is not type "KEY", also write the type of source and target in the format: source (type) -> target (type)\ndescription\n\n\n
with open(f"{DIR}/relationships_detailed.txt", "w") as f:
    for _, row in relationship_df.iterrows():
        source_type = entity_df[entity_df["title"] == row["source"]]["type"].values
        target_type = entity_df[entity_df["title"] == row["target"]]["type"].values
        if len(source_type) > 0 and len(target_type) > 0:
            source_type = source_type[0]
            target_type = target_type[0]
            if source_type != "KEY" and target_type != "KEY":
                f.write(
                    f"{row['source']} ({source_type}) -> {row['target']} ({target_type})\nDescription: {row['description']}\n\n\n"
                )
