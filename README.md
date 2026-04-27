# GebarBilling Next.js SaaS Starter

A deployable Next.js SaaS starter using **GebarBilling** for checkout, subscriptions, billing portal, and webhooks.

**Demo: [https://next-saas-start.vercel.app/](https://next-saas-start.vercel.app/)**

## Features

- Marketing landing page (`/`) with animated Terminal element
- Pricing page (`/pricing`) which connects to GebarBilling Checkout
- Dashboard pages with CRUD operations on users/teams
- Basic RBAC with Owner and Member roles
- Subscription management with GebarBilling Customer Portal
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

Create a `.env` file with the following variables:

```env
# Required
BASE_URL=http://localhost:3000
POSTGRES_URL=postgresql://user:password@localhost:5432/dbname
AUTH_SECRET=your-secret-key-here

# GebarBilling (get these from your GebarBilling dashboard)
GEBARBILLING_SECRET_KEY=your-gebar-secret-key
GEBARBILLING_BASE_URL=https://api.gebarbilling.et
GEBARBILLING_WEBHOOK_SECRET=your-webhook-secret

# Plan IDs (get these from your GebarBilling dashboard after creating plans)
GEBARBILLING_BASE_PLAN_ID=plan_base_xxx
GEBARBILLING_PLUS_PLAN_ID=plan_plus_xxx

# Optional - only required if you want to customize prices
GEBARBILLING_BASE_PRICE_MONTHLY=800
GEBARBILLING_PLUS_PRICE_MONTHLY=1200
GEBARBILLING_CURRENCY=usd
```

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
4. Complete GebarBilling checkout
5. Return to dashboard
6. Confirm billing status shows as "pending" (webhook will update to "active")

Note: Webhook is the source of truth for production subscription status. Checkout redirect only marks status as "pending" for demo UX.

## Going to Production

### Deploy to Vercel

1. Push your code to a GitHub repository.
2. Connect your repository to [Vercel](https://vercel.com/) and deploy it.
3. Add the environment variables in Vercel project settings.

### Vercel Environment Variables

```
BASE_URL=https://your-domain.com
POSTGRES_URL=your-production-postgres-url
AUTH_SECRET=your-random-secret-key

GEBARBILLING_SECRET_KEY=your-gebar-secret-key
GEBARBILLING_BASE_URL=https://api.gebarbilling.et
GEBARBILLING_WEBHOOK_SECRET=your-webhook-secret
GEBARBILLING_BASE_PLAN_ID=plan_base_xxx
GEBARBILLING_PLUS_PLAN_ID=plan_plus_xxx
```

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
│   │   ├── dashboard/     # Dashboard settings
│   │   └── pricing/     # Pricing page
│   ├── (login)/        # Auth routes (sign-in, sign-up)
│   └── api/
│       ├── gebar/
│       │   ├── checkout/  # Checkout callback
│       │   └── webhook/ # Webhook handler
├── lib/
│   ├── auth/           # Authentication
│   ├── db/            # Database schema & queries
│   └── payments/       # Payment configuration
│       ├── actions.ts  # Server actions
│       ├── gebar.ts   # GebarBilling client
│       ├── plans.ts   # Plan configuration
│       └── access.ts  # Billing access helpers
└── components/         # UI components
```

## Other Templates

While this template is intentionally minimal and to be used as a learning resource, there are other paid versions in the community which are more full-featured:

- https://achromatic.dev
- https://shipfa.st
- https://makerkit.dev
- https://zerotoshipped.com
- https://turbostarter.dev