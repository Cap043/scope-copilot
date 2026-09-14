import { describe, expect, it } from "vitest";

import { requireActiveOrganizationId } from "@/lib/organization";

describe("organization access", () => {
  it("returns the active organization ID", () => {
    expect(requireActiveOrganizationId("org-test-123")).toBe(
      "org-test-123",
    );
  });

  it("rejects a missing organization", () => {
    expect(() => requireActiveOrganizationId(undefined)).toThrow(
      "No active organization",
    );
  });

  it("rejects a null organization", () => {
    expect(() => requireActiveOrganizationId(null)).toThrow(
      "No active organization",
    );
  });
});