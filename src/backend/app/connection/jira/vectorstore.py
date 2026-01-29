from langchain_core.documents import Document

from vectorstore import DEFAULT_VECTOR_STORE
from .schemas import StoryDto


class JiraVectorStore:
    def __init__(self, vector_store=DEFAULT_VECTOR_STORE):
        self.vector_store = vector_store

    def retrieve_similar_stories(
        self,
        connection_id: str,
        project_key: str,
        query: str,
        k: int = 5,
        min_similarity: float = 0.0,
        filter: dict = None,
        where_document=None,
    ) -> list[StoryDto]:
        print("Retrieving similar stories from vector store...")
        and_op = [
            {"connection_id": connection_id},
            {"project_key": project_key},
        ]

        if filter:
            for key, value in filter.items():
                and_op.append({key: value})

        where = {"$and": and_op}

        results = self.vector_store._similarity_search_with_relevance_scores(
            query=query,
            k=k,
            filter=where,
            where_document=where_document,
        )

        print(
            f"Found {len(results)} similar stories in vector store with query: {query}"
        )

        stories = []
        for doc, sim in results:
            if sim < min_similarity:
                print(
                    "Skipping story due to low similarity:", doc.metadata.get("key", "")
                )
                continue
            story = StoryDto(
                id=doc.id,
                key=doc.metadata.get("key", ""),
                summary=doc.page_content.split("\n")[0].replace("Summary: ", ""),
                description=doc.page_content.split("\n")[1].replace(
                    "Description: ", ""
                ),
            )
            print(f"Accepted story {story.key} with similarity {sim}")
            stories.append(story)
        return stories

    def add_stories(
        self, connection_id: str, project_key: str, stories: list[StoryDto | dict]
    ):
        documents = []
        for story in stories:
            if isinstance(story, StoryDto):
                content = f"Summary: {story.summary}\nDescription: {story.description}"
                id = story.id
                metadata = {
                    "key": story.key,
                    "connection_id": connection_id,
                    "project_key": project_key,
                }
            elif isinstance(story, dict):
                content = f"Summary: {story.get('summary', '')}\nDescription: {story.get('description', '')}"
                id = story.get("id", "")
                metadata = {
                    "key": story.get("key", ""),
                    "connection_id": connection_id,
                    "project_key": project_key,
                }
            else:
                continue
            documents.append(Document(page_content=content, id=id, metadata=metadata))
        self.vector_store.add_documents(documents)

    def update_stories(
        self, connection_id: str, project_key: str, stories: list[StoryDto | dict]
    ):
        ids = []
        documents = []
        for story in stories:
            if isinstance(story, StoryDto):
                content = f"Summary: {story.summary}\nDescription: {story.description}"
                id = story.id
                metadata = {
                    "key": story.key,
                    "connection_id": connection_id,
                    "project_key": project_key,
                }
                ids.append(story.id)
            elif isinstance(story, dict):
                content = f"Summary: {story.get('summary', '')}\nDescription: {story.get('description', '')}"
                id = story.get("id", "")
                metadata = {
                    "key": story.get("key", ""),
                    "connection_id": connection_id,
                    "project_key": project_key,
                }
            else:
                continue
            ids.append(id)
            documents.append(Document(page_content=content, id=id, metadata=metadata))
        self.vector_store.update_documents(ids=ids, documents=documents)

    def remove_stories(
        self, connection_id: str, project_key: str, story_ids: list[str]
    ):
        where_op = [
            {"connection_id": connection_id},
            {"project_key": project_key},
        ]
        where = {"$and": where_op}
        self.vector_store.delete(ids=story_ids, where=where)
