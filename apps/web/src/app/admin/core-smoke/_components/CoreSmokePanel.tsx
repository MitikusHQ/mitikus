"use client";

import { useCallback, useEffect, useState } from "react";
import type { BrainAnswer, Project } from "@/lib/core-client/types";

// ─── helpers ────────────────────────────────────────────────────────────────

async function apiFetch<T>(path: string, init?: RequestInit): Promise<{ data?: T; error?: string }> {
  try {
    const res = await fetch(path, init);
    const json = await res.json();
    if (!res.ok) return { error: (json as { error?: string }).error ?? `HTTP ${res.status}` };
    return { data: json as T };
  } catch (e) {
    return { error: String(e) };
  }
}

// ─── sub-components ─────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border border-border rounded-lg p-5 space-y-4">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{title}</h2>
      {children}
    </section>
  );
}

function Badge({ color, children }: { color: "green" | "red" | "amber" | "blue"; children: React.ReactNode }) {
  const cls: Record<string, string> = {
    green: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400",
    red: "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400",
    amber: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400",
    blue: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium border rounded-full ${cls[color]}`}>
      {children}
    </span>
  );
}

function Field({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-xs text-muted-foreground w-32 shrink-0">{label}</span>
      <span className="text-sm font-mono break-all">{value ?? "—"}</span>
    </div>
  );
}

function InputRow({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="border border-border rounded px-3 py-1.5 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring"
      />
    </label>
  );
}

function Btn({ onClick, disabled, children }: { onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="px-4 py-1.5 text-sm font-medium bg-foreground text-background rounded disabled:opacity-40 hover:opacity-80 transition-opacity"
    >
      {children}
    </button>
  );
}

// ─── main component ──────────────────────────────────────────────────────────

type CoreHealth = { ok: boolean; service: string; version: string; mode: string };

export function CoreSmokePanel() {
  // — Health ——————————————————————————————————————————
  const [health, setHealth] = useState<CoreHealth | null>(null);
  const [healthErr, setHealthErr] = useState<string | null>(null);
  const [healthLoading, setHealthLoading] = useState(true);

  const checkHealth = useCallback(async () => {
    setHealthLoading(true);
    setHealthErr(null);
    const { data, error } = await apiFetch<CoreHealth>("/api/core/health");
    if (error) setHealthErr(error);
    else setHealth(data ?? null);
    setHealthLoading(false);
  }, []);

  useEffect(() => { checkHealth(); }, [checkHealth]);

  // — Projects ————————————————————————————————————————
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsErr, setProjectsErr] = useState<string | null>(null);

  const loadProjects = useCallback(async () => {
    const { data, error } = await apiFetch<{ projects: Project[] }>("/api/core/projects");
    if (error) setProjectsErr(error);
    else setProjects(data?.projects ?? []);
  }, []);

  useEffect(() => { if (health?.ok) loadProjects(); }, [health?.ok, loadProjects]);

  // — Create project —————————————————————————————————
  const [newName, setNewName] = useState("");
  const [newObjective, setNewObjective] = useState("");
  const [createErr, setCreateErr] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    setCreateErr(null);
    const { error } = await apiFetch<{ project: Project }>("/api/core/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim(), objective: newObjective.trim() }),
    });
    if (error) setCreateErr(error);
    else {
      setNewName("");
      setNewObjective("");
      await loadProjects();
    }
    setCreating(false);
  };

  // — Create note ————————————————————————————————————
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [noteErr, setNoteErr] = useState<string | null>(null);
  const [savingNote, setSavingNote] = useState(false);
  const [noteOk, setNoteOk] = useState(false);

  const handleNote = async () => {
    if (!selectedProjectId || !noteTitle.trim() || !noteContent.trim()) return;
    setSavingNote(true);
    setNoteErr(null);
    setNoteOk(false);
    const { error } = await apiFetch(`/api/core/projects/${selectedProjectId}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: noteTitle.trim(), content: noteContent.trim() }),
    });
    if (error) setNoteErr(error);
    else { setNoteOk(true); setNoteTitle(""); setNoteContent(""); }
    setSavingNote(false);
  };

  // — Brain ——————————————————————————————————————————
  const [brainProject, setBrainProject] = useState<number | null>(null);
  const [brainQuery, setBrainQuery] = useState("");
  const [brainAnswer, setBrainAnswer] = useState<BrainAnswer | null>(null);
  const [brainErr, setBrainErr] = useState<string | null>(null);
  const [brainLoading, setBrainLoading] = useState(false);

  const handleBrain = async () => {
    if (!brainProject || !brainQuery.trim()) return;
    setBrainLoading(true);
    setBrainErr(null);
    setBrainAnswer(null);
    const { data, error } = await apiFetch<BrainAnswer>(
      `/api/core/projects/${brainProject}/brain/answer?query=${encodeURIComponent(brainQuery)}`
    );
    if (error) setBrainErr(error);
    else setBrainAnswer(data ?? null);
    setBrainLoading(false);
  };

  const modeBadge = (mode: string) => {
    if (mode === "evidence") return <Badge color="green">evidence ✓</Badge>;
    if (mode === "insufficient") return <Badge color="amber">insufficient</Badge>;
    return <Badge color="blue">orientation</Badge>;
  };

  // ─── render ───────────────────────────────────────────────────────────────

  const coreDown = !healthLoading && (!health?.ok || !!healthErr);

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground font-mono">INTG3 — Core Client First UI Smoke</p>
          <p className="text-xs text-muted-foreground mt-0.5">Página interna de integración. No es producto final.</p>
        </div>
        <Btn onClick={checkHealth} disabled={healthLoading}>
          {healthLoading ? "Comprobando…" : "Refrescar"}
        </Btn>
      </div>

      {/* 1 — CORE STATUS */}
      <Section title="1 · Estado del Core">
        {healthLoading && <p className="text-sm text-muted-foreground">Conectando con el Core…</p>}
        {healthErr && (
          <div className="space-y-2">
            <Badge color="red">Core no disponible</Badge>
            <p className="text-xs text-muted-foreground font-mono">{healthErr}</p>
            <p className="text-xs text-muted-foreground">
              Arranca el Core:{" "}
              <code className="font-mono">node dist/ui/server.js</code> en{" "}
              <code className="font-mono">mitikus-ai/</code>
            </p>
          </div>
        )}
        {health?.ok && (
          <div className="space-y-2">
            <Badge color="green">Conectado</Badge>
            <div className="space-y-1 pt-1">
              <Field label="service" value={health.service} />
              <Field label="version" value={health.version} />
              <Field label="mode" value={health.mode} />
            </div>
          </div>
        )}
      </Section>

      {coreDown && (
        <p className="text-sm text-muted-foreground text-center py-4">
          Core no disponible — las secciones siguientes requieren el Core en marcha.
        </p>
      )}

      {!coreDown && health?.ok && (
        <>
          {/* 2 — PROJECTS */}
          <Section title="2 · Proyectos del Core">
            {projectsErr && <p className="text-xs text-red-500 font-mono">{projectsErr}</p>}
            {projects.length === 0 && !projectsErr && (
              <p className="text-sm text-muted-foreground">Sin proyectos aún.</p>
            )}
            <div className="space-y-1">
              {projects.map((p) => (
                <div key={p.id} className="flex items-baseline gap-2 text-sm py-0.5">
                  <span className="font-mono text-xs text-muted-foreground w-6">#{p.id}</span>
                  <span className="font-medium">{p.name}</span>
                  {p.objective && <span className="text-muted-foreground truncate max-w-xs">{p.objective}</span>}
                </div>
              ))}
            </div>
            <Btn onClick={loadProjects}>Recargar proyectos</Btn>
          </Section>

          {/* 3 — CREATE PROJECT */}
          <Section title="3 · Crear proyecto">
            <div className="space-y-3">
              <InputRow label="Nombre *" value={newName} onChange={setNewName} placeholder="Ej: Estudio de mercado Q3" />
              <InputRow label="Objetivo (opcional)" value={newObjective} onChange={setNewObjective} placeholder="Ej: Validar segmento antes de octubre" />
              {createErr && <p className="text-xs text-red-500 font-mono">{createErr}</p>}
              <Btn onClick={handleCreate} disabled={creating || !newName.trim()}>
                {creating ? "Creando…" : "Crear proyecto"}
              </Btn>
            </div>
          </Section>

          {/* 4 — CREATE NOTE */}
          <Section title="4 · Añadir memoria base">
            <div className="space-y-3">
              <label className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Proyecto *</span>
                <select
                  value={selectedProjectId ?? ""}
                  onChange={(e) => setSelectedProjectId(Number(e.target.value) || null)}
                  className="border border-border rounded px-3 py-1.5 text-sm bg-background focus:outline-none"
                >
                  <option value="">— selecciona proyecto —</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>#{p.id} {p.name}</option>
                  ))}
                </select>
              </label>
              <InputRow label="Título *" value={noteTitle} onChange={setNoteTitle} placeholder="Ej: Memoria base" />
              <label className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Contenido *</span>
                <textarea
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  rows={4}
                  placeholder="Describe el proyecto: qué es, a quién va dirigido, qué problema resuelve, hipótesis actuales…"
                  className="border border-border rounded px-3 py-1.5 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                />
              </label>
              {noteErr && <p className="text-xs text-red-500 font-mono">{noteErr}</p>}
              {noteOk && <p className="text-xs text-emerald-600">Memoria guardada en el Core ✓</p>}
              <Btn onClick={handleNote} disabled={savingNote || !selectedProjectId || !noteTitle.trim() || !noteContent.trim()}>
                {savingNote ? "Guardando…" : "Guardar memoria"}
              </Btn>
            </div>
          </Section>

          {/* 5+6 — BRAIN */}
          <Section title="5–6 · Consultar Brain">
            <div className="space-y-3">
              <label className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Proyecto *</span>
                <select
                  value={brainProject ?? ""}
                  onChange={(e) => setBrainProject(Number(e.target.value) || null)}
                  className="border border-border rounded px-3 py-1.5 text-sm bg-background focus:outline-none"
                >
                  <option value="">— selecciona proyecto —</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>#{p.id} {p.name}</option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Consulta *</span>
                <textarea
                  value={brainQuery}
                  onChange={(e) => setBrainQuery(e.target.value)}
                  rows={2}
                  placeholder="Ej: hoy necesito hacer un estudio de mercado para vender MITIKUS, cómo lo enfoco?"
                  className="border border-border rounded px-3 py-1.5 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                />
              </label>
              <Btn onClick={handleBrain} disabled={brainLoading || !brainProject || !brainQuery.trim()}>
                {brainLoading ? "Consultando…" : "Consultar Brain"}
              </Btn>
            </div>

            {brainErr && <p className="text-xs text-red-500 font-mono mt-3">{brainErr}</p>}

            {brainAnswer && (
              <div className="mt-4 space-y-4 border-t border-border pt-4">
                {/* metadata */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {modeBadge(brainAnswer.mode)}
                    <span className="text-xs text-muted-foreground">evidenceCount: {brainAnswer.evidenceCount}</span>
                  </div>
                  <Field label="normalizedQuery" value={brainAnswer.normalizedQuery} />
                </div>

                {/* answer */}
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">Respuesta</span>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{brainAnswer.answer}</p>
                </div>

                {/* warnings — no se reescriben ni ocultan */}
                {brainAnswer.warnings && brainAnswer.warnings.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground uppercase tracking-wide">Advertencias</span>
                    <ul className="space-y-0.5">
                      {brainAnswer.warnings.map((w, i) => (
                        <li key={i} className="text-xs text-amber-600 dark:text-amber-400 font-mono">{w}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* sources — siempre visibles si existen */}
                <div className="space-y-2">
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">
                    Fuentes ({brainAnswer.sources.length})
                  </span>
                  {brainAnswer.sources.length === 0 && (
                    <p className="text-xs text-muted-foreground">Sin fuentes — sin evidencia local.</p>
                  )}
                  {brainAnswer.sources.map((s, i) => (
                    <div key={i} className="border border-border rounded p-3 space-y-1 text-xs">
                      <div className="flex items-center gap-2">
                        <Badge color="blue">{s.type}</Badge>
                        <span className="font-medium">{s.title}</span>
                        <span className="text-muted-foreground ml-auto font-mono">{s.origin}</span>
                      </div>
                      <p className="text-muted-foreground italic leading-relaxed">{s.excerpt}</p>
                      <p className="text-muted-foreground">campo: <span className="font-mono">{s.field}</span></p>
                    </div>
                  ))}
                </div>

                <p className="text-xs text-muted-foreground font-mono">generatedAt: {brainAnswer.generatedAt}</p>
              </div>
            )}
          </Section>
        </>
      )}
    </div>
  );
}
