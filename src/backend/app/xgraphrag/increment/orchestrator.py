import asyncio
import pandas as pd

import hashlib
from neo4j import Driver

from datetime import datetime
from graphrag_llm.completion import LLMCompletion
from graphrag_llm.tokenizer import Tokenizer
from graphrag_llm.embedding import LLMEmbedding

from .utils import load_settings, generate_new_text_units
from .workflows import run_extract_graph_workflow, run_create_community_reports_workflow
from .parquet_processor import ParquetProcessor
from .lancedb_processor import LanceDBProcessor

from ..db.importer import import_text_units
from ..db.query import get_communities, get_entities, get_relationships
from ..defines import chat_model, tokenizer, text_embedder

from .neo4j_processor import Neo4jProcessor

from common.neo4j_app import default_driver
from .schemas import Increment

from app.connection.jira.schemas import StoryDto


def _get_current_date():
    """Return format YYYY-MM-DD"""
    return datetime.now(tz="UTC").strftime("%Y-%m-%d")


NUMBER_OF_incrementS_TO_PROCESS = 5


class GraphRAGUpdater:
    """
    Main Orchestrator for GraphRAG increment Updates.
    Executes Python workflows -> Updates Parquets -> Pushes to Neo4j -> Neo4j GDS Clustering -> LanceDB Sync.
    """

    def __init__(
        self,
        connection_id: str,
        project_key: str,
        neo4j_driver: Driver = default_driver,
        llm_client: LLMCompletion = chat_model,
        tokenizer: Tokenizer = tokenizer,
        embedding_client: LLMEmbedding = text_embedder,
        settings_path="data/graphrag_root/settings.yaml",
    ):
        self.settings = load_settings(settings_path)
        self.neo4j_driver = neo4j_driver
        self.llm_client = llm_client
        self.tokenizer = tokenizer
        self.bucket_name = f"{connection_id}_{project_key}"

        self.work_dir = f".workspace/{connection_id}/{project_key}/output"

        self.neo4j = Neo4jProcessor(neo4j_driver, bucket_name=self.bucket_name)
        self.parquet = ParquetProcessor(self.work_dir)
        self.lancedb = LanceDBProcessor(f"{self.work_dir}/lancedb", embedding_client)

    def add_stories(self, stories: list[StoryDto]):
        self._push_increments(
            increments=[
                Increment(
                    title=story.key,
                    doc_text=f"# SUMMARY:\n{story.summary}\n\n# DESCRIPTION:\n{story.description}",
                    action="add",
                )
                for story in stories
            ]
        )

    def update_stories(self, stories: list[StoryDto]):
        doc_ids_mapping = self.parquet.get_doc_ids_mapping(
            [story.key for story in stories]
        )

        increments = []
        for story in stories:
            doc_id = doc_ids_mapping.get(story.key)
            action = "update" if doc_id else "add"

            increments.append(
                Increment(
                    title=story.key,
                    doc_text=f"# SUMMARY:\n{story.summary}\n\n# DESCRIPTION:\n{story.description}",
                    action=action,
                    doc_id=doc_id,
                )
            )
        self._push_increments(increments=increments)

    def delete_stories(self, story_keys: list[str]):
        doc_ids_mapping = self.parquet.get_doc_ids_mapping(story_keys)
        increments = []
        for story_key in story_keys:
            doc_id = doc_ids_mapping.get(story_key)
            if doc_id:
                increments.append(
                    Increment(
                        action="delete",
                        doc_id=doc_id,
                    )
                )
            else:
                print(f"Story with id {story_key} not found. Skipping delete.")
        self._push_increments(increments=increments)

    def _push_increments(self, increments: list[Increment]):
        count = self.lancedb.push_increments(increments)
        if count >= NUMBER_OF_incrementS_TO_PROCESS:
            stories = self.lancedb.pop_all_increments()
            self._process_increments(stories)

    def process_all_increments(self):
        """Utility to process all increments in the system. Can be called periodically or triggered by an event."""
        increments = self.lancedb.pop_all_increments()
        self._process_increments(increments)

    def _process_increments(
        self,
        increments: list[Increment],
    ):
        """
        Main entry point for processing an increment update.
        `doc_id` is optional for "add" (will be generated if not provided), but required for "update" and "delete".
        """
        asyncio.run(self._process_increments_async(increments))

    async def _process_increments_async(
        self,
        increments: list[Increment],
    ):
        for increment in increments:
            if increment.action == "add":
                await self._process_add(increment.title, increment.doc_text)
            elif increment.action == "update":
                await self._process_update(
                    increment.doc_id, increment.title, increment.doc_text
                )
            elif increment.action == "delete":
                await self._process_delete(increment.doc_id)

        self._post_process()

    async def _process_add(self, title: str, doc_text: str):
        print(f"# Adding document {title}")
        doc_id = hashlib.sha256(doc_text.encode()).hexdigest()

        documents_df = pd.DataFrame(
            [
                {
                    "id": doc_id,
                    "human_readable_id": None,
                    "title": title,
                    "text": doc_text,
                    "creation_date": _get_current_date(),
                    "raw_data": {
                        "full_content": doc_text,
                    },
                }
            ]
        )

        self.parquet.update_documents(documents_df)

        print("Generating Text Units...")
        text_units = generate_new_text_units(doc_text, doc_id, self.settings)
        text_units_df = pd.DataFrame(text_units)

        print("Extracting Graph via LLM Workflow...")
        entities_df, relationships_df = await run_extract_graph_workflow(
            text_units_df,
            extraction_model=self.llm_client,
            summarization_model=self.llm_client,
            settings=self.settings,
        )

        # 3. NEO4J SYNC (Entities, Relationships)
        print("Importing extracted graph into Neo4j...")
        import_text_units(self.neo4j_driver, text_units_df, self.bucket_name)
        self.neo4j.import_new_entities(entities_df)
        self.neo4j.import_new_relationships(relationships_df)

        print("Syncing vectors to LanceDB...")
        if not text_units_df.empty:
            self.lancedb.sync_text_unit_text(text_units_df)
        if not entities_df.empty:
            self.lancedb.sync_entity_description(entities_df)

    async def _process_delete(self, doc_id: str):
        print(f"# Deleting document {doc_id}")
        related_text_units = self.parquet.delete_document(doc_id)
        self.neo4j.drop_text_units(related_text_units)
        self.neo4j.drop_abandoned_entities()

    async def _process_update(self, doc_id: str, title: str, doc_text: str):
        print(f"# Updating document {title}")
        await self._process_delete(doc_id)
        await self._process_add(title, doc_text)

    async def _post_process(self):
        # 4. NEO4J CLUSTERING (Leiden)
        print("Running Neo4j Leiden Clustering...")
        self.neo4j.run_clustering()

        # Extract generated Communities back from Neo4j memory into DataFrame
        print("Reading clustered communities back...")

        identical_mappings, dirty_community_ids, dead_community_ids = (
            self.neo4j.get_dirty_communities()
        )
        self.parquet.update_community_report_ids(identical_mappings)
        self.neo4j.drop_communities(dead_community_ids)

        communities_df = get_communities(
            driver=self.neo4j_driver,
            bucket_name=self.bucket_name,
            community_ids=dirty_community_ids,
        )
        entity_ids = set()
        relationship_ids = set()

        for _, row in communities_df.iterrows():
            entity_ids.update(row["entity_ids"])
            relationship_ids.update(row["relationship_ids"])

        entities_df = get_entities(
            self.neo4j_driver, self.bucket_name, list(entity_ids)
        )
        relationships_df = get_relationships(
            self.neo4j_driver, self.bucket_name, list(relationship_ids)
        )
        # 5. RUN WORKFLOW (Community Reports)
        print("Generating Community Reports via LLM Workflow...")
        community_reports_df = await run_create_community_reports_workflow(
            relationships_df=relationships_df,
            entities_df=entities_df,
            communities_df=communities_df,
            model=self.llm_client,
            tokenizer=self.tokenizer,
            settings=self.settings,
        )

        # Save Community Reports to Parquet
        self.parquet.update_community_reports(community_reports_df)

        # 6. LANCE DB SYNC
        print("Syncing vectors to LanceDB...")
        if not community_reports_df.empty:
            self.lancedb.sync_community_full_content(community_reports_df)

        print("--- INCREMENT UPDATE COMPLETE ---")
