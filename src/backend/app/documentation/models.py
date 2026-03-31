from sqlalchemy import (
    Column,
    String,
    ForeignKey,
    Text,
    JSON,
    DateTime,
)

from common.database import Base, uuid_generator, utcnow


class TextDocumentation(Base):
    __tablename__ = "text_documentations"

    id = Column(String(64), primary_key=True, index=True, default=uuid_generator)
    connection_id = Column(
        String(64),
        ForeignKey("connections.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    project_key = Column(String(32), index=True, nullable=False)

    name = Column(String(256), nullable=False)
    description = Column(Text, nullable=True)
    content = Column(Text, nullable=True)
    headers = Column(JSON, nullable=True)

    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    # On update event
    def before_update_listener(mapper, _, target):
        target.updated_at = utcnow()


class FileDocumentation(Base):
    __tablename__ = "file_documentations"

    id = Column(String(64), primary_key=True, index=True, default=uuid_generator)
    connection_id = Column(
        String(64),
        ForeignKey("connections.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    project_key = Column(String(32), index=True, nullable=False)

    name = Column(String(256), nullable=False)
    url = Column(String(512), nullable=False)
    description = Column(Text, nullable=True)
    headers = Column(JSON, nullable=True)

    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    # On update event
    def before_update_listener(mapper, _, target):
        target.updated_at = utcnow()
