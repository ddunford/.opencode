---
description: Docker builds, optimisation, and compose debugging
agent: build
---
# Docker builds, optimisation, and compose debugging

## When to use
Use when containerising apps, shrinking images, or debugging compose networking and volumes.

## Checklist
- Use multi stage builds and minimal base images
- Run as non root, set proper file ownership
- Cache dependencies and avoid invalidating layers
- Use healthchecks and dependency ordering carefully
- Debug compose: networks, ports, volumes, env, DNS

## Guides
- `guides/deployment.md` — container deployment strategies, health checks, multi-stage builds
- `guides/security.md` — Docker security, non-root users, secrets in containers

## Key modules
- `modules/error-tracking/` — Sentry container config
- `modules/queue-monitor/` — Horizon worker container setup
- `modules/feature-flags/` — environment-based flag overrides
