"""Overview statistics API."""

from fastapi import APIRouter
from ..services.docker_service import docker_client

router = APIRouter(prefix="/api/stats", tags=["stats"])


@router.get("")
def get_overview():
    return docker_client.get_stats().model_dump()
