import pandas as pd
import os
from common.neo4j_app import default_driver
from neo4j import Driver


def _format_dataframe(data, columns):
    df = pd.DataFrame(data, columns=columns)

    list_columns = [
        col for col in columns if col.endswith("_ids") or col in ["children"]
    ]
    for col in list_columns:
        if col in df.columns:
            df[col] = df[col].apply(lambda x: x if isinstance(x, list) else [])

    return df


def _get_parquet_dir(connection_id: str, project_key: str):
    return f".workspace/{connection_id}/{project_key}/output"


def _get_bucket_name(connection_id: str, project_key: str):
    return f"{connection_id}_{project_key}"


def get_documents(connection_id: str, project_key: str):
    parquet_dir = _get_parquet_dir(connection_id, project_key)
    try:
        return pd.read_parquet(os.path.join(parquet_dir, "documents.parquet"))
    except FileNotFoundError:
        print(f"documents.parquet not found in {parquet_dir}")
        return pd.DataFrame()


def get_text_units(connection_id: str, project_key: str):
    parquet_dir = _get_parquet_dir(connection_id, project_key)
    try:
        return pd.read_parquet(os.path.join(parquet_dir, "text_units.parquet"))
    except FileNotFoundError:
        print(f"text_units.parquet not found in {parquet_dir}")
        return pd.DataFrame()


def get_community_reports(connection_id: str, project_key: str):
    parquet_dir = _get_parquet_dir(connection_id, project_key)
    try:
        return pd.read_parquet(os.path.join(parquet_dir, "community_reports.parquet"))
    except FileNotFoundError:
        print(f"community_reports.parquet not found in {parquet_dir}")
        return pd.DataFrame()


ENTITY_COLUMNS = [
    "id",
    "human_readable_id",
    "title",
    "type",
    "description",
    "text_unit_ids",
    "frequency",
    "degree",
]

RELATIONSHIP_COLUMNS = [
    "id",
    "human_readable_id",
    "source",
    "target",
    "description",
    "weight",
    "combined_degree",
    "text_unit_ids",
]

COMMUNITY_COLUMNS = [
    "id",
    "human_readable_id",
    "community",
    "level",
    "parent",
    "children",
    "title",
    "entity_ids",
    "relationship_ids",
    "text_unit_ids",
    "period",
    "size",
]


def get_entities(
    connection_id: str,
    project_key: str,
    entity_ids: list[str] = None,
    driver: Driver = default_driver,
):
    bucket_name = _get_bucket_name(connection_id, project_key)

    match_clause = "MATCH (e:Entity {bucket: $bucket})"
    if entity_ids:
        # LƯU Ý: Thêm khoảng trắng trước chữ WHERE
        match_clause += " WHERE e.id IN $entity_ids"

    query = f"""
    {match_clause}
    OPTIONAL MATCH (e)-[:MENTIONED_IN]->(t:TextUnit {{bucket: $bucket}})
    RETURN e.id AS id, 
           e.human_readable_id AS human_readable_id, 
           e.title AS title, 
           e.type AS type, 
           e.description AS description, 
           e.frequency AS frequency, 
           e.degree AS degree,
           collect(DISTINCT t.id) AS text_unit_ids
    """

    with driver.session() as session:
        # Truyền entity_ids or [] để tránh lỗi nếu biến này là None
        data = [
            r.data()
            for r in session.run(query, bucket=bucket_name, entity_ids=entity_ids or [])
        ]

    return _format_dataframe(data, ENTITY_COLUMNS)


# LƯU Ý: Thêm tham số driver
def get_relationships(
    connection_id: str,
    project_key: str,
    relationship_ids: list[str] = None,
    driver: Driver = default_driver,
):
    bucket_name = _get_bucket_name(connection_id, project_key)

    match_clause = "MATCH (src:Entity {bucket: $bucket})-[r:RELATED {bucket: $bucket}]->(tgt:Entity {bucket: $bucket})"
    if relationship_ids:
        # LƯU Ý: Thêm khoảng trắng trước chữ WHERE
        match_clause += " WHERE r.id IN $relationship_ids"

    query = f"""
    {match_clause}
    RETURN r.id AS id, 
           r.human_readable_id AS human_readable_id, 
           src.title AS source, 
           tgt.title AS target, 
           r.description AS description, 
           r.weight AS weight, 
           r.combined_degree AS combined_degree, 
           r.text_unit_ids AS text_unit_ids
    """

    with driver.session() as session:
        # LƯU Ý: Phải truyền relationship_ids vào session.run
        data = [
            r.data()
            for r in session.run(
                query, bucket=bucket_name, relationship_ids=relationship_ids or []
            )
        ]

    return _format_dataframe(data, RELATIONSHIP_COLUMNS)


def get_communities(
    connection_id: str,
    project_key: str,
    community_ids: list[str] = None,
    entity_ids: list[str] = None,
    driver: Driver = default_driver,
):
    """
    Get communities with optional filtering by entity_ids.
    Dynamically resolves entities, relationships, and text units via Graph Traversal
    to guarantee 100% data integrity after re-clustering.
    """
    bucket_name = _get_bucket_name(connection_id, project_key)

    # Pre-filter by entity_ids if provided
    match_clause = "MATCH (c:Community {bucket: $bucket})"
    if community_ids:
        match_clause += """
        MATCH (c:Community {bucket: $bucket})
        WHERE c.id IN $community_ids
        """
    if entity_ids:
        match_clause += """
        MATCH (e_filter:Entity {bucket: $bucket})-[:BELONGS_TO]->(c)
        WHERE e_filter.id IN $entity_ids
        """

    query = f"""
    {match_clause}
    
    // 1. DYNAMIC ENTITIES: Find all entities belonging to this community
    CALL (c) {{
        MATCH (e:Entity {{bucket: $bucket}})-[:BELONGS_TO]->(c)
        RETURN collect(DISTINCT e.id) AS dynamic_entity_ids
    }}
    
    // 2. DYNAMIC RELATIONSHIPS: Find all relationships connected to the entities in this community
    // GraphRAG needs edges to understand how community members interact.
    CALL (c) {{
        MATCH (e:Entity {{bucket: $bucket}})-[:BELONGS_TO]->(c)
        // Find any RELATED edge connected to these entities
        MATCH (e)-[r:RELATED]-(:Entity {{bucket: $bucket}})
        RETURN collect(DISTINCT r.id) AS dynamic_relationship_ids
    }}
    
    // 3. DYNAMIC TEXT UNITS: Find all text units that mention the entities in this community
    CALL (c) {{
        MATCH (e:Entity {{bucket: $bucket}})-[:BELONGS_TO]->(c)
        MATCH (e)-[:MENTIONED_IN]->(t:TextUnit {{bucket: $bucket}})
        RETURN collect(DISTINCT t.id) AS dynamic_text_unit_ids
    }}
    
    RETURN c.id AS id, 
           c.human_readable_id AS human_readable_id, 
           c.community AS community, 
           c.level AS level, 
           c.parent AS parent, 
           c.children AS children,
           c.title AS title, 
           c.period AS period, 
           c.size AS size,
           // Inject the dynamically calculated arrays
           dynamic_entity_ids AS entity_ids,
           dynamic_relationship_ids AS relationship_ids,
           dynamic_text_unit_ids AS text_unit_ids
    """

    with driver.session() as session:
        data = [
            r.data()
            for r in session.run(
                query,
                bucket=bucket_name,
                community_ids=community_ids or [],
                entity_ids=entity_ids or [],
            )
        ]

    # Assume _format_dataframe handles filling empty lists [] for NaN/None
    return _format_dataframe(data, COMMUNITY_COLUMNS)
