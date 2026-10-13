import { PreviewNotice } from "../components/preview-notice";
import { isPreviewMode } from "../../lib/preview-data";
import { SiteNavigation } from "../components/site-navigation";
import { SessionActions } from "../components/session-actions";
import Link from "next/link";
import { fetchInvestigations } from "../../lib/api";
export default async function InvestigationsPage() {
 const items=await fetchInvestigations();
 return <main className="content standalone"><div className="topline"><div><div className="eyebrow">SENTINELOS / INVESTIGATIONS</div><h2>Investigations</h2><p>Review investigation evidence and progress for detected incidents.</p></div><div className="pageActions">{isPreviewMode ? <span className="previewTag">Demo preview</span> : <SessionActions />}<Link className="back" href="/">Command Center</Link></div></div><div className="inlineNavigation"><SiteNavigation /></div><PreviewNotice /><div className="pageActions" style={{marginBottom:16}}><Link className="back" href="/website-check">Open Web Inspector →</Link><Link className="back" href="/scan">Source Inspector →</Link></div><section className="panel tablePanel">{items?.length ? items.map(x=><div className="activityRow" key={x.id}><div><strong>{x.incident_title}</strong><small>{x.incident_severity} · {x.status} · {x.id}</small></div><time>{new Date(x.created_at).toLocaleString()}</time></div>) : <div className="empty">{items ? "No investigations yet. Investigations appear after an incident is queued for review." : "Authenticated API connection required."}</div>}</section></main>;
}