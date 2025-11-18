from argon2 import PasswordHasher
from sqlalchemy.orm import Session
from utils.security_utils import generate_jwt
from .models import User
from .schemas import UserDto, UserConnections

from integrations import JiraService

ph = PasswordHasher(
    time_cost=4, memory_cost=256 * 1024, parallelism=4, hash_len=32, salt_len=16
)


class UserService:
    @staticmethod
    def register(db: Session, username: str, password: str, email: str = None) -> None:
        if db.query(User).filter(User.username == username).first():
            raise ValueError("Username already exists")
        db.add(
            User(
                username=username,
                hashed_password=ph.hash(password),
                email=email,
            )
        )
        db.commit()

    @staticmethod
    def authenticate(db: Session, username_or_email: str, password: str) -> str:
        user = (
            db.query(User)
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

    @staticmethod
    def get_user(db: Session, user_id: str) -> UserDto:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("User not found")
        return UserDto(username=user.username, email=user.email)

    @staticmethod
    def change_password(
        db: Session, user_id: str, old_password: str, new_password: str
    ) -> None:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError("User not found")
        if not ph.verify(user.hashed_password, old_password):
            raise ValueError("Old password is incorrect")
        user.hashed_password = ph.hash(new_password)
        db.add(user)
        db.commit()

    @staticmethod
    def get_user_connections(db: Session, user_id: str) -> UserConnections:
        jira_connections = JiraService.list_user_connections(db, user_id)
        # Placeholder for other integrations
        azure_devops_connections = []
        return UserConnections(
            jira_connections=jira_connections,
            azure_devops_connections=azure_devops_connections,
        )
