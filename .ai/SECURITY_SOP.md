# Security SOP

## Required Rules

- Never commit secrets.
- Never expose server secrets to the client.
- Validate external webhooks.
- Authenticate protected routes.
- Authorize sensitive actions.
- Log security-relevant admin actions.
- Sanitize untrusted input.
- Avoid trusting client-provided IDs without ownership checks.
- Use environment variables for secrets.

## Auth and Route Protection

- Middleware protects dashboard and auth routes.
- Server actions should still validate permissions on the server.
- Do not rely on UI state alone to enforce access.

## Billing Rules

- Webhooks are the source of truth.
- The client should not set paid or active billing state.
- Checkout callbacks can mark pending state only.

## Multi-Tenant Rules

- Every tenant-owned query must be scoped.
- Admin routes must require a platform admin role.
- Tenant IDs from the client must be checked against membership or ownership.

## Webhook Rules

- Missing signature: reject.
- Invalid signature: reject.
- Log the verified event without leaking secrets or raw credentials.

## File Upload Rules

- No file upload flow was found in the repository.
