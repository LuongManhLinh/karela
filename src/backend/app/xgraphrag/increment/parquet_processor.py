import pandas as pd
import os
from pathlib import Path
from ..defines import (
    DOCUMENT_TABLE,
    TEXT_UNIT_TABLE,
    COMMUNITY_REPORT_TABLE,
)


class ParquetProcessor:
    """
    Handles persisting non-graph entities (Documents, TextUnits, CommunityReports)
    in Parquet files within the workspace output directory.
    """

    def __init__(self, output_dir: str):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def path_for(self, table_name: str) -> Path:
        return self.output_dir / f"{table_name}.parquet"

    def update_documents(self, new_docs_df: pd.DataFrame):
        path = self.path_for(DOCUMENT_TABLE)
        self._upsert_parquet(path, new_docs_df, merge_col="id")
        print(f"Updated {DOCUMENT_TABLE}.parquet")

    def update_text_units(self, new_text_units_df: pd.DataFrame):
        path = self.path_for(TEXT_UNIT_TABLE)
        self._upsert_parquet(path, new_text_units_df, merge_col="id")
        print(f"Updated {TEXT_UNIT_TABLE}.parquet")

    def update_community_reports(self, new_reports_df: pd.DataFrame):
        path = self.path_for(COMMUNITY_REPORT_TABLE)
        self._upsert_parquet(path, new_reports_df, merge_col="id")
        print(f"Updated {COMMUNITY_REPORT_TABLE}.parquet")

    def _upsert_parquet(self, path: Path, new_df: pd.DataFrame, merge_col: str):
        existing_df = None
        if path.exists():
            existing_df = pd.read_parquet(path)

        max_id = 0
        if existing_df:
            max_id = len(existing_df) + 1

        # Update new_df human_readable_id anyway. If not exist in new_df, add this row
        if "human_readable_id" in new_df.columns:
            new_df["human_readable_id"] = new_df.apply(
                lambda row: (
                    row["human_readable_id"]
                    if pd.notnull(row["human_readable_id"])
                    else max_id + row.name + 1
                ),
                axis=1,
            )

        else:
            new_df["human_readable_id"] = [max_id + i + 1 for i in range(len(new_df))]

        if not existing_df:
            new_df.to_parquet(path, index=False)
            return

        # Upsert: Drop records in existing_df that match the new_df ids, then concat
        existing_df = existing_df[~existing_df[merge_col].isin(new_df[merge_col])]
        combined_df = pd.concat([existing_df, new_df], ignore_index=True)
        combined_df.to_parquet(path, index=False)

    def delete_document(self, doc_id: str) -> list[str]:
        """Delete a document by ID, delete all associated text units
        Return the list of deleted text unit ids for downstream cascade deletion in Neo4j if needed.
        """
        doc_path = self.path_for(DOCUMENT_TABLE)
        text_unit_path = self.path_for(TEXT_UNIT_TABLE)

        if not doc_path.exists():
            print(f"No existing {DOCUMENT_TABLE}.parquet found. Nothing to delete.")
            return []

        # Load existing documents and text units
        docs_df = pd.read_parquet(doc_path)
        text_units_df = (
            pd.read_parquet(text_unit_path)
            if text_unit_path.exists()
            else pd.DataFrame()
        )

        # Find the document to delete
        doc_to_delete = docs_df[docs_df["id"] == doc_id]
        if doc_to_delete.empty:
            print(f"Document with id {doc_id} not found. Nothing to delete.")
            return []

        # Get associated text unit ids before deletion
        associated_text_unit_ids = []
        if not text_units_df.empty:
            associated_text_unit_ids = text_units_df[
                text_units_df["document_id"] == doc_id
            ]["id"].tolist()

        # Delete the document
        docs_df = docs_df[docs_df["id"] != doc_id]
        docs_df.to_parquet(doc_path, index=False)
        print(f"Deleted document with id {doc_id} from {DOCUMENT_TABLE}.parquet")

        # Cascade delete associated text units
        if not text_units_df.empty and associated_text_unit_ids:
            text_units_df = text_units_df[~text_units_df["document_id"].isin([doc_id])]
            text_units_df.to_parquet(text_unit_path, index=False)
            print(
                f"Cascade deleted {len(associated_text_unit_ids)} text units associated with document id {doc_id} from {TEXT_UNIT_TABLE}.parquet"
            )

        return associated_text_unit_ids

    def update_community_report_ids(self, community_ids: dict[str, str]):
        """Update from old id to new id"""
        path = self.path_for(COMMUNITY_REPORT_TABLE)
        if not path.exists():
            return

        df = pd.read_parquet(path)
        df["id"] = df["id"].replace(community_ids)
        df.to_parquet(path, index=False)
        print(f"Updated {COMMUNITY_REPORT_TABLE}.parquet")

    def get_doc_ids_mapping(self, story_keys: list[str]) -> dict[str, str]:
        """Get mapping from story key to doc_id for existing documents"""
        path = self.path_for(DOCUMENT_TABLE)
        if not path.exists():
            return {}

        df = pd.read_parquet(path)
        mapping = {}
        for _, row in df.iterrows():
            title = row["title"]
            if title in story_keys:
                mapping[title] = row["id"]

        return mapping