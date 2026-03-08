---
description: NestJS testing patterns with Jest, module setup, and mocking
agent: build
---
# NestJS testing, module setup, and mocking

## When to use
Use when adding tests, stabilising flaky tests, or standardising testing patterns in a NestJS project.

## Checklist
- Use Jest + @nestjs/testing for unit and integration tests
- Use supertest for E2E API tests
- Create a TestingModule factory that mirrors the real module graph
- Mock providers with `useValue` or `useFactory` overrides
- Isolate database state per test with transaction rollback or test database
- Use custom test fixtures or factories for test data (prisma seed or builder pattern)
- Test auth boundaries: unauthenticated, wrong role, valid JWT
- Test validation: missing DTO fields, wrong types, boundary values
- Add E2E tests for critical flows (auth, billing, core features)

## Outputs
- Test helper module with mock providers and test database setup
- Factory fixtures for core entities
- Test patterns for CRUD controllers and services

## Guides
- `guides/testing.md` — test pyramid, NestJS testing module setup, mocking providers, factory fixtures
- `guides/security.md` — testing auth guards and permission boundaries
