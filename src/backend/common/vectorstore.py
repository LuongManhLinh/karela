from langchain_google_genai import GoogleGenerativeAIEmbeddings
from common.configs import LlmConfig, VectorStoreConfig
from langchain_chroma import Chroma
from chromadb.config import Settings
import chromadb

# 1. Define Chroma settings with an explicit network timeout (e.g., 5 seconds)
chroma_settings = Settings(
    chroma_api_impl="chromadb.api.fastapi.FastAPI",
    chroma_query_request_timeout_seconds=5,  # <-- This tells httpx to abort query requests after 5s,
)

# 2. Pass the settings into the HttpClient
native_chroma_client = chromadb.HttpClient(
    host=VectorStoreConfig.HOST, port=VectorStoreConfig.PORT, settings=chroma_settings
)


client_settings = chromadb.config.Settings(
    chroma_api_impl="chromadb.api.fastapi.FastAPI",
)
default_embeddings = GoogleGenerativeAIEmbeddings(
    model="models/gemini-embedding-001", google_api_key=LlmConfig.GEMINI_API_KEYS[0]
)


default_vectorstore = Chroma(
    collection_name=VectorStoreConfig.COLLECTION_NAME,
    embedding_function=default_embeddings,
    host=VectorStoreConfig.HOST,
    port=VectorStoreConfig.PORT,
    client_settings=client_settings,
)


def create_vectorstore():
    return Chroma(
        client=native_chroma_client,
        collection_name=VectorStoreConfig.COLLECTION_NAME,
        embedding_function=default_embeddings,
        host=VectorStoreConfig.HOST,
        port=VectorStoreConfig.PORT,
        client_settings=client_settings,
    )
