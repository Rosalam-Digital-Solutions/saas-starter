# Architecture

## 1. High-Level Overview

This is a Next.js App Router SaaS starter with App Router pages, server actions, API routes, a Drizzle/Postgres data layer, and GebarBilling-backed checkout and webhook flows.

```text
User action
↓
Page / server action / API route
↓
Auth + tenant lookup
↓
Database and/or GebarBilling
↓
Response
↓
UI update
```

## 2. Folder Structure

```text
app/
	(dashboard)/
	(login)/
	api/
components/
lib/
	auth.ts
	tenant.ts
	db/
	payments/
scripts/
```

The app is route-grouped into dashboard and login areas, with API endpoints under `app/api/`.

## 3. Request / Data Flow

```text
Browser request
↓
Next.js route or server component
↓
Session lookup via Better Auth
↓
Tenant or membership lookup when needed
↓
Database read/write and/or GebarBilling call
↓
Redirect / JSON response / UI render
```

Tenant-aware requests should check membership before accessing organization data.

## 4. Frontend Architecture

- The landing page lives at `app/(dashboard)/page.tsx`.
- Pricing lives at `app/(dashboard)/pricing/page.tsx` and renders GebarBilling plans.
- Login and sign-up pages live in `app/(login)/`.
- Dashboard settings pages live under `app/(dashboard)/dashboard/`.
- Client components use SWR and server actions where interactive forms are needed.
- The root layout preloads a session fallback for client data access.

```text
Page component
↓
Client form or SWR fetch
↓
Server action / API route
↓
Database or auth helper
```

## 5. Backend / API Architecture

Current API routes:

- `/api/auth/[...all]` for Better Auth handlers
- `/api/user` for current user JSON
- `/api/team` for organization and subscription data
- `/api/gebar/checkout` for checkout callback handling
- `/api/gebar/webhook` for GebarBilling webhook events
- `/api/debug/gebar` for configuration inspection

The backend mixes route handlers, server actions, and shared helpers in `lib/`.

## 6. Database Architecture

The database is modeled with Drizzle in `lib/db/schema.ts` and uses Postgres.

Primary entities:

- `users`
- `sessions`
- `accounts`
- `verifications`
- `organizations`
- `memberships`
- `organization_invitations`
- `subscriptions`
- `plans`
- `entitlements`
- `audit_logs`
- `activity_logs`

```text
User
↓
Membership
↓
Organization
↓
Subscription
↓
Plan / entitlement state
```

## 7. Auth / Session Architecture

Better Auth is configured in `lib/auth.ts` using the Drizzle adapter.

```text
Request headers
↓
auth.api.getSession(...)
↓
Session user
↓
Middleware / route guard / helper
```

Important detail: the repo still contains custom sign-in and sign-up server actions, so the auth layer is hybrid rather than fully normalized.

## 8. External Integrations

- GebarBilling server SDK creates checkout sessions and portal sessions.
- GebarBilling webhook verification is used in the webhook route.
- Vercel is referenced in the README as the deployment target.

```text
Pricing page
↓
GebarBilling checkout
↓
Callback route marks pending
↓
Webhook verifies event
↓
Subscription row updated
```

## 9. Background Jobs / Queues

No background job system or queue implementation is apparent in the repository.

## 10. Deployment Architecture

The project appears intended for Vercel deployment with Postgres and environment variables supplied per environment.

```text
GitHub push
↓
Vercel build
↓
Env vars available
↓
Database migrations run
↓
Production app serves routes
```

## 11. Known Architecture Gaps

- Auth is hybrid: Better Auth exists, but custom login/signup actions still exist.
- The webhook route should be hardened and its payload mapping verified with real Gebar events.
- The app uses both `organization` and `team` language, which can confuse future work.
- No dedicated lint or test runner script is present in `package.json`.
- No formal admin dashboard routes are implemented yet.
