import {
  groqProvider,
} from "./groq";

import {
  geminiProvider,
} from "./gemini";

import type {
  AIProvider,
} from "./provider";

export type AIProviderName =
  | "gemini"
  | "groq";

export function getAIProviderName(): AIProviderName {
  const configuredProvider =
    process.env.AI_PROVIDER?.trim().toLowerCase();

  if (
    configuredProvider === "groq"
  ) {
    return "groq";
  }

  return "gemini";
}

export function getAIProvider(): AIProvider {
  const provider =
    getAIProviderName();

  switch (provider) {
    case "groq":
      return groqProvider;

    case "gemini":
    default:
      return geminiProvider;
  }
}

export function getAIModel(): string {
  const provider =
    getAIProviderName();

  if (provider === "groq") {
    return (
      process.env.GROQ_MODEL ??
      "openai/gpt-oss-120b"
    );
  }

  return (
    process.env.GEMINI_MODEL ??
    "gemini-flash-lite-latest"
  );
}

export const aiProvider =
  getAIProvider();