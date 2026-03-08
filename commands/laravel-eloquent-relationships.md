---
description: Eloquent relationships, eager loading, and N+1 prevention
agent: build
---
# Eloquent relationships and query performance

## When to use
Use when modelling relations, avoiding N+1, and shaping queries for APIs.

## Checklist
- Define relationships explicitly with constraints
- Use eager loading with selected columns
- Avoid N+1 in serializers and resources
- Use scopes for repeated query patterns
- Benchmark hot endpoints and add indexes

## Guides
- `guides/data-modeling.md` — relationship design, normalization, polymorphic patterns
- `guides/performance.md` — N+1 prevention, eager loading strategies
