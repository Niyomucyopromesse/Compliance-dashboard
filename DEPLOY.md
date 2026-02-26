# Deploy to Git and production

## 1. What’s ignored (won’t be pushed)

- **`.env`** files (all) – secrets stay local; create them on the server.
- **`venv/`**, **`node_modules/`** – reinstall on the server.
- **`*.db`** – SQLite DBs (allowlist, compliance) are recreated on first run.
- **`__pycache__/`**, **`dist/`**, **`*.log`** – build/cache artifacts.

## 2. Push to Git (run on your machine)

Open a terminal in the project root (`Fraud_Detector`):

```powershell
cd c:\Users\pniyomucyo\Desktop\Fraud_Detector\Fraud_Detector

# See what will be committed
git status

# Stage everything (respects .gitignore)
git add .

# Commit
git commit -m "Compliance RegMgmt: allowlist, SQLite/Redis cache, notify owners, deployment-ready"

# If you don't have a remote yet, add one (replace with your repo URL):
# git remote add origin https://github.com/YOUR_USER/Fraud_Detector.git

# Push (main or master)
git push -u origin main
```

If your branch is `master`: use `git push -u origin master`.

## 3. On the server (after clone)

**Backend**

```bash
cd FraudBackend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r app/requirements.txt
# Copy app/env.example to app/.env and set real values (DB, Redis, AD, SMTP, etc.)
# Create app/data/allowed_usernames.txt with one username per line if using allowlist
uvicorn main:app --host 0.0.0.0 --port 8001
```

**Frontend**

```bash
cd FraudFrontend
npm install
# Create .env with VITE_API_BASE_URL pointing to your backend (e.g. https://api.yourdomain.com)
npm run build
# Serve the contents of dist/ with Nginx, Netlify, Vercel, etc.
```

## 4. Required env on server (from .env, not in Git)

- **Backend:** `JWT_SECRET`, `REDIS_URL`, `USE_REDIS_CACHE`, `USE_COMPLIANCE_SQLITE`, `ACCESS_ALLOWLIST_ENABLED`, `ACCESS_LIST_ADMIN_SECRET`; AD/SMTP if used.
- **Frontend:** `VITE_API_BASE_URL` = backend URL (e.g. `https://api.yourdomain.com`).

## 5. Data files (optional to commit)

- **`FraudBackend/app/data/Compliance_Register - Copy.xlsx`** – commit if you want it in the repo; otherwise upload it on the server.
- **`FraudBackend/app/data/email.xlsx`** – same.
- **`FraudBackend/app/data/allowed_usernames.txt`** – commit a template (e.g. one line); real list can be edited on the server.

If you keep `*.db` and `.env` in `.gitignore`, they will never be pushed.
