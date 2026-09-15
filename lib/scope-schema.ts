import { z } from "zod";

const sourceReferenceSchema = z.object({
  quote: z.string().min(1),
  section: z.string().optional(),
});

const scopeItemSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  sourceReferences: z.array(sourceReferenceSchema),
});

const revisionLimitSchema = z.object({
  type: z.string().min(1),
  limit: z.string().min(1),
  sourceReferences: z.array(sourceReferenceSchema),
});

const timelineSchema = z.object({
  duration: z.string().optional(),
  startCondition: z.string().optional(),
  dependencies: z.array(z.string()),
  sourceReferences: z.array(sourceReferenceSchema),
});

const assumptionSchema = z.object({
  statement: z.string().min(1),
  sourceReferences: z.array(sourceReferenceSchema),
});

const clientResponsibilitySchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  sourceReferences: z.array(sourceReferenceSchema),
});

export const normalizedScopeSchema = z.object({
  deliverables: z.array(scopeItemSchema),
  features: z.array(scopeItemSchema),
  exclusions: z.array(scopeItemSchema),
  clientResponsibilities: z.array(clientResponsibilitySchema),
  revisionLimits: z.array(revisionLimitSchema),
  timeline: timelineSchema,
  assumptions: z.array(assumptionSchema),
});

export type NormalizedScope = z.infer<typeof normalizedScopeSchema>;