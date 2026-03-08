---
description: Execute a plan phase with an agent team of parallel teammates
agent: build
---
# Execute a plan phase with an agent team

## When to use
Run after `/plan-review` has passed and the scaffold is complete. This skill reads a plan phase, creates an agent team, and delegates tasks to parallel teammates based on agent hints and parallel markers.

**Prerequisites:**
- Agent teams enabled: `agent teams enabled` in settings.json
- Project scaffolded and booting (health endpoint responds)
- Plan phase file exists with `TASK-X.Y` items and agent hints (`→ /agent-name`)

---

## Procedure

### Step 1 — Select the phase

Read the plan directory and identify the target phase:

```bash
ls plan/phase-*.md
```

If the user didn't specify a phase, pick the first phase with pending `- [ ]` tasks.

Read the phase file and parse:
- All `TASK-X.Y` items with their status, agent hints, and parallel markers (`⫘`)
- Dependencies (which tasks must complete before others)
- Test case references (`[TC-X.Y]`)

### Step 2 — Identify team roles

Group tasks by agent hint to determine how many teammates are needed:

```
Backend:  /backend-php-laravel-engineer  → 5 tasks
Frontend: /frontend-react-architect      → 4 tasks
Tests:    (no agent hint — lead handles) → 2 tasks
```

**Team sizing rules:**
- Maximum 4 teammates (lead + 3 workers) — more causes coordination overhead
- Aim for **5-6 tasks per teammate** — this is the sweet spot for keeping everyone productive and letting the lead reassign work if someone gets stuck
- Only create a teammate for a role with 2+ tasks — single tasks can be handled by the lead
- If all tasks go to one agent, don't create a team — just work through them sequentially

**Recommended team composition for full-stack phases:**

| Role | Agent | What they do |
|------|-------|-------------|
| Backend | `/backend-php-laravel-engineer` (or fastapi/nestjs) | Schema, services, controllers, unit tests |
| Frontend | `/frontend-react-architect` (or mobile) | Components, hooks, pages, component tests |
| QA | `/qa-test-engineer` | Executes test plan cases via Playwright MCP, reports failures |
| Security | `/security-reviewer` | OWASP audit of code changes, secrets scan, findings report |

The QA teammate is optional but recommended when the phase has a test plan with UI-facing test cases. The QA teammate:
- Waits for BOTH backend AND frontend tasks to complete (needs working endpoints + rendered pages)
- Opens the app with Playwright MCP (`browser_navigate`, `browser_snapshot`, etc.)
- Walks through each test case in `plan/test-plan-phase-{N}.md`
- Updates test case status (`⬜` → `✅` / `❌`)
- Messages the responsible teammate with failure details and screenshots
- Re-tests after fixes are deployed

See `agents/qa-test-engineer.md` for the full QA teammate protocol.

### Step 3 — Create the team

Create a team using TeamCreate with a descriptive name:

```
Team name: {project}-phase-{N}
Description: "Phase {N}: {phase name} — {backend-agent} + {frontend-agent}"
```

### Step 4 — Create team tasks from plan tasks

For each `TASK-X.Y` in the plan file, create a corresponding team task via TaskCreate:

- **Subject:** The task description from the plan
- **Description:** Include:
  - The full task line from the plan
  - Which module or custom feature it implements
  - Reference to the module's `MODULE.md` and `impl/{platform}.md` paths
  - Test case references if any
- **Dependencies:** Based on parallel markers:
  - Sequential tasks (no `⫘`) are blocked by the preceding task
  - Parallel tasks (`⫘`) can start once their common prerequisite completes

**Note:** Teammates automatically load the project's AGENTS.md, MCP servers, and skills from their working directory — you don't need to pass these in the task description. However, they do NOT inherit the lead's conversation history, so include any task-specific context in the description.

### Step 5 — Spawn teammates

For each role identified in Step 2, spawn a teammate via the Task tool:

```
Task tool parameters:
  name: "backend" (or "frontend", "mobile", "tests")
  team_name: "{project}-phase-{N}"
  subagent_type: "general-purpose"
  prompt: |
    You are the {role} teammate for {project}, Phase {N}.

    Your persona: {agent-name} — read ~/.config/opencode/agents/{agent-file}.md for conventions.

    Project plan: Read plan/phase-{N}-{name}.md for the full phase plan.

    Your assigned tasks: {list of TASK-X.Y items for this role}

    For each task:
    1. Read TaskList to find your next available task
    2. Claim it with TaskUpdate (set owner to your name)
    3. Read the relevant module's MODULE.md and impl file
    4. Implement fully — do NOT skip or partially implement
    5. Run tests after each task
    6. Mark complete with TaskUpdate
    7. Send a message to the lead summarising what was done
    8. Check TaskList for next available task

    When all your tasks are complete, notify the lead.
```

**For the QA teammate**, spawn with Playwright MCP awareness:
```
Task tool parameters:
  name: "qa"
  team_name: "{project}-phase-{N}"
  subagent_type: "general-purpose"
  prompt: |
    You are the QA teammate for {project}, Phase {N}.

    Your persona: qa-test-engineer — read ~/.config/opencode/agents/qa-test-engineer.md for
    the full QA teammate protocol including Playwright MCP tool reference.

    Test plan: Read plan/test-plan-phase-{N}.md for all test cases.

    Your workflow:
    1. Wait for BOTH backend AND frontend tasks to complete (check TaskList — you need
       working API endpoints AND rendered pages before testing)
    2. For each test case, use Playwright MCP tools to navigate the app and verify
    3. Update test plan status markers (⬜ → ✅ / ❌)
    4. Message the responsible teammate with failure details + screenshots
    5. Re-test after fixes
    6. Mark your task complete when all cases are ✅ or documented as known issues
```

**For the security reviewer**, spawn after implementation tasks are assigned:
```
Task tool parameters:
  name: "security"
  team_name: "{project}-phase-{N}"
  subagent_type: "general-purpose"
  prompt: |
    You are the security reviewer for {project}, Phase {N}.

    Your persona: security-reviewer — read ~/.config/opencode/agents/security-reviewer.md for
    the full security review protocol and team teammate workflow.

    Audit skill: Follow the /owasp-security-audit procedure in
    ~/.config/opencode/skills/owasp-security-audit/SKILL.md for the structured checklist.

    Your workflow:
    1. Wait for ALL implementation tasks to complete (check TaskList — you need
       final code, not work-in-progress)
    2. Read all files created/modified by this phase
    3. Run the OWASP Top 10 audit checklist + secrets scan
    4. Report Critical/High findings to the responsible teammate via SendMessage
    5. Re-audit after fixes are applied
    6. Mark your task complete when no Critical/High findings remain

    You can run in parallel with the QA teammate — you review code, they test UI.
```

The security reviewer is optional but **strongly recommended** when the phase touches:
- Auth, permissions, or session management
- Payment processing or PII handling
- File uploads or user-supplied URLs
- Webhook handlers or third-party integrations
- Any module listed in the security-reviewer agent's "Key modules" section

The security reviewer:
- Waits for ALL implementation tasks to complete (needs final code)
- Runs in parallel with QA (code review vs UI testing — no conflict)
- Reports findings to the responsible teammate, does NOT make changes
- Blocks phase completion if Critical/High findings remain unresolved

**For risky or complex tasks**, require plan approval before implementation:
```
Spawn the backend teammate and require plan approval before they make any changes.
```
The teammate works in read-only plan mode until the lead approves their approach. If rejected, the teammate revises based on feedback and resubmits.

**File ownership rule — CRITICAL:**
Never assign two teammates to edit the same file. Two teammates editing the same file leads to overwrites. Break work so each teammate owns a different set of files:
- Backend teammate → `backend/` only
- Frontend teammate → `frontend/` only
- If a task spans both, assign it to the lead or split it into two tasks

### Step 6 — Coordinate as team lead

As the team lead:

1. **Wait for teammates** — do NOT start implementing tasks yourself. Let teammates finish their work. If you notice yourself doing implementation work, stop and delegate.
2. **Monitor progress** — check TaskList periodically. If a task appears stuck, check whether the work is actually done (teammates sometimes fail to mark completion).
3. **Unblock teammates** — if a teammate is stuck, message them directly with guidance.
4. **Handle cross-cutting tasks** — run integration tests that span backend + frontend.
5. **Resolve conflicts** — if two teammates accidentally touch the same file, coordinate the merge.
6. **Update plan file** — as each TASK-X.Y completes, mark `- [x]` in the plan phase file.

**To interact with teammates:**
- **In-process mode:** Shift+Down to cycle through teammates, type to message them. Press Enter to view a teammate's session, Escape to interrupt their turn. Ctrl+T to toggle task list.
- **Split-pane mode (tmux):** Click into a teammate's pane to interact directly.

### Step 7 — Verify phase completion

When all team tasks are complete:

1. Run the full test suite: `./ctl.sh test`
2. Walk through the test plan: `plan/test-plan-phase-{N}.md`
3. Mark all completed test cases with ✅
4. Verify the health endpoint still responds
5. Verify security review has no unresolved Critical/High findings (if security teammate was spawned)
6. Update the plan file — all tasks should be `- [x]`

### Step 8 — Shutdown the team

Send `shutdown_request` to each teammate. Wait for `shutdown_response` confirmations. Then clean up with TeamDelete.

**Important:** Always clean up as the lead. Teammates should not run cleanup — their team context may not resolve correctly, leaving resources in an inconsistent state.

### Step 9 — Report

Print a summary:

```
## Phase {N} complete

**Team:** {teammate count} teammates, {task count} tasks

**Tasks completed:**
- [x] TASK-X.1 — {description}
- [x] TASK-X.2 — {description}
- ...

**Test results:** {pass count}/{total count} passing

**Next:** Phase {N+1} — run `/team-execute` again or continue sequentially
```

---

## Quality gate hooks

You can use hooks to enforce rules when teammates finish work:

| Hook | When it runs | Use for |
|------|-------------|---------|
| `TeammateIdle` | When a teammate is about to go idle | Exit code 2 sends feedback and keeps them working |
| `TaskCompleted` | When a task is being marked complete | Exit code 2 prevents completion and sends feedback |

Example: reject task completion if tests aren't passing:
```json
{
  "hooks": {
    "TaskCompleted": [{
      "command": "./ctl.sh test --quiet",
      "description": "Verify tests pass before marking task complete"
    }]
  }
}
```

---

## When NOT to use teams

Use sequential execution (just "work through the plan") instead when:
- Phase has fewer than 4 tasks total
- All tasks target the same directory (backend only or frontend only)
- Tasks are tightly coupled with complex dependencies
- You're debugging or fixing issues from a previous phase
- Tasks are routine and sequential — teams add overhead for no benefit

Teams shine when a phase has **parallel backend + frontend work** with 6+ tasks across different directories.

---

## Team role → agent mapping

| Role | Agent file | Best for |
|------|-----------|----------|
| Backend (Laravel) | `agents/backend-php-laravel-engineer.md` | Schema, services, controllers, API tests |
| Backend (FastAPI) | `agents/fastapi-engineer.md` | Models, services, routes, pytest |
| Backend (NestJS) | `agents/nestjs-engineer.md` | Modules, services, controllers, Jest |
| Frontend (React) | `agents/frontend-react-architect.md` | Components, hooks, pages, Vitest |
| Frontend (Next.js) | `agents/frontend-react-architect.md` | Server components, routes, middleware |
| Mobile (RN) | `agents/react-native-engineer.md` | Screens, navigation, native integrations |
| Mobile (Flutter) | `agents/flutter-engineer.md` | Widgets, providers, platform channels |
| Database | `agents/database-architect.md` | Complex migrations, query optimisation |
| DevOps | `agents/devops-deployment-engineer.md` | Docker, CI/CD, deployment config |
| Security | `agents/security-reviewer.md` | OWASP audit, secrets scan, vulnerability findings |
| Tests | `agents/qa-test-engineer.md` | E2E tests, integration test suites |

---

## Limitations (experimental feature)

- `/resume` and `/rewind` do not restore in-process teammates — lead may try to message teammates that no longer exist. Tell it to spawn new ones.
- One team per session — cannot nest teams. Clean up current team before starting a new one.
- Task status can lag — teammates sometimes fail to mark completion. Check manually if stuck.
- Shutdown waits for current request to finish (can be slow)
- Split-pane mode requires tmux or iTerm2 — not supported in VS Code terminal, Windows Terminal, or Ghostty
- Lead is fixed — cannot transfer leadership mid-phase
- All teammates inherit lead's permission mode at spawn — change individually after if needed
- Higher token cost — each teammate is a full AI instance. Worth it for parallel cross-domain work, not for routine sequential tasks.
