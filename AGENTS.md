# OpenCode Configuration

Personal OpenCode setup for software development.

---

## Tool Names

You are running inside OpenCode, NOT Claude Code. Use these exact tool names:

| Action | Correct tool name | WRONG (do not use) |
|--------|------------------|-------------------|
| Read a file | `read` | `Read`, `read_file`, `ReadFile` |
| Write a file | `write` | `Write`, `WriteFile` |
| Edit a file | `edit` | `Edit`, `str_replace_editor` |
| Run a command | `bash` | `Bash`, `execute`, `terminal` |
| Search content | `grep` | `Grep`, `search`, `ripgrep` |
| Find files | `glob` | `Glob`, `find`, `list_files` |
| List directory | `list` | `ls`, `list_dir` |
| Fetch a URL | `webfetch` | `WebFetch`, `fetch`, `curl` |

**Always use the tool to perform actions. Never just describe what you would do — actually call the tool and do it.**

---

## Non-Negotiable Rules

1. **NEVER skip, defer, or partially implement a task.** If a task says "extract FooService as a separate class", you extract FooService as a separate class. No "I'll skip this for now", no "this can be done later", no "leaving this as-is for simplicity". Every task is completed fully or you explicitly ask the user for permission to descope it.
2. **NEVER leave placeholder or TODO comments instead of real code.** Write the actual implementation. If you genuinely cannot complete something (missing dependency, ambiguous requirement), stop and ask — do not silently skip it.
3. **If a task feels too large, break it into subtasks — do not cut corners.** Create the subtasks and work through them. Reducing scope without permission is not acceptable.
4. **Mark a task `[x]` only when it is fully done** — code written, files saved, tests passing (if applicable). A partial implementation is not done.

---

## Lessons Learned

Two levels of lessons — global and project-specific:

| File | Scope | Examples |
|------|-------|---------|
| `~/.claude/lessons.md` | All projects | General patterns, tool usage, workflow rules |
| `{project-root}/lessons.md` | One project | Project URLs, domain-specific gotchas, service configs |

**When the user corrects a mistake:**
1. Acknowledge the correction
2. Decide scope: is this a **general pattern** (global) or **project-specific detail** (project)?
3. Append a new entry to the appropriate `lessons.md` using this format:
   ```
   ### {date} — {short description}
   **Mistake:** What I did wrong
   **Correction:** What the user told me to do instead
   **Rule:** The general principle to follow going forward
   ```
4. Follow the rule immediately and in all future sessions

**Project-specific = anything that references:** project URLs/domains/ports, project-specific services/models/seeders, config values unique to the project.

**If the target `lessons.md` doesn't exist yet, create it** with a `# Lessons Learned` heading before adding the first entry.

---

## Reference Guides

Read the relevant guide from `~/.claude/guides/` before making significant decisions:

| Guide | Read when... |
|-------|-------------|
| `guides/architecture.md` | Monolith/microservices, CQRS, event sourcing, saga patterns |
| `guides/data-modeling.md` | Schemas, soft deletes, multi-tenancy, JSONB vs columns |
| `guides/api-design.md` | REST endpoints, error formats, pagination, versioning |
| `guides/security.md` | Auth, input validation, XSS/CSRF/SSRF, secrets, OWASP |
| `guides/testing.md` | Testing strategy, mocking, TDD, contract tests |
| `guides/performance.md` | Caching, N+1 prevention, indexing, background jobs |
| `guides/ui-ux.md` | Loading/error/empty states, forms, accessibility (WCAG 2.2) |
| `guides/mobile-ux.md` | Thumb zones, offline-first, push notifications, haptics |
| `guides/observability.md` | Structured logging, metrics, distributed tracing, alerting |
| `guides/deployment.md` | Deploy strategies, zero-downtime migrations, CI/CD, rollback |
| `guides/ai-engineering.md` | LLM features, RAG, agents, evals, model selection |
| `guides/vibe-coding.md` | Rapid AI-assisted dev, pitfalls, quality checklists |
| `guides/onboarding.md` | New project setup, bootstrap workflow |
| `guides/plan-templates.md` | Plan file structure, test plan templates, UI testing rules |
| `guides/docker-patterns.md` | Multi-stage Dockerfiles, compose organization, dev/prod split |

---

## OpenCode Workflow

### Context Management

Context windows are limited. Use these strategies:

- **Subagents** for codebase exploration, pattern searching, multi-file analysis. Request summaries, not full file contents.
- **Commands** (e.g., `/bootstrap-from-spec`) when you know the problem domain or task matches a command description.
- **Agents** (`/agent-name`) for domain-specific work within a platform. Each agent knows which guides, commands, and modules to use.
- **Agent Teams** (`/team-execute`) for phases with 6+ tasks spanning multiple domains. NOT for small phases or tightly coupled tasks.

Available agents: `backend-php-laravel-engineer`, `fastapi-engineer`, `nestjs-engineer`, `frontend-react-architect`, `frontend-services-architect`, `react-native-engineer`, `flutter-engineer`, `database-architect`, `devops-deployment-engineer`, `api-contracts-architect`, `observability-engineer`, `monorepo-tooling-architect`, `security-reviewer`, `qa-test-engineer`, `a11y-wcag-reviewer`, `product-ui-ux-writer`

### Project Lifecycle

Run in order: `/plan-review` → `/team-execute` → `/plan-reconcile` → `/test-audit` → `/team-execute` (fixes) → repeat until clean.

| # | Command | When | What |
|---|---------|------|------|
| 1 | `/bootstrap-from-spec` | New project | Generates AGENTS.md, plans, test plans from SPEC.md |
| 2 | `/plan-review` | Before impl | Validates plans are complete and ready |
| 3 | `/team-execute` | During impl | Agent team works through plan tasks |
| 4 | `/plan-reconcile` | After impl | Finds gaps, updates plans with new tasks |
| 5 | `/test-audit` | After reconcile | Verifies tests, detects fake passes |
| 6 | `/team-execute` | After audit | Picks up fix tasks |

---

## Module System

Reusable module specs live at `~/.claude/modules/`. Each module defines config schema, database schema, API endpoints, and platform-specific implementations. **Always check for an existing module before implementing common features from scratch.**

### Start with a Composition

For new projects, read the composition file first: `~/.claude/modules/compositions/` (saas, mobile-app, api-service, ai-product, realtime-ai, content-platform, internal-tool, ecommerce, team-collaboration).

### Platform → Implementation

| Build Target | Impl File | Framework | Agent | Command |
|---|---|---|---|---|
| Backend (PHP) | `impl/laravel.md` | Laravel 12.x | `/backend-php-laravel-engineer` | `/laravel-scaffold` |
| Backend (Python) | `impl/fastapi.md` | FastAPI 0.115+ | `/fastapi-engineer` | `/fastapi-scaffold` |
| Backend (Node) | `impl/node.md` | NestJS 10+ | `/nestjs-engineer` | `/nestjs-scaffold` |
| Web SPA | `impl/react.md` | React 19 | `/frontend-react-architect` | `/react-vite` |
| Web SSR | `impl/nextjs.md` | Next.js 15 | `/frontend-react-architect` | `/nextjs-app-router` |
| Mobile (JS) | `impl/mobile.md` | React Native 0.81+ | `/react-native-engineer` | `/react-native-scaffold` |
| Mobile (Dart) | `impl/flutter.md` | Flutter 3.x | `/flutter-engineer` | `/flutter-scaffold` |

### How to Use a Module

1. Read `~/.claude/modules/{module}/MODULE.md` for the contract
2. Read the relevant impl file for the target platform
3. Follow the impl's Directory Tree and Key Patterns exactly
4. Run the impl's Verification Checklist before marking complete

Full module list (94 modules): `~/.claude/modules/README.md`

---

## Project ctl.sh Convention

If a project has a `ctl.sh` at its root, **always use it** instead of raw docker/compose commands. Run `./ctl.sh help` to discover commands. Never bypass it — it handles dev/production mode, health checks, and safety confirmations. If a needed command doesn't exist, add it to `ctl.sh`. See `/ctl-script` command for the template.

---

## Codebase Documentation

Create localized AGENTS.md files for complex areas: services, integrations, subsystems with non-obvious logic. Keep concise, explain WHY not WHAT, link don't duplicate, update when changing.

---

## Plan Mode Requirements

When entering plan mode, **ALWAYS** create files in `./plan/`:
- `plan/phase-{N}-{name}.md` — implementation plan with tasks
- `plan/test-plan-phase-{N}.md` — test cases for verification

**Read `guides/plan-templates.md` for the full template structure and UI testing rules.**

### Key Rules

1. Every implementation plan needs a corresponding test plan
2. UI tests use Playwright, not API calls — never mark a UI test PASS based on API-level verification
3. Never defer UI tests as "manual" — use Playwright for browser testing
4. Every task must be fully completed before marking `[x]`
5. Never say "I'll skip this for now" — do the work or ask for clarification

---

## Local Platform Config

Platform-specific config lives in `~/.claude/local/` (gitignored). Check at project start:
- AI inference services → `local/inference-services.md`
- Reverse proxy / TLS → `local/traefik.md`
- Workspace paths → `local/workspace.md`

Design AI clients to be provider-agnostic with env vars. Use Traefik labels with env var substitution for domains/networks. Keep dev and production routers separate.

---

## Security Defaults

- Validate all user input server-side; use allowlists, not blocklists; parameterize all queries
- Hash passwords with bcrypt/argon2 (cost 12+); secure cookies (httpOnly, secure, sameSite)
- NEVER put credentials in plan files, AGENTS.md, README, or any committed file — reference `.env` variable names only
- Projects should have `.githooks/pre-commit` credential guard. Set `git config core.hooksPath .githooks`
- Tests MUST use a separate test database — NEVER the development database. Every project needs `.env.testing` with `DB_DATABASE=<project>_test`

---

*Last updated: 2026-03-08*
