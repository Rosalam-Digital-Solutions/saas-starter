# Environment

This file documents the environment variables discovered in the repository.

## Discovered Variables

| Variable | Required | Used by | Description | Example |
|---|---|---|---|---|
| `BASE_URL` | Yes | `lib/env.ts`, `lib/payments/gebar.ts`, `app/api/debug/gebar/route.ts` | Canonical app URL used for redirects and return URLs. | `http://localhost:3000` |
| `POSTGRES_URL` | Yes | `drizzle.config.ts`, `lib/db/drizzle.ts`, `lib/env.ts`, `app/api/debug/gebar/route.ts` | Postgres connection string for the database and Drizzle tooling. | `postgresql://user:password@localhost:54322/postgres` |
| `AUTH_SECRET` | Yes | `lib/env.ts`, `app/api/debug/gebar/route.ts` | Auth/session secret value validated by the app. | `replace-with-random-secret` |
| `GEBARBILLING_SECRET_KEY` | Yes | `lib/env.ts`, `lib/payments/gebar.ts`, `scripts/test-gebar.ts`, `app/api/debug/gebar/route.ts` | Server-side GebarBilling API key. | `replace-with-server-secret` |
| `GEBARBILLING_BASE_URL` | Yes | `lib/env.ts`, `lib/payments/gebar.ts`, `scripts/test-gebar.ts`, `app/api/debug/gebar/route.ts` | GebarBilling API base URL. | `https://api.gebarbilling.et` |
| `GEBARBILLING_WEBHOOK_SECRET` | Yes | `lib/env.ts`, `app/api/gebar/webhook/route.ts`, `app/api/debug/gebar/route.ts` | Secret used to verify incoming Gebar webhook signatures. | `replace-with-webhook-secret` |
| `GEBARBILLING_BASE_PLAN_ID` | Yes | `lib/env.ts`, `lib/payments/plans.ts`, `scripts/test-gebar.ts`, `app/api/debug/gebar/route.ts` | Plan ID for the Base plan. | `plan_base_xxx` |
| `GEBARBILLING_PLUS_PLAN_ID` | Yes | `lib/env.ts`, `lib/payments/plans.ts`, `app/api/debug/gebar/route.ts` | Plan ID for the Plus plan. | `plan_plus_xxx` |
| `GEBARBILLING_BASE_PRICE_MONTHLY` | Optional | `lib/payments/plans.ts`, `lib/env.ts` | Display/configured monthly price for the Base plan. | `800` |
| `GEBARBILLING_PLUS_PRICE_MONTHLY` | Optional | `lib/payments/plans.ts`, `lib/env.ts` | Display/configured monthly price for the Plus plan. | `1200` |
| `GEBARBILLING_CURRENCY` | Optional | `lib/payments/plans.ts`, `lib/env.ts` | Currency code used for pricing display/config. | `usd` |
| `NEXT_PUBLIC_GEBARBILLING_PUBLISHABLE_KEY` | Yes for browser checkout | `lib/payments/browser.ts` | Browser-safe GebarBilling publishable key. Never use the secret key here. | `pk_test_xxx` |
| `NEXT_PUBLIC_GEBARBILLING_BASE_URL` | Optional | `lib/payments/browser.ts`, `lib/env.ts` | Browser-safe GebarBilling API base URL. | `https://api.gebarbilling.et` |
| `NEXT_PUBLIC_APP_URL` | Optional | `lib/payments/gebar.ts`, `lib/env.ts` | Browser-safe app URL used for checkout return links. | `http://localhost:3000` |

## Local Setup

- Copy [.env.example](../.env.example) or [.env.local.example](../.env.local.example) to `.env.local`.
- Fill in Postgres, auth, and GebarBilling secrets before running database or billing flows.
- `pnpm db:setup` is the repo's helper for creating local environment configuration.

## Production Setup

- Set the same variables in your deployment platform.
- Keep all secrets server-side only.
- Do not expose billing or auth secrets with `NEXT_PUBLIC_` prefixes.

## Client-Safe vs Server-Only

- Server-only: `BASE_URL`, `POSTGRES_URL`, `AUTH_SECRET`, and every `GEBARBILLING_*` secret or plan variable.
- Client-safe: only `NEXT_PUBLIC_GEBARBILLING_PUBLISHABLE_KEY`, `NEXT_PUBLIC_GEBARBILLING_BASE_URL`, and `NEXT_PUBLIC_APP_URL`.
- Do not expose `GEBARBILLING_SECRET_KEY` or `GEBARBILLING_WEBHOOK_SECRET` to client code.
