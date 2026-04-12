from graphrag_llm.completion.completion_factory import (
    create_completion,
    create_tokenizer,
)
from graphrag_llm.embedding.embedding_factory import create_embedding
from graphrag_llm.config import ModelConfig, TokenizerConfig
from common.configs import GraphRAGConfig


COMMUNITY_TABLE = "communities"
COMMUNITY_REPORT_TABLE = "community_reports"
ENTITY_TABLE = "entities"
RELATIONSHIP_TABLE = "relationships"
TEXT_UNIT_TABLE = "text_units"
DOCUMENT_TABLE = "documents"
COMMUNITY_LEVEL = 2


tokenizer = create_tokenizer(
    TokenizerConfig(model_id=GraphRAGConfig.TOKENIZER_MODEL_ID)
)

chat_model = create_completion(
    model_config=ModelConfig(
        api_key=GraphRAGConfig.MODEL_API_KEY,
        model_provider=GraphRAGConfig.MODEL_PROVIDER,
        # model="gemma-4-31b-it",
        model=GraphRAGConfig.CHAT_MODEL,
    )
)


text_embedder = create_embedding(
    model_config=ModelConfig(
        api_key=GraphRAGConfig.MODEL_API_KEY,
        model_provider=GraphRAGConfig.MODEL_PROVIDER,
        model=GraphRAGConfig.EMBEDDING_MODEL,
    )
)
