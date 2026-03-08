---
description: GitHub Actions CI for React and PHP with caching and quality gates
agent: build
---
# GitHub Actions CI for React and PHP

## When to use
Use when setting up CI pipelines, caching, and quality gates.

## Checklist
- Run lint, typecheck, tests, build
- Cache pnpm and composer dependencies
- Split jobs for speed and clear failures
- Upload test reports and coverage artifacts
- Gate merges on required checks

## Guides
- `guides/deployment.md` — CI/CD pipeline design, approval gates, deployment strategies
- `guides/testing.md` — test stages in CI, parallel test execution, coverage gates
- `guides/security.md` — secrets in CI, OIDC for cloud auth, supply chain security

## Key modules
- `modules/feature-flags/` — deployment decoupling with flags instead of long-lived branches
- `modules/error-tracking/` — Sentry release tracking in deploy step
