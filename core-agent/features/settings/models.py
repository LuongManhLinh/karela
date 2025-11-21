from sqlalchemy import (
    Column,
    String,
    ForeignKey,
    Enum as SqlEnum,
    Text,
    text,
    JSON,
)
from sqlalchemy.dialects.mysql import DATETIME
from sqlalchemy.orm import relationship
from enum import Enum
from uuid import uuid4

from common.database import Base, uuid_generator


class Settings(Base):
    __tablename__ = "settings"

    id = Column(String(64), primary_key=True, index=True, default=uuid_generator)
    connection_id = Column(
        String(64),
        ForeignKey("connections.platform_connection_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    project_key = Column(String(32), index=True, nullable=False)
    product_vision = Column(Text, nullable=True)
    product_scope = Column(Text, nullable=True)
    current_sprint_goals = Column(Text, nullable=True)
    glossary = Column(Text, nullable=True)
    additional_docs = Column(JSON, nullable=True)

    llm_guidelines = Column(Text, nullable=True)

    last_updated = Column(
        DATETIME(fsp=2),
        server_default=text("CURRENT_TIMESTAMP(2)"),
        nullable=False,
        onupdate=text("CURRENT_TIMESTAMP(2)"),
    )
