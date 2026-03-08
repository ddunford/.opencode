---
description: Ensure backward compatibility when changing APIs, schemas, or client-visible behaviour
agent: build
---
# Backward compatibility discipline

## When to use
Use when changing APIs, schemas, or client visible behaviour that existing users depend on.

## Checklist
- Identify public contracts and consumers
- Add compatibility layer or versioning plan
- Ship behind flags where appropriate
- Add deprecation notices and timelines
- Add tests for old behaviour until removed

## Guides
- `guides/api-design.md` — API versioning, deprecation strategy, breaking vs non-breaking changes
- `guides/deployment.md` — expand/contract migration pattern, phased rollouts
