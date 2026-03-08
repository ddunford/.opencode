---
description: Audit existing project against standards with prioritised recommendations
agent: build
---
# Audit existing project against standards

## When to use
Run on any existing project to identify gaps, missing modules, convention violations, and improvement opportunities. Produces a prioritised report with actionable recommendations.

---

## Checklist

### Step 1 — Detect the tech stack
Scan the project root for framework indicators:

| File/Pattern | Stack |
|---|---|
| `composer.json` + `artisan` | Laravel |
| `pyproject.toml` + `fastapi` in deps | FastAPI |
| `package.json` + `@nestjs/core` | NestJS |
| `package.json` + `react` + `vite` | React + Vite |
| `package.json` + `next` | Next.js |
| `package.json` + `expo` or `react-native` | React Native |
| `pubspec.yaml` + `flutter` | Flutter |

Record: backend framework, frontend framework, mobile framework (if any), database, queue driver, storage driver.

### Step 2 — Check project scaffolding
For the detected stack, verify these exist and are correct:

| Item | Check | Fix |
|---|---|---|
| `AGENTS.md` (or `CLAUDE.md`) | Exists at project root with stack, modules, agents, conventions | Create using bootstrap-from-spec template |
| `ctl.sh` | Exists, executable, has standard commands (up, down, logs, shell, migrate) | Create from ctl.sh template in AGENTS.md |
| `docker-compose.yml` | Exists with health checks, named networks, proper targets | Add missing health checks |
| `.env.example` | Exists with all required vars (no real secrets) | Create from .env, redacting values |
| `.githooks/pre-commit` | Credential guard hook exists and is configured | Create from AGENTS.md template |
| `plan/` directory | Phase files exist if project is non-trivial | Note as optional |

### Step 3 — Map features to modules
Read the project's code to identify implemented features, then map each to the module system:

1. Scan routes/controllers/routers for feature domains (auth, billing, notifications, etc.)
2. For each identified feature, check if there's a matching module in `~/.claude/modules/`
3. Classify each as:
   - **Aligned** — feature exists and follows the module's patterns
   - **Divergent** — feature exists but doesn't follow module patterns (custom implementation)
   - **Missing** — module would add value but isn't implemented
   - **Not needed** — module exists but this project doesn't need it

Produce a table:

```
| Feature | Module | Status | Notes |
|---------|--------|--------|-------|
| Authentication | auth | Aligned | Uses Sanctum as specified |
| Billing | billing | Divergent | Custom Stripe integration, not following module patterns |
| File uploads | file-storage | Missing | Using direct S3 calls, no service layer |
| Notifications | notifications | Not needed | No user-facing notifications in scope |
```

### Step 3b — Audit custom feature specs

Check the project AGENTS.md (or CLAUDE.md) for any features listed under "Custom Build" or similar. For each custom feature, verify it has a proper spec:

**Required for each custom feature:**
- [ ] Database tables defined (table names, key columns)
- [ ] API endpoints listed (method, path, description)
- [ ] Service classes named with responsibilities
- [ ] Key patterns or architectural decisions documented
- [ ] Test checklist with critical scenarios

**Flag as Critical if:**
- Custom features have only a name and one-line description (no schema, no API, no services)
- Custom features are the core product differentiator but have less detail than module-backed features
- Plan tasks for custom features are single coarse items like "Implement X" without breakdown

**Flag as Improvement if:**
- Custom feature specs exist but are missing one or two sections (e.g., has schema but no test checklist)

### Step 3c — Validate composition requirements

If the project AGENTS.md (or CLAUDE.md) declares a composition (e.g., "Primary: SaaS"), read the corresponding composition file from `~/.claude/modules/compositions/` and check that all **Core Modules (Required)** are present in the project.

Flag as Critical if a required module is missing without documented justification.

### Step 3d — Check task granularity

Scan plan files for task granularity issues:

- [ ] No single task covers an entire module implementation (should be split into schema, services, tests, UI)
- [ ] No single task covers an entire custom feature (should be split into multiple focused tasks)
- [ ] Test-writing tasks exist explicitly (not bundled into implementation tasks)
- [ ] Frontend tasks are separate from backend tasks

Flag as Improvement if tasks are too coarse-grained.

### Step 3e — Check mandatory Phase 1 infrastructure

Verify Phase 1 includes all mandatory infrastructure:

- [ ] Docker + ctl.sh
- [ ] CI/CD pipeline (GitHub Actions or similar)
- [ ] Structured logging
- [ ] Error tracking (Sentry or equivalent)
- [ ] Health endpoint
- [ ] Pre-commit credential guard hook

Flag as Critical if any are missing from Phase 1.

### Step 4 — Check code conventions
For the detected backend framework, verify:

**Laravel:**
- [ ] Controllers are thin (< 30 lines per method)
- [ ] Business logic in Service classes, not controllers
- [ ] Form Requests for validation (not inline `$request->validate()`)
- [ ] API Resources for response transformation
- [ ] Proper use of Eloquent scopes and relationships
- [ ] Queue jobs are idempotent
- [ ] Tests exist (Pest preferred) with factories

**FastAPI:**
- [ ] Route handlers are thin — business logic in service classes
- [ ] Pydantic v2 models for request/response validation
- [ ] SQLAlchemy 2.0 async with `mapped_column` syntax
- [ ] Dependency injection via `Depends()`
- [ ] Alembic migrations present
- [ ] pytest + httpx AsyncClient for testing

**NestJS:**
- [ ] Controllers are thin — logic in injectable services
- [ ] class-validator DTOs for all inputs
- [ ] Prisma or TypeORM migrations present
- [ ] Guards on protected routes
- [ ] Jest tests with @nestjs/testing

**React / Next.js:**
- [ ] TypeScript strict mode enabled
- [ ] Components under 200 lines
- [ ] API client in a services layer (not fetch in components)
- [ ] Error boundaries and loading states
- [ ] Proper use of hooks (no business logic in useEffect)

**React Native:**
- [ ] expo-secure-store for tokens (not AsyncStorage)
- [ ] TanStack Query for server state
- [ ] Platform-specific handling where needed

### Step 5 — Check infrastructure patterns
- [ ] Docker multi-stage build (dev + prod targets)
- [ ] Health checks on all services in docker-compose
- [ ] Traefik labels follow the documented pattern (if applicable)
- [ ] Environment variables follow the `.env` / `.env.example` convention
- [ ] No secrets committed to git (scan for API keys, passwords, tokens in code)
- [ ] CI/CD pipeline exists (GitHub Actions or similar)

### Step 6 — Check testing coverage
- [ ] Unit tests exist for core services/business logic
- [ ] Integration/feature tests exist for critical API flows
- [ ] Test factories/fixtures exist for data creation
- [ ] Tests are isolated (no shared mutable state)
- [ ] Tests can run in CI without external dependencies

### Step 7 — Check observability
- [ ] Structured logging (not plain text echo/print)
- [ ] Error tracking configured (Sentry or similar)
- [ ] Health endpoint exists (`/api/health` or similar)
- [ ] Queue monitoring configured (Horizon, Bull Board, Flower)

### Step 8 — Produce the audit report

Output a structured report:

```markdown
# Project Audit: {project name}

## Stack
- Backend: {framework} {version}
- Frontend: {framework} {version}
- Database: {engine}
- Queue: {driver}
- Storage: {driver}

## Score: {X}/10

## Critical Issues (fix now)
- [ ] {issue} — {impact} — {fix}

## Improvements (plan for next sprint)
- [ ] {issue} — {impact} — {fix}

## Module Alignment
| Feature | Module | Status | Effort to align |
|---------|--------|--------|-----------------|

## Convention Compliance
| Convention | Status | Notes |
|------------|--------|-------|

## Recommended Next Steps
1. {highest priority action}
2. {second priority}
3. ...

## Agents to use
- Backend: `/agent-name`
- Frontend: `/agent-name`
```

### Step 9 — Generate remediation plan

If the project has a `plan/` directory, create new phase files for audit remediation. If no `plan/` directory exists, create it.

**Phase grouping:** Group findings into phases by priority:

| Phase | Contents | Priority |
|-------|----------|----------|
| `plan/phase-R1-critical-fixes.md` | Critical issues (security, secrets, broken infra) | Fix immediately |
| `plan/phase-R2-convention-alignment.md` | Divergent code conventions, missing patterns | Next sprint |
| `plan/phase-R3-module-alignment.md` | Divergent or missing modules to realign/add | Planned work |
| `plan/phase-R4-quality-improvements.md` | Testing gaps, observability, documentation | Backlog |

**Rules:**
- Use `R` prefix to distinguish remediation phases from feature phases (`R1`, `R2`, etc.)
- Skip empty phases — only create files for phases that have findings
- Each phase file uses the standard `## Tasks` format with `TASK-R{N}.{seq}` IDs
- Include agent hints (`→ /agent-name`) and effort estimates per task
- If `plan/phase-*.md` files already exist, do NOT overwrite them — only add new `phase-R*` files
- Link back to AUDIT.md for context

**Phase file template:**

```markdown
# Phase R{N}: {Title}

## Overview
Remediation tasks from project audit. See `AUDIT.md` for full findings.

## Tasks

- [ ] `TASK-R{N}.1` {description} → /agent-name (effort: low/medium/high)
- [ ] `TASK-R{N}.2` {description} → /agent-name (effort: low/medium/high)
```

**After generating:** The UserPromptSubmit hook will automatically pick up the new tasks and start reminding about them. Ask "work through the plan" to begin remediation.

---

## Scoring Guide

| Score | Meaning |
|-------|---------|
| 9-10 | Fully aligned with module system, all conventions followed |
| 7-8 | Good shape, minor gaps in testing or conventions |
| 5-6 | Functional but divergent from standards in several areas |
| 3-4 | Significant technical debt, missing key infrastructure |
| 1-2 | Major rework needed, no conventions followed |

## Notes

- Steps 1–8 produce the audit report (`AUDIT.md`) — no code is modified
- Step 9 generates remediation plan files (`plan/phase-R*.md`) with trackable tasks
- For each "Divergent" module, note the effort to realign (low/medium/high)
- Prioritise security issues (secrets in code, missing auth) as Critical
- If the project already has plan files with `TASK-X.Y` IDs, remediation phases are additive (never overwrite)
- Use `/backfill-plan-tasks` if existing plan files need converting to the trackable format first
- Use the appropriate agent for each remediation task (agent hints are included per task)
