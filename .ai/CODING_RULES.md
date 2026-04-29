# Coding Rules

## Language Conventions

- Use TypeScript for application code.
- Keep types strict where the compiler already expects them.
- Avoid `any` unless the code is bridging a third-party boundary and the reason is documented.
- Prefer explicit interfaces or type aliases for shared contracts.

## Framework Conventions

- Follow Next.js App Router conventions for page, layout, and route files.
- Keep server actions in server files and client UI in client components.
- Use route handlers for API endpoints and redirects.
- Keep route groups and nested layouts intact unless there is a clear reason to change them.

## Directory Conventions

- `app/` contains routes, layouts, and page-level UI.
- `components/` contains reusable UI components.
- `lib/` contains shared auth, database, billing, and tenant logic.
- `scripts/` contains maintenance scripts and smoke tests.

## Naming Conventions

- Use descriptive names that match the domain language in the repo.
- Prefer `organization` / `team` / `tenant` language consistently within a file.
- Use provider-neutral billing names in shared helpers where possible.

## Error Handling Rules

- Return clear, defensive error messages.
- Do not swallow errors unless a framework behavior requires it, such as build-time auth lookups.
- Validate inputs before touching the database or external services.

## API Rules

- Keep route handlers narrow and explicit.
- Authenticate protected routes.
- Authorize sensitive actions before reading or writing tenant data.
- Treat webhook verification failures as hard failures.

## Database Rules

- Do not change schema without a migration note.
- Avoid destructive migrations without explicit approval.
- Keep tenant and user scoping rules documented.
- Prefer incremental schema changes over broad rewrites.

## Security Rules

- Do not expose secrets in client code.
- Do not hardcode production credentials.
- Do not trust client-provided tenant IDs without ownership checks.
- Keep webhook verification mandatory.
- Keep billing state server-controlled.

## Environment Variable Rules

- Document new environment variables in `.ai/ENVIRONMENT.md` and `.env.example`.
- Mark server-only variables clearly.
- Do not use `NEXT_PUBLIC_` for secrets.

## Testing Rules

- Run relevant validation commands after changes.
- Prefer the smallest useful validation command for the touched area.
- Add or update tests when a change affects a critical flow.

## Documentation Rules

- Update `.ai` docs when architecture or workflow changes.
- Update the README when the onboarding or setup flow changes.
- Record major decisions in `.ai/DECISIONS.md`.

## Universal Rules

- Do not expose secrets in client code.
- Do not hardcode production credentials.
- Do not make broad rewrites without explicit instruction.
- Keep changes small and reviewable.
- Preserve existing behavior unless intentionally changing it.
- Be explicit about assumptions and uncertainty.

## Read Before Editing

- Before touching billing, read `.ai/BILLING.md` and `.ai/SECURITY_SOP.md`.
- Before touching auth, read `.ai/AUTH.md`.
- Before touching the database, read `.ai/DATABASE.md`.
- Before touching APIs or webhooks, read `.ai/API.md` and `.ai/WEBHOOKS.md`.
- Before touching tenants, read `.ai/MULTI_TENANCY.md`.
