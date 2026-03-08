---
description: Convert older plan files to trackable TASK-X.Y checkbox format
agent: build
---
# Backfill Plan Tasks

## When to use
Run on existing projects that have a `plan/` directory with phase files that don't use the standardized `TASK-X.Y` checkbox format. Converts older plan files to the trackable format.

---

## Checklist

### Step 1 — Scan existing plan files
- Find all `plan/phase-*.md` files in the current project
- If no plan directory or no phase files exist, stop and inform the user

### Step 2 — Analyze each phase file
For each `plan/phase-{N}-{name}.md`:
- Look for an existing `## Tasks` section with `TASK-` prefixed checkboxes (already migrated — skip)
- Look for `## Definition of done` or `## Implementation Steps` sections with checkboxes (`- [ ]` / `- [x]`)
- Look for numbered implementation steps without checkboxes (convert these to tasks)
- Determine the phase number `N` from the filename

### Step 3 — Build the Tasks section
For each file that needs conversion:
1. Extract all actionable items (checkboxes, numbered steps, bullet points describing work)
2. Assign sequential IDs: `TASK-{N}.1`, `TASK-{N}.2`, etc.
3. Preserve existing completion status — items already marked `[x]` stay checked
4. Write one task per line in this format:
   ```
   - [ ] `TASK-1.1` Description of the task → `/agent-name` [TC-1.1]
   - [x] `TASK-1.2` Already completed task → `/agent-name`
   ```
5. Add agent hint (`→ /agent-name`) based on the task domain (backend, frontend, database, etc.)
6. Add test case links (`[TC-X.Y]`) where a matching test case exists in `test-plan-phase-{N}.md`
7. If no test-writing tasks exist, add them (e.g., `TASK-1.5 Write unit tests for auth service`)

### Step 4 — Update the plan file
- If a `## Tasks` section already exists (without TASK IDs), replace it in place
- If no `## Tasks` section exists, add one after `## Implementation Steps` or `## Definition of done`
- Keep the original `## Implementation Steps` or `## Definition of done` section intact (it has richer context) — the `## Tasks` section is the trackable checklist
- Do NOT remove any other content from the file

### Step 5 — Print summary
Output a summary table:

```
## Backfill complete

| File | Tasks found | Complete | Pending |
|------|-------------|----------|---------|
| plan/phase-1-foundation.md | 8 | 3 | 5 |
| plan/phase-2-core.md | 12 | 0 | 12 |
| **Total** | **20** | **3** | **17** |
```

---

## Notes

- Do not modify test plan files (`test-plan-phase-*.md`) — only phase files
- If a task description is vague (e.g., just "Done"), try to infer a better description from surrounding context
- Keep task descriptions concise — one line each, action-oriented
- After backfill, the UserPromptSubmit hook will automatically pick up pending tasks
