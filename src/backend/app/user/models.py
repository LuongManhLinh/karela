from common.database import Base, uuid_generator, utcnow
from sqlalchemy import Column, String, DateTime
from sqlalchemy.orm import relationship


class User(Base):
    __tablename__ = "users"

    id = Column(String(64), primary_key=True, index=True, default=uuid_generator)
    username = Column(String(256), unique=True, index=True, nullable=False)
    email = Column(String(256), unique=True, index=True, nullable=True)
    # full_name = Column(String(256), nullable=True)  # Updated to String(256)
    hashed_password = Column(String(256), nullable=False)  # Updated to String(256)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    connections = relationship(
        "Connection", back_populates="user", cascade="all, delete-orphan"
    )

    # On update event
    def before_update_listener(mapper, connection, target):
        target.updated_at = utcnow()
