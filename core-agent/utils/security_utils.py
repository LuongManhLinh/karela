from cryptography.hazmat.primitives.ciphers.aead import AESGCM
import os
import jwt
from common.configs import AuthConfig

from datetime import datetime, timedelta, timezone


def generate_jwt(user_id: str, username: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user_id,
        "username": username,
        "exp": now + timedelta(days=1),
        "iat": now,
        "jti": f"{user_id}{now.timestamp()}",
    }
    token = jwt.encode(payload, AuthConfig.JWT_SECRET_KEY, algorithm="HS256")
    return token


def verify_jwt(token: str):
    """Verify the given JWT token and return the payload if valid."""
    try:
        payload = jwt.decode(token, AuthConfig.JWT_SECRET_KEY, algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        raise ValueError("Token has expired")
    except jwt.InvalidTokenError:
        raise ValueError("Invalid token")


# Key must be 32 bytes for AES-256
key = AuthConfig.AES_KEY

aesgcm = AESGCM(key)


def encrypt_token(token: bytes | str) -> tuple[bytes, bytes]:
    """Encrypt the given token using AES-GCM."""
    iv = os.urandom(12)
    if isinstance(token, str):
        token = token.encode("utf-8")
    encrypted_token = aesgcm.encrypt(iv, token, None)
    return encrypted_token, iv


def decrypt_token(encrypted_token: bytes, iv: bytes) -> str:
    """Decrypt the given token using AES-GCM."""
    decrypted_token = aesgcm.decrypt(iv, encrypted_token, None)

    # Return as string
    return decrypted_token.decode("utf-8")
