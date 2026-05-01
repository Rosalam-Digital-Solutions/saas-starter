# Billing Integration

This SaaS starter uses **GebarBilling** as the billing provider via the `@gebarbilling/server` and `@gebarbilling/webhooks` SDK packages.

## Environment Variables

### Server-side (never expose to client)

| Variable | Description | Example |
|----------|-------------|---------|
| `GEBARBILLING_SECRET_KEY` | Gebar API secret key | `sk_live_xxx` |
| `GEBARBILLING_BASE_URL` | Gebar API base URL | `https://api.gebarbilling.et` |
| `GEBARBILLING_ENV` | Environment name | `development`, `production` |
| `GEBARBILLING_WEBHOOK_SECRET` | Webhook signature secret | `whsec_xxx` |
| `GEBARBILLING_PORTAL_DOMAIN` | Hosted portal domain (optional) | `https://portal.gebarbilling.et` |

### Client-side (safe for browser)

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_APP_URL` | App base URL | `http://localhost:3000` |
| `NEXT_PUBLIC_GEBAR_CHECKOUT_DOMAIN` | Allowed checkout domains (comma-separated) | `https://checkout.gebarbilling.et` |
| `NEXT_PUBLIC_GEBARBILLING_PORTAL_DOMAIN` | Public portal domain (optional) | `https://portal.gebarbilling.et` |

### Plan Configuration

| Variable | Description |
|----------|-------------|
| `GEBARBILLING_BASE_PLAN_ID` | Gebar plan ID for Base plan |
| `GEBARBILLING_PLUS_PLAN_ID` | Gebar plan ID for Plus plan |
| `GEBARBILLING_BASE_PRICE_MONTHLY` | Base plan monthly price (in cents) |
| `GEBARBILLING_PLUS_PRICE_MONTHLY` | Plus plan monthly price (in cents) |
| `GEBARBILLING_CURRENCY` | Currency code | `usd` |

## Architecture

The starter uses GebarBilling as a **billing abstraction** while maintaining local subscription state in the database for fast access checks.

```
┌─────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   Browser    │────▶│  Next.js Routes   │────▶│  GebarBilling   │
│  (Client)    │◀────│  (Server)         │◀────│  SDK            │
└─────────────┘     └────────┬─────────┘     └──────────────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │   PostgreSQL      │
                    │  (subscriptions)  │
                    └──────────────────┘
```

## Checkout Flow

1. User clicks "Upgrade" on pricing page
2. Browser calls `POST /api/billing/checkout` with `planId`
3. Server authenticates user and resolves organization
4. Server calls `gebar.checkout.sessions.create()` via SDK
5. Server returns hosted checkout URL
6. Browser redirects to hosted checkout
7. User completes payment on GebarBilling hosted page
8. GebarBilling sends webhook to `/api/billing/webhooks`
9. Webhook handler verifies signature and updates local `subscriptions` table

## Customer Portal Flow

1. User clicks "Manage Billing" on billing page
2. Browser calls `POST /api/billing/portal`
3. Server authenticates user and resolves organization
4. Server calls `gebar.portal.sessions.create()` via SDK
5. Server returns hosted portal URL
6. Browser redirects to hosted customer portal
7. User manages subscription (update/cancel) on GebarBilling hosted page
8. GebarBilling sends webhook to `/api/billing/webhooks`
9. Webhook handler updates local `subscriptions` table

## Webhook Flow

The webhook route (`/api/billing/webhooks`) handles:

1. **Signature verification** - Uses `x-gebarbilling-signature` header and `constructEvent()`
2. **Event deduplication** - Checks `webhook_events` table for duplicate event IDs
3. **Event processing** - Uses `applyWebhookEvent()` to handle:
   - `subscription.created` - Creates/updates subscription record
   - `subscription.updated` - Updates subscription details
   - `subscription.cancelled` - Marks subscription as cancelled
   - `invoice.paid` - Marks subscription as active
   - `invoice.failed` - Marks subscription as past_due
4. **Event logging** - Stores processed events in `webhook_events` table

## Access Control

Access to paid features is determined by the local `subscriptions` table:

```typescript
import { hasBillingAccess } from '@/lib/billing/access';

if (!hasBillingAccess(subscription?.status)) {
  redirect('/pricing');
}
```

Valid access statuses: `active`, `trialing`, `incomplete`

Denied statuses: `cancelled`, `canceled`, `expired`, `failed`, `past_due`, `unknown`, `null`

## Database Schema

### subscriptions table

| Column | Type | Description |
|--------|------|-------------|
| `id` | text (PK) | Subscription ID from GebarBilling |
| `organizationId` | integer (FK) | Associated organization |
| `userId` | text | User ID who created the subscription |
| `billingCustomerId` | text | GebarBilling customer ID |
| `billingSubscriptionId` | text | GebarBilling subscription ID |
| `planId` | text | GebarBilling plan ID |
| `priceId` | text | GebarBilling price ID |
| `planName` | varchar | Human-readable plan name |
| `status` | enum | Subscription status |
| `currentPeriodStart` | timestamp | Current billing period start |
| `currentPeriodEnd` | timestamp | Current billing period end |
| `cancelAtPeriodEnd` | boolean | Scheduled cancellation flag |

### webhook_events table

| Column | Type | Description |
|--------|------|-------------|
| `id` | serial (PK) | Auto-increment ID |
| `eventId` | text (unique) | GebarBilling event ID |
| `eventType` | text | Event type (e.g., `subscription.created`) |
| `payload` | jsonb | Full webhook payload |
| `processedAt` | timestamp | When event was processed |

## Local Testing Checklist

1. **Start the application**
   ```bash
   pnpm dev
   ```

2. **Set up webhook listener** (optional)
   ```bash
   pnpm webhook:listen
   ```

3. **Log in** to the application

4. **Navigate to pricing page** and click "Upgrade"

5. **Complete checkout** on the hosted GebarBilling page

6. **Receive webhook** (check console/logs for confirmation)

7. **Verify subscription row** exists in database:
   ```bash
   pnpm db:studio
   ```

8. **Check billing page** shows active status at `/dashboard/billing`

9. **Click "Manage Billing"** and confirm hosted portal opens

10. **Cancel or update subscription** in the portal

11. **Verify webhook updates** local database with new status

12. **Confirm access control** works (protected features respect subscription status)

## Key Files

| File | Purpose |
|------|---------|
| `lib/billing/gebar.ts` | GebarBilling SDK client initialization |
| `lib/billing/access.ts` | Access control helpers |
| `app/api/billing/checkout/route.ts` | Create checkout sessions |
| `app/api/billing/portal/route.ts` | Create portal sessions |
| `app/api/billing/webhooks/route.ts` | Handle incoming webhooks |
| `app/api/billing/status/route.ts` | Get billing status for current user |
| `app/(dashboard)/dashboard/billing/page.tsx` | Billing dashboard page |
| `components/billing/manage-billing-button.tsx` | Portal redirect button |
| `lib/db/schema.ts` | Database schema (subscriptions, webhook_events) |

## Important Notes

- **Never** import `@gebarbilling/server` in client components
- **Never** use `req.json()` before signature verification in webhook routes
- **Always** use `req.text()` for webhook body to preserve raw payload
- **Always** deduplicate webhook events using event ID
- **Never** create subscription records in checkout route (wait for webhook confirmation)
- **Always** read from local database for access checks (don't call GebarBilling API live)
