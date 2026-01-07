from sqlalchemy import Column, String, Text, Enum as SqlEnum, Integer
from common.database import Base
from common.schemas import Platform


class Connection(Base):
    __tablename__ = "connections"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    platform_connection_id = Column(String(64), nullable=False, index=True, unique=True)
    platform = Column(SqlEnum(Platform), nullable=False, index=True)
