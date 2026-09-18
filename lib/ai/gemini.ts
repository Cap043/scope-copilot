import { GoogleGenAI } from "@google/genai";

import type {
  AIProvider,
  GenerateStructuredOutputParams,
} from "./provider";

type GeminiClient = {
  models: {
    generateContent: (params: {
      model: string;
      contents: string;
      config: {
        systemInstruction: string;
        responseMimeType: "application/json";
        responseSchema: unknown;
      };
    }) => Promise<{
      text?: string;
    }>;
  };
};

function createGeminiClient(): GeminiClient {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  return new GoogleGenAI({
    apiKey,
  });
}

export function createGeminiProvider(
  client?: GeminiClient,
): AIProvider {
  return {
    async generateStructuredOutput<T>({
      systemInstruction,
      userContent,
      schema,
    }: GenerateStructuredOutputParams): Promise<T> {
      const geminiClient = client ?? createGeminiClient();

      const response = await geminiClient.models.generateContent({
        model: process.env.GEMINI_MODEL ?? "gemini-flash-lite-latest",
        // model: "gemini-flash-latest",
        contents: userContent,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: schema,
        },
      });

      if (!response.text) {
        throw new Error("Gemini returned an empty response.");
      }

      try {
        return JSON.parse(response.text) as T;
      } catch {
        throw new Error("Gemini returned invalid JSON.");
      }
    },
  };
}

export const geminiProvider = createGeminiProvider();