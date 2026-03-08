---
description: React Query or SWR data fetching, caching, and invalidation patterns
agent: build
---
# React Query or SWR data fetching patterns

## When to use
Use when standardising server state, caching, invalidation, and optimistic updates.

## Checklist
- Pick library used by repo and follow conventions
- Define query keys and cache boundaries
- Implement pagination and filtering consistently
- Use optimistic updates only when correctness is clear
- Centralise error handling and retries

## Outputs
- Query key conventions
- Example hooks for list and detail reads

## Guides
- `guides/performance.md` — client-side caching, stale-while-revalidate, request deduplication
- `guides/architecture.md` — server state vs client state separation
