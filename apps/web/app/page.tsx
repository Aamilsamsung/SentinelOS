const sections = ["Command Center","Incidents","Investigations","Actions","Knowledge","Integrations"];

export default function CommandCenter() {
  return (
    <main className="shell">
      <aside className="sidebar">
        <div><div className="eyebrow">SENTINELOS</div><h1>Command Center</h1></div>
        <nav>{sections.map((section, index) => <div className={index === 0 ? "nav active" : "nav"} key={section}>{section}</div>)}</nav>
        <div className="status"><span />API connection required</div>
      </aside>
      <section className="content">
        <header><div><div className="eyebrow">OPERATIONS</div><h2>System overview</h2><p>Live operational data appears after authentication and API configuration.</p></div><button disabled>Run investigation</button></header>
        <div className="grid">
          <article><label>Open incidents</label><strong>—</strong><small>Waiting for API</small></article>
          <article><label>Investigations</label><strong>—</strong><small>No fabricated data</small></article>
          <article><label>Pending approvals</label><strong>—</strong><small>Approval gated</small></article>
          <article><label>Integrations</label><strong>—</strong><small>Health not loaded</small></article>
        </div>
        <section className="panel"><div><div className="eyebrow">ACTIVITY</div><h3>Operational timeline</h3></div><div className="empty">Connect to the SentinelOS API to load incidents, evidence, investigations, and remediation activity.</div></section>
      </section>
    </main>
  );
}
