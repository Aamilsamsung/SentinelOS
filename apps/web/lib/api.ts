export type DashboardSummary = {
  openIncidents: number;
  activeInvestigations: number;
  pendingApprovals: number;
  integrations: { total: number; unhealthy: number };
};

export async function fetchDashboardSummary(): Promise<DashboardSummary | null> {
  const baseUrl = process.env.SENTINELOS_API_URL;
  const organizationId = process.env.SENTINELOS_ORGANIZATION_ID;
  const token = process.env.SENTINELOS_SESSION_TOKEN;
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
  const organizationId = process.env.SENTINELOS_ORGANIZATION_ID;
  const token = process.env.SENTINELOS_SESSION_TOKEN;
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

function apiConfig() {
  const baseUrl = process.env.SENTINELOS_API_URL;
  const organizationId = process.env.SENTINELOS_ORGANIZATION_ID;
  const token = process.env.SENTINELOS_SESSION_TOKEN;
  return baseUrl && organizationId && token ? { baseUrl, organizationId, token } : null;
}

export async function fetchIncidents(): Promise<Incident[] | null> {
  const config = apiConfig();
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
