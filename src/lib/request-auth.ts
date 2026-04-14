export function isAuthorizedByBearerSecret(
  authHeader: string | null,
  secret: string | undefined,
) {
  if (!secret) {
    throw new Error("Server secret is required for protected routes.");
  }

  return authHeader === `Bearer ${secret}`;
}
