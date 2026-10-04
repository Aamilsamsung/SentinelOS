import type { Database } from "../db/database.js";
import type { AuthContext } from "./context.js";
import { readBearerToken } from "./bearer.js";
import { resolveSession } from "./session-repository.js";

export async function authenticateRequest(
  database: Database,
  authorization: string | undefined,
  organizationId: string | undefined
): Promise<AuthContext> {
  if (!organizationId) {
    throw Object.assign(new Error("Organization context required"), {
      statusCode: 400,
      code: "ORGANIZATION_REQUIRED"
    });
  }

  const token = readBearerToken(authorization);
  const context = await resolveSession(database, token, organizationId);
  if (!context) {
    throw Object.assign(new Error("Invalid or expired session"), {
      statusCode: 401,
      code: "INVALID_SESSION"
    });
  }
  return context;
}
