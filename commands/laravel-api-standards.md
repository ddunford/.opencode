---
description: Laravel API standards for responses, errors, pagination, and filtering
agent: build
---
# Laravel API standards, errors, pagination, filtering

## When to use
Use when building or refactoring APIs to be consistent across clients.

## Checklist
- Define response envelope conventions
- Define error shape and validation error format
- Standardise pagination shape and query params
- Standardise filtering and sorting conventions
- Add rate limiting rules for sensitive endpoints

## Outputs
- Example controller responses and resources
- OpenAPI compatible shapes

## Guides
- `guides/api-design.md` — REST conventions, error formats, versioning, pagination, webhook design

## Module references
- **API keys:** [`modules/api-keys/impl/laravel.md`](../../modules/api-keys/impl/laravel.md) — key middleware, scope validation
- **Rate limiting:** [`modules/rate-limiting/impl/laravel.md`](../../modules/rate-limiting/impl/laravel.md) — per-key throttle middleware
- **Webhooks outbound:** [`modules/webhooks-outbound/impl/laravel.md`](../../modules/webhooks-outbound/impl/laravel.md) — event-driven webhook dispatch
- **Webhooks inbound:** [`modules/webhooks-inbound/impl/laravel.md`](../../modules/webhooks-inbound/impl/laravel.md) — HMAC verification, idempotency
- **OAuth server:** [`modules/oauth-server/impl/laravel.md`](../../modules/oauth-server/impl/laravel.md) — Passport setup, token issuance
