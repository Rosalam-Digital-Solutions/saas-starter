# Multi-Tenancy

## Current Model

The code currently uses `organizations` and `memberships` tables to represent the tenant boundary and access model. Product copy still uses team language in several places, so the repo is effectively using team, organization, and tenant as overlapping terms.

## Current Strategy

- Keep organizations as the current tenant record.
- Treat an organization as the tenant / team / merchant boundary.
- Preserve membership-based access checks.
- Be explicit in future docs and code when using team language versus organization schema names.

## Key Tables

- `organizations`
- `memberships`
- `organization_invitations`
- `subscriptions`

## Membership Roles

- `owner`
- `admin`
- `member`
- `viewer`

## Tenant Access Rules

- User must be a member of the organization.
- Owner and admin manage billing and membership changes.
- Member uses the app.
- Viewer is read-only.

## Tenant Scoping Rules

- Every tenant-owned query should filter by organization membership or an equivalent tenant context.
- Never trust a client-provided organization ID without verifying ownership or membership.
- Billing actions should use the organization's billing customer and subscription rows.

## Admin Exceptions

- Platform admin routes may bypass normal tenant scoping, but only with a separate admin authorization check.

## Helper Names Used or Suggested

- `getTenantContext()`
- `requireTenant()`
- `requireTenantRole()`
- `requireActiveTenant()`
- `canManageBilling()`
