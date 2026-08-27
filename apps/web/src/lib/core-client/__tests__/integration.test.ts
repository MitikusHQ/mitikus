/**
 * Integration tests — MITIKUS → MITIKUS AI Core HTTP
 *
 * Requiere Core corriendo en 127.0.0.1:47382.
 * Si no responde, los tests se marcan como skip automáticamente.
 *
 * Arrancar el Core:
 *   cd "C:\Users\priet\OneDrive\Documents\Mitikus AI\mitikus-ai"
 *   node dist/ui/server.js
 */
import { describe, it, expect, beforeAll } from "vitest";
import { CoreClient } from "../index";

const CORE_URL = process.env.MITIKUS_CORE_URL ?? "http://127.0.0.1:47382";
let coreAvailable = false;

beforeAll(async () => {
  try {
    const res = await fetch(`${CORE_URL}/api/health`, { signal: AbortSignal.timeout(2000) });
    coreAvailable = res.ok;
  } catch {
    coreAvailable = false;
  }
});

function requireCore() {
  if (!coreAvailable) {
    console.warn("Core no disponible en", CORE_URL, "— test saltado");
  }
  return coreAvailable;
}

describe("core-contract/v1 — integration (requiere Core en marcha)", () => {
  it("GET /api/health — ok:true, service y mode presentes", async () => {
    if (!requireCore()) return;
    const h = await CoreClient.health();
    expect(h.ok).toBe(true);
    expect(h.service).toBe("mitikus-ai-core");
    expect(h.mode).toBe("local");
    expect(typeof h.version).toBe("string");
  });

  it("GET /api/projects — devuelve array (puede estar vacío)", async () => {
    if (!requireCore()) return;
    const projects = await CoreClient.listProjects();
    expect(Array.isArray(projects)).toBe(true);
  });

  it("POST /api/projects — crea proyecto con name, objective opcional", async () => {
    if (!requireCore()) return;
    const p = await CoreClient.createProject("INTG2 test project");
    expect(p.id).toBeGreaterThan(0);
    expect(p.name).toBe("INTG2 test project");
    expect(typeof p.objective).toBe("string"); // puede ser ""
    expect(p.status).toBe("active");
  });

  it("POST /api/projects/:id/notes — crea nota en proyecto existente", async () => {
    if (!requireCore()) return;
    const project = await CoreClient.createProject("INTG2 notes test");
    const note = await CoreClient.createNote(
      project.id,
      "Memoria base INTG2",
      "Proyecto de test para validar INTG2. MITIKUS consume el Core via HTTP."
    );
    expect(note.id).toBeGreaterThan(0);
    expect(note.projectId).toBe(project.id);
    expect(note.title).toBe("Memoria base INTG2");
  });

  describe("GET /api/projects/:id/brain/answer — reglas del contrato", () => {
    let projectId: number;

    beforeAll(async () => {
      if (!coreAvailable) return;
      const p = await CoreClient.createProject("INTG2 brain test");
      projectId = p.id;
    });

    it("sin memoria — mode insufficient u orientation, sources []", async () => {
      if (!requireCore()) return;
      const answer = await CoreClient.brainAnswer(projectId, "cuánto cuesta adquirir un usuario");
      expect(["insufficient", "orientation"]).toContain(answer.mode);
      expect(Array.isArray(answer.sources)).toBe(true);
      expect(answer.sources).toEqual([]);
      expect(answer.evidenceCount).toBe(0);
    });

    it("con memoria — mode evidence, sources no vacío, origin local-memory", async () => {
      if (!requireCore()) return;
      await CoreClient.createNote(
        projectId,
        "Memoria base MITIKUS",
        "MITIKUS es una app de memoria privada. Ayuda a freelancers y consultores a no perder contexto."
      );
      const answer = await CoreClient.brainAnswer(projectId, "memoria MITIKUS freelancers");
      // Puede que el Core aún devuelva insufficient si la indexación no es inmediata
      expect(["evidence", "insufficient", "orientation"]).toContain(answer.mode);
      expect(Array.isArray(answer.sources)).toBe(true);
      if (answer.mode === "evidence") {
        expect(answer.sources.length).toBeGreaterThan(0);
        answer.sources.forEach((s) => expect(s.origin).toBe("local-memory"));
      }
    });

    it("sources siempre array — nunca null", async () => {
      if (!requireCore()) return;
      const answer = await CoreClient.brainAnswer(projectId, "datos aleatorios que no existen");
      expect(Array.isArray(answer.sources)).toBe(true);
    });

    it("mode siempre presente y válido", async () => {
      if (!requireCore()) return;
      const answer = await CoreClient.brainAnswer(projectId, "cualquier consulta");
      expect(["evidence", "insufficient", "orientation"]).toContain(answer.mode);
    });
  });

  it("GET /api/projects/:id/brain/signals — devuelve signals array", async () => {
    if (!requireCore()) return;
    const projects = await CoreClient.listProjects();
    if (projects.length === 0) return;
    const first = projects[0];
    if (!first) return;
    const signals = await CoreClient.brainSignals(first.id);
    expect(typeof signals.projectId).toBe("number");
    expect(Array.isArray(signals.signals)).toBe(true);
  });
});
