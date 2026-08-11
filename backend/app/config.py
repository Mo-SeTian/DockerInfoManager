"""Application configuration loaded from environment variables."""

from __future__ import annotations

import os


class Settings:
    # Docker
    docker_sock_path: str = os.getenv("DOCKER_SOCK_PATH", "/var/run/docker.sock")

    # Database
    database_path: str = os.getenv("DATABASE_PATH", "data/docker_info.db")

    # Poll interval (seconds)
    poll_interval: int = int(os.getenv("POLL_INTERVAL", "30"))

    # Auth
    admin_username: str = os.getenv("ADMIN_USERNAME", "admin")
    admin_password: str = os.getenv("ADMIN_PASSWORD", "admin123")
    jwt_secret_key: str = os.getenv("JWT_SECRET_KEY", "change-me-in-production")
    jwt_expire_hours: int = int(os.getenv("JWT_EXPIRE_HOURS", "24"))

    # CORS - the frontend dev server and production host
    cors_origins: list[str] = os.getenv("CORS_ORIGINS", "*").split(",")


settings = Settings()
