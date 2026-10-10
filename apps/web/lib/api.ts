import { cookies } from "next/headers";

export type DashboardSummary = {
  openIncidents: number;
  activeInvestigations: number;
  pendingApprovals: number;
  integrations: { total: number; unhealthy: number };
};

export async function fetchDashboardSummary(): Promise<DashboardSummary | null> {
  const baseUrl = process.env.SENTINELOS_API_URL;
  const cookieStore = await cookies();
  const organizationId = cookieStore.get("sentinelos_organization")?.value;
  const token = cookieStore.get("sentinelos_session")?.value;
  if (!baseUrl || !organizationId || !token) return null;

  const response = await fetch(`${baseUrl}/v1/dashboard/summary`, {
    headers: {
      authorization: `Bearer ${token}`,
      "x-organization-id": organizationId
    },
    cache: "no-store"
  });
  if (!response.ok) return null;
  const payload = await response.json() as { data: DashboardSummary };
  return payload.data;
}


export type ActivityItem = {
  id: string;
  actor_user_id: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  request_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export async function fetchActivity(): Promise<ActivityItem[] | null> {
  const baseUrl = process.env.SENTINELOS_API_URL;
  const cookieStore = await cookies();
  const organizationId = cookieStore.get("sentinelos_organization")?.value;
  const token = cookieStore.get("sentinelos_session")?.value;
  if (!baseUrl || !organizationId || !token) return null;
  const response = await fetch(`${baseUrl}/v1/activity`, {
    headers: { authorization: `Bearer ${token}`, "x-organization-id": organizationId },
    cache: "no-store"
  });
  if (!response.ok) return null;
  const payload = await response.json() as { data: ActivityItem[] };
  return payload.data;
}


export type Incident = {
  id: string;
  title: string;
  summary: string;
  severity: "info" | "warning" | "critical";
  status: "open" | "investigating" | "mitigated" | "resolved";
  source: string;
  detectedAt: string;
  createdAt: string;
  updatedAt: string;
};

async function apiConfig() {
  const baseUrl = process.env.SENTINELOS_API_URL;
  const cookieStore = await cookies();
  const organizationId = cookieStore.get("sentinelos_organization")?.value;
  const token = cookieStore.get("sentinelos_session")?.value;
  return baseUrl && organizationId && token ? { baseUrl, organizationId, token } : null;
}

export async function fetchIncidents(): Promise<Incident[] | null> {
  const config = await apiConfig();
  if (!config) return null;
  const response = await fetch(`${config.baseUrl}/v1/incidents`, {
    headers: {
      authorization: `Bearer ${config.token}`,
      "x-organization-id": config.organizationId
    },
    cache: "no-store"
  });
  if (!response.ok) return null;
  const payload = await response.json() as { data: Incident[] };
  return payload.data;
}


async function fetchProtected<T>(path: string): Promise<T | null> {
  const config = await apiConfig();
  if (!config) return null;
  const response = await fetch(`${config.baseUrl}${path}`, {
    headers: { authorization: `Bearer ${config.token}`, "x-organization-id": config.organizationId },
    cache: "no-store"
  });
  if (!response.ok) return null;
  const payload = await response.json() as { data: T };
  return payload.data;
}

export type InvestigationListItem = {
  id: string; incident_id: string; status: string; conclusion: string | null;
  started_at: string | null; completed_at: string | null; created_at: string;
  incident_title: string; incident_severity: string;
};

export type ActionListItem = {
  id: string; incident_id: string; action_type: string; rationale: string; status: string;
  requested_by: string | null; approved_by: string | null; requested_at: string;
  approved_at: string | null; executed_at: string | null;
  verification_status: string | null; verification_detail: string | null; incident_title: string;
};

export const fetchInvestigations = () => fetchProtected<InvestigationListItem[]>("/v1/investigations");
export const fetchActions = () => fetchProtected<ActionListItem[]>("/v1/actions");
