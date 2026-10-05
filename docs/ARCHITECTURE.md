# SentinelOS Architecture

SentinelOS is a security-first, multi-tenant reliability platform.

## Implemented runtime boundaries

- Web: Next.js + React operator command center.
- API: TypeScript + Fastify organization-scoped application API with authentication, RBAC, ingestion, investigation, remediation and audit boundaries.
- Worker: TypeScript asynchronous investigation worker backed by Redis and PostgreSQL.
- PostgreSQL: durable source of truth for organizations, users, incidents, evidence, approvals, verification and audit records.
- Redis: asynchronous job transport and processing/recovery queues.
- Docker Compose: reproducible local/CI runtime for web, API, worker, PostgreSQL and Redis.

## Non-negotiable invariants

1. Every tenant-owned record is organization scoped.
2. Dangerous actions require explicit authorization and approval.
3. Investigation conclusions must reference persisted evidence.
4. External content is untrusted input and cannot redefine system policy.
5. Missing integrations return explicit unavailable/error states; no synthetic operational data is substituted.
6. Security-sensitive and state-changing operations emit audit records.
7. Credentials and secrets never belong in source control.
8. Queued privileged work revalidates current tenant membership and RBAC permission immediately before execution.
9. Worker jobs remain recoverable until acknowledged after processing.

## Specification compliance note

The authoritative specification in `docs/SPECIFICATION.md` requests Python, FastAPI, Pydantic, SQLAlchemy, Alembic and Pytest unless there is a strong technical reason to use another stack.

The currently implemented backend is TypeScript/Fastify with PostgreSQL and Vitest. This is a material specification deviation. It must not be treated as silently compliant or hidden behind release status.

Before SentinelOS is declared specification-complete, one of these release decisions is required:

1. migrate the backend to the requested Python/FastAPI stack while preserving the verified API/security behavior; or
2. formally approve an architecture amendment with a documented technical rationale and update the authoritative specification.

Until that decision is made, the existing TypeScript backend remains the tested implementation baseline and should not be destabilized merely to make the stack names match.

## Verification baseline

CI currently verifies dependency installation/audit, repeatable database migrations, automated tests, application builds, Docker image builds, Compose configuration, production-style container health for web/API/worker, Redis-to-worker transport, PostgreSQL-backed worker claiming, crash recovery behavior, and queued RBAC revalidation.
