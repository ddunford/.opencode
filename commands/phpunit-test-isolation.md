---
description: PHPUnit and Pest test isolation for flaky test prevention
agent: build
---
# PHPUnit and Pest test isolation patterns

## When to use
Use when tests leak state, depend on order, or behave differently in CI.

## Checklist
- Eliminate shared global state and static caches
- Reset time, random, and env between tests
- Use transactions or refresh database strategy consistently
- Avoid real network calls, use fakes
- Pin dependency versions for reproducibility

## Guides
- `guides/testing.md` — test isolation strategies, database reset patterns, factory setup, test doubles
