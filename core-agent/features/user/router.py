from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from common.schemas import BasicResponse
from common.database import get_db
from common.fastapi_router import get_jwt_payload
from .schemas import (
    RegisterUserRequest,
    AuthenticateUserRequest,
    ChangePasswordRequest,
    UserDto,
    UserConnections,
)
from .services import UserService

router = APIRouter()


@router.post("/register")
def register_user(request: RegisterUserRequest, db: Session = Depends(get_db)):
    try:
        UserService.register(
            db=db,
            username=request.username,
            password=request.password,
            email=request.email,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return BasicResponse(detail="User registered successfully")


@router.post("/")
def authenticate_user(request: AuthenticateUserRequest, db: Session = Depends(get_db)):
    try:
        token = UserService.authenticate(
            db=db,
            username_or_email=request.username_or_email,
            password=request.password,
        )
    except ValueError as e:
        import traceback

        traceback.print_exc()
        raise HTTPException(status_code=400, detail=str(e))
    return BasicResponse(detail="Authentication successful", data=token)


@router.get("/")
def get_current_user(
    db: Session = Depends(get_db), jwt_payload=Depends(get_jwt_payload)
):
    user_id = jwt_payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid JWT payload: missing sub")
    try:
        user_dto: UserDto = UserService.get_user(db, user_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return BasicResponse(data=user_dto)


@router.post("/change-password")
def change_password(
    request: ChangePasswordRequest,
    db: Session = Depends(get_db),
    jwt_payload=Depends(get_jwt_payload),
):
    user_id = jwt_payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid JWT payload: missing sub")
    try:
        UserService.change_password(
            db,
            user_id,
            old_password=request.old_password,
            new_password=request.new_password,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return BasicResponse(detail="Password changed successfully")


@router.get("/connections")
def get_user_connections(
    db: Session = Depends(get_db),
    jwt_payload=Depends(get_jwt_payload),
):
    user_id = jwt_payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid JWT payload: missing sub")
    try:
        connections: UserConnections = UserService.get_user_connections(db, user_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return BasicResponse(data=connections)
