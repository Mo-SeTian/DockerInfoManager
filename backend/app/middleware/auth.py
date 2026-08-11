"""JWT authentication middleware — path traversal firewall.

Intercepts every request. Only /api/auth/login goes through without a token.
All other /api/* paths MUST carry a valid JWT or get 401.
"""

from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from ..services.auth_service import verify_token, is_blacklisted

# Paths that bypass auth
PUBLIC_PATHS = {
    "/api/auth/login",
    "/api/auth/refresh",
    "/api/health",
    "/docs",
    "/openapi.json",
}


class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        path = request.url.path

        # Allow public paths
        if path in PUBLIC_PATHS:
            return await call_next(request)

        # Allow non-API static paths (served by frontend)
        if not path.startswith("/api/"):
            return await call_next(request)

        # All /api/* paths require auth
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return JSONResponse(
                status_code=401,
                content={"detail": "Missing or invalid authentication token"},
            )

        token = auth_header[len("Bearer "):]
        if is_blacklisted(token):
            return JSONResponse(
                status_code=401,
                content={"detail": "Token has been revoked"},
            )

        payload = verify_token(token)
        if payload is None:
            return JSONResponse(
                status_code=401,
                content={"detail": "Invalid or expired token"},
            )

        # Valid — proceed
        return await call_next(request)
