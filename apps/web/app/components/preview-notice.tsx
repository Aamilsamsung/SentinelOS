import { isPreviewMode } from "../../lib/preview-data";

export function PreviewNotice() {
  if (!isPreviewMode) return null;
  return <aside className="previewNotice" role="note">
    <strong>Interactive design preview — sample data only</strong>
    <span>All incidents, investigations, activity and actions shown here are fictional. Authentication, AI execution and remediation are not connected to this public preview.</span>
  </aside>;
}
