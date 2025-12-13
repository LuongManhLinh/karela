from sqlalchemy import Column, String, ForeignKey, Text, JSON, DateTime

from common.database import Base, uuid_generator, utcnow


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

    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    # On update event
    def before_update_listener(mapper, connection, target):
        target.updated_at = utcnow()
