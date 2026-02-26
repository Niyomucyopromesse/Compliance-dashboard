# Redis cache for compliance API – step-by-step approach

## 1. What we added

- **Config** (`config.py`): `USE_REDIS_CACHE` (default `false`), `REDIS_CACHE_TTL` (default 300 seconds). Existing `REDIS_URL` is used to connect.
- **Cache helper** (`redis_cache.py`): `cache_get(key)` and `cache_set(key, value, ttl)`. Values are JSON. If Redis is off or unreachable, the helper no-ops (returns `None` on get, skips set) so the app keeps working without Redis.
- **Endpoints** (`main.py`): Three compliance endpoints check Redis first; on miss they run the current Excel logic, store the response in Redis, then return.

## 2. Flow (step by step)

1. **Request** hits one of:
   - `GET /api/v1/compliance/departments`
   - `GET /api/v1/compliance/statuses`
   - `GET /api/v1/compliance/records?limit=...&offset=...&department=...&status=...`

2. **Cache key** is built:
   - Departments: `compliance:departments`
   - Statuses: `compliance:statuses`
   - Records: `compliance:records:{limit}:{offset}:{department}:{status}`

3. **Try Redis**: If `USE_REDIS_CACHE` is true and Redis is reachable, we call `cache_get(key)`.

4. **Hit**: If Redis returns a value, we return that JSON and do not touch Excel.

5. **Miss**: We run the existing logic (read Excel / in-memory df, filter, paginate for records). We build the same response dict as before.

6. **Store**: We call `cache_set(key, response, TTL)` so the next identical request is served from Redis.

7. **Return** the response.

## 3. Enabling Redis

1. Install and start Redis (e.g. local: `redis-server`, or use a cloud instance).
2. In `.env` (or environment):
   - `REDIS_URL=redis://localhost:6379/0` (or your Redis URL).
   - `USE_REDIS_CACHE=true`
   - Optionally `REDIS_CACHE_TTL=300` (seconds; default 300).
3. Restart the backend. First request per key will load from Excel and fill Redis; later requests with the same key will be served from Redis until TTL expires.

## 4. Behaviour when Redis is off

- If `USE_REDIS_CACHE` is false: Redis is never used; behaviour is unchanged.
- If `USE_REDIS_CACHE` is true but Redis is down or unreachable: `_get_client()` returns `None`, so every request is a “miss” and we always use Excel. No errors are raised; the API keeps working.

## 5. Cache invalidation

- Entries expire automatically after `REDIS_CACHE_TTL` seconds.
- If you update the Excel file, cached data may be stale until TTL expires. To force fresh data without restarting, you can flush Redis (`FLUSHDB`) or wait for TTL.
