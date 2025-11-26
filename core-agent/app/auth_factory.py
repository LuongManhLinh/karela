from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from utils.security_utils import verify_jwt

security = HTTPBearer()


def get_jwt_payload(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = verify_jwt(token=token)
        return payload  # ideally user info inside payload
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))
