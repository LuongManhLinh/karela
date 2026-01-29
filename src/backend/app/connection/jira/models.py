from sqlalchemy import Column, String, ForeignKey, Text, DateTime, Enum as SqlEnum
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.mysql import BINARY, LONGBLOB
from enum import Enum


from common.database import Base, uuid_generator, utcnow


class JiraSyncError(Enum):
    DATA_SYNC_ERROR = "data_sync_error"
    AUTH_ERROR = "auth_error"
    WEBHOOK_ERROR = "webhook_error"
    ISSUE_TYPE_ERROR = "issue_type_error"
    ISSUE_TYPE_SCHEME_ERROR = "issue_type_scheme_error"
    UNKNOWN_ERROR = "unknown_error"


class Connection(Base):
    __tablename__ = "connections"

    id = Column(String(64), primary_key=True, default=uuid_generator)
    token = Column(LONGBLOB, nullable=False)
    token_iv = Column(BINARY(12), nullable=False)
    refresh_token = Column(LONGBLOB, nullable=False)
    refresh_token_iv = Column(BINARY(12), nullable=False)

    id_ = Column(String(64), index=True, nullable=False)
    name = Column(String(128), nullable=True, index=True)
    url = Column(String(256), nullable=True)
    scopes = Column(Text, nullable=True)
    avatar_url = Column(String(256), nullable=True)

    user_id = Column(
        String(64),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    sync_status = Column(String(512), nullable=True)
    sync_error = Column(
        SqlEnum(JiraSyncError),
        default=None,
        nullable=True,
    )

    user = relationship("User", back_populates="connections")
    projects = relationship(
        "Project", back_populates="connection", cascade="all, delete-orphan"
    )

    # On update event
    def before_update_listener(mapper, _, target):
        target.updated_at = utcnow()


class Project(Base):
    __tablename__ = "projects"
    id = Column(String(64), primary_key=True, default=uuid_generator)
    id_ = Column(String(64), nullable=False, index=True, default=uuid_generator)
    key = Column(String(32), nullable=False, index=True)
    name = Column(String(128), nullable=False)

    avatar_url = Column(String(256), nullable=True)

    connection_id = Column(
        String(64),
        ForeignKey("connections.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    connection = relationship("Connection", back_populates="projects")
    stories = relationship(
        "Story", back_populates="project", cascade="all, delete-orphan"
    )

    # On update event
    def before_update_listener(mapper, _, target):
        target.updated_at = utcnow()


class Story(Base):
    __tablename__ = "stories"
    id = Column(String(64), primary_key=True, default=uuid_generator)
    id_ = Column(String(64), nullable=False, index=True, default=uuid_generator)
    key = Column(String(32), nullable=False, index=True)
    summary = Column(String(256), nullable=False)
    description = Column(Text, nullable=True)

    project_id = Column(
        String(64),
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    project = relationship("Project", back_populates="stories")

    acs = relationship(
        "GherkinAC", back_populates="story", cascade="all, delete-orphan"
    )

    # On update event
    def before_update_listener(mapper, _, target):
        target.updated_at = utcnow()


class GherkinAC(Base):
    __tablename__ = "gherkin_acs"

    id = Column(String(64), primary_key=True, default=uuid_generator)
    id_ = Column(String(64), nullable=True, index=True, default=uuid_generator)
    key = Column(String(32), nullable=True, index=True)

    summary = Column(String(256), nullable=False)
    description = Column(Text, nullable=False)

    # Link to Story
    story_id = Column(
        String(64),
        ForeignKey("stories.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Use backref to avoid modifying JiraStory code, but ensure we have access
    story = relationship("Story", back_populates="acs")

    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(
        DateTime(timezone=True), default=utcnow, nullable=False, onupdate=utcnow
    )

    # On update event
    def before_update_listener(mapper, _, target):
        target.updated_at = utcnow()
