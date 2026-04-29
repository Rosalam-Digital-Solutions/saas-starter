# Billing

## Provider

GebarBilling

## Checkout Flow

```text
Pricing page
↓
Server action: checkoutAction
↓
`lib/payments/gebar.ts`
↓
GebarBilling checkout session
↓
Redirect to Gebar checkout URL
```

Checkout plans are defined in `lib/payments/plans.ts` and rendered on `app/(dashboard)/pricing/page.tsx`.

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

## Security Rules

- Never expose the GebarBilling secret key to client code.
- Do not trust checkout callbacks as proof of active billing.
- Verify webhook signatures before processing events.
- Billing operations should be server-side.

## Testing Checklist

- Pricing page loads plan data.
- Checkout creates a Gebar session.
- Checkout callback marks the subscription pending.
- Webhook updates subscription state from a verified event.
- Customer portal session can be created for an existing subscription.