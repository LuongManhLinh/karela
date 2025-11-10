from sqlalchemy import (
    Column,
    String,
    ForeignKey,
    Enum as SqlEnum,
    Float,
    Boolean,
    Integer,
    TIMESTAMP,
    func,
    Index,
    Text,
)
from sqlalchemy.orm import relationship
from enum import Enum
from uuid import uuid4

from database import Base


def uuid_generator():
    return str(uuid4())


class AnalysisType(Enum):
    ALL = "ALL"
    TARGETED = "TARGETED"
    ON_ADDING = "ON_ADDING"
    ON_MODIFYING = "ON_MODIFYING"
    ON_DELETING = "ON_DELETING"

    UNKNOWN = "UNKNOWN"

    @classmethod
    def _missing_(cls, value):
        return cls.UNKNOWN


class AnalysisStatus(Enum):
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    DONE = "DONE"
    FAILED = "FAILED"

    UNKNOWN = "UNKNOWN"

    @classmethod
    def _missing_(cls, value):
        return cls.UNKNOWN


class DefectType(Enum):
    CONFLICT = "CONFLICT"
    DUPLICATION = "DUPLICATION"
    ENTAILMENT = "ENTAILMENT"
    INCONSISTENCY = "INCONSISTENCY"
    OUT_OF_SCOPE = "OUT_OF_SCOPE"
    INCOMPLETENESS = "INCOMPLETENESS"
    AMBIGUITY = "AMBIGUITY"
    IRRELEVANCE = "IRRELEVANCE"

    UNKNOWN = "UNKNOWN"

    @classmethod
    def _missing_(cls, value):
        return cls.UNKNOWN


class DefectSeverity(Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"

    UNKNOWN = "UNKNOWN"

    @classmethod
    def _missing_(cls, value):
        return cls.UNKNOWN


class Analysis(Base):
    __tablename__ = "analyses"
    id = Column(String(64), primary_key=True, index=True, default=uuid_generator)
    project_key = Column(String(32), index=True)
    type = Column(SqlEnum(AnalysisType), nullable=False)
    status = Column(SqlEnum(AnalysisStatus), nullable=False)
    started_at = Column(
        TIMESTAMP(timezone=True, precision=3),
        server_default=func.now(),
        nullable=False,
    )
    ended_at = Column(TIMESTAMP(timezone=True, precision=3), nullable=True)
    # title = Column(String(256), nullable=True)
    error_message = Column(String(1024), nullable=True)

    defects = relationship(
        "Defect", back_populates="analysis", cascade="all, delete-orphan"
    )


class Defect(Base):
    __tablename__ = "defects"

    id = Column(String(64), primary_key=True, index=True, default=uuid_generator)
    analysis_id = Column(
        String(64),
        ForeignKey("analyses.id", name="fk_defects_analysis", ondelete="CASCADE"),
        nullable=False,
    )
    type = Column(SqlEnum(DefectType), nullable=False, index=True)
    severity = Column(SqlEnum(DefectSeverity), nullable=False, index=True)
    explanation = Column(Text, nullable=False)
    confidence = Column(Float, nullable=False)
    suggested_fix = Column(Text, nullable=True)
    solved = Column(Boolean, default=False, nullable=False)

    # analysis_detail = relationship("AnalysisDetail", back_populates="defects")
    analysis = relationship("Analysis", back_populates="defects")

    work_item_ids = relationship(
        "DefectWorkItemId",
        cascade="all, delete-orphan",
        back_populates="defect",
        lazy="joined",  # eager fetch equivalent to FetchType.EAGER
    )


class DefectWorkItemId(Base):
    __tablename__ = "defect_work_item_ids"

    id = Column(Integer, primary_key=True, autoincrement=True)
    defect_id = Column(
        String(64),
        ForeignKey("defects.id", name="fk_defect_work_item", ondelete="CASCADE"),
        nullable=False,
    )
    key = Column(String(32), nullable=False, index=True)

    defect = relationship("Defect", back_populates="work_item_ids")


class SenderRole(Enum):
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"


# class User(Base):
#     __tablename__ = "users"

#     id = Column(Integer, primary_key=True)
#     username = Column(String(50), unique=True, nullable=False)

#     sessions = relationship("ChatSession", back_populates="user", cascade="all, delete-orphan")


class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(String(64), primary_key=True, default=uuid_generator)
    # user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    # If not null, the chat session is associated with a specific work item
    work_item_id = Column(String(32), nullable=True)
    created_at = Column(
        TIMESTAMP(timezone=True, precision=3), server_default=func.now(), nullable=False
    )

    # user = relationship("User", back_populates="sessions")
    messages = relationship(
        "Message", back_populates="session", cascade="all, delete-orphan"
    )


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(
        String(64), ForeignKey("chat_sessions.id", ondelete="CASCADE"), nullable=False
    )

    role = Column(SqlEnum(SenderRole), nullable=False)
    content = Column(Text, nullable=False)

    created_at = Column(
        TIMESTAMP(timezone=True, precision=6), server_default=func.now(), nullable=False
    )

    session = relationship("ChatSession", back_populates="messages")

    __table_args__ = (Index("ix_messages_session_created", "session_id", "created_at"),)


class WorkItemVersion(Base):
    __tablename__ = "work_item_versions"

    id = Column(String(64), primary_key=True, default=uuid_generator)
    key = Column(String(32), nullable=False, unique=True, index=True)
    version = Column(Integer, nullable=False, default=0)
    summary = Column(Text, nullable=True)
    description = Column(Text, nullable=True)

    created_at = Column(
        TIMESTAMP(timezone=True, precision=3), server_default=func.now(), nullable=False
    )
