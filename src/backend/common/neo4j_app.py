from neo4j import GraphDatabase
from common.configs import Neo4jConfig

default_driver = GraphDatabase.driver(
    Neo4jConfig.NEO4J_URI, auth=(Neo4jConfig.NEO4J_USER, Neo4jConfig.NEO4J_PASSWORD)
)


def delete_bucket_safe(bucket_name, driver=default_driver):
    """
    Deletes all nodes and relationships associated with a bucket
    using batching to prevent memory issues.
    """
    # Query for Neo4j 5.x+
    query = """
    MATCH (n)
    WHERE n.bucket = $bucket
    CALL (n) {
        DETACH DELETE n
    } IN TRANSACTIONS OF 1000 ROWS
    """

    try:
        with driver.session() as session:
            print(f"[{bucket_name}] Starting high-performance deletion...")
            session.run(query, bucket=bucket_name)
            print(f"[{bucket_name}] Deletion completed successfully.")
    except Exception as e:
        print(f"[{bucket_name}] Error during deletion: {e}")
