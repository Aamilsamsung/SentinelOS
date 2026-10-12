import { PreviewNotice } from "../components/preview-notice";
import { isPreviewMode } from "../../lib/preview-data";
import { SiteNavigation } from "../components/site-navigation";
import { SessionActions } from "../components/session-actions";
import Link from "next/link";
import { fetchActions } from "../../lib/api";
import { ActionControls } from "./action-controls";

export default async function ActionsPage() {
 const items=await fetchActions();
 return <main className="content standalone"><div className="topline"><div><div className="eyebrow">SENTINELOS / ACTIONS</div><h2>Remediation actions</h2><p>Approval-gated remediation and verification status.</p></div><div className="pageActions">{isPreviewMode ? <span className="previewTag">Demo preview</span> : <SessionActions />}<Link className="back" href="/">Command Center</Link></div></div><div className="inlineNavigation"><SiteNavigation /></div><PreviewNotice /><section className="panel tablePanel">{items?.length ? items.map(x=><div className="actionEntry" key={x.id}><div className="activityRow"><div><strong>{x.action_type} · {x.incident_title}</strong><small>{x.status}{x.verification_status ? ` · verification: ${x.verification_status}` : ""}</small>{x.rationale ? <small>{x.rationale}</small> : null}</div><time>{new Date(x.requested_at).toLocaleString()}</time></div>{x.status === "requested" && !isPreviewMode ? <ActionControls actionId={x.id} /> : null}</div>) : <div className="empty">{items ? "No remediation actions recorded." : "Authenticated API connection required."}</div>}</section></main>;
}