/** Illustrative, fictitious content for explicitly enabled public UI previews only. */
import type { ActivityItem, ActionListItem, DashboardSummary, Incident, InvestigationListItem } from "./api";

export const isPreviewMode = process.env.SENTINELOS_PREVIEW_MODE === "true";

export const previewSummary: DashboardSummary = {
  openIncidents: 3,
  activeInvestigations: 2,
  pendingApprovals: 1,
  integrations: { total: 5, unhealthy: 1 }
};

export const previewActivity: ActivityItem[] = [
  { id: "activity-01", actor_user_id: null, action: "investigation.started", resource_type: "investigation", resource_id: "inv-demo-001", request_id: null, metadata: {}, created_at: "2026-10-12T13:15:00Z" },
  { id: "activity-02", actor_user_id: null, action: "incident.detected", resource_type: "incident", resource_id: "inc-demo-002", request_id: null, metadata: {}, created_at: "2026-10-12T12:48:00Z" },
  { id: "activity-03", actor_user_id: null, action: "remediation.approval_requested", resource_type: "action", resource_id: "act-demo-001", request_id: null, metadata: {}, created_at: "2026-10-12T12:22:00Z" },
  { id: "activity-04", actor_user_id: null, action: "integration.health_checked", resource_type: "integration", resource_id: "github-demo", request_id: null, metadata: {}, created_at: "2026-10-12T11:50:00Z" }
];

export const previewIncidents: Incident[] = [
  { id: "inc-demo-001", title: "API error rate above threshold", summary: "Checkout API returning elevated 5xx responses after a deployment.", severity: "critical", status: "investigating", source: "APM monitor", detectedAt: "2026-10-12T13:12:00Z", createdAt: "2026-10-12T13:12:00Z", updatedAt: "2026-10-12T13:20:00Z" },
  { id: "inc-demo-002", title: "Background queue latency", summary: "Worker backlog increased; investigation is collecting job processing evidence.", severity: "warning", status: "open", source: "Queue metrics", detectedAt: "2026-10-12T12:45:00Z", createdAt: "2026-10-12T12:45:00Z", updatedAt: "2026-10-12T12:49:00Z" },
  { id: "inc-demo-003", title: "Database connection saturation", summary: "Connection pool utilization is approaching the configured limit.", severity: "warning", status: "open", source: "Database telemetry", detectedAt: "2026-10-12T10:31:00Z", createdAt: "2026-10-12T10:31:00Z", updatedAt: "2026-10-12T10:34:00Z" },
  { id: "inc-demo-004", title: "Intermittent webhook failures", summary: "Retries cleared the delivery backlog without manual intervention.", severity: "info", status: "resolved", source: "Webhook monitor", detectedAt: "2026-10-11T18:02:00Z", createdAt: "2026-10-11T18:02:00Z", updatedAt: "2026-10-11T18:55:00Z" }
];

export const previewInvestigations: InvestigationListItem[] = [
  { id: "inv-demo-001", incident_id: "inc-demo-001", status: "running", conclusion: null, started_at: "2026-10-12T13:15:00Z", completed_at: null, created_at: "2026-10-12T13:15:00Z", incident_title: "API error rate above threshold", incident_severity: "critical" },
  { id: "inv-demo-002", incident_id: "inc-demo-002", status: "queued", conclusion: null, started_at: null, completed_at: null, created_at: "2026-10-12T12:49:00Z", incident_title: "Background queue latency", incident_severity: "warning" },
  { id: "inv-demo-003", incident_id: "inc-demo-004", status: "completed", conclusion: "Transient upstream timeouts; retry delivery succeeded.", started_at: "2026-10-11T18:09:00Z", completed_at: "2026-10-11T18:53:00Z", created_at: "2026-10-11T18:09:00Z", incident_title: "Intermittent webhook failures", incident_severity: "info" }
];

export const previewActions: ActionListItem[] = [
  { id: "act-demo-001", incident_id: "inc-demo-001", action_type: "rollback_deployment", rationale: "Error rate increased after the latest checkout release. Requires human review.", status: "requested", requested_by: null, approved_by: null, requested_at: "2026-10-12T12:22:00Z", approved_at: null, executed_at: null, verification_status: null, verification_detail: null, incident_title: "API error rate above threshold" },
  { id: "act-demo-002", incident_id: "inc-demo-004", action_type: "retry_webhook_delivery", rationale: "Retry failed deliveries after upstream service recovery.", status: "verified", requested_by: null, approved_by: null, requested_at: "2026-10-11T18:16:00Z", approved_at: "2026-10-11T18:27:00Z", executed_at: "2026-10-11T18:32:00Z", verification_status: "passed", verification_detail: "Backlog cleared.", incident_title: "Intermittent webhook failures" }
];
