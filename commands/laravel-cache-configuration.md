---
description: Laravel caching strategy, tagging, and invalidation patterns
agent: build
---
# Laravel caching strategy and configuration

## When to use
Use when choosing cache stores, tagging, invalidation, and performance fixes.

## Checklist
- Choose cache driver per environment
- Define cache keys and tag strategy
- Define invalidation rules tied to writes
- Avoid caching user specific data without scoping
- Test cache behaviour and fallback paths

## Guides
- `guides/performance.md` — caching strategies, cache invalidation, Redis patterns

## Key modules
- `modules/settings/` — settings cached via config cache
- `modules/feature-flags/` — flag evaluation cached in Redis
- `modules/presence/` — presence state uses Redis TTL
- `modules/rate-limiting/` — rate limit counters in Redis
