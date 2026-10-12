import Link from "next/link";
import { SessionActions } from "./components/session-actions";
import { PreviewNotice } from "./components/preview-notice";
import { ProductStatus } from "./components/product-status";
import { SiteNavigation } from "./components/site-navigation";
import { isPreviewMode } from "../lib/preview-data";
import { fetchActivity, fetchDashboardSummary } from "../lib/api";

export default async function CommandCenter() {
  const [summary, activity] = await Promise.all([fetchDashboardSummary(), fetchActivity()]);
  const stats = [
    { label: "Open incidents", value: summary?.openIncidents, symbol: "◇", sub: "Awaiting resolution", href: "/incidents", accent: "red" },
    { label: "Investigations", value: summary?.activeInvestigations, symbol: "⌁", sub: "Queued or running", href: "/investigations", accent: "blue" },
    { label: "Pending approval", value: summary?.pendingApprovals, symbol: "▤", sub: "Needs human decision", href: "/actions", accent: "amber" },
    { label: "Integrations", value: summary?.integrations.total, symbol: "⎇", sub: summary ? `${summary.integrations.unhealthy} require attention` : "Connections unavailable", href: "/integrations", accent: "green" }
  ] as const;
  return <main className="shell">
    <aside className="sidebar newSidebar">
      <Link className="brandLockup" href="/"><span className="brandSymbol">S</span><span><strong>Sentinel<span>OS</span></strong><small>OPERATIONS INTELLIGENCE</small></span></Link>
      <div className="sidebarGroupLabel">WORKSPACE</div>
      <SiteNavigation />
      <div className="sidebarHelper">
        <div className="sidebarHelperLabel"><span className="pulseDot" /> {isPreviewMode ? "DEMO WORKSPACE" : "WORKSPACE STATUS"}</div>
        <p>{isPreviewMode ? "Explore the product with fictional monitoring data and real, limited static source checks." : "Connect your systems to start collecting operational signals."}</p>
        <Link href="/scan">Inspect source <span aria-hidden="true">↗</span></Link>
      </div>
      <div className="sidebarFoot">SENTINELOS <span>·</span> DEVELOPMENT PREVIEW</div>
    </aside>
    <div className="content dashboardContent">
      <div className="mobileNavigation"><SiteNavigation /></div>
      <div className="dashboardTopbar"><div className="breadcrumb"><span>Workspace</span><span>/</span><strong>Overview</strong></div><div className="topbarRight"><span className="topbarChip">{isPreviewMode ? "PREVIEW ENVIRONMENT" : "COMMAND CENTER"}</span>{!isPreviewMode && <SessionActions />}</div></div>
      <PreviewNotice />
      <section className="welcomeHero">
        <div className="heroText">
          <div className="eyebrow">THE COMMAND CENTER <span className="eyebrowLine" /></div>
          <h1>Know what&apos;s happening.<br /><span>Stay a step ahead.</span></h1>
          <p>One workspace for investigating incidents, understanding evidence and tracking safer remediation. Start by inspecting a project source.</p>
          <div className="heroButtons"><Link className="primaryAction" href="/scan">◎ &nbsp; Inspect a project <span aria-hidden="true">↗</span></Link><Link className="outlineAction" href="/integrations">Explore integrations <span aria-hidden="true">→</span></Link></div>
          <div className="heroTrust"><span className="pulseDot" /> Read-only source checks available <span className="heroDivider">·</span> No code execution</div>
        </div>
        <div className="heroVisual" aria-hidden="true">
          <div className="radarRing ringOne" /><div className="radarRing ringTwo" /><div className="radarRing ringThree" />
          <div className="radarCore">S</div>
          <span className="radarNode nodeOne">✓</span><span className="radarNode nodeTwo">◇</span><span className="radarNode nodeThree">⌁</span>
          <div className="heroVisualLabel">SIGNAL INTELLIGENCE <span className="pulseDot" /></div>
        </div>
      </section>
      <div className="sectionHeading"><div><div className="eyebrow">AT A GLANCE</div><h2>Workspace overview</h2></div><span className="mutedTiny">{isPreviewMode ? "Sample statistics · not live" : summary ? "Live organization data" : "No active session"}</span></div>
      <div className="metricGrid">
        {stats.map(card => <Link className={`metricCard metric-${card.accent}`} key={card.label} href={card.href}>
          <div className="metricTop"><span className="metricSymbol" aria-hidden="true">{card.symbol}</span><span className="metricLink" aria-hidden="true">↗</span></div>
          <span className="metricValue">{card.value ?? "—"}</span>
          <strong>{card.label}</strong><small>{card.sub}</small>
        </Link>)}
      </div>
      <div className="dashboardLower">
        <section className="dashboardPanel">
          <div className="panelHeading"><div><div className="eyebrow">GET STARTED</div><h3>Connect. Inspect. Understand.</h3></div><Link href="/scan">Open inspector ↗</Link></div>
          <div className="entryChoices">
            <Link href="/scan" className="entryChoice"><span className="choiceIcon">⌁</span><span><strong>Analyze GitHub repository</strong><small>Paste a public repository URL and inspect its file structure and selected code patterns.</small></span><span className="choiceArrow">↗</span></Link>
            <Link href="/scan" className="entryChoice"><span className="choiceIcon">↑</span><span><strong>Upload project ZIP</strong><small>Check a local source archive, up to 5 MB, without executing any code.</small></span><span className="choiceArrow">↗</span></Link>
            <Link href="/integrations" className="entryChoice"><span className="choiceIcon">⎇</span><span><strong>Connect monitoring tools</strong><small>Explore supported provider configurations for operational event ingestion.</small></span><span className="choiceArrow">↗</span></Link>
          </div>
        </section>
        <section className="dashboardPanel activityPanel">
          <div className="panelHeading"><div><div className="eyebrow">TIMELINE</div><h3>Recent activity</h3></div><span className="mutedTiny">{isPreviewMode ? "Sample data" : "Audit events"}</span></div>
          <div className="timelineItems">
            {activity?.length ? activity.slice(0, 5).map((item, index) => <div className="timelineItem" key={item.id}><div className={index === 0 ? "timelineDot primary" : "timelineDot"} /><div><strong>{item.action.replaceAll(".", " · ").replaceAll("_", " ")}</strong><small>{item.resource_type}{item.resource_id ? ` / ${item.resource_id}` : ""}</small></div><time>{new Date(item.created_at).toLocaleDateString("en", { month: "short", day: "numeric" })}</time></div>)
              : <div className="timelineEmpty">No audit data yet. Inspect a project or connect your operational systems to begin.</div>}
          </div>
        </section>
      </div>
      <ProductStatus />
      <footer className="dashboardFooter">SentinelOS · Detect. Investigate. Resolve. <span>{isPreviewMode ? "Illustrative product preview" : "Operational workspace"}</span></footer>
    </div>
  </main>;
}
