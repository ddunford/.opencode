---
description: Laravel auth, permissions, policies, and session hardening
agent: build
---
# Laravel auth and permissions

## When to use
Use when implementing login, roles, policies, object level access, and session hardening.

**If implementing auth from scratch**, use the [`auth` module](../../modules/auth/MODULE.md) instead — it provides a deterministic spec for the full auth stack (Sanctum, RBAC, SSO, MFA, sessions). The Laravel implementation details are in [`modules/auth/impl/laravel.md`](../../modules/auth/impl/laravel.md). Use this skill only for customizations beyond the module's scope.

## Checklist
- If auth module is available, implement it first with a config block — it handles login, registration, SSO, RBAC, MFA, and sessions deterministically
- For custom policies beyond RBAC (object-level access), implement Laravel policies manually
- Harden sessions and cookies (secure, httpOnly, sameSite) — the auth module's `session` config covers driver, lifetime, and rotation
- Add audit logging for sensitive actions — the auth module composes with `audit-log` if present
- Add tests for auth and authorisation boundaries — the auth module includes named test cases (AUTH_001–AUTH_083)

## Module references
- **Spec:** [`modules/auth/MODULE.md`](../../modules/auth/MODULE.md) — config, contracts, schema, API, tests
- **Laravel impl:** [`modules/auth/impl/laravel.md`](../../modules/auth/impl/laravel.md) — packages, directory tree, key patterns
- **React impl:** [`modules/auth/impl/react.md`](../../modules/auth/impl/react.md) — hooks, stores, components

## Guides
- `guides/security.md` — auth patterns, token handling, session security, MFA

## Module references
- **Auth:** [`modules/auth/impl/laravel.md`](../../modules/auth/impl/laravel.md) — full auth implementation with Sanctum/Passport
- **Permissions:** [`modules/permissions/impl/laravel.md`](../../modules/permissions/impl/laravel.md) — Spatie laravel-permission, policy patterns, ABAC
- **SSO/SAML:** [`modules/sso-saml/impl/laravel.md`](../../modules/sso-saml/impl/laravel.md) — enterprise SSO with laravel-saml2
- **Teams:** [`modules/teams/impl/laravel.md`](../../modules/teams/impl/laravel.md) — team membership, invitations, scoped permissions
- **Org hierarchy:** [`modules/org-hierarchy/impl/laravel.md`](../../modules/org-hierarchy/impl/laravel.md) — hierarchical permission inheritance
