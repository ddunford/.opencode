---
description: Keycloak SSO infrastructure setup with OIDC and role mapping
agent: build
---
# Keycloak setup for SSO

## When to use
Use when adding SSO with Keycloak, OIDC, and role mapping to your app.

**For the in-app auth integration**, use the [`auth` module](../../modules/auth/MODULE.md) with `sso.enabled: true` or `idp_federation.enabled: true`. The module handles the Laravel SSO/OIDC flows ([`modules/auth/impl/laravel.md`](../../modules/auth/impl/laravel.md)) and React login UI ([`modules/auth/impl/react.md`](../../modules/auth/impl/react.md)). Use this skill for **Keycloak infrastructure setup** only.

## Checklist
- Create realm, clients, and redirect URIs in Keycloak admin
- Configure OIDC flows and token lifetimes
- Map roles and groups into claims
- For in-app login/logout flows, implement the `auth` module with `idp_federation.enabled: true` — it handles OIDC callback, user provisioning, and role mapping
- Set env vars referenced by auth module: `IDP_OIDC_ISSUER`, `IDP_OIDC_CLIENT_ID`, `IDP_OIDC_CLIENT_SECRET`
- Add tests and local dev strategy (Keycloak in Docker Compose)

## Module references
- **Spec:** [`modules/auth/MODULE.md`](../../modules/auth/MODULE.md) — see `idp_federation` config section
- **Laravel impl:** [`modules/auth/impl/laravel.md`](../../modules/auth/impl/laravel.md) — IDP federation service, callback handling
