---
description: Scaffold a new Laravel project with Docker infrastructure
agent: build
---
# Laravel project scaffold

## When to use
Use when starting a new Laravel backend. Run this after `/bootstrap-from-spec` and `/plan-review` have produced approved plans.

---

## Scaffold Procedure

### Step 1 — Assess the project directory

The project directory will already contain files from bootstrap (AGENTS.md, SPEC.md, plan/, possibly docker-compose.yml). The scaffold must work in a **non-empty directory**.

**Check what exists:**
```bash
ls -la .
```

Record which of these already exist: `AGENTS.md` or `CLAUDE.md`, `SPEC.md`, `plan/`, `docker-compose.yml`, `backend/`, `frontend/`, `ctl.sh`, `.env`, `.gitignore`

**Rule: NEVER delete or overwrite existing files.** The scaffold adds to the directory — it does not replace bootstrap output.

### Step 2 — Create the Laravel application

Laravel's `create-project` requires an empty directory. Handle this by creating in a temp directory and moving:

```bash
# Create Laravel in a temp directory
composer create-project laravel/laravel backend-temp --prefer-dist --no-interaction

# Move into the backend/ directory (create if needed, merge if exists)
# If backend/ already has files (Dockerfile, docker/), merge carefully
if [ -d "backend" ]; then
    # Backend dir exists with docker config — move Laravel files around it
    cp -rn backend-temp/* backend/
    cp -rn backend-temp/.* backend/ 2>/dev/null || true
    rm -rf backend-temp
else
    mv backend-temp backend
fi
```

**Critical:** This is the most common failure point. If `backend/` already exists with Docker files:
- Do NOT run `composer create-project` targeting `backend/` directly — it will fail on non-empty directory
- Do NOT delete `backend/` to make room — it has Docker config that was already written
- Use the temp directory + merge approach above

**After creation, verify:**
```bash
ls backend/artisan backend/composer.json backend/app backend/routes
# All must exist
```

### Step 3 — Initialise git

If no `.git` directory exists at the project root:

```bash
git init
git config core.hooksPath .githooks

# Create .gitignore if missing
# Add: .env, vendor/, node_modules/, storage/*.key, .idea/, .vscode/
```

### Step 4 — Create ctl.sh

Create `ctl.sh` at the project root following the AGENTS.md template. Must include at minimum:

| Command | What it does |
|---------|-------------|
| `up` | `docker compose up -d` |
| `down` | `docker compose down` |
| `logs [service]` | `docker compose logs -f` |
| `shell [service]` | `docker compose exec {service} bash` |
| `migrate` | `docker compose exec app php artisan migrate` |
| `migrate:fresh` | With confirmation prompt |
| `seed` | `docker compose exec app php artisan db:seed` |
| `tinker` | `docker compose exec app php artisan tinker` |
| `test` | `docker compose exec app php artisan test` |
| `artisan [...]` | Pass-through to artisan |
| `composer [...]` | Pass-through to composer |
| `rebuild` | `docker compose build --no-cache` |
| `status` | `docker compose ps` |
| `help` | List all commands |

```bash
chmod +x ctl.sh
```

### Step 5 — Create Docker infrastructure

If `docker-compose.yml` doesn't exist, create it. If it exists (from a previous partial scaffold), verify it's complete.

**Required services:**
- `postgres` — PostgreSQL 16 with health check
- `redis` — Redis 7 with health check
- `minio` — S3-compatible storage with health check
- `app` — PHP-FPM (build from backend/Dockerfile, target: development)
- `nginx` — Reverse proxy with Traefik labels
- `queue` — Queue worker
- `scheduler` — Cron via `artisan schedule:work`

**If `backend/Dockerfile` doesn't exist**, create the multi-stage Dockerfile (base → dependencies → development → production) per AGENTS.md patterns.

**If `backend/docker/` config doesn't exist**, create nginx config and PHP ini files.

### Step 6 — Create .env and .env.example

```bash
# Copy Laravel's default .env
cp backend/.env.example .env

# Add project-specific vars to both .env and .env.example
```

Required additions beyond Laravel defaults:
- `DB_CONNECTION=pgsql` and PostgreSQL connection details
- `QUEUE_CONNECTION=redis`
- `CACHE_STORE=redis`
- `SESSION_DRIVER=redis`
- MinIO/S3 credentials
- Traefik domain
- Any AI service URLs (if ai-llm module is used)

**Rule:** `.env.example` has placeholder values. `.env` has working local dev values matching docker-compose.

### Step 7 — Create pre-commit credential guard

```bash
mkdir -p .githooks
```

Create `.githooks/pre-commit` that:
1. Reads secret values from `.env`
2. Scans staged files for those literal values
3. Blocks the commit if any are found

```bash
chmod +x .githooks/pre-commit
git config core.hooksPath .githooks
```

### Step 8 — Configure Laravel

```bash
# Inside the app container (or via ctl.sh):
./ctl.sh artisan key:generate
```

Update `config/database.php`, `config/cache.php`, `config/queue.php`, `config/filesystems.php` to use PostgreSQL, Redis, and S3/MinIO defaults.

Install base packages:
```bash
./ctl.sh composer require laravel/horizon
./ctl.sh composer require laravel/sanctum    # if auth module used
./ctl.sh composer require pestphp/pest --dev
./ctl.sh composer require pestphp/pest-plugin-laravel --dev
```

**Configure test database:**
- Verify `phpunit.xml` sets `<env name="DB_DATABASE" value="testing"/>` (Laravel default)
- Create `.env.testing` with `DB_DATABASE=testing` and other test-specific values
- Tests MUST use a separate database — never the development database
- Laravel's `RefreshDatabase` trait handles creation and migration automatically
- Do NOT use SQLite for feature/integration tests — use PostgreSQL to match production

### Step 9 — Create base directory structure

```
backend/
├── app/
│   ├── Http/Controllers/Api/V1/    # API controllers
│   ├── Models/                      # Eloquent models
│   ├── Services/                    # Business logic by domain
│   ├── Jobs/                        # Queue jobs
│   └── Policies/                    # Authorization policies
├── routes/
│   └── api.php                      # API routes (version-prefixed)
├── database/
│   ├── migrations/
│   └── factories/
└── tests/
    ├── Unit/
    └── Feature/
```

Create the health endpoint:
```php
// routes/api.php
Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'timestamp' => now()->toISOString(),
    ]);
});
```

### Step 10 — Boot and verify

```bash
./ctl.sh up
./ctl.sh migrate
curl -s https://{domain}/api/health   # or via docker network
```

**Verify checklist:**
- [ ] `./ctl.sh up` starts all services without errors
- [ ] `./ctl.sh status` shows all services healthy
- [ ] `./ctl.sh migrate` runs without errors
- [ ] Health endpoint returns 200
- [ ] `./ctl.sh test` runs Pest with 0 failures
- [ ] `.githooks/pre-commit` is executable and configured

### Step 11 — Initial commit

```bash
git add -A
git commit -m "Scaffold Laravel project with Docker infrastructure"
```

---

## After scaffolding

The scaffold is complete when the project boots, the health endpoint responds, and tests pass. Now proceed with Phase 1 tasks — the scaffold covers `TASK-X.1` (scaffold and verify project boots).

**Do NOT start implementing modules during scaffold.** Module implementation is separate tasks in the plan files. The scaffold only creates the empty Laravel project with infrastructure.

---

## Module orchestration

This skill also serves as a reference for which modules exist. When implementing Phase 1+ tasks, read the relevant module's `MODULE.md` (spec) and `impl/laravel.md` (implementation guide).

### Core infrastructure modules
- **Auth:** [`modules/auth/`](../../modules/auth/MODULE.md) — login, registration, MFA, social, biometric
- **Permissions:** [`modules/permissions/`](../../modules/permissions/MODULE.md) — RBAC/ABAC, roles, policies (use instead of ad-hoc gates)
- **Tenancy:** [`modules/tenancy/`](../../modules/tenancy/MODULE.md) — multi-tenant row isolation or schema-per-tenant
- **Settings:** [`modules/settings/`](../../modules/settings/MODULE.md) — user and system preferences with cache
- **Feature flags:** [`modules/feature-flags/`](../../modules/feature-flags/MODULE.md) — gradual rollouts, A/B gating
- **Audit log:** [`modules/audit-log/`](../../modules/audit-log/MODULE.md) — append-only activity log

### Identity & access modules
- **SSO/SAML:** [`modules/sso-saml/`](../../modules/sso-saml/MODULE.md) — enterprise SSO, SAML 2.0
- **OAuth server:** [`modules/oauth-server/`](../../modules/oauth-server/MODULE.md) — be an OAuth2 provider
- **Teams:** [`modules/teams/`](../../modules/teams/MODULE.md) — team membership, invitations
- **Org hierarchy:** [`modules/org-hierarchy/`](../../modules/org-hierarchy/MODULE.md) — departments, reporting lines
- **Seat management:** [`modules/seat-management/`](../../modules/seat-management/MODULE.md) — user limits, overage enforcement

### Communication modules
- **Notifications:** [`modules/notifications/`](../../modules/notifications/MODULE.md) — in-app, email, push, SMS notifications
- **Email:** [`modules/email/`](../../modules/email/MODULE.md) — transactional email, template management
- **SMS:** [`modules/sms/`](../../modules/sms/MODULE.md) — Twilio/AWS SMS sending
- **Push notifications:** [`modules/push-notifications/`](../../modules/push-notifications/MODULE.md) — FCM/APNs device tokens, delivery
- **Realtime:** [`modules/realtime/`](../../modules/realtime/MODULE.md) — WebSocket broadcasting via Reverb
- **Chat:** [`modules/chat/`](../../modules/chat/MODULE.md) — direct/group messaging, threads, read receipts
- **Presence:** [`modules/presence/`](../../modules/presence/MODULE.md) — online/away/offline status, typing indicators
- **Announcements:** [`modules/announcements/`](../../modules/announcements/MODULE.md) — in-app banners, dismissal tracking

### Content & media modules
- **File storage:** [`modules/file-storage/`](../../modules/file-storage/MODULE.md) — S3/MinIO uploads, presigned URLs
- **Media library:** [`modules/media-library/`](../../modules/media-library/MODULE.md) — image processing, CDN, collections
- **CMS:** [`modules/cms/`](../../modules/cms/MODULE.md) — content types, drafts, publishing workflow
- **Versioning:** [`modules/versioning/`](../../modules/versioning/MODULE.md) — model history, diff, restore
- **Collaborative editing:** [`modules/collaborative-editing/`](../../modules/collaborative-editing/MODULE.md) — real-time CRDT editing via Yjs

### Search & discovery modules
- **Search:** [`modules/search/`](../../modules/search/MODULE.md) — full-text, vector/semantic search
- **Tags:** [`modules/tags/`](../../modules/tags/MODULE.md) — polymorphic tagging
- **Favorites:** [`modules/favorites/`](../../modules/favorites/MODULE.md) — bookmarks and collections

### Developer tool modules
- **API keys:** [`modules/api-keys/`](../../modules/api-keys/MODULE.md) — key issuance, scopes, rotation, developer portal
- **Webhooks outbound:** [`modules/webhooks-outbound/`](../../modules/webhooks-outbound/MODULE.md) — delivery, retry, HMAC signing
- **Webhooks inbound:** [`modules/webhooks-inbound/`](../../modules/webhooks-inbound/MODULE.md) — receive, verify, queue third-party webhooks
- **Rate limiting:** [`modules/rate-limiting/`](../../modules/rate-limiting/MODULE.md) — per-key/IP throttling
- **Integrations:** [`modules/integrations/`](../../modules/integrations/MODULE.md) — third-party OAuth connections
- **SDK generation:** [`modules/sdk-generation/`](../../modules/sdk-generation/MODULE.md) — OpenAPI-driven SDK and hosted docs
- **Import/export:** [`modules/import-export/`](../../modules/import-export/MODULE.md) — CSV/Excel bulk data operations

### Analytics & monitoring modules
- **Analytics:** [`modules/analytics/`](../../modules/analytics/MODULE.md) — event tracking, funnels, retention
- **Reporting:** [`modules/reporting/`](../../modules/reporting/MODULE.md) — scheduled reports, chart data, export
- **A/B testing:** [`modules/ab-testing/`](../../modules/ab-testing/MODULE.md) — experiment framework, variant assignment
- **Error tracking:** [`modules/error-tracking/`](../../modules/error-tracking/MODULE.md) — Sentry integration
- **Queue monitor:** [`modules/queue-monitor/`](../../modules/queue-monitor/MODULE.md) — Horizon, job metrics

### User experience modules
- **Onboarding:** [`modules/onboarding/`](../../modules/onboarding/MODULE.md) — step flows, checklists, progress
- **Dashboards:** [`modules/dashboards/`](../../modules/dashboards/MODULE.md) — widget-based configurable dashboards
- **Activity feed:** [`modules/activity-feed/`](../../modules/activity-feed/MODULE.md) — user/team event streams
- **Comments:** [`modules/comments/`](../../modules/comments/MODULE.md) — threaded comments on any model
- **Changelog:** [`modules/changelog/`](../../modules/changelog/MODULE.md) — public changelog, RSS, widget embed
- **User feedback:** [`modules/user-feedback/`](../../modules/user-feedback/MODULE.md) — NPS, CSAT, bug reports
- **Localization:** [`modules/localization/`](../../modules/localization/MODULE.md) — i18n, locale detection, translation management
- **Scheduled tasks:** [`modules/scheduled-tasks/`](../../modules/scheduled-tasks/MODULE.md) — user-defined cron jobs

### Commerce & payments modules
- **Billing:** [`modules/billing/`](../../modules/billing/MODULE.md) — Stripe subscriptions, invoices, usage-based
- **Subscriptions:** [`modules/subscriptions/`](../../modules/subscriptions/MODULE.md) — plan management, trials, upgrades
- **Invoicing:** [`modules/invoicing/`](../../modules/invoicing/MODULE.md) — B2B invoices, net terms, AR workflow
- **Orders:** [`modules/orders/`](../../modules/orders/MODULE.md) — order lifecycle, fulfillment, refunds
- **Tax:** [`modules/tax/`](../../modules/tax/MODULE.md) — tax calculation, TaxJar/Stripe Tax
- **Shipping:** [`modules/shipping/`](../../modules/shipping/MODULE.md) — carrier integration, rate calculation
- **Inventory:** [`modules/inventory/`](../../modules/inventory/MODULE.md) — stock management, warehousing
- **Coupons:** [`modules/coupons/`](../../modules/coupons/MODULE.md) — promo codes, discount rules
- **Marketplace:** [`modules/marketplace/`](../../modules/marketplace/MODULE.md) — Stripe Connect, seller payouts
- **Affiliate:** [`modules/affiliate/`](../../modules/affiliate/MODULE.md) — affiliate tracking, commission payouts

### Growth & retention modules
- **Reviews:** [`modules/reviews/`](../../modules/reviews/MODULE.md) — ratings, moderation, aggregates
- **Loyalty:** [`modules/loyalty/`](../../modules/loyalty/MODULE.md) — points, tiers, rewards
- **Referrals:** [`modules/referrals/`](../../modules/referrals/MODULE.md) — referral links, reward attribution
- **Email marketing:** [`modules/email-marketing/`](../../modules/email-marketing/MODULE.md) — campaigns, sequences, list management
- **Waitlist:** [`modules/waitlist/`](../../modules/waitlist/MODULE.md) — signup queue, invite codes

### AI & intelligence modules
- **AI/LLM:** [`modules/ai-llm/`](../../modules/ai-llm/MODULE.md) — LLM integration, prompt management, RAG
- **AI agents:** [`modules/ai-agents/`](../../modules/ai-agents/MODULE.md) — autonomous agent loops, tool use

### Support & CRM modules
- **Support tickets:** [`modules/support/`](../../modules/support/MODULE.md) — helpdesk, SLA, escalation
- **Knowledge base:** [`modules/knowledge-base/`](../../modules/knowledge-base/MODULE.md) — articles, search, feedback
- **CRM:** [`modules/crm/`](../../modules/crm/MODULE.md) — contacts, pipelines, deal tracking

### Compliance modules
- **GDPR/privacy:** [`modules/gdpr-privacy/`](../../modules/gdpr-privacy/MODULE.md) — data portability, right to deletion, consent
- **Audit compliance:** [`modules/audit-compliance/`](../../modules/audit-compliance/MODULE.md) — SOC2/HIPAA/ISO27001 evidence
- **White labeling:** [`modules/white-labeling/`](../../modules/white-labeling/MODULE.md) — custom domains, per-tenant branding

### Mobile-specific modules
- **Offline sync:** [`modules/offline-sync/`](../../modules/offline-sync/MODULE.md) — conflict resolution, queue-and-sync
- **App versioning:** [`modules/app-versioning/`](../../modules/app-versioning/MODULE.md) — force update, soft update prompts
- **Deep linking:** [`modules/deep-linking/`](../../modules/deep-linking/MODULE.md) — universal links, deferred deep links
- **In-app purchases:** [`modules/in-app-purchases/`](../../modules/in-app-purchases/MODULE.md) — StoreKit/Google Play Billing

### B2B & enterprise modules
- **SSO/SAML:** [`modules/sso-saml/`](../../modules/sso-saml/MODULE.md) ← also listed under Identity
- **Document signing:** [`modules/document-signing/`](../../modules/document-signing/MODULE.md) — DocuSign/HelloSign integration
- **Time tracking:** [`modules/time-tracking/`](../../modules/time-tracking/MODULE.md) — timesheets, project tracking
