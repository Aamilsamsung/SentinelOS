# SentinelOS Release Gap Register

This register maps the authoritative specification to the current repository. It is intentionally conservative: a schema or isolated helper does not count as a complete product module.

## Verified foundation

- Multi-tenant PostgreSQL persistence and repeatable migrations
- Session/API-key authentication primitives and RBAC
- Incidents, events, investigations, evidence-backed findings and remediation state machine
- Approval/verification controls and audit persistence
- Redis asynchronous worker with processing acknowledgement, bounded retries, dead-letter routing and bounded crash recovery
- Current-role permission revalidation before queued investigation execution
- Docker images and production-style Compose health checks for web/API/worker/PostgreSQL/Redis
- CI dependency audit, tests, builds, migrations and runtime smoke verification
- Authenticated API-to-Redis-to-worker-to-PostgreSQL investigation pipeline runtime verification (controlled no-AI-provider failure path)
- Next.js command-center foundation backed by real APIs

## Release blockers from the authoritative specification

### Architecture decision
The specification requests Python/FastAPI/Pydantic/SQLAlchemy/Alembic/Pytest. The verified backend is TypeScript/Fastify/PostgreSQL/Vitest. This requires either a migration or an explicit approved specification amendment.

### Product modules not yet complete end-to-end
- Service catalog/topology UI (tenant-scoped APIs and investigation evidence collection are implemented)
- Monitoring/log/metric UI (tenant-scoped ingestion/query APIs and investigation evidence collection are implemented)
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
- Production-grade secret/key management and rotation
- Real authenticated browser login/session/org selection instead of server-configured frontend credentials
- CSRF protection for browser state-changing operations
- Trusted remediation executors for allowlisted actions
- Successful AI-backed API-to-Redis-to-worker-to-PostgreSQL end-to-end investigation test (the controlled no-provider failure path is runtime-verified)
- Playwright browser tests and broader security/E2E coverage
- Deployment/release documentation and production environment validation

## Completion rule

SentinelOS must not be labeled specification-complete merely because CI is green. A blocker is closed only when its user-facing/backend behavior is implemented, secured where applicable, and covered by an appropriate automated or runtime verification gate.
