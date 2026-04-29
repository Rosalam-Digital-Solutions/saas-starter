# Debugging Guide

## Install / Dependency Issues

Symptoms:

- `pnpm install` fails
- a module import cannot be resolved

Likely causes:

- dependency lockfile drift
- local Node version mismatch
- missing network access during install

How to inspect:

- check `package.json` and `pnpm-lock.yaml`
- inspect terminal output from `pnpm install`

How to fix:

- reinstall dependencies
- align Node version with the project setup
- update the lockfile only when intentional

## Env Var Issues

Symptoms:

- build or dev server throws a missing env error
- `lib/env.ts` throws during startup

Likely causes:

- `.env.local` is missing
- a required GebarBilling or Postgres variable is empty

How to inspect:

- compare `.env.example` and `.env.local.example`
- check `lib/env.ts`

How to fix:

- copy the example env file
- fill in all required variables
- restart the dev server

## Database Connection Issues

Symptoms:

- Drizzle cannot connect
- API routes that touch the database fail

Likely causes:

- `POSTGRES_URL` is invalid
- local Postgres is not running
- the database credentials do not match the environment

How to inspect:

- `lib/db/drizzle.ts`
- `drizzle.config.ts`
- the terminal output from `pnpm db:generate` or `pnpm db:migrate`

How to fix:

- verify the connection string
- start or repair the database service
- rerun migrations

## Migration Issues

Symptoms:

- generated SQL does not match expectations
- migration command fails

Likely causes:

- schema and database are out of sync
- migration state is stale

How to inspect:

- `lib/db/schema.ts`
- `lib/db/migrations/`
- migration command output

How to fix:

- review the generated migration before applying it
- regenerate if the schema changed again

## Auth / Session Issues

Symptoms:

- sign-in or dashboard access redirects unexpectedly
- `auth.api.getSession(...)` returns `null`

Likely causes:

- middleware skipped or misread the request headers
- auth state is still hybrid between Better Auth and custom actions

How to inspect:

- `lib/auth.ts`
- `middleware.ts`
- `app/(login)/actions.ts`
- `app/api/auth/[...all]/route.ts`

How to fix:

- verify session lookup against request headers
- review the custom login and sign-up flow

## API Route Issues

Symptoms:

- JSON route returns the wrong status
- route handler redirects unexpectedly

Likely causes:

- missing query parameters
- auth or membership checks failing

How to inspect:

- the relevant route under `app/api/`
- request headers and query parameters

How to fix:

- validate inputs before touching the database
- add logs or temporary debug output if needed

## External Service Issues

Symptoms:

- checkout creation fails
- portal session creation fails
- debug route shows config missing

Likely causes:

- GebarBilling secrets or plan IDs are missing
- the GebarBilling base URL is wrong

How to inspect:

- `lib/payments/gebar.ts`
- `lib/payments/plans.ts`
- `scripts/test-gebar.ts`
- `app/api/debug/gebar/route.ts`

How to fix:

- verify the GebarBilling environment variables
- run the smoke test script

## Webhook Issues

Symptoms:

- webhook returns `400`
- subscription state does not update

Likely causes:

- signature header is missing or wrong
- the real Gebar payload shape differs from assumptions

How to inspect:

- `app/api/gebar/webhook/route.ts`
- `lib/payments/gebar.ts`
- logs from the request handler

How to fix:

- verify the webhook secret
- capture a real payload and map the fields carefully

## Build / Type Errors

Symptoms:

- `pnpm build` fails
- TypeScript reports a type mismatch

Likely causes:

- a shared contract changed without matching updates
- a new import path is wrong

How to inspect:

- the build output
- the file named in the error

How to fix:

- repair the smallest affected slice
- rerun the build

## Deployment Errors

Symptoms:

- production build passes locally but fails in deployment
- app works locally but not in the hosting environment

Likely causes:

- missing production env vars
- stale migration state
- webhook endpoint not configured

How to inspect:

- deployment logs
- production environment variables
- the build command output

How to fix:

- compare local and production env values
- rerun migrations
- verify the webhook URL

## Log Commands

- `pnpm build`
- `pnpm dev`
- `pnpm db:migrate`
- `pnpm test:gebar`
- `grep -R "process.env\|import.meta.env" . --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=.git`
