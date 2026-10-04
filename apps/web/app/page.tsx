import { fetchDashboardSummary } from "../lib/api";

const sections = ["Command Center","Incidents","Investigations","Actions","Knowledge","Integrations"];

export default async function CommandCenter() {
  const summary = await fetchDashboardSummary();
  const cards = [
    ["Open incidents", summary?.openIncidents, "Unresolved incidents"],
    ["Investigations", summary?.activeInvestigations, "Queued or running"],
    ["Pending approvals", summary?.pendingApprovals, "Human approval required"],
    ["Integrations", summary?.integrations.total, summary ? `${summary.integrations.unhealthy} unhealthy` : "Health not loaded"]
  ] as const;

  return (
    <main className="shell">
      <aside className="sidebar">
        <div><div className="eyebrow">SENTINELOS</div><h1>Command Center</h1></div>
        <nav>{sections.map((section, index) => <div className={index === 0 ? "nav active" : "nav"} key={section}>{section}</div>)}</nav>
        <div className="status"><span />{summary ? "Operational data connected" : "API connection required"}</div>
      </aside>
      <section className="content">
        <header><div><div className="eyebrow">OPERATIONS</div><h2>System overview</h2><p>{summary ? "Live organization-scoped operational summary." : "Configure the SentinelOS API session to load operational data."}</p></div><button disabled>Run investigation</button></header>
        <div className="grid">{cards.map(([label,value,detail]) => <article key={label}><label>{label}</label><strong>{value ?? "—"}</strong><small>{summary ? detail : "Waiting for API"}</small></article>)}</div>
        <section className="panel"><div><div className="eyebrow">ACTIVITY</div><h3>Operational timeline</h3></div><div className="empty">{summary ? "Activity timeline will stream audited operational events here." : "Connect to the SentinelOS API to load incidents, evidence, investigations, and remediation activity."}</div></section>
      </section>
    </main>
  );
}
