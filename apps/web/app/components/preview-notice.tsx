import { isPreviewMode } from "../../lib/preview-data";

export function PreviewNotice() {
  if (!isPreviewMode) return null;
  return <aside className="previewNotice" role="note">
    <strong>Demo workspace · sample operational data</strong>
    <span>Dashboard incidents, investigations and actions are fictional examples. Source Inspector performs limited, real static checks on submitted GitHub repositories or ZIP files. Live monitoring, AI investigations and remediation are not connected to this public preview.</span>
  </aside>;
}
