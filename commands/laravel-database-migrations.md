---
description: Laravel migrations for production safety with rollback plans
agent: build
---
# Laravel migrations for production safety

## When to use
Use when writing schema changes, especially on large tables.

## Checklist
- Plan safe steps: add nullable first, backfill, then enforce
- Add the right indexes for query patterns
- Avoid long locks, use online strategies where possible
- Write a rollback plan that actually works
- Test migration on a realistic dataset size if possible

## Guides
- `guides/data-modeling.md` — schema design, normalization, temporal patterns, partitioning
- `guides/deployment.md` — zero-downtime migrations, expand/contract pattern, online index creation

## Module references
- **Tenancy:** [`modules/tenancy/impl/laravel.md`](../../modules/tenancy/impl/laravel.md) — tenant-scoped migrations, foreign keys
- **Versioning:** [`modules/versioning/impl/laravel.md`](../../modules/versioning/impl/laravel.md) — version history table migrations
- **Audit log:** [`modules/audit-log/impl/laravel.md`](../../modules/audit-log/impl/laravel.md) — audit trail schema and indexes
- **Search:** [`modules/search/impl/laravel.md`](../../modules/search/impl/laravel.md) — full-text index migrations
