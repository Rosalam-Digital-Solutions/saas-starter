# Prompts

## 1. Project Audit

```text
Read `.ai/PROJECT_CONTEXT.md`, `.ai/CODING_RULES.md`, and the relevant domain docs before making changes. Audit this repository's current architecture, identify the most important risks, and summarize the files a future agent should inspect first. Do not change code unless I ask you to.
```

## 2. Bug Fix

```text
Read `.ai/PROJECT_CONTEXT.md`, `.ai/CODING_RULES.md`, and the relevant domain docs before making changes. Investigate the bug described below, identify the smallest safe fix, and explain how you validated it.
```

## 3. Feature Implementation

```text
Read `.ai/PROJECT_CONTEXT.md`, `.ai/CODING_RULES.md`, and the relevant domain docs before making changes. Implement the feature described below with minimal changes, preserve existing behavior, and add tests or manual validation where appropriate.
```

## 4. Refactor Safely

```text
Read `.ai/PROJECT_CONTEXT.md`, `.ai/CODING_RULES.md`, and the relevant domain docs before making changes. Refactor the targeted area with a narrow scope, avoid unrelated cleanup, and explain any behavioral risk.
```

## 5. Add Tests

```text
Read `.ai/PROJECT_CONTEXT.md`, `.ai/CODING_RULES.md`, and the relevant domain docs before making changes. Add focused tests for the flow below and keep the coverage aligned with the repo's actual tooling.
```

## 6. Debug Build Failure

```text
Read `.ai/PROJECT_CONTEXT.md`, `.ai/CODING_RULES.md`, and the relevant domain docs before making changes. Diagnose the build failure, identify the root cause, and propose the smallest fix that unblocks the build.
```

## 7. Update Documentation

```text
Read `.ai/PROJECT_CONTEXT.md`, `.ai/CODING_RULES.md`, and the relevant domain docs before making changes. Update the documentation so it matches the repository's current behavior, and call out any uncertainty explicitly.
```

## 8. Review Security

```text
Read `.ai/PROJECT_CONTEXT.md`, `.ai/CODING_RULES.md`, and the relevant domain docs before making changes. Review this code for security issues, especially around secrets, auth, tenant access, and webhook verification.
```

## 9. Prepare Deployment

```text
Read `.ai/PROJECT_CONTEXT.md`, `.ai/CODING_RULES.md`, and the relevant domain docs before making changes. Prepare the repository for deployment by checking build, env vars, migrations, and production-risk areas.
```

## 10. Explain Architecture

```text
Read `.ai/PROJECT_CONTEXT.md`, `.ai/CODING_RULES.md`, and the relevant domain docs before making changes. Explain the repository architecture in plain language, including the auth flow, data flow, API routes, and any external integrations.
```
