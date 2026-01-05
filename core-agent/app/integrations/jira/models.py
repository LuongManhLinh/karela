from sqlalchemy import Column, String, ForeignKey, Text, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.mysql import BINARY, LONGBLOB


from common.database import Base, uuid_generator, utcnow


class JiraConnection(Base):
    __tablename__ = "jira_connections"

    id = Column(String(64), primary_key=True, default=uuid_generator)
    token = Column(LONGBLOB, nullable=False)
    token_iv = Column(BINARY(12), nullable=False)
    refresh_token = Column(LONGBLOB, nullable=False)
    refresh_token_iv = Column(BINARY(12), nullable=False)

    cloud_id = Column(String(64), index=True, nullable=False)
    name = Column(String(128), nullable=True)
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

    user = relationship("User", back_populates="jira_connections")
    projects = relationship(
        "JiraProject", back_populates="jira_connection", cascade="all, delete-orphan"
    )

    # On update event
    def before_update_listener(mapper, connection, target):
        target.updated_at = utcnow()


class JiraProject(Base):
    __tablename__ = "jira_projects"

    id = Column(String(64), primary_key=True, default=uuid_generator)
    key = Column(String(32), nullable=False, index=True)
    name = Column(String(128), nullable=False)

    jira_connection_id = Column(
        String(64),
        ForeignKey("jira_connections.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    jira_connection = relationship("JiraConnection", back_populates="projects")
    stories = relationship(
        "JiraStory", back_populates="jira_project", cascade="all, delete-orphan"
    )

    # On update event
    def before_update_listener(mapper, connection, target):
        target.updated_at = utcnow()


class JiraStory(Base):
    __tablename__ = "jira_stories"

    id = Column(String(64), primary_key=True, default=uuid_generator)
    key = Column(String(32), nullable=False, index=True)
    summary = Column(String(256), nullable=False)
    description = Column(Text, nullable=True)

    jira_project_id = Column(
        String(64),
        ForeignKey("jira_projects.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    jira_project = relationship("JiraProject", back_populates="stories")

    # On update event
    def before_update_listener(mapper, connection, target):
        target.updated_at = utcnow()
