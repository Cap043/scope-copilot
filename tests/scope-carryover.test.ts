import { describe, expect, it } from "vitest";

import type {
  ExtractedScope,
  NormalizedScope,
} from "@/lib/scope-schema";

import { diffScopes } from "@/lib/scope-diff";

import {
  reconcileScopeIdentities,
} from "@/lib/scope-reconciliation";

import {
  applyManualCarryOverDecisions,
  getManualCarryOverRequests,
} from "@/lib/scope-carryover";

function emptyCandidateScope(): ExtractedScope {
  return {
    deliverables: [],
    features: [],
    exclusions: [],
    clientResponsibilities: [],
    revisionLimits: [],
    timeline: {
      dependencies: [],
      sourceReferences: [],
    },
    assumptions: [],
  } as ExtractedScope;
}

function baseScope(
  overrides: Partial<NormalizedScope> = {},
): NormalizedScope {
  return {
    deliverables: [],
    features: [],
    exclusions: [],
    clientResponsibilities: [],
    revisionLimits: [],
    timeline: {
      dependencies: [],
      sourceReferences: [],
      provenance: {
        type: "document_extraction",
      },
    },
    assumptions: [],
    ...overrides,
  } as NormalizedScope;
}

function manualItem(
  id: string,
  title: string,
  rationale = "Approved during client call",
  referenceId = "CALL-001",
) {
  return {
    id,
    title,
    sourceReferences: [],
    provenance: {
      type: "manual_amendment" as const,
      rationale,
      referenceId,
    },
    status: "active" as const,
  };
}

function documentItem(
  id: string,
  title: string,
  quote: string,
) {
  return {
    id,
    title,
    sourceReferences: [{ quote }],
    provenance: {
      type: "document_extraction" as const,
    },
    status: "active" as const,
  };
}

function buildReconciliation(
  base: NormalizedScope,
  candidate: ExtractedScope,
) {
  const diff = diffScopes(base, candidate);

  return reconcileScopeIdentities(
    base,
    candidate,
    diff,
    () => "generated-id",
  );
}

describe("manual scope amendment carry-over", () => {
  it("exposes missing manual amendments as carry-over requests", () => {
    const base = baseScope({
      deliverables: [
        manualItem(
          "manual-booking",
          "Custom booking flow",
        ),
      ],
    });

    const reconciliation =
      buildReconciliation(
        base,
        emptyCandidateScope(),
      );

    const requests =
      getManualCarryOverRequests(
        reconciliation,
      );

    expect(requests).toHaveLength(1);
    expect(requests[0]).toMatchObject({
      itemId: "manual-booking",
      section: "deliverables",
      label: "Custom booking flow",
      rationale: "Approved during client call",
      referenceId: "CALL-001",
    });
  });

  it("does not expose document-derived missing items as manual carry-over requests", () => {
    const base = baseScope({
      deliverables: [
        documentItem(
          "homepage",
          "Homepage",
          "The agency will build the homepage.",
        ),
      ],
    });

    const reconciliation =
      buildReconciliation(
        base,
        emptyCandidateScope(),
      );

    expect(
      getManualCarryOverRequests(
        reconciliation,
      ),
    ).toEqual([]);
  });

  it("leaves manual amendments unresolved until an explicit decision exists", () => {
    const base = baseScope({
      deliverables: [
        manualItem(
          "manual-booking",
          "Custom booking flow",
        ),
      ],
    });

    const reconciliation =
      buildReconciliation(
        base,
        emptyCandidateScope(),
      );

    const result =
      applyManualCarryOverDecisions(
        reconciliation,
        {},
      );

    expect(result.carriedOver).toHaveLength(0);
    expect(result.unresolved).toHaveLength(1);
  });

  it("carries over a manual amendment with its original stable ID and provenance", () => {
    const base = baseScope({
      deliverables: [
        manualItem(
          "manual-booking",
          "Custom booking flow",
          "Added after discovery call",
          "CALL-009",
        ),
      ],
    });

    const reconciliation =
      buildReconciliation(
        base,
        emptyCandidateScope(),
      );

    const result =
      applyManualCarryOverDecisions(
        reconciliation,
        {
          "manual-booking": "CARRY_OVER",
        },
      );

    expect(result.unresolved).toHaveLength(0);
    expect(result.carriedOver).toHaveLength(1);

    expect(result.carriedOver[0]).toMatchObject({
      section: "deliverables",
      relation: "CARRIED_OVER",
      item: {
        id: "manual-booking",
        title: "Custom booking flow",
        status: "active",
        provenance: {
          type: "manual_amendment",
          rationale: "Added after discovery call",
          referenceId: "CALL-009",
        },
      },
    });
  });

  it("removes a manual amendment only when explicitly requested", () => {
    const base = baseScope({
      deliverables: [
        manualItem(
          "manual-booking",
          "Custom booking flow",
        ),
      ],
    });

    const reconciliation =
      buildReconciliation(
        base,
        emptyCandidateScope(),
      );

    const result =
      applyManualCarryOverDecisions(
        reconciliation,
        {
          "manual-booking": "REMOVE",
        },
      );

    expect(result.carriedOver).toHaveLength(0);
    expect(result.unresolved).toHaveLength(0);
  });

  it("can resolve one manual amendment while keeping another unresolved", () => {
    const base = baseScope({
      deliverables: [
        manualItem(
          "manual-one",
          "Custom booking flow",
        ),
        manualItem(
          "manual-two",
          "Advanced trainer dashboard",
        ),
      ],
    });

    const reconciliation =
      buildReconciliation(
        base,
        emptyCandidateScope(),
      );

    const result =
      applyManualCarryOverDecisions(
        reconciliation,
        {
          "manual-one": "CARRY_OVER",
        },
      );

    expect(result.carriedOver).toHaveLength(1);
    expect(result.carriedOver[0].item.id).toBe(
      "manual-one",
    );

    expect(result.unresolved).toHaveLength(1);
    expect(
      result.unresolved[0].entry.baseItem?.id,
    ).toBe("manual-two");
  });

  it("does not silently resolve conflicts for previously removed items", () => {
    const removedItem = {
      ...manualItem(
        "removed-booking",
        "Custom booking flow",
      ),
      status: "removed" as const,
      removal: {
        rationale: "Client removed this from scope",
        referenceId: "CALL-010",
      },
    };

    const base = baseScope({
      deliverables: [
        removedItem,
      ],
    });

    const candidate = {
      ...emptyCandidateScope(),
      deliverables: [
        {
          title: "Custom booking flow",
          sourceReferences: [
            {
              quote:
                "The agency will include the custom booking flow.",
            },
          ],
        },
      ],
    } as ExtractedScope;

    const reconciliation =
      buildReconciliation(
        base,
        candidate,
      );

    expect(
      reconciliation.unresolved,
    ).toHaveLength(1);

    const result =
      applyManualCarryOverDecisions(
        reconciliation,
        {},
      );

    expect(result.carriedOver).toHaveLength(0);
    expect(result.unresolved).toHaveLength(1);
    expect(
      result.unresolved[0].reason,
    ).toBe("REMOVED_ITEM_REAPPEARED");
  });

  it("rejects decisions for items that are not eligible manual carry-overs", () => {
    const base = baseScope({
      deliverables: [
        documentItem(
          "homepage",
          "Homepage",
          "The agency will build the homepage.",
        ),
      ],
    });

    const reconciliation =
      buildReconciliation(
        base,
        emptyCandidateScope(),
      );

    expect(() =>
      applyManualCarryOverDecisions(
        reconciliation,
        {
          homepage: "CARRY_OVER",
        },
      ),
    ).toThrow(
      'Invalid manual carry-over decision for scope item "homepage".',
    );
  });
});