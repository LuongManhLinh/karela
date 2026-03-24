from sqlalchemy import (
    Column,
    String,
    ForeignKey,
    Text,
    JSON,
    DateTime,
    Boolean,
    Enum as SqlEnum,
)

from enum import Enum

from common.database import Base, uuid_generator, utcnow


class Documentation(Base):
    __tablename__ = "documentations"

    id = Column(String(64), primary_key=True, index=True, default=uuid_generator)
    connection_id = Column(
        String(64),
        ForeignKey("connections.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    project_key = Column(String(32), index=True, nullable=False)
    product_vision = Column(Text, nullable=True)
    product_scope = Column(Text, nullable=True)
    current_sprint_goals = Column(Text, nullable=True)
    glossary = Column(Text, nullable=True)
    additional_docs = Column(
        JSON, nullable=True
    )  # A list of {title: str, content: str} for any additional documentation
    additional_files = Column(
        JSON, nullable=True
    )  # A list of {filename: str, url: str} for any additional files

    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    # On update event
    def before_update_listener(mapper, _, target):
        target.updated_at = utcnow()


class GenProposalMode(Enum):
    SIMPLE = "SIMPLE"
    COMPLEX = "COMPLEX"


class GenLanguage(Enum):
    STORY_BASED = "STORY_BASED"
    ENGLISH = "ENGLISH"
    VIETNAMESE = "VIETNAMESE"


class Preference(Base):
    __tablename__ = "preferences"

    id = Column(String(64), primary_key=True, index=True, default=uuid_generator)
    connection_id = Column(
        String(64),
        ForeignKey("connections.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    project_key = Column(String(32), index=True, nullable=False)

    run_analysis_guidelines = Column(Text, nullable=True)
    gen_proposal_guidelines = Column(Text, nullable=True)
    gen_proposal_after_analysis = Column(Boolean, default=False)
    gen_proposal_mode = Column(SqlEnum(GenProposalMode), default=GenProposalMode.SIMPLE)
    gen_language = Column(SqlEnum(GenLanguage), default=GenLanguage.STORY_BASED)
    chat_guidelines = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    # On update event
    def before_update_listener(mapper, _, target):
        target.updated_at = utcnow()
