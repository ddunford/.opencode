---
description: Laravel testing patterns with Pest, factories, and isolation
agent: build
---
# Laravel testing, environment setup, and isolation

## When to use
Use when adding tests, stabilising flaky tests, or standardising testing patterns.

## Checklist
- Use Pest where possible, keep tests fast
- Isolate database state per test suite
- Use factories and a test data builder pattern
- Use Http fake for external calls with contract tests
- Test auth boundaries and key failure modes

## Outputs
- Baseline test config, helpers, and patterns

## Guides
- `guides/testing.md` — test pyramid, Pest patterns, HTTP test helpers, factory setup, test isolation
