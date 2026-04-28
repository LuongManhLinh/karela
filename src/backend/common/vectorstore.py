from langchain_google_genai import GoogleGenerativeAIEmbeddings
from common.configs import LlmConfig, VectorStoreConfig
from langchain_chroma import Chroma


default_embeddings = GoogleGenerativeAIEmbeddings(
    model="models/gemini-embedding-001", google_api_key=LlmConfig.GEMINI_API_KEYS[0]
)


default_vectorstore = Chroma(
    collection_name=VectorStoreConfig.COLLECTION_NAME,
    embedding_function=default_embeddings,
    host=VectorStoreConfig.HOST,
    port=VectorStoreConfig.PORT,
)
