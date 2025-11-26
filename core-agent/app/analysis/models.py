from sqlalchemy import (
    Column,
    String,
    ForeignKey,
    Enum as SqlEnum,
    Float,
    Boolean,
    Integer,
    Text,
    text,
    JSON,
)
from sqlalchemy.dialects.mysql import DATETIME
from sqlalchemy.orm import relationship
from enum import Enum
from uuid import uuid4

from common.database import Base, uuid_generator


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
    connection_id = Column(
        String(64),
        ForeignKey("connections.platform_connection_id", ondelete="CASCADE"),
        nullable=False,
    )
    project_key = Column(String(32), index=True)
    type = Column(SqlEnum(AnalysisType), nullable=False)
    story_key = Column(String(32), nullable=True, index=True)  # For targeted analyses
    status = Column(SqlEnum(AnalysisStatus), nullable=False)
    started_at = Column(
        DATETIME(fsp=2),
        server_default=text("CURRENT_TIMESTAMP(2)"),
        nullable=False,
    )
    ended_at = Column(DATETIME(fsp=2), nullable=True)

    error_message = Column(Text, nullable=True)

    defects = relationship(
        "Defect", back_populates="analysis", cascade="all, delete-orphan"
    )

    proposals = relationship(
        "Proposal", back_populates="analysis", cascade="all, delete-orphan"
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
