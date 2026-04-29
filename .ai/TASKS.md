# Task Board

## Now

### Verify Gebar frontend package helpers

- Goal: confirm the browser, React, and Next.js GebarBilling helpers fit the app's client-button checkout flow.
- Files likely involved: `lib/payments/browser.ts`, `components/billing/checkout-button.tsx`, `components/billing/portal-button.tsx`, `app/(dashboard)/pricing/page.tsx`
- Acceptance criteria: `@gebarbilling/js` redirect helpers work, React package provider/button integration is understood, Next.js package helper compatibility is verified, and any fallback redirect logic is replaced if the SDK supports it.
- Validation command if known: `pnpm build`

### Harden Gebar webhook route

- Goal: make webhook verification and event handling safe for production.
- Files likely involved: `app/api/gebar/webhook/route.ts`, `lib/payments/gebar.ts`, `lib/db/queries.ts`
- Acceptance criteria: missing or invalid signatures return `400`, verified events are logged, and subscription state updates by billing customer ID.
- Validation command if known: `pnpm test:gebar`

### Document the auth hybrid state

- Goal: make the Better Auth + custom login/signup split explicit so future work does not assume the migration is complete.
- Files likely involved: `.ai/AUTH.md`, `.ai/PROJECT_CONTEXT.md`, `.ai/ARCHITECTURE.md`, `app/(login)/actions.ts`, `lib/auth.ts`
- Acceptance criteria: docs clearly describe current auth files, protected route logic, and known gaps.
- Validation command if known: `pnpm build`

### Normalize environment documentation

- Goal: keep every discovered env var documented in one place.
- Files likely involved: `.ai/ENVIRONMENT.md`, `.env.example`, `.env.local.example`, `lib/env.ts`
- Acceptance criteria: all required and optional variables are listed with server/client exposure notes.
- Validation command if known: none; manual doc review

## Next

### Add admin dashboard plan

- Goal: document the intended super-admin surface before implementing it.
- Files likely involved: `.ai/ADMIN_DASHBOARD.md`, `app/` route files when implementation starts
- Acceptance criteria: admin pages, access rules, and audit requirements are described.
- Validation command if known: none

### Add usage tracking design

- Goal: define tenant-level usage counters without tying the app to provider-specific metering too early.
- Files likely involved: `.ai/ARCHITECTURE.md`, `.ai/DATABASE.md`, future app routes or schema files
- Acceptance criteria: usage entities and tenant scope are documented.
- Validation command if known: none

### Review tenant scoping helpers

- Goal: ensure tenant and organization access rules are consistent across routes and server actions.
- Files likely involved: `lib/tenant.ts`, `lib/db/queries.ts`, `.ai/MULTI_TENANCY.md`
- Acceptance criteria: docs match current helper behavior and identify where authorization still needs improvement.
- Validation command if known: `pnpm build`

## Later

### Complete Better Auth migration

- Goal: finish the migration so custom login/signup code is no longer the primary auth path.
- Files likely involved: `lib/auth.ts`, `app/(login)/*`, `app/api/auth/[...all]/route.ts`, `lib/db/schema.ts`
- Acceptance criteria: auth flow, session flow, and UI are consistent with one provider.
- Validation command if known: `pnpm build`

### Add stronger test coverage

- Goal: add focused tests for billing, tenant isolation, and auth/session behavior.
- Files likely involved: `scripts/`, future `tests/` directory, `lib/payments/*`, `lib/tenant.ts`
- Acceptance criteria: critical flows have repeatable automated checks.
- Validation command if known: `pnpm test:gebar`

### Tighten webhook observability

- Goal: make it easy to debug live Gebar events.
- Files likely involved: `app/api/gebar/webhook/route.ts`, `lib/payments/gebar.ts`, logging utilities if added
- Acceptance criteria: payload shape and event handling can be traced without exposing secrets.
- Validation command if known: none

## Parking Lot

### Consider a dedicated lint script

- Goal: add a project-level lint command if the repository standardizes on one.
- Files likely involved: `package.json`, ESLint config files if present
- Acceptance criteria: lint runs consistently in CI and locally.
- Validation command if known: `pnpm lint` if added

### Consider a dedicated e2e suite

- Goal: cover the sign-in, pricing, checkout, and webhook flows end-to-end when the project matures.
- Files likely involved: future `tests/e2e/` or Playwright config if added
- Acceptance criteria: main user journey is covered by repeatable browser tests.
- Validation command if known: none yet
