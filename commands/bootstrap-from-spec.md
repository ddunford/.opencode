---
description: Generate AGENTS.md, plans, and test plans from SPEC.md for a new project
agent: build
---
# Bootstrap project from SPEC.md

## When to use
Run at the start of any new project when a SPEC.md exists in the current directory.
Reads the spec, maps it to the module system, selects a tech stack, and produces
plan files + a project AGENTS.md so coding can start immediately.

---

## Checklist

### Step 1 — Read the spec
- Read `SPEC.md` in the current working directory
- Identify: product type, target users, core feature list, integrations, billing model

### Step 2 — Match a composition
- Read `~/.claude/modules/compositions/` to see available compositions
- Select the best-fit composition (or combine two if the product spans categories)
- State which composition was chosen and why in one sentence

Available compositions: `saas`, `ecommerce`, `api-service`, `content-platform`,
`internal-tool`, `ai-product`, `team-collaboration`, `mobile-app`

### Step 3 — Map spec features to modules
For each major feature in the spec, identify the module that implements it.
Read `~/.claude/modules/README.md` for the full module catalogue.

Produce a table:

| Spec Feature | Module | Role |
|---|---|---|
| User login / registration | `auth` | core |
| Subscription billing | `billing` | core |
| ... | ... | core / optional |

Mark each module as **core** (must have day 1) or **optional** (phase 2+).

Read each core module's `MODULE.md` briefly to confirm it covers what the spec needs.
Note any spec requirements that have no matching module — flag these as custom build.

### Step 3b — Validate composition requirements

Cross-check the chosen composition's **Core Modules (Required)** list against the mapped modules from Step 3.

- If a required module is missing, **flag it explicitly** and ask the user to either add it or document why it's excluded
- Example: SaaS composition requires `billing` — if billing isn't mapped, that's a gap that must be acknowledged
- Add any missing required modules to the mapping table or add an **Excluded Modules** section to AGENTS.md with rationale

### Step 3c — Spec out custom features

For every feature flagged as "custom build" (no matching module), write a **Custom Feature Spec** in the project AGENTS.md. Custom work is the highest-risk part of any project — it must have the same rigour as module-backed work.

Each custom feature spec must include:

```markdown
### Custom: {Feature Name}

**Purpose:** [What it does and why no existing module covers it]

**Database tables:**
| Table | Key columns | Notes |
|-------|------------|-------|
| {table} | {columns} | {notes} |

**API endpoints:**
| Method | Path | Description |
|--------|------|-------------|
| POST | /api/v1/{resource} | {description} |

**Service classes:**
- `{ServiceName}` — {responsibility}
- `{ServiceName}` — {responsibility}

**Key patterns:**
- {pattern 1 — e.g., "Queue-based processing with 600s timeout"}
- {pattern 2 — e.g., "Token replacement via regex with fallback to empty string"}

**Test checklist:**
- [ ] {critical test scenario 1}
- [ ] {critical test scenario 2}
```

**Rules:**
- Do NOT skip this step. Custom features without specs will be implemented inconsistently.
- Every custom feature must have at least: tables, endpoints, and service classes defined.
- The spec doesn't need to be exhaustive — it needs to be specific enough that the implementer knows what to build without guessing.

**Splitting complex custom features into sub-phases:**

If a custom feature is too complex to spec in a few paragraphs, it should get its own plan phase (or sub-phase). Do NOT create a separate `plan/tasks/` folder — all tasks must stay in `plan/phase-*.md` files so the tracking hook works and context stays together.

Instead, split the parent phase into lettered sub-phases:

```
plan/phase-3a-timeline-editor.md      # schema, services, backend tests
plan/phase-3b-render-pipeline.md      # ffmpeg service, queue jobs, tests
plan/phase-3c-presentation-ui.md      # React timeline editor, media picker, frontend tests
```

Each sub-phase is a self-contained plan file with its own `## Tasks` section, own test plan, and own completion criteria. The hook picks them all up. Tasks use the parent phase number: `TASK-3a.1`, `TASK-3b.1`, etc.

**When to split:**
- The custom feature has 3+ service classes
- It spans both backend and frontend with significant complexity on each side
- It involves a processing pipeline (e.g., ffmpeg rendering, AI inference chain)
- A single phase file would have 15+ tasks for just this one feature

**When NOT to split:**
- The custom feature is straightforward CRUD with a service class or two
- It can be fully specified and tasked in 5-6 lines alongside module tasks

### Step 4 — Choose the tech stack
Based on the product type and team context, select:

- **Backend:** Laravel (PHP) | FastAPI (Python) | NestJS (Node.js)
- **Web frontend:** React + Vite | Next.js (App Router) | both
- **Mobile:** React Native (Expo) | Flutter | none

State the rationale (1–2 sentences per choice).

For each selected platform, identify:
- The scaffold skill to invoke: `/laravel-scaffold`, `/fastapi-scaffold`, `/nestjs-scaffold`, `/react-vite`, `/nextjs-app-router`, `/react-native-scaffold`
- The agent to use for ongoing work: `/backend-php-laravel-engineer`, `/fastapi-engineer`, `/nestjs-engineer`, `/frontend-react-architect`, `/react-native-engineer`

### Step 4b — Define application architecture

Before writing phase plans, make key architectural decisions that affect every phase. These decisions go in the project AGENTS.md under an `## Architecture Decisions` section and inform how tasks are structured.

Read `~/.claude/guides/architecture.md` for the full patterns reference. Then decide and document:

**1. Application structure:**

| Decision | Options | Default |
|----------|---------|---------|
| Deployment model | Monolith / Modular monolith / Microservices | Modular monolith |
| Module boundaries | Directory-based / Namespace-based / Package-based | Directory-based |
| Dependency direction | Clean architecture (domain → app → infra) / MVC / Feature slices | Clean architecture |

**2. Backend architecture patterns:**

| Decision | Options | When to pick |
|----------|---------|-------------|
| Service layer pattern | Service classes / Use-case classes / CQRS commands+queries | Service classes for CRUD-heavy, CQRS for complex domains |
| Data access pattern | Repository / Active Record / Direct ORM | Repository when testability matters, Active Record for simple CRUD |
| Error handling strategy | Exception-based / Result objects / Either monad | Exception-based for PHP/Python, Result objects for TypeScript |
| Validation location | Form requests + service / Schema validation / Domain invariants | Form requests at boundary, domain invariants in entities |
| Event architecture | None / Domain events / Event sourcing | Domain events when actions trigger side effects |
| Job/queue strategy | Synchronous / Queue per-job-type / Priority queues | Queue per-job-type with retry policies |
| API response format | Envelope `{data, meta}` / Direct / JSON:API | Envelope with consistent error format |

**3. Frontend architecture patterns:**

| Decision | Options | When to pick |
|----------|---------|-------------|
| State management | React Query only / Zustand + React Query / Redux Toolkit | React Query for server state, add Zustand only if complex client state |
| Component pattern | Container/Presentational / Feature-based / Atomic design | Feature-based for most apps |
| API client pattern | Generated from OpenAPI / Manual service classes / React Query hooks directly | Service classes wrapping fetch/axios, consumed by hooks |
| Form handling | React Hook Form / Formik / Native | React Hook Form with Zod validation |
| Routing strategy | File-based (Next.js) / Centralized config (React Router) | Match framework convention |
| Error boundaries | Per-page / Per-feature / Global only | Per-page with global fallback |

**4. Cross-cutting patterns:**

| Decision | Options | When to pick |
|----------|---------|-------------|
| Auth token flow | Cookie-based session / JWT in header / JWT in cookie | Cookie-based for web-only, JWT in header if mobile clients exist |
| Multi-tenant data isolation | Row-level (tenant_id FK) / Schema-per-tenant / DB-per-tenant | Row-level for most SaaS |
| File upload pattern | Direct to S3 presigned URL / Through backend / Chunked upload | Presigned URL for large files, through backend for small |
| Caching strategy | No cache / Read-through / Cache-aside with invalidation | Cache-aside for read-heavy endpoints |
| Pagination | Cursor-based / Offset-based / Keyset | Cursor-based for infinite scroll, offset for admin tables |

**Write the decisions into AGENTS.md:**

```markdown
## Architecture Decisions

### Application Structure
- **Modular monolith** with directory-based module boundaries
- Clean architecture: domain entities → application services → infrastructure adapters
- Shared database with module-prefixed tables

### Backend Patterns
- Service classes for business logic (one service per domain concept)
- Repository pattern for data access (behind interfaces for testability)
- Form request validation at API boundary, domain invariants in entities
- Domain events for cross-module side effects (e.g., OrderPlaced → send notification)
- Envelope response format: `{data, meta, errors}`

### Frontend Patterns
- Feature-based component structure (features/ directory, not atomic design)
- React Query for server state, Zustand for complex client-only state
- Service classes wrapping axios, consumed by custom hooks
- React Hook Form + Zod for form validation
- Error boundaries per page with global fallback

### Cross-Cutting
- JWT in Authorization header (mobile clients planned)
- Row-level tenant isolation via tenant_id foreign key
- Presigned S3 URLs for file uploads
- Cache-aside pattern with Redis, 5-minute TTL on list endpoints
- Cursor-based pagination for public API, offset for admin
```

**Why this matters:**
- Without explicit architecture decisions, each phase gets implemented with whatever pattern the agent defaults to — leading to inconsistent code (some services use repositories, others call the ORM directly, some use events, others don't)
- `/plan-reconcile` uses these decisions to check for architectural drift (Step 3b)
- Agents reference these patterns when implementing tasks, ensuring consistency across phases
- It's much cheaper to decide "we use repositories" once than to refactor 15 services later

**Rules:**
- Do NOT leave decisions blank or say "TBD" — make a choice, even if opinionated. It can be changed later.
- Prefer the simplest pattern that meets requirements. Don't pick CQRS for a CRUD app.
- Reference `guides/architecture.md` for pattern trade-offs if unsure.
- If the spec describes high-scale requirements, complex domains, or unusual constraints, call those out and adjust patterns accordingly.

### Step 5 — Define implementation phases
Break the core modules into 3–5 phases. Earlier phases must be deployable and testable on their own.

Typical phase order:
1. **Foundation** — auth, tenancy (if multi-tenant), permissions, settings, feature-flags
2. **Core product** — the 3–5 modules that make the product usable
3. **Growth & engagement** — notifications, analytics, billing (if not already), onboarding
4. **Integrations & developer features** — api-keys, webhooks, sdk-generation
5. **Scale & compliance** — audit-compliance, rate-limiting, sso-saml, white-labeling

Adjust based on what the spec says is MVP vs phase 2.

**Mandatory Phase 1 infrastructure (non-negotiable):**

Every project's Phase 1 must include these regardless of composition or product type:

| Item | What | Why |
|------|------|-----|
| Docker + ctl.sh | Multi-stage Dockerfile, docker-compose, ctl.sh with standard commands | Can't develop without it |
| CI/CD pipeline | GitHub Actions workflow: lint, test, build on PR | Catches regressions from task 2 onwards |
| Structured logging | Framework logger (not print/echo), JSON format, correlation IDs | Can't debug without it |
| Error tracking | Sentry or equivalent, integrated with framework exception handler | Know when things break |
| Health endpoint | `GET /api/health` returning service status | Traefik health checks, monitoring |
| Pre-commit hook | `.githooks/pre-commit` credential guard | Prevent secret leaks from day 1 |

If any of these are missing from Phase 1, add them. They are not optional.

### Step 6 — Write plan files
Create plan files following the AGENTS.md convention:

**`plan/phase-1-foundation.md`** — implement using this structure:
```markdown
# Phase 1: Foundation

## Overview
[What this phase delivers and why it comes first]

## Modules
- `auth` — [config block with chosen options]
- `permissions` — [config block]
- ...

## Implementation steps
1. Run `/laravel-scaffold` (or chosen scaffold skill)
2. Implement `auth` module: read MODULE.md config → apply impl/laravel.md
3. ...

## API endpoints delivered
[List from module specs]

## Tasks

- [ ] `TASK-1.1` Run scaffold skill and verify project boots → `/backend-php-laravel-engineer`
- [ ] `TASK-1.2` Implement auth module (register, login, logout) → `/backend-php-laravel-engineer` [TC-1.1]
- [ ] `TASK-1.3` Write auth unit and integration tests [TC-1.2]
- [ ] `TASK-1.4` ...
```

Task format rules:
- `- [ ]` = pending, `- [x]` = complete
- Task ID: `TASK-{phase}.{seq}` — greppable, unique per project
- One line per task, derived from the implementation steps above
- Every implementation step should have a corresponding task
- Add `→ /agent-name` to indicate which agent should be used
- Add `[TC-X.Y]` to link to test cases in `test-plan-phase-{N}.md`
- Include explicit test-writing tasks — don't assume tests come for free
- Add a **QA execution task** near the end of each phase: `TASK-X.{N}` ⫘ Execute test plan via Playwright MCP → `/qa-test-engineer` `[TC-X.*]` — blocked by ALL backend AND frontend implementation tasks (needs working endpoints + rendered pages), runs through test cases in the browser, updates status markers
- Add a **security review task** near the end of each phase (can run in parallel with QA): `TASK-X.{N}` ⫘ OWASP security audit → `/security-reviewer` — blocked by ALL implementation tasks, reviews code for OWASP top 10 vulnerabilities, secrets leaks, missing auth checks. Critical/High findings must be fixed before phase is complete

**Parallel task markers (for agent teams):**

Mark tasks that can run in parallel with `⫘` (parallel) after the task ID. Tasks without the marker are sequential — they must wait for all preceding tasks to complete.

```
- [ ] `TASK-1.1` Scaffold project and verify boots → /backend-php-laravel-engineer
- [ ] `TASK-1.2` ⫘ Create auth migrations and models → /backend-php-laravel-engineer
- [ ] `TASK-1.3` ⫘ Build React app shell, routing, API client → /frontend-react-architect
- [ ] `TASK-1.4` Implement AuthService and auth controllers → /backend-php-laravel-engineer
- [ ] `TASK-1.5` ⫘ Build React auth pages (login, register) → /frontend-react-architect
- [ ] `TASK-1.6` Write auth backend tests [TC-1.1, TC-1.2] → /backend-php-laravel-engineer
- [ ] `TASK-1.7` ⫘ Write auth frontend tests [TC-1.1] → /frontend-react-architect
- [ ] `TASK-1.8` ⫘ Execute test plan via Playwright MCP [TC-1.*] → /qa-test-engineer
- [ ] `TASK-1.9` ⫘ OWASP security audit of phase 1 code → /security-reviewer
```

In this example:
- TASK-1.1 is sequential (scaffold must finish first)
- TASK-1.2 and TASK-1.3 can run in parallel (backend schema + frontend shell don't conflict)
- TASK-1.4 depends on TASK-1.2 (needs models), so it's sequential
- TASK-1.5 and TASK-1.4 can run in parallel (frontend pages + backend controllers)
- TASK-1.6 and TASK-1.7 can run in parallel (backend tests + frontend tests)
- TASK-1.8 (QA) is blocked by both backend (1.4) and frontend (1.5) tasks — the QA teammate needs working endpoints AND rendered pages. It can run in parallel with unit test tasks (1.6, 1.7) since those don't affect the running app
- TASK-1.9 (Security) is blocked by all implementation tasks — needs final code. It can run in parallel with QA (code review vs UI testing)

**Rules for marking parallel tasks:**
- Tasks touching different directories (backend/ vs frontend/) are usually parallelisable
- Schema/migration tasks must complete before service tasks that use those tables
- Test tasks can often run in parallel with each other
- When in doubt, leave it sequential — wrong parallelism causes merge conflicts

**Task granularity rules (critical):**

"Implement auth module" is NOT one task. It's 4-6 tasks. Break every module and custom feature into granular, completable units:

**For each module, create at minimum:**
1. Schema/migrations task — create tables, indexes, foreign keys
2. Backend services + routes task — service classes, controllers, form requests, API resources
3. Backend tests task — unit tests for services, feature tests for API endpoints
4. Frontend UI task (if applicable) — pages, components, hooks, API client calls
5. **Integration/wiring task** — verify page imports services, services call endpoints, components render in pages, providers wrap consumers

**For each custom feature, create at minimum:**
1. Schema/migrations task
2. Each service class as its own task (e.g., "Implement RenderService for ffmpeg pipeline")
3. Routes + controllers task
4. Backend tests task
5. Frontend UI task (if applicable)
6. Frontend tests task (if applicable)
7. **Integration/wiring task** — verify all services are imported by pages, all components are rendered, all endpoints are called by frontend, all init methods are invoked

**Bad example (too coarse):**
```
- [ ] `TASK-1.2` Implement auth module → /backend-php-laravel-engineer
```

**Good example (proper granularity):**
```
- [ ] `TASK-1.2` Create auth migrations (users, password_resets, sessions, personal_access_tokens) → /backend-php-laravel-engineer
- [ ] `TASK-1.3` Implement AuthService, RegisterController, LoginController, Form Requests → /backend-php-laravel-engineer
- [ ] `TASK-1.4` Implement auth API Resources and route registration → /backend-php-laravel-engineer
- [ ] `TASK-1.5` Write auth unit tests (AuthService) and feature tests (register, login, logout, verify email) → /backend-php-laravel-engineer [TC-1.1, TC-1.2]
- [ ] `TASK-1.6` Build React auth pages (login, register, forgot password) and auth hooks → /frontend-react-architect [TC-1.1]
- [ ] `TASK-1.7` Wire auth integration — verify LoginPage calls AuthService.login(), AuthService calls POST /auth/login, AuthProvider wraps protected routes, API interceptor sends token → /frontend-react-architect [TC-1.3]
- [ ] `TASK-1.8` Write frontend auth tests (form validation, API integration) → /frontend-react-architect
```

**Why wiring tasks matter:** Without them, "Implement PaymentService" and "Build CheckoutPage" both get marked complete, but the page never imports the service. The backend works, the frontend renders, but checkout doesn't process payments because nothing connects them. A wiring task explicitly checks: service imported? method called? props passed? provider wrapping? This catches the most common class of "it looks done but doesn't work" bugs.

A task should be completable in a single focused session. If it would take more than ~1 hour of implementation, it's too big — split it.

**`plan/test-plan-phase-1.md`** — manual test cases:
```markdown
# Test Plan: Phase 1 — Foundation

## Prerequisites
- Local dev environment running
- Database migrated

## Test Cases

### TC-1.1: Registration
**Steps:** ...
**Expected:** ...
**Status:** ⬜
```

Create one plan file + one test plan per phase.

### Step 7 — Write project AGENTS.md
Create `AGENTS.md` in the project root:

```markdown
# [Product Name]

> [One-line description from spec]

## Stack
- Backend: [chosen framework + version]
- Frontend: [chosen framework + version]
- Mobile: [if applicable]
- Database: PostgreSQL 16
- Queue: Redis + [Laravel Horizon / Bull / Celery]
- Storage: S3-compatible (MinIO in dev)

## Modules in use
[List each module with its config block — copy from MODULE.md and fill in choices]

## Agents to use
- Backend work: `/[chosen-backend-agent]`
- Frontend work: `/[chosen-frontend-agent]`
- Mobile work: `/[chosen-mobile-agent]` (if applicable)
- Database: `/database-architect`
- Security review: `/security-reviewer`

## Skills to use
- Project setup: `/[scaffold-skill]`
- [other relevant skills]

## Guides to read
- [list 3–5 most relevant guides for this product type]

## Development conventions
- API base: `/api/v1/`
- Auth: [session/JWT/Sanctum — from auth module config]
- Multi-tenant: [yes/no — strategy]
- Environment: `.env` (see `.env.example`)

## Implementation order
Phase 1 → Phase 2 → ... (see plan/ directory)

## Out of scope (v1)
[Copy from spec]
```

### Step 7b — Write the architecture map

After the main AGENTS.md, add an `## Architecture Map` section. This is the **single source of truth** for how the app is wired together — frontend routes, page-to-component mapping, service dependencies, and data flow. `/plan-reconcile` uses this to verify the implementation matches the design.

```markdown
## Architecture Map

### Frontend Routes

| URL | Page Component | Phase | Auth Required | Key Services Used |
|-----|---------------|-------|---------------|-------------------|
| `/login` | LoginPage | 1 | No | AuthService |
| `/register` | RegisterPage | 1 | No | AuthService |
| `/dashboard` | DashboardPage | 1 | Yes | DashboardService, WorkspaceService |
| `/orders` | OrderListPage | 2 | Yes | OrderService |
| `/orders/:id` | OrderDetailPage | 2 | Yes | OrderService, ShippingService |
| `/checkout` | CheckoutPage | 2 | Yes | CartService, PaymentService, ShippingService |
| `/settings` | SettingsPage | 1 | Yes | SettingsService |
| `/admin/members` | MemberManagementPage | 1 | Yes (admin) | TeamService, PermissionsService |

### Page → Component Tree

Map every page to the major components it renders. This catches "unwired" components — code that exists but is never rendered.

```
CheckoutPage
├── CartSummary
│   ├── CartItemList
│   │   ├── CartItemRow (name, quantity, price)
│   │   └── RemoveButton
│   └── CartTotals
├── ShippingForm
│   ├── AddressFields
│   ├── ShippingMethodSelector
│   └── DeliveryEstimate
├── PaymentSection
│   ├── PaymentMethodSelector
│   ├── CardForm
│   └── PromoCodeInput
└── OrderSummaryBar
```

### Frontend Service → Page Mapping

Map every frontend service to the page(s) that consume it. Services with no consumer are dead code.

| Frontend Service | Consumed By | Phase |
|-----------------|-------------|-------|
| AuthService | LoginPage, RegisterPage, AppShell (interceptor) | 1 |
| DashboardService | DashboardPage | 1 |
| OrderService | OrderListPage, OrderDetailPage | 2 |
| CartService | CheckoutPage (CartSummary) | 2 |
| PaymentService | CheckoutPage (PaymentSection) | 2 |
| ShippingService | CheckoutPage (ShippingForm), OrderDetailPage | 2 |
| NotificationService | OrderDetailPage, DashboardPage | 3 |

### Backend Endpoint → Frontend Consumer

Map every API endpoint to the frontend page or service that calls it. Endpoints with no consumer may indicate missing frontend work.

| Endpoint | Frontend Consumer | Phase |
|----------|------------------|-------|
| POST /api/v1/auth/login | LoginPage → AuthService | 1 |
| GET /api/v1/dashboard/stats | DashboardPage → DashboardService | 1 |
| GET /api/v1/orders | OrderListPage → OrderService | 2 |
| GET /api/v1/orders/:id | OrderDetailPage → OrderService | 2 |
| POST /api/v1/orders | CheckoutPage → CartService | 2 |
| POST /api/v1/payments | CheckoutPage → PaymentService | 2 |
| GET /api/v1/shipping/rates | CheckoutPage → ShippingService | 2 |

### Shared State & Context Providers

List React context providers and what depends on them. Missing providers cause blank screens.

| Provider | Wraps | Components That Depend On It |
|----------|-------|------------------------------|
| AuthProvider | App root | All authenticated pages, API interceptor |
| WorkspaceProvider | Authenticated routes | All workspace-scoped pages, API client (X-Workspace-Id header) |
| CartProvider | Checkout routes | CartSummary, PaymentSection, PromoCodeInput |
| ThemeProvider | App root | All components |
```

**Rules for the architecture map:**
- Every page in the Frontend Routes table must have a matching page component file
- Every frontend service in the Service → Page mapping must be imported by at least one page
- Every API endpoint in the Endpoint → Consumer mapping must have a backend route AND a frontend caller
- Every context provider must wrap the components that depend on it
- Update the map when adding new phases — it's a living document, not a one-time artifact

**Why this matters:**
- `/plan-reconcile` uses this map to verify code matches design — it checks every row
- `/test-audit` uses the Frontend Routes table to generate page render test cases
- `/plan-review` validates that plan tasks cover every row in the map
- Developers use it to understand where new features plug in

### Step 8 — Output a bootstrap summary
Print a concise summary to the user:

```
## Bootstrap complete

**Product:** [name] — [one line description]
**Composition:** [name]
**Stack:** [backend] + [frontend] [+ mobile]

**Core modules (Phase 1–2):** auth, billing, ...
**Optional modules (Phase 3+):** analytics, webhooks, ...
**Custom build required:** [anything in spec with no matching module]

**Files created:**
- AGENTS.md
- plan/phase-1-foundation.md + test-plan
- plan/phase-2-[name].md + test-plan
- ...

**Next step:**
1. `/plan-review` — validate plans are complete and ready for development
2. Fix any blockers flagged by the review
3. `/[scaffold-skill]` — scaffold the project
4. Use `/[backend-agent]` for all backend work
```

---

## Notes

- If SPEC.md is missing, stop and tell the user to write one first
- If the spec describes something with no matching module, note it clearly as custom work — do not skip it
- Config blocks in AGENTS.md should be filled in with real choices, not placeholder text
- Plan files are for humans — write them in plain English, not bullet soup
- Do not start writing code — this skill produces planning artefacts only
