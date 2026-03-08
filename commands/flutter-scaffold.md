---
description: Scaffold a new Flutter project with Riverpod and GoRouter
agent: build
---
# Flutter project scaffold

## When to use
Run at the start of a new Flutter project. Run this after `/bootstrap-from-spec` and `/plan-review` have produced approved plans.

---

## Scaffold Procedure

### Step 1 — Assess the project directory

The project directory will already contain files from bootstrap (AGENTS.md, SPEC.md, plan/, possibly other config). The scaffold must work in a **non-empty directory**.

**Check what exists:**
```bash
ls -la .
```

Record which of these already exist: `AGENTS.md` or `CLAUDE.md`, `SPEC.md`, `plan/`, `mobile/`, `android/`, `ios/`, `.gitignore`

**Rule: NEVER delete or overwrite existing files.** The scaffold adds to the directory — it does not replace bootstrap output.

### Step 2 — Create the Flutter project

`flutter create` requires a clean target. Handle this by creating in a temp directory and moving:

```bash
# Create Flutter project in a temp directory
flutter create --org com.example --project-name app_name --platforms ios,android flutter-temp

# Move into the mobile/ directory (or whatever the plan specifies)
TARGET_DIR="mobile"  # or "flutter", "app" — match the plan convention

if [ -d "$TARGET_DIR" ]; then
    # Target dir exists — merge carefully
    cp -rn flutter-temp/* "$TARGET_DIR"/
    cp -rn flutter-temp/.* "$TARGET_DIR"/ 2>/dev/null || true
    rm -rf flutter-temp
else
    mv flutter-temp "$TARGET_DIR"
fi
```

**Critical:** If the target directory already exists:
- Do NOT run `flutter create` targeting it directly — it will overwrite files
- Do NOT delete the directory to make room
- Use the temp directory + merge approach above

**After creation, verify:**
```bash
ls $TARGET_DIR/pubspec.yaml $TARGET_DIR/lib/main.dart
# Both must exist
```

### Step 3 — Set up project structure

```
lib/
├── app.dart                  # MaterialApp + GoRouter setup
├── main.dart                 # Entry point, ProviderScope
├── core/
│   ├── config/               # Environment config, constants
│   ├── network/              # Dio client, interceptors, API base
│   ├── storage/              # Drift database, secure storage helpers
│   ├── theme/                # ThemeData, design tokens, text styles
│   └── utils/                # Extensions, formatters, validators
├── features/
│   └── {feature}/
│       ├── data/             # Repositories, data sources, DTOs
│       ├── domain/           # Models, enums, interfaces
│       └── presentation/     # Screens, widgets, providers
├── shared/
│   ├── widgets/              # Reusable UI components
│   └── providers/            # App-wide providers (auth state, connectivity)
└── l10n/                     # Localisation ARB files
```

### Step 4 — Install core dependencies

Add to `pubspec.yaml`:
- `flutter_riverpod` + `riverpod_annotation` + `riverpod_generator` for state management
- `go_router` for navigation
- `dio` + `retrofit` + `retrofit_generator` for networking
- `drift` + `drift_dev` for local database
- `flutter_secure_storage` for credentials
- `freezed` + `freezed_annotation` + `json_serializable` for immutable models
- `build_runner` for code generation

```bash
cd $TARGET_DIR && flutter pub get
```

### Step 5 — Configure networking

- Create a Dio client with base URL from environment config
- Add interceptors: auth token injection, error mapping, logging (debug only)
- Create a typed API client interface with retrofit

### Step 6 — Configure navigation

- Set up GoRouter with shell routes for tab navigation
- Add route guards for authenticated routes
- Configure deep link handling

### Step 7 — Configure theming

- Define light and dark ThemeData
- Extract design tokens (colours, spacing, typography) to constants
- Set up Material 3 colour scheme from seed colour

### Step 8 — Set up testing

- Configure `flutter_test` with a test helper for ProviderScope wrapping
- Add `mockito` + `build_runner` for mock generation
- Create a test fixture for the Dio client (mock interceptor)
- Add `integration_test/` directory for E2E flows

### Step 9 — Initialise git (if needed)

If no `.git` directory exists at the project root:

```bash
git init
git config core.hooksPath .githooks
```

Create `.gitignore` if missing — include: `.dart_tool/`, `build/`, `.flutter-plugins`, `.packages`, `*.iml`, `.idea/`

### Step 10 — Boot and verify

- [ ] `flutter analyze` passes with no issues
- [ ] `flutter test` runs (even if no tests yet)
- [ ] App launches on both iOS simulator and Android emulator
- [ ] GoRouter navigation works between placeholder screens
- [ ] Dio client successfully calls backend health endpoint

### Step 11 — Initial commit

```bash
git add -A
git commit -m "Scaffold Flutter project with Riverpod + GoRouter"
```

---

## After scaffolding

The scaffold is complete when the app launches, navigation works, and the API client can reach the backend. Now proceed with Phase 1 tasks.

**Do NOT start implementing module UIs during scaffold.** Module implementation is separate tasks in the plan files.

---

## Module references

When implementing Phase 1+ tasks, read the relevant module's `MODULE.md` (spec) and `impl/flutter.md` (implementation guide).

- **Auth:** `modules/auth/impl/flutter.md` — login/register screens, token persistence
- **Notifications:** `modules/notifications/impl/flutter.md` — in-app notification centre
- **Push:** `modules/push-notifications/impl/flutter.md` — FCM/APNs setup
- **Offline sync:** `modules/offline-sync/impl/flutter.md` — queue-and-sync pattern
- **Deep linking:** `modules/deep-linking/impl/flutter.md` — route-based deep links
- **App versioning:** `modules/app-versioning/impl/flutter.md` — force update prompts

## Guides
- `guides/mobile-ux.md` — thumb zones, gestures, offline patterns
- `guides/security.md` — secure storage, token management
- `guides/testing.md` — widget test patterns, integration testing
