---
description: FastAPI API standards for errors, pagination, and filtering
agent: build
---
# FastAPI API standards, errors, pagination, filtering

## When to use
Use when building or refactoring FastAPI APIs to be consistent across clients.

## Checklist
- Define response envelope conventions (success wrapper, error shape)
- Standardise error responses with Pydantic error models and exception handlers
- Standardise pagination using `limit`/`offset` or cursor-based with consistent response shape
- Standardise filtering and sorting with query parameter conventions
- Add rate limiting for sensitive endpoints (slowapi or custom middleware)
- Generate OpenAPI schema automatically and verify it matches conventions

## Outputs
- Pydantic response/error models
- Exception handler middleware
- Pagination dependency (reusable `Depends()`)
- OpenAPI-compatible schemas

## Guides
- `guides/api-design.md` — REST conventions, error formats, versioning, pagination, webhook design
- `guides/security.md` — input validation, rate limiting, auth header conventions

## Module references
- **API keys:** `modules/api-keys/impl/fastapi.md` — key middleware, scope validation
- **Rate limiting:** `modules/rate-limiting/impl/fastapi.md` — per-key throttle middleware
- **Webhooks outbound:** `modules/webhooks-outbound/impl/fastapi.md` — event-driven webhook dispatch
- **Webhooks inbound:** `modules/webhooks-inbound/impl/fastapi.md` — HMAC verification, idempotency
