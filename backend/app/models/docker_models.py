"""Pydantic models for Docker container data."""

from __future__ import annotations
from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class PortMapping(BaseModel):
    host_ip: str = "0.0.0.0"
    host_port: Optional[int] = None
    container_port: int
    protocol: str = "tcp"


class NetworkInfo(BaseModel):
    name: str
    ip_address: Optional[str] = None


class MountInfo(BaseModel):
    source: str
    destination: str
    mode: str = "rw"


class ContainerInfo(BaseModel):
    id: str
    name: str
    image: str
    image_id: str
    status: str
    state: str  # running, exited, paused, etc.
    created_at: Optional[str] = None
    started_at: Optional[str] = None
    ports: list[PortMapping] = []
    networks: list[NetworkInfo] = []
    mounts: list[MountInfo] = []
    env_vars: dict[str, str] = {}
    cpu_usage: Optional[float] = None
    memory_usage: Optional[int] = None  # bytes
    memory_limit: Optional[int] = None  # bytes


class ContainerInfo(BaseModel):
    id: str
    name: str
    image: str
    image_id: str
    status: str
    state: str
    created_at: Optional[str] = None
    started_at: Optional[str] = None
    ports: list[PortMapping] = []
    networks: list[NetworkInfo] = []
    mounts: list[MountInfo] = []
    env_vars: dict[str, str] = {}
    compose_project: Optional[str] = None
    compose_service: Optional[str] = None
    cpu_usage: Optional[float] = None
    memory_usage: Optional[int] = None
    memory_limit: Optional[int] = None


class ContainerListItem(BaseModel):
    id: str
    name: str
    image: str
    state: str
    status: str
    ports: list[PortMapping] = []
    compose_project: Optional[str] = None
    compose_service: Optional[str] = None
    created_at: Optional[str] = None


class ImageInfo(BaseModel):
    id: str
    tags: list[str]
    size: int  # bytes
    created_at: Optional[str] = None


class OverviewStats(BaseModel):
    total_containers: int
    running: int
    stopped: int
    paused: int
    exited: int
    total_images: int
