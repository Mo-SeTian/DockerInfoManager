"""Container read-only API."""

from fastapi import APIRouter, HTTPException, Query
from ..services.docker_service import docker_client
from ..services.custom_service import (
    get_all_custom,
    get_container_custom,
    migrate_container_id,
    update_container_name,
)

router = APIRouter(prefix="/api/containers", tags=["containers"])


@router.get("")
def list_containers(show_hidden: bool = Query(False)):
    containers = docker_client.list_containers(all=True)
    custom_map = get_all_custom()

    # Build name index from stored custom rows (container_name may be stale)
    custom_by_name = {}
    for cust in custom_map.values():
        if getattr(cust, "container_name", None):
            custom_by_name[cust.container_name] = cust

    result = []
    for c in containers:
        custom = custom_map.get(c.id, None)

        # If container was rebuilt (new ID), rebind config by stable name
        if custom is None and c.name in custom_by_name:
            old_custom = custom_by_name[c.name]
            if migrate_container_id(old_custom.id, c.id, c.name):
                custom = get_container_custom(c.id)
                custom_map[c.id] = custom
                custom_by_name[c.name] = custom
        elif custom is not None:
            # Keep name in sync for future rebuilds
            if custom.container_name != c.name:
                update_container_name(c.id, c.name)
                custom = get_container_custom(c.id)
                custom_map[c.id] = custom

        is_hidden = custom.is_hidden if custom else False
        if is_hidden and not show_hidden:
            continue

        result.append({
            "id": c.id,
            "name": c.name,
            "image": c.image,
            "state": c.state,
            "status": c.status,
            "ports": [p.model_dump() for p in c.ports],
            "compose_project": c.compose_project,
            "compose_service": c.compose_service,
            "created_at": c.created_at,
            # Custom metadata
            "alias": custom.alias if custom else None,
            "icon": custom.icon if custom else None,
            "icon_url": custom.icon_url if custom else None,
            "group_name": custom.group_name if custom else None,
            "notes": custom.notes if custom else None,
            "is_favorite": custom.is_favorite if custom else False,
            "is_hidden": is_hidden,
            "jump_protocol": custom.jump_protocol if custom else "http",
            "jump_port": custom.jump_port if custom else None,
            "private_url": custom.private_url if custom else None,
            "public_url": custom.public_url if custom else None,
            "url_preference": custom.url_preference if custom else "auto",
            "merge_name": custom.merge_name if custom else None,
            "merge_url": custom.merge_url if custom else None,
            "sort_order": custom.sort_order if custom else 0,
            "tags": custom.tags if custom else None,
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
