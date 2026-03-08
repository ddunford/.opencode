---
description: Verify all completed phases are fully tested with no gaps
agent: build
---
# Test audit — verify all completed phases are fully tested

## When to use
Run after one or more phases have been implemented to ensure nothing was missed. This is a one-off verification that walks through all completed plan phases and checks their corresponding test plans are fully executed.

Use when:
- Multiple phases are complete and you want a full QA sweep
- Before a release or deployment to confirm coverage
- After fixing bugs to re-verify affected test cases
- As a periodic health check during development
- Test plans use old-style `**Status:** ⬜` markers and need converting to checkbox format

---

## Procedure

### Step 1 — Scan all plan phases

Read every `plan/phase-*.md` file and categorise each phase:

| Status | Criteria |
|--------|---------|
| **Complete** | All `- [x]` tasks, no `- [ ]` remaining |
| **In progress** | Mix of `- [x]` and `- [ ]` tasks |
| **Not started** | All `- [ ]` tasks |

### Step 2 — Normalise test plan format

Before auditing, check each `plan/test-plan-phase-{N}.md` for old-style status markers and convert them to the standard checkbox format. This ensures the hook and audit tooling can parse everything consistently.

**Find and replace these patterns:**

| Old format | New format |
|-----------|-----------|
| `**Status:** ⬜ Not tested` or `**Status:** ⬜` | `- [ ]` prefix on the test case heading |
| `**Status:** ✅ Pass` or `**Status:** ✅` | `- [x]` prefix on the test case heading |
| `**Status:** ❌ Fail` or `**Status:** ❌` | `- [!]` prefix on the test case heading |
| Standalone `#### TC-X.Y: Name` with no checkbox | `- [ ] **TC-X.Y: Name**` |

**Before:**
```markdown
#### TC-1.1: User can register
**Steps:** ...
**Expected:** ...
**Status:** ⬜ Not tested
```

**After:**
```markdown
- [ ] **TC-1.1: User can register**
  **Steps:** ...
  **Expected:** ...
```

**Rules:**
- Remove the `**Status:**` line entirely — status is now tracked by the checkbox
- Indent the Steps/Expected/Actual blocks under the checkbox line (2 spaces)
- Preserve all other content (steps, expected results, notes)
- If a test plan already uses `- [ ]` / `- [x]` / `- [!]` format, skip it

Report what was normalised:
```
Normalised 3 test plan files:
- test-plan-phase-1.md: 12 cases converted (⬜→[ ], ✅→[x])
- test-plan-phase-2.md: already in correct format
- test-plan-phase-3.md: 8 cases converted (⬜→[ ])
```

### Step 3 — For each completed phase, audit the test plan

Read the corresponding `plan/test-plan-phase-{N}.md` and check:

1. **All test cases have a status** — no `- [ ]` (untested) remaining
2. **No failures unresolved** — any `- [!]` (fail) should have failure details and a linked fix or known-issue ticket
3. **Test case count matches** — the number of `TC-{N}.*` references in the phase file should match the test plan

Build a report:

```
## Test Audit Report

### Phase 1: Foundation ✅
- Implementation: 8/8 tasks complete
- Test plan: 12/12 cases passing, 0 failing, 0 untested

### Phase 2: Core Features ⚠️
- Implementation: 10/10 tasks complete
- Test plan: 8/14 cases passing, 1 failing, 5 untested
  - FAILING: TC-2.7 — Login with expired token returns 401 (fails: returns 200)
  - UNTESTED: TC-2.10, TC-2.11, TC-2.12, TC-2.13, TC-2.14

### Phase 3: Dashboard 🚫
- Implementation: 3/6 tasks complete (in progress — skipping test audit)
```

### Step 4 — Check for orphaned test cases

Look for test cases that exist in test plans but have no corresponding `[TC-X.Y]` reference in any phase task. These are orphaned — either the task reference was lost or the test case was added without a task.

### Step 5 — Check for untested implementation tasks

Look for completed `- [x]` tasks in phase files that reference `[TC-X.Y]` but where those test cases are still `- [ ]` (untested). These are the most critical gaps — code was implemented but never verified.

### Step 5b — Check for missing UI integration test cases

Before executing any tests, verify the test plan includes **UI integration coverage** for every phase that has frontend work. These are the most commonly missed test cases — they catch issues that unit tests and API-level tests cannot.

**Required UI integration categories:**

Every test plan for a phase with frontend components MUST include test cases for:

1. **Page render** — each new page/route loads without blank screens or console errors
2. **CRUD flows through UI** — create, read, update, delete operations done by clicking buttons and filling forms (not raw API calls)
3. **API client integration** — the frontend sends correct headers (auth tokens, workspace IDs, content types) automatically
4. **Navigation** — links and redirects work between related pages (e.g., create → edit → list)
5. **Error states** — validation errors, 404s, and network failures display user-facing messages
6. **Provider/context wiring** — components that depend on React context providers (React Flow, DnD, theme) render correctly in their real page context

**How to check:**
- Read the phase plan's "Files to Create/Modify" section for any `frontend/` files
- For each new page or major UI component, verify a corresponding TC exists in the test plan that tests it **through the browser**
- If missing, flag it in the audit report under a new "Missing UI Integration Tests" section

Report format:
```
### Missing UI Integration Tests

Phase 5a:
- No TC for "create workflow via UI" — only API-level create test exists
- No TC for "workflow builder page renders" — WorkflowBuilderPage.tsx is new but untested
- No TC for "API client sends X-Workspace-Id header" — all workspace-scoped features need this

Phase 4:
- No TC for "prospect import CSV via UI upload" — only backend import test exists
```

### Step 5c — Check for fake UI test passes (API-only verification)

This is the most insidious problem: test cases that CLAIM to test UI but were actually verified through API calls, code review, or `curl`. Scan every `- [x]` (passing) test case in completed phases and flag any that show signs of API-only verification.

**Red flags to search for in test results/notes:**

| Pattern in test result | Problem |
|----------------------|---------|
| "PASS (API-level)" | Test verified via API endpoint, not browser |
| "PASS (code verification)" | Test "passed" by reading source code |
| "verified through code structure" | Not tested at all |
| "NOT TESTED — requires browser testing" | Deferred instead of using Playwright MCP |
| "NOT TESTED — requires manual testing" | Playwright MCP IS the manual testing tool |
| "Cannot be verified via API" | Correct — should have used Playwright MCP |
| Steps mention `curl`, `POST /api/`, `GET /api/` without UI actions | API test masquerading as UI test |
| "Audio capture requires browser mic access" | Valid hardware blocker — should be `[!] BLOCKED`, not PASS |
| "Frontend-only — cannot be verified via API" | Should be tested via Playwright MCP |

**For each flagged test case, report:**
```
### Fake UI Passes (API-Only Verification)

Phase 2a:
- TC-2a.1 "Live audio recording" — marked PASS but result says "PASS (API-level)".
  API test only verified POST endpoint. UI interaction (record button, mic permission, recording state) never tested.
  → Must be re-tested via Playwright MCP or marked BLOCKED with specific reason.

- TC-2a.12 "Recording UI renders" — marked PASS but result says "PASS (code verification)".
  Source code was reviewed, not the actual browser render.
  → Must be re-tested via browser_navigate + browser_snapshot.

Phase 2b:
- TC-2b.1 "Track mixer controls" — marked PASS but steps describe PUT /api/v1/tracks/{id}/mixer.
  Fader drag, pan knob interaction, meter updates never tested in browser.
  → Must be re-tested via Playwright MCP browser interaction.
```

**Verdict impact:** If more than 30% of "passing" test cases in a completed phase are flagged as API-only verification, change the phase audit status from ✅ to ⚠️ and list all flagged cases as requiring re-test.

### Step 5d — Write missing UI integration test cases into test plans

After identifying gaps in Steps 5b and 5c, **add the missing test cases directly to the test plan files**. Do not just report them — write them so they exist for future execution.

**For each phase with missing UI integration tests:**

1. Open `plan/test-plan-phase-{N}.md`
2. Find or create a `### UI Integration` section (add it at the end of the test cases if missing)
3. Determine the next available TC number for this phase (scan existing TC-{N}.X IDs)
4. Write the missing test cases using the standard format with Playwright MCP tool names

**Required test cases to add (if missing):**

For every new page or route created in the phase:
```markdown
- [ ] **TC-{N}.{next}: {PageName} renders without errors**
  **Steps:**
  1. `browser_navigate` → {page URL}
  2. `browser_snapshot` → verify content rendered (not blank)
  3. `browser_console_messages` (level: error) → check for JS errors
  **Expected:** Page renders with expected content, no console errors
```

For every entity with CRUD operations in the phase:
```markdown
- [ ] **TC-{N}.{next}: {Entity} CRUD flow works through UI**
  **Steps:**
  1. `browser_navigate` → {list page URL}
  2. `browser_click` → "Create" / "New" button
  3. `browser_fill_form` → fill fields with valid data, submit
  4. `browser_snapshot` → verify new item appears in list
  5. `browser_click` → item to edit, change fields, save
  6. `browser_click` → delete, confirm
  7. `browser_snapshot` → verify item removed from list
  **Expected:** All CRUD operations work through buttons and forms in the browser
```

For every phase that uses workspace/tenant scoping:
```markdown
- [ ] **TC-{N}.{next}: API client sends correct auth and workspace headers**
  **Steps:**
  1. Log in and select a workspace via browser UI
  2. `browser_navigate` → a page that triggers API calls
  3. `browser_network_requests` → inspect for Authorization and workspace/tenant headers
  **Expected:** All API requests include auth token and workspace/tenant ID headers automatically
```

For every phase with navigation between related pages:
```markdown
- [ ] **TC-{N}.{next}: Navigation between {feature} pages works**
  **Steps:**
  1. `browser_navigate` → list page
  2. `browser_click` → through create → detail → edit → back to list
  3. `browser_snapshot` → at each step to verify correct content
  **Expected:** All transitions work, no dead links or broken redirects
```

For every phase with form submissions:
```markdown
- [ ] **TC-{N}.{next}: {Feature} error states display correctly**
  **Steps:**
  1. `browser_fill_form` → submit with invalid/empty data
  2. `browser_snapshot` → verify inline validation error messages
  3. `browser_navigate` → non-existent resource URL
  4. `browser_snapshot` → verify friendly 404/error message
  **Expected:** Validation errors shown inline, missing resources show friendly message
```

**For fake passes found in Step 5c:**

Reset the test case status from `- [x]` back to `- [ ]` and append a note:
```markdown
- [ ] **TC-2a.1: Live audio recording**
  **Steps:**
  1. ...existing steps...
  **Expected:** ...existing expected...
  **Note:** Reset from PASS — previous result was API-only verification. Must be re-tested via Playwright MCP browser interaction.
```

**Report what was written:**
```
Added missing test cases to test plans:
- test-plan-phase-2a.md: +3 UI integration TCs (TC-2a.15, TC-2a.16, TC-2a.17)
- test-plan-phase-2b.md: +2 UI integration TCs (TC-2b.19, TC-2b.20), reset 4 fake passes to untested
- test-plan-phase-3a.md: +1 UI integration TC (TC-3a.13), reset 2 fake passes to untested
```

### Step 6 — Execute untested cases (if requested)

If the user asks to "fix" or "run" the audit findings, spawn the QA engineer to execute the untested cases:

For each untested `- [ ]` test case in a completed phase:
1. Use Playwright MCP to navigate to the relevant page
2. Follow the test steps **through the actual UI** — click buttons, fill forms, navigate links
3. Verify expected outcomes using `browser_snapshot` and `browser_console_messages`
4. Update the test case: `- [x]` for pass, `- [!]` for fail with details

**CRITICAL — test through the UI, not via raw API calls:**
- NEVER use `browser_evaluate` with `fetch()` or `XMLHttpRequest` to test endpoints. This bypasses the frontend's API client (axios/fetch wrapper) and misses bugs like missing headers, broken interceptors, or incorrect request formatting.
- ALWAYS interact with the page as a user would: navigate to the URL, click the button, fill the form, observe the result.
- The ONLY exception is test cases explicitly marked as "API-level" in the test plan (e.g., "call `POST /api/v1/users` directly and verify 201").
- After each page navigation, run `browser_console_messages` with level `error` to catch React crashes, missing providers, and JS exceptions that produce blank pages.

### Step 7 — Produce summary

```
## Test Audit Summary

| Phase | Tasks | Tests Pass | Tests Fail | Untested | Status |
|-------|-------|-----------|-----------|----------|--------|
| 1     | 8/8   | 12/12     | 0         | 0        | ✅     |
| 2     | 10/10 | 8/14      | 1         | 5        | ⚠️     |
| 3     | 3/6   | —         | —         | —        | 🚧     |

**Overall:** 2 completed phases, 1 fully tested, 1 with gaps
**Action needed:** 5 untested cases + 1 failure in Phase 2
```

### Step 8 — Update test plan files

For any test cases that were executed in Step 6, update the test plan files:
- `- [x]` for passing cases
- `- [!]` for failures, with details:
  ```
  - [!] **TC-2.7: Login with expired token returns 401**
    **Steps:** ...
    **Expected:** 401 Unauthorized
    **Actual:** 200 OK — token not being validated on /api/v1/auth/me
    **Screenshot:** screenshots/tc-2-7-failure.png
  ```

---

## Integration with agent teams

When running as part of `/team-execute`, this skill can be invoked by the team lead after all tasks are marked complete. It acts as the final gate before the phase is considered done.

The lead can also spawn a dedicated QA teammate to run the audit:

```
Spawn a QA teammate to run /test-audit on all completed phases.
Have them execute any untested cases via Playwright MCP.
```

---

## Guides
- `guides/testing.md` — test pyramid, database isolation, factory patterns, **UI integration testing requirements**
