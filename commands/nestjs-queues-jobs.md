---
description: NestJS queues with Bull, background jobs, and processing patterns
agent: build
---
# NestJS queues, Bull jobs, and background processing

## When to use
Use when introducing async work, background processing, or offloading slow tasks in a NestJS project.

## Checklist
- Configure @nestjs/bull with Redis connection
- Create processor classes with @Process() decorators
- Design jobs to be idempotent (safe to retry)
- Set retry, backoff, and timeout policies per queue
- Add dead letter strategy and alerting for failed jobs
- Add Bull Board or Arena for job visibility and debugging
- Write tests for job dispatch (mock the queue) and processor logic (unit test)

## Guides
- `guides/architecture.md` — async processing patterns, queue-based decoupling
- `guides/performance.md` — worker concurrency, job batching, rate limiting

## Key modules
- `modules/notifications/` — notification dispatch jobs
- `modules/email/` — email send jobs
- `modules/file-storage/` — async file processing jobs
- `modules/queue-monitor/` — Bull Board setup and job monitoring
- `modules/webhooks-outbound/` — webhook delivery retry patterns
