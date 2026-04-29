# Gebar Integration

## Required Packages

- `@gebarbilling/server`
- `@gebarbilling/webhooks`

## Environment Variables

- `GEBARBILLING_SECRET_KEY`
- `GEBARBILLING_BASE_URL`
- `GEBARBILLING_WEBHOOK_SECRET`
- `GEBARBILLING_BASE_PLAN_ID`
- `GEBARBILLING_PLUS_PLAN_ID`

## Billing Flow

1. User selects a plan.
2. App checks the current team or tenant.
3. App creates a `billingCustomerId` if missing.
4. App calls Gebar checkout.
5. User completes checkout.
6. Checkout callback marks the team as `pending`.
7. Webhook updates `active`, `trialing`, or `canceled` state.

## Webhook Rules

- Missing signature = `400`.
- Invalid signature = `400`.
- No JSON fallback after failed verification.
- Log the event.
- Update the team by `billingCustomerId`.

## Backend Smoke Test

- Recommended script: `scripts/test-gebar.ts`
- The script should verify backend connectivity and surface plan or webhook mismatches early.

## Known Issue

- The webhook payload mapping must be verified against a real Gebar webhook payload before production rollout.
