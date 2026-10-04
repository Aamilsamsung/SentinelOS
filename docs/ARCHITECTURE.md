# SentinelOS Architecture

SentinelOS is being built as a security-first multi-tenant reliability platform.

## Planned runtime boundaries

- Web client: authenticated operator interface and command center.
- API: organization-scoped application API, ingestion endpoints, RBAC and audit enforcement.
- Worker: asynchronous investigations, correlation, anomaly detection and approved remediation jobs.
- PostgreSQL: durable source of truth for organizations, users, incidents, evidence, approvals and audit records.
- Redis: queues, coordination and ephemeral realtime state.
- Object storage: evidence artifacts and larger immutable investigation outputs where required.

## Non-negotiable invariants

1. Every tenant-owned record is organization scoped.
2. Dangerous actions require explicit authorization and approval.
3. Investigation conclusions must reference persisted evidence.
4. External content is untrusted input and cannot redefine system policy.
5. Missing integrations return explicit unavailable/error states; no synthetic operational data is substituted.
6. Security-sensitive and state-changing operations emit audit records.
7. Credentials and secrets never belong in source control.

Implementation details will evolve as modules are built and tested; this document must describe implemented architecture rather than aspirational behavior.
