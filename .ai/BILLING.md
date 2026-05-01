# Billing

## Provider

GebarBilling

## Checkout Flow

```text
Pricing page
↓
Client CheckoutButton
↓
POST /api/billing/checkout
↓
@gebarbilling/server creates checkout session
↓
Browser uses @gebarbilling/js or redirect URL
↓
Gebar hosted checkout
↓
GET /api/gebar/checkout marks pending
↓
POST /api/billing/subscription/sync can refresh from Gebar
↓
Verified webhook updates final state
```

Checkout plans are defined in `lib/payments/plans.ts` and rendered on `app/(dashboard)/pricing/page.tsx`.

The app does not render a custom billing management page. The dashboard shows a read-only current-plan badge and sends subscription management to the hosted Gebar portal.

## Subscription Model

- Subscriptions are stored in the `subscriptions` table.
- The subscription is associated with `organizationId`.
- Billing state includes `billingProvider`, `billingCustomerId`, `billingSubscriptionId`, `planId`, `planName`, and `status`.
- Status values include `active`, `trialing`, `pending`, `canceled`, `past_due`, and `paused`.

## Webhook Flow

```text
Gebar webhook
↓
Signature verification
↓
Event handling
↓
Subscription row update
```

Webhook handling is the source of truth for subscription state.

## Subscription Sync

- `POST /api/billing/subscription/sync` checks Gebar's billing state for the current organization billing customer.
- The sync endpoint updates the local subscription row when Gebar returns a subscription.
- The checkout success page uses sync to refresh state while webhook delivery is still catching up.

## Database Fields

- `subscriptions.organizationId`
- `subscriptions.billingProvider`
- `subscriptions.billingCustomerId`
- `subscriptions.billingSubscriptionId`
- `subscriptions.planId`
- `subscriptions.planName`
- `subscriptions.status`
- `subscriptions.currentPeriodStart`
- `subscriptions.currentPeriodEnd`
- `subscriptions.cancelAtPeriodEnd`

## Environment Variables

- `GEBARBILLING_SECRET_KEY`
- `GEBARBILLING_BASE_URL`
- `GEBARBILLING_WEBHOOK_SECRET`
- `GEBARBILLING_BASE_PLAN_ID`
- `GEBARBILLING_PLUS_PLAN_ID`
- `GEBARBILLING_BASE_PRICE_MONTHLY`
- `GEBARBILLING_PLUS_PRICE_MONTHLY`
- `GEBARBILLING_CURRENCY`
- `GEBARBILLING_ENV`
- `GEBARBILLING_PORTAL_SESSION_PATH` when the deployed GebarBilling portal endpoint differs from the SDK default
- `GEBARBILLING_PORTAL_URL_TEMPLATE` when that endpoint returns a session token instead of a full hosted URL
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_GEBAR_CHECKOUT_DOMAIN`
- `NGROK_AUTHTOKEN` for local webhook tunnel testing

## Security Rules

- Never expose the GebarBilling secret key to client code.
- Do not trust checkout callbacks as proof of active billing.
- Verify webhook signatures before processing events.
- Billing operations that require secrets should be server-side.
- Public browser components may use `@gebarbilling/js` only with publishable keys and URLs returned by API routes.

## Testing Checklist

- Pricing page loads plan data.
- Checkout creates a Gebar session.
- Checkout callback marks the subscription pending.
- Subscription sync refreshes state from Gebar after checkout.
- Webhook updates subscription state from a verified event.
- Customer portal session can be created for an existing subscription.
