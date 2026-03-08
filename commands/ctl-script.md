---
description: Generate a project ctl.sh control script for dockerised projects
agent: build
---
# Generate a project ctl.sh control script

## When to use
Use when scaffolding a new project or adding a `ctl.sh` to an existing dockerised project. Generates a tailored control script based on the project's stack and docker-compose services.

## Process

1. **Detect the stack** — scan for `composer.json` (PHP/Laravel), `package.json` (Node/React), `Dockerfile`, `docker-compose.yml`, and identify services (postgres, redis, minio, nginx, queue workers, etc.)
2. **Generate `ctl.sh`** at the project root using the template below, including only commands relevant to the detected stack
3. **Make executable** — `chmod +x ctl.sh`

## Template structure

```bash
#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colors
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'

# Helpers
log_info()    { echo -e "${BLUE}[INFO]${NC} $*"; }
log_success() { echo -e "${GREEN}[OK]${NC} $*"; }
log_warn()    { echo -e "${YELLOW}[WARN]${NC} $*"; }
log_error()   { echo -e "${RED}[ERROR]${NC} $*" >&2; }

# Production mode: touch .production or export PRODUCTION_MODE=true
PRODUCTION_MODE=false
if [ -f "$SCRIPT_DIR/.production" ] || [ "${PRODUCTION_MODE:-}" = "true" ]; then
    PRODUCTION_MODE=true
fi

dc() {
    if [ "$PRODUCTION_MODE" = true ]; then
        docker compose -f docker-compose.yml -f docker-compose.production.yml "$@"
    else
        docker compose "$@"
    fi
}

wait_for_healthy() {
    local svc=$1 max=60 waited=0
    log_info "Waiting for $svc to be healthy..."
    while [ $waited -lt $max ]; do
        if dc ps "$svc" | grep -q "healthy"; then return 0; fi
        sleep 2; waited=$((waited + 2))
    done
    log_error "$svc did not become healthy in ${max}s"
    return 1
}
```

## Commands to include by stack

### Always (core lifecycle)
- `up` / `down` / `restart` / `logs [service]` / `status` / `rebuild [service]`
- `shell [service]` — exec into a container
- `help` — list all commands

### Laravel / PHP (`composer.json` present)
- `artisan [args]` — `dc exec app php artisan "$@"`
- `composer [args]` — `dc exec app composer "$@"`
- `migrate` — force flag in production, interactive in dev
- `migrate:fresh` — dev only, confirm prompt
- `seed` — `artisan db:seed`
- `tinker` — `artisan tinker`
- `test [args]` — pest or phpunit
- `test:filter <name>` — run single test

### Node / React (`package.json` present)
- `npm [args]` / `pnpm [args]` — exec into frontend container
- `build` — production build

### Database (postgres/mysql service detected)
- `db` — interactive psql/mysql session
- `db:dump [file]` — dump to file with timestamp default
- `db:restore <file>` — restore from dump

### Deployment
- `release [version]` — tag, build production images, push
- `deploy` — pull, migrate, restart (production only)
- `update` — git pull, rebuild, migrate
- `rollback` — revert to previous image tag

## Rules

- **Dangerous commands require confirmation** — `migrate:fresh`, `reset`, `db:restore`, `rollback`
- **Production guards** — `migrate` uses `--force`, `migrate:fresh` is blocked entirely, `tinker` warns
- **Use `dc` helper everywhere** — never call `docker compose` directly
- **Default service names** from docker-compose.yml — don't hardcode, detect from `dc ps`
- **Help command** — auto-generated from all `cmd_*` functions with descriptions
- **Exit codes** — propagate from underlying commands
