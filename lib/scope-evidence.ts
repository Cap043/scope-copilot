/**
 * Resolves an LLM-generated evidence candidate back to the exact
 * characters present in the original source text.
 *
 * The LLM may normalize whitespace, but the returned quote always
 * comes from the original source text.
 */

/**
 * Escapes regex-special characters so candidate text can safely
 * be used inside a regular expression.
 */
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Resolves an LLM-generated evidence candidate against the original SOW.
 *
 * Exact matches are returned immediately.
 *
 * If the model normalized whitespace, the function performs a
 * whitespace-insensitive lookup while preserving all other characters.
 *
 * Example:
 *
 * Candidate:
 *   "trainer information"
 *
 * Source:
 *   "trainer\ninformation, written content"
 *
 * Result:
 *   "trainer\ninformation"
 *
 * Ambiguous matches are rejected instead of guessed.
 */
export function resolveSourceQuote(
  candidateQuote: string,
  sourceText: string,
): string | null {
  // Prefer an exact match whenever possible.
  if (sourceText.includes(candidateQuote)) {
    return candidateQuote;
  }

  const trimmedCandidate = candidateQuote.trim();

  if (!trimmedCandidate) {
    return null;
  }

  /*
   * Allow one-or-more whitespace characters wherever the model
   * had whitespace in its evidence.
   *
   * Everything else remains exact, including punctuation.
   */
  const parts = trimmedCandidate.split(/\s+/).map(escapeRegExp);
  const pattern = parts.join("\\s+");
  const regex = new RegExp(pattern, "g");

  const matches: Array<{ start: number; end: number }> = [];

  let match: RegExpExecArray | null;

  while ((match = regex.exec(sourceText)) !== null) {
    matches.push({
      start: match.index,
      end: match.index + match[0].length,
    });

    // Prevent an empty-match regex from looping forever.
    if (match[0].length === 0) {
      regex.lastIndex++;
    }
  }

  // Never guess when the evidence could refer to multiple places.
  if (matches.length !== 1) {
    return null;
  }

  const matched = matches[0];

  // CRITICAL: return characters from the ORIGINAL source.
  return sourceText.slice(matched.start, matched.end);
}