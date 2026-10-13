"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

type Check = { name: string; passed: boolean; detail: string };
type Result = { url: string; status: number; redirect: boolean; checks: Check[]; checkedAt: string; scope: string };

export default function WebsiteCheckPage() {
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError(""); setResult(null);
    try {
      const response = await fetch("/api/website-check", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ url }), cache: "no-store"
      });
      const payload = await response.json() as { data?: Result; error?: string };
      if (!response.ok || !payload.data) throw new Error(payload.error || "Website check failed.");
      setResult(payload.data);
    } catch (e) { setError(e instanceof Error ? e.message : "Website check failed."); }
    finally { setBusy(false); }
  }
  return <main className="shell"><section className="content scanContent">
    <div className="scanTopbar"><div className="breadcrumb"><Link href="/">Workspace</Link><span>/</span><Link href="/scan">Source Inspector</Link><span>/</span><strong>Website Check</strong></div></div>
    <div className="scanHero"><div className="eyebrow">PASSIVE WEBSITE INSPECTION</div>
      <h1>Inspect a live <span>website.</span></h1>
      <p>Check HTTPS response behavior and selected security headers. This preview does not attempt login, exploitation, crawling, or active penetration testing.</p>
    </div>
    <section className="inspectorPanel"><div className="panelTop"><h3>Website URL</h3></div>
      <form className="inspectorForm" onSubmit={submit}>
        <div className="inputSection"><label htmlFor="website-url">Public HTTPS website</label>
          <input id="website-url" type="url" required placeholder="https://example.com" value={url} onChange={e=>setUrl(e.target.value)} />
        </div>
        <button className="inspectButton" type="submit" disabled={busy}>{busy ? "Checking website…" : "Run passive website check"}</button>
        {error && <p className="inspectError" role="alert">{error}</p>}
      </form>
    </section>
    {result && <section className="inspectionResults" aria-live="polite">
      <div className="resultsHeader"><div><div className="eyebrow">CHECK FINISHED</div><h2>{result.url}</h2><p>HTTP status {result.status} · {new Date(result.checkedAt).toLocaleString()}</p></div></div>
      <div className="reportCard"><h3>Observed security headers</h3>
        {result.checks.map(check=><div className="checkRow" key={check.name}><span className={check.passed ? "checkIcon positive" : "checkIcon warning"}>{check.passed ? "✓" : "!"}</span><span><strong>{check.name}</strong><small>{check.detail} — {check.passed ? "Observed" : "Not observed"}</small></span></div>)}
        <p className="inspectorDisclaimer">{result.scope} Missing headers are review signals, not confirmed exploitable vulnerabilities.</p>
      </div>
    </section>}
  </section></main>;
}
