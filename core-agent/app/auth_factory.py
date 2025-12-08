from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from utils.security_utils import verify_jwt
from .service_factory import get_user_service

security = HTTPBearer()


def get_jwt_payload(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    user_service=Depends(get_user_service),
):
    token = credentials.credentials
    try:
        payload = verify_jwt(token=token)
        if not user_service.is_valid_user(user_id=payload.get("sub")):
            raise HTTPException(status_code=401, detail="Invalid user")
        return payload
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))
