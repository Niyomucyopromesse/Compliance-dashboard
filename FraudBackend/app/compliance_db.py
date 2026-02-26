"""
SQLite cache for compliance data: import from Excel once, then serve reads from DB (fast).
DB file: app/data/compliance.db. Reduces latency by avoiding Excel read on every request.
"""
import json
import sqlite3
from pathlib import Path
from typing import Any, List, Optional

try:
    import pandas as pd
    _HAS_PD = True
except ImportError:
    _HAS_PD = False

_DB_PATH: Optional[Path] = None


def get_db_path() -> Path:
    global _DB_PATH
    if _DB_PATH is None:
        _DB_PATH = Path(__file__).resolve().parent / "data" / "compliance.db"
    return _DB_PATH


def _get_conn() -> sqlite3.Connection:
    path = get_db_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    return sqlite3.connect(str(path))


def init_db() -> None:
    conn = _get_conn()
    try:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS compliance_records (
                id INTEGER PRIMARY KEY,
                source_sheet TEXT,
                status_value TEXT,
                data_json TEXT NOT NULL
            )
            """
        )
        conn.execute("CREATE INDEX IF NOT EXISTS idx_source_sheet ON compliance_records(source_sheet)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_status ON compliance_records(status_value)")
        conn.commit()
    finally:
        conn.close()


def import_from_excel(read_excel_fn, excel_path: Path) -> int:
    """
    Read Excel via read_excel_fn(excel_path), then insert all rows into SQLite.
    Returns number of rows imported.
    """
    init_db()
    df, _ = read_excel_fn(excel_path)
    if df is None or df.empty:
        return 0
    df = df.copy()
    df["id"] = df.index
    status_col = None
    for c in df.columns:
        if isinstance(c, str) and "comment" not in c.lower():
            if "status" in c.lower() or "compliance" in c.lower():
                status_col = c
                break
    conn = _get_conn()
    try:
        conn.execute("DELETE FROM compliance_records")
        count = 0
        for idx, row in df.iterrows():
            row_dict = row.to_dict()
            for k, v in row_dict.items():
                if v is None:
                    continue
                if hasattr(v, "item") and callable(getattr(v, "item")):
                    try:
                        row_dict[k] = v.item()
                    except (ValueError, AttributeError):
                        row_dict[k] = None
                elif hasattr(v, "isoformat"):
                    row_dict[k] = v.isoformat()
                elif isinstance(v, float) and (v != v or v == 1e999):
                    row_dict[k] = None
                elif _HAS_PD and pd.isna(v):
                    row_dict[k] = None
                elif str(v).strip() in ("nan", "NaN", ""):
                    row_dict[k] = None
            def _str_or_empty(val):
                if val is None or (_HAS_PD and pd.isna(val)):
                    return ""
                return str(val).strip()
            status_val = _str_or_empty(row_dict.get(status_col)) if status_col else ""
            source = _str_or_empty(row_dict.get("SOURCE_SHEET")) if "SOURCE_SHEET" in row_dict else ""
            data_json = json.dumps(row_dict, default=str)
            conn.execute(
                "INSERT INTO compliance_records (id, source_sheet, status_value, data_json) VALUES (?, ?, ?, ?)",
                (int(idx), source, status_val, data_json),
            )
            count += 1
        conn.commit()
        return count
    finally:
        conn.close()


def get_departments() -> List[str]:
    conn = _get_conn()
    try:
        rows = conn.execute(
            "SELECT DISTINCT source_sheet FROM compliance_records WHERE source_sheet IS NOT NULL AND source_sheet != '' ORDER BY source_sheet"
        ).fetchall()
        return sorted(r[0] for r in rows)
    finally:
        conn.close()


def get_statuses() -> List[str]:
    conn = _get_conn()
    try:
        rows = conn.execute(
            "SELECT DISTINCT status_value FROM compliance_records WHERE status_value IS NOT NULL AND status_value != '' ORDER BY status_value"
        ).fetchall()
        return sorted(r[0] for r in rows)
    finally:
        conn.close()


def get_records(
    limit: int,
    offset: int,
    department: Optional[str] = None,
    status: Optional[str] = None,
) -> tuple[List[dict], int]:
    """
    Return (list of record dicts, total_count). Filters by department (source_sheet) and status.
    """
    conn = _get_conn()
    try:
        where_parts = []
        params: List[Any] = []
        if department:
            where_parts.append("LOWER(TRIM(source_sheet)) = LOWER(TRIM(?))")
            params.append(department.strip())
        if status:
            where_parts.append("LOWER(TRIM(status_value)) LIKE ?")
            params.append(f"%{status.strip().lower()}%")
        where_sql = " AND ".join(where_parts) if where_parts else "1=1"
        total = conn.execute(
            f"SELECT COUNT(*) FROM compliance_records WHERE {where_sql}",
            params,
        ).fetchone()[0]
        rows = conn.execute(
            f"SELECT data_json FROM compliance_records WHERE {where_sql} ORDER BY id LIMIT ? OFFSET ?",
            params + [limit, offset],
        ).fetchall()
        records = []
        for (data_json,) in rows:
            rec = json.loads(data_json)
            for k, v in rec.items():
                if v is None:
                    continue
                if isinstance(v, float) and (v != v or v == 1e999):  # NaN or inf
                    rec[k] = None
            records.append(rec)
        return records, total
    finally:
        conn.close()


def has_data() -> bool:
    conn = _get_conn()
    try:
        return conn.execute("SELECT 1 FROM compliance_records LIMIT 1").fetchone() is not None
    finally:
        conn.close()
