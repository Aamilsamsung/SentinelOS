# SentinelOS Release Gap Register

This register maps the authoritative specification to the current repository. It is intentionally conservative: a schema or isolated helper does not count as a complete product module.

## Verified foundation

- Multi-tenant PostgreSQL persistence and repeatable migrations
- Session/API-key authentication primitives and RBAC
- Incidents, events, investigations, evidence-backed findings and remediation state machine
- Approval/verification controls and audit persistence
- Redis asynchronous worker with processing acknowledgement, retry and bounded crash recovery
- Current-role permission revalidation before queued investigation execution
- Docker images and production-style Compose health checks for web/API/worker/PostgreSQL/Redis
- CI dependency audit, tests, builds, migrations and runtime smoke verification
- Next.js command-center foundation backed by real APIs

## Release blockers from the authoritative specification

### Architecture decision
The specification requests Python/FastAPI/Pydantic/SQLAlchemy/Alembic/Pytest. The verified backend is TypeScript/Fastify/PostgreSQL/Vitest. This requires either a migration or an explicit approved specification amendment.

### Product modules not yet complete end-to-end
- Service catalog/topology APIs and UI
- Monitoring/log/metric ingestion and query APIs/UI
- Full approvals UX
- Knowledge-base upload, extraction, embedding and semantic search
- GitHub integration beyond signed deployment/deployment-status evidence ingestion (for example repository connection lifecycle and richer investigation context)
- AI Assistant
- Settings, organization administration and users/roles UX
- API-key management UX
- Webhook management UX
- First-run onboarding flow
- In-app notification generation and real-time delivery
- WebSocket or Server-Sent Events real-time event stream

### Production/security hardening still required
- Per-integration webhook secrets instead of a single global secret
- Production-grade secret/key management and rotation
- Real authenticated browser login/session/org selection instead of server-configured frontend credentials
- CSRF protection for browser state-changing operations
- Trusted remediation executors for allowlisted actions
- Retry/dead-letter policy with bounded attempts for repeatedly failing jobs
- Full API-to-Redis-to-worker-to-PostgreSQL end-to-end investigation test
- Playwright browser tests and broader security/E2E coverage
- Deployment/release documentation and production environment validation

## Completion rule

SentinelOS must not be labeled specification-complete merely because CI is green. A blocker is closed only when its user-facing/backend behavior is implemented, secured where applicable, and covered by an appropriate automated or runtime verification gate.
