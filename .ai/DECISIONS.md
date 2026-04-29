# Decisions

This file is the repository's lightweight ADR log.

## ADR-0001: GebarBilling is the payment provider

- Date: 2026-04-28
- Status: Accepted
- Context: The repository uses GebarBilling packages and routes for checkout, portal, and webhooks.
- Decision: Treat GebarBilling as the billing provider and avoid reintroducing Stripe flows.
- Consequences: Billing docs, env vars, and webhook handling should stay GebarBilling-focused.
- Files affected: `lib/payments/*`, `app/api/gebar/*`, `README.md`, `.ai/BILLING.md`

## ADR-0002: Billing is tenant-scoped

- Date: 2026-04-28
- Status: Accepted
- Context: The schema stores subscriptions against organizations and memberships.
- Decision: Treat organization/team records as the billing boundary rather than the individual user.
- Consequences: Tenant ownership and membership checks must guard billing actions.
- Files affected: `lib/db/schema.ts`, `lib/tenant.ts`, `lib/payments/*`, `app/api/team/route.ts`

## ADR-0003: Auth is currently hybrid

- Date: 2026-04-28
- Status: Inferred
- Context: Better Auth is configured, but custom sign-in/sign-up server actions still exist.
- Decision: Document the repo as a hybrid auth state until migration is completed or removed.
- Consequences: Future auth work must be careful not to assume a single canonical flow yet.
- Files affected: `lib/auth.ts`, `app/(login)/actions.ts`, `middleware.ts`, `app/api/auth/[...all]/route.ts`

## ADR-0004: Webhook verification is mandatory

- Date: 2026-04-28
- Status: Accepted
- Context: The Gebar webhook route verifies signatures before processing events.
- Decision: Treat verified webhooks as the source of truth for subscription state.
- Consequences: Checkout callbacks may set pending state, but verified events must control active billing state.
- Files affected: `app/api/gebar/webhook/route.ts`, `lib/payments/gebar.ts`, `app/api/gebar/checkout/route.ts`

## Still Needed

- Whether to complete Better Auth migration before adding more tenant features.
- Whether to keep `organizations` naming or standardize on `teams` in user-facing docs.
- Whether to add a platform admin dashboard in the next iteration.

## ADR Template

### ADR-XXXX: Title

- Date:
- Status: Proposed / Accepted / Superseded
- Context:
- Decision:
- Consequences:
- Files affected:
