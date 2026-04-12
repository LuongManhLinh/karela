import lancedb
import pyarrow as pa
import pandas as pd
from datetime import datetime
from graphrag_llm.embedding import LLMEmbedding

from .schemas import Increment


class LanceDBProcessor:
    """
    Synchronizes new/updated DataFrame records to LanceDB embedding tables.
    Tables: community_full_content, entity_description, text_unit_text
    """

    def __init__(self, uri: str, embedding_model: LLMEmbedding):
        self.db = lancedb.connect(uri)
        self.embedding_model = embedding_model

    def _enrich_dates(self, df: pd.DataFrame) -> pd.DataFrame:
        now = datetime.now()

        dt_str = now.isoformat()

        df["create_date"] = dt_str
        df["update_date"] = dt_str
        df["create_date_year"] = now.year
        df["create_date_month"] = now.month
        df["create_date_month_name"] = now.strftime("%B")
        df["create_date_day"] = now.day
        df["create_date_day_of_week"] = now.strftime("%A")
        df["create_date_hour"] = now.hour
        df["create_date_quarter"] = (now.month - 1) // 3 + 1

        df["update_date_year"] = now.year
        df["update_date_month"] = now.month
        df["update_date_month_name"] = now.strftime("%B")
        df["update_date_day"] = now.day
        df["update_date_day_of_week"] = now.strftime("%A")
        df["update_date_hour"] = now.hour
        df["update_date_quarter"] = (now.month - 1) // 3 + 1

        return df

    def _sync_table(self, table_name: str, df: pd.DataFrame, text_column: str):
        if df.empty:
            return

        df = self._enrich_dates(df.copy())

        # MOCK EMBEDDING: Generate vectors using the active model
        # Typically requires an embedding step, returning List[float] length 3072
        # If using text-embedding-3-small, dim depends on choice, 3072 for text-embedding-3-large maybe
        print(f"Creating embeddings for {len(df)} records for {table_name}...")
        df["vector"] = df[text_column].apply(lambda x: self._embed(str(x)))

        # Ensure only compatible columns are saved
        schema = pa.schema(
            [
                pa.field("id", pa.string()),
                pa.field("vector", pa.list_(pa.float32(), 3072)),
                pa.field("create_date", pa.string()),
                pa.field("update_date", pa.string()),
                pa.field("create_date_year", pa.int64()),
                pa.field("create_date_month", pa.int64()),
                pa.field("create_date_month_name", pa.string()),
                pa.field("create_date_day", pa.int64()),
                pa.field("create_date_day_of_week", pa.string()),
                pa.field("create_date_hour", pa.int64()),
                pa.field("create_date_quarter", pa.int64()),
                pa.field("update_date_year", pa.int64()),
                pa.field("update_date_month", pa.int64()),
                pa.field("update_date_month_name", pa.string()),
                pa.field("update_date_day", pa.int64()),
                pa.field("update_date_day_of_week", pa.string()),
                pa.field("update_date_hour", pa.int64()),
                pa.field("update_date_quarter", pa.int64()),
            ]
        )

        upload_df = df[schema.names]

        if table_name not in self.db.table_names():
            self.db.create_table(table_name, data=upload_df, schema=schema)
        else:
            tbl = self.db.open_table(table_name)
            # Basic Upsert operation: assuming schema compatibility
            tbl.add(upload_df)

    def sync_community_full_content(self, reports_df: pd.DataFrame):
        self._sync_table(
            "community_full_content", reports_df, text_column="full_content"
        )

    def sync_entity_description(self, entities_df: pd.DataFrame):
        self._sync_table("entity_description", entities_df, text_column="description")

    def sync_text_unit_text(self, text_units_df: pd.DataFrame):
        self._sync_table("text_unit_text", text_units_df, text_column="text")

    def _embed(self, text: str):
        # Return embeddings using the provided embedding model
        resp = self.embedding_model.embedding(input=text)
        return resp.first_embedding

    def push_increments(self, increments: list[Increment]) -> int:
        increment_dicts = [increment.model_dump() for increment in increments]
        new_df = pd.DataFrame(increment_dicts)

        if "increments" not in self.db.table_names():
            # Initial creation
            self.db.create_table("increments", data=new_df)
            return len(new_df)
        else:
            # Open existing, convert to pandas, append, and overwrite
            tbl = self.db.open_table("increments")
            existing_df = tbl.to_pandas()

            # Use concat for row-wise appending (axis=0 is default)
            updated_df = pd.concat([existing_df, new_df], ignore_index=True)

            self.db.create_table("increments", data=updated_df, mode="overwrite")
            return len(updated_df)

    def pop_all_increments(self) -> list[Increment]:
        if "increments" not in self.db.table_names():
            return []

        tbl = self.db.open_table("increments")
        df = tbl.to_pandas()

        # Convert rows back to Increment objects
        increments = [Increment(**row) for _, row in df.iterrows()]

        # Drop the table to clear it
        self.db.drop_table("increments")
        return increments
