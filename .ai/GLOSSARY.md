# Glossary

- User: an authenticated person using the app.
- Account: a user profile entry in the `users` table.
- Session: the authenticated state returned by Better Auth.
- Organization: the current schema term for the tenant record.
- Team: the product-facing term often used interchangeably with organization.
- Tenant: the isolated scope for app data, membership, and billing.
- Admin: a privileged tenant member who can manage sensitive organization actions.
- Super admin: a platform-level user with cross-tenant access.
- API route: a Next.js route handler under `app/api/`.
- Server action: a server-side function used by forms and mutations.
- Webhook: a server-to-server event from GebarBilling.
- Subscription: the billing state record for an organization.
- Plan: a configured billing offering such as Base or Plus.
- Billing customer: the GebarBilling customer record tied to an organization.
- Entitlement: a feature or limit granted by a plan.
- Environment variable: configuration loaded from `process.env`.

## Terminology Note

In this repository, team, organization, and tenant are overlapping terms. The code primarily uses `organization`, while product copy sometimes uses `team`.
