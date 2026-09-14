export function requireActiveOrganizationId(
  organizationId: string | null | undefined,
) {
  if (!organizationId) {
    throw new Error("No active organization");
  }

  return organizationId;
}