from langchain_core.documents import Document

from vectorstore import DEFAULT_VECTOR_STORE


class DocumentationVectorStore:
    def __init__(self, vector_store=DEFAULT_VECTOR_STORE):
        self.vector_store = vector_store

    def add_chunks(
        self,
        documentation_id: str,
        connection_id: str,
        project_key: str,
        doc_type: str,
        chunks: list[dict],
    ):
        """Store document chunks in the vector store.

        Args:
            documentation_id: ID of the TextDocumentation or FileDocumentation record.
            connection_id: Connection ID for filtering.
            project_key: Project key for filtering.
            doc_type: Either "text" or "file".
            chunks: List of dicts with 'metadata' and 'content' keys
                    (output of process_document).
        """
        documents = []
        for idx, chunk in enumerate(chunks):
            chunk_id = f"{documentation_id}_{idx}"
            metadata = {
                "documentation_id": documentation_id,
                "connection_id": connection_id,
                "project_key": project_key,
                "doc_type": doc_type,
            }
            # Merge header metadata from the chunk
            if chunk.get("metadata"):
                for key, value in chunk["metadata"].items():
                    metadata[f"header_{key}"] = value

            documents.append(
                Document(
                    page_content=chunk.get("content", ""),
                    id=chunk_id,
                    metadata=metadata,
                )
            )

        if documents:
            self.vector_store.add_documents(documents)

    def remove_chunks(self, documentation_id: str):
        """Remove all chunks for a given documentation ID."""
        self.vector_store.delete(
            where={"documentation_id": documentation_id},
        )

    def retrieve_similar(
        self,
        connection_id: str,
        project_key: str,
        query: str,
        k: int = 5,
        min_similarity: float = 0.0,
    ) -> list[dict]:
        """Retrieve similar document chunks for a query.

        Returns list of dicts with 'content', 'metadata', and 'similarity' keys.
        """
        where = {
            "$and": [
                {"connection_id": connection_id},
                {"project_key": project_key},
            ]
        }

        results = self.vector_store._similarity_search_with_relevance_scores(
            query=query,
            k=k,
            filter=where,
        )

        similar_chunks = []
        for doc, sim in results:
            if sim < min_similarity:
                continue
            similar_chunks.append(
                {
                    "content": doc.page_content,
                    "metadata": doc.metadata,
                    "similarity": sim,
                }
            )
        return similar_chunks