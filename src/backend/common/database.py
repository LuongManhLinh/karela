from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from uuid import uuid4
from datetime import datetime, timezone

from common.configs import DatabaseConfig

Base = declarative_base()

engine = create_engine(DatabaseConfig.DATA_SOURCE)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def uuid_generator():
    return str(uuid4())


def utcnow():
    return datetime.now(timezone.utc)
