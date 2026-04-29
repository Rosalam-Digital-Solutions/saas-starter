# Better Auth Migration

## Current State

- Better Auth is already installed and configured in `lib/auth.ts`.
- The middleware and request helpers already call `auth.api.getSession(...)`.
- Custom sign-in and sign-up server actions still exist, so the repo is not fully migrated yet.

## What Better Auth Should Replace

- custom password handling
- custom session cookie handling
- custom user lookup helpers where they duplicate Better Auth
- auth middleware assumptions that still depend on the old flow
- any remaining custom sign-in / sign-up control flow once the migration is finished

## Migration Phases

1. Confirm the Better Auth config and schema mapping.
2. Align the sign-in and sign-up UI with the Better Auth flow.
3. Remove or simplify the legacy auth server actions.
4. Ensure tenant membership creation still works for new users.
5. Preserve or map `users.role` for platform-level roles.
6. Recheck protected route behavior after the migration.

## Warning

- Do not migrate Better Auth at the same time as a major billing or tenant rewrite unless explicitly requested.
