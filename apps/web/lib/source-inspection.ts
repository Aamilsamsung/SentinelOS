import { inflateRawSync } from "node:zlib";

export type InspectionFinding = {
  level: "attention" | "review" | "info";
  title: string;
  detail: string;
  file?: string;
};
export type InspectionCheck = { label: string; passed: boolean; detail: string };
export type InspectionReport = {
  kind: "github" | "zip";
  name: string;
  source: string;
  filesDiscovered: number;
  filesInspected: number;
  sampledPaths: string[];
  languages: string[];
  checks: InspectionCheck[];
  findings: InspectionFinding[];
  partial: boolean;
  inspectedAt: string;
};

type FileEntry = { path: string; size: number; content?: string };
const MAX_FILES = 24;
const MAX_FILE_BYTES = 128 * 1024;
const MAX_ZIP_BYTES = 5 * 1024 * 1024;
const MAX_PATHS = 5000;
const codeExt = /\.(tsx?|jsx?|py|go|rs|java|rb|sql|sh|tf|ya?ml|json|toml|md|txt|vue|svelte)$/i;
const ignoredDir = /(^|\/)(node_modules|vendor|dist|build|\.next|\.git|coverage|__pycache__)(\/|$)/i;

function safePath(path: string): boolean {
  return path.length > 0 && path.length < 400 &&
    !path.startsWith("/") && !path.includes("\\") &&
    !path.split("/").some(segment => segment === ".." || segment === "." || !segment) &&
    !ignoredDir.test(path);
}

function prioritise(path: string): number {
  if (/(^|\/)(package\.json|pyproject\.toml|requirements\.txt|go\.mod|Cargo\.toml|Dockerfile)$/i.test(path)) return 0;
  if (/\.github\/workflows\/.*\.ya?ml$/i.test(path)) return 1;
  if (/(^|\/)(README\.md|\.env\.example)$/i.test(path)) return 2;
  if (/(^|\/)(__tests__|test|tests|spec)(\/|\.)|\.(test|spec)\.[jt]sx?$/i.test(path)) return 3;
  return 4;
}
function candidate(path: string): boolean {
  return safePath(path) && (codeExt.test(path) || /(^|\/)(Dockerfile|Makefile|\.env\.example|requirements\.txt|go\.mod|Cargo\.toml)$/.test(path));
}
function selectPaths<T extends FileEntry>(entries: T[]): T[] {
  return entries.filter(e => candidate(e.path) && e.size <= MAX_FILE_BYTES && e.size >= 0)
    .sort((a, b) => prioritise(a.path) - prioritise(b.path) || a.path.localeCompare(b.path))
    .slice(0, MAX_FILES);
}
function languageFor(path: string): string | null {
  const extension = path.split(".").pop()?.toLowerCase();
  const labels: Record<string, string> = {
    ts: "TypeScript", tsx: "TypeScript", js: "JavaScript", jsx: "JavaScript",
    py: "Python", go: "Go", rs: "Rust", java: "Java", rb: "Ruby",
    tf: "Terraform", sql: "SQL", vue: "Vue", svelte: "Svelte"
  };
  return labels[extension ?? ""] ?? null;
}

export function createInspectionReport(
  kind: "github" | "zip", name: string, source: string,
  allFiles: FileEntry[], sampled: FileEntry[], partial = false
): InspectionReport {
  const paths = allFiles.map(f => f.path);
  const has = (pattern: RegExp) => paths.some(p => pattern.test(p));
  const checks: InspectionCheck[] = [
    { label: "Project manifest", passed: has(/(^|\/)(package\.json|pyproject\.toml|requirements\.txt|go\.mod|Cargo\.toml|pom\.xml|Gemfile)$/i), detail: "A dependency or build manifest is present" },
    { label: "Automated tests", passed: has(/(^|\/)(__tests__|tests?|spec)(\/|\.)|\.(test|spec)\.[jt]sx?$|test_.*\.py$|_test\.go$/i), detail: "Test paths or test files detected" },
    { label: "CI workflow", passed: has(/(^|\/)(\.github\/workflows\/[^/]+\.ya?ml|\.gitlab-ci\.yml|Jenkinsfile)$/i), detail: "Continuous integration configuration detected" },
    { label: "Documentation", passed: has(/(^|\/)README(?:\.[a-z0-9]+)?$/i), detail: "Project README detected" }
  ];
  const findings: InspectionFinding[] = [];
  for (const check of checks) if (!check.passed) findings.push({
    level: "review", title: check.label + " not found",
    detail: "No matching file was found in the submitted file list. Confirm this is intentional or add it."
  });
  const envs = paths.filter(p => /(^|\/)\.env(\.[^/]*)?$/i.test(p) && !/\.example$|\.sample$|\.template$/i.test(p));
  if (envs.length) findings.push({
    level: "attention", title: "Environment file included",
    detail: "Potential secret-bearing environment configuration found. Check it is not published or shared.",
    file: envs[0]
  });
  let matchedRules = 0;
  for (const file of sampled) {
    if (!file.content || matchedRules >= 12) continue;
    const sourceText = file.content;
    if (/\beval\s*\(/.test(sourceText) || /\bshell\s*=\s*True\b/.test(sourceText)) {
      findings.push({ level: "review", title: "Dynamic execution pattern", file: file.path,
        detail: "Review dynamic evaluation or shell execution and verify inputs are controlled. This is a pattern match, not a confirmed vulnerability." });
      matchedRules++;
    }
    if (/\bverify\s*=\s*False\b|rejectUnauthorized\s*:\s*false\b/.test(sourceText)) {
      findings.push({ level: "attention", title: "TLS verification may be disabled", file: file.path,
        detail: "A TLS verification bypass pattern was found. Verify it is not enabled in production." });
      matchedRules++;
    }
    // Authentication and third-party API integration checks are static heuristics.
    // Never claim to validate a live OAuth handshake, callback or provider credentials.
    const authRelevant = /(?:auth|login|signin|sign-in|oauth|callback|session|middleware|firebase|supabase|nextauth|passport)/i.test(file.path)
      || /(?:google-auth-library|next-auth|@auth\/|firebase\/auth|passport-google-oauth|googleapis)/i.test(sourceText);
    const emit = (level: InspectionFinding["level"], title: string, detail: string) => {
      if (matchedRules >= 12) return;
      findings.push({ level, title, detail, file: file.path });
      matchedRules++;
    };
    if (authRelevant && /(?:redirect_uri_mismatch|invalid_client|invalid_grant|unauthorized_client)/i.test(sourceText)) {
      emit("review", "OAuth provider error reference", "OAuth error strings were found in an authentication-related file. Check configured callback URLs, OAuth client ID and provider settings; this does not prove a current failure.");
    }
    if (authRelevant && /(?:client_secret|clientSecret|GOOGLE_CLIENT_SECRET|NEXTAUTH_SECRET|AUTH_SECRET)\s*[:=]\s*["'][^"'$\\{][^"']{7,}["']/i.test(sourceText)) {
      emit("attention", "Possible embedded authentication secret", "A possible hard-coded authentication secret was found. Review it and use a server-side secret manager. Do not upload real credentials to a public preview.");
    }
    if (authRelevant && /(?:localStorage|sessionStorage)\.setItem\s*\(\s*["'`][^"'`]*(?:token|session|access_token|refresh_token)/i.test(sourceText)) {
      emit("review", "Authentication token stored in browser storage", "A token storage pattern was found. Review XSS exposure, token lifetime and safer HttpOnly cookie alternatives.");
    }
    if (authRelevant && /(?:sameSite\s*:\s*["']none["']|sameSite\s*:\s*false)/i.test(sourceText)) {
      emit("review", "Cross-site session cookie configuration", "Review cookie Secure, HttpOnly, SameSite and CSRF protections for authentication flows.");
    }
    if (authRelevant && /(?:signInWithPopup|signInWithRedirect|GoogleProvider|GoogleAuthProvider|passport\.authenticate\(["']google|provider\s*:\s*["']google)/i.test(sourceText)) {
      const hasCallback = paths.some(p => /(?:auth|oauth|callback|redirect|firebase|middleware)/i.test(p));
      if (!hasCallback) emit("review", "Google login callback not evident", "Google sign-in code appears in the sampled source, but no obvious callback or auth configuration path was discovered. Confirm the authorized redirect URI and server-side verification.");
    }
    if (/\bfetch\s*\(\s*["'`]http:\/\//i.test(sourceText) && !/(?:test|spec|mock|fixture)/i.test(file.path)) {
      emit("review", "Unencrypted API request pattern", "A literal HTTP API URL was found. Confirm transport encryption and avoid sending credentials over plaintext.");
    }
    if (/(?:axios|fetch)\s*\([^)]*(?:process\.env\.NEXT_PUBLIC_[A-Z_]*(?:SECRET|TOKEN|KEY)|import\.meta\.env\.VITE_[A-Z_]*(?:SECRET|TOKEN|KEY))/i.test(sourceText)) {
      emit("review", "Client-exposed API credential reference", "A public-prefixed environment variable resembling a credential was found in an API call. Verify that no private keys are bundled into the browser.");
    }
    if (/\b(TODO|FIXME)\b/.test(sourceText) && matchedRules < 12) {
      findings.push({ level: "info", title: "Outstanding work marker", file: file.path,
        detail: "TODO or FIXME marker appears in a sampled file. Review whether it affects release readiness." });
      matchedRules++;
    }
  }
  const languages = Array.from(new Set(paths.map(languageFor).filter((x): x is string => Boolean(x)))).slice(0, 7);
  if (!findings.length) findings.push({ level: "info", title: "No flagged patterns in this limited sample",
    detail: "This is not a clean bill of health. The inspector checks file structure and a small set of source-code patterns only." });
  return {
    kind, name, source, filesDiscovered: allFiles.length,
    filesInspected: sampled.filter(s => s.content !== undefined).length,
    sampledPaths: sampled.filter(s => s.content !== undefined).map(s => s.path),
    languages, checks, findings, partial,
    inspectedAt: new Date().toISOString()
  };
}

export function inspectZip(bytes: Buffer, filename: string): InspectionReport {
  if (bytes.length > MAX_ZIP_BYTES) throw new Error("ZIP exceeds the 5 MB preview limit.");
  if (bytes.length < 22) throw new Error("Invalid ZIP archive.");
  // Find the end-of-central-directory record. No files are written or executed.
  let end = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i--) {
    if (bytes.readUInt32LE(i) === 0x06054b50) { end = i; break; }
  }
  if (end < 0) throw new Error("Invalid ZIP central directory.");
  const total = bytes.readUInt16LE(end + 10);
  const centralSize = bytes.readUInt32LE(end + 12);
  const centralOffset = bytes.readUInt32LE(end + 16);
  if (total === 0 || total > MAX_PATHS || centralSize === 0xffffffff || centralOffset === 0xffffffff
    || centralOffset + centralSize > bytes.length) throw new Error("ZIP is empty, too large or unsupported (ZIP64).");
  const entries: (FileEntry & { offset: number; method: number; compressed: number; flags: number })[] = [];
  let cursor = centralOffset;
  for (let i = 0; i < total; i++) {
    if (cursor + 46 > bytes.length || bytes.readUInt32LE(cursor) !== 0x02014b50) throw new Error("Malformed ZIP directory.");
    const flags = bytes.readUInt16LE(cursor + 8);
    const method = bytes.readUInt16LE(cursor + 10);
    const compressed = bytes.readUInt32LE(cursor + 20);
    const size = bytes.readUInt32LE(cursor + 24);
    const nameLength = bytes.readUInt16LE(cursor + 28);
    const extraLength = bytes.readUInt16LE(cursor + 30);
    const commentLength = bytes.readUInt16LE(cursor + 32);
    const offset = bytes.readUInt32LE(cursor + 42);
    const next = cursor + 46 + nameLength + extraLength + commentLength;
    if (next > bytes.length) throw new Error("Malformed ZIP filename.");
    const path = bytes.subarray(cursor + 46, cursor + 46 + nameLength).toString("utf8");
    if (!path.endsWith("/") && safePath(path) && !(flags & 1)) entries.push({ path, size, offset, method, compressed, flags });
    cursor = next;
  }
  if (!entries.length) throw new Error("No safe, readable files were found in this ZIP.");
  const chosen = selectPaths(entries);
  const sampled: FileEntry[] = [];
  let totalOutput = 0;
  for (const entry of chosen) {
    if (entry.offset + 30 > bytes.length || bytes.readUInt32LE(entry.offset) !== 0x04034b50) continue;
    if (entry.method !== 0 && entry.method !== 8) continue;
    const nameLength = bytes.readUInt16LE(entry.offset + 26);
    const extraLength = bytes.readUInt16LE(entry.offset + 28);
    const start = entry.offset + 30 + nameLength + extraLength;
    if (start + entry.compressed > bytes.length || totalOutput + entry.size > 1024 * 1024) continue;
    try {
      const raw = bytes.subarray(start, start + entry.compressed);
      const expanded = entry.method === 8 ? inflateRawSync(raw, { maxOutputLength: MAX_FILE_BYTES }) : raw;
      if (expanded.length !== entry.size || expanded.length > MAX_FILE_BYTES) continue;
      totalOutput += expanded.length;
      sampled.push({ path: entry.path, size: entry.size, content: expanded.toString("utf8") });
    } catch { /* malformed, oversized or unsupported entry is never executed */ }
  }
  return createInspectionReport("zip", filename.slice(0, 120), "Uploaded ZIP (processed in memory)", entries, sampled, sampled.length < chosen.length);
}

async function getJson(url: string): Promise<unknown> {
  const response = await fetch(url, {
    headers: { accept: "application/vnd.github+json", "user-agent": "SentinelOS-Preview-Inspector" },
    redirect: "error", cache: "no-store", signal: AbortSignal.timeout(9000)
  });
  if (!response.ok) {
    if (response.status === 404) throw new Error("Public GitHub repository not found.");
    if (response.status === 403 || response.status === 429) throw new Error("GitHub rate limit reached. Try the ZIP option.");
    throw new Error("GitHub could not be reached. Try again later.");
  }
  return response.json();
}

async function limitedText(url: string): Promise<string | undefined> {
  try {
    const response = await fetch(url, {
      headers: { "user-agent": "SentinelOS-Preview-Inspector" },
      redirect: "error", cache: "no-store", signal: AbortSignal.timeout(7000)
    });
    if (!response.ok || !response.body) return undefined;
    const reader = response.body.getReader();
    const parts: Uint8Array[] = [];
    let length = 0;
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        length += value.byteLength;
        if (length > MAX_FILE_BYTES) return undefined;
        parts.push(value);
      }
    } finally { await reader.cancel().catch(() => {}); }
    return Buffer.concat(parts).toString("utf8");
  } catch { return undefined; }
}

export async function inspectGitHub(value: string): Promise<InspectionReport> {
  let url: URL;
  try { url = new URL(value.trim()); } catch { throw new Error("Enter a valid public GitHub repository URL."); }
  if (url.protocol !== "https:" || url.hostname.toLowerCase() !== "github.com" || url.port || url.username || url.password) {
    throw new Error("Only https://github.com/owner/repository links are supported.");
  }
  const segments = url.pathname.split("/").filter(Boolean);
  if (segments.length !== 2 || !segments.every(s => /^[a-zA-Z0-9_.-]{1,100}$/.test(s))) {
    throw new Error("Use a repository root URL, such as https://github.com/owner/repository.");
  }
  const owner = segments[0];
  const repository = segments[1].replace(/\.git$/i, "");
  if (!repository || owner === "." || owner === ".." || repository === "." || repository === "..") {
    throw new Error("Invalid GitHub repository URL.");
  }
  const api = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}`;
  const metadata = await getJson(api) as { default_branch?: string; private?: boolean; full_name?: string };
  if (metadata.private || typeof metadata.default_branch !== "string") throw new Error("Only public repositories can be inspected.");
  const tree = await getJson(`${api}/git/trees/${encodeURIComponent(metadata.default_branch)}?recursive=1`) as {
    tree?: Array<{ path?: string; type?: string; size?: number }>; truncated?: boolean
  };
  if (!Array.isArray(tree.tree)) throw new Error("Could not list files in this repository.");
  const allFiles = tree.tree
    .filter(e => e.type === "blob" && typeof e.path === "string" && safePath(e.path))
    .slice(0, MAX_PATHS)
    .map(e => ({ path: e.path as string, size: e.size ?? MAX_FILE_BYTES + 1 }));
  if (!allFiles.length) throw new Error("No readable files were found in this repository.");
  const chosen = selectPaths(allFiles);
  const sampled: FileEntry[] = [];
  for (let index = 0; index < chosen.length; index += 4) {
    const chunk = chosen.slice(index, index + 4);
    const values = await Promise.all(chunk.map(async entry => ({
      ...entry,
      content: await limitedText(`https://raw.githubusercontent.com/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/${encodeURIComponent(metadata.default_branch!)}/${entry.path.split("/").map(encodeURIComponent).join("/")}`)
    })));
    sampled.push(...values);
  }
  return createInspectionReport("github", metadata.full_name ?? `${owner}/${repository}`,
    `https://github.com/${owner}/${repository}`, allFiles, sampled,
    Boolean(tree.truncated || tree.tree.length > MAX_PATHS || sampled.some(f => f.content === undefined)));
}
