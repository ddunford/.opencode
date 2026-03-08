---
description: Scaffold a React Native Expo app with navigation and secure storage
agent: build
---
# React Native scaffold (Expo)

## When to use
Use when starting a new React Native app with Expo. Run this after `/bootstrap-from-spec` and `/plan-review` have produced approved plans.

---

## Scaffold Procedure

### Step 1 — Assess the project directory

The project directory will already contain files from bootstrap (AGENTS.md, SPEC.md, plan/, possibly other config). The scaffold must work in a **non-empty directory**.

**Check what exists:**
```bash
ls -la .
```

Record which of these already exist: `AGENTS.md`, `SPEC.md`, `plan/`, `mobile/`, `app/`, `.gitignore`

**Rule: NEVER delete or overwrite existing files.** The scaffold adds to the directory — it does not replace bootstrap output.

### Step 2 — Create the Expo application

`create-expo-app` requires an empty directory. Handle this by creating in a temp directory and moving:

```bash
# Create Expo app in a temp directory
npx create-expo-app@latest mobile-temp --template tabs

# Move into the mobile/ directory (or whatever the plan specifies)
TARGET_DIR="mobile"  # or "app" — match the plan convention

if [ -d "$TARGET_DIR" ]; then
    # Target dir exists — merge carefully
    cp -rn mobile-temp/* "$TARGET_DIR"/
    cp -rn mobile-temp/.* "$TARGET_DIR"/ 2>/dev/null || true
    rm -rf mobile-temp
else
    mv mobile-temp "$TARGET_DIR"
fi
```

**Critical:** If the target directory already exists:
- Do NOT run `create-expo-app` targeting it directly — it will fail or overwrite files
- Do NOT delete the directory to make room
- Use the temp directory + merge approach above

**After creation, verify:**
```bash
ls $TARGET_DIR/package.json $TARGET_DIR/app.json
# Both must exist
```

### Step 3 — Install dependencies

```bash
cd $TARGET_DIR && npm install

# State management
npm install @tanstack/react-query zustand

# Navigation (if not from template)
npm install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs
npx expo install react-native-screens react-native-safe-area-context

# Secure storage (for auth tokens — NOT AsyncStorage)
npx expo install expo-secure-store

# Environment config
npm install expo-constants

# Dev/testing
npm install -D jest @testing-library/react-native @testing-library/jest-dom
```

### Step 4 — Create base directory structure

```
mobile/
├── app/                           # Expo Router file-based routes (if using Expo Router)
│   ├── _layout.tsx                # Root layout
│   ├── index.tsx                  # Home screen
│   ├── (auth)/                    # Auth screens
│   │   ├── login.tsx
│   │   └── register.tsx
│   └── (tabs)/                    # Tabbed screens
│       ├── _layout.tsx            # Tab navigator
│       └── index.tsx
├── src/
│   ├── components/                # Reusable components
│   ├── hooks/                     # Custom hooks
│   ├── services/                  # API client
│   │   └── api.ts                 # Axios/fetch instance
│   ├── stores/                    # Zustand stores
│   ├── types/                     # TypeScript interfaces
│   └── lib/                       # Utilities
├── assets/                        # Images, fonts
├── app.json                       # Expo config
├── app.config.ts                  # Dynamic Expo config
├── tsconfig.json
└── package.json
```

### Step 5 — Configure environment variables

Set up `app.config.ts` for environment-specific config:
```typescript
import 'dotenv/config'

export default {
  expo: {
    // ... base config from app.json
    extra: {
      apiUrl: process.env.API_URL ?? 'http://localhost:8000/api/v1',
      appEnv: process.env.APP_ENV ?? 'development',
    },
  },
}
```

### Step 6 — Set up API client

Create `src/services/api.ts` with:
- Base URL from Expo Constants
- Auth token interceptor (reads from `expo-secure-store`)
- Error response interceptor

### Step 7 — Configure secure storage

Set up `expo-secure-store` for auth tokens:
```typescript
import * as SecureStore from 'expo-secure-store'

export const tokenStorage = {
  getToken: () => SecureStore.getItemAsync('auth_token'),
  setToken: (token: string) => SecureStore.setItemAsync('auth_token', token),
  removeToken: () => SecureStore.deleteItemAsync('auth_token'),
}
```

**Never use AsyncStorage for auth tokens or sensitive data.**

### Step 8 — Set up testing

Configure Jest with React Native Testing Library:
```json
// package.json
"jest": {
  "preset": "jest-expo",
  "setupFilesAfterSetup": ["@testing-library/jest-dom"]
}
```

### Step 9 — Initialise git (if needed)

If no `.git` directory exists at the project root:

```bash
git init
git config core.hooksPath .githooks
```

Create `.gitignore` if missing — include: `.env`, `node_modules/`, `.expo/`, `dist/`, `ios/`, `android/` (if managed workflow)

### Step 10 — Boot and verify

```bash
cd $TARGET_DIR && npx expo start
```

**Verify checklist:**
- [ ] Expo dev server starts without errors
- [ ] App loads on iOS simulator or Android emulator
- [ ] Navigation between screens works
- [ ] API client can reach the backend health endpoint
- [ ] `npm test` runs with 0 failures
- [ ] SecureStore reads/writes work on device

### Step 11 — Initial commit

```bash
git add -A
git commit -m "Scaffold React Native (Expo) app"
```

---

## After scaffolding

The scaffold is complete when the app launches, navigation works, and the API client can reach the backend. Now proceed with Phase 1 tasks.

**Do NOT start implementing module UIs during scaffold.** Module implementation is separate tasks in the plan files.

---

## Module orchestration

When implementing Phase 1+ tasks, read the relevant module's `MODULE.md` (spec) and `impl/mobile.md` (implementation guide).

### Core infrastructure modules
- **Auth:** [`modules/auth/impl/mobile.md`](../../modules/auth/impl/mobile.md) — SecureStore tokens, biometric auth
- **Permissions:** [`modules/permissions/impl/mobile.md`](../../modules/permissions/impl/mobile.md) — permission hooks for RN
- **Settings:** [`modules/settings/impl/mobile.md`](../../modules/settings/impl/mobile.md) — AsyncStorage preferences
- **Feature flags:** [`modules/feature-flags/impl/mobile.md`](../../modules/feature-flags/impl/mobile.md)
- **Push notifications:** [`modules/push-notifications/impl/mobile.md`](../../modules/push-notifications/impl/mobile.md) — expo-notifications, FCM/APNs

### Communication modules
- **Notifications:** [`modules/notifications/impl/mobile.md`](../../modules/notifications/impl/mobile.md)
- **Chat:** [`modules/chat/impl/mobile.md`](../../modules/chat/impl/mobile.md) — FlatList message thread, WebSocket
- **Presence:** [`modules/presence/impl/mobile.md`](../../modules/presence/impl/mobile.md) — AppState heartbeat management

### Mobile-specific modules
- **Offline sync:** [`modules/offline-sync/impl/mobile.md`](../../modules/offline-sync/impl/mobile.md) — NetInfo, queue-and-sync
- **Deep linking:** [`modules/deep-linking/impl/mobile.md`](../../modules/deep-linking/impl/mobile.md) — Universal links, Expo Linking
- **App versioning:** [`modules/app-versioning/impl/mobile.md`](../../modules/app-versioning/impl/mobile.md) — force update prompts
- **In-app purchases:** [`modules/in-app-purchases/impl/mobile.md`](../../modules/in-app-purchases/impl/mobile.md) — expo-iap, StoreKit/Google Play

### Content & storage
- **File storage:** [`modules/file-storage/impl/mobile.md`](../../modules/file-storage/impl/mobile.md) — expo-file-system, presigned uploads
- **Media library:** [`modules/media-library/impl/mobile.md`](../../modules/media-library/impl/mobile.md) — expo-image-picker, camera

### Billing
- **Billing:** [`modules/billing/impl/mobile.md`](../../modules/billing/impl/mobile.md) — mobile billing patterns

## Guides
- `guides/mobile-ux.md` — mobile UX conventions, navigation patterns, touch targets
- `guides/performance.md` — FlatList optimisation, JS thread, lazy loading
- `guides/security.md` — SecureStore, certificate pinning, token handling on mobile
