"""CRUD service for custom container metadata and groups (SQLite only)."""

from typing import Optional, List
from ..database import get_db
from ..models.custom_models import (
    ContainerCustomUpdate,
    ContainerCustomResponse,
    GroupCreate,
    GroupResponse,
)

_ALL_FIELDS = (
    "alias", "icon", "icon_url", "group_name", "notes",
    "is_favorite", "is_hidden",
    "jump_protocol", "jump_port",
    "private_url", "public_url", "url_preference",
    "merge_name", "merge_url", "sort_order", "tags",
)


def _row_to_response(row) -> ContainerCustomResponse:
    d = dict(row)
    return ContainerCustomResponse(
        id=d["id"],
        alias=d.get("alias"),
        icon=d.get("icon"),
        icon_url=d.get("icon_url"),
        group_name=d.get("group_name"),
        notes=d.get("notes"),
        is_favorite=bool(d.get("is_favorite", 0)),
        is_hidden=bool(d.get("is_hidden", 0)),
        jump_protocol=d.get("jump_protocol") or "http",
        jump_port=d.get("jump_port"),
        private_url=d.get("private_url"),
        public_url=d.get("public_url"),
        url_preference=d.get("url_preference") or "auto",
        merge_name=d.get("merge_name"),
        merge_url=d.get("merge_url"),
        sort_order=d.get("sort_order", 0),
        created_at=d.get("created_at"),
        updated_at=d.get("updated_at"),
    )


def get_container_custom(container_id: str) -> Optional[ContainerCustomResponse]:
    db = get_db()
    row = db.execute(
        "SELECT * FROM container_custom WHERE id = ?", (container_id,)
    ).fetchone()
    db.close()
    if row is None:
        return None
    return _row_to_response(row)


def get_all_custom() -> dict:
    db = get_db()
    rows = db.execute("SELECT * FROM container_custom").fetchall()
    db.close()
    return {row["id"]: _row_to_response(row) for row in rows}


def upsert_container_custom(
    container_id: str, data: ContainerCustomUpdate
) -> ContainerCustomResponse:
    db = get_db()
    existing = db.execute(
        "SELECT id FROM container_custom WHERE id = ?", (container_id,)
    ).fetchone()

    if existing:
        updates = []
        params = []
        for field in _ALL_FIELDS:
            val = getattr(data, field, None)
            if val is not None:
                updates.append(f"{field} = ?")
                params.append(val)
        if data.is_favorite is not None:
            updates.append("is_favorite = ?")
            params.append(1 if data.is_favorite else 0)
        if data.is_hidden is not None:
            updates.append("is_hidden = ?")
            params.append(1 if data.is_hidden else 0)
        updates.append("updated_at = datetime('now')")
        params.append(container_id)
        db.execute(
            f"UPDATE container_custom SET {', '.join(updates)} WHERE id = ?",
            params,
        )
    else:
        cols = ["id"]
        vals = [container_id]
        for field in _ALL_FIELDS:
            val = getattr(data, field, None)
            if val is not None:
                cols.append(field)
                vals.append(val)
        if data.is_favorite is not None:
            cols.append("is_favorite")
            vals.append(1 if data.is_favorite else 0)
        if data.is_hidden is not None:
            cols.append("is_hidden")
            vals.append(1 if data.is_hidden else 0)
        placeholders = ", ".join(["?"] * len(vals))
        db.execute(
            f"INSERT INTO container_custom ({', '.join(cols)}) VALUES ({placeholders})",
            vals,
        )

    db.commit()
    row = db.execute(
        "SELECT * FROM container_custom WHERE id = ?", (container_id,)
    ).fetchone()
    db.close()
    return _row_to_response(row)


def delete_container_custom(container_id: str) -> bool:
    db = get_db()
    cur = db.execute(
        "DELETE FROM container_custom WHERE id = ?", (container_id,)
    )
    db.commit()
    db.close()
    return cur.rowcount > 0


def bulk_move(container_ids: List[str], group_name: Optional[str]) -> int:
    db = get_db()
    count = 0
    for cid in container_ids:
        existing = db.execute(
            "SELECT id FROM container_custom WHERE id = ?", (cid,)
        ).fetchone()
        if existing:
            db.execute(
                "UPDATE container_custom SET group_name = ?, updated_at = datetime('now') WHERE id = ?",
                (group_name, cid),
            )
        else:
            db.execute(
                "INSERT INTO container_custom (id, group_name) VALUES (?, ?)",
                (cid, group_name),
            )
        count += 1
    db.commit()
    db.close()
    return count


def set_hidden(container_ids: List[str], is_hidden: bool) -> int:
    db = get_db()
    count = 0
    for cid in container_ids:
        existing = db.execute(
            "SELECT id FROM container_custom WHERE id = ?", (cid,)
        ).fetchone()
        if existing:
            db.execute(
                "UPDATE container_custom SET is_hidden = ?, updated_at = datetime('now') WHERE id = ?",
                (1 if is_hidden else 0, cid),
            )
        else:
            db.execute(
                "INSERT INTO container_custom (id, is_hidden) VALUES (?, ?)",
                (cid, 1 if is_hidden else 0),
            )
        count += 1
    db.commit()
    db.close()
    return count


# ---- Group management ----

def list_groups() -> List[GroupResponse]:
    db = get_db()
    rows = db.execute(
        "SELECT * FROM groups_config ORDER BY sort_order ASC, id ASC"
    ).fetchall()
    result = []
    for row in rows:
        containers = db.execute(
            "SELECT id, group_name FROM container_custom WHERE group_name = ?",
            (row["name"],),
        ).fetchall()
        result.append(GroupResponse(
            id=row["id"],
            name=row["name"],
            color=row["color"],
            sort_order=row["sort_order"],
            container_count=len(containers),
            running_count=0,
        ))
    db.close()
    return result


def _group_row_to_response(db, row) -> GroupResponse:
    containers = db.execute(
        "SELECT id, group_name FROM container_custom WHERE group_name = ?",
        (row["name"],),
    ).fetchall()
    # Need docker to count running — just return container_count from custom table
    return GroupResponse(
        id=row["id"],
        name=row["name"],
        color=row["color"],
        sort_order=row["sort_order"],
        container_count=len(containers),
        running_count=0,
    )


def create_group(data: GroupCreate) -> GroupResponse:
    db = get_db()
    try:
        db.execute(
            "INSERT INTO groups_config (name, color, sort_order) VALUES (?, ?, ?)",
            (data.name, data.color, data.sort_order),
        )
        db.commit()
    except Exception:
        db.close()
        raise
    row = db.execute(
        "SELECT * FROM groups_config WHERE name = ?", (data.name,)
    ).fetchone()
    db.close()
    return _group_row_to_response(get_db(), row)


def update_group(group_id: int, updates: dict) -> Optional[GroupResponse]:
    db = get_db()
    sets = []
    params = []
    for k, v in updates.items():
        sets.append(f"{k} = ?")
        params.append(v)
    if sets:
        sets_str = ", ".join(sets)
        params.append(group_id)
        db.execute(f"UPDATE groups_config SET {sets_str} WHERE id = ?", params)
        db.commit()
    row = db.execute(
        "SELECT * FROM groups_config WHERE id = ?", (group_id,)
    ).fetchone()
    db.close()
    if row is None:
        return None
    return _group_row_to_response(get_db(), row)


def delete_group(group_id: int) -> bool:
    db = get_db()
    # Get group name first
    row = db.execute(
        "SELECT name FROM groups_config WHERE id = ?", (group_id,)
    ).fetchone()
    if row:
        db.execute(
            "UPDATE container_custom SET group_name = NULL WHERE group_name = ?",
            (row["name"],),
        )
    cur = db.execute("DELETE FROM groups_config WHERE id = ?", (group_id,))
    db.commit()
    db.close()
    return cur.rowcount > 0


def reorder_container(container_id: str, direction: str) -> bool:
    """Move a container up/down within its group by swapping sort_order."""
    db = get_db()
    row = db.execute(
        "SELECT group_name, sort_order FROM container_custom WHERE id = ?",
        (container_id,),
    ).fetchone()
    if not row:
        db.close()
        return False

    group_name = row["group_name"] or ""
    current_order = row["sort_order"] or 0

    db.execute(
        "INSERT OR IGNORE INTO container_custom (id, sort_order) VALUES (?, ?)",
        (container_id, current_order),
    )

    if group_name:
        peers = db.execute(
            "SELECT id, sort_order FROM container_custom WHERE group_name = ? ORDER BY sort_order ASC, id ASC",
            (group_name,),
        ).fetchall()
    else:
        peers = db.execute(
            "SELECT id, sort_order FROM container_custom WHERE (group_name IS NULL OR group_name = '') ORDER BY sort_order ASC, id ASC"
        ).fetchall()

    pos = next((i for i, p in enumerate(peers) if p["id"] == container_id), -1)
    if pos == -1:
        db.close()
        return False

    if direction == "up" and pos > 0:
        peer = peers[pos - 1]
    elif direction == "down" and pos < len(peers) - 1:
        peer = peers[pos + 1]
    else:
        db.close()
        return False

    peer_order = peer["sort_order"] or 0
    db.execute(
        "UPDATE container_custom SET sort_order = ?, updated_at = datetime('now') WHERE id = ?",
        (peer_order, container_id),
    )
    db.execute(
        "UPDATE container_custom SET sort_order = ?, updated_at = datetime('now') WHERE id = ?",
        (current_order, peer["id"]),
    )
    db.commit()
    db.close()
    return True
