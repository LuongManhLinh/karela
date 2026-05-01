from langchain_core.documents import Document

from common.vectorstore import default_vectorstore


class DocumentationVectorStore:
    def __init__(self, vector_store=default_vectorstore):
        self.vector_store = vector_store

    def add_chunks(
        self,
        documentation_id: str,
        connection_id: str,
        chunks: list[str],
    ):
        """Store document chunks in the vector store.

        Args:
            documentation_id: ID of the TextDocumentation or FileDocumentation record.
            doc_type: Either "text" or "file".
            chunks: List of strings representing the document chunks.
        """
        documents = []
        for idx, chunk in enumerate(chunks):
            chunk_id = f"{documentation_id}_{idx}"
            metadata = {
                "documentation_id": documentation_id,
                "connection_id": connection_id,
            }

            documents.append(
                Document(
                    page_content=chunk,
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
        query: str,
        documentation_id: str | None = None,
        k: int = 5,
    ) -> list[dict]:
        """Retrieve similar document chunks for a query.

        Args:
            query: The query string to search for.
            documentation_id: Optional documentation ID to filter by.
            where_headers: Optional dict of header key-value pairs to filter by (e.g., {"#": "Introduction", "##": "Subheader"}).
            k: Number of top similar chunks to return.
            min_similarity: Minimum similarity score to include in results.

        Returns:
            list of dicts with 'content', 'metadata', and 'similarity' keys.
        """
        and_conditions = []

        if documentation_id:
            and_conditions.append({"documentation_id": {"$eq": documentation_id}})

        where_filter = {"$and": and_conditions} if and_conditions else None

        results = self.vector_store.similarity_search_with_relevance_scores(
            query=query,
            k=k,
            filter=where_filter,
        )

        return [
            {
                "content": doc.page_content,
                "similarity": sim,
            }
            for doc, sim in results
        ]
