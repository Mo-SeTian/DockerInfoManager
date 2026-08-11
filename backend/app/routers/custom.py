"""Custom metadata API for containers (SQLite only)."""

from fastapi import APIRouter, HTTPException
from ..services.custom_service import (
    get_container_custom,
    upsert_container_custom,
    delete_container_custom,
    bulk_move,
    set_hidden,
)
from ..models.custom_models import (
    ContainerCustomUpdate,
    MoveContainerRequest,
    BatchMoveRequest,
    BatchHideRequest,
)

router = APIRouter(prefix="/api/custom", tags=["custom"])


@router.get("/containers/{container_id}")
def get_custom(container_id: str):
    custom = get_container_custom(container_id)
    if custom is None:
        raise HTTPException(status_code=404, detail="No custom data for this container")
    return custom.model_dump()


@router.put("/containers/{container_id}")
def update_custom(container_id: str, data: ContainerCustomUpdate):
    result = upsert_container_custom(container_id, data)
    return result.model_dump()


@router.delete("/containers/{container_id}")
def remove_custom(container_id: str):
    if not delete_container_custom(container_id):
        raise HTTPException(status_code=404, detail="No custom data for this container")
    return {"detail": "Custom data deleted"}


@router.put("/containers/{container_id}/group")
def move_container(container_id: str, data: MoveContainerRequest):
    update = ContainerCustomUpdate(group_name=data.group_name)
    result = upsert_container_custom(container_id, update)
    return result.model_dump()


@router.post("/bulk-move")
def bulk_move_containers(data: BatchMoveRequest):
    count = bulk_move(data.container_ids, data.group_name)
    return {"detail": f"Moved {count} containers", "group_name": data.group_name}


@router.post("/bulk-hide")
def bulk_hide_containers(data: BatchHideRequest):
    count = set_hidden(data.container_ids, data.is_hidden)
    action = "hidden" if data.is_hidden else "unhidden"
    return {"detail": f"{count} containers {action}"}
