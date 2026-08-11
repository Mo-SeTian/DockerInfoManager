"""Group management API (SQLite only)."""

from fastapi import APIRouter, HTTPException
from ..services.custom_service import (
    list_groups,
    create_group,
    update_group,
    delete_group,
)
from ..models.custom_models import GroupCreate, GroupUpdate

router = APIRouter(prefix="/api/groups", tags=["groups"])


@router.get("")
def get_groups():
    return [g.model_dump() for g in list_groups()]


@router.post("")
def add_group(data: GroupCreate):
    try:
        g = create_group(data)
    except Exception as e:
        raise HTTPException(status_code=409, detail=str(e))
    return g.model_dump()


@router.put("/{group_id}")
def edit_group(group_id: int, data: GroupUpdate):
    g = update_group(group_id, data.model_dump(exclude_none=True))
    if g is None:
        raise HTTPException(status_code=404, detail="Group not found")
    return g.model_dump()


@router.delete("/{group_id}")
def remove_group(group_id: int):
    if not delete_group(group_id):
        raise HTTPException(status_code=404, detail="Group not found")
    return {"detail": "Group deleted"}
