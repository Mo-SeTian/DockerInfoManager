"""Image read-only API."""

from fastapi import APIRouter
from ..services.docker_service import docker_client

router = APIRouter(prefix="/api/images", tags=["images"])


@router.get("")
def list_images():
    images = docker_client.list_images()
    return [i.model_dump() for i in images]
