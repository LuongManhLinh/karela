from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_openai import OpenAIEmbeddings
from common.configs import LlmConfig, VectorStoreConfig
from langchain_chroma import Chroma
import chromadb

native_chroma_client = chromadb.HttpClient(
    host=VectorStoreConfig.HOST, port=VectorStoreConfig.PORT
)


# default_embeddings = GoogleGenerativeAIEmbeddings(
#     model="models/gemini-embedding-001", google_api_key=LlmConfig.GEMINI_API_KEYS[0]
# )

default_embeddings = OpenAIEmbeddings(
    model="text-embedding-3-small",
    openai_api_key=LlmConfig.OPENAI_API_KEYS[0],
    dimensions=1024,
)


chroma_vectorstore = Chroma(
    collection_name=VectorStoreConfig.COLLECTION_NAME,
    embedding_function=default_embeddings,
    host=VectorStoreConfig.HOST,
    port=VectorStoreConfig.PORT,
)


def create_chroma_vectorstore():
    return Chroma(
        client=native_chroma_client,
        collection_name=VectorStoreConfig.COLLECTION_NAME,
        embedding_function=default_embeddings,
        host=VectorStoreConfig.HOST,
        port=VectorStoreConfig.PORT,
    )
