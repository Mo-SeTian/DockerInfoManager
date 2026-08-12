"""SQLite database setup for custom container metadata."""

import sqlite3
import os
from .config import settings


def _migrate_columns(conn, table, columns):
    """Add columns that may not exist in older schemas."""
    existing = {row[1] for row in conn.execute(f"PRAGMA table_info({table})").fetchall()}
    for col, col_type in columns.items():
        if col not in existing:
            conn.execute(f"ALTER TABLE {table} ADD COLUMN {col} {col_type}")


def init_db():
    """Create the database and tables if they don't exist."""
    os.makedirs(os.path.dirname(settings.database_path) or ".", exist_ok=True)

    conn = sqlite3.connect(settings.database_path)
    conn.execute("PRAGMA journal_mode=WAL")

    conn.execute("""
        CREATE TABLE IF NOT EXISTS container_custom (
            id              TEXT PRIMARY KEY,
            alias           TEXT,
            icon            TEXT,
            icon_url        TEXT,
            group_name      TEXT,
            notes           TEXT,
            is_favorite     INTEGER DEFAULT 0,
            is_hidden       INTEGER DEFAULT 0,
            jump_protocol   TEXT DEFAULT 'http',
            jump_port       INTEGER,
            private_url     TEXT,
            public_url      TEXT,
            url_preference  TEXT DEFAULT 'auto',
            created_at      TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
        )
    """)

    conn.execute("""
        CREATE TABLE IF NOT EXISTS groups_config (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            name            TEXT NOT NULL UNIQUE,
            color           TEXT DEFAULT '#38bdf8',
            sort_order      INTEGER DEFAULT 0,
            is_pinned       INTEGER DEFAULT 0,
            created_at      TEXT NOT NULL DEFAULT (datetime('now'))
        )
    """)

    # Migrate old schemas
    _migrate_columns(conn, "container_custom", {
        "icon_url": "TEXT",
        "is_hidden": "INTEGER DEFAULT 0",
        "private_url": "TEXT",
        "public_url": "TEXT",
        "url_preference": "TEXT DEFAULT 'auto'",
        "merge_name": "TEXT",
        "merge_url": "TEXT",
        "sort_order": "INTEGER DEFAULT 0",
        "tags": "TEXT",
    })
    _migrate_columns(conn, "groups_config", {
        "is_pinned": "INTEGER DEFAULT 0",
    })

    conn.commit()
    conn.close()


def get_db() -> sqlite3.Connection:
    conn = sqlite3.connect(settings.database_path)
    conn.row_factory = sqlite3.Row
    return conn
