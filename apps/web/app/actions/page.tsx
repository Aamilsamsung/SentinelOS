import Link from "next/link";
import { fetchActions } from "../../lib/api";
export default async function ActionsPage() {
 const items=await fetchActions();
 return <main className="content standalone"><div className="topline"><div><div className="eyebrow">SENTINELOS / ACTIONS</div><h2>Remediation actions</h2><p>Approval-gated remediation and verification status.</p></div><Link className="back" href="/">Command Center</Link></div><section className="panel tablePanel">{items?.length ? items.map(x=><div className="activityRow" key={x.id}><div><strong>{x.action_type} · {x.incident_title}</strong><small>{x.status}{x.verification_status ? ` · verification: ${x.verification_status}` : ""}</small></div><time>{new Date(x.requested_at).toLocaleString()}</time></div>) : <div className="empty">{items ? "No remediation actions recorded." : "Authenticated API connection required."}</div>}</section></main>;
}