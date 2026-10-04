import Link from "next/link";
import { fetchIncidents } from "../../lib/api";

export default async function IncidentsPage() {
  const incidents = await fetchIncidents();
  return <main className="content standalone">
    <div className="topline"><div><div className="eyebrow">SENTINELOS / INCIDENTS</div><h2>Incidents</h2><p>Organization-scoped operational incidents ordered by detection time.</p></div><Link className="back" href="/">Command Center</Link></div>
    <section className="panel tablePanel">
      {incidents?.length ? <div className="incidentTable">
        <div className="incidentRow tableHead"><span>Incident</span><span>Severity</span><span>Status</span><span>Source</span><span>Detected</span></div>
        {incidents.map(incident => <div className="incidentRow" key={incident.id}>
          <span><strong>{incident.title}</strong><small>{incident.summary || incident.id}</small></span>
          <span className={`pill ${incident.severity}`}>{incident.severity}</span>
          <span>{incident.status}</span><span>{incident.source}</span>
          <time>{new Date(incident.detectedAt).toLocaleString()}</time>
        </div>)}
      </div> : <div className="empty">{incidents ? "No incidents have been recorded for this organization." : "Configure an authenticated SentinelOS API session to load incidents."}</div>}
    </section>
  </main>;
}
