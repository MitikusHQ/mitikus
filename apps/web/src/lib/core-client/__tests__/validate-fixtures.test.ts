/**
 * Offline fixture validation — core-contract/v1
 *
 * Valida los 12 fixtures de CORE_CONTRACT2 contra los schemas Zod definidos
 * en core-client/types.ts. No requiere que el Core esté en marcha.
 *
 * Fixtures en:
 *   mitikus-ai/docs/product/fixtures/core-contract-v1/
 */
import { describe, it, expect } from "vitest";
import {
  BrainAnswerSchema,
  BrainSignalsSchema,
  CoreErrorSchema,
  HealthSchema,
  NoteSchema,
  ProjectSchema,
  ProjectsListSchema,
} from "../types";
import { z } from "zod";

// ─── Fixtures inline (copiados de CORE_CONTRACT2) ──────────────────────────

const F_HEALTH_OK = {
  ok: true,
  service: "mitikus-ai-core",
  mode: "local",
  version: "0.1.0",
};

const F_PROJECTS_LIST = {
  projects: [
    {
      id: 1,
      name: "MITIKUS",
      objective: "Producto principal de memoria privada de proyecto",
      status: "active",
      createdAt: "2026-08-01T10:00:00.000Z",
      updatedAt: "2026-08-21T09:00:00.000Z",
    },
    {
      id: 2,
      name: "Estudio de mercado Q3",
      objective: "",
      status: "active",
      createdAt: "2026-08-20T14:30:00.000Z",
      updatedAt: "2026-08-20T14:30:00.000Z",
    },
  ],
};

const F_PROJECT_CREATE_RESPONSE = {
  project: {
    id: 10,
    name: "Estudio de mercado Q3",
    objective: "Validar segmento y mensaje comercial antes de octubre",
    status: "active",
    layer: "domain",
    createdAt: "2026-08-21T17:45:00.000Z",
    updatedAt: "2026-08-21T17:45:00.000Z",
  },
};

const F_NOTE_CREATE_RESPONSE = {
  note: {
    id: 7,
    projectId: 1,
    title: "Memoria base — Estudio de mercado MITIKUS",
    content: "MITIKUS es una app de memoria privada de proyecto.",
    createdAt: "2026-08-21T17:46:00.000Z",
  },
};

const F_BRAIN_EVIDENCE = {
  projectId: 1,
  query: "estudio de mercado para vender MITIKUS",
  normalizedQuery: "estudio, mercado, vender, MITIKUS",
  evidenceCount: 2,
  mode: "evidence",
  answer: "La memoria local contiene evidencia relacionada con esta consulta.",
  sources: [
    {
      type: "ProjectNote",
      id: 7,
      title: "Memoria base — Estudio de mercado MITIKUS",
      field: "content",
      excerpt: "...validar cómo vender MITIKUS a usuarios tempranos...",
      origin: "local-memory",
    },
    {
      type: "Knowledge",
      id: 3,
      title: "Perfil de usuario objetivo",
      field: "content",
      excerpt: "...personas que trabajan con múltiples proyectos...",
      origin: "local-memory",
    },
  ],
  warnings: null,
  generatedAt: "2026-08-21T17:47:00.000Z",
};

const F_BRAIN_INSUFFICIENT = {
  projectId: 1,
  query: "cuánto cuesta adquirir un usuario en este mercado",
  normalizedQuery: "cuesta, adquirir, usuario, mercado",
  evidenceCount: 0,
  mode: "insufficient",
  answer: "No hay evidencia suficiente en la memoria local.",
  sources: [],
  warnings: ["Sin evidencia local sobre este tema.", "Usa note add para registrar lo que sabes."],
  generatedAt: "2026-08-21T17:48:00.000Z",
};

const F_BRAIN_ORIENTATION = {
  projectId: 1,
  query: "hoy necesito hacer un estudio de mercado para vender MITIKUS, como lo enfoco?",
  normalizedQuery: "estudio, mercado, vender, MITIKUS",
  evidenceCount: 0,
  mode: "orientation",
  answer: "No hay evidencia suficiente en la memoria local para responder con fundamento.",
  sources: [],
  warnings: ["Orientacion sin fundamento local.", "Los campos sugeridos son una plantilla, no datos reales."],
  generatedAt: "2026-08-21T17:49:00.000Z",
};

const F_BRAIN_SIGNALS = {
  projectId: 1,
  signals: [
    { signal: "T57", reason: "token directo presente en la memoria del proyecto" },
    { signal: "UI", reason: "término presente en datos del proyecto" },
  ],
};

const F_ERROR_400 = { error: "El campo name es requerido." };
const F_ERROR_404 = { error: "Proyecto 999 no encontrado." };

// ─── Tests ──────────────────────────────────────────────────────────────────

describe("core-contract/v1 — fixture validation (offline)", () => {
  it("health.ok — shape válida", () => {
    expect(() => HealthSchema.parse(F_HEALTH_OK)).not.toThrow();
    const parsed = HealthSchema.parse(F_HEALTH_OK);
    expect(parsed.ok).toBe(true);
    expect(parsed.service).toBe("mitikus-ai-core");
    expect(parsed.mode).toBe("local");
  });

  it("projects.list — shape válida", () => {
    expect(() => ProjectsListSchema.parse(F_PROJECTS_LIST)).not.toThrow();
    const { projects } = ProjectsListSchema.parse(F_PROJECTS_LIST);
    expect(projects).toHaveLength(2);
    projects.forEach((p) => expect(["active", "archived"]).toContain(p.status));
  });

  it("projects.create.response — project extraíble del wrapper", () => {
    const schema = z.object({ project: ProjectSchema });
    expect(() => schema.parse(F_PROJECT_CREATE_RESPONSE)).not.toThrow();
  });

  it("notes.create.response — note extraíble del wrapper", () => {
    const schema = z.object({ note: NoteSchema });
    expect(() => schema.parse(F_NOTE_CREATE_RESPONSE)).not.toThrow();
  });

  describe("BrainAnswer — reglas del contrato", () => {
    it("mode: evidence — sources no vacío, origin local-memory, warnings null ok", () => {
      const parsed = BrainAnswerSchema.parse(F_BRAIN_EVIDENCE);
      expect(parsed.mode).toBe("evidence");
      expect(parsed.sources.length).toBeGreaterThan(0);
      parsed.sources.forEach((s) => expect(s.origin).toBe("local-memory"));
      // warnings puede ser null — eso es válido en evidence
    });

    it("mode: insufficient — sources vacío, warnings array", () => {
      const parsed = BrainAnswerSchema.parse(F_BRAIN_INSUFFICIENT);
      expect(parsed.mode).toBe("insufficient");
      expect(parsed.sources).toEqual([]);
      expect(Array.isArray(parsed.warnings)).toBe(true);
      expect(parsed.evidenceCount).toBe(0);
    });

    it("mode: orientation — sources vacío, warnings array, evidenceCount 0", () => {
      const parsed = BrainAnswerSchema.parse(F_BRAIN_ORIENTATION);
      expect(parsed.mode).toBe("orientation");
      expect(parsed.sources).toEqual([]);
      expect(parsed.evidenceCount).toBe(0);
      expect(Array.isArray(parsed.warnings)).toBe(true);
    });

    it("mode está siempre presente y es uno de los tres valores", () => {
      [F_BRAIN_EVIDENCE, F_BRAIN_INSUFFICIENT, F_BRAIN_ORIENTATION].forEach((f) => {
        const parsed = BrainAnswerSchema.parse(f);
        expect(["evidence", "insufficient", "orientation"]).toContain(parsed.mode);
      });
    });

    it("sources es siempre array — nunca null ni ausente", () => {
      [F_BRAIN_EVIDENCE, F_BRAIN_INSUFFICIENT, F_BRAIN_ORIENTATION].forEach((f) => {
        const parsed = BrainAnswerSchema.parse(f);
        expect(Array.isArray(parsed.sources)).toBe(true);
      });
    });
  });

  it("brain.signals — shape válida", () => {
    expect(() => BrainSignalsSchema.parse(F_BRAIN_SIGNALS)).not.toThrow();
    const { signals } = BrainSignalsSchema.parse(F_BRAIN_SIGNALS);
    signals.forEach((s) => {
      expect(typeof s.signal).toBe("string");
      expect(typeof s.reason).toBe("string");
    });
  });

  it("error.400 — shape de error válida", () => {
    expect(() => CoreErrorSchema.parse(F_ERROR_400)).not.toThrow();
  });

  it("error.404 — shape de error válida", () => {
    expect(() => CoreErrorSchema.parse(F_ERROR_404)).not.toThrow();
  });
});
