import { describe, expect, it } from "vitest";

import { createGeminiProvider } from "@/lib/ai/gemini";

describe("createGeminiProvider", () => {
  it("returns parsed structured output from Gemini", async () => {
    const fakeClient = {
      models: {
        generateContent: async () => ({
          text: JSON.stringify({
            deliverables: [],
            features: [],
            exclusions: [],
            revisionLimits: [],
            timeline: {
              dependencies: [],
              sourceReferences: [],
            },
            assumptions: [],
          }),
        }),
      },
    };

    const provider = createGeminiProvider(fakeClient);

    const result = await provider.generateStructuredOutput({
      systemInstruction: "Extract the scope.",
      userContent: "Example SOW",
      schema: {},
    });

    expect(result).toEqual({
      deliverables: [],
      features: [],
      exclusions: [],
      revisionLimits: [],
      timeline: {
        dependencies: [],
        sourceReferences: [],
      },
      assumptions: [],
    });
  });

  it("throws when Gemini returns no text", async () => {
    const fakeClient = {
      models: {
        generateContent: async () => ({
          text: undefined,
        }),
      },
    };

    const provider = createGeminiProvider(fakeClient);

    await expect(
      provider.generateStructuredOutput({
        systemInstruction: "Extract the scope.",
        userContent: "Example SOW",
        schema: {},
      }),
    ).rejects.toThrow("Gemini returned an empty response.");
  });

  it("throws when Gemini returns invalid JSON", async () => {
    const fakeClient = {
      models: {
        generateContent: async () => ({
          text: "not valid json",
        }),
      },
    };

    const provider = createGeminiProvider(fakeClient);

    await expect(
      provider.generateStructuredOutput({
        systemInstruction: "Extract the scope.",
        userContent: "Example SOW",
        schema: {},
      }),
    ).rejects.toThrow("Gemini returned invalid JSON.");
  });
});