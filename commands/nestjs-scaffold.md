---
description: Scaffold a new NestJS project with Docker infrastructure
agent: build
---
# NestJS project scaffold

## When to use
Use when starting a new NestJS backend. Run this after `/bootstrap-from-spec` and `/plan-review` have produced approved plans.

---

## Scaffold Procedure

### Step 1 — Assess the project directory

The project directory will already contain files from bootstrap (AGENTS.md, SPEC.md, plan/, possibly docker-compose.yml). The scaffold must work in a **non-empty directory**.

**Check what exists:**
```bash
ls -la .
```

Record which of these already exist: `AGENTS.md` or `CLAUDE.md`, `SPEC.md`, `plan/`, `docker-compose.yml`, `backend/`, `frontend/`, `ctl.sh`, `.env`, `.gitignore`

**Rule: NEVER delete or overwrite existing files.** The scaffold adds to the directory — it does not replace bootstrap output.

### Step 2 — Create the NestJS application

The Nest CLI requires an empty directory. Handle this by creating in a temp directory and moving:

```bash
# Create NestJS in a temp directory
npx @nestjs/cli new backend-temp --strict --package-manager npm --skip-git

# Move into the backend/ directory (create if needed, merge if exists)
if [ -d "backend" ]; then
    # Backend dir exists with docker config — move NestJS files around it
    cp -rn backend-temp/* backend/
    cp -rn backend-temp/.* backend/ 2>/dev/null || true
    rm -rf backend-temp
else
    mv backend-temp backend
fi
```

**Critical:** This is the most common failure point. If `backend/` already exists with Docker files:
- Do NOT run `nest new` targeting `backend/` directly — it will fail on non-empty directory
- Do NOT delete `backend/` to make room — it has Docker config that was already written
- Use the temp directory + merge approach above

**After creation, verify:**
```bash
ls backend/package.json backend/nest-cli.json backend/src/main.ts
# All must exist
```

### Step 3 — Initialise git

If no `.git` directory exists at the project root:

```bash
git init
git config core.hooksPath .githooks

# Create .gitignore if missing
# Add: .env, node_modules/, dist/, .idea/, .vscode/, coverage/
```

### Step 4 — Create ctl.sh

Create `ctl.sh` at the project root following the AGENTS.md template. Must include at minimum:

| Command | What it does |
|---------|-------------|
| `up` | `docker compose up -d` |
| `down` | `docker compose down` |
| `logs [service]` | `docker compose logs -f` |
| `shell [service]` | `docker compose exec {service} bash` |
| `migrate` | `docker compose exec app npx prisma migrate deploy` |
| `migrate:new [name]` | `docker compose exec app npx prisma migrate dev --name {name}` |
| `seed` | `docker compose exec app npx prisma db seed` |
| `studio` | `docker compose exec app npx prisma studio` |
| `test` | `docker compose exec app npm test` |
| `test:e2e` | `docker compose exec app npm run test:e2e` |
| `lint` | `docker compose exec app npm run lint` |
| `npm [...]` | Pass-through to npm |
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
- `app` — Node.js (build from backend/Dockerfile, target: development)
- `nginx` — Reverse proxy with Traefik labels
- `queue` — Bull queue worker
- `scheduler` — Cron via NestJS schedule module

**If `backend/Dockerfile` doesn't exist**, create the multi-stage Dockerfile:
```dockerfile
# Stage 1: Base — Node.js
FROM node:22-alpine AS base
RUN apk add --no-cache curl
WORKDIR /app

# Stage 2: Dependencies — cached npm install
FROM base AS dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Stage 3: Development — full dev environment
FROM base AS development
RUN apk add --no-cache bash vim git
WORKDIR /app
CMD ["npm", "run", "start:dev"]

# Stage 4: Builder — compile TypeScript
FROM base AS builder
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 5: Production — minimal image
FROM base AS production
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package*.json ./
CMD ["node", "dist/main.js"]
```

### Step 6 — Create .env and .env.example

Required variables:
- `DATABASE_URL=postgresql://user:pass@postgres:5432/dbname`
- `REDIS_HOST=redis`, `REDIS_PORT=6379`
- `JWT_SECRET=<random-string>`
- `JWT_EXPIRY=3600`
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_ENDPOINT` (MinIO)
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

### Step 8 — Install dependencies and configure

```bash
cd backend

# Prisma ORM
npm install @prisma/client
npm install -D prisma
npx prisma init

# Queue processing
npm install @nestjs/bull bull
npm install -D @types/bull

# Config and validation
npm install @nestjs/config class-validator class-transformer

# Scheduling
npm install @nestjs/schedule

# Testing
npm install -D @nestjs/testing supertest @types/supertest
```

Configure `prisma/schema.prisma` with PostgreSQL provider.

**Configure test database:**
- Add `TEST_DATABASE_URL` to `.env` and `.env.example` pointing to a separate test database
- In the test module, override the Prisma/database connection to use the test database URL
- Tests MUST use a separate database — never the development database
- Use transaction rollback per test for speed where possible
- Do NOT use SQLite for integration tests — use PostgreSQL to match production

### Step 9 — Create base directory structure

```
backend/
├── src/
│   ├── main.ts                    # Bootstrap
│   ├── app.module.ts              # Root module
│   ├── common/
│   │   ├── decorators/            # Custom decorators
│   │   ├── filters/               # Exception filters
│   │   ├── guards/                # Auth/permission guards
│   │   ├── interceptors/          # Response transform, logging
│   │   └── pipes/                 # Validation pipes
│   ├── config/
│   │   └── configuration.ts       # Type-safe config
│   └── modules/
│       └── health/
│           ├── health.controller.ts
│           └── health.module.ts
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── test/
│   ├── app.e2e-spec.ts
│   └── jest-e2e.json
├── package.json
├── nest-cli.json
└── tsconfig.json
```

Create the health endpoint:
```typescript
// src/modules/health/health.controller.ts
@Controller('api')
export class HealthController {
  @Get('health')
  health() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
```

### Step 10 — Boot and verify

```bash
./ctl.sh up
./ctl.sh migrate
curl -s https://{domain}/api/health
```

**Verify checklist:**
- [ ] `./ctl.sh up` starts all services without errors
- [ ] `./ctl.sh status` shows all services healthy
- [ ] `./ctl.sh migrate` runs without errors
- [ ] Health endpoint returns 200
- [ ] `./ctl.sh test` runs Jest with 0 failures
- [ ] `.githooks/pre-commit` is executable and configured

### Step 11 — Initial commit

```bash
git add -A
git commit -m "Scaffold NestJS project with Docker infrastructure"
```

---

## After scaffolding

The scaffold is complete when the project boots, the health endpoint responds, and tests pass. Now proceed with Phase 1 tasks — the scaffold covers `TASK-X.1` (scaffold and verify project boots).

**Do NOT start implementing modules during scaffold.** Module implementation is separate tasks in the plan files. The scaffold only creates the empty NestJS project with infrastructure.

---

## Module orchestration

This skill also serves as a reference for which modules exist. When implementing Phase 1+ tasks, read the relevant module's `MODULE.md` (spec) and `impl/node.md` (implementation guide).

### Core infrastructure modules
- **Auth:** [`modules/auth/impl/node.md`](../../modules/auth/impl/node.md) — Passport JWT, guards, refresh tokens
- **Permissions:** [`modules/permissions/impl/node.md`](../../modules/permissions/impl/node.md) — RBAC guards, CASL ability
- **Tenancy:** [`modules/tenancy/impl/node.md`](../../modules/tenancy/impl/node.md) — tenant middleware, row isolation
- **Settings:** [`modules/settings/impl/node.md`](../../modules/settings/impl/node.md) — user preferences
- **Feature flags:** [`modules/feature-flags/impl/node.md`](../../modules/feature-flags/impl/node.md)
- **Audit log:** [`modules/audit-log/impl/node.md`](../../modules/audit-log/impl/node.md)

### Communication modules
- **Notifications:** [`modules/notifications/impl/node.md`](../../modules/notifications/impl/node.md)
- **Email:** [`modules/email/impl/node.md`](../../modules/email/impl/node.md)
- **Realtime:** [`modules/realtime/impl/node.md`](../../modules/realtime/impl/node.md) — Socket.io gateway
- **Chat:** [`modules/chat/impl/node.md`](../../modules/chat/impl/node.md)
- **Presence:** [`modules/presence/impl/node.md`](../../modules/presence/impl/node.md)
- **Webhooks inbound:** [`modules/webhooks-inbound/impl/node.md`](../../modules/webhooks-inbound/impl/node.md)
- **Webhooks outbound:** [`modules/webhooks-outbound/impl/node.md`](../../modules/webhooks-outbound/impl/node.md)

### Content & storage modules
- **File storage:** [`modules/file-storage/impl/node.md`](../../modules/file-storage/impl/node.md)
- **Search:** [`modules/search/impl/node.md`](../../modules/search/impl/node.md)

### Analytics & monitoring
- **Analytics:** [`modules/analytics/impl/node.md`](../../modules/analytics/impl/node.md)
- **Error tracking:** [`modules/error-tracking/impl/node.md`](../../modules/error-tracking/impl/node.md)
- **Rate limiting:** [`modules/rate-limiting/impl/node.md`](../../modules/rate-limiting/impl/node.md)

### Billing
- **Billing:** [`modules/billing/impl/node.md`](../../modules/billing/impl/node.md)
- **Subscriptions:** [`modules/subscriptions/impl/node.md`](../../modules/subscriptions/impl/node.md)

## Guides
- `guides/api-design.md` — REST conventions and error formats
- `guides/architecture.md` — NestJS module boundaries and service layer design
- `guides/security.md` — JWT, guards, input validation
