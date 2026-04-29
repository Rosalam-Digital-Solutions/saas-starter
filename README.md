# GebarBilling Next.js SaaS Starter

A deployable Next.js SaaS starter using **GebarBilling** for checkout, subscriptions, billing portal, and webhooks.

## AI-assisted development

This repository includes a dedicated AI workspace under [.ai/README.md](.ai/README.md).

Recommended reading order for future agents:

1. [.ai/PROJECT_CONTEXT.md](.ai/PROJECT_CONTEXT.md)
2. [.ai/ARCHITECTURE.md](.ai/ARCHITECTURE.md)
3. [.ai/CODING_RULES.md](.ai/CODING_RULES.md)
4. [.ai/TASKS.md](.ai/TASKS.md)

Use [.ai/TESTING_SOP.md](.ai/TESTING_SOP.md) before merging and update [.ai/DECISIONS.md](.ai/DECISIONS.md) after architecture changes.

If you change billing, auth, tenancy, or deployment behavior, update the matching `.ai` docs and record the decision in [.ai/DECISIONS.md](.ai/DECISIONS.md).

**Demo: [https://next-saas-start.vercel.app/](https://next-saas-start.vercel.app/)**

## Features

- Marketing landing page (`/`) with animated Terminal element
- Public pages for features, about, contact, privacy, and terms
- Pricing page (`/pricing`) which connects to GebarBilling Checkout
- Dashboard overview, profile, account, billing, notifications, team, and workspace settings
- Basic RBAC with Owner and Member roles
- Subscription management with GebarBilling Customer Portal
- Forgot/reset password screens wired to Better Auth reset endpoints
- Email/password authentication with JWTs stored to cookies
- Global middleware to protect logged-in routes
- Local middleware to protect Server Actions or validate Zod schemas
- Activity logging system for any user events
- Billing-aware dashboard with access features

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/)
- **Database**: [Postgres](https://www.postgresql.org/)
- **ORM**: [Drizzle](https://orm.drizzle.team/)
- **Payments**: [GebarBilling](https://gebarbilling.et/)
- **UI Library**: [shadcn/ui](https://ui.shadcn.com/)

## Developer Onboarding

1. Install dependencies with `pnpm install`.
2. Copy [.env.example](.env.example) or [.env.local.example](.env.local.example) to `.env.local`.
3. Set `POSTGRES_URL`, `AUTH_SECRET`, and the GebarBilling env vars.
4. Run `pnpm db:generate` and `pnpm db:migrate`.
5. Seed local data with `pnpm db:seed` if needed.
6. Start the app with `pnpm dev`.

Use [.ai/TESTING_SOP.md](.ai/TESTING_SOP.md) and [.ai/DEPLOYMENT_SOP.md](.ai/DEPLOYMENT_SOP.md) as the source of truth for local and production workflow.

## Getting Started

```bash
git clone https://github.com/AbelSileshie/saas-starter
cd saas-starter
pnpm install
```

## Running Locally

Use the included setup script to create your `.env` file:

```bash
pnpm db:setup
```

Or manually create an `.env` file with the required variables (see Environment Variables below).

Run the database migrations and seed the database with a default user and team:

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

This will create the following user and team:

- User: `test@test.com`
- Password: `admin123`

You can also create new users through the `/sign-up` route.

Finally, run the Next.js development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the app in action.

## Environment Variables

Create a `.env.local` file from [.env.local.example](.env.local.example) and fill in your local values. Do not commit secrets.

The canonical variable list is maintained in [.env.example](.env.example). GebarBilling secret values stay server-only; browser checkout uses `NEXT_PUBLIC_GEBARBILLING_PUBLISHABLE_KEY`, `NEXT_PUBLIC_GEBARBILLING_BASE_URL`, and `NEXT_PUBLIC_APP_URL`.

## Webhook Endpoint

For local development, you can test webhooks using the endpoint:

```
http://localhost:3000/api/gebar/webhook
```

In production, configure your GebarBilling webhook URL:

```
https://your-domain.com/api/gebar/webhook
```

## Testing Payments

1. Sign in with the seed user (`test@test.com` / `admin123`)
2. Visit `/pricing`
3. Select Base or Plus plan
4. The client checkout button calls `POST /api/gebar/checkout`
5. The server creates the checkout session and returns the hosted checkout URL
6. The browser redirects with `@gebarbilling/js`
7. Complete GebarBilling checkout
8. Return to dashboard
9. Confirm billing status shows as "pending" (webhook will update to "active")

Note: Webhook is the source of truth for production subscription status. Checkout redirect only marks status as "pending" for demo UX.

## AI and Architecture Notes

- Billing is tenant-level, not user-level.
- Teams currently act as tenants or merchants.
- Webhooks are trusted over checkout callbacks for subscription state.
- Better Auth migration is planned but intentionally separate from billing hardening.
- The most useful repo memory lives in [.ai/PROJECT_CONTEXT.md](.ai/PROJECT_CONTEXT.md) and [.ai/ARCHITECTURE.md](.ai/ARCHITECTURE.md).

## Going to Production

### Deploy to Vercel

1. Push your code to a GitHub repository.
2. Connect your repository to [Vercel](https://vercel.com/) and deploy it.
3. Add the environment variables in Vercel project settings.

### Vercel Environment Variables

See [.ai/DEPLOYMENT_SOP.md](.ai/DEPLOYMENT_SOP.md) and [.env.example](.env.example) for the required variables.

### Post-Deploy Setup

1. Run migrations on your production database:
   ```bash
   pnpm db:migrate
   ```

2. Configure GebarBilling webhook URL in your GebarBilling dashboard:
   ```
   https://your-domain.com/api/gebar/webhook
   ```

3. Create test plans in GebarBilling and copy the plan IDs into your Vercel environment variables.

4. Redeploy to apply the new environment variables.

## Project Structure

```
saas-starter/
├── app/
│   ├── (dashboard)/          # Protected dashboard routes
│   │   ├── dashboard/       # Overview, profile, account, billing, team, settings
│   │   ├── pricing/         # Pricing page
│   │   ├── features/        # Public feature page
│   │   ├── about/           # Public about page
│   │   ├── contact/         # Public contact form
│   │   ├── privacy/         # Privacy policy
│   │   └── terms/           # Terms page
│   ├── (login)/             # Auth routes and password reset pages
│   └── api/
│       ├── gebar/
│       │   ├── checkout/  # Checkout session API and callback
│       │   ├── portal/    # Customer portal session API
│       │   └── webhook/   # Webhook handler
├── lib/
│   ├── auth/           # Authentication
│   ├── db/            # Database schema & queries
│   └── payments/       # Payment configuration
│       ├── actions.ts  # Deprecated billing server actions
│       ├── browser.ts  # Browser-safe GebarBilling client
│       ├── gebar.ts    # Server-side GebarBilling helpers
│       ├── plans.ts    # Plan configuration
│       └── access.ts   # Billing access helpers
└── components/              # UI, layout, billing, dashboard, auth, feedback components
```

## Workspace Files

- [.ai/README.md](.ai/README.md)
- [.ai/PROJECT_CONTEXT.md](.ai/PROJECT_CONTEXT.md)
- [.ai/ARCHITECTURE.md](.ai/ARCHITECTURE.md)
- [.ai/CODING_RULES.md](.ai/CODING_RULES.md)
- [.ai/TESTING_SOP.md](.ai/TESTING_SOP.md)
- [.ai/DEPLOYMENT_SOP.md](.ai/DEPLOYMENT_SOP.md)
- [.ai/GEBAR_INTEGRATION.md](.ai/GEBAR_INTEGRATION.md)

## Other Templates

While this template is intentionally minimal and to be used as a learning resource, there are other paid versions in the community which are more full-featured:

- https://achromatic.dev
- https://shipfa.st
- https://makerkit.dev
- https://zerotoshipped.com
- https://turbostarter.dev
