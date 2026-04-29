# Gebar Integration

## Required Packages

- `@gebarbilling/server`
- `@gebarbilling/webhooks`
- `@gebarbilling/js`
- `@gebarbilling/react`
- `@gebarbilling/nextjs`

## Environment Variables

- `GEBARBILLING_SECRET_KEY`
- `GEBARBILLING_BASE_URL`
- `GEBARBILLING_WEBHOOK_SECRET`
- `GEBARBILLING_BASE_PLAN_ID`
- `GEBARBILLING_PLUS_PLAN_ID`
- `NEXT_PUBLIC_GEBARBILLING_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_GEBARBILLING_BASE_URL`
- `NEXT_PUBLIC_APP_URL`

## Billing Flow

1. User selects a plan with the client `CheckoutButton`.
2. Browser calls `POST /api/gebar/checkout`.
3. Server checks the current team or tenant.
4. Server creates a `billingCustomerId` if missing and writes a pending subscription.
5. Server calls Gebar checkout with `@gebarbilling/server`.
6. Browser redirects with `@gebarbilling/js`.
7. User completes checkout.
8. Checkout callback marks the team as `pending`.
9. Webhook updates `active`, `trialing`, or `canceled` state.

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
