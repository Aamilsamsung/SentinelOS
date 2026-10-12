import Link from "next/link";
import { SiteNavigation } from "../components/site-navigation";
import { PreviewNotice } from "../components/preview-notice";
import { SourceWorkbench } from "./source-workbench";

export const metadata = {
  title: "Source Inspector | SentinelOS",
  description: "Inspect a public GitHub repository or project ZIP without executing its code."
};

export default function ScanPage() {
  return <main className="shell">
    <aside className="sidebar newSidebar">
      <Link className="brandLockup" href="/"><span className="brandSymbol">S</span><span><strong>Sentinel<span>OS</span></strong><small>OPERATIONS INTELLIGENCE</small></span></Link>
      <div className="sidebarGroupLabel">WORKSPACE</div>
      <SiteNavigation />
      <div className="sidebarHelper">
        <span className="pulseDot" /> SOURCE INSPECTION
        <p>Begin by connecting a repository or choosing a project archive.</p>
      </div>
    </aside>
    <section className="content scanContent">
      <div className="mobileNavigation"><SiteNavigation /></div>
      <div className="scanTopbar"><div className="breadcrumb"><Link href="/">Workspace</Link><span>/</span><strong>Source Inspector</strong></div><span className="topbarChip">PREVIEW ENVIRONMENT</span></div>
      <PreviewNotice />
      <div className="scanHero">
        <div className="eyebrow">START AN INSPECTION <span className="eyebrowLine" /></div>
        <h1>Bring your project.<br /><span>Get a clearer picture.</span></h1>
        <p>Connect a public GitHub repository or upload a ZIP to inspect the real files, surface code-health signals and understand what needs attention.</p>
      </div>
      <SourceWorkbench />
    </section>
  </main>;
}
