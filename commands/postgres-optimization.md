---
description: Postgres query and index optimisation with EXPLAIN ANALYZE
agent: build
---
# Postgres query and index optimisation

## When to use
Use when queries are slow, indexes are missing, or plans regress.

## Checklist
- Capture slow query and parameters
- Use EXPLAIN ANALYZE to confirm bottleneck
- Add or adjust indexes based on filters and joins
- Avoid sequential scans on hot paths when possible
- Recheck after change and document impact

## Guides
- `guides/performance.md` — query optimization, connection pooling, slow query analysis
- `guides/data-modeling.md` — index design, partitioning, temporal data patterns
