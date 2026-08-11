"""Authentication router — login / logout / refresh."""

from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from ..services.auth_service import (
    verify_credentials,
    create_token,
    verify_token,
    blacklist_token,
    is_blacklisted,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest):
    if not verify_credentials(body.username, body.password):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    token = create_token()
    return TokenResponse(access_token=token)


@router.post("/refresh", response_model=TokenResponse)
def refresh(authorization: str = Header(...)):
    """Refresh a token that is still valid but close to expiry."""
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid token format")
    token = authorization[len("Bearer "):]

    if is_blacklisted(token):
        raise HTTPException(status_code=401, detail="Token has been revoked")

    payload = verify_token(token)
    if payload is None:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    new_token = create_token()
    return TokenResponse(access_token=new_token)


@router.post("/logout")
def logout(authorization: str = Header(...)):
    """Logout — blacklist the current token."""
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid token format")
    token = authorization[len("Bearer "):]
    blacklist_token(token)
    return {"detail": "Logged out"}
