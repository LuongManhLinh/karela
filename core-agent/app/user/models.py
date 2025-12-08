from common.database import Base, uuid_generator
from sqlalchemy import Column, String, text
from sqlalchemy.dialects.mysql import DATETIME
from sqlalchemy.orm import relationship


class User(Base):
    __tablename__ = "users"

    id = Column(String(64), primary_key=True, index=True, default=uuid_generator)
    username = Column(String(256), unique=True, index=True, nullable=False)
    email = Column(String(256), unique=True, index=True, nullable=True)
    # full_name = Column(String(256), nullable=True)  # Updated to String(256)
    hashed_password = Column(String(256), nullable=False)  # Updated to String(256)
    created_at = Column(
        DATETIME(fsp=2), server_default=text("CURRENT_TIMESTAMP(2)"), nullable=False
    )

    jira_connections = relationship(
        "JiraConnection", back_populates="user", cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<User(username={self.username}, email={self.email})>"
