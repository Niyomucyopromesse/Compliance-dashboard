# Latency debugging & how to add a username to the allowlist

## 1. Latency: where is time spent?

The **`/api/v1/compliance/initial`** endpoint adds response headers so you can see where time goes. After a request, check the **Response Headers** in the browser DevTools (Network tab → click the request → Headers).

| Header | Meaning |
|--------|--------|
| **X-Timing-Redis-Ms** | Time to check Redis for cached response (should be &lt; 5 ms if Redis is local). |
| **X-Timing-Excel-Ms** | Time to read/process the Excel file (or 0 if served from cache). This is usually the biggest cost on cache miss. |
| **X-Timing-Build-Ms** | Time to build departments, statuses, and records from the dataframe. |
| **X-Timing-RedisSet-Ms** | Time to write the response to Redis (cache set). |
| **X-Timing-Total-Ms** | Total time for the request. |
| **X-Timing-Source** | `redis` = served from Redis (fast). `excel` = computed from Excel (slower). |

**What to look for:**

- **X-Timing-Source: redis** and **X-Timing-Total-Ms** small (e.g. &lt; 50 ms) → cache is working; latency is good.
- **X-Timing-Source: excel** and **X-Timing-Excel-Ms** large (e.g. &gt; 1000 ms) → Excel read is the bottleneck. Startup cache warming and Redis help after the first request.
- **X-Timing-Redis-Ms** large → Redis might be slow or not local; check `REDIS_URL` and that Redis is running (`docker ps`).

---

## 2. How to add a username to the allowlist (so they can log in)

Only usernames in the allowlist can log in. You can add them in three ways.

### Option A: Swagger UI (easiest)

1. **Set the admin secret in `.env`:**
   ```env
   ACCESS_LIST_ADMIN_SECRET=my-secret-key-123
   ```
   Restart the backend.

2. Open **http://127.0.0.1:8001/docs**.

3. Find **POST /api/v1/access/allowed** and click **Try it out**.

4. Click **Add request header** (or open the Headers section) and add:
   - **Name:** `X-Admin-Secret`
   - **Value:** `my-secret-key-123` (same as in `.env`).

5. In the request body, enter the LDAP username you want to allow, e.g.:
   ```json
   { "username": "jdoe" }
   ```

6. Click **Execute**. You should get **200** and `"added": true` (or `false` if already in the list).

7. That user can now log in with their LDAP password (or demo credentials if using demo login).

To **list** allowed users: **GET /api/v1/access/allowed** with the same `X-Admin-Secret` header.  
To **remove** a user: **DELETE /api/v1/access/allowed/jdoe** with the same header.

---

### Option B: curl (command line)

```bash
# Add a user (replace MY_SECRET and jdoe)
curl -X POST "http://127.0.0.1:8001/api/v1/access/allowed" ^
  -H "Content-Type: application/json" ^
  -H "X-Admin-Secret: MY_SECRET" ^
  -d "{\"username\": \"jdoe\"}"

# List all allowed users
curl "http://127.0.0.1:8001/api/v1/access/allowed" -H "X-Admin-Secret: MY_SECRET"

# Remove a user
curl -X DELETE "http://127.0.0.1:8001/api/v1/access/allowed/jdoe" -H "X-Admin-Secret: MY_SECRET"
```

On Linux/Mac use `\` for line continuation and single quotes for the JSON.

---

### Option C: Directly in SQLite (no API)

If you prefer to edit the database directly:

1. Open the DB file (create it first by starting the backend once):
   - Path: **`FraudBackend/app/data/access_allowlist.db`**

2. Using the `sqlite3` command line or a tool like DB Browser for SQLite:
   ```sql
   INSERT INTO allowed_users (username, created_at) VALUES ('jdoe', datetime('now'));
   ```

3. Username is stored as you type it; the login check is case-insensitive, so `jdoe` and `JDOE` both match.

To **list** users:
```sql
SELECT * FROM allowed_users ORDER BY created_at;
```

To **remove** a user:
```sql
DELETE FROM allowed_users WHERE LOWER(TRIM(username)) = 'jdoe';
```

---

## First user (bootstrap)

The allowlist starts empty. To allow the first user:

1. Set **ACCESS_LIST_ADMIN_SECRET** in `.env` and restart the backend.
2. Add that first username via **Swagger** (Option A) or **curl** (Option B) or **SQLite** (Option C).
3. That user can then log in; no need to log in first to add them.
