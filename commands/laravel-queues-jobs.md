---
description: Laravel queues, jobs, idempotency, and retry patterns
agent: build
---
# Laravel queues, jobs, idempotency, retries

## When to use
Use when introducing async work, background processing, or offloading slow tasks.

## Checklist
- Select queue driver and configure per env
- Design jobs to be idempotent
- Set retry, backoff, and timeout policy
- Add dead letter strategy and alerting
- Write tests for job dispatch and handler behaviour

## Guides
- `guides/architecture.md` — async processing patterns, queue-based decoupling
- `guides/performance.md` — queue worker tuning, job batching, rate limiting

## Key modules
- `modules/notifications/` — notification dispatch jobs
- `modules/email/` — email send jobs
- `modules/file-storage/` — async file processing jobs
- `modules/queue-monitor/` — Horizon setup and job monitoring
- `modules/webhooks-outbound/` — webhook delivery job retry patterns
