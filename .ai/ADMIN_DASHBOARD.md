# Admin Dashboard

## Status

Planned / not yet implemented in the route tree.

## Purpose

The super admin dashboard should be the platform-level control surface for organization, billing, webhook, and usage visibility.

## Planned Pages

- `/admin`
- `/admin/organizations`
- `/admin/organizations/[id]`
- `/admin/users`
- `/admin/subscriptions`
- `/admin/webhooks`
- `/admin/logs`
- `/admin/usage`

## Planned Admin Stats

- total organizations
- active organizations
- suspended organizations
- total users
- active subscriptions
- trialing subscriptions
- failed webhooks
- monthly usage

## Planned Admin Actions

- suspend organization
- restore organization
- view billing state
- view members
- view webhooks
- promote or demote super admin
- view audit logs

## Security Requirements

- Require a platform admin role before rendering or serving admin routes.
- Never expose admin routes to normal tenant users.
- Log admin actions.
