from enum import Enum
from common.database import Base, uuid_generator


from sqlalchemy import (
    Boolean,
    Column,
    Enum as SqlEnum,
    ForeignKey,
    Integer,
    String,
    Text,
    text,
)
from sqlalchemy.dialects.mysql import DATETIME
from sqlalchemy.orm import relationship


class ProposalSource(Enum):
    CHAT = "CHAT"
    ANALYSIS = "ANALYSIS"

    UNKNOWN = "UNKNOWN"

    @classmethod
    def _missing_(cls, value):
        return cls.UNKNOWN


class Proposal(Base):
    __tablename__ = "proposals"

    id = Column(String(64), primary_key=True, default=uuid_generator)

    source = Column(
        SqlEnum(ProposalSource),
        nullable=False,
        default=ProposalSource.UNKNOWN,
        index=True,
    )
    connection_id = Column(
        String(64),
        ForeignKey("connections.platform_connection_id", ondelete="CASCADE"),
        nullable=False,
    )
    chat_session_id = Column(
        String(64),
        ForeignKey("chat_sessions.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )

    analysis_session_id = Column(
        String(64),
        ForeignKey("analyses.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )

    project_key = Column(String(32), nullable=False, index=True)

    created_at = Column(
        DATETIME(fsp=2), server_default=text("CURRENT_TIMESTAMP(2)"), nullable=False
    )

    chat_session = relationship("ChatSession", back_populates="proposals")
    analysis = relationship("Analysis", back_populates="proposals")

    contents = relationship(
        "ProposalContent",
        back_populates="proposal",
        cascade="all, delete-orphan",
        lazy="joined",
    )


class ProposalType(Enum):
    CREATE = "CREATE"
    UPDATE = "UPDATE"
    DELETE = "DELETE"

    UNKNOWN = "UNKNOWN"

    @classmethod
    def _missing_(cls, value):
        return cls.UNKNOWN


class ProposalContent(Base):
    __tablename__ = "proposal_contents"

    id = Column(String(64), primary_key=True, default=uuid_generator)
    type = Column(SqlEnum(ProposalType), nullable=False)
    proposal_id = Column(
        String(64),
        ForeignKey("proposals.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    key = Column(
        String(32), nullable=True, index=True, default=None
    )  # The key of the User Story (Jira Issue). None for CREATE proposals
    summary = Column(Text, nullable=True)
    description = Column(Text, nullable=True)
    explanation = Column(Text, nullable=True)

    accepted = Column(
        Boolean, nullable=True
    )  # None = pending, True = accepted, False = rejected

    rollback_version = Column(
        Integer, nullable=True
    )  # Version to rollback to, if accepted

    proposal = relationship("Proposal", back_populates="contents")


class StoryVersion(Base):
    __tablename__ = "story_versions"

    id = Column(String(64), primary_key=True, default=uuid_generator)
    key = Column(String(32), nullable=False, unique=True, index=True)
    version = Column(Integer, nullable=False, default=0)
    summary = Column(Text, nullable=True)
    description = Column(Text, nullable=True)

    created_at = Column(
        DATETIME(fsp=2), server_default=text("CURRENT_TIMESTAMP(2)"), nullable=False
    )
