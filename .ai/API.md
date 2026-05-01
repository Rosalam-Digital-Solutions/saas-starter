# API

## Route List

| Route | Purpose | Auth |
|---|---|---|
| `/api/auth/[...all]` | Better Auth route handler | Auth provider managed |
| `/api/user` | Return current user data | Requires session |
| `/api/team` | Return tenant memberships and subscriptions | Requires session |
| `POST /api/billing/checkout` | Create Gebar checkout session | Requires session and membership match |
| `POST /api/billing/portal` | Create Gebar customer portal session | Requires session, membership, and billing customer |
| `GET /api/billing/subscription` | Return local subscription state | Requires session |
| `POST /api/billing/subscription/sync` | Refresh subscription state from Gebar | Requires session |
| `GET /api/gebar/checkout` | Checkout callback after Gebar flow | Requires session and membership match |
| `GET /dashboard/billing` | Redirect legacy billing page to dashboard | Requires dashboard route access |
| `GET /plans/[slug]` | Redirect legacy plan detail pages to pricing | Public |
| `/api/gebar/webhook` | GebarBilling webhook receiver | Verifies webhook signature |
| `/api/debug/gebar` | Configuration debug inspection | No auth in code; should be treated as debug-only |

## Request / Response Expectations

- API routes return JSON or redirects depending on the handler.
- `/api/user` returns `null` when unauthenticated.
- `/api/team` returns the user's organizations and subscription summaries.
- `POST /api/billing/checkout` returns `{ url }`.
- `POST /api/billing/portal` returns `{ url }`.
- `GET /api/billing/subscription` returns the latest local billing state.
- `POST /api/billing/subscription/sync` checks Gebar and returns the refreshed billing state.
- `/api/gebar/webhook` returns `400` for missing or invalid signatures.

## Auth Requirements

- Session-based routes should use `auth.api.getSession(...)`.
- Tenant-sensitive routes should verify membership before reading or writing organization data.
- Debug routes should not be treated as production business APIs.

## Validation Rules

- Validate required query parameters in callback routes.
- Validate webhook signatures before parsing event payloads.
- Do not trust client-provided IDs without ownership checks.

## External Service Assumptions

- GebarBilling checkout and webhook behavior may vary by event payload shape.
- Real webhook payloads should be verified before relying on field names.
