import { describe, expect, it, vi } from "vitest";

const { generateStructuredOutput } = vi.hoisted(() => ({
  generateStructuredOutput: vi.fn(),
}));

vi.mock("@/lib/ai/gemini", () => ({
  geminiProvider: {
    generateStructuredOutput,
  },
}));

import { extractScope } from "@/lib/ai/scope/extract";

const validScope = {
  deliverables: [
    {
      title: "Responsive Website",
      description: "A responsive website for the client.",
      sourceReferences: [
        {
          quote: "The agency will build a responsive website.",
          section: "Deliverables",
        },
      ],
    },
  ],
  features: [
    {
      title: "Contact Form",
      description: "Allows visitors to submit inquiries.",
      sourceReferences: [
        {
          quote: "The website will include a contact form.",
          section: "Features",
        },
      ],
    },
  ],
  exclusions: [],
  clientResponsibilities: [],
  revisionLimits: [],
  timeline: {
    duration: "5 weeks",
    startCondition: "After kickoff",
    dependencies: [],
    sourceReferences: [
      {
        quote: "The project will be completed within 5 weeks after kickoff.",
        section: "Timeline",
      },
    ],
  },
  assumptions: [],
};

describe("extractScope", () => {
  it("rejects empty SOW text before calling the provider", async () => {
    await expect(extractScope("   ")).rejects.toThrow(
      "Scope text cannot be empty.",
    );

    expect(generateStructuredOutput).not.toHaveBeenCalled();
  });

  it("returns a validated normalized scope", async () => {
    generateStructuredOutput.mockResolvedValueOnce(validScope);

    const result = await extractScope(
      "The agency will build a responsive website.",
    );

    expect(result).toEqual(validScope);
    expect(generateStructuredOutput).toHaveBeenCalledOnce();
  });

  it("passes the SOW, system instruction, and Gemini schema to the provider", async () => {
    generateStructuredOutput.mockResolvedValueOnce(validScope);

    const sourceText =
      "The agency will build a responsive website.";

    await extractScope(sourceText);

    const call = generateStructuredOutput.mock.calls[0][0];

    expect(call.userContent).toContain(sourceText);
    expect(call.systemInstruction).toContain(
      "strict SOW Extraction Engine",
    );
    expect(call.systemInstruction).toContain(
      "EXACT SOURCE EVIDENCE",
    );
    expect(call.systemInstruction).toContain(
      "ZERO HALLUCINATION",
    );
    expect(call.schema).toBeDefined();
  });

  it("rejects invalid provider output", async () => {
    generateStructuredOutput.mockResolvedValueOnce({
      deliverables: "not-an-array",
    });

    await expect(
      extractScope("Some SOW text"),
    ).rejects.toThrow(
      "Gemini returned an invalid scope structure.",
    );
  });
});