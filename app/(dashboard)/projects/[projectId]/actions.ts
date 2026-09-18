"use server";

import {
  addManualScopeItem,
  amendScopeItem,
  amendScopeTimeline,
  approveScopeBaseline,
  createScopeBaseline,
  createScopeVersion,
  removeScopeItem,
  updateScopeBaseline,
} from "@/lib/scope";

export async function createScopeBaselineAction(data: {
  projectId: string;
  sourceText: string;
}) {
  const baseline = await createScopeBaseline(data);

  return {
    id: baseline.id,
    version: baseline.version,
  };
}

export async function createScopeVersionAction(
  projectId: string,
) {
  const baseline =
    await createScopeVersion(projectId);

  return {
    id: baseline.id,
    version: baseline.version,
    status: baseline.status,
  };
}

export async function updateScopeBaselineAction(data: {
  baselineId: string;
  structuredScope: unknown;
}) {
  const baseline =
    await updateScopeBaseline(data);

  return {
    id: baseline.id,
    version: baseline.version,
  };
}

export async function approveScopeBaselineAction(
  baselineId: string,
) {
  const baseline =
    await approveScopeBaseline(baselineId);

  return {
    id: baseline.id,
    version: baseline.version,
    status: baseline.status,
    approvedAt: baseline.approvedAt,
  };
}

/**
 * Add a brand-new item to a draft scope version.
 *
 * The domain layer assigns the ID and records manual-amendment provenance.
 */
export async function addManualScopeItemAction(
  data: Parameters<typeof addManualScopeItem>[0],
) {
  const result =
    await addManualScopeItem(data);

  return {
    id: result.itemId,
    baselineId: result.baseline.id,
    version: result.baseline.version,
  };
}

/**
 * Record a meaningful change to an existing scope item.
 *
 * The domain layer preserves original document evidence and records
 * amendment metadata when the item came from the SOW.
 */
export async function amendScopeItemAction(
  data: Parameters<typeof amendScopeItem>[0],
) {
  const result =
    await amendScopeItem(data);

  return {
    id: result.itemId,
    baselineId: result.baseline.id,
    version: result.baseline.version,
  };
}

/**
 * Tombstone a scope item instead of deleting its historical identity.
 */
export async function removeScopeItemAction(
  data: Parameters<typeof removeScopeItem>[0],
) {
  const result =
    await removeScopeItem(data);

  return {
    id: result.itemId,
    baselineId: result.baseline.id,
    version: result.baseline.version,
  };
}

/**
 * Update the singleton timeline while preserving its provenance rules.
 */
export async function amendScopeTimelineAction(
  data: Parameters<typeof amendScopeTimeline>[0],
) {
  const result =
    await amendScopeTimeline(data);

  return {
    baselineId: result.baseline.id,
    version: result.baseline.version,
  };
}