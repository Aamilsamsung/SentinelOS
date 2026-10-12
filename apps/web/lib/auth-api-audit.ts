import type { InspectionFinding } from "./source-inspection";

/**
 * Bounded, read-only heuristics for common authentication and integration mistakes.
 * These checks never execute submitted code or contact its configured services.
 * Absence of a match is NOT evidence that a flow is secure or operational.
 */
export function auditAuthApiSource(path: string, content: string): InspectionFinding[] {
  const issues: InspectionFinding[] = [];
  const isExampleOrTest = /(?:^|\/)(?:__tests__|tests?|spec|fixtures?|examples?|docs?)(?:\/|$)|\.(?:test|spec)\.[jt]sx?$|(?:^|\/)(?:README|CHANGELOG|\.env\.example)/i.test(path);
  if (isExampleOrTest) return issues;

  const authFile = /(?:auth|oauth|login|signin|sign-in|callback|session|identity|middleware|firebase|supabase|nextauth|passport)/i.test(path);
  const apiFile = /(?:api|integrations?|webhook|client|provider|service)/i.test(path);
  const authSource = /(?:GoogleAuthProvider|google\.accounts\.id|accounts\.google\.com\/o\/oauth2|oauth2\.googleapis\.com|next-auth|@auth\/|passport-google-oauth|firebase\/auth)/i.test(content);
  const auth = authFile || authSource;
  const api = apiFile || /(?:axios|fetch)\s*\(/i.test(content);
  const push = (
    pattern: RegExp,
    condition: boolean,
    category: NonNullable<InspectionFinding["category"]>,
    level: InspectionFinding["level"],
    title: string,
    detail: string,
    recommendation: string
  ) => {
    if (!condition || issues.length >= 7) return;
    const match = pattern.exec(content);
    if (!match) return;
    const line = content.slice(0, match.index).split(/\r?\n/).length;
    issues.push({ category, level, title, detail, recommendation, file: path, line });
  };

  push(/(?:NEXT_PUBLIC_|VITE_|REACT_APP_)[A-Z0-9_]*(?:CLIENT_SECRET|PRIVATE_KEY|SERVICE_ACCOUNT|API_SECRET)\b/i,
    true, "security", "attention", "Potentially public OAuth/API secret",
    "A browser-exposed environment variable name resembles a private credential. Verify it does not contain a secret; this is a name-based heuristic.",
    "Keep client secrets on the server and rotate any credential already bundled into a published frontend.");

  push(/(?:[?&](?:password|passwd|client_secret|access_token)=|searchParams\.set\(\s*["'](?:password|client_secret|access_token)["'])/i,
    auth || api, "security", "attention", "Sensitive credential in URL pattern",
    "A password, client secret or token appears to be placed in a query string. URLs can leak through logs, referrers and browser history.",
    "Pass secrets only through approved secure channels, not URL parameters; verify the actual request flow.");

  push(/(?:mode\s*:\s*["']no-cors["']|mode\s*=\s*["']no-cors["'])/i,
    api, "api", "review", "Opaque API response mode",
    "A no-cors fetch mode can hide response bodies and status codes, preventing reliable API error reporting.",
    "Configure the API's allowed origins and handle CORS correctly instead of using no-cors as a workaround.");

  push(/(?:baseURL|baseUrl|apiUrl|API_URL)\s*[:=]\s*["']http:\/\//i,
    api, "api", "review", "Plaintext API base URL",
    "A provider or API base URL appears to use HTTP. Check whether sensitive traffic could leave a trusted local network.",
    "Use HTTPS for deployed external APIs and validate the production endpoint configuration.");

  push(/(?:accounts\.google\.com\/o\/oauth2(?:\/v2)?\/auth|oauth2\.googleapis\.com\/auth|response_type=code)/i,
    auth && !/(?:\bstate\b|\bcode_challenge\b|generateState|createState)/i.test(content),
    "oauth", "review", "OAuth authorization state not evident",
    "An authorization-code request is referenced, but state/PKCE handling is not visible in this sampled file. Libraries may implement it elsewhere.",
    "Verify state validation and PKCE where applicable, and test the complete Google OAuth redirect/callback flow.");

  push(/(?:searchParams\.get\(\s*["']code["']|req\.query\.code|request\.query\.code)/i,
    authFile && /(?:oauth|callback)/i.test(path) && !/(?:\bstate\b|pkce|code_verifier|csrf)/i.test(content),
    "oauth", "review", "OAuth callback state validation not evident",
    "A callback reads an authorization code, but state/PKCE validation is not apparent in this file. The check may be delegated elsewhere.",
    "Ensure callback state matches the initiating session before exchanging a code; validate issuer, audience and expiry of identity tokens.");

  push(/(?:catch\s*\([^)]*\)\s*\{\s*\}|catch\s*\{\s*\})/i,
    auth, "authentication", "review", "Authentication error may be swallowed",
    "An empty catch block appears in authentication-related code, potentially hiding login or provider failures.",
    "Record a safe error code, show a helpful user message, and never log tokens or secrets.");

  push(/(?:app\.(?:post|all)\s*\(\s*["'][^"']*webhook|export\s+async\s+function\s+POST\s*\()/i,
    /webhook/i.test(path) && !/(?:verify|signature|hmac|timingSafeEqual|constructEvent|validateWebhook)/i.test(content),
    "api", "review", "Webhook signature verification not evident",
    "An inbound webhook handler is present without visible signature validation in this file. It may be performed by shared middleware.",
    "Verify the provider's signed payload using the raw body and a server-side secret before trusting or processing events.");

  push(/(?:jwt\.decode\s*\(|jwtDecode\s*\(|decodeJwt\s*\()/i,
    auth && !/(?:jwt\.verify\s*\(|jwtVerify\s*\(|verifyIdToken\s*\(|verifyToken\s*\()/i.test(content),
    "authentication", "attention", "JWT decode without visible verification",
    "Token decoding appears without signature verification in the same file. Decoding alone must not establish identity.",
    "Verify token signature, issuer, audience, expiration and nonce where applicable before creating a session.");

  push(/(?:redirect\s*\(\s*(?:searchParams|params|req\.query|request\.nextUrl)|window\.location\s*=\s*(?:searchParams|params))/i,
    auth, "authentication", "review", "Unvalidated login redirect target",
    "A login-related redirect appears to use an untrusted parameter directly; an open redirect may be possible.",
    "Restrict post-login redirects to same-origin relative paths or a strict destination allowlist.");

  return issues;
}
