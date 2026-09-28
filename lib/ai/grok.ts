import Groq from "groq-sdk";

import type {
  AIProvider,
  GenerateStructuredOutputParams,
} from "./provider";

type GroqClient = {
  chat: {
    completions: {
      create: (params: {
        model: string;
        messages: Array<{
          role: "system" | "user";
          content: string;
        }>;
        response_format: {
          type: "json_schema";
          json_schema: {
            name: string;
            strict: false;
            schema: unknown;
          };
        };
      }) => Promise<{
        choices: Array<{
          message: {
            content?: string | null;
          };
        }>;
      }>;
    };
  };
};

function createGroqClient(): GroqClient {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new Error(
      "GROQ_API_KEY is not configured.",
    );
  }

  return new Groq({
    apiKey,
  }) as unknown as GroqClient;
}

export function createGroqProvider(
  client?: GroqClient,
): AIProvider {
  return {
    async generateStructuredOutput<T>({
      systemInstruction,
      userContent,
      schema,
    }: GenerateStructuredOutputParams): Promise<T> {
      const groqClient =
        client ?? createGroqClient();

      const response =
        await groqClient.chat.completions.create({
          model:
            process.env.GROQ_MODEL ??
            "openai/gpt-oss-120b",

          messages: [
            {
              role: "system",
              content: systemInstruction,
            },
            {
              role: "user",
              content: userContent,
            },
          ],

          response_format: {
            type: "json_schema",
            json_schema: {
              name: "scope_copilot_output",
              strict: false,
              schema,
            },
          },
        });

      const content =
        response.choices[0]?.message?.content;

      if (!content) {
        throw new Error(
          "Groq returned an empty response.",
        );
      }

      try {
        return JSON.parse(content) as T;
      } catch {
        throw new Error(
          "Groq returned invalid JSON.",
        );
      }
    },
  };
}

export const groqProvider =
  createGroqProvider();