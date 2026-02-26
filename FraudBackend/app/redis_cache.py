"""
Redis in-memory cache for compliance data.
If Redis is unavailable or USE_REDIS_CACHE is False, all operations no-op and the app uses the normal path.
"""
import json
from typing import Any, Optional

_redis_client = None


def _get_client():
    global _redis_client
    if _redis_client is not None:
        return _redis_client
    try:
        from app.config import get_settings
        s = get_settings()
        if not getattr(s, "use_redis_cache", False):
            return None
        import redis
        _redis_client = redis.Redis.from_url(s.redis_url, decode_responses=True)
        _redis_client.ping()
        return _redis_client
    except Exception:
        return None


def cache_get(key: str) -> Optional[Any]:
    """Get a JSON value from Redis. Returns None on miss or error."""
    client = _get_client()
    if not client:
        return None
    try:
        raw = client.get(key)
        if raw is None:
            return None
        return json.loads(raw)
    except Exception:
        return None


def cache_set(key: str, value: Any, ttl_seconds: int = 300) -> None:
    """Store a JSON value in Redis with TTL. No-op on error."""
    client = _get_client()
    if not client:
        return
    try:
        client.setex(key, ttl_seconds, json.dumps(value, default=str))
    except Exception:
        pass


def is_connected() -> bool:
    """Return True if Redis is enabled and connected. Use for /cache-status."""
    return _get_client() is not None
