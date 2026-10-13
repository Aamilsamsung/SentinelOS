import { PreviewNotice } from "../components/preview-notice";
import { isPreviewMode } from "../../lib/preview-data";
import { SiteNavigation } from "../components/site-navigation";
import { SessionActions } from "../components/session-actions";
import Link from "next/link";
import { fetchIncidents } from "../../lib/api";

export default async function IncidentsPage() {
  const incidents = await fetchIncidents();
  return <main className="content standalone">
    <div className="topline"><div><div className="eyebrow">SENTINELOS / INCIDENTS</div><h2>Incidents</h2><p>Track detected failures, severity, status, and the affected source. Incidents appear when monitoring is connected.</p></div><div className="pageActions">{isPreviewMode ? <span className="previewTag">Demo preview</span> : <SessionActions />}<Link className="back" href="/">Command Center</Link></div></div><div className="inlineNavigation"><SiteNavigation /></div>
    <PreviewNotice /><div className="pageActions" style={{marginBottom:16}}><Link className="back" href="/website-check">Open Web Inspector →</Link><Link className="back" href="/scan">Source Inspector →</Link></div><section className="panel tablePanel">
      {incidents?.length ? <div className="incidentTable">
        <div className="incidentRow tableHead"><span>Incident</span><span>Severity</span><span>Status</span><span>Source</span><span>Detected</span></div>
        {incidents.map(incident => <div className="incidentRow" key={incident.id}>
          <span><strong>{incident.title}</strong><small>{incident.summary || incident.id}</small></span>
          <span className={`pill ${incident.severity}`}>{incident.severity}</span>
          <span>{incident.status}</span><span>{incident.source}</span>
          <time>{new Date(incident.detectedAt).toLocaleString()}</time>
        </div>)}
      </div> : <div className="empty">{incidents ? "No incidents yet. Connect monitoring and run checks to populate this view." : "Configure an authenticated SentinelOS API session to load incidents."}</div>}
    </section>
  </main>;
}
