# Database

## ORM

Drizzle ORM

## Schema Location

- `lib/db/schema.ts`
- `lib/db/drizzle.ts`

## Migration Commands

- `pnpm db:generate`
- `pnpm db:migrate`

## Seed Commands

- `pnpm db:seed`
- `pnpm db:setup`

## Relationship Overview

```text
users
  ├─ sessions
  ├─ accounts
  ├─ memberships
  └─ audit_logs

organizations
  ├─ memberships
  ├─ subscriptions
  ├─ invitations
  ├─ activity_logs
  └─ audit_logs

plans
  └─ entitlements
```

## Important Tables

- `users`
- `sessions`
- `accounts`
- `verifications`
- `organizations`
- `memberships`
- `organization_invitations`
- `subscriptions`
- `plans`
- `entitlements`
- `audit_logs`
- `activity_logs`

## Schema Change Rules

- Do not change schema without a migration note.
- Avoid destructive migrations without explicit approval.
- Keep organization and membership ownership rules documented.
- Keep billing fields provider-neutral where possible.
- Preserve existing data shape assumptions in server code when changing schema names or relationships.