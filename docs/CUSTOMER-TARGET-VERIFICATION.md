# Customer-owned target verification and security testing policy

SentinelOS is a multi-tenant security-audit SaaS. Each customer must prove control of a target or document explicit authorization before any active security test.

## Enrollment

1. A signed-in customer adds a website origin, API hostname or repository.
2. For websites, issue a high-entropy, single-use challenge bound to customer ID, exact hostname and expiration. Verify a DNS TXT record or a HTTPS well-known challenge file served from that hostname. Never treat an arbitrary URL parameter, redirect, or screenshot as ownership proof.
3. For GitHub, use a scoped GitHub App installation and verify installation/repository permissions. Public source review may remain available separately without active exploitation.
4. Save verification timestamp, challenge method, tenant ownership and approved scope. Reverify on expiry or ownership changes.
5. Require explicit acceptance of test scope, allowed times, rate limits and permitted actions. Separate passive inspection from active security checks.

## Runtime guardrails

- Resolve and validate target hostnames on every request; block loopback, private, link-local, metadata and internal address ranges (IPv4 and IPv6). Protect against DNS rebinding and redirects to out-of-scope hosts.
- Isolate workers and browser sessions by tenant. Never reuse credentials, cookies, screenshots or scan artifacts across customers.
- Bound concurrency, request rate, body sizes, crawl depth, job duration and retention. Require customer approval for any destructive, high-load or state-changing operation.
- Allow safe checks of TLS, headers, exposed metadata, authenticated navigation, access control and API response handling. Report findings with evidence and reproduction instructions; no blanket 'secure' certification.
- Customer performs Google OAuth/MFA in a controlled browser session. Do not request passwords or session tokens through the SentinelOS application.
- Audit every scan initiation, scope change, browser session, and report access.

## Minimum release tests

Test expired/incorrect ownership challenges, tenant isolation, SSRF through DNS and redirects, blocked private IPs, authorization revocation, rate limiting, OAuth session cleanup, cross-tenant artifact access and cancellation. Active tests must be disabled until verification and isolation controls pass.
