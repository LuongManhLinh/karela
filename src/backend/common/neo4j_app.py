from neo4j import GraphDatabase
from common.configs import Neo4jConfig

default_driver = GraphDatabase.driver(
    Neo4jConfig.NEO4J_URI, auth=(Neo4jConfig.NEO4J_USER, Neo4jConfig.NEO4J_PASSWORD)
)
