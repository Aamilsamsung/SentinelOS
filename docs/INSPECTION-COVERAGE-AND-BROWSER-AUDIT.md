# Inspection coverage and authenticated browser audit

## Why a scan can be incomplete

The public preview deliberately samples up to 48 files, each at most 128 KiB, and accepts ZIP archives up to 5 MiB. ZIP extraction is capped at 1 MiB of source text. This protects a public unauthenticated endpoint from unbounded memory, CPU and network consumption.

A `partial` report is **not** a finding that the target project is broken. It means that the scanner cannot substantiate complete source coverage. Do not hide this warning or mark a project secure because the sample had no matches.

## Required remediation before increasing limits

1. Move scans to a durable background job queue, with authenticated ownership, cancellation and expiration.
2. Stream uploads to private object storage and use isolated workers; enforce archive compression-ratio, expanded-byte, per-file, path-count and wall-clock limits.
3. Traverse source files in deterministic priority order, continue in resumable batches, and record every skipped file and exact skip reason (oversized, unsupported, inaccessible, rate-limited, timeout, or sampling cap).
4. Report discovered, eligible, scanned and skipped counts separately. Distinguish source-only, runtime-tested, and not-tested areas.
5. Add regression tests for large repos, ZIP bombs, malformed archives, truncated GitHub trees, rate limits and cancellation.
6. Make limits configurable by service tier and infrastructure capacity, never simply remove all resource bounds.

## Authenticated cloud browser implementation requirements

This is a separate runtime-testing service, not an extension of the source ZIP parser.

- Verify ownership/authorization for target domains and require explicit user consent for browser automation.
- Launch an isolated, short-lived browser container per audit; deny internal-network/metadata endpoints and restrict navigation to the authorized target.
- Show an interactive browser so the user enters credentials and completes Google OAuth/MFA directly; never collect passwords or OAuth tokens in the SentinelOS dashboard.
- After user confirmation, run non-destructive checks of navigation, session persistence, login/logout, OAuth callbacks, API requests and browser-console failures.
- Redact cookies, Authorization headers, tokens, personal data and screenshots before retaining evidence. Enforce short retention, session expiry and cleanup.
- Require explicit approval for destructive actions. Label results confirmed, suspected, blocked or untested, with reproduction steps and audit coverage.

## Release gate

Do not label cloud-browser audit as implemented until a real isolated browser session, user-controlled login, authorized post-login checks, secure cleanup, and end-to-end tests are deployed and verified.
