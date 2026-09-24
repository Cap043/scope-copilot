import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

const {
  generateStructuredOutput,
} = vi.hoisted(() => ({
  generateStructuredOutput:
    vi.fn(),
}));

vi.mock("@/lib/ai/gemini", () => ({
  geminiProvider: {
    generateStructuredOutput,
  },
}));

import {
  decomposeClientRequestText,
} from "@/lib/ai/request/decompose";

describe("client request atomic decomposition", () => {
  it("splits independent asks into atomic items", async () => {
    generateStructuredOutput.mockResolvedValueOnce({
      items: [
        "Add downloadable reports.",
        "Change the hero video.",
        "Add Stripe.",
      ],
    });

    const result =
      await decomposeClientRequestText(
        "Add downloadable reports, change the hero video, and add Stripe.",
      );

    expect(result.items).toEqual([
      "Add downloadable reports.",
      "Change the hero video.",
      "Add Stripe.",
    ]);
  });

  it("keeps a single request as one item", async () => {
    generateStructuredOutput.mockResolvedValueOnce({
      items: [
        "Add a contact form.",
      ],
    });

    const result =
      await decomposeClientRequestText(
        "Please add a contact form.",
      );

    expect(result.items).toEqual([
      "Add a contact form.",
    ]);
  });

  it("rejects empty client requests before calling the provider", async () => {
    await expect(
      decomposeClientRequestText("   "),
    ).rejects.toThrow(
      "Client request cannot be empty.",
    );

    expect(
      generateStructuredOutput,
    ).not.toHaveBeenCalled();
  });

  it("rejects duplicate AI items", async () => {
    generateStructuredOutput.mockResolvedValueOnce({
      items: [
        "Add Stripe.",
        "add stripe.",
      ],
    });

    await expect(
      decomposeClientRequestText(
        "Add Stripe.",
      ),
    ).rejects.toThrow(
      "duplicate items",
    );
  });

  it("rejects invalid provider output", async () => {
    generateStructuredOutput.mockResolvedValueOnce({
      items: [],
    });

    await expect(
      decomposeClientRequestText(
        "Add Stripe.",
      ),
    ).rejects.toThrow(
      "between 1 and 20 items",
    );
  });

  it("passes the request to Gemini as structured output", async () => {
    generateStructuredOutput.mockResolvedValueOnce({
      items: [
        "Add Stripe.",
      ],
    });

    await decomposeClientRequestText(
      "Please add Stripe.",
    );

    expect(
      generateStructuredOutput,
    ).toHaveBeenCalledTimes(1);

    const call =
      generateStructuredOutput.mock.calls[0][0];

    expect(call.userContent).toContain(
      "Please add Stripe.",
    );

    expect(
      call.systemInstruction,
    ).toContain(
      "Atomic Request Breakdown Engine",
    );

    expect(call.schema).toBeDefined();
  });
});