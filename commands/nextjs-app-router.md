---
description: Scaffold a Next.js App Router frontend with Docker
agent: build
---
# Next.js App Router scaffold

## When to use
Use when starting a new Next.js frontend with App Router. Run this after `/bootstrap-from-spec` and `/plan-review` have produced approved plans.

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

### Step 2 — Create the Next.js application

`create-next-app` requires an empty directory. Handle this by creating in a temp directory and moving:

```bash
# Create Next.js in a temp directory
npx create-next-app@latest frontend-temp \
    --typescript --tailwind --eslint --app --src-dir \
    --import-alias "@/*" --no-turbopack --use-npm

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
- Do NOT run `create-next-app` targeting `frontend/` directly — it will fail on non-empty directory
- Do NOT delete `frontend/` to make room — it may have Docker config already written
- Use the temp directory + merge approach above

**After creation, verify:**
```bash
ls frontend/package.json frontend/next.config.ts frontend/src/app/layout.tsx
# All must exist
```

### Step 3 — Install dependencies

```bash
cd frontend && npm install

# Core dependencies
npm install @tanstack/react-query zustand axios

# Dev dependencies
npm install -D @testing-library/react @testing-library/jest-dom vitest @vitejs/plugin-react jsdom
```

### Step 4 — Create base directory structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx             # Root layout
│   │   ├── page.tsx               # Home page
│   │   ├── loading.tsx            # Root loading UI
│   │   ├── error.tsx              # Root error boundary
│   │   ├── not-found.tsx          # 404 page
│   │   ├── (auth)/                # Auth route group (login, register)
│   │   │   └── login/page.tsx
│   │   └── (dashboard)/           # Authenticated route group
│   │       └── layout.tsx         # Dashboard layout with sidebar
│   ├── components/
│   │   └── ui/                    # Reusable UI components
│   ├── hooks/                     # Custom React hooks
│   ├── services/                  # API client and service layer
│   │   └── api.ts                 # Axios instance
│   ├── stores/                    # Zustand stores
│   ├── types/                     # TypeScript interfaces
│   └── lib/                       # Utilities, helpers
├── public/
├── tests/
│   └── setup.ts
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

### Step 5 — Configure middleware

Create `src/middleware.ts` for auth protection:
```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Auth token check — redirect to login if missing
  const token = request.cookies.get('auth_token')
  if (!token && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*'],
}
```

### Step 6 — Configure environment variables

Create `.env.local` and `.env.example`:
```
NEXT_PUBLIC_API_URL=https://{domain}/api/v1
NEXT_PUBLIC_APP_ENV=local
```

**Rule:** Client-side env vars use `NEXT_PUBLIC_` prefix. Server-only vars don't.

### Step 7 — Set up API client

Create `src/services/api.ts` with an Axios instance configured with:
- Base URL from `NEXT_PUBLIC_API_URL`
- Auth token interceptor
- Error response interceptor

### Step 8 — Configure testing

Set up Vitest for component testing:
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.ts',
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
})
```

### Step 9 — Add Docker service (if not in docker-compose.yml)

If `docker-compose.yml` exists but has no `frontend` service, add it:

```yaml
frontend:
  image: node:22-alpine
  container_name: {project}-frontend
  working_dir: /app
  command: sh -c "npm install && npm run dev -- -H 0.0.0.0"
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
    traefik.http.services.{project}-frontend.loadbalancer.server.port: "3000"
```

### Step 10 — Boot and verify

```bash
./ctl.sh up
```

**Verify checklist:**
- [ ] Frontend service starts without errors
- [ ] Next.js dev server accessible at the configured domain
- [ ] Server components render correctly
- [ ] Client components hydrate correctly
- [ ] API client can reach the backend health endpoint
- [ ] `npm test` runs with 0 failures
- [ ] Middleware redirects unauthenticated users

### Step 11 — Initial commit

If this is a standalone frontend scaffold (no backend yet):
```bash
git add -A
git commit -m "Scaffold Next.js App Router frontend with Docker"
```

---

## After scaffolding

The scaffold is complete when the frontend boots, pages render, and tests pass. Now proceed with frontend tasks in the plan.

**Do NOT start implementing module UIs during scaffold.** Module UI implementation is separate tasks in the plan files.

---

## App Router patterns reference

When implementing features, follow these Next.js App Router patterns:

### Server vs Client components
- Default to Server Components — they run on the server, no JS shipped to client
- Use `'use client'` only when needed (event handlers, hooks, browser APIs)
- Keep data fetching in Server Components, pass data down to Client Components

### Route segments and layouts
- Use route groups `(name)` for shared layouts without affecting URL
- Use `loading.tsx` for route-level Suspense boundaries
- Use `error.tsx` for route-level error boundaries
- Use `not-found.tsx` for 404 handling

### Caching and revalidation
- `fetch()` in Server Components is cached by default
- Use `{ next: { revalidate: 60 } }` for time-based revalidation
- Use `revalidatePath()` or `revalidateTag()` for on-demand revalidation
- Use `{ cache: 'no-store' }` for dynamic data

---

## Module references

- **Auth:** [`modules/auth/impl/nextjs.md`](../../modules/auth/impl/nextjs.md) — Next.js middleware, server-side session, auth cookies
- **Permissions:** [`modules/permissions/impl/nextjs.md`](../../modules/permissions/impl/nextjs.md) — server-side permission checks, layout guards
- **Feature flags:** [`modules/feature-flags/impl/nextjs.md`](../../modules/feature-flags/impl/nextjs.md) — server-side flag evaluation
- **Billing:** [`modules/billing/impl/nextjs.md`](../../modules/billing/impl/nextjs.md) — subscription gate, Stripe checkout route

## Guides
- `guides/performance.md` — Core Web Vitals, streaming, partial prerendering
- `guides/security.md` — CSRF, CSP headers, auth token handling in Next.js
- `guides/ui-ux.md` — loading states, error boundaries, layout patterns
