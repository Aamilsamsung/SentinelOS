import { SessionActions } from "./components/session-actions";
import { SiteNavigation } from "./components/site-navigation";
import { fetchActivity, fetchDashboardSummary } from "../lib/api";

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
        <SiteNavigation />
        <div className="status"><span />{summary ? "Operational data connected" : "Sign in to load operational data"}</div>
      </aside>
      <section className="content">
        <div className="mobileNavigation"><SiteNavigation /></div>
        <header><div><div className="eyebrow">OPERATIONS</div><h2>System overview</h2><p>{summary ? "Live organization-scoped operational summary." : "Sign in with an authorized account to load operational data."}</p></div><SessionActions /></header>
        <div className="grid">{cards.map(([label,value,detail]) => <article key={label}><label>{label}</label><strong>{value ?? "—"}</strong><small>{summary ? detail : "Waiting for API"}</small></article>)}</div>
        <section className="panel"><div><div className="eyebrow">ACTIVITY</div><h3>Operational timeline</h3></div><div className="activity">{activity?.length ? activity.slice(0, 8).map(item => <div className="activityRow" key={item.id}><div><strong>{item.action}</strong><small>{item.resource_type}{item.resource_id ? ` · ${item.resource_id}` : ""}</small></div><time>{new Date(item.created_at).toLocaleString()}</time></div>) : <div className="empty">{summary ? "No audited activity is available for this account." : "Sign in to load incidents, evidence, investigations, and remediation activity."}</div>}</div></section>
      </section>
    </main>
  );
}
