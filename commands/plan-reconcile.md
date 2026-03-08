---
description: Reconcile implementation against spec and plans to find gaps
agent: build
---
# Reconcile implementation against spec and plans

## When to use

Run after one or more phases have been implemented to verify the code actually delivers what was originally asked for. This skill compares three layers:

1. **SPEC.md** (or original requirements) — what the user asked for
2. **plan/phase-*.md** — what was planned
3. **Actual code** — what was built

It finds gaps at every level, updates plan files with missing/incomplete tasks, updates test plans with new test cases, and leaves everything ready for `/team-execute` to pick up the work.

Use when:
- A phase was marked complete but features feel incomplete or untested
- You suspect the implementation drifted from the spec
- Before a release to verify all requirements are met
- After a `/test-audit` reveals widespread failures or gaps
- The user says "compare code to the plan" or "check what's missing"

**This skill modifies plan files.** It resets falsely completed tasks, adds new tasks, and adds test cases.

---

## MANDATORY RULES — read before starting

1. **Every step that says "spawn Explore agent" MUST spawn a real Explore sub-agent.** Do not substitute a quick grep, a file read, or your own memory. The whole point is a fresh ground-up exploration — not re-checking known issues.
2. **Step 1b requires 5 separate Explore agents.** Not 1 agent with 5 questions. Not "I'll just check the key files." Five dedicated agents, each with their own prompt. If you launched fewer than 5, you skipped part of the procedure.
3. **Step 3 requires 3 agents per phase (backend + frontend + wiring).** Each agent explores independently. The wiring agent MUST use the Architecture Map as its checklist — verifying every row, not a sample.
4. **Do NOT re-verify known issues from a previous reconcile.** Each run is a fresh exploration. You are looking for NEW gaps that nobody has checked before.
5. **Do NOT proceed from Step 1b to Step 2 until you have a written Architecture Map with all 5 sections.** If a section is empty, that's a finding — but the section must exist.
6. **Do NOT proceed from Step 3 to Step 4 until every agent has returned results.** If an agent finds zero issues, great — log "clean" and move on. But waiting for all agents is mandatory.

**How to tell if you're cutting corners:**
- You're summarizing findings without spawning agents → STOP, spawn the agents
- You're checking 3-4 items from the architecture map instead of every row → STOP, check every row
- You're re-reading a previous reconcile report instead of exploring fresh → STOP, explore the code
- Your wiring check has fewer findings than services × pages connections to verify → you probably skipped connections

---

## Procedure

### Step 1 — Load the three sources of truth

Read all of these:

| Source | Files | Purpose |
|--------|-------|---------|
| **Requirements** | `SPEC.md`, `AGENTS.md` (or `CLAUDE.md`) (custom features section), `README.md` | What was originally asked for |
| **Architecture map** | `AGENTS.md` (or `CLAUDE.md`) (`## Architecture Map` section) | How it's supposed to be wired together |
| **Plans** | `plan/phase-*.md` | What was planned to deliver it |
| **Test plans** | `plan/test-plan-phase-*.md` | What was supposed to be verified |

Record for each phase:
- Phase number, name, status (complete/in-progress/not-started)
- Total tasks, completed tasks
- Total test cases, passed/failed/untested

**If the Architecture Map section is missing from AGENTS.md (or CLAUDE.md)**, you must build one before proceeding — see Step 1b. The architecture map is essential for reconciliation — without it, you can only compare against scattered endpoint/service declarations and will miss wiring gaps.

### Step 1b — Build architecture map from existing code (if missing or stale)

If AGENTS.md (or CLAUDE.md) has no `## Architecture Map` section, or this is a re-run and the map may be outdated, build a fresh one by exploring the actual codebase. Do NOT skip this or defer it — the rest of the reconciliation depends on having an accurate wiring map.

**Spawn ALL 5 of these Explore agents (in parallel where possible).** Each agent must explore the codebase independently — do not combine them or substitute your own knowledge:

**1. Frontend Routes (spawn Explore agent):**
```
Find the router configuration (e.g., React Router routes, Next.js pages/, etc.).
For every route/URL defined:
- What page component does it render?
- Is auth required (wrapped in auth guard/protected route)?
- What frontend services does the page component import?
List as: URL | Page Component | Auth Required | Services Imported
```

**2. Page → Component Tree (spawn Explore agent):**
```
For every page component found in the routes:
- Read the file and list every child component it renders (imports + JSX usage)
- For each child component, check what IT renders (one level deep)
- Flag any component files that exist in the components/ directory but are NOT imported by any page
Build an ASCII tree for each page showing the component hierarchy.
```

**3. Frontend Service → Page Mapping (spawn Explore agent):**
```
Find all frontend service files (e.g., src/services/*.ts, src/services/*.js).
For each service:
- Search the entire frontend codebase for import statements that reference this service
- List every page/component that imports it
- If NO file imports the service, mark it as UNWIRED
Report as: Service Name | File Path | Imported By (list of consumers) | Status (wired/unwired)
```

**4. Backend Endpoint → Frontend Consumer (spawn Explore agent):**
```
Find all registered API routes (e.g., routes/api.php, route decorators, etc.).
For each endpoint (method + path):
- Search the frontend codebase for the URL path string (e.g., "/api/v1/projects", "/projects")
- Check API client files, service files, and hook files for fetch/axios calls to this path
- If NO frontend code calls the endpoint, mark it as UNCONSUMED
Report as: Method | Path | Controller | Frontend Consumer (file + function) | Status (consumed/unconsumed)
```

**5. Context Providers (spawn Explore agent):**
```
Find all React context providers (createContext, Provider components).
For each provider:
- Where is it placed in the component tree? (which layout or page wraps with it?)
- Which components call useContext() or the custom hook for this context?
- Are any consumers rendered OUTSIDE the provider's tree? (would cause runtime error)
Report as: Provider | Wraps (parent component) | Consumers (list) | Wiring Issues
```

After collecting all results, write the `## Architecture Map` section into AGENTS.md (or CLAUDE.md) using the template from `/bootstrap-from-spec` Step 7b. Mark any issues found during map construction (unwired services, unconsumed endpoints, orphaned components) — these feed directly into Step 3's wiring check.

**Important:** Building the map from code reveals the ACTUAL wiring, not the INTENDED wiring. Compare the map against SPEC.md and plan files to identify what's missing vs what was never planned.

---

**STOP-GATE 1:** Before proceeding, confirm you have ALL of these outputs from Step 1b:
- [ ] Frontend Routes table (count: ___ routes found)
- [ ] Page → Component Tree (count: ___ pages mapped)
- [ ] Frontend Service → Page Mapping (count: ___ services found, ___ unwired)
- [ ] Backend Endpoint → Frontend Consumer (count: ___ endpoints found, ___ unconsumed)
- [ ] Context Providers (count: ___ providers found, ___ wiring issues)

If any section is blank or was not explored, go back and spawn the missing agent. Do NOT proceed with an incomplete map.

---

### Step 2 — Build the requirements checklist

From SPEC.md, AGENTS.md (or CLAUDE.md), and the Architecture Map, extract every concrete deliverable:

**From the Architecture Map (highest priority — catches wiring gaps):**
- Frontend Routes table → check each URL has a matching page component file AND router entry
- Page → Component Tree → check each component is imported and rendered by its parent page
- Frontend Service → Page Mapping → check each service file exists AND is imported by the listed page(s)
- Backend Endpoint → Frontend Consumer → check each endpoint has a route AND is called by the listed frontend consumer
- Shared State & Context Providers → check each provider wraps the components listed as dependants

**For each custom feature in AGENTS.md (or CLAUDE.md), extract:**
- Database tables declared → check they exist in migrations
- API endpoints declared → check routes exist and controllers are wired
- Service classes declared → check they exist and contain real logic (not stubs)
- Frontend services declared → check they exist and are imported/used in pages
- Test checklist items → check they have corresponding test cases

**For each module in AGENTS.md (or CLAUDE.md), extract:**
- Module config block → check the module is actually installed/configured
- Expected routes/controllers → check they exist per the impl file pattern

**From SPEC.md (if it exists), extract:**
- User stories / feature descriptions → map to plan tasks
- Acceptance criteria → map to test cases
- UI screens described → check pages/components exist

Build a master checklist:
```
## Requirements Checklist

### Custom: Order Management
- [x] DB: users table exists (migration 2024_xxx)
- [x] DB: orders table exists (migration 2024_xxx)
- [x] DB: products table exists (migration 2024_xxx)
- [x] API: POST /api/v1/orders → OrderController@store
- [x] API: GET /api/v1/orders → OrderController@index
- [ ] API: POST /api/v1/orders/{id}/refund → NOT FOUND (no route)
- [x] Service: OrderService exists with real logic
- [ ] Service: RefundService — exists but process() method is a stub (TODO comment)
- [ ] Frontend: CartService — file exists but not imported in any page
- [ ] Frontend: ShippingService — file does not exist
```

### Step 3 — Compare code against plans (per phase)

For each completed or in-progress phase, use sub-agents to explore the actual codebase:

**Backend check (spawn Explore agent):**
```
For phase {N}, check:
1. Every migration listed in the plan exists and has the correct columns
2. Every API route listed in the plan exists in routes/api.php (or equivalent)
3. Every controller method exists and contains real logic (not just "// TODO")
4. Every service class exists and its key methods are implemented (not stubs)
5. Every job/event/listener listed exists
6. Report: which items exist and work, which are missing, which are stubs
```

**Frontend check (spawn Explore agent):**
```
For phase {N}, check:
1. Every page/component listed in the plan exists as a file
2. Every page is actually routed (check router config for the URL)
3. Every frontend service listed exists and is imported by at least one component
4. Components use Playwright-testable patterns (data-testid attributes, semantic HTML)
5. Check for dead imports, stub components (just return <div>TODO</div>), empty files
6. Report: which items exist and work, which are missing, which are stubs
```

**Wiring check (spawn Explore agent — CRITICAL):**

This is the most commonly missed check. Code can exist in all the right files but still not work because nothing connects it together. Use the Architecture Map (from Step 1 or Step 1b) as the reference and verify every connection in the actual code.

```
Using the Architecture Map as reference, check these wiring connections for phase {N}:

1. SERVICE → PAGE IMPORTS: For every frontend service listed in the map's "Service → Page Mapping":
   - Open the page component file that should consume it
   - Verify the service is actually imported (import statement exists)
   - Verify the service is actually CALLED (not just imported — look for method calls)
   - If imported but never called, that's UNWIRED

2. COMPONENT → PAGE RENDERS: For every component in the map's "Page → Component Tree":
   - Open the parent page component
   - Verify the child component is imported AND rendered in JSX
   - If the component file exists but the page doesn't render it, that's UNWIRED
   - Check that required props are passed (not just <Component /> with no props)

3. ENDPOINT → FRONTEND CALLS: For every API endpoint in the map's "Endpoint → Consumer":
   - Search frontend service files for the URL path
   - Verify the HTTP method matches (GET vs POST vs PUT)
   - If no frontend code calls this endpoint, that's UNCONSUMED

4. PROVIDER → CONSUMER WRAPPING: For every context provider in the map:
   - Verify the provider wraps the components that need it
   - Check that consumers are rendered INSIDE the provider tree, not outside
   - Missing provider wrapping causes blank screens with no obvious error

5. BACKEND ROUTE → CONTROLLER: For every planned API endpoint:
   - Verify the route is registered (not just that the controller method exists)
   - A controller method without a route registration is unreachable

6. INITIALIZATION CALLS: For services that need initialization (e.g., WebSocket, third-party SDK, hardware API):
   - Verify initialize() or connect() is actually called somewhere (usually in useEffect or page mount)
   - A service class with an init method that nothing calls is dead code

Report each finding as:
- WIRED: {source} → {target} — connection verified in code
- UNWIRED: {source} → {target} — {source} exists but {target} doesn't import/call/render it
- UNCONSUMED: {endpoint} has no frontend caller
- UNREGISTERED: {controller method} has no route pointing to it
- UNINITIALISED: {service}.initialize() is never called
```

**Why this check matters:** In practice, projects commonly end up with 10-20+ services that exist as files but are never imported by any page, components that exist but are never rendered, and API endpoints with controller methods but no route registration. All of these pass the basic "does the file exist?" check but the app doesn't actually work. The wiring check catches exactly these gaps.

### Step 3b — Architecture pattern check (spawn Explore agent)

This check verifies the code follows the architecture decisions declared in AGENTS.md (or CLAUDE.md) (`## Architecture Decisions` section). Code that works but violates the declared architecture creates inconsistency that compounds across phases.

**If AGENTS.md (or CLAUDE.md) has no `## Architecture Decisions` section**, flag this as a finding and build one from the actual code patterns (similar to building the architecture map in Step 1b). The decisions section should be written before proceeding.

```
Read the Architecture Decisions section from AGENTS.md (or CLAUDE.md). Then explore the codebase and check:

BACKEND PATTERNS:
1. Service layer consistency:
   - Are ALL services following the same pattern? (e.g., all using repository pattern, or all using direct ORM?)
   - Flag any service that uses a different data access pattern than declared (e.g., project says "repository pattern" but OrderService calls Eloquent directly)
   - Flag services with mixed responsibilities (a service that does validation AND orchestration AND data access)

2. API response consistency:
   - Do ALL endpoints return the declared response format? (e.g., envelope {data, meta, errors})
   - Flag endpoints returning raw data when envelope is declared
   - Flag inconsistent error formats (some return {message}, others {error}, others {errors[]})

3. Validation consistency:
   - Is validation happening at the declared location? (e.g., form requests at boundary)
   - Flag services that do their own input validation when it should be at the boundary
   - Flag endpoints that accept unvalidated input when validation classes exist

4. Event/side-effect patterns:
   - If domain events are declared, are cross-module side effects using them?
   - Flag direct calls between modules that should go through events (e.g., OrderService directly calling NotificationService instead of dispatching OrderPlaced event)

FRONTEND PATTERNS:
5. State management consistency:
   - Is state managed with the declared tool? (e.g., React Query for server state)
   - Flag components using local useState for data that should be in the declared store
   - Flag mixed state patterns (some features use Redux, others use Zustand, others use context)

6. Component structure consistency:
   - Are components organized per the declared pattern? (e.g., feature-based)
   - Flag components in wrong directories (a feature component in shared/components)
   - Flag pages that are doing data fetching directly instead of through the declared pattern (hooks/services)

7. API client consistency:
   - Are ALL API calls going through the declared client pattern? (e.g., service classes)
   - Flag components making direct fetch/axios calls when service classes are declared
   - Flag duplicate API call implementations (same endpoint called differently in two places)

8. Error handling consistency:
   - Are error boundaries placed per the declared strategy?
   - Flag pages without error boundaries when per-page is declared
   - Flag inconsistent error display patterns (some use toast, some use inline, some swallow errors)

CROSS-CUTTING:
9. Auth token flow:
   - Is the declared token strategy implemented consistently? (e.g., JWT in header)
   - Flag any endpoint or page that handles auth differently

10. Multi-tenancy:
    - If row-level isolation is declared, do ALL queries filter by tenant_id?
    - Flag any query or service method that could leak data across tenants

Report each finding as:
- CONSISTENT: {pattern} — all {N} instances follow the declared approach
- INCONSISTENT: {pattern} — {N} of {M} instances deviate. Deviations: {list with file:line}
- UNDECLARED: {pattern observed in code but not documented in Architecture Decisions}
- MISSING: {pattern declared but not implemented anywhere}
```

**Classify architecture findings using these new classifications:**

| Classification | Meaning | Action |
|---------------|---------|--------|
| **INCONSISTENT** | Code works but doesn't follow the declared pattern — some services use repos, others don't | Add refactor task to plan |
| **UNDECLARED** | A pattern is used in code but never documented — works but creates confusion | Add the pattern to Architecture Decisions in AGENTS.md (or CLAUDE.md) |
| **ARCH-MISSING** | A declared pattern has no implementation anywhere — e.g., "we use domain events" but no events exist | Add implementation task or remove the declaration |

**Architecture findings go in a separate report section** (see Step 7) and generate refactor tasks, not implementation tasks. Mark them with lower priority than MISSING/STUB/UNWIRED findings — a working app with inconsistent patterns is better than a broken app with perfect architecture.

---

**STOP-GATE 2:** Before proceeding, confirm you spawned ALL of these agents for EACH completed/in-progress phase:
- [ ] Backend check agent (phase ___): returned ___ findings
- [ ] Frontend check agent (phase ___): returned ___ findings
- [ ] Wiring check agent (phase ___): returned ___ findings (checked ___ connections from architecture map)
- [ ] Architecture pattern check agent: returned ___ consistency findings

If any phase is missing an agent, or the wiring check verified fewer connections than exist in the architecture map, go back. The wiring agent must check EVERY row in every architecture map table, not a sample.

---

### Step 4 — Classify findings

For each gap found, classify it:

| Classification | Meaning | Action |
|---------------|---------|--------|
| **MISSING** | Planned item does not exist in code at all | Add new task to plan |
| **STUB** | File/method exists but contains placeholder code (TODO, empty body, hardcoded return) | Reset task to incomplete, add detail |
| **PARTIAL** | Partially implemented — some methods work, others don't | Reset task to incomplete, add detail about what's missing |
| **UNWIRED** | Code exists but is not connected — service not imported by any page, component not rendered, route not registered | Add wiring task to plan |
| **UNCONSUMED** | Backend endpoint exists (route + controller) but no frontend code calls it | Add frontend integration task to plan |
| **UNINITIALISED** | Service class exists and is imported but its init/connect/setup method is never called | Add initialization task to plan |
| **UNPROPPED** | Component is rendered but receives no props or empty props — state changes are lost | Add prop-wiring task to plan |
| **DRIFT** | Implementation differs from spec (different field names, different behaviour, missing validation) | Add correction task to plan |
| **EXTRA** | Code exists that wasn't in the plan (may be fine, or may indicate scope creep) | Log in report only — no plan change |

**Wiring classifications explained:**

The UNWIRED/UNCONSUMED/UNINITIALISED/UNPROPPED group is the most common source of "it looks done but doesn't work" bugs. These pass basic file-existence checks but fail in the browser:

- **UNWIRED:** `PaymentService.ts` exists with full implementation, but `CheckoutPage.tsx` never imports it → checkout page renders but can't process payments
- **UNCONSUMED:** `POST /api/v1/orders/{id}/refund` has a route and controller, but no frontend button or service calls it → feature is unreachable by users
- **UNINITIALISED:** `WebSocketService` is imported by the dashboard page, but `WebSocketService.connect()` is never called in any `useEffect` → realtime updates are silently dead
- **UNPROPPED:** `<FilterPanel />` is rendered in the list page but receives no props → filter selections aren't connected to the query, changes are ignored

### Step 5 — Update plan files

For each phase with findings, edit `plan/phase-{N}-{name}.md`:

**Reset falsely completed tasks:**

If a task was marked `- [x]` but the code is MISSING, STUB, or PARTIAL, reset it:
```markdown
- [ ] `TASK-2.5` Implement RefundService with process, validate, and notify operations → `/backend-engineer`
  **Reconcile note:** Reset from complete — process() is a stub with TODO comment, validate() is missing entirely. Only notify() is implemented.
```

**Add new tasks for gaps:**

Determine the next available task number and add tasks for items that were never planned:
```markdown
- [ ] `TASK-2.15` Wire CartService into CheckoutPage — service exists but is not imported or used → `/frontend-react-architect` [TC-2.18]
- [ ] `TASK-2.16` Implement ShippingService — declared in AGENTS.md but file does not exist → `/frontend-react-architect` [TC-2.19]
- [ ] `TASK-2.17` Register order refund route — POST /api/v1/orders/{id}/refund declared in AGENTS.md but no route exists → `/backend-engineer` [TC-2.20]
```

**Task format rules:**
- Use the established `TASK-{phase}.{seq}` numbering, continuing from the highest existing number
- Include agent hint (`→ /agent-name`)
- Include test case reference (`[TC-X.Y]`) — create matching TC in Step 6
- Add a `**Reconcile note:**` line explaining why this task was added or reset
- Mark all new/reset tasks as `- [ ]` (pending)

### Step 6 — Update test plan files

For each phase with findings, edit `plan/test-plan-phase-{N}.md`:

**Add test cases for new tasks:**

Every task added in Step 5 needs at least one test case. Follow the standard format with Playwright MCP tool names for any UI-facing test:

```markdown
### Reconciliation Tests (added by /plan-reconcile)

- [ ] **TC-2.18: PaymentService processes checkout**
  **Steps:**
  1. `browser_navigate` → /checkout
  2. `browser_fill_form` → enter payment details
  3. `browser_click` → "Pay Now" button
  4. `browser_snapshot` → verify order confirmation or processing state
  **Expected:** Payment is submitted and order status updates in UI

- [ ] **TC-2.19: Dashboard charts render with live data**
  **Steps:**
  1. Create test data via the UI (e.g., submit a form, create a record)
  2. `browser_navigate` → /dashboard
  3. `browser_snapshot` → verify charts/metrics display the new data
  **Expected:** Dashboard shows real data, not empty charts or placeholder values

- [ ] **TC-2.20: Refund button triggers refund flow**
  **Steps:**
  1. `browser_navigate` → /orders/{id}
  2. `browser_click` → "Refund" button
  3. `browser_snapshot` → verify refund confirmation dialog appears
  4. `browser_click` → "Confirm Refund"
  5. `browser_snapshot` → verify order status changes to "Refunded"
  **Expected:** Refund is processed through the UI and status updates correctly
```

**Reset test cases for reset tasks:**

If a task was reset in Step 5 and it had test cases that were marked `- [x]` (pass), reset those too:
```markdown
- [ ] **TC-2.5: Order refund and cancellation operations**
  ...existing steps...
  **Reconcile note:** Reset from PASS — underlying implementation was incomplete (refund is stub, cancellation is missing). Must re-test after fix.
```

**Add missing UI integration tests:**

If any phase with frontend work is missing the standard UI integration test cases (per the AGENTS.md template), add them. This overlaps with `/test-audit` Step 5d — if those tests already exist, skip. If not, add:
- Page render test for every new page
- CRUD flow test for every entity
- API header test for workspace-scoped features
- Navigation test between related pages
- Error state test for form submissions

### Step 7 — Produce reconciliation report

Output a structured report:

```markdown
# Reconciliation Report: {project name}

## Summary

| Phase | Status | Tasks Reset | Tasks Added | TCs Added | Findings |
|-------|--------|------------|------------|-----------|----------|
| 1     | Complete | 0         | 0          | 0         | Clean    |
| 2a    | Complete | 3         | 4          | 6         | Gaps found |
| 2b    | Complete | 2         | 1          | 3         | Gaps found |
| 3a    | In progress | 0     | 2          | 2         | Missing items |

**Total:** 5 tasks reset, 7 tasks added, 11 test cases added

## Detailed Findings

### Phase 2: Core Features

#### MISSING (not in code)
| Item | Declared in | Expected location |
|------|------------|-------------------|
| NotificationService | AGENTS.md | frontend/src/services/NotificationService.ts |
| POST /orders/{id}/refund | AGENTS.md | routes file |

#### STUB (placeholder code)
| Item | Location | Problem |
|------|----------|---------|
| OrderService.refund() | app/Services/OrderService:45 | Method body is `// TODO: implement refund logic` |
| SettingsPanel | frontend/src/components/SettingsPanel | Returns `<div>Settings placeholder</div>` |

#### UNWIRED (exists but not connected)
| Item | Location | Problem |
|------|----------|---------|
| PaymentService | frontend/src/services/PaymentService | File exists but not imported in CheckoutPage |
| ExportDialog | frontend/src/components/ExportDialog | Component exists but not rendered in any page |

#### UNCONSUMED (backend exists, no frontend caller)
| Endpoint | Controller | Problem |
|----------|-----------|---------|
| POST /orders/{id}/refund | OrderController@refund | Route + controller exist but no frontend button or service calls it |

#### UNINITIALISED (imported but never started)
| Service | Location | Problem |
|---------|----------|---------|
| WebSocketService | frontend/src/services/WebSocketService | Imported in dashboard but .connect() never called in useEffect |

#### UNPROPPED (rendered but not connected)
| Component | Location | Problem |
|-----------|----------|---------|
| FilterPanel | ListPage:L45 | Rendered as `<FilterPanel />` with no props — filter changes ignored |

#### DRIFT (differs from spec)
| Item | Spec says | Code does |
|------|-----------|-----------|
| orders.discount column | decimal, default 0 | Missing from migration entirely |

### Architecture Consistency

#### INCONSISTENT (works but violates declared patterns)
| Pattern | Declared | Deviation | Files |
|---------|----------|-----------|-------|
| Data access | Repository pattern | 3 of 8 services call ORM directly | OrderService:45, ShippingService:22, ReportService:18 |
| API response format | Envelope {data, meta} | 2 endpoints return raw arrays | GET /api/v1/tags, GET /api/v1/categories |
| State management | React Query for server state | ProductPage uses useState + useEffect for data fetching | frontend/src/pages/ProductPage.tsx:30 |

#### UNDECLARED (pattern in code, not documented)
| Pattern | Observed | Where |
|---------|----------|-------|
| Event dispatching | OrderService dispatches OrderPlaced event | app/Services/OrderService.php:78 |
| Caching | Cache-aside with 300s TTL | app/Services/ProductService.php:15 |

#### ARCH-MISSING (declared but not implemented)
| Pattern | Declared | Status |
|---------|----------|--------|
| Error boundaries per page | Architecture Decisions | No error boundaries found in any page component |
| Domain events for cross-module effects | Architecture Decisions | Only 1 of 5 cross-module calls uses events |

### Phase 3: Integrations
...

## Plan File Changes

| File | Changes |
|------|---------|
| plan/phase-2-core-features.md | Reset TASK-2.5, TASK-2.8, TASK-2.11. Added TASK-2.15 through TASK-2.18. |
| plan/test-plan-phase-2.md | Added TC-2.18 through TC-2.23. Reset TC-2.5 from pass. |
| plan/phase-3-integrations.md | Reset TASK-3.3, TASK-3.7. Added TASK-3.19. |
| plan/test-plan-phase-3.md | Added TC-3.19 through TC-3.21. |

## Next Steps

1. Run `/team-execute` on phases with pending tasks to implement fixes
2. Run `/test-audit` after fixes to verify all test cases pass
3. Re-run `/plan-reconcile` to confirm all gaps are closed
```

### Step 8 — Verify plan files are valid

After all edits, do a quick sanity check:
- Every new `TASK-X.Y` has a unique ID (no duplicates)
- Every new `[TC-X.Y]` reference in a task has a matching test case in the test plan
- No orphaned test cases (TCs with no task reference)
- Task numbering is sequential within each phase
- All new tasks have agent hints (`→ /agent-name`)

If any issues are found, fix them before finishing.

---

## Integration with other skills

| Skill | Relationship |
|-------|-------------|
| `/plan-review` | Run BEFORE implementation. `/plan-reconcile` runs AFTER to verify delivery. |
| `/test-audit` | Overlapping concerns — `/test-audit` focuses on test execution, `/plan-reconcile` focuses on code-vs-spec gaps. Run reconcile first, then test-audit. |
| `/team-execute` | After reconcile updates plans with new tasks, `/team-execute` picks them up and assigns to teammates. |
| `/bootstrap-from-spec` | Creates initial plans from spec. `/plan-reconcile` verifies those plans were actually delivered. |

**Recommended workflow:**
```
/bootstrap-from-spec  →  /plan-review  →  /team-execute  →  /plan-reconcile  →  /test-audit  →  /team-execute (fixes)
         ↑                                                          │
         └──────────────── repeat per phase ────────────────────────┘
```

---

## Notes

- This skill uses sub-agents extensively for codebase exploration — it should not fill the main context with file contents
- It modifies plan files and test plan files — review the changes before running `/team-execute`
- For large projects, run per-phase rather than all phases at once to keep findings manageable
- The reconciliation report can be saved to `plan/reconcile-report.md` if the user wants to keep it
