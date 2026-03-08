---
description: Review and validate plans before development begins
agent: build
---
# Review and sign off plans before development

## When to use
Run after `/bootstrap-from-spec` (or after manually writing plan files) to validate that plans are complete, properly scoped, and ready for implementation. This is a quality gate — development should not begin until this skill passes.

---

## Checklist

### Step 1 — Load project context

Read the following files:
- `AGENTS.md` (or `CLAUDE.md`) — project stack, modules, custom features, agents, conventions
- `SPEC.md` — original product requirements
- All `plan/phase-*.md` files
- All `plan/test-plan-phase-*.md` files

Record:
- Number of phases
- Total task count
- Total test case count
- Declared composition and modules
- List of custom features

### Step 2 — Validate AGENTS.md (or CLAUDE.md) completeness

| Check | Pass criteria |
|-------|--------------|
| Stack declared | Backend, frontend, database, queue, storage all specified with versions |
| Modules listed | Every module has a config block with real values (not placeholders) |
| Custom features specced | Every custom feature has: database tables, API endpoints, service classes, key patterns, test checklist |
| **Architecture map present** | `## Architecture Map` section exists with: Frontend Routes, Page → Component Tree, Service → Page Mapping, Endpoint → Consumer, Context Providers |
| **Architecture decisions present** | `## Architecture Decisions` section exists with: Application Structure (deployment model, module boundaries, dependency direction), Backend Patterns (service layer, data access, error handling, validation, events, API response format), Frontend Patterns (state management, component structure, API client, form handling, error boundaries), Cross-Cutting (auth flow, multi-tenancy, file uploads, caching, pagination) — no decisions left as "TBD" |
| Agents assigned | Backend, frontend, database, security agents listed |
| Skills listed | Scaffold skill and relevant domain skills identified |
| Guides listed | At least 3 relevant guides referenced |
| Conventions documented | API base path, auth strategy, multi-tenancy strategy, environment setup |
| Out of scope defined | Clear boundary of what is NOT in v1 |

**Fail if:** Any custom feature has only a name and one-liner description without schema/API/services spec.

### Step 3 — Validate composition alignment

If a composition is declared (e.g., "Primary: SaaS"):
1. Read the composition file from `~/.claude/modules/compositions/`
2. Check every **Core Module (Required)** is either:
   - Present in AGENTS.md (or CLAUDE.md) modules list, OR
   - Explicitly excluded with documented rationale

**Fail if:** A required composition module is missing without justification.

### Step 4 — Validate phase structure

For each `plan/phase-*.md`:

| Check | Pass criteria |
|-------|--------------|
| Overview exists | Phase has a clear description of what it delivers |
| Modules listed | Each module in the phase is identified |
| Custom features identified | Any custom work in the phase is called out |
| API endpoints listed | New/changed endpoints documented |
| Database changes listed | New tables and columns documented |
| Tasks section exists | `## Tasks` with `TASK-{N}.{seq}` format |
| Test plan exists | Corresponding `test-plan-phase-{N}.md` file present |

**Fail if:** A phase file is missing a Tasks section or has no corresponding test plan.

### Step 5 — Validate task granularity

Scan every task across all phase files and check:

**Module tasks:**
- [ ] No single task covers an entire module ("Implement auth module" = FAIL)
- [ ] Each module is broken into at minimum: schema/migrations, backend services+routes, tests, frontend UI (if applicable), **integration/wiring**
- [ ] Test-writing tasks are explicit and separate from implementation tasks
- [ ] **Wiring task exists** for any module with both backend and frontend work — verifies services are imported by pages, components are rendered, endpoints are called by frontend, providers wrap consumers

**Custom feature tasks:**
- [ ] No single task covers an entire custom feature ("Build timeline editor" = FAIL)
- [ ] Each service class has its own task or is grouped with closely related services
- [ ] Schema, backend, tests, and frontend are separate tasks
- [ ] **Wiring task exists** — explicitly verifies all services are imported, all components are rendered in pages, all endpoints have frontend callers, all init methods are invoked
- [ ] Complex custom features (3+ services, pipeline, or spanning backend+frontend) use sub-phases (e.g., `phase-3a`, `phase-3b`)

**General:**
- [ ] Every task has an agent hint (`→ /agent-name`)
- [ ] Tasks that need testing have test case links (`[TC-X.Y]`)
- [ ] No task would take more than ~1 hour to implement (if it would, it needs splitting)
- [ ] Task descriptions are specific enough to implement without guessing

**Flag as:**
- **FAIL** — task covers an entire module or custom feature in one line
- **WARN** — task is missing agent hint or test case link
- **PASS** — task is properly scoped and described

### Step 6 — Validate mandatory Phase 1 infrastructure

Phase 1 must include tasks for ALL of these:

- [ ] Docker + docker-compose with health checks
- [ ] `ctl.sh` with standard commands
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Structured logging configuration
- [ ] Error tracking (Sentry or equivalent)
- [ ] Health endpoint (`GET /api/health`)
- [ ] Pre-commit credential guard hook (`.githooks/pre-commit`)
- [ ] `.env.example` with all required vars

**Fail if:** Any of these are missing from Phase 1 tasks.

### Step 7 — Validate test plans

For each `test-plan-phase-*.md`:

| Check | Pass criteria |
|-------|--------------|
| Prerequisites listed | Setup steps documented |
| Test cases exist | At least one TC per module/custom feature in the phase |
| TC format correct | Each has Steps, Expected, Status fields |
| Edge cases included | Not just happy paths — error states, validation failures, auth failures |
| TC IDs match task links | Every `[TC-X.Y]` referenced in tasks has a matching test case |
| **UI integration tests present** | If the phase touches ANY frontend files, the test plan MUST include UI integration test cases (see Step 7b) |

**Fail if:** A phase has no test plan or test plan has no test cases.

### Step 7b — Validate UI integration test coverage (CRITICAL)

This is the most commonly violated requirement. For every phase that creates or modifies frontend pages/components, verify the test plan includes ALL of these UI integration categories:

| # | Required Category | What it verifies | FAIL if missing? |
|---|-------------------|-----------------|------------------|
| 1 | **Page render** | Every new page/route loads without blank screen or console errors | YES |
| 2 | **CRUD flows through UI** | Create/read/update/delete done by clicking buttons and filling forms in the browser | YES |
| 3 | **API client headers** | Frontend automatically sends auth token + workspace/tenant ID on all requests | YES |
| 4 | **Navigation** | Links and redirects work between related pages | YES |
| 5 | **Error states** | Validation errors, 404s, network failures show user-facing messages | YES |
| 6 | **Provider/context wiring** | Components render correctly within their real page context (e.g., Canvas, React Flow, DnD providers) | YES (if applicable) |

**How to check:**
1. Read the phase plan's "Files to Create/Modify" section for any `frontend/` files
2. If frontend files exist, scan the test plan for test cases that explicitly test **through the browser UI**
3. A test case that uses `curl`, `fetch()`, HTTP client, or `browser_evaluate` with direct API calls **does NOT count** as a UI integration test
4. A test case marked "PASS (API-level)" or "PASS (code verification)" **does NOT count** — it must be tested through actual browser interaction

**Red flags that indicate API-only testing (FAIL the plan if found):**
- Test steps say "POST /api/v1/..." or "GET /api/v1/..." without mentioning clicking buttons or filling forms
- Test results say "PASS (API-level)" or "verified through code review"
- Test cases marked "NOT TESTED — requires browser testing" (these should be tested, not deferred)
- Test cases that claim PASS but describe `curl` or HTTP status codes without browser interaction
- Any language suggesting UI testing is "manual" or "deferred" — Playwright MCP is the tool for this

**FAIL if:** Any phase with frontend work is missing UI integration test cases, or test cases exist but are written as API-level tests instead of browser-based tests.

### Step 8 — Validate dependency ordering

Check that phases are ordered correctly:
- [ ] Foundation modules (auth, tenancy, permissions) come before feature modules
- [ ] Data-producing modules come before data-consuming modules (e.g., media before presentations, presentations before engagement tracking)
- [ ] No phase references features from a later phase
- [ ] Billing is not deferred past Phase 2 for SaaS products (unless explicitly excluded)

**Warn if:** Dependencies look misordered.

### Step 9 — Produce the review report

Output a structured report:

```markdown
# Plan Review: {project name}

## Verdict: READY / NOT READY

## Summary
- Phases: {N}
- Tasks: {N} ({N} backend, {N} frontend, {N} test, {N} infra)
- Test cases: {N}
- Modules: {N}
- Custom features: {N}

## Checks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| 1 | AGENTS.md completeness | PASS/FAIL | {details} |
| 2 | Composition alignment | PASS/FAIL/N/A | {details} |
| 3 | Phase structure | PASS/FAIL | {details} |
| 4 | Task granularity | PASS/WARN/FAIL | {details} |
| 5 | Phase 1 infrastructure | PASS/FAIL | {details} |
| 6 | Test plans | PASS/FAIL | {details} |
| 7 | Dependency ordering | PASS/WARN | {details} |
| 8 | Architecture decisions | PASS/FAIL | {details} |

## Issues to Fix Before Starting

### Blockers (must fix)
- [ ] {issue} — {which file} — {what to do}

### Warnings (should fix)
- [ ] {issue} — {which file} — {what to do}

## Tasks That Need Splitting
| Task | Current | Should be |
|------|---------|-----------|
| `TASK-X.Y` {description} | 1 coarse task | Split into N tasks: {list} |

## Custom Features Needing More Detail
| Feature | Missing |
|---------|---------|
| {name} | {what's missing: schema/API/services/tests} |

## Ready to Start
Once all blockers are resolved:
1. Run `/{scaffold-skill}` to scaffold the project
2. Begin with Phase 1 tasks
3. Use `/{backend-agent}` for backend work
```

### Step 10 — Fix or escalate

**If READY:**
- Confirm to the user that plans are approved for development
- Recommend which scaffold skill to run first

**If NOT READY:**
- List every blocker clearly
- Offer to fix the issues now (update AGENTS.md, split tasks, add missing specs)
- Do NOT start development until all blockers are resolved
- Re-run this skill after fixes to confirm

---

## Verdict Criteria

| Verdict | Criteria |
|---------|----------|
| **READY** | All checks PASS, no blockers, warnings are minor |
| **NOT READY** | Any check is FAIL, or 3+ warnings in the same area |

## Notes

- This skill reads plans only — it does not create or modify code
- It may update plan files and AGENTS.md (or CLAUDE.md) to fix issues (with user approval)
- Run this after `/bootstrap-from-spec` and before any scaffold skill
- If the project was planned manually (no bootstrap), this skill catches the same gaps
- After fixing issues, re-run this skill to confirm READY status
