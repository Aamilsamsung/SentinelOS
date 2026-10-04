-- Prevent concurrent active investigations for the same incident.
-- Completed and failed investigations remain historical records.
CREATE UNIQUE INDEX IF NOT EXISTS investigations_one_active_per_incident_idx
  ON investigations (organization_id, incident_id)
  WHERE status IN ('queued', 'running');
