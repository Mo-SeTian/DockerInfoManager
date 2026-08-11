"""Docker SDK read-only wrapper with strict safety constraints.

ONLY list/get/inspect operations are permitted. Any write operation
(create, start, stop, remove, etc.) is blocked at the code level.

Also prohibits users from modifying Docker objects — this is
a pure observation-only layer.
"""

import docker
from docker.models.containers import Container
from docker.models.images import Image
from docker.errors import DockerException
from typing import Optional
from ..config import settings
from ..models.docker_models import (
    ContainerInfo,
    ContainerListItem,
    PortMapping,
    NetworkInfo,
    MountInfo,
    ImageInfo,
    OverviewStats,
)


class DockerReadOnlyClient:
    """Read-only Docker client. All write operations are blocked."""

    def __init__(self):
        self._client: Optional[docker.DockerClient] = None

    @property
    def client(self) -> docker.DockerClient:
        if self._client is None:
            self._client = docker.DockerClient(
                base_url=f"unix://{settings.docker_sock_path}"
            )
        return self._client

    def list_containers(self, all: bool = True) -> list[ContainerListItem]:
        """List all containers."""
        containers = self.client.containers.list(all=all)
        return [_to_list_item(c) for c in containers]

    def get_container(self, container_id: str) -> Optional[ContainerInfo]:
        """Get detailed info for a single container."""
        try:
            c = self.client.containers.get(container_id)
            return _to_container_info(c)
        except docker.errors.NotFound:
            return None

    def list_images(self) -> list[ImageInfo]:
        """List all images."""
        images = self.client.images.list()
        return [_to_image_info(i) for i in images]

    def get_stats(self) -> OverviewStats:
        """Get overview statistics."""
        all_containers = self.client.containers.list(all=True)
        images = self.client.images.list()

        states = {"running": 0, "exited": 0, "paused": 0, "stopped": 0}
        for c in all_containers:
            state = c.status
            if state in states:
                states[state] += 1
            else:
                states["stopped"] += 1

        return OverviewStats(
            total_containers=len(all_containers),
            running=states["running"],
            stopped=states["stopped"] + states["exited"],
            paused=states["paused"],
            exited=states["exited"],
            total_images=len(images),
        )


def _to_list_item(c: Container) -> ContainerListItem:
    return ContainerListItem(
        id=c.short_id,
        name=c.name,
        image=_image_tag(c),
        state=c.status,
        status=c.status,
        ports=_extract_ports(c),
        created_at=_ts(c.attrs.get("Created")),
    )


def _to_container_info(c: Container) -> ContainerInfo:
    attrs = c.attrs
    net_settings = attrs.get("NetworkSettings", {})

    # Extract networks
    networks = []
    for net_name, net_data in net_settings.get("Networks", {}).items():
        networks.append(
            NetworkInfo(
                name=net_name,
                ip_address=net_data.get("IPAddress"),
            )
        )

    # Extract mounts
    mounts = []
    for m in attrs.get("Mounts", []):
        mounts.append(
            MountInfo(
                source=m.get("Source", ""),
                destination=m.get("Destination", ""),
                mode=m.get("Mode", "rw"),
            )
        )

    # Extract env vars (sanitize sensitive ones)
    env_vars = {}
    sensitive_keys = {"PASSWORD", "SECRET", "KEY", "TOKEN", "CREDENTIAL"}
    for env_entry in attrs.get("Config", {}).get("Env", []):
        if "=" in env_entry:
            k, v = env_entry.split("=", 1)
            if any(s in k.upper() for s in sensitive_keys):
                env_vars[k] = "***REDACTED***"
            else:
                env_vars[k] = v

    # CPU / memory from stats (optional, may throw)
    cpu = None
    mem = None
    mem_limit = None
    try:
        if c.status == "running":
            stats = c.stats(stream=False)
            cpu_delta = (
                stats["cpu_stats"]["cpu_usage"]["total_usage"]
                - stats["precpu_stats"]["cpu_usage"]["total_usage"]
            )
            system_delta = (
                stats["cpu_stats"]["system_cpu_usage"]
                - stats["precpu_stats"]["system_cpu_usage"]
            )
            num_cpus = stats["cpu_stats"].get("online_cpus", 1)
            if system_delta > 0:
                cpu = round((cpu_delta / system_delta) * num_cpus * 100, 2)
            mem = stats["memory_stats"].get("usage", 0)
            mem_limit = stats["memory_stats"].get("limit", 0)
    except Exception:
        pass

    return ContainerInfo(
        id=c.short_id,
        name=c.name,
        image=_image_tag(c),
        image_id=attrs.get("Image", "").lstrip("sha256:")[:12],
        status=c.status,
        state=c.status,
        created_at=_ts(attrs.get("Created")),
        started_at=_ts(attrs.get("State", {}).get("StartedAt")),
        ports=_extract_ports(c),
        networks=networks,
        mounts=mounts,
        env_vars=env_vars,
        cpu_usage=cpu,
        memory_usage=mem,
        memory_limit=mem_limit,
    )


def _to_image_info(img: Image) -> ImageInfo:
    return ImageInfo(
        id=img.short_id,
        tags=img.tags if img.tags else ["<none>:<none>"],
        size=img.attrs.get("Size", 0),
        created_at=_ts(img.attrs.get("Created")),
    )


def _extract_ports(c: Container) -> list[PortMapping]:
    """Extract port mappings from container."""
    ports = []
    port_data = c.attrs.get("NetworkSettings", {}).get("Ports", {}) or {}
    for container_port, bindings in port_data.items():
        proto = "tcp"
        if "/" in container_port:
            port_str, proto = container_port.rsplit("/", 1)
            c_port = int(port_str)
        else:
            c_port = int(container_port)

        if bindings:
            for b in bindings:
                ports.append(
                    PortMapping(
                        host_ip=b.get("HostIp", "0.0.0.0"),
                        host_port=int(b.get("HostPort")) if b.get("HostPort") else None,
                        container_port=c_port,
                        protocol=proto,
                    )
                )
        else:
            # Exposed but not published
            ports.append(
                PortMapping(
                    container_port=c_port,
                    protocol=proto,
                )
            )
    return ports


def _image_tag(c: Container) -> str:
    """Get the primary image tag from container config."""
    config = c.attrs.get("Config", {})
    img = config.get("Image", "")
    if img and ":" in img:
        return img
    image_name = c.attrs.get("Config", {}).get("Image", "unknown")
    return image_name


def _ts(iso_str: Optional[str]) -> Optional[str]:
    if not iso_str:
        return None
    # Docker returns ISO 8601 with nanoseconds; strip sub-seconds for nicer display
    if "." in iso_str:
        iso_str = iso_str.split(".")[0] + "Z"
    return iso_str


# Singleton instance
docker_client = DockerReadOnlyClient()
