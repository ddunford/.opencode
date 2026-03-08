---
description: FastAPI testing patterns with pytest, fixtures, and async
agent: build
---
# FastAPI testing, fixtures, and async patterns

## When to use
Use when adding tests, stabilising flaky tests, or standardising testing patterns in a FastAPI project.

## Checklist
- Use pytest + pytest-asyncio with `async_mode = auto`
- Use httpx AsyncClient for API tests (not TestClient for async routes)
- Isolate database state per test with transaction rollback or test database
- Use factory_boy or custom fixtures for test data
- Mock external services with respx or httpx MockTransport
- Test auth boundaries: unauthenticated, wrong role, valid token
- Test validation: missing fields, wrong types, boundary values
- Add integration tests for critical flows (auth, billing, core features)

## Outputs
- conftest.py with async client fixture, DB session override, and auth helpers
- Factory fixtures for core models
- Test patterns for CRUD endpoints

## Guides
- `guides/testing.md` — test pyramid, fixture patterns, async test setup, factory fixtures, test isolation
- `guides/security.md` — testing auth boundaries and permission checks
