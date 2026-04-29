# Auth

## Current Auth System

The repository is in a hybrid auth state.

- Better Auth is configured in `lib/auth.ts`.
- The auth middleware uses `auth.api.getSession(...)`.
- Custom sign-in and sign-up server actions still exist in `app/(login)/actions.ts`.
- The current login actions do not look like a complete Better Auth login flow yet, so this area should be reviewed carefully before changing behavior.

## Session Flow

```text
Request headers
↓
Better Auth session lookup
↓
Session user
↓
Middleware / route guard / server action
```

## Login and Signup Files

- `app/(login)/login.tsx`
- `app/(login)/sign-in/page.tsx`
- `app/(login)/sign-up/page.tsx`
- `app/(login)/actions.ts`
- `app/api/auth/[...all]/route.ts`
- `lib/auth.ts`

## Protected Route Logic

- `middleware.ts` protects `/dashboard`, `/admin`, `/settings`, and `/pricing`.
- The middleware redirects unauthenticated users to sign-in and authenticated users away from auth routes.
- Server actions and API routes still need their own authorization checks.

## User Model

- `users` table contains `name`, `email`, `emailVerified`, `image`, `passwordHash`, `role`, and ban fields.
- Sessions, accounts, and verifications are present for Better Auth compatibility.

## Known Risks

- Auth is not fully unified yet.
- The sign-in action appears to redirect based on an existing session rather than completing a credential exchange.
- The sign-up action inserts directly into the `users` table and does not appear to establish a full auth session by itself.
- Protected routes still need per-action authorization inside handlers.

## Migration Notes

- The next step should be to either complete the Better Auth migration or remove the custom auth actions so there is one clear canonical login path.
- Avoid mixing a major auth rewrite with unrelated billing changes unless explicitly planned.