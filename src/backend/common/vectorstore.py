from langchain_google_genai import GoogleGenerativeAIEmbeddings
from common.configs import GeminiConfig, VectorStoreConfig
from langchain_chroma import Chroma


DEFAULT_EMBEDDINGS = GoogleGenerativeAIEmbeddings(
    model="models/gemini-embedding-001", google_api_key=GeminiConfig.GEMINI_API_KEYS[0]
)


DEFAULT_VECTOR_STORE = Chroma(
    collection_name=VectorStoreConfig.COLLECTION_NAME,
    embedding_function=DEFAULT_EMBEDDINGS,
    host=VectorStoreConfig.HOST,
    port=VectorStoreConfig.PORT,
)
