---
description: Secrets and config management for env vars and leak prevention
agent: build
---
# Secrets and config management for web apps

## When to use
Use when defining env vars, secret storage, and preventing accidental leaks to clients.

## Checklist
- Define env var matrix per environment
- Validate env at startup with typed schema
- Use secret stores, never commit secrets
- Prevent leaking server env vars into client bundles
- Rotate credentials and document the process

## Guides
- `guides/security.md` — secrets management, rotation, vault patterns, never-commit rules
- `guides/deployment.md` — environment-specific config, 12-factor app config
