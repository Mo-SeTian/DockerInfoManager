"""Pydantic models for custom container metadata and groups."""

from pydantic import BaseModel
from typing import Optional


class ContainerCustomUpdate(BaseModel):
    alias: Optional[str] = None
    icon: Optional[str] = None
    group_name: Optional[str] = None
    notes: Optional[str] = None
    is_favorite: Optional[bool] = None
    jump_protocol: Optional[str] = None
    jump_port: Optional[int] = None


class ContainerCustomResponse(BaseModel):
    id: str
    alias: Optional[str] = None
    icon: Optional[str] = None
    group_name: Optional[str] = None
    notes: Optional[str] = None
    is_favorite: bool = False
    jump_protocol: str = "http"
    jump_port: Optional[int] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class GroupCreate(BaseModel):
    name: str
    color: str = "#38bdf8"


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
    group_name: Optional[str] = None  # None = ungroup
