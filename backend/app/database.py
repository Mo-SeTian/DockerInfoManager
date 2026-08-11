"""SQLite database setup for custom container metadata."""

import sqlite3
import os
from .config import settings


def init_db():
    """Create the database and tables if they don't exist."""
    os.makedirs(os.path.dirname(settings.database_path), exist_ok=True)

    conn = sqlite3.connect(settings.database_path)
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("""
        CREATE TABLE IF NOT EXISTS container_custom (
            id              TEXT PRIMARY KEY,    -- Docker container ID
            alias           TEXT,                -- custom alias
            icon            TEXT,                -- icon emoji/identifier
            group_name      TEXT,                -- group name
            notes           TEXT,                -- notes
            is_favorite     INTEGER DEFAULT 0,   -- 1 = favorited
            jump_protocol   TEXT DEFAULT 'http', -- http or https
            jump_port       INTEGER,             -- preferred jump port
            created_at      TEXT DEFAULT (datetime('now')),
            updated_at      TEXT DEFAULT (datetime('now'))
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS groups_config (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            name            TEXT NOT NULL UNIQUE,
            color           TEXT DEFAULT '#38bdf8',
            sort_order      INTEGER DEFAULT 0,
            created_at      TEXT DEFAULT (datetime('now'))
        )
    """)
    conn.commit()
    conn.close()


def get_db() -> sqlite3.Connection:
    """Get a SQLite connection with dict-like row access."""
    conn = sqlite3.connect(settings.database_path)
    conn.row_factory = sqlite3.Row
    return conn
