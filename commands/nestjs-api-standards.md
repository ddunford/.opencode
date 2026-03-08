---
description: NestJS API standards for errors, pagination, and filtering
agent: build
---
# NestJS API standards, errors, pagination, filtering

## When to use
Use when building or refactoring NestJS APIs to be consistent across clients.

## Checklist
- Define response envelope conventions (interceptor-based wrapping)
- Standardise error responses with exception filters and error DTOs
- Standardise pagination using `limit`/`offset` or cursor-based with consistent response shape
- Standardise filtering and sorting with query parameter DTOs and pipes
- Add rate limiting with @nestjs/throttler for sensitive endpoints
- Generate OpenAPI schema with @nestjs/swagger decorators and verify conventions

## Outputs
- Response interceptor for envelope wrapping
- Global exception filter with structured error DTOs
- Pagination DTO and decorator (reusable across controllers)
- OpenAPI-compatible schemas via swagger decorators

## Guides
- `guides/api-design.md` — REST conventions, error formats, versioning, pagination, webhook design
- `guides/security.md` — input validation, rate limiting, guard patterns

## Module references
- **API keys:** `modules/api-keys/impl/node.md` — key guard, scope validation
- **Rate limiting:** `modules/rate-limiting/impl/node.md` — per-key throttle guard
- **Webhooks outbound:** `modules/webhooks-outbound/impl/node.md` — event-driven webhook dispatch
- **Webhooks inbound:** `modules/webhooks-inbound/impl/node.md` — HMAC verification, idempotency
