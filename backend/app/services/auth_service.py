"""JWT authentication service — single-account gate mode.

Credentials are read from environment variables (ADMIN_USERNAME / ADMIN_PASSWORD).
No database involved. bcrypt is used to hash the password for comparison.
"""

from __future__ import annotations
import time
import bcrypt
import jwt
from typing import Optional
from ..config import settings

# Cache the hashed password at startup
_HASHED_PASSWORD: Optional[str] = None


def _get_hashed_password() -> str:
    global _HASHED_PASSWORD
    if _HASHED_PASSWORD is None:
        _HASHED_PASSWORD = bcrypt.hashpw(
            settings.admin_password.encode(), bcrypt.gensalt()
        ).decode()
    return _HASHED_PASSWORD


def verify_credentials(username: str, password: str) -> bool:
    """Check username/password against environment variables."""
    if username != settings.admin_username:
        return False
    return bcrypt.checkpw(password.encode(), _get_hashed_password().encode())


def create_token() -> str:
    """Create a JWT token valid for the configured duration."""
    now = int(time.time())
    payload = {
        "sub": settings.admin_username,
        "iat": now,
        "exp": now + settings.jwt_expire_hours * 3600,
    }
    return jwt.encode(payload, settings.jwt_secret_key, algorithm="HS256")


def verify_token(token: str) -> dict | None:
    """Verify a JWT token. Returns payload dict or None if invalid/expired."""
    try:
        payload = jwt.decode(
            token, settings.jwt_secret_key, algorithms=["HS256"]
        )
        return payload
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        return None


# In-memory token blacklist for logout
_token_blacklist: set[str] = set()


def blacklist_token(token: str):
    _token_blacklist.add(token)


def is_blacklisted(token: str) -> bool:
    return token in _token_blacklist
