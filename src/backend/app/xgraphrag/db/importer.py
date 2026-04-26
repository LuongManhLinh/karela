import pandas as pd
import numpy as np
from common.neo4j_app import default_driver
from neo4j import Driver
import traceback
import re
from ..defines import (
    COMMUNITY_TABLE,
    COMMUNITY_REPORT_TABLE,
    ENTITY_TABLE,
    RELATIONSHIP_TABLE,
    TEXT_UNIT_TABLE,
    DOCUMENT_TABLE,
)
from ..logger import Logger


def clean_df(df: pd.DataFrame):
    """Convert DataFrame to list of dicts, handling NaN and numpy arrays for Neo4j import"""
    df = df.replace({np.nan: None})
    for col in df.columns:
        if df[col].apply(lambda x: isinstance(x, np.ndarray)).any():
            df[col] = df[col].apply(
                lambda x: x.tolist() if isinstance(x, np.ndarray) else x
            )
    return df.to_dict(orient="records")


def create_constraints(driver):
    queries = [
        "CREATE INDEX entity_bucket_title IF NOT EXISTS FOR (e:Entity) ON (e.bucket, e.title)",
        "CREATE INDEX comm_bucket_id IF NOT EXISTS FOR (c:Community) ON (c.bucket, c.community)",
        "CREATE INDEX text_unit_bucket_id IF NOT EXISTS FOR (t:TextUnit) ON (t.bucket, t.id)",
    ]
    with driver.session() as session:
        for q in queries:
            session.run(q)


def import_text_units(driver: Driver, df: pd.DataFrame, bucket_name: str):
    # We just need the id here to make it a node that can be linked to Entities and Communities. The text content will be stored in LanceDB for vector search.
    query = """
    UNWIND $rows AS row
    MERGE (t:TextUnit {id: row.id, bucket: $bucket})
    SET t.id = row.id
    """
    with driver.session() as session:
        session.run(query, rows=clean_df(df), bucket=bucket_name)


def import_entities(driver: Driver, df: pd.DataFrame, bucket_name: str):
    query = """
    UNWIND $rows AS row
    MERGE (e:Entity {title: row.title, bucket: $bucket})
    SET e.id = row.id,
        e.human_readable_id = row.human_readable_id,
        e.type = row.type,
        e.description = row.description,
        e.frequency = row.frequency,
        e.degree = row.degree
    // Add relationship MENTIONED_IN to TextUnits
    WITH e, row
    UNWIND row.text_unit_ids AS tu_id
    MATCH (t:TextUnit {id: tu_id, bucket: $bucket})
    MERGE (e)-[:MENTIONED_IN]->(t)
    """
    with driver.session() as session:
        session.run(query, rows=clean_df(df), bucket=bucket_name)


def _extract_type_and_desc(text):
    if not isinstance(text, str):
        return "RELATED", str(text)

    # Tìm pattern [TYPE] ở đầu câu
    match = re.match(r"^\[(.*?)\]\s*(.*)", text.strip())
    if match:
        return match.group(1).upper(), match.group(2)
    return "RELATED", text


def import_relationships(driver: Driver, df: pd.DataFrame, bucket_name: str):
    df[["relationship_type", "clean_description"]] = df["description"].apply(
        lambda x: pd.Series(_extract_type_and_desc(x))
    )

    # query = """
    # UNWIND $rows AS row
    # MATCH (src:Entity {title: row.source, bucket: $bucket})
    # MATCH (tgt:Entity {title: row.target, bucket: $bucket})

    # CALL apoc.create.relationship(src, row.relationship_type, {
    #     bucket: $bucket,
    #     human_readable_id: row.human_readable_id,
    #     description: row.clean_description,
    #     weight: row.weight,
    #     combined_degree: row.combined_degree,
    #     text_unit_ids: row.text_unit_ids
    # }, tgt) YIELD rel
    # RETURN count(rel)
    # """
    query = """
    UNWIND $rows AS row
    MATCH (src:Entity {title: row.source, bucket: $bucket})
    MATCH (tgt:Entity {title: row.target, bucket: $bucket})

    // The $(row.relationship_type) syntax creates the native type dynamically
    CREATE (src)-[r:$(row.relationship_type) {bucket: $bucket}]->(tgt)
    SET r += {
        human_readable_id: row.human_readable_id,
        description: row.clean_description,
        weight: row.weight,
        combined_degree: row.combined_degree,
        text_unit_ids: row.text_unit_ids
    }"""

    with driver.session() as session:
        session.run(query, rows=clean_df(df), bucket=bucket_name)


def import_communities(driver: Driver, df: pd.DataFrame, bucket_name: str):
    query = """
    UNWIND $rows AS row
    MERGE (c:Community {community: row.community, bucket: $bucket})
    SET c.id = row.id,
        c.human_readable_id = row.human_readable_id,
        c.level = row.level,
        c.parent = row.parent,
        c.children = row.children,
        c.title = row.title,
        c.size = row.size,
        c.period = row.period

    CALL (c, row) {
        UNWIND COALESCE(row.entity_ids, []) AS e_id
        MATCH (e:Entity {id: e_id, bucket: $bucket})
        MERGE (e)-[:BELONGS_TO]->(c)
    }

    CALL (c, row) {
        UNWIND COALESCE(row.text_unit_ids, []) AS tu_id
        MATCH (t:TextUnit {id: tu_id, bucket: $bucket})
        MERGE (c)-[:MENTIONED_IN]->(t)
    }
    """
    with driver.session() as session:
        session.run(query, rows=clean_df(df), bucket=bucket_name)


def import_from_graphrag_output(
    connection_id: str, project_key: str, logger: Logger | None = None
):
    if logger is None:
        logger = Logger(connection_id, project_key)
    logger.info("Importing from Parquet...")
    input_dir = f".workspace/{connection_id}/{project_key}/output"
    bucket_name = f"{connection_id}_{project_key}"

    try:
        text_unit_df = pd.read_parquet(f"{input_dir}/{TEXT_UNIT_TABLE}.parquet")
        entity_df = pd.read_parquet(f"{input_dir}/{ENTITY_TABLE}.parquet")
        relationship_df = pd.read_parquet(f"{input_dir}/{RELATIONSHIP_TABLE}.parquet")
        community_df = pd.read_parquet(f"{input_dir}/{COMMUNITY_TABLE}.parquet")
    except FileNotFoundError as e:
        logger.error(f"Error reading file. Please check the path: {e}")
        return

    try:
        create_constraints(default_driver)

        # Import data in the correct order to satisfy dependencies
        import_text_units(default_driver, text_unit_df, bucket_name)
        logger.info(f"Imported {len(text_unit_df)} TextUnits.")

        import_entities(default_driver, entity_df, bucket_name)
        logger.info(f"Imported {len(entity_df)} Entities.")

        import_relationships(default_driver, relationship_df, bucket_name)
        logger.info(f"Imported {len(relationship_df)} Relationships.")

        import_communities(default_driver, community_df, bucket_name)
        logger.info(f"Imported {len(community_df)} Communities.")

        logger.info("Import completed successfully.")
    except Exception as e:
        logger.error(f"An error occurred during import: {e}")
        traceback.print_exc()
