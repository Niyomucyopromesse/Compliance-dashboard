# Install Redis locally on Windows

Redis is used by the backend to cache compliance API responses (`/api/v1/compliance/initial`, etc.) so pages load faster.

---

## Option 1: Memurai (recommended – native Windows)

Memurai is Redis-compatible and runs as a normal Windows service on port **6379**.

1. **Download**  
   - https://www.memurai.com/get-memurai  
   - Choose the free Developer edition.

2. **Install**  
   - Run the installer (`.msi`).  
   - Use default options; it will listen on **localhost:6379** and install a Windows service.

3. **Start**  
   - Memurai usually starts automatically. If not:  
     - **Services** (Win + R → `services.msc`) → find **Memurai** → Start.  
   - Or from an elevated Command Prompt:  
     `"C:\Program Files\Memurai\memurai.exe"`

4. **Check**  
   - Open Command Prompt or PowerShell:  
     `"C:\Program Files\Memurai\memurai-cli.exe" ping`  
   - You should see `PONG`.

---

## Option 2: Redis via Chocolatey

If you use [Chocolatey](https://chocolatey.org/):

```powershell
choco install redis-64
```

Then start Redis (e.g. from an elevated prompt):

```powershell
redis-server
```

Or install the Redis Windows service so it starts with Windows.

---

## Option 3: WSL2 + Redis

If you have WSL2 (Windows Subsystem for Linux):

```bash
wsl
sudo apt update
sudo apt install redis-server -y
redis-server --daemonize yes
redis-cli ping   # should print PONG
```

Then from Windows the backend can use `REDIS_URL=redis://localhost:6379/0` if Redis in WSL is bound to `0.0.0.0` (check WSL Redis config).

---

## After Redis is running

1. In your backend `.env` (e.g. `FraudBackend/app/.env`), set:

   ```env
   USE_REDIS_CACHE=true
   REDIS_URL=redis://localhost:6379/0
   REDIS_CACHE_TTL=300
   ```

2. Restart the FastAPI backend.

3. Verify: open  
   `http://127.0.0.1:8001/api/v1/compliance/cache-status`  
   (or your backend URL). You should see `redis_connected: true` and `use_redis_cache: true`.

---

## Port 6379 already in use?

If something else is using 6379, either:

- Change that program’s port, or  
- Use another Redis instance on a different port and set:

  ```env
  REDIS_URL=redis://localhost:6380/0
  ```

Then start Redis (or Memurai) on that port.
