from neo4j import Driver
import pandas as pd
from ..db.importer import clean_df


class Neo4jProcessor:
    """
    Phase 2: In-DB Clustering using Neo4j Graph Data Science (GDS).
    Zero LLM cost. Uses Leiden algorithm directly in database memory.
    """

    def __init__(self, neo4j_driver: Driver, bucket_name: str):
        self.driver = neo4j_driver
        self.bucket_name = bucket_name
        self.graph_name = f"scrumGraph_{self.bucket_name}"

    def import_new_entities(self, entity_df: pd.DataFrame):
        """
        Import entities from new text units.
        Optimized: Removed 'text_unit_ids' array property entirely.
        Relies purely on the MENTIONED_IN graph edges.
        """
        query = """
        UNWIND $rows AS row
        MERGE (e:Entity {title: row.title, bucket: $bucket})
        
        ON CREATE SET
            e.id = row.id,
            e.human_readable_id = row.human_readable_id,
            e.type = row.type,
            e.description = row.description,
            e.frequency = COALESCE(row.frequency, 1),
            e.degree = COALESCE(row.degree, 1)
            
        ON MATCH SET
            e.frequency = e.frequency + COALESCE(row.frequency, 1)
        
        WITH e, row
        UNWIND row.text_unit_ids AS tu_id
        MATCH (t:TextUnit {id: tu_id, bucket: $bucket})
        MERGE (e)-[:MENTIONED_IN]->(t)
        """

        with self.driver.session() as session:
            # clean_df: Hàm helper xử lý NaN/Numpy arrays
            session.run(query, rows=clean_df(entity_df), bucket=self.bucket_name)
        print(f"[{self.bucket_name}] Processed {len(entity_df)} new Entities.")

    def import_new_relationships(self, relationship_df: pd.DataFrame):
        """
        Import relationships from new text units.
        Note: Must keep 'text_unit_ids' array because Neo4j edges cannot have edges pointing to Nodes.
        """
        query = """
        UNWIND $rows AS row
        MATCH (src:Entity {title: row.source, bucket: $bucket})
        MATCH (tgt:Entity {title: row.target, bucket: $bucket})
        
        MERGE (src)-[r:RELATED {bucket: $bucket}]->(tgt)
        
        ON CREATE SET
            r.id = row.id,
            r.human_readable_id = row.human_readable_id,
            r.description = row.description,
            r.weight = COALESCE(row.weight, 1.0),
            r.combined_degree = row.combined_degree,
            r.text_unit_ids = row.text_unit_ids
            
        ON MATCH SET
            r.weight = r.weight + COALESCE(row.weight, 1.0),
            r.description = r.description + "\n[UPDATE]: " + COALESCE(row.description, ""),
            r.text_unit_ids = reduce(unique=[], item IN COALESCE(r.text_unit_ids, []) + COALESCE(row.text_unit_ids, []) | 
                                     CASE WHEN item IN unique THEN unique ELSE unique + item END)
        """
        with self.driver.session() as session:
            session.run(query, rows=clean_df(relationship_df), bucket=self.bucket_name)
        print(
            f"[{self.bucket_name}] Processed {len(relationship_df)} new Relationships."
        )

    def drop_text_units(self, text_unit_ids: list[str]):
        """Drop text units and all the related relationship"""
        if not text_unit_ids:
            return

        # query = """
        # MATCH (n:TextUnit {bucket: $bucket})
        # WHERE n.id IN $text_unit_ids
        # DETACH DELETE n
        # """
        query = """
        UNWIND $text_unit_ids AS text_unit_id
        MATCH (n:TextUnit {bucket: $bucket, id: text_unit_id})
        DETACH DELETE n
        """

        with self.driver.session() as session:
            session.run(
                query=query, text_unit_ids=text_unit_ids, bucket=self.bucket_name
            )

    def drop_abandoned_entities(self):
        """Drop entity with no relationship (e)-[:MENTIONED_IN]->(t)
        One entity can have many relationships to text units.
        Just drop entities with no relationship like this
        """
        query = """
        MATCH (n:Entity {bucket: $bucket})
        WHERE NOT (n)-[:MENTIONED_IN]->(:TextUnit)
        DETACH DELETE n
        """
        with self.driver.session() as session:
            session.run(query=query, bucket=self.bucket_name)

    def run_clustering(self):
        """
        Re-cluster the graph and assign community_id to nodes.
        Uses Cypher Projection to ensure strict isolation by bucket_name.
        """
        # 1. Drop old graph projection if it exists from a previous run
        drop_cypher = (
            f"CALL gds.graph.drop('{self.graph_name}', false) YIELD graphName;"
        )

        # 2. Backup old community_id to detect structural changes later.
        # Nodes that are newly added will get an old_community_id of -1.
        backup_community_cypher = """
        MATCH (n:Entity {bucket: $bucket})
        SET n.old_community_id = COALESCE(n.community_id, -1)
        """

        # 3. Use Cypher Projection to strictly filter by bucket_name
        project_cypher = f"""
        CALL gds.graph.project.cypher(
          '{self.graph_name}',
          'MATCH (n:Entity) WHERE n.bucket = $bucket RETURN id(n) AS id',
          'MATCH (n:Entity)-[r:RELATED]->(m:Entity) 
           WHERE n.bucket = $bucket AND m.bucket = $bucket 
           RETURN id(n) AS source, id(m) AS target'
        )
        YIELD graphName, nodeCount, relationshipCount;
        """

        # 4. Run Leiden algorithm and write the new community_id back to Neo4j
        leiden_cypher = f"""
        CALL gds.leiden.write('{self.graph_name}', {{
          writeProperty: 'community_id'
        }})
        YIELD nodePropertiesWritten, communities;
        """

        with self.driver.session() as session:
            print(f"[{self.bucket_name}] Starting Clustering process...")

            # Clean up RAM
            session.run(drop_cypher)

            # Backup IDs
            session.run(backup_community_cypher, bucket=self.bucket_name)

            # Project specific bucket graph to RAM
            proj_res = session.run(project_cypher, bucket=self.bucket_name).single()
            print(
                f"[{self.bucket_name}] Projected graph to RAM: {proj_res['nodeCount']} nodes, {proj_res['relationshipCount']} edges."
            )

            # Run Leiden
            leid_res = session.run(leiden_cypher).single()
            print(
                f"[{self.bucket_name}] Leiden created {leid_res['communities']} communities. Updated {leid_res['nodePropertiesWritten']} nodes."
            )

            # Free RAM immediately
            session.run(drop_cypher)

    def get_dirty_communities(self):
        """
        Utility function to find exactly which communities need LLM rewriting.
        It uses Set-Based Diffing to overcome GDS's random ID assignment.
        """
        query = """
        MATCH (n:Entity {bucket: $bucket})
        RETURN n.title AS title, 
               COALESCE(n.old_community_id, -1) AS old_id, 
               n.community_id AS new_id
        """
        with self.driver.session() as session:
            records = session.run(query, bucket=self.bucket_name)

            old_comms = {}  # Format: {old_id: set(entity_titles)}
            new_comms = {}  # Format: {new_id: set(entity_titles)}

            # Group entities into their old and new communities
            for record in records:
                old_id = record["old_id"]
                new_id = record["new_id"]
                title = record["title"]

                if old_id != -1:
                    if old_id not in old_comms:
                        old_comms[old_id] = set()
                    old_comms[old_id].add(title)

                if new_id not in new_comms:
                    new_comms[new_id] = set()
                new_comms[new_id].add(title)

            identical_mappings = {}  # {old_id: new_id }
            dirty_new_ids = []  # -> Call LLM to rewrite report
            dead_old_ids = []  # -> Delete old report

            old_sets_matched = set()

            # Compare the exact structure (members) of the new communities against the old
            for new_id, new_members in new_comms.items():
                match_found = False
                for old_id, old_members in old_comms.items():
                    # If the exact same set of entities exists, the community is structurally identical
                    if new_members == old_members:
                        identical_mappings[old_id] = new_id
                        old_sets_matched.add(old_id)
                        match_found = True
                        break

                if not match_found:
                    # The community structure changed (added/removed nodes), or it's brand new
                    dirty_new_ids.append(new_id)

            # Identify old communities that no longer exist in the new structure
            for old_id in old_comms.keys():
                if old_id not in old_sets_matched:
                    dead_old_ids.append(old_id)

            print(
                f"Identical (Skip LLM): {len(identical_mappings)} | Rewrite: {len(dirty_new_ids)} | Delete: {len(dead_old_ids)}"
            )

            return identical_mappings, dirty_new_ids, dead_old_ids

    def drop_communities(self, community_ids: list[str]):
        """Drop communities"""
        query = """
        UNWIND $community_ids AS community_id
        MATCH (c:Community {bucket: $bucket, community: community_id})
        DETACH DELETE c
        """
        with self.driver.session() as session:
            session.run(query, community_ids=community_ids, bucket=self.bucket_name)
        print(f"[{self.bucket_name}] Dropped {len(community_ids)} communities.")
