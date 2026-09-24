import { geminiProvider } from "@/lib/ai/gemini";

export type AtomicRequestBreakdown = {
  items: string[];
};

const atomicRequestGeminiSchema = {
  type: "object",
  properties: {
    items: {
      type: "array",
      items: {
        type: "string",
      },
    },
  },
  required: ["items"],
} as const;

const SYSTEM_INSTRUCTION = `
You are the Scope Copilot Atomic Request Breakdown Engine.

Your job is to split one client request into the smallest useful set of
independent client asks.

You are NOT a scope classifier, pricing engine, or decision engine.

Do not decide whether an ask is in scope.
Do not estimate effort.
Do not invent requirements.
Do not add implementation details that the client did not request.

Rules:

1. Preserve the meaning of the client's original wording.
2. Create one item for each independently analyzable client ask.
3. If the message contains only one ask, return exactly one item.
4. Split conjunctions when they represent separate pieces of work.
5. Keep closely dependent wording together when splitting would change meaning.
6. Each item must stand on its own without relying on another item's text.
7. Do not create context-only items such as "the website" or "the project".
8. Do not merge unrelated asks merely because they appear in the same sentence.
9. Return concise request wording, not commentary.
10. Return no empty items and no duplicate items.

Example:

Client request:
"Add downloadable reports, change the hero video, and add Stripe."

Items:
- "Add downloadable reports."
- "Change the hero video."
- "Add Stripe."
`;

function normalizeItems(value: unknown): string[] {
  if (!value || typeof value !== "object") {
    throw new Error(
      "Atomic request breakdown returned an invalid result.",
    );
  }

  const items = (value as { items?: unknown }).items;

  if (!Array.isArray(items)) {
    throw new Error(
      "Atomic request breakdown did not return an item list.",
    );
  }

  if (items.length < 1 || items.length > 20) {
    throw new Error(
      "Atomic request breakdown must contain between 1 and 20 items.",
    );
  }

  const normalized = items.map((item) => {
    if (typeof item !== "string") {
      throw new Error(
        "Atomic request breakdown contains a non-text item.",
      );
    }

    const text = item.trim();

    if (!text) {
      throw new Error(
        "Atomic request breakdown contains an empty item.",
      );
    }

    if (text.length > 1000) {
      throw new Error(
        "Atomic request breakdown contains an item that is too long.",
      );
    }

    return text;
  });

  const unique = new Set(
    normalized.map((item) => item.toLowerCase()),
  );

  if (unique.size !== normalized.length) {
    throw new Error(
      "Atomic request breakdown contains duplicate items.",
    );
  }

  return normalized;
}

export async function decomposeClientRequestText(
  originalText: string,
): Promise<AtomicRequestBreakdown> {
  if (!originalText.trim()) {
    throw new Error("Client request cannot be empty.");
  }

  const result =
    await geminiProvider.generateStructuredOutput<unknown>({
      systemInstruction: SYSTEM_INSTRUCTION,
      userContent: `Break down this client request into atomic asks:\n\n${originalText}`,
      schema: atomicRequestGeminiSchema,
    });

  return {
    items: normalizeItems(result),
  };
}