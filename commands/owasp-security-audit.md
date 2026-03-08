---
description: OWASP security audit for code vulnerabilities and security gaps
agent: build
---
# Security review — audit code for OWASP vulnerabilities and security gaps

## When to use
Run after one or more phases have been implemented, or before a release/deployment. This is a structured code review that checks for security vulnerabilities, misconfigurations, and missing protections.

Use when:
- A phase is complete and you want to verify security before moving on
- Before a release or deployment to production
- After adding auth, payments, file uploads, or any security-sensitive feature
- As a periodic security health check
- When reviewing third-party integrations or webhook handlers

---

## Procedure

### Step 1 — Identify scope

Determine what code to review. Either:
- **Phase-based:** Read `plan/phase-{N}-*.md` and identify all completed tasks. The review covers all files touched by those tasks.
- **Full project:** Review all application code (backend + frontend).
- **Targeted:** Review specific files or features the user requests.

List the files and features in scope:
```
## Security Review Scope

**Phase:** 2 — Core Features
**Files in scope:**
- backend/app/Http/Controllers/Api/V1/Auth*.php
- backend/app/Services/AuthService.php
- backend/app/Http/Middleware/*.php
- frontend/src/pages/auth/*.tsx
- frontend/src/hooks/useAuth.ts
```

### Step 2 — Read the security guide

Read `~/.claude/guides/security.md` for the full reference. Use it as the checklist baseline.

### Step 3 — OWASP Top 10 audit

For each item, scan the codebase and report findings:

#### A01: Broken Access Control
- [ ] Every route has explicit authorisation (middleware, policy, or gate)
- [ ] No direct object references without ownership check (IDOR)
- [ ] Admin routes are protected by role/permission checks, not just auth
- [ ] API endpoints deny by default — access is opt-in, not opt-out
- [ ] File/resource access checks ownership, not just existence
- [ ] CORS is configured with explicit origin allowlist (no `*` with credentials)

#### A02: Cryptographic Failures
- [ ] Passwords hashed with bcrypt (cost 12+) or argon2id — never MD5/SHA
- [ ] Sensitive data encrypted at rest (PII, tokens, API keys)
- [ ] TLS enforced on all endpoints (HSTS header present)
- [ ] No secrets in source code, logs, error messages, or plan files
- [ ] Session tokens are cryptographically random (not sequential/predictable)

#### A03: Injection
- [ ] All database queries use parameterised statements or ORM — no string concatenation
- [ ] Raw query escape hatches audited (DB::raw, $conn.execute with f-strings, etc.)
- [ ] No shell command execution with user input (`exec`, `system`, `child_process`)
- [ ] GraphQL queries have depth/complexity limits (if applicable)
- [ ] NoSQL queries validated against operator injection ($where, $gt)

#### A04: Insecure Design
- [ ] Rate limiting on auth endpoints (login, register, password reset, OTP)
- [ ] Account lockout after repeated failures
- [ ] Business logic validates state transitions (e.g., can't pay for a cancelled order)
- [ ] Multi-step operations use CSRF tokens or SameSite cookies
- [ ] Sensitive operations require re-authentication (password change, email change)

#### A05: Security Misconfiguration
- [ ] Debug mode disabled in production config
- [ ] Default credentials removed (database, admin accounts, API keys)
- [ ] Error responses don't leak stack traces, SQL queries, or internal paths
- [ ] Security headers present (HSTS, X-Frame-Options, CSP, X-Content-Type-Options)
- [ ] Unnecessary HTTP methods disabled
- [ ] Directory listing disabled on web server

#### A06: Vulnerable Components
- [ ] No known vulnerable dependencies (`composer audit`, `npm audit`, `pip audit`)
- [ ] Dependencies are reasonably current (no major versions behind)
- [ ] Lock files committed (composer.lock, package-lock.json, uv.lock)
- [ ] No unnecessary dependencies (attack surface reduction)

#### A07: Auth & Session Failures
- [ ] Session cookies: HttpOnly, Secure, SameSite=Lax (or Strict for sensitive ops)
- [ ] Session invalidated on logout (server-side deletion, not just cookie removal)
- [ ] Password reset tokens are single-use and time-limited
- [ ] JWT tokens (if used): RS256, short expiry, refresh rotation, revocation list
- [ ] MFA implementation doesn't leak whether code was correct via timing

#### A08: Data Integrity Failures
- [ ] Webhook payloads verified via HMAC signature before processing
- [ ] Deserialisation of untrusted data uses safe methods (no pickle, no unserialize on user data)
- [ ] CI/CD pipeline has integrity checks (signed commits, protected branches)
- [ ] Package installation uses lock files, not floating versions

#### A09: Logging & Monitoring Failures
- [ ] Security events logged (auth success/failure, permission changes, admin actions)
- [ ] Logs never contain passwords, tokens, API keys, or PII
- [ ] Structured logging with correlation IDs for traceability
- [ ] Failed login attempts are logged with IP and user agent
- [ ] Log injection prevented (user input sanitised before logging)

#### A10: SSRF
- [ ] Outbound HTTP requests validate/whitelist destination URLs
- [ ] Internal IP ranges blocked (169.254.x.x, 10.x.x.x, 172.16.x.x, 192.168.x.x, localhost)
- [ ] User-supplied URLs not fetched without validation
- [ ] Webhook callback URLs validated against allowlist (if applicable)

### Step 4 — Secrets audit

Scan for leaked credentials:

1. **Check committed files** — search for patterns that look like secrets:
   - API keys, tokens, passwords in source files
   - Hardcoded connection strings with credentials
   - Base64-encoded secrets
   - Private keys (RSA, EC, ED25519)

2. **Check .env.example** — verify it contains only dummy/placeholder values, not real credentials

3. **Check pre-commit hook** — verify `.githooks/pre-commit` exists and scans for secret patterns

4. **Check Docker/compose files** — no hardcoded passwords in Dockerfiles or docker-compose.yml

5. **Check plan files and AGENTS.md (or CLAUDE.md)** — no real credentials (only `.env` variable name references)

### Step 5 — Frontend-specific checks

- [ ] No sensitive data in client-side storage (localStorage with tokens, etc.)
- [ ] API keys not exposed in client bundle (check for VITE_ env vars that shouldn't be public)
- [ ] XSS prevention: no `dangerouslySetInnerHTML` or `v-html` with user data
- [ ] Form inputs have proper validation (type, maxLength, pattern)
- [ ] Authentication state checked on route navigation (protected routes)
- [ ] CSRF tokens included on state-changing requests (if using cookies)
- [ ] No sensitive data in URL query parameters (tokens, passwords)

### Step 6 — Produce findings report

```
## Security Review Report

**Scope:** Phase 2 — Core Features
**Date:** {date}
**Reviewed by:** /security-reviewer

### Critical (fix before deploy)
1. **[A01] IDOR in GET /api/v1/invoices/{id}** — no ownership check, any authenticated user can view any invoice
   - File: `backend/app/Http/Controllers/Api/V1/InvoiceController.php:45`
   - Fix: Add `$this->authorize('view', $invoice)` policy check
   - Severity: Critical

### High
2. **[A03] Raw SQL in search** — user input concatenated into LIKE clause
   - File: `backend/app/Services/SearchService.php:23`
   - Fix: Use parameterised query with `?` placeholder
   - Severity: High

### Medium
3. **[A05] Missing security headers** — no CSP or HSTS headers configured
   - Fix: Add security headers middleware
   - Severity: Medium

### Low
4. **[A09] Password logged on failed login** — debug log includes request body
   - File: `backend/app/Http/Controllers/Api/V1/AuthController.php:67`
   - Fix: Exclude `password` field from log context
   - Severity: Low

### Passed
- [A02] Password hashing: bcrypt cost 12 ✅
- [A07] Session cookies: HttpOnly, Secure, SameSite=Lax ✅
- [A06] No known vulnerable dependencies ✅
- [A08] Webhook HMAC verification present ✅
- [A10] No outbound HTTP with user-supplied URLs ✅

### Summary
| Severity | Count |
|----------|-------|
| Critical | 1     |
| High     | 1     |
| Medium   | 1     |
| Low      | 1     |
| Passed   | 5     |

**Action needed:** 2 critical/high findings must be fixed before Phase 2 is considered complete.
```

### Step 7 — Fix critical and high findings (if requested)

If the user asks to fix the findings:

1. For each Critical and High finding, implement the fix directly
2. Run tests after each fix to verify no regressions
3. Re-audit the specific check to confirm the fix resolves the issue
4. Update the findings report with resolution status

Do NOT fix Medium/Low findings automatically — list them for the team to prioritise. They are real issues but not blockers.

---

## Integration with agent teams

The security reviewer can be added as an optional teammate in `/team-execute`:

```
Task tool parameters:
  name: "security"
  team_name: "{project}-phase-{N}"
  subagent_type: "general-purpose"
  prompt: |
    You are the security reviewer for {project}, Phase {N}.

    Your persona: security-reviewer — read ~/.claude/agents/security-reviewer.md.

    Your workflow:
    1. Wait for ALL implementation tasks to complete (check TaskList)
    2. Read the code changes for this phase
    3. Run the /owasp-security-audit procedure against the changed files
    4. Report Critical/High findings to the responsible teammate via SendMessage
    5. Re-audit after fixes are applied
    6. Mark your task complete when no Critical/High findings remain
```

The security reviewer:
- Waits for ALL implementation tasks to complete (needs final code, not in-progress work)
- Reviews code only — does not make changes unless explicitly asked
- Can run in parallel with QA (they don't conflict — security reads code, QA tests UI)
- Blocks phase completion if Critical/High findings exist

---

## Integration with /test-audit

When running `/test-audit`, the audit report should note whether a security review has been completed for each phase. If not, flag it:

```
### Phase 2: Core Features ⚠️
- Implementation: 10/10 tasks complete
- Test plan: 14/14 cases passing
- Security review: ❌ NOT DONE — run /owasp-security-audit
```

---

## Guides
- `guides/security.md` — OWASP top 10, input validation, auth patterns, secrets, mTLS

## Module references (high-risk surface area)
- `modules/auth/` — session management, token handling, MFA flows
- `modules/permissions/` — RBAC/ABAC, policy enforcement, privilege escalation risks
- `modules/sso-saml/` — SAML assertion validation, XML signature verification
- `modules/api-keys/` — key hashing, scoping, rotation
- `modules/audit-compliance/` — evidence collection, SOC2/HIPAA controls
- `modules/oauth-server/` — authorization code flow, token issuance security
- `modules/gdpr-privacy/` — data subject rights, consent management
- `modules/billing/` — payment data handling, PCI considerations
- `modules/file-storage/` — upload validation, path traversal, malware scanning
- `modules/webhooks-inbound/` — HMAC signature verification, replay protection
