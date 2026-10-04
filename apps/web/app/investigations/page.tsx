import Link from "next/link";
import { fetchInvestigations } from "../../lib/api";
export default async function InvestigationsPage() {
 const items=await fetchInvestigations();
 return <main className="content standalone"><div className="topline"><div><div className="eyebrow">SENTINELOS / INVESTIGATIONS</div><h2>Investigations</h2><p>Evidence-driven investigations across this organization.</p></div><Link className="back" href="/">Command Center</Link></div><section className="panel tablePanel">{items?.length ? items.map(x=><div className="activityRow" key={x.id}><div><strong>{x.incident_title}</strong><small>{x.incident_severity} · {x.status} · {x.id}</small></div><time>{new Date(x.created_at).toLocaleString()}</time></div>) : <div className="empty">{items ? "No investigations recorded." : "Authenticated API connection required."}</div>}</section></main>;
}