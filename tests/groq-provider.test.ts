import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createGroqProvider,
} from "@/lib/ai/groq";

describe("createGroqProvider", () => {
  it("returns parsed structured output from Groq", async () => {
    const fakeClient = {
      chat: {
        completions: {
          create: async () => ({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    items: [
                      "Add Google login.",
                    ],
                  }),
                },
              },
            ],
          }),
        },
      },
    };

    const provider =
      createGroqProvider(fakeClient);

    const result =
      await provider.generateStructuredOutput({
        systemInstruction:
          "Split the request.",
        userContent:
          "Add Google login.",
        schema: {},
      });

    expect(result).toEqual({
      items: [
        "Add Google login.",
      ],
    });
  });

  it("throws when Groq returns no content", async () => {
    const fakeClient = {
      chat: {
        completions: {
          create: async () => ({
            choices: [
              {
                message: {
                  content: null,
                },
              },
            ],
          }),
        },
      },
    };

    const provider =
      createGroqProvider(fakeClient);

    await expect(
      provider.generateStructuredOutput({
        systemInstruction:
          "Split the request.",
        userContent:
          "Add Google login.",
        schema: {},
      }),
    ).rejects.toThrow(
      "Groq returned an empty response.",
    );
  });

  it("throws when Groq returns invalid JSON", async () => {
    const fakeClient = {
      chat: {
        completions: {
          create: async () => ({
            choices: [
              {
                message: {
                  content: "not valid json",
                },
              },
            ],
          }),
        },
      },
    };

    const provider =
      createGroqProvider(fakeClient);

    await expect(
      provider.generateStructuredOutput({
        systemInstruction:
          "Split the request.",
        userContent:
          "Add Google login.",
        schema: {},
      }),
    ).rejects.toThrow(
      "Groq returned invalid JSON.",
    );
  });
});