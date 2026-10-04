export function readBearerToken(authorization: string | undefined): string {
  if (!authorization) {
    throw Object.assign(new Error("Authentication required"), {
      statusCode: 401,
      code: "AUTHENTICATION_REQUIRED"
    });
  }
  const match = /^Bearer\s+([^\s]+)$/i.exec(authorization);
  if (!match) {
    throw Object.assign(new Error("Invalid authorization header"), {
      statusCode: 401,
      code: "INVALID_AUTHORIZATION"
    });
  }
  return match[1];
}
