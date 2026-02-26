# Access allowlist (SQLite + file)

Only usernames in the allowlist can log in. LDAP/demo authentication still runs first; then the app checks the allowlist. **No usernames in code** – manage them in the DB or via a text file.

## Option 1: Text file (no code, no API)

1. Edit **`app/data/allowed_usernames.txt`** – one username per line. Lines starting with `#` are ignored.
2. Restart the backend, or call **POST /api/v1/access/allowed/reload-from-file** with header **X-Admin-Secret** to reload without restart.
3. Users in the file are added to the SQLite allowlist; the DB is the source of truth at runtime.

## Config (.env)

- **ACCESS_ALLOWLIST_ENABLED** – `true` to enforce the allowlist (default: true).
- **ACCESS_LIST_ADMIN_SECRET** – Secret used to call the allowlist API. Set it and pass it as the **X-Admin-Secret** header when adding/removing users.

## Database

- File: **app/data/access_allowlist.db**
- Table: **allowed_users** (username, created_at)
- Created automatically on first run.

## API (require X-Admin-Secret header)

1. **List allowed users**  
   `GET /api/v1/access/allowed`  
   Header: `X-Admin-Secret: <your ACCESS_LIST_ADMIN_SECRET>`

2. **Add a user**  
   `POST /api/v1/access/allowed`  
   Header: `X-Admin-Secret: <your ACCESS_LIST_ADMIN_SECRET>`  
   Body: `{ "username": "jdoe" }`

3. **Remove a user**  
   `DELETE /api/v1/access/allowed/jdoe`  
   Header: `X-Admin-Secret: <your ACCESS_LIST_ADMIN_SECRET>`

## First-time setup

1. Set **ACCESS_LIST_ADMIN_SECRET** in `.env` (e.g. a long random string).
2. Restart the backend.
3. Call `POST /api/v1/access/allowed` with body `{ "username": "firstuser" }` and header `X-Admin-Secret: <that secret>` (e.g. from Swagger at `/docs` or Postman).
4. Only `firstuser` (and any other usernames you add) can log in.

## Disable allowlist

Set **ACCESS_ALLOWLIST_ENABLED=false** in `.env` so everyone who passes LDAP/demo auth can log in.
