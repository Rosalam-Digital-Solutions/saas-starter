# Testing SOP

## Commands

- Install dependencies: `pnpm install`
- Start dev server: `pnpm dev`
- Build production bundle: `pnpm build`
- Create Drizzle migrations: `pnpm db:generate`
- Run Drizzle migrations: `pnpm db:migrate`
- Seed local data: `pnpm db:seed`
- Initialize local env setup: `pnpm db:setup`
- Run Gebar smoke test: `pnpm test:gebar`

## What Exists Today

- No dedicated `lint` script is present in `package.json`.
- No dedicated `typecheck` script is present in `package.json`.
- No dedicated unit or e2e test runner script is present in `package.json`.

## Manual Test Flows

- Landing page loads at `/`
- Pricing page loads at `/pricing`
- Sign in works from `/sign-in`
- Sign up works from `/sign-up`
- Dashboard pages load after authentication
- General settings update the account name
- Security page renders password management UI
- `/api/user` returns the current user or `null`
- `/api/team` returns organizations and subscriptions for the signed-in user
- Checkout callback creates or updates pending billing state
- Webhook updates billing state after verification
- Customer portal flow opens when a billing customer exists

## What Must Pass Before Merging

- `pnpm build`
- `pnpm test:gebar` if billing code changed
- `pnpm db:generate` and `pnpm db:migrate` if schema changed
- Manual verification of the touched user journey

## Known Missing Tests

- No automated auth flow tests were found.
- No automated webhook tests were found.
- No automated tenant isolation tests were found.
- No automated billing integration tests were found.

## Suggested Tests to Add

- Webhook signature verification test
- Checkout callback membership test
- Auth session / middleware test
- Tenant scoping query tests
- Billing access helper tests
