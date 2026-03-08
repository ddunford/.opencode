---
description: Scaffold a React + Vite SPA frontend with Docker
agent: build
---
# React + Vite scaffold

## When to use
Use when starting a new React SPA frontend. Run this after `/bootstrap-from-spec` and `/plan-review` have produced approved plans.

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

### Step 2 — Create the React application

Vite's `create` command requires an empty directory. Handle this by creating in a temp directory and moving:

```bash
# Create React app in a temp directory
npm create vite@latest frontend-temp -- --template react-ts

# Move into the frontend/ directory (create if needed, merge if exists)
if [ -d "frontend" ]; then
    # Frontend dir exists with docker config — merge carefully
    cp -rn frontend-temp/* frontend/
    cp -rn frontend-temp/.* frontend/ 2>/dev/null || true
    rm -rf frontend-temp
else
    mv frontend-temp frontend
fi
```

**Critical:** This is the most common failure point. If `frontend/` already exists with Docker files:
- Do NOT run `npm create vite` targeting `frontend/` directly — it will fail on non-empty directory
- Do NOT delete `frontend/` to make room — it may have Docker config already written
- Use the temp directory + merge approach above

**After creation, verify:**
```bash
ls frontend/package.json frontend/vite.config.ts frontend/src/main.tsx
# All must exist
```

### Step 3 — Install dependencies

```bash
cd frontend && npm install

# Core dependencies
npm install react-router-dom @tanstack/react-query zustand axios

# Dev dependencies
npm install -D @testing-library/react @testing-library/jest-dom vitest jsdom
npm install -D @types/react @types/react-dom eslint prettier
```

### Step 4 — Configure Vite

Update `vite.config.ts`:
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: '0.0.0.0',
  },
})
```

Update `tsconfig.json` with path alias:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] }
  }
}
```

### Step 5 — Create base directory structure

```
frontend/
├── src/
│   ├── main.tsx                   # Entry point
│   ├── App.tsx                    # Root component + router
│   ├── components/
│   │   └── ui/                    # Reusable UI components
│   ├── pages/                     # Route-level components
│   ├── hooks/                     # Custom React hooks
│   ├── services/                  # API client and service layer
│   │   └── api.ts                 # Axios instance with interceptors
│   ├── stores/                    # Zustand stores
│   ├── types/                     # TypeScript interfaces
│   └── lib/                       # Utilities, helpers
├── public/
├── tests/
│   └── setup.ts                   # Vitest setup (testing-library)
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

### Step 6 — Configure environment variables

Create `.env` and `.env.example` in the frontend directory:
```
VITE_API_URL=https://{domain}/api/v1
VITE_APP_ENV=local
```

**Rule:** All frontend env vars must use the `VITE_` prefix.

### Step 7 — Set up API client

Create `src/services/api.ts` with an Axios instance configured with:
- Base URL from `VITE_API_URL`
- Auth token interceptor (reads from auth store)
- Error response interceptor (401 → redirect to login)
- CSRF/XSRF cookie handling if using Sanctum

### Step 8 — Configure testing

Create `tests/setup.ts`:
```typescript
import '@testing-library/jest-dom'
```

Update `vite.config.ts` with test config:
```typescript
test: {
  globals: true,
  environment: 'jsdom',
  setupFiles: './tests/setup.ts',
}
```

### Step 9 — Add Docker service (if not in docker-compose.yml)

If `docker-compose.yml` exists but has no `frontend` service, add it:

```yaml
frontend:
  image: node:22-alpine
  container_name: {project}-frontend
  working_dir: /app
  command: sh -c "npm install && npm run dev -- --host 0.0.0.0"
  volumes:
    - ./frontend:/app
    - frontend_node_modules:/app/node_modules
  networks:
    - internal
    - ${TRAEFIK_NETWORK}    # see local/traefik.md for network name
  labels:
    traefik.enable: "true"
    traefik.http.routers.{project}-frontend.rule: "Host(`{domain}`)"
    traefik.http.routers.{project}-frontend.entrypoints: "websecure"
    traefik.http.routers.{project}-frontend.tls.certresolver: "${DEV_CERTRESOLVER}"
    traefik.http.routers.{project}-frontend.priority: "1"
    traefik.http.services.{project}-frontend.loadbalancer.server.port: "5173"
```

### Step 10 — Boot and verify

```bash
./ctl.sh up
# Or if no ctl.sh: docker compose up -d
```

**Verify checklist:**
- [ ] Frontend service starts without errors
- [ ] Vite dev server accessible at the configured domain
- [ ] API client can reach the backend health endpoint
- [ ] `npm test` runs Vitest with 0 failures
- [ ] Path aliases (`@/`) resolve correctly
- [ ] Hot module reload works (edit a component, see change)

### Step 11 — Initial commit

If this is a standalone frontend scaffold (no backend yet):
```bash
git add -A
git commit -m "Scaffold React + Vite frontend with Docker"
```

If the backend was already scaffolded, stage just the frontend files.

---

## After scaffolding

The scaffold is complete when the frontend boots, pages render, and tests pass. Now proceed with frontend tasks in the plan.

**Do NOT start implementing module UIs during scaffold.** Module UI implementation is separate tasks in the plan files. The scaffold only creates the empty React app with routing and API client.

---

## Module references

When implementing Phase 1+ frontend tasks, read the relevant module's `MODULE.md` (spec) and `impl/react.md` (implementation guide).

### Core infrastructure
- **Auth:** [`modules/auth/impl/react.md`](../../modules/auth/impl/react.md) — Zustand auth store, React Query hooks, protected routes
- **Permissions:** [`modules/permissions/impl/react.md`](../../modules/permissions/impl/react.md) — `usePermission` hook, permission gates
- **Settings:** [`modules/settings/impl/react.md`](../../modules/settings/impl/react.md) — user preference hooks and forms
- **Feature flags:** [`modules/feature-flags/impl/react.md`](../../modules/feature-flags/impl/react.md) — `useFeatureFlag` hook

### Communication
- **Notifications:** [`modules/notifications/impl/react.md`](../../modules/notifications/impl/react.md) — notification bell, real-time subscription
- **Realtime:** [`modules/realtime/impl/react.md`](../../modules/realtime/impl/react.md) — Laravel Echo setup, channel hooks
- **Chat:** [`modules/chat/impl/react.md`](../../modules/chat/impl/react.md) — message list, thread view, typing indicator
- **Presence:** [`modules/presence/impl/react.md`](../../modules/presence/impl/react.md) — online status dots, avatar row

### Content & media
- **File storage:** [`modules/file-storage/impl/react.md`](../../modules/file-storage/impl/react.md) — upload component, presigned URL handling
- **Media library:** [`modules/media-library/impl/react.md`](../../modules/media-library/impl/react.md) — media picker, gallery components
- **Comments:** [`modules/comments/impl/react.md`](../../modules/comments/impl/react.md) — threaded comment component
- **Activity feed:** [`modules/activity-feed/impl/react.md`](../../modules/activity-feed/impl/react.md) — event stream feed

### Search & UX
- **Search:** [`modules/search/impl/react.md`](../../modules/search/impl/react.md) — search input, results list, facets
- **Onboarding:** [`modules/onboarding/impl/react.md`](../../modules/onboarding/impl/react.md) — step wizard, checklist component
- **Dashboards:** [`modules/dashboards/impl/react.md`](../../modules/dashboards/impl/react.md) — widget grid, layout persistence
- **Changelog:** [`modules/changelog/impl/react.md`](../../modules/changelog/impl/react.md) — changelog list, unread badge

### Commerce
- **Billing:** [`modules/billing/impl/react.md`](../../modules/billing/impl/react.md) — plan selector, Stripe checkout, portal link
- **Subscriptions:** [`modules/subscriptions/impl/react.md`](../../modules/subscriptions/impl/react.md) — plan management UI

### Developer tools
- **API keys:** [`modules/api-keys/impl/react.md`](../../modules/api-keys/impl/react.md) — API key management UI, developer portal
- **Webhooks:** [`modules/webhooks-outbound/impl/react.md`](../../modules/webhooks-outbound/impl/react.md) — endpoint management, delivery logs

### AI
- **AI/LLM:** [`modules/ai-llm/impl/react.md`](../../modules/ai-llm/impl/react.md) — chat UI, streaming responses, RAG search
- **AI agents:** [`modules/ai-agents/impl/react.md`](../../modules/ai-agents/impl/react.md) — agent run monitoring, tool call display
