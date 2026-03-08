---
description: OpenAPI contract-first workflow with typed client generation
agent: build
---
# OpenAPI contract first workflow

## When to use
Use when multiple clients need typed contracts or when stabilising an API.

## Checklist
- Define resources and endpoints in OpenAPI
- Standardise errors, pagination, and auth schemes
- Generate typed clients where appropriate
- Add CI checks for breaking changes
- Keep examples in sync with implementation

## Outputs
- OpenAPI spec sections
- Client generation plan

## Guides
- `guides/api-design.md` — REST design principles, error formats, pagination, webhook specs

## Module references
- **API keys:** [`modules/api-keys/impl/laravel.md`](../../modules/api-keys/impl/laravel.md) — API key auth scheme in OpenAPI
- **SDK generation:** [`modules/sdk-generation/impl/laravel.md`](../../modules/sdk-generation/impl/laravel.md) — OpenAPI → SDK pipeline
- **Webhooks outbound:** [`modules/webhooks-outbound/impl/laravel.md`](../../modules/webhooks-outbound/impl/laravel.md) — webhook payload schemas
- **Rate limiting:** [`modules/rate-limiting/impl/laravel.md`](../../modules/rate-limiting/impl/laravel.md) — throttle headers to document in spec
