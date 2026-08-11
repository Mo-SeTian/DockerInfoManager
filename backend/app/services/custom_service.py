"""CRUD service for custom container metadata and groups (SQLite only)."""

import json
from typing import Optional
from ..database import get_db
from ..models.custom_models import (
    ContainerCustomUpdate,
    ContainerCustomResponse,
    GroupCreate,
    GroupResponse,
)


def get_container_custom(container_id: str) -> Optional[ContainerCustomResponse]:
    db = get_db()
    row = db.execute(
        "SELECT * FROM container_custom WHERE id = ?", (container_id,)
    ).fetchone()
    db.close()
    if row is None:
        return None
    return ContainerCustomResponse(
        id=row["id"],
        alias=row["alias"],
        icon=row["icon"],
        group_name=row["group_name"],
        notes=row["notes"],
        is_favorite=bool(row["is_favorite"]),
        jump_protocol=row["jump_protocol"] or "http",
        jump_port=row["jump_port"],
        created_at=row["created_at"],
        updated_at=row["updated_at"],
    )


def upsert_container_custom(
    container_id: str, data: ContainerCustomUpdate
) -> ContainerCustomResponse:
    db = get_db()
    existing = db.execute(
        "SELECT id FROM container_custom WHERE id = ?", (container_id,)
    ).fetchone()

    if existing:
        # Update only provided fields
        updates = []
        params = []
        for field in ("alias", "icon", "group_name", "notes", "jump_protocol", "jump_port"):
            val = getattr(data, field, None)
            if val is not None:
                updates.append(f"{field} = ?")
                params.append(val)
        if data.is_favorite is not None:
            updates.append("is_favorite = ?")
            params.append(1 if data.is_favorite else 0)
        updates.append("updated_at = datetime('now')")
        params.append(container_id)
        db.execute(
            f"UPDATE container_custom SET {', '.join(updates)} WHERE id = ?",
            params,
        )
    else:
        db.execute(
            """INSERT INTO container_custom (id, alias, icon, group_name, notes, is_favorite, jump_protocol, jump_port)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                container_id,
                data.alias,
                data.icon,
                data.group_name,
                data.notes,
                1 if data.is_favorite else 0,
                data.jump_protocol or "http",
                data.jump_port,
            ),
        )
    db.commit()
    db.close()
    return get_container_custom(container_id)


def get_all_custom() -> dict[str, ContainerCustomResponse]:
    """Return all custom data keyed by container ID."""
    db = get_db()
    rows = db.execute("SELECT * FROM container_custom").fetchall()
    db.close()
    result = {}
    for row in rows:
        result[row["id"]] = ContainerCustomResponse(
            id=row["id"],
            alias=row["alias"],
            icon=row["icon"],
            group_name=row["group_name"],
            notes=row["notes"],
            is_favorite=bool(row["is_favorite"]),
            jump_protocol=row["jump_protocol"] or "http",
            jump_port=row["jump_port"],
            created_at=row["created_at"],
            updated_at=row["updated_at"],
        )
    return result


def delete_container_custom(container_id: str) -> bool:
    db = get_db()
    cursor = db.execute("DELETE FROM container_custom WHERE id = ?", (container_id,))
    db.commit()
    deleted = cursor.rowcount > 0
    db.close()
    return deleted


# --- Groups ---

def list_groups() -> list[GroupResponse]:
    db = get_db()
    groups = db.execute(
        "SELECT * FROM groups_config ORDER BY sort_order ASC, name ASC"
    ).fetchall()
    result = []
    for g in groups:
        count_row = db.execute(
            "SELECT COUNT(*) as cnt FROM container_custom WHERE group_name = ?",
            (g["name"],),
        ).fetchone()
        result.append(
            GroupResponse(
                id=g["id"],
                name=g["name"],
                color=g["color"],
                sort_order=g["sort_order"],
                container_count=count_row["cnt"] if count_row else 0,
            )
        )
    db.close()
    return result


def create_group(data: GroupCreate) -> GroupResponse:
    db = get_db()
    db.execute(
        "INSERT INTO groups_config (name, color) VALUES (?, ?)",
        (data.name, data.color),
    )
    db.commit()
    row = db.execute(
        "SELECT * FROM groups_config WHERE name = ?", (data.name,)
    ).fetchone()
    db.close()
    return GroupResponse(
        id=row["id"],
        name=row["name"],
        color=row["color"],
        sort_order=row["sort_order"],
        container_count=0,
    )


def update_group(group_id: int, data: dict) -> Optional[GroupResponse]:
    db = get_db()
    existing = db.execute(
        "SELECT * FROM groups_config WHERE id = ?", (group_id,)
    ).fetchone()
    if not existing:
        db.close()
        return None

    updates = []
    params = []
    if "name" in data and data["name"] is not None:
        updates.append("name = ?")
        params.append(data["name"])
    if "color" in data and data["color"] is not None:
        updates.append("color = ?")
        params.append(data["color"])
    if "sort_order" in data and data["sort_order"] is not None:
        updates.append("sort_order = ?")
        params.append(data["sort_order"])

    if updates:
        params.append(group_id)
        db.execute(
            f"UPDATE groups_config SET {', '.join(updates)} WHERE id = ?", params
        )
        db.commit()

    row = db.execute(
        "SELECT * FROM groups_config WHERE id = ?", (group_id,)
    ).fetchone()
    db.close()
    return GroupResponse(
        id=row["id"],
        name=row["name"],
        color=row["color"],
        sort_order=row["sort_order"],
    )


def delete_group(group_id: int) -> bool:
    db = get_db()
    row = db.execute(
        "SELECT name FROM groups_config WHERE id = ?", (group_id,)
    ).fetchone()
    if not row:
        db.close()
        return False
    group_name = row["name"]
    # Unassign containers from this group
    db.execute(
        "UPDATE container_custom SET group_name = NULL WHERE group_name = ?",
        (group_name,),
    )
    db.execute("DELETE FROM groups_config WHERE id = ?", (group_id,))
    db.commit()
    db.close()
    return True
