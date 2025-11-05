from sqlalchemy import (
    Column,
    String,
    DateTime,
    ForeignKey,
    Enum as SqlEnum,
    Float,
    Boolean,
    Integer,
)
from sqlalchemy.orm import relationship
from enum import Enum
from datetime import datetime

from database import Base


class AnalysisType(Enum):
    ALL = "ALL"
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
    id = Column(String(64), primary_key=True, index=True)
    project_key = Column(String(32), index=True)
    type = Column(SqlEnum(AnalysisType), nullable=False)
    status = Column(SqlEnum(AnalysisStatus), nullable=False)
    started_at = Column(DateTime, default=datetime.now, nullable=False)
    ended_at = Column(DateTime, nullable=True)
    title = Column(String(256), nullable=True)
    error_message = Column(String(1024), nullable=True)

    detail = relationship(
        "AnalysisDetail",
        uselist=False,
        back_populates="analysis",
        cascade="all, delete-orphan",
    )


class AnalysisDetail(Base):
    __tablename__ = "analysis_details"
    id = Column(String(64), primary_key=True, index=True)
    analysis_id = Column(
        String(64),
        ForeignKey(
            "analyses.id", name="fk_analysis_details_analysis", ondelete="CASCADE"
        ),
        nullable=False,
    )
    summary = Column(String(8192), nullable=False)

    analysis = relationship("Analysis", back_populates="detail", uselist=False)
    defects = relationship(
        "Defect", back_populates="analysis_detail", cascade="all, delete-orphan"
    )


class Defect(Base):
    __tablename__ = "defects"

    id = Column(String(64), primary_key=True, index=True)
    analysis_detail_id = Column(
        String(64),
        ForeignKey(
            "analysis_details.id", name="fk_defects_analysis_detail", ondelete="CASCADE"
        ),
        nullable=False,
    )
    type = Column(SqlEnum(DefectType), nullable=False, index=True)
    severity = Column(SqlEnum(DefectSeverity), nullable=False, index=True)
    explanation = Column(String(2048), nullable=False)
    confidence = Column(Float, nullable=False)
    suggested_fix = Column(String(2048), nullable=True)
    solved = Column(Boolean, default=False, nullable=False)

    analysis_detail = relationship("AnalysisDetail", back_populates="defects")

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
    work_item_id = Column(String(32), nullable=False, index=True)

    defect = relationship("Defect", back_populates="work_item_ids")
