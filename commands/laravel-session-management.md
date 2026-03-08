---
description: Laravel session management, cookie security, and CSRF protection
agent: build
---
# Laravel session management and security

## When to use
Use when using session based auth or when hardening cookie and session config.

**If implementing auth from scratch**, the [`auth` module](../../modules/auth/MODULE.md) handles session management via its `session` config (driver, lifetime, rotation, single_device, absolute_timeout). See [`modules/auth/impl/laravel.md`](../../modules/auth/impl/laravel.md) for the Laravel implementation. Use this skill for advanced hardening beyond the module's scope.

## Checklist
- If auth module is being used, configure sessions via the module's `session` config block — it handles driver, lifetime, rotation, and single-device enforcement
- For additional hardening: set secure cookie flags (secure, httpOnly, sameSite) in `config/session.php`
- Protect against CSRF where applicable
- For database sessions, the auth module creates the `sessions` table when `session.driver = "database"`
- Add tests for session sensitive flows

## Module references
- **Spec:** [`modules/auth/MODULE.md`](../../modules/auth/MODULE.md) — see `session` config section
- **Laravel impl:** [`modules/auth/impl/laravel.md`](../../modules/auth/impl/laravel.md) — session env vars and patterns

## Guides
- `guides/security.md` — session security, httpOnly cookies, session fixation, rotation on auth
