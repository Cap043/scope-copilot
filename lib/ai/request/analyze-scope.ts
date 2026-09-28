import { geminiProvider } from "@/lib/ai/gemini";
import {
  compareRequestToScope,
  SCOPE_COMPARISON_VERSION,
} from "@/lib/ai/request/compare-scope";
import {
  resolveScopeCandidateIds,
  retrieveScopeCandidateIds,
  SCOPE_CANDIDATE_RETRIEVAL_VERSION,
} from "@/lib/ai/request/retrieve-scope-candidates";
import {
  completeRequestAnalysisRun,
  createRequestAnalysisRun,
  failRequestAnalysisRun,
  getRequestAnalysisRun,
  startRequestAnalysisRun,
} from "@/lib/request-analysis";
import {
  parseStoredScope,
  type NormalizedScope,
} from "@/lib/scope-schema";

export const REQUEST_SCOPE_ANALYSIS_VERSION =
  "request-scope-analysis-v1";

const PROVIDER = "gemini";

function getModel() {
  return (
    process.env.GEMINI_MODEL ??
    "gemini-flash-lite-latest"
  );
}

export type RequestScopeAnalysisSnapshot = {
  type: "SCOPE_COMPARISON";

  retrieval: {
    version: string;
    candidateIds: string[];
  };

  candidates: Array<{
    id: string;
    section:
      | "deliverables"
      | "features"
      | "exclusions"
      | "clientResponsibilities"
      | "revisionLimits"
      | "assumptions";
    title?: string;
    description?: string;
    type?: string;
    limit?: string;
    statement?: string;
    sourceReferences: Array<{
      quote: string;
      section?: string;
    }>;
    provenance:
      | NormalizedScope["deliverables"][number]["provenance"]
      | NormalizedScope["revisionLimits"][number]["provenance"]
      | NormalizedScope["assumptions"][number]["provenance"];
    status: "active" | "removed";
  }>;

  comparison: {
    version: string;
    overallRelationship:
      | "DIRECTLY_INCLUDED"
      | "PARTIALLY_INCLUDED"
      | "RELATED_NOT_INCLUDED"
      | "EXPLICITLY_EXCLUDED"
      | "CONFLICTING"
      | "AMBIGUOUS"
      | "UNRELATED"
      | "NO_SCOPE_EVIDENCE";

    comparisons: Array<{
      scopeItemId: string;
      relationship:
        | "DIRECTLY_INCLUDED"
        | "PARTIALLY_INCLUDED"
        | "RELATED_NOT_INCLUDED"
        | "EXPLICITLY_EXCLUDED"
        | "CONFLICTING"
        | "AMBIGUOUS"
        | "UNRELATED"
        | "NO_SCOPE_EVIDENCE";
      explanation: string;
    }>;

    confidence?:
      | "HIGH"
      | "MEDIUM"
      | "LOW";
  };

  scopeBaseline: {
    id: string;
    version: number;
  };
};

export async function analyzeRequestScope(
  clientRequestItemId: string,
) {
  const model = getModel();
  const analysisStartedAt =
    performance.now();

  const traceId =
    crypto.randomUUID();

  console.info(
    `[AI][ScopeAnalysis][START] ` +
      `traceId=${traceId} ` +
      `itemId=${clientRequestItemId} ` +
      `model=${model}`,
  );

  const run =
    await createRequestAnalysisRun({
      clientRequestItemId,
      provider: PROVIDER,
      model,
      promptVersion: [
        SCOPE_CANDIDATE_RETRIEVAL_VERSION,
        SCOPE_COMPARISON_VERSION,
      ].join("+"),
      analysisVersion:
        REQUEST_SCOPE_ANALYSIS_VERSION,
    });

  await startRequestAnalysisRun(run.id);

  try {
    const runningRun =
      await getRequestAnalysisRun(run.id);

    const item =
      runningRun.clientRequestItem;

    const baseline =
      runningRun.scopeBaseline;

    const parsedScope =
      parseStoredScope(
        baseline.structuredScope,
      );

    if (!parsedScope.success) {
      throw new Error(
        "Approved scope structure is invalid.",
      );
    }

    const retrievalStartedAt =
      performance.now();

    const retrieval =
      await retrieveScopeCandidateIds({
        clientRequestText: item.text,
        approvedScope: parsedScope.data,
        traceId,
      });

    const retrievalDurationMs =
      Math.round(
        performance.now() -
          retrievalStartedAt,
      );

    console.info(
      `[AI][ScopeAnalysis][RETRIEVAL] ` +
        `traceId=${traceId} ` +
        `runId=${run.id} ` +
        `itemId=${clientRequestItemId} ` +
        `durationMs=${retrievalDurationMs} ` +
        `candidateCount=${retrieval.scopeItemIds.length}`,
    );

    const resolutionStartedAt =
      performance.now();

    const candidates =
      resolveScopeCandidateIds(
        parsedScope.data,
        retrieval.scopeItemIds,
      );

    const resolutionDurationMs =
      Math.round(
        performance.now() -
          resolutionStartedAt,
      );

    console.info(
      `[AI][ScopeAnalysis][RESOLUTION] ` +
        `traceId=${traceId} ` +
        `runId=${run.id} ` +
        `itemId=${clientRequestItemId} ` +
        `durationMs=${resolutionDurationMs} ` +
        `candidateCount=${candidates.length}`,
    );

    const comparisonStartedAt =
      performance.now();

    const comparison =
      await compareRequestToScope({
        clientRequestText: item.text,
        candidates,
        traceId,
      });

    const comparisonDurationMs =
      Math.round(
        performance.now() -
          comparisonStartedAt,
      );

    console.info(
      `[AI][ScopeAnalysis][COMPARISON] ` +
        `traceId=${traceId} ` +
        `runId=${run.id} ` +
        `itemId=${clientRequestItemId} ` +
        `durationMs=${comparisonDurationMs} ` +
        `candidateCount=${candidates.length} ` +
        `relationship=${comparison.overallRelationship} ` +
        `confidence=${comparison.confidence ?? "NONE"}`,
    );

    const snapshot: RequestScopeAnalysisSnapshot =
      {
        type: "SCOPE_COMPARISON",

        retrieval: {
          version:
            SCOPE_CANDIDATE_RETRIEVAL_VERSION,
          candidateIds:
            retrieval.scopeItemIds,
        },

        candidates,

        comparison: {
          version:
            SCOPE_COMPARISON_VERSION,
          overallRelationship:
            comparison.overallRelationship,
          comparisons:
            comparison.comparisons,
          ...(comparison.confidence
            ? {
                confidence:
                  comparison.confidence,
              }
            : {}),
        },

        scopeBaseline: {
          id: baseline.id,
          version: baseline.version,
        },
      };

    const persistenceStartedAt =
      performance.now();

    const completedRun =
      await completeRequestAnalysisRun({
        runId: run.id,
        resultSnapshot: snapshot,
      });

    const persistenceDurationMs =
      Math.round(
        performance.now() -
          persistenceStartedAt,
      );

    const totalDurationMs =
      Math.round(
        performance.now() -
          analysisStartedAt,
      );

    console.info(
      `[AI][ScopeAnalysis][END] ` +
        `traceId=${traceId} ` +
        `runId=${run.id} ` +
        `itemId=${clientRequestItemId} ` +
        `totalMs=${totalDurationMs} ` +
        `retrievalMs=${retrievalDurationMs} ` +
        `resolutionMs=${resolutionDurationMs} ` +
        `comparisonMs=${comparisonDurationMs} ` +
        `persistenceMs=${persistenceDurationMs} ` +
        `status=SUCCESS`,
    );

    return {
      id: completedRun.id,
      status: completedRun.status,
      scopeBaselineId:
        completedRun.scopeBaselineId,
      scopeBaselineVersion:
        baseline.version,
      result: snapshot,
    };
  } catch (error) {
    const totalDurationMs =
      Math.round(
        performance.now() -
          analysisStartedAt,
      );

    const message =
      error instanceof Error
        ? error.message
        : "Scope analysis failed.";

    console.error(
      `[AI][ScopeAnalysis][ERROR] ` +
        `traceId=${traceId} ` +
        `runId=${run.id} ` +
        `itemId=${clientRequestItemId} ` +
        `totalMs=${totalDurationMs} ` +
        `status=ERROR ` +
        `error=${JSON.stringify(message)}`,
    );

    await failRequestAnalysisRun({
      runId: run.id,
      errorMessage: message,
    });

    throw new Error(message);
  }
}