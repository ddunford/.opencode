---
description: FastAPI background tasks, Celery, and async worker patterns
agent: build
---
# FastAPI background tasks, Celery, and async workers

## When to use
Use when introducing async work, background processing, or offloading slow tasks in a FastAPI project.

## Checklist
- Choose between FastAPI BackgroundTasks (simple, in-process) and Celery (distributed, persistent)
- Configure Celery with Redis broker and result backend
- Design tasks to be idempotent (safe to retry)
- Set retry, backoff, and timeout policies per task
- Add dead letter strategy and alerting for failed tasks
- Write tests for task dispatch and handler behaviour
- Add Flower or custom monitoring for task visibility

## Guides
- `guides/architecture.md` — async processing patterns, queue-based decoupling
- `guides/performance.md` — worker tuning, task batching, rate limiting

## Key modules
- `modules/notifications/` — notification dispatch tasks
- `modules/email/` — email send tasks
- `modules/file-storage/` — async file processing tasks
- `modules/queue-monitor/` — task monitoring and visibility
- `modules/webhooks-outbound/` — webhook delivery retry patterns
