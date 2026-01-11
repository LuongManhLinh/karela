import base64
import os
from dotenv import load_dotenv

load_dotenv(dotenv_path=".env")


class DatabaseConfig:
    HOST = os.getenv("DB_HOST", "localhost")
    PORT = os.getenv("DB_PORT", "3306")
    USER = os.getenv("DB_USER", "root")
    PASSWORD = os.getenv("DB_PASSWORD", "root")
    DATABASE = os.getenv("DB_NAME", "karela")
    DATA_SOURCE = f"mysql+pymysql://{USER}:{PASSWORD}@{HOST}:{PORT}/{DATABASE}"


class GeminiConfig:
    GEMINI_API_KEYS = os.getenv("GEMINI_API_KEYS", "").split(",")
    GEMINI_API_DEFECT_TEMPERATURE = float(
        os.getenv("GEMINI_API_DEFECT_TEMPERATURE", "0")
    )
    GEMINI_API_DEFECT_MODEL = os.getenv("GEMINI_API_DEFECT_MODEL", "gemini-2.0-flash")
    GEMINI_API_CHAT_TEMPERATURE = float(os.getenv("GEMINI_API_CHAT_TEMPERATURE", "0.7"))
    GEMINI_API_CHAT_MODEL = os.getenv("GEMINI_API_CHAT_MODEL", "gemini-2.0-flash")
    GEMINI_API_DEFAULT_TEMPERATURE = float(
        os.getenv("GEMINI_API_DEFAULT_TEMPERATURE", "0.3")
    )
    GEMINI_API_DEFAULT_MODEL = os.getenv("GEMINI_API_DEFAULT_MODEL", "gemini-2.0-flash")
    GEMINI_API_MAX_RETRY = int(os.getenv("GEMINI_API_MAX_RETRY", "3"))
    GEMINI_API_RETRY_DELAY_MS = int(os.getenv("GEMINI_API_RETRY_DELAY_MS", "1000"))


class OpenRouterConfig:
    OPENROUTER_API_KEYS = os.getenv("OPENROUTER_API_KEYS", "").split(",")
    OPENROUTER_API_MODEL = os.getenv("OPENROUTER_API_MODEL", "gpt-4o")


class JiraConfig:
    CLIENT_ID = os.getenv("JIRA_CLIENT_ID", "")
    CLIENT_SECRET = os.getenv("JIRA_CLIENT_SECRET", "")
    OAUTH_URL = os.getenv("JIRA_OAUTH_URL", "")
    SCOPES = os.getenv("JIRA_SCOPES", "")
    WEBHOOK_EVENTS = os.getenv("JIRA_WEBHOOK_EVENTS", "").split(",")
    WEBHOOK_URL = os.getenv("JIRA_WEBHOOK_URL", "")


class RedisConfig:
    REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
    REDIS_PORT = int(os.getenv("REDIS_PORT", "6379"))
    REDIS_DB = int(os.getenv("REDIS_DB", "0"))


class AuthConfig:
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "")
    AES_KEY = base64.b64decode(os.getenv("AES_KEY", ""))


class VectorStoreConfig:
    PERSIST_DIRECTORY = os.getenv(
        "VECTORSTORE_PERSIST_DIRECTORY", "./chroma_langchain_db"
    )
    COLLECTION_NAME = os.getenv("VECTORSTORE_COLLECTION_NAME", "karela_collection")
    HOST = os.getenv("VECTORSTORE_HOST", "localhost")
    PORT = int(os.getenv("VECTORSTORE_PORT", "8888"))
