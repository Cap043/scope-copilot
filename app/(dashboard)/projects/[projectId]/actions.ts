"use server";

import {
  approveScopeBaseline,
  createScopeBaseline,
  createScopeVersion,
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
  const baseline = await createScopeVersion(projectId);

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
  const baseline = await updateScopeBaseline(data);

  return {
    id: baseline.id,
    version: baseline.version,
  };
}

export async function approveScopeBaselineAction(
  baselineId: string,
) {
  const baseline = await approveScopeBaseline(baselineId);

  return {
    id: baseline.id,
    version: baseline.version,
    status: baseline.status,
    approvedAt: baseline.approvedAt,
  };
}