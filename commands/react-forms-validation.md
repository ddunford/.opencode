---
description: React forms with Zod validation and server error mapping
agent: build
---
# React forms, validation, and server error mapping

## When to use
Use when building complex forms, validation, or aligning frontend errors with backend validation.

## Checklist
- Define Zod schema for form data
- Wire react-hook-form with zod resolver
- Map backend validation errors to fields
- Ensure a11y: labels, aria-describedby, error announcement
- Handle async validation and submit states safely

## Outputs
- Form schema, hook setup, and error mapping helpers

## Guides
- `guides/ui-ux.md` — form UX patterns, inline errors, field labelling, accessible forms
- `guides/security.md` — client-side validation is not enough; always validate server-side
