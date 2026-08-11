"""FastAPI application entry point — DockerInfoManager backend."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import os

from .config import settings
from .database import init_db
from .middleware.auth import AuthMiddleware
from .routers import auth, containers, images, groups, custom, stats


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    init_db()
    yield
    # Shutdown — nothing to clean up


app = FastAPI(
    title="DockerInfoManager",
    description="🦐 Read-only Docker container dashboard",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# JWT auth middleware — must be added AFTER CORS
app.add_middleware(AuthMiddleware)

# API routes
app.include_router(auth.router)
app.include_router(containers.router)
app.include_router(images.router)
app.include_router(groups.router)
app.include_router(custom.router)
app.include_router(stats.router)

# Serve frontend static files in production
frontend_dist = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")
if os.path.exists(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="frontend")


@app.get("/api/health")
def health_check():
    """Health check endpoint (does not require auth)."""
    return {"status": "ok", "version": "1.0.0"}
