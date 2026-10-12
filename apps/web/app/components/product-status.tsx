import Link from "next/link";
import { isPreviewMode } from "../../lib/preview-data";

export function ProductStatus() {
  return <section className="productStatus" aria-label="Workspace readiness">
    <div className="productStatusTitle">
      <span className="statusLiveDot" aria-hidden="true" />
      <div><strong>{isPreviewMode ? "Explore the workspace" : "Set up your workspace"}</strong><small>{isPreviewMode ? "Guided product preview" : "Complete setup to receive live signals"}</small></div>
      <span className="statusMode">{isPreviewMode ? "DEMO" : "SETUP"}</span>
    </div>
    <div className="statusSteps">
      <Link href="/scan" className="statusStep"><span className="statusStepNumber">01</span><span><strong>Inspect a project</strong><small>Upload a ZIP or paste a public GitHub URL</small></span><span aria-hidden="true">↗</span></Link>
      <Link href="/integrations" className="statusStep"><span className="statusStepNumber">02</span><span><strong>Connect your stack</strong><small>Review monitoring integrations and setup</small></span><span aria-hidden="true">↗</span></Link>
      <Link href="/incidents" className="statusStep"><span className="statusStepNumber">03</span><span><strong>Review incidents</strong><small>{isPreviewMode ? "See a sample incident timeline" : "Explore detected operational issues"}</small></span><span aria-hidden="true">↗</span></Link>
    </div>
    <p className="productStatusFoot">Source inspection is a limited, read-only static analysis. It is not a comprehensive security audit.</p>
  </section>;
}
