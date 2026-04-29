# Webhooks

## Current Webhook Route

- `POST /api/gebar/webhook`

## Signature Headers Observed

- `gebar-signature`
- `x-gebar-signature`
- `gebarbilling-signature`
- `x-gebarbilling-signature`

## Current Flow

```text
Gebar webhook request
↓
Read raw body
↓
Check signature header
↓
Verify event with `@gebarbilling/webhooks`
↓
Handle subscription-related event types
↓
Update subscription state in Postgres
```

## Event Types Handled

- `subscription.created`
- `subscription.updated`
- `subscription.active`
- `subscription.trialing`
- `subscription.cancelled`
- `subscription.canceled`
- `subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`

## Security Rules

- Missing signature must return `400`.
- Invalid signature must return `400`.
- Webhook verification must happen before trusting payload data.
- Do not use client-supplied billing state instead of verified webhook state.

## Known Gaps

- The route uses a dynamic `require()` for the webhook library.
- Real Gebar payload mapping still needs validation.
- Webhook observability is minimal and should be improved when productionizing.

## Testing Notes

- Use `pnpm test:gebar` for a local smoke check.
- Capture and replay a real webhook payload when available.