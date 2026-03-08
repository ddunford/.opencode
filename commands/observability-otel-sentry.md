---
description: Observability setup with OpenTelemetry and Sentry
agent: build
---
# Observability with OpenTelemetry and Sentry

## When to use
Use when wiring tracing, logs, and error reporting across services.

## Checklist
- Define correlation ID strategy
- Add structured logs with redaction rules
- Instrument key spans and endpoints
- Wire Sentry releases and source maps
- Add dashboards and alerts for key SLIs

## Guides
- `guides/observability.md` — structured logging, metrics (RED/USE), distributed tracing, LLM observability, alerting and SLOs

## Module references
- **Error tracking:** [`modules/error-tracking/impl/laravel.md`](../../modules/error-tracking/impl/laravel.md) — Sentry integration, error grouping
- **Queue monitor:** [`modules/queue-monitor/impl/laravel.md`](../../modules/queue-monitor/impl/laravel.md) — Horizon metrics, job failure alerting
- **Analytics:** [`modules/analytics/impl/laravel.md`](../../modules/analytics/impl/laravel.md) — event tracking, funnel data
- **Audit log:** [`modules/audit-log/impl/laravel.md`](../../modules/audit-log/impl/laravel.md) — structured audit events
