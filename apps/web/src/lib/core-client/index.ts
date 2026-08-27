import {
  BrainAnswer,
  BrainAnswerSchema,
  BrainSignals,
  BrainSignalsSchema,
  Health,
  HealthSchema,
  Note,
  NoteSchema,
  Project,
  ProjectSchema,
  ProjectsListSchema,
} from "./types";
import { z } from "zod";

const CORE_BASE_URL = process.env.MITIKUS_CORE_URL ?? "http://127.0.0.1:47382";

async function coreGet<T>(path: string, schema: { parse: (v: unknown) => T }): Promise<T> {
  const res = await fetch(`${CORE_BASE_URL}${path}`, { cache: "no-store" });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(`Core ${res.status}: ${(body as { error?: string }).error ?? res.statusText}`);
  }
  return schema.parse(await res.json());
}

async function corePost<T>(path: string, body: unknown, schema: { parse: (v: unknown) => T }): Promise<T> {
  const res = await fetch(`${CORE_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) {
    const payload = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(`Core ${res.status}: ${(payload as { error?: string }).error ?? res.statusText}`);
  }
  return schema.parse(await res.json());
}

export const CoreClient = {
  health(): Promise<Health> {
    return coreGet("/api/health", HealthSchema);
  },

  listProjects(): Promise<Project[]> {
    return coreGet("/api/projects", ProjectsListSchema).then((r) => r.projects);
  },

  createProject(name: string, objective?: string): Promise<Project> {
    return corePost(
      "/api/projects",
      { name, objective },
      z.object({ project: ProjectSchema }).transform((r) => r.project)
    );
  },

  createNote(projectId: number, title: string, content: string): Promise<Note> {
    return corePost(
      `/api/projects/${projectId}/notes`,
      { title, content },
      z.object({ note: NoteSchema }).transform((r) => r.note)
    );
  },

  brainAnswer(projectId: number, query: string, options?: { context?: string; limit?: number }): Promise<BrainAnswer> {
    const params = new URLSearchParams({ query });
    if (options?.context) params.set("context", options.context);
    if (options?.limit != null) params.set("limit", String(options.limit));
    return coreGet(`/api/projects/${projectId}/brain/answer?${params}`, BrainAnswerSchema);
  },

  brainSignals(projectId: number): Promise<BrainSignals> {
    return coreGet(`/api/projects/${projectId}/brain/signals`, BrainSignalsSchema);
  },
};

export * from "./types";
