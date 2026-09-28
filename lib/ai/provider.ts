export type GenerateStructuredOutputParams = {
  systemInstruction: string;
  userContent: string;
  schema: unknown;

  /**
   * Human-readable operation name used only for server-side diagnostics.
   *
   * This is never sent to the AI provider.
   */
  operation?: string;

  /**
   * Correlates multiple AI calls belonging to one higher-level operation.
   *
   * This is never sent to the AI provider.
   */
  traceId?: string;
};

export type AIProvider = {
  generateStructuredOutput<T>(
    params: GenerateStructuredOutputParams,
  ): Promise<T>;
};