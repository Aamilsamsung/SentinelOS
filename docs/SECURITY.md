# Security model

SentinelOS treats tenant isolation and approval boundaries as application invariants.

## Current controls

- Every tenant-owned relational record carries an organization identifier.
- Cross-organization authorization checks fail closed.
- Roles are explicit: viewer, responder, admin, owner.
- Responders may request actions but cannot approve dangerous actions.
- Audit records are organization-scoped and append-oriented at the application boundary.
- API input schemas use strict validation so unexpected fields are rejected.
- Secrets are excluded from source control and represented only by empty environment placeholders.

## Required before production

Authentication/session implementation, passwordless/OIDC policy, database row-level security,
credential encryption/key management, webhook signature verification, CSRF/CORS policy,
integration-specific least privilege, action approval persistence, security test suite, and
deployment hardening remain incomplete and must not be represented as production-ready.
