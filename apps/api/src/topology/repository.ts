import type { Database } from "../db/database.js";
import type { z } from "zod";
import type { createServiceInput, createDependencyInput } from "./model.js";

export async function listServices(database: Database, organizationId: string) {
  const result = await database.query(
    `SELECT id, name, description, owner_team, repository_url, created_at, updated_at
     FROM services WHERE organization_id=$1 ORDER BY name ASC`, [organizationId]);
  return result.rows;
}

export async function createService(database: Database, organizationId: string, input: z.infer<typeof createServiceInput>) {
  const result = await database.query(
    `INSERT INTO services (organization_id,name,description,owner_team,repository_url)
     VALUES ($1,$2,$3,$4,$5)
     RETURNING id,name,description,owner_team,repository_url,created_at,updated_at`,
    [organizationId,input.name,input.description,input.ownerTeam ?? null,input.repositoryUrl ?? null]);
  return result.rows[0];
}

export async function listDependencies(database: Database, organizationId: string) {
  const result = await database.query(
    `SELECT d.upstream_service_id,d.downstream_service_id,d.dependency_type,
            u.name AS upstream_name, v.name AS downstream_name
     FROM service_dependencies d
     JOIN services u ON u.organization_id=d.organization_id AND u.id=d.upstream_service_id
     JOIN services v ON v.organization_id=d.organization_id AND v.id=d.downstream_service_id
     WHERE d.organization_id=$1 ORDER BY u.name,v.name`, [organizationId]);
  return result.rows;
}

export async function createDependency(database: Database, organizationId: string, input: z.infer<typeof createDependencyInput>) {
  const result = await database.query(
    `INSERT INTO service_dependencies (organization_id,upstream_service_id,downstream_service_id,dependency_type)
     VALUES ($1,$2,$3,$4)
     RETURNING upstream_service_id,downstream_service_id,dependency_type,created_at`,
    [organizationId,input.upstreamServiceId,input.downstreamServiceId,input.dependencyType]);
  return result.rows[0];
}
