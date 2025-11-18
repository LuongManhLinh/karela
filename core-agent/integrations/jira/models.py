from sqlalchemy import Column, String, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.mysql import BINARY, LONGBLOB


from common.database import Base, uuid_generator


class JiraConnection(Base):
    __tablename__ = "jira_connections"

    id = Column(String(64), primary_key=True, default=uuid_generator)
    token = Column(LONGBLOB, nullable=False)
    token_iv = Column(BINARY(16), nullable=False)
    refresh_token = Column(LONGBLOB, nullable=False)
    refresh_token_iv = Column(BINARY(16), nullable=False)

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

    user = relationship("User", back_populates="jira_connections")


#     cloud_infos = relationship(
#         "JiraCloudInfo",
#         back_populates="connection",
#         uselist=False,
#         cascade="all, delete-orphan",
#     )


# class JiraCloudInfo(Base):
#     __tablename__ = "jira_cloud_info"

#     id = Column(String(64), primary_key=True)
#     name = Column(String(128), nullable=True)
#     url = Column(String(256), nullable=True)
#     scopes = Column(ARRAY(String(64)), nullable=True)
#     avatar_url = Column(String(256), nullable=True)

#     connection_id = Column(
#         String(64),
#         ForeignKey("jira_connections.id", ondelete="CASCADE"),
#         nullable=False,
#         index=True,
#     )

#     connection = relationship("JiraConnection", back_populates="cloud_info")
