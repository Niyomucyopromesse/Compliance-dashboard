# Cache status and Home page cache

## 1. Is Redis working?

**Check:** Open **http://127.0.0.1:8001/api/v1/compliance/cache-status** (no auth).

You’ll see something like:

```json
{
  "redis_connected": true,
  "use_redis_cache": true,
  "use_compliance_sqlite": true,
  "sqlite_has_data": true,
  "hint": "..."
}
```

- **redis_connected: false** → Redis is off or unreachable. Start Redis (e.g. `docker run -d -p 6379:6379 redis:7-alpine`) and set **USE_REDIS_CACHE=true** in `.env`, then restart the backend.
- **use_compliance_sqlite: true** and **sqlite_has_data: true** → Compliance is served from SQLite (fast). First request after startup may still do an Excel import; later requests use the DB.
- In the browser **Network** tab, check the **response headers** for compliance requests: **X-Timing-Source: redis** (cache hit) or **sqlite** (DB) means fast path; **excel** means fallback and will be slower.

## 2. Home page cache (no extra latency when returning)

After login, when the user goes to **RegMgmt** and then back to **Home**:

- The Home page uses **sessionStorage** to store the last compliance data (up to 5 minutes).
- When they open Home again, the last data is shown **immediately** (no loading spinner), then a refresh runs in the background.
- So leaving Home and coming back avoids the delay of loading the same page again.
