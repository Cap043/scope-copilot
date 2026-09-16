import { describe, expect, it } from "vitest";
import { resolveSourceQuote } from "@/lib/scope-evidence";

describe("resolveSourceQuote", () => {
  it("returns an exact quote unchanged", () => {
    const source = "The client will provide the logo.";

    expect(resolveSourceQuote("the logo", source)).toBe("the logo");
  });

  it("recovers a newline that the model normalized to a space", () => {
    const source = `The client will provide the logo, brand colors, photography, trainer
information, written content.`;

    expect(
      resolveSourceQuote("trainer information", source),
    ).toBe("trainer\ninformation");
  });

  it("preserves multiple whitespace characters from the source", () => {
    const source = "Contact form, Google Maps, and   Google Analytics.";

    expect(
      resolveSourceQuote("Google Maps, and Google Analytics.", source),
    ).toBe("Google Maps, and   Google Analytics.");
  });

it("rejects ambiguous whitespace-normalized matches", () => {
  const source = `
The project includes trainer
information.
The client will provide trainer
information.
`;

  expect(
    resolveSourceQuote("trainer information", source),
  ).toBeNull();
});

  it("returns null when the evidence does not exist", () => {
    const source = "The client will provide the logo.";

    expect(
      resolveSourceQuote("hosting access", source),
    ).toBeNull();
  });
});