"""Container read-only API."""

from fastapi import APIRouter, HTTPException
from ..services.docker_service import docker_client
from ..services.custom_service import get_all_custom, get_container_custom

router = APIRouter(prefix="/api/containers", tags=["containers"])


@router.get("")
def list_containers():
    containers = docker_client.list_containers(all=True)
    custom_map = get_all_custom()

    result = []
    for c in containers:
        custom = custom_map.get(c.id, None)
        result.append({
            "id": c.id,
            "name": c.name,
            "image": c.image,
            "state": c.state,
            "status": c.status,
            "ports": [p.model_dump() for p in c.ports],
            "created_at": c.created_at,
            # Custom metadata
            "alias": custom.alias if custom else None,
            "icon": custom.icon if custom else None,
            "group_name": custom.group_name if custom else None,
            "notes": custom.notes if custom else None,
            "is_favorite": custom.is_favorite if custom else False,
            "jump_protocol": custom.jump_protocol if custom else "http",
            "jump_port": custom.jump_port if custom else None,
        })
    return result


@router.get("/{container_id}")
def get_container(container_id: str):
    info = docker_client.get_container(container_id)
    if info is None:
        raise HTTPException(status_code=404, detail="Container not found")
    custom = get_container_custom(container_id)
    result = info.model_dump()
    if custom:
        result["custom"] = custom.model_dump()
    return result
