import { describe, expect, it } from "vitest";

import {
  materializeReconciledScope,
} from "@/lib/scope-revision";

describe("materializeReconciledScope", () => {
  it("adds document provenance to candidate-derived items", () => {
    const result =
      materializeReconciledScope({
        deliverables: [
          {
            title: "Homepage",
            description:
              "Responsive homepage",
            sourceReferences: [
              {
                quote:
                  "The website includes a homepage.",
              },
            ],
            id: "item-1",
            baseItemId: "item-1",
            relation: "MATCHED",
          },
        ],
        features: [],
        exclusions: [],
        clientResponsibilities: [],
        revisionLimits: [],
        timeline: {
          dependencies: [],
          sourceReferences: [],
        },
        assumptions: [],
      });

    expect(
      result.deliverables[0],
    ).toMatchObject({
      id: "item-1",
      provenance: {
        type: "document_extraction",
      },
      status: "active",
    });

    expect(
      result.deliverables[0],
    ).not.toHaveProperty(
      "baseItemId",
    );

    expect(
      result.deliverables[0],
    ).not.toHaveProperty(
      "relation",
    );
  });

  it("preserves manual carry-over provenance", () => {
    const result =
      materializeReconciledScope({
        deliverables: [
          {
            title: "Client provides logo",
            sourceReferences: [],
            id: "manual-1",
            provenance: {
              type: "manual_amendment",
              rationale:
                "Added during kickoff",
              referenceId:
                "kickoff-2026-01",
            },
            status: "active",
            baseItemId: "manual-1",
            relation: "MATCHED",
          },
        ],
        features: [],
        exclusions: [],
        clientResponsibilities: [],
        revisionLimits: [],
        timeline: {
          dependencies: [],
          sourceReferences: [],
        },
        assumptions: [],
      });

    expect(
      result.deliverables[0],
    ).toMatchObject({
      id: "manual-1",
      provenance: {
        type: "manual_amendment",
        rationale:
          "Added during kickoff",
        referenceId:
          "kickoff-2026-01",
      },
      status: "active",
      sourceReferences: [],
    });
  });

  it("adds document provenance to populated timeline", () => {
    const result =
      materializeReconciledScope({
        deliverables: [],
        features: [],
        exclusions: [],
        clientResponsibilities: [],
        revisionLimits: [],
        timeline: {
          duration: "5 weeks",
          startCondition:
            "After kickoff",
          dependencies: [
            "Client approval",
          ],
          sourceReferences: [
            {
              quote:
                "Estimated duration: 5 weeks.",
            },
          ],
        },
        assumptions: [],
      });

    expect(
      result.timeline.provenance,
    ).toEqual({
      type: "document_extraction",
    });
  });

  it("keeps an empty timeline without provenance", () => {
    const result =
      materializeReconciledScope({
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
      });

    expect(
      result.timeline,
    ).toEqual({
      dependencies: [],
      sourceReferences: [],
    });
  });
});