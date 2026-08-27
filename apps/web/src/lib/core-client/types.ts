import { z } from "zod";

// core-contract/v1 — shapes

export const HealthSchema = z.object({
  ok: z.boolean(),
  service: z.literal("mitikus-ai-core"),
  mode: z.literal("local"),
  version: z.string(),
});

export const ProjectSchema = z.object({
  id: z.number(),
  name: z.string(),
  objective: z.string(),
  status: z.enum(["active", "archived"]),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const ProjectsListSchema = z.object({
  projects: z.array(ProjectSchema),
});

export const NoteSchema = z.object({
  id: z.number(),
  projectId: z.number(),
  title: z.string(),
  content: z.string(),
  createdAt: z.string(),
});

export const EvidenceSourceSchema = z.object({
  type: z.enum(["ProjectNote", "Knowledge", "Decision", "Session", "Snapshot", "Question", "Blocker"]),
  id: z.number(),
  title: z.string(),
  field: z.string(),
  excerpt: z.string(),
  score: z.number().optional(),
  origin: z.literal("local-memory"),
});

export const BrainAnswerSchema = z.object({
  projectId: z.number(),
  query: z.string(),
  normalizedQuery: z.string(),
  evidenceCount: z.number().int().min(0),
  mode: z.enum(["evidence", "insufficient", "orientation"]),
  answer: z.string(),
  sources: z.array(EvidenceSourceSchema),
  warnings: z.array(z.string()).nullable().optional(),
  generatedAt: z.string(),
});

export const BrainSignalSchema = z.object({
  signal: z.string(),
  reason: z.string(),
});

export const BrainSignalsSchema = z.object({
  projectId: z.number(),
  signals: z.array(BrainSignalSchema),
});

export const CoreErrorSchema = z.object({
  error: z.string(),
});

export type Health = z.infer<typeof HealthSchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type ProjectsList = z.infer<typeof ProjectsListSchema>;
export type Note = z.infer<typeof NoteSchema>;
export type EvidenceSource = z.infer<typeof EvidenceSourceSchema>;
export type BrainAnswer = z.infer<typeof BrainAnswerSchema>;
export type BrainSignals = z.infer<typeof BrainSignalsSchema>;
