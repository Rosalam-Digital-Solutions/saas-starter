# Project Rules

## Gebar Billing Naming Convention

- **NEVER** mention, reference, or use "Unibee" in any code, comments, documentation, or configuration.
- The billing provider is **Gebar** (gebarbilling.et).
- All environment variables must use the `GEBAR_` or `GEBARBILLING_` prefix.
- The hosted checkout domain is controlled by `NEXT_PUBLIC_GEBAR_CHECKOUT_DOMAIN`.
- Allowed checkout domains can be comma-separated in `NEXT_PUBLIC_GEBAR_CHECKOUT_DOMAIN`.
- SDK patches that reference `NEXT_PUBLIC_GEBAR_CHECKOUT_DOMAIN` must not mention any other provider name.
