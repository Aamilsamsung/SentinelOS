# SentinelOS

**Detect. Investigate. Resolve.**

SentinelOS is an AI-powered autonomous investigation and reliability platform. This repository is the canonical source for the application build.

## Engineering principles

- Real functionality over visual demos
- Security before automation
- Evidence before conclusions
- Human approval for dangerous actions
- Every important action is auditable
- AI uses tools and real data
- Operational information is never fabricated

The complete authoritative product specification is stored in `docs/SPECIFICATION.md`.

## Current implementation

SentinelOS currently runs as a containerized multi-service application:

- Next.js/React web command center
- TypeScript/Fastify API
- asynchronous Redis-backed investigation worker
- PostgreSQL persistence
- Redis queue/coordination layer

CI verifies migrations, automated tests, dependency security, builds, Docker images, full-stack container health, Redis-to-worker transport, PostgreSQL-backed investigation claiming, queue crash recovery and queued RBAC revalidation.

## Release status

The core implementation is in release-hardening and specification-audit status, not declared 100% complete.

A material compliance decision remains open: the authoritative specification requests a Python/FastAPI/Pydantic/SQLAlchemy/Alembic/Pytest backend, while the verified implementation currently uses TypeScript/Fastify/PostgreSQL/Vitest. See `docs/ARCHITECTURE.md` for the explicit release decision required before specification-complete status.

Do not interpret milestone percentages or passing CI as a claim that every item in the authoritative specification is complete.
