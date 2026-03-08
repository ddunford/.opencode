---
description: Traefik routing labels for Docker Compose with dev and production patterns
agent: build
---
# Traefik routing for Docker Compose services

## When to use
Use when adding Traefik labels to a docker-compose service, setting up dev/production routing, or debugging SSL/routing errors with Cloudflare.

## Process

1. **Identify the services** that need external access (API, frontend, storage, etc.)
2. **Add dev labels** to `docker-compose.yml`
3. **Add production overrides** to `docker-compose.production.yml`
4. **Configure the Traefik network** as external

## Dev labels pattern

Check `~/.claude/local/traefik.md` for this machine's network name, domains, and certresolver.

```yaml
services:
  nginx: # or whichever service faces Traefik
    networks:
      - internal
      - ${TRAEFIK_NETWORK}
    labels:
      traefik.enable: "true"
      traefik.docker.network: "${TRAEFIK_NETWORK}"
      # Router
      traefik.http.routers.{project}-{name}.rule: "Host(`${DEV_DOMAIN}`)"
      traefik.http.routers.{project}-{name}.entrypoints: "websecure"
      traefik.http.routers.{project}-{name}.tls.certresolver: "${DEV_CERTRESOLVER}"
      # Service
      traefik.http.services.{project}-{name}.loadbalancer.server.port: "80"

networks:
  internal:
    driver: bridge
  ${TRAEFIK_NETWORK}:
    external: true
```

## Production override pattern

```yaml
# docker-compose.production.yml
services:
  nginx:
    labels:
      # Disable dev router
      traefik.http.routers.{project}-{name}.rule: "Host(`disabled.invalid`)"
      # Production router
      traefik.http.routers.{project}-{name}-prod.rule: "Host(`${DOMAIN}`)"
      traefik.http.routers.{project}-{name}-prod.entrypoints: "websecure"
      traefik.http.routers.{project}-{name}-prod.tls.certresolver: "letsencrypt"
      traefik.http.routers.{project}-{name}-prod.service: "{project}-{name}"
```

## Multi-router (API + frontend + storage on same service)

When multiple routers point to the same container, **every router must have an explicit `.service`** or Traefik errors with "cannot link with multiple Services".

```yaml
labels:
  # Router 1: API
  traefik.http.routers.{project}-api.rule: "Host(`...`) && PathPrefix(`/api`)"
  traefik.http.routers.{project}-api.service: "{project}-svc"
  # Router 2: Frontend
  traefik.http.routers.{project}-web.rule: "Host(`...`)"
  traefik.http.routers.{project}-web.service: "{project}-svc"
  # Single service definition
  traefik.http.services.{project}-svc.loadbalancer.server.port: "80"
```

## Cloudflare requirements

- SSL mode **must be Full** (not Flexible) — Flexible causes infinite redirect loops
- API token needs **Zone:DNS:Edit** for all domains used
- Dev domains and certresolver: see `~/.claude/local/traefik.md`
- Prod domains: custom domain with certresolver `letsencrypt`

## Debugging checklist

| Symptom | Cause | Fix |
|---------|-------|-----|
| 525 SSL Handshake | Wrong certresolver or missing CF zone access | Use `letsencrypt` in prod, verify token covers domain |
| Too many redirects | Cloudflare SSL = Flexible | Set to Full |
| "cannot link with multiple Services" | Multiple routers, no explicit `.service` | Add `.service` to every router |
| 429 rate limited | Too many failed ACME challenges | Wait ~1 hour, fix config first |
| 404 but router exists | Wrong `docker.network` label | Must match the Traefik external network name |

## Rules

- Always use `${TRAEFIK_NETWORK}` — never hardcode the network name (see `local/traefik.md` for the value)
- Dev certresolver from `local/traefik.md`, production uses `letsencrypt`
- Router names must be globally unique across all compose stacks — prefix with project name
- Production overrides disable dev routers by pointing them at `Host(\`disabled.invalid\`)`
- One `.loadbalancer.server.port` per service, referenced by all routers via `.service`

## Guides
- `guides/deployment.md` — reverse proxy patterns, TLS termination, zero-downtime routing
- `guides/security.md` — TLS configuration, HSTS, certificate management

## Key modules
- `modules/rate-limiting/` — Traefik middleware for per-IP throttling (alternative to app-level)
- `modules/white-labeling/` — custom domain routing per tenant via Traefik rules
