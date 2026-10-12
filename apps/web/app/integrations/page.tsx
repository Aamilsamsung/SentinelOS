import Link from "next/link";
import { SiteNavigation } from "../components/site-navigation";
import { PreviewNotice } from "../components/preview-notice";
import { isPreviewMode } from "../../lib/preview-data";
import { IntegrationManager } from "./integration-manager";

export const metadata = {
  title: "Integrations | SentinelOS",
  description: "Configure sources for your SentinelOS operations workspace."
};

export default function IntegrationsPage() {
  return <main className="shell">
    <aside className="sidebar newSidebar">
      <Link className="brandLockup" href="/"><span className="brandSymbol">S</span><span><strong>Sentinel<span>OS</span></strong><small>OPERATIONS INTELLIGENCE</small></span></Link>
      <div className="sidebarGroupLabel">WORKSPACE</div>
      <SiteNavigation />
      <div className="sidebarHelper"><span className="pulseDot" /> SOURCES<p>Connect your monitoring ecosystem to bring operational events into one place.</p><Link href="/scan">Inspect a repository ↗</Link></div>
    </aside>
    <section className="content scanContent">
      <div className="mobileNavigation"><SiteNavigation /></div>
      <div className="scanTopbar"><div className="breadcrumb"><Link href="/">Workspace</Link><span>/</span><strong>Integrations</strong></div><span className="topbarChip">{isPreviewMode ? "PREVIEW ENVIRONMENT" : "ORGANIZATION WORKSPACE"}</span></div>
      <PreviewNotice />
      <div className="scanHero"><div className="eyebrow">CONNECT YOUR STACK <span className="eyebrowLine" /></div>
        <h1>All your signals.<br /><span>One command center.</span></h1>
        <p>Register the services you want SentinelOS to watch. Live ingestion requires a configured backend and provider-specific setup. Need a quick check instead? <Link href="/scan">Analyze a repository ↗</Link></p>
      </div>
      <IntegrationManager preview={isPreviewMode} />
    </section>
  </main>;
}
