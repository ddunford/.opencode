---
description: React performance profiling, memoisation, and bundle splitting
agent: build
---
# React performance and rendering discipline

## When to use
Use when fixing slow pages, re render storms, large lists, or expensive computations.

## Checklist
- Profile before changing code (React DevTools profiler)
- Stabilise props, memoise where it matters
- Fix list rendering and virtualise when needed
- Split bundles and lazy load heavy routes
- Add performance regression checks for critical flows

## Outputs
- A ranked list of bottlenecks and fixes
- Code changes with measurable impact

## Guides
- `guides/performance.md` — Core Web Vitals, code splitting, lazy loading, bundle analysis
- `guides/ui-ux.md` — perceived performance, skeleton screens, loading states
