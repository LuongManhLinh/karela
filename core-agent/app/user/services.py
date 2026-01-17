from argon2 import PasswordHasher
from sqlalchemy.orm import Session
from utils.security_utils import generate_jwt
from .models import User
from .schemas import UserDto, UserConnections

from app.connection.jira.schemas import JiraConnectionDto

ph = PasswordHasher(
    time_cost=4, memory_cost=256 * 1024, parallelism=4, hash_len=32, salt_len=16
)


class UserService:
    def __init__(self, db: Session):
        self.db = db

    def register(self, username: str, password: str, email: str = None) -> None:
        if self.db.query(User).filter(User.username == username).first():
            raise ValueError("Username already exists")
        self.db.add(
            User(
                username=username,
                hashed_password=ph.hash(password),
                email=email,
            )
        )
        self.db.commit()

    def authenticate(self, username_or_email: str, password: str) -> str:
        user = (
            self.db.query(User)
            .filter(
                (User.username == username_or_email) | (User.email == username_or_email)
            )
            .first()
        )
        if not user:
            raise ValueError("User not found")
        try:
            ph.verify(user.hashed_password, password)
        except Exception as e:
            raise ValueError("Password verification failed") from e
        return generate_jwt(
            user.id,
            user.username,
        )

    def get_user(self, user_id: str) -> UserDto:
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("User not found")
        return UserDto(username=user.username, email=user.email)

    def change_password(
        self, user_id: str, old_password: str, new_password: str
    ) -> None:
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("User not found")
        if not ph.verify(user.hashed_password, old_password):
            raise ValueError("Old password is incorrect")
        user.hashed_password = ph.hash(new_password)
        self.db.add(user)
        self.db.commit()

    def get_connections(self, user_id: str) -> UserConnections:
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            print("User not found in get_connections")
            raise ValueError("User not found")

        jira_connections = [
            JiraConnectionDto(
                id=conn.id,
                cloud_id=conn.cloud_id,
                name=conn.name,
                avatar_url=conn.avatar_url,
                url=conn.url,
            )
            for conn in user.jira_connections
        ]

        return UserConnections(
            jira_connections=jira_connections, azure_devops_connections=[]
        )

    def is_valid_user(self, user_id: str) -> bool:
        user = self.db.get(User, user_id)
        return user is not None
