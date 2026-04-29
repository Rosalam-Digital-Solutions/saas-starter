# Deployment SOP

## Likely Hosting Platform

Vercel is the likely deployment target based on the README, though this is inferred rather than strictly enforced by configuration files.

## Build and Start Commands

- Build: `pnpm build`
- Start: `pnpm start`

## Required Production Env Vars

- `BASE_URL`
- `POSTGRES_URL`
- `AUTH_SECRET`
- `GEBARBILLING_SECRET_KEY`
- `GEBARBILLING_BASE_URL`
- `GEBARBILLING_WEBHOOK_SECRET`
- `GEBARBILLING_BASE_PLAN_ID`
- `GEBARBILLING_PLUS_PLAN_ID`

## Deployment Steps

1. Push the branch to GitHub.
2. Connect the repository to the hosting platform.
3. Add production environment variables.
4. Deploy the app.
5. Run database migrations against production Postgres.
6. Configure the Gebar webhook URL.
7. Test checkout in production or staging.
8. Verify a webhook is received and processed.
9. Check logs for auth, webhook, and database issues.

## Database Migration Process

```text
Update schema
↓
pnpm db:generate
↓
Review migration SQL
↓
pnpm db:migrate
↓
Validate the app in the target environment
```

## Post-Deploy Checks

- Home page loads.
- Sign in route loads.
- Pricing page renders plans.
- Checkout path can create a session.
- Webhook endpoint accepts a verified event.
- Dashboard loads for an authenticated user.

## Rollback Considerations

- Keep the previous deployment available until webhook and billing checks pass.
- Avoid destructive schema changes unless you have a rollback plan.
- Revert env var changes if the production app stops reading required values.

## Health Check

No dedicated health check route was found. Use a lightweight page or API route check as a practical substitute during deployment verification.
