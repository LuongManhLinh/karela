from common.neo4j_app import default_driver
from graphrag.index.workflows.create_community_reports import create_community_reports
from graphrag.index.workflows.extract_graph import extract_graph

# Test connection to Neo4j
with default_driver.session() as session:
    result = session.run("RETURN 1 AS test")
    record = result.single()
    print("Neo4j Connection Test Result:", record["test"])
