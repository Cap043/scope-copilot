"use server";

import { createScopeBaseline } from "@/lib/scope";

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