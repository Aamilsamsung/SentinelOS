"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";

type Provider = "github" | "sentry" | "prometheus" | "generic_webhook";
type Integration = { id: string; provider: Provider; name: string; status: string; last_error?: string | null; updated_at?: string };
const providerDetails: { key: Provider; label: string; symbol: string; description: string; capability: string }[] = [
  { key: "github", label: "GitHub", symbol: "⌁", description: "Connect GitHub deployments; push, CI and build-failure monitoring is being added.", capability: "Signed deployment webhooks available; push/CI monitoring pending" },
  { key: "sentry", label: "Sentry", symbol: "◇", description: "Register Sentry as an observability source.", capability: "Configuration registry only" },
  { key: "prometheus", label: "Prometheus", symbol: "▤", description: "Register a metrics monitoring source.", capability: "Configuration registry only" },
  { key: "generic_webhook", label: "Generic webhook", symbol: "⎇", description: "Register a custom integration record.", capability: "Configuration registry only" }
];

function readCsrf() {
  const value = document.cookie.split(";").map(s => s.trim()).find(s => s.startsWith("sentinelos_csrf="))?.slice("sentinelos_csrf=".length);
  return value ? decodeURIComponent(value) : null;
}

export function IntegrationManager({ preview }: { preview: boolean }) {
  const [provider, setProvider] = useState<Provider>("github");
  const [name, setName] = useState("");
  const [credential, setCredential] = useState("");
  const [busy, setBusy] = useState(false);
  const [list, setList] = useState<Integration[] | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    if (preview) return;
    try {
      const response = await fetch("/api/integrations", { cache: "no-store" });
      if (!response.ok) {
        setList(null);
        return;
      }
      const body = await response.json() as { data?: Integration[] };
      setList(body.data ?? []);
    } catch { setList(null); }
  }, [preview]);
  useEffect(() => { void reload(); }, [reload]);

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (preview || busy) return;
    const csrf = readCsrf();
    if (!csrf) { setError("Sign in again to configure integrations."); return; }
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/integrations", {
        method: "POST",
        headers: { "content-type": "application/json", "x-csrf-token": csrf },
        body: JSON.stringify({ provider, name: name.trim() }), cache: "no-store"
      });
      const result = await response.json() as { data?: Integration; error?: string | { message?: string } };
      if (!response.ok || !result.data?.id) {
        const errorText = typeof result.error === "string" ? result.error : result.error?.message;
        throw new Error(errorText || "Could not create integration.");
      }
      if (credential.trim()) {
        const secretResponse = await fetch(`/api/integrations/${encodeURIComponent(result.data.id)}/credential`, {
          method: "PUT",
          headers: { "content-type": "application/json", "x-csrf-token": csrf },
          body: JSON.stringify({ credential }), cache: "no-store"
        });
        if (!secretResponse.ok) {
          setMessage("Integration registered, but credential configuration failed. Ask an administrator to rotate its credential securely.");
        } else {
          setMessage("Integration registered and credential securely saved. Provider-specific setup is still required before data will flow.");
        }
      } else {
        setMessage("Integration record created. It is not yet connected to incoming data; finish provider-side configuration.");
      }
      setName("");
      setCredential("");
      await reload();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Could not create integration.");
    } finally { setBusy(false); }
  }

  return <div className="integrationLayout">
    <section className="integrationMain">
      <div className="integrationTiles">
        {providerDetails.map(item => <div key={item.key} className="providerTile">
          <span className="providerIcon">{item.symbol}</span>
          <div><strong>{item.label}</strong><p>{item.description}</p><small>{item.capability}</small></div>
        </div>)}
      </div>
      <div className="integrationFormPanel">
        <div className="eyebrow">SETUP</div><h2>Register an integration</h2>
        <p>{preview
          ? "This public preview has no authenticated backend, so live connection setup is disabled. You can still inspect a public GitHub repository or a ZIP on the Source Inspector page."
          : "Register a source with your organization. For GitHub, add a shared webhook secret and configure delivery in GitHub; other providers are currently registry-only."}</p>
        <form className="integrationForm" onSubmit={create}>
          <label htmlFor="provider">Provider</label>
          <select id="provider" value={provider} disabled={preview || busy} onChange={e => setProvider(e.target.value as Provider)}>
            {providerDetails.map(item => <option key={item.key} value={item.key}>{item.label}</option>)}
          </select>
          <label htmlFor="connection-name">Connection name</label>
          <input id="connection-name" value={name} onChange={e => setName(e.target.value)} disabled={preview || busy} required maxLength={120} placeholder="Production deployments" />
          <label htmlFor="connection-secret">Shared webhook secret / credential <span>(optional)</span></label>
          <input id="connection-secret" type="password" autoComplete="off" value={credential} onChange={e => setCredential(e.target.value)} disabled={preview || busy} maxLength={20000} placeholder="Only enter credentials on a trusted production deployment" />
          <small>Credentials are sent only to the authenticated backend&apos;s encrypted credential endpoint. Do not enter secrets in the public demo.</small>
          {error && <div role="alert" className="inspectError">{error}</div>}
          {message && <div role="status" className="integrationSuccess">{message}</div>}
          <button className="inspectButton" type="submit" disabled={preview || busy}>{busy ? "Saving…" : preview ? "Requires connected backend" : "Register integration"} <span>↗</span></button>
        </form>
        {provider === "github" && <div className="setupNote"><strong>GitHub webhook setup</strong><p>Once you have an API deployment and organization ID, configure a GitHub webhook to <code>/v1/webhooks/github/YOUR_ORGANIZATION_ID</code> on your API domain. Select <code>deployment</code> and <code>deployment_status</code> events and enter the same shared secret. Push, workflow-run, and check-run event processing is not yet implemented.</p></div>}
      </div>
    </section>
    <aside className="integrationSide">
      <div className="eyebrow">CONNECTION STATUS</div><h3>Your connections</h3>
      {preview ? <div className="connectionEmpty"><span>⎇</span><strong>Live connections unavailable</strong><p>Public preview mode deliberately avoids using real integrations or credentials.</p><Link href="/scan">Inspect a project instead ↗</Link></div>
        : list === null ? <div className="connectionEmpty"><strong>Session or API unavailable</strong><p>Sign in and connect the SentinelOS backend to manage your organization&apos;s integrations.</p></div>
        : list.length ? <div className="connectionList">{list.map(item => <div className="connectionItem" key={item.id}><strong>{item.name}</strong><small>{item.provider} · {item.status}</small>{item.last_error && <p>{item.last_error}</p>}</div>)}</div>
        : <div className="connectionEmpty"><span>⎇</span><strong>No integrations registered</strong><p>Add a provider using the setup form.</p></div>}
      <div className="setupNote"><strong>What works now?</strong><p>Source Inspector performs actual limited static checks. Signed GitHub deployment webhook ingestion is implemented in the backend but requires secure deployment/configuration. Sentry, Prometheus and generic provider records alone do not start monitoring.</p></div>
    </aside>
  </div>;
}
