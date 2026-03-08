---
description: Scaffold a new FastAPI project with Docker infrastructure
agent: build
---
# FastAPI project scaffold

## When to use
Use when starting a new FastAPI backend. Run this after `/bootstrap-from-spec` and `/plan-review` have produced approved plans.

---

## Scaffold Procedure

### Step 1 — Assess the project directory

The project directory will already contain files from bootstrap (AGENTS.md, SPEC.md, plan/, possibly docker-compose.yml). The scaffold must work in a **non-empty directory**.

**Check what exists:**
```bash
ls -la .
```

Record which of these already exist: `AGENTS.md`, `SPEC.md`, `plan/`, `docker-compose.yml`, `backend/`, `frontend/`, `ctl.sh`, `.env`, `.gitignore`

**Rule: NEVER delete or overwrite existing files.** The scaffold adds to the directory — it does not replace bootstrap output.

### Step 2 — Create the FastAPI application

Framework scaffolding tools often require empty directories. Handle this by building in a temp directory and moving:

```bash
# Create project in a temp directory
mkdir backend-temp && cd backend-temp

# Initialise with uv
uv init --name app --python 3.12
uv add fastapi[standard] uvicorn[standard] sqlalchemy[asyncio] alembic asyncpg
uv add pydantic pydantic-settings python-dotenv redis celery[redis]
uv add --dev pytest pytest-asyncio httpx ruff mypy

cd ..

# Move into the backend/ directory (create if needed, merge if exists)
if [ -d "backend" ]; then
    # Backend dir exists with docker config — merge carefully
    cp -rn backend-temp/* backend/
    cp -rn backend-temp/.* backend/ 2>/dev/null || true
    rm -rf backend-temp
else
    mv backend-temp backend
fi
```

**Critical:** This is the most common failure point. If `backend/` already exists with Docker files:
- Do NOT run `uv init` targeting `backend/` directly — it may fail on non-empty directory
- Do NOT delete `backend/` to make room — it has Docker config that was already written
- Use the temp directory + merge approach above

**After creation, verify:**
```bash
ls backend/pyproject.toml backend/uv.lock
# Both must exist
```

### Step 3 — Initialise git

If no `.git` directory exists at the project root:

```bash
git init
git config core.hooksPath .githooks

# Create .gitignore if missing
# Add: .env, __pycache__/, *.pyc, .venv/, .mypy_cache/, .pytest_cache/, .ruff_cache/, dist/
```

### Step 4 — Create ctl.sh

Create `ctl.sh` at the project root following the AGENTS.md template. Must include at minimum:

| Command | What it does |
|---------|-------------|
| `up` | `docker compose up -d` |
| `down` | `docker compose down` |
| `logs [service]` | `docker compose logs -f` |
| `shell [service]` | `docker compose exec {service} bash` |
| `migrate` | `docker compose exec app alembic upgrade head` |
| `migrate:new [name]` | `docker compose exec app alembic revision --autogenerate -m "{name}"` |
| `seed` | `docker compose exec app python -m app.seeds` |
| `test` | `docker compose exec app pytest` |
| `lint` | `docker compose exec app ruff check .` |
| `format` | `docker compose exec app ruff format .` |
| `celery` | Pass-through to celery |
| `rebuild` | `docker compose build --no-cache` |
| `status` | `docker compose ps` |
| `help` | List all commands |

```bash
chmod +x ctl.sh
```

### Step 5 — Create Docker infrastructure

If `docker-compose.yml` doesn't exist, create it. If it exists (from a previous partial scaffold), verify it's complete.

**Required services:**
- `postgres` — PostgreSQL 16 with health check
- `redis` — Redis 7 with health check
- `minio` — S3-compatible storage with health check
- `app` — Python/uvicorn (build from backend/Dockerfile, target: development)
- `nginx` — Reverse proxy with Traefik labels
- `celery-worker` — Celery worker process
- `celery-beat` — Celery scheduler

**If `backend/Dockerfile` doesn't exist**, create the multi-stage Dockerfile:
```dockerfile
# Stage 1: Base — system dependencies + Python
FROM python:3.12-slim AS base
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl libpq-dev && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Stage 2: Dependencies — cached uv install
FROM base AS dependencies
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project

# Stage 3: Development — full dev environment
FROM base AS development
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/
RUN apt-get update && apt-get install -y --no-install-recommends \
    bash vim git && rm -rf /var/lib/apt/lists/*
WORKDIR /app
CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

# Stage 4: Production — minimal image with baked-in code
FROM base AS production
COPY --from=dependencies /app/.venv /app/.venv
ENV PATH="/app/.venv/bin:$PATH"
COPY . .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```

**If `backend/docker/` config doesn't exist**, create nginx config.

### Step 6 — Create .env and .env.example

```bash
# Create .env.example with placeholder values and .env with working local dev values
```

Required variables:
- `DATABASE_URL=postgresql+asyncpg://user:pass@postgres:5432/dbname`
- `REDIS_URL=redis://redis:6379/0`
- `CELERY_BROKER_URL=redis://redis:6379/1`
- `SECRET_KEY=<random-string>`
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_ENDPOINT_URL` (MinIO)
- Traefik domain
- Any AI service URLs (if ai-llm module is used)

**Rule:** `.env.example` has placeholder values. `.env` has working local dev values matching docker-compose.

### Step 7 — Create pre-commit credential guard

```bash
mkdir -p .githooks
```

Create `.githooks/pre-commit` that:
1. Reads secret values from `.env`
2. Scans staged files for those literal values
3. Blocks the commit if any are found

```bash
chmod +x .githooks/pre-commit
git config core.hooksPath .githooks
```

### Step 8 — Create base directory structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                    # FastAPI app factory
│   ├── config.py                  # Pydantic Settings
│   ├── database.py                # Async SQLAlchemy engine + session
│   ├── api/
│   │   ├── __init__.py
│   │   └── v1/
│   │       ├── __init__.py
│   │       └── router.py          # v1 API router
│   ├── models/                    # SQLAlchemy models
│   │   └── __init__.py
│   ├── schemas/                   # Pydantic request/response schemas
│   │   └── __init__.py
│   ├── services/                  # Business logic by domain
│   │   └── __init__.py
│   ├── tasks/                     # Celery tasks
│   │   └── __init__.py
│   └── deps.py                    # FastAPI dependencies (get_db, get_current_user)
├── alembic/
│   ├── env.py
│   └── versions/
├── alembic.ini
├── tests/
│   ├── conftest.py                # Fixtures: async client, test db
│   ├── unit/
│   └── integration/
├── pyproject.toml
└── uv.lock
```

Create the health endpoint:
```python
# app/api/v1/router.py
from fastapi import APIRouter
from datetime import datetime, timezone

router = APIRouter(prefix="/api/v1")

@router.get("/health")
async def health():
    return {"status": "ok", "timestamp": datetime.now(timezone.utc).isoformat()}
```

### Step 9 — Configure Alembic and test database

```bash
cd backend && alembic init alembic
```

Update `alembic/env.py` to use async SQLAlchemy and load models from `app.models`.

**Configure test database:**
- Add `DATABASE_URL_TEST` to `.env` and `.env.example` pointing to a separate test database
- In `tests/conftest.py`, override the `get_db` dependency to use the test database URL
- Tests MUST use a separate database — never the development database
- Use transaction rollback per test for speed (wrap each test in a transaction, roll back after)
- Do NOT use SQLite for integration tests — use PostgreSQL to match production

### Step 10 — Boot and verify

```bash
./ctl.sh up
./ctl.sh migrate
curl -s https://{domain}/api/v1/health
```

**Verify checklist:**
- [ ] `./ctl.sh up` starts all services without errors
- [ ] `./ctl.sh status` shows all services healthy
- [ ] `./ctl.sh migrate` runs without errors
- [ ] Health endpoint returns 200
- [ ] `./ctl.sh test` runs pytest with 0 failures
- [ ] `.githooks/pre-commit` is executable and configured

### Step 11 — Initial commit

```bash
git add -A
git commit -m "Scaffold FastAPI project with Docker infrastructure"
```

---

## After scaffolding

The scaffold is complete when the project boots, the health endpoint responds, and tests pass. Now proceed with Phase 1 tasks — the scaffold covers `TASK-X.1` (scaffold and verify project boots).

**Do NOT start implementing modules during scaffold.** Module implementation is separate tasks in the plan files. The scaffold only creates the empty FastAPI project with infrastructure.

---

## Module orchestration

This skill also serves as a reference for which modules exist. When implementing Phase 1+ tasks, read the relevant module's `MODULE.md` (spec) and `impl/fastapi.md` (implementation guide).

### Core infrastructure modules
- **Auth:** [`modules/auth/impl/fastapi.md`](../../modules/auth/impl/fastapi.md) — JWT, OAuth2, password hashing
- **Permissions:** [`modules/permissions/impl/fastapi.md`](../../modules/permissions/impl/fastapi.md) — RBAC, dependency-based permission checks
- **Settings:** [`modules/settings/impl/fastapi.md`](../../modules/settings/impl/fastapi.md) — user preferences with cache
- **Feature flags:** [`modules/feature-flags/impl/fastapi.md`](../../modules/feature-flags/impl/fastapi.md) — flag evaluation
- **Audit log:** [`modules/audit-log/impl/fastapi.md`](../../modules/audit-log/impl/fastapi.md) — structured activity logging

### Communication modules
- **Notifications:** [`modules/notifications/impl/fastapi.md`](../../modules/notifications/impl/fastapi.md)
- **Email:** [`modules/email/impl/fastapi.md`](../../modules/email/impl/fastapi.md) — async email via Celery
- **Webhooks outbound:** [`modules/webhooks-outbound/impl/fastapi.md`](../../modules/webhooks-outbound/impl/fastapi.md)

### Content & storage modules
- **File storage:** [`modules/file-storage/impl/fastapi.md`](../../modules/file-storage/impl/fastapi.md) — S3/MinIO presigned URLs
- **Search:** [`modules/search/impl/fastapi.md`](../../modules/search/impl/fastapi.md) — full-text and vector search

### Analytics & monitoring modules
- **Analytics:** [`modules/analytics/impl/fastapi.md`](../../modules/analytics/impl/fastapi.md)
- **Error tracking:** [`modules/error-tracking/impl/fastapi.md`](../../modules/error-tracking/impl/fastapi.md) — Sentry integration

### AI modules
- **AI/LLM:** [`modules/ai-llm/impl/fastapi.md`](../../modules/ai-llm/impl/fastapi.md) — LLM integration, RAG, streaming
- **AI agents:** [`modules/ai-agents/impl/fastapi.md`](../../modules/ai-agents/impl/fastapi.md) — agent loops, tool use

### Developer tool modules
- **API keys:** [`modules/api-keys/impl/fastapi.md`](../../modules/api-keys/impl/fastapi.md)
- **Rate limiting:** [`modules/rate-limiting/impl/fastapi.md`](../../modules/rate-limiting/impl/fastapi.md)

## Guides
- `guides/api-design.md` — REST conventions and error formats
- `guides/architecture.md` — service layer design for FastAPI projects
- `guides/security.md` — JWT security, input validation
