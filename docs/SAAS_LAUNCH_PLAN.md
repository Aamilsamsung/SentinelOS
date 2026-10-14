# SentinelOS commercial SaaS launch plan

Status: implementation roadmap, **not** a production-readiness certification.

## Verified repository baseline (2026-10-14)
- Next.js/React frontend; TypeScript/Fastify API; PostgreSQL and Redis-backed workers.
- Existing GitHub integration, browser authentication, security, investigation, and job tests.
- README identifies a mismatch between the Python/FastAPI specification and implemented TypeScript/Fastify stack.
- No live production testing or billing verification has been performed in this milestone.

## Milestone 1 — reliable paid MVP
1. Inventory existing routes, UI screens, GitHub integration and tests; label each feature working, broken, missing, or unverified based on executed evidence.
2. Implement verified ownership checks for monitored targets and SSRF protections (DNS rebinding, redirects, private IPs, metadata endpoints).
3. Add scheduled HTTP/API checks with bounded timeouts, retry thresholds, incident transitions, recovery notifications, and tenant-scoped history.
4. Add tenant-safe dashboard views for checks, incidents, and alerts, with real backend data and empty/error states.
5. Add subscription entitlements enforced server-side; payment-provider webhooks must be authenticated, idempotent, and tested before live payments.
6. Run migration, unit, integration, browser E2E, and deployment smoke tests in staging; block launch for critical failures.

## Acceptance criteria
- Verified target ownership before active scans.
- No cross-tenant reads or writes in automated authorization tests.
- Incident is created after configured consecutive failures and resolved after recovery; alerts deduplicated.
- Worker failures are retried safely and jobs have resource/time bounds.
- Billing plan limits cannot be bypassed with direct API calls.
- Staging deployment demonstrates the complete monitoring workflow.
- Release checklist explicitly identifies passed, failed, blocked and not-tested checks.

## Deferred features
Authenticated browser testing, advanced SAST, AI remediation, agency team features, and full specification-driven backend migration are out of the initial paid MVP scope.

## Safety and rollout
All feature work should use pull requests, CI and staging. Do not deploy to production or modify customer data without explicit approval. Never place credentials in source control.
