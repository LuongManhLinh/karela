from sqlalchemy import (
    Column,
    String,
    ForeignKey,
    Text,
    DateTime,
    Boolean,
    Enum as SqlEnum,
)

from enum import Enum

from common.database import Base, uuid_generator, utcnow


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
    gen_ac_guidelines = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    # On update event
    def before_update_listener(mapper, _, target):
        target.updated_at = utcnow()
