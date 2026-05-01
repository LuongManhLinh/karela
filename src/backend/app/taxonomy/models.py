from sqlalchemy import (
    Column,
    Index,
    String,
    ForeignKey,
    Text,
)
from sqlalchemy.orm import relationship

from common.database import Base, uuid_generator


class Bucket(Base):
    __tablename__ = "buckets"

    id = Column(String(64), primary_key=True, default=uuid_generator)
    connection_id = Column(
        String(64),
        ForeignKey("connections.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    project_key = Column(String(64), nullable=False, index=True)
    tag = Column(String(128), nullable=False, index=True)
    description = Column(Text, nullable=True)

    items = relationship(
        "BucketItem", back_populates="bucket", cascade="all, delete-orphan"
    )


class BucketItem(Base):
    __tablename__ = "bucket_items"

    id = Column(String(64), primary_key=True, default=uuid_generator)
    bucket_id = Column(
        String(64),
        ForeignKey("buckets.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    story_key = Column(String(64), nullable=False, index=True)

    bucket = relationship("Bucket", back_populates="items")
