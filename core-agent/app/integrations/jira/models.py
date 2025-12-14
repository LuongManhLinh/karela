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

    # On update event
    def before_update_listener(mapper, connection, target):
        target.updated_at = utcnow()
