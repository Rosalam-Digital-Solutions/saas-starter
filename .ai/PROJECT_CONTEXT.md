# Project Context

## Project Name

GebarBilling Next.js SaaS Starter

## Repository Purpose

This repository is a SaaS starter template built around Next.js, Postgres, Drizzle ORM, and GebarBilling. It is intended to demonstrate a billing-enabled SaaS foundation with auth, tenant-style organization flows, and webhook-driven subscription state.

## Current Stack

- Next.js App Router
- React 19
- TypeScript
- Postgres
- Drizzle ORM
- shadcn-style UI components
- GebarBilling SDK
- Better Auth packages are installed

## Package Manager

pnpm

## Main Framework

Next.js App Router

## Main App Structure

- `app/` for routes, layouts, and server actions
- `components/` for UI primitives
- `lib/` for auth, tenant, database, and billing logic
- `scripts/` for local maintenance and smoke tests

## Current Authentication System

Hybrid / partially migrated.

- Better Auth is configured in `lib/auth.ts` and used by middleware and request helpers.
- Custom sign-in and sign-up server actions still exist in `app/(login)/actions.ts`.
- The current login actions appear incomplete relative to the Better Auth setup, so auth flows need careful review before changes.

## Current Database / ORM

- Postgres
- Drizzle ORM
- Schema lives in `lib/db/schema.ts`
- Migration assets live in `lib/db/migrations/`

## Current External Services

- GebarBilling for checkout, portal, and webhook handling
- Vercel is referenced in the README as the likely deployment target

## Main User Flows

1. Landing page and marketing copy
2. Pricing page with GebarBilling plans
3. Sign in / sign up
4. Dashboard access and tenant-style organization views
5. Billing checkout callback and customer portal
6. Webhook-driven subscription updates
7. Account and security settings
8. Activity log viewing

## Current Development Status

Starter-level and partially implemented.

- Core app routes exist.
- Auth is hybrid and should be treated as a migration area.
- Billing is implemented but webhook hardening is still needed.
- There is no formal admin dashboard yet.
- Tests are limited to scripts and manual flows.

## Important Known Risks or Incomplete Areas

- Custom auth actions and Better Auth may not yet be fully aligned.
- The webhook handler uses dynamic `require()` and should be hardened.
- Tenant and organization naming is mixed across code and docs.
- Sensitive operations still rely on conventions instead of a fully centralized policy layer.
- There is no dedicated lint script or test suite script in `package.json`.

## Recommended First Files for Future AI Agents to Inspect

1. `README.md`
2. `package.json`
3. `lib/auth.ts`
4. `lib/tenant.ts`
5. `lib/db/schema.ts`
6. `lib/db/queries.ts`
7. `lib/payments/gebar.ts`
8. `app/api/gebar/webhook/route.ts`
9. `app/api/gebar/checkout/route.ts`
10. `app/(login)/actions.ts`
