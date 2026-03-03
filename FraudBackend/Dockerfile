# Backend: FastAPI + Uvicorn. Data (Excel, SQLite) via volume mount at /app/app/data.
FROM python:3.12-slim

WORKDIR /app

# curl for reliable healthcheck (slim image has no curl by default)
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

# Install dependencies (layer cache)
COPY app/requirements.txt app/requirements.txt
RUN pip install --no-cache-dir -r app/requirements.txt && \
    pip install --no-cache-dir openpyxl==3.1.2

# Application code
COPY main.py .
COPY app/ app/

# Create data dir so volume mount has a target; app writes SQLite/allowlist here
RUN mkdir -p app/data

EXPOSE 8001

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]
