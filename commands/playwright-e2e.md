---
description: Playwright E2E testing for critical user journeys
agent: build
---
# Playwright E2E testing

## When to use
Use when adding end to end tests for critical user journeys and CI stability.

## Checklist
- Pick only critical flows, avoid broad coverage
- Create stable selectors and test IDs
- Use storage state for auth when safe
- Make tests deterministic, no sleep, wait for events
- Run in CI with retries and artifacts

## Guides
- `guides/testing.md` — E2E strategy, accessibility testing with axe-core, load testing patterns
