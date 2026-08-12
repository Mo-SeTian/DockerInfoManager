"""Pydantic models for custom container metadata and groups."""

from pydantic import BaseModel, Field
from typing import Optional, List


class ContainerCustomUpdate(BaseModel):
    alias: Optional[str] = None
    icon: Optional[str] = None
    icon_url: Optional[str] = None
    group_name: Optional[str] = None
    notes: Optional[str] = None
    is_favorite: Optional[bool] = None
    is_hidden: Optional[bool] = None
    jump_protocol: Optional[str] = None
    jump_port: Optional[int] = None
    private_url: Optional[str] = None
    public_url: Optional[str] = None
    url_preference: Optional[str] = Field(default=None, description="auto | private | public")
    merge_name: Optional[str] = None
    merge_url: Optional[str] = None
    sort_order: Optional[int] = None
    tags: Optional[str] = None  # JSON array as string, e.g. '["web","prod"]'


class ContainerCustomResponse(BaseModel):
    id: str
    alias: Optional[str] = None
    icon: Optional[str] = None
    icon_url: Optional[str] = None
    group_name: Optional[str] = None
    notes: Optional[str] = None
    is_favorite: bool = False
    is_hidden: bool = False
    jump_protocol: str = "http"
    jump_port: Optional[int] = None
    private_url: Optional[str] = None
    public_url: Optional[str] = None
    url_preference: str = "auto"
    merge_name: Optional[str] = None
    merge_url: Optional[str] = None
    sort_order: int = 0
    tags: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class GroupCreate(BaseModel):
    name: str
    color: Optional[str] = "#38bdf8"
    sort_order: int = 0


class GroupUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None
    sort_order: Optional[int] = None


class GroupResponse(BaseModel):
    id: int
    name: str
    color: str
    sort_order: int
    container_count: int = 0
    running_count: int = 0


class MoveContainerRequest(BaseModel):
    group_name: Optional[str] = None


class BatchMoveRequest(BaseModel):
    container_ids: List[str]
    group_name: Optional[str] = None


class BatchHideRequest(BaseModel):
    container_ids: List[str]
    is_hidden: bool = True


class ReorderRequest(BaseModel):
    container_id: str
    direction: str  # 'up' | 'down'
