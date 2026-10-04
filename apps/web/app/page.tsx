import Link from "next/link";
import { fetchActivity, fetchDashboardSummary } from "../lib/api";

const sections = ["Command Center","Incidents","Investigations","Actions","Knowledge","Integrations"];

export default async function CommandCenter() {
  const [summary, activity] = await Promise.all([fetchDashboardSummary(), fetchActivity()]);
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
        <nav>{sections.map((section, index) => section === "Incidents" ? <Link className="nav" href="/incidents" key={section}>{section}</Link> : <div className={index === 0 ? "nav active" : "nav"} key={section}>{section}</div>)}</nav>
        <div className="status"><span />{summary ? "Operational data connected" : "API connection required"}</div>
      </aside>
      <section className="content">
        <header><div><div className="eyebrow">OPERATIONS</div><h2>System overview</h2><p>{summary ? "Live organization-scoped operational summary." : "Configure the SentinelOS API session to load operational data."}</p></div><button disabled>Run investigation</button></header>
        <div className="grid">{cards.map(([label,value,detail]) => <article key={label}><label>{label}</label><strong>{value ?? "—"}</strong><small>{summary ? detail : "Waiting for API"}</small></article>)}</div>
        <section className="panel"><div><div className="eyebrow">ACTIVITY</div><h3>Operational timeline</h3></div><div className="activity">{activity?.length ? activity.slice(0, 8).map(item => <div className="activityRow" key={item.id}><div><strong>{item.action}</strong><small>{item.resource_type}{item.resource_id ? ` · ${item.resource_id}` : ""}</small></div><time>{new Date(item.created_at).toLocaleString()}</time></div>) : <div className="empty">{summary ? "No audited activity is available for this account." : "Connect to the SentinelOS API to load incidents, evidence, investigations, and remediation activity."}</div>}</div></section>
      </section>
    </main>
  );
}
