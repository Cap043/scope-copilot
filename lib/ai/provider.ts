export type GenerateStructuredOutputParams = {
  systemInstruction: string;
  userContent: string;
  schema: unknown;
};

export type AIProvider = {
  generateStructuredOutput<T>(
    params: GenerateStructuredOutputParams,
  ): Promise<T>;
};