# How to use CI

This repo uses **GitHub Actions** for Continuous Integration (CI).

## What runs

- **On every push** and **every pull request** to `main` or `master`:
  1. **Backend** job: install Python deps, check that the FastAPI app loads.
  2. **Frontend** job: `npm ci`, `npm run build`, then `npm run lint` (lint does not fail the build).

Workflow file: [`.github/workflows/ci.yml`](../workflows/ci.yml).

## How to use it

1. **Push or open a PR**  
   Push to `main`/`master` or open a pull request targeting that branch. CI runs automatically.

2. **See results**  
   - On GitHub: open your repo → **Actions** tab.  
   - On a PR: check the status at the bottom (e.g. “Backend ✓”, “Frontend ✓” or ✗).

3. **If a job fails**  
   Click the failed job → open the failing step to see the log (e.g. build error, import error, test failure). Fix the code and push again; CI will re-run.

## No GitHub?

If you use **GitLab**, add a `.gitlab-ci.yml` with similar steps (install → build).  
If you use **Jenkins**, create a pipeline that runs the same commands (checkout, backend install + verify, frontend `npm ci` + `npm run build`).

## Optional: run the same locally

```bash
# Backend (from repo root)
cd FraudBackend && pip install -r app/requirements.txt && python -c "from app.main import app; print('OK')"

# Frontend
cd FraudFrontend && npm ci && npm run build
```

If these succeed locally, CI will usually pass too.
