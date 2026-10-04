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
