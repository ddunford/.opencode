---
description: Monorepo hygiene with pnpm, Nx, or Turborepo
agent: build
---
# Monorepo hygiene with pnpm and Nx or Turborepo

## When to use
Use when maintaining a monorepo, improving CI speed, or enforcing module boundaries.

## Checklist
- Use workspace protocol for internal deps
- Centralise versions with pnpm overrides or catalogs
- Set up affected builds and caching in CI
- Enforce module boundaries with lint rules
- Keep build pipelines deterministic

## Guides
- `guides/architecture.md` — monorepo vs multi-repo trade-offs, package boundary design
- `guides/deployment.md` — affected builds, independent service deployment from monorepo
