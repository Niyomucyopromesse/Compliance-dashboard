"""
SQLite allowlist: only usernames in this DB are allowed to log in after LDAP/demo auth.
DB file: app/data/access_allowlist.db
Usernames can be managed via the API or by editing app/data/allowed_usernames.txt (one username per line).
"""
import sqlite3
from pathlib import Path
from datetime import datetime
from typing import List, Optional

_DB_PATH: Optional[Path] = None
_ALLOWED_USERNAMES_FILE = Path(__file__).resolve().parent / "data" / "allowed_usernames.txt"


def get_db_path() -> Path:
    global _DB_PATH
    if _DB_PATH is None:
        _DB_PATH = Path(__file__).resolve().parent / "data" / "access_allowlist.db"
    return _DB_PATH


def get_allowed_usernames_file() -> Path:
    """Path to the optional text file: one username per line. Edit this file to add/remove users (no code changes)."""
    return _ALLOWED_USERNAMES_FILE


def sync_from_file(file_path: Optional[Path] = None) -> tuple[int, int]:
    """
    Load usernames from a text file (one per line) and sync to the DB.
    Additive: lines in the file are added to allowed_users; no usernames in code.
    Returns (lines_processed, added_count).
    """
    path = file_path or get_allowed_usernames_file()
    if not path.exists():
        return 0, 0
    init_db()
    processed, added = 0, 0
    with open(path, "r", encoding="utf-8", errors="ignore") as f:
        for line in f:
            u = line.strip()
            if u and not u.startswith("#"):
                processed += 1
                if add_allowed(u):
                    added += 1
    return processed, added


def _get_conn():
    path = get_db_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    return sqlite3.connect(str(path))


def init_db() -> None:
    """Create the allowed_users table if it doesn't exist."""
    conn = _get_conn()
    try:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS allowed_users (
                username TEXT PRIMARY KEY,
                created_at TEXT NOT NULL
            )
            """
        )
        conn.commit()
    finally:
        conn.close()


def is_allowed(username: str) -> bool:
    """Return True if username is in the allowlist (case-insensitive match)."""
    if not username or not username.strip():
        return False
    conn = _get_conn()
    try:
        row = conn.execute(
            "SELECT 1 FROM allowed_users WHERE LOWER(TRIM(username)) = LOWER(TRIM(?)) LIMIT 1",
            (username.strip(),),
        ).fetchone()
        return row is not None
    finally:
        conn.close()


def add_allowed(username: str) -> bool:
    """Add username to allowlist. Returns True if added, False if already present."""
    if not username or not username.strip():
        return False
    u = username.strip()
    conn = _get_conn()
    try:
        conn.execute(
            "INSERT OR IGNORE INTO allowed_users (username, created_at) VALUES (?, ?)",
            (u, datetime.utcnow().isoformat()),
        )
        conn.commit()
        return conn.total_changes > 0
    finally:
        conn.close()


def remove_allowed(username: str) -> bool:
    """Remove username from allowlist. Returns True if removed."""
    if not username or not username.strip():
        return False
    conn = _get_conn()
    try:
        cur = conn.execute("DELETE FROM allowed_users WHERE LOWER(TRIM(username)) = LOWER(TRIM(?))", (username.strip(),))
        conn.commit()
        return cur.rowcount > 0
    finally:
        conn.close()


def list_allowed() -> List[dict]:
    """Return list of { username, created_at } for all allowed users."""
    conn = _get_conn()
    try:
        rows = conn.execute(
            "SELECT username, created_at FROM allowed_users ORDER BY created_at"
        ).fetchall()
        return [{"username": r[0], "created_at": r[1]} for r in rows]
    finally:
        conn.close()
