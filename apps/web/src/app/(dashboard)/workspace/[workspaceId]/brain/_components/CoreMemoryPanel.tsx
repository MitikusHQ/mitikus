"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { BrainAnswer, Note, Project } from "@/lib/core-client/types";
import type { Locale } from "@/i18n/config";
import { getDashboardTranslations } from "@/i18n/dashboard-translations";

// ─── helpers ────────────────────────────────────────────────────────────────

const LOCAL_CORE_URL = "http://127.0.0.1:47382";
const CORE_PROJECT_PREFIX = "MITIKUS:";

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

async function localCoreFetch<T>(path: string, init?: RequestInit): Promise<{ data?: T; error?: string }> {
  return apiFetch<T>(`${LOCAL_CORE_URL}${path}`, init);
}

type LocalCoreLabels = {
  readProjectsError: string;
  projectObjective: string;
  createProjectError: string;
};

async function resolveLocalCoreProject(
  workspaceId: string,
  labels: LocalCoreLabels,
): Promise<{ projectId?: number; projects: Project[]; error?: string }> {
  const { data, error } = await localCoreFetch<{ projects: Project[] }>("/api/projects");
  if (error || !data) return { projects: [], error: error ?? labels.readProjectsError };

  const projectName = `${CORE_PROJECT_PREFIX}${workspaceId}`;
  const match = data.projects
    .filter((project) => project.name === projectName)
    .sort((a, b) => a.id - b.id)[0];

  if (match) return { projectId: match.id, projects: data.projects };

  const created = await localCoreFetch<{ project: Project }>("/api/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: projectName, objective: labels.projectObjective }),
  });

  if (created.error || !created.data?.project) {
    return { projects: data.projects, error: created.error ?? labels.createProjectError };
  }

  return { projectId: created.data.project.id, projects: [...data.projects, created.data.project] };
}

// ─── types ──────────────────────────────────────────────────────────────────

type CoreStatus = { ok: boolean; version?: string } | null;
type CoreAccess = "server" | "browser" | null;

const MODE_COLOR: Record<string, string> = {
  evidence: "text-emerald-600 dark:text-emerald-400",
  insufficient: "text-amber-600 dark:text-amber-400",
  orientation: "text-blue-600 dark:text-blue-400",
};

// ─── component ──────────────────────────────────────────────────────────────

interface Props {
  workspaceId: string;
  locale: Locale;
}

export function CoreMemoryPanel({ workspaceId, locale }: Props) {
  const t = getDashboardTranslations(locale);
  const modeLabel: Record<string, string> = {
    evidence: t.brainModeEvidence,
    insufficient: t.brainModeInsufficient,
    orientation: t.brainModeOrientation,
  };
  const quickQueries = [
    { label: t.brainLocalQuickCurrentState, query: t.brainLocalQuickCurrentStateQuery },
    { label: t.brainLocalQuickHypotheses, query: t.brainLocalQuickHypothesesQuery },
    { label: t.brainLocalQuickUserProfile, query: t.brainLocalQuickUserProfileQuery },
    { label: t.brainLocalQuickPendingDecisions, query: t.brainLocalQuickPendingDecisionsQuery },
  ];
  const [coreStatus, setCoreStatus] = useState<CoreStatus>(null);
  const [coreAccess, setCoreAccess] = useState<CoreAccess>(null);
  const [statusLoading, setStatusLoading] = useState(true);

  // selectedId is auto-resolved from workspaceId; projects kept for debug fallback
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [debugSelector, setDebugSelector] = useState(false);

  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<BrainAnswer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // — memory form ───────────────────────────────────────────────
  const [memOpen, setMemOpen] = useState(false);
  const [memTitle, setMemTitle] = useState("");
  const [memContent, setMemContent] = useState("");
  const [memSaving, setMemSaving] = useState(false);
  const [memOk, setMemOk] = useState(false);
  const [memError, setMemError] = useState<string | null>(null);

  // — check Core, auto-resolve workspace → Core project ─────────
  const init = useCallback(async () => {
    setStatusLoading(true);
    const { data, error: err } = await apiFetch<{ ok: boolean; version: string }>("/api/core/health");
    let access: CoreAccess = "server";
    let health = data;

    if (err || !data?.ok) {
      const local = await localCoreFetch<{ ok: boolean; version: string }>("/api/health");
      if (local.error || !local.data?.ok) {
        setCoreAccess(null);
        setCoreStatus({ ok: false });
        setStatusLoading(false);
        return;
      }
      access = "browser";
      health = local.data;
    }

    if (!health?.ok) {
      setCoreAccess(null);
      setCoreStatus({ ok: false });
      setStatusLoading(false);
      return;
    }
    setCoreAccess(access);
    setCoreStatus({ ok: true, version: health.version });

    // Auto-resolve: find or create the Core project for this workspace
    if (access === "browser") {
      const localProject = await resolveLocalCoreProject(workspaceId, {
        readProjectsError: t.brainLocalReadProjectsError,
        projectObjective: t.brainLocalProjectObjective,
        createProjectError: t.brainLocalCreateProjectError,
      });
      setProjects(localProject.projects);
      if (localProject.projectId) setSelectedId(localProject.projectId);
    } else {
      const { data: proj } = await apiFetch<{ projectId: number }>(`/api/core/workspace/${workspaceId}/project`);
      if (proj?.projectId) {
        setSelectedId(proj.projectId);
      }

      // Load project list only for debug selector (not shown by default)
      const { data: pd } = await apiFetch<{ projects: Project[] }>("/api/core/projects");
      setProjects(pd?.projects ?? []);
    }

    setStatusLoading(false);
  }, [workspaceId, t.brainLocalCreateProjectError, t.brainLocalProjectObjective, t.brainLocalReadProjectsError]);

  useEffect(() => { init(); }, [init]);

  // — query ─────────────────────────────────────────────────────
  async function handleQuery(q: string) {
    const trimmed = q.trim();
    if (!trimmed || !selectedId || loading) return;
    setQuery(trimmed);
    setLoading(true);
    setError(null);
    setAnswer(null);

    // CLOUD2B: workspace-aware route — persists BrainQuery/BrainSource in MITIKUS DB
    const { data, error: err } = coreAccess === "browser"
      ? await localCoreFetch<BrainAnswer>(`/api/projects/${selectedId}/brain/answer?query=${encodeURIComponent(trimmed)}`)
      : await apiFetch<BrainAnswer>(`/api/core/workspace/${workspaceId}/brain/answer?query=${encodeURIComponent(trimmed)}`);
    if (err) setError(err);
    else setAnswer(data ?? null);
    setLoading(false);
  }

  function handleClear() {
    setQuery("");
    setAnswer(null);
    setError(null);
    inputRef.current?.focus();
  }

  // — save memory ───────────────────────────────────────────────
  async function handleSaveMemory() {
    const title = memTitle.trim();
    const content = memContent.trim();
    if (!title || !content || !selectedId) return;
    setMemSaving(true);
    setMemError(null);
    setMemOk(false);

    const notePath = coreAccess === "browser"
      ? `/api/projects/${selectedId}/notes`
      : `/api/core/projects/${selectedId}/notes`;
    const fetcher = coreAccess === "browser" ? localCoreFetch : apiFetch;
    const { error: err } = await fetcher<{ note: Note }>(notePath, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content }),
    });

    if (err) {
      setMemError(err);
    } else {
      setMemOk(true);
      setMemTitle("");
      setMemContent("");
      setTimeout(() => { setMemOpen(false); setMemOk(false); }, 3000);
    }
    setMemSaving(false);
  }

  // ─── render ──────────────────────────────────────────────────

  if (statusLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
        {t.brainLocalChecking}
      </div>
    );
  }

  if (!coreStatus?.ok) {
    return (
      <div className="rounded-xl border border-border bg-muted/20 px-5 py-6 space-y-3">
        <div className="space-y-1">
          <p className="text-sm font-medium">{t.brainLocalInactive}</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {t.brainLocalSetupDescription}
          </p>
        </div>
        <p className="text-xs font-medium text-muted-foreground">
          {t.brainLocalAdvancedCommand}
        </p>
        <code className="block text-xs font-mono bg-background border border-border rounded px-3 py-2 mt-1">
          node dist/ui/sidecar.js
        </code>
        <button
          onClick={init}
          className="mt-2 text-xs text-primary hover:underline"
        >
          {t.brainLocalRetry}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">

      {/* status bar — Core version + debug toggle */}
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
          {t.brainLocalActive} · Core {coreStatus.version}
          {coreAccess === "browser" ? " local" : ""}
        </span>
        <button
          type="button"
          onClick={() => setDebugSelector((v) => !v)}
          className="ml-auto text-[10px] text-muted-foreground/40 hover:text-muted-foreground transition-colors"
          title={t.brainLocalProjectSelectorDebug}
        >
          {debugSelector ? t.brainLocalHideSelector : "···"}
        </button>
      </div>

      {/* debug: manual project selector — hidden by default */}
      {debugSelector && (
        <div className="flex items-center gap-2 rounded-lg border border-dashed border-border bg-muted/20 px-3 py-2">
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wide">debug</span>
          {projects.length > 0 ? (
            <select
              value={selectedId ?? ""}
              onChange={(e) => setSelectedId(Number(e.target.value) || null)}
              className="text-sm border border-border rounded-lg px-2 py-1 bg-background focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          ) : (
            <span className="text-xs text-muted-foreground">{t.brainLocalNoProjects}</span>
          )}
        </div>
      )}

      {/* memory form — expandable */}
      <div className="rounded-xl border border-border overflow-hidden">
        <button
          type="button"
          onClick={() => { setMemOpen((v) => !v); setMemOk(false); setMemError(null); }}
          disabled={!selectedId}
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium hover:bg-muted/50 transition-colors disabled:opacity-40 text-left"
        >
          <span>{t.brainLocalAddBaseMemory}</span>
          <svg
            className={`w-4 h-4 text-muted-foreground transition-transform ${memOpen ? "rotate-180" : ""}`}
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden
          >
            <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {memOpen && (
          <div className="px-4 pb-4 pt-1 border-t border-border space-y-3">
            <p className="text-xs text-muted-foreground">
              {t.brainLocalBaseMemoryDescription}
            </p>

            <label className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">{t.brainMemoryTitle} *</span>
              <input
                type="text"
                value={memTitle}
                onChange={(e) => setMemTitle(e.target.value)}
                placeholder={t.brainLocalTitlePlaceholder}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">{t.brainMemoryContent} *</span>
              <textarea
                value={memContent}
                onChange={(e) => setMemContent(e.target.value)}
                rows={5}
                placeholder={t.brainLocalContentPlaceholder}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring resize-y"
              />
            </label>

            {memError && (
              <p className="text-xs text-red-500 font-mono">{memError}</p>
            )}
            {memOk && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400">
                {t.brainLocalSaved}
              </p>
            )}

            <button
              type="button"
              onClick={handleSaveMemory}
              disabled={memSaving || !memTitle.trim() || !memContent.trim()}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {memSaving ? `${t.toolApprovalSaving.replace('...', '')}…` : t.brainMemorySaveChanges}
            </button>
          </div>
        )}
      </div>

      {/* query input */}
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleQuery(query); }}
          placeholder={t.brainLocalQuestionPlaceholder}
          disabled={loading || !selectedId}
          className="flex-1 rounded-lg border border-border bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
          autoFocus
        />
        <button
          type="button"
          onClick={() => handleQuery(query)}
          disabled={loading || !query.trim() || !selectedId}
          className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {loading ? (
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
          ) : "✦"}
        </button>
      </div>

      {/* quick queries */}
      {!answer && !loading && (
        <div className="flex flex-wrap gap-2">
          {quickQueries.map((q) => (
            <button
              key={q.label}
              type="button"
              onClick={() => handleQuery(q.query)}
              disabled={!selectedId}
              className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-40"
            >
              {q.label}
            </button>
          ))}
        </div>
      )}

      {/* error */}
      {error && (
        <p className="text-sm text-red-500 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 px-4 py-3">
          {error}
        </p>
      )}

      {/* result */}
      {answer && (
        <div className="flex flex-col gap-3">

          {/* meta */}
          <div className="flex items-center gap-3 text-xs flex-wrap">
            <span className={`font-medium ${MODE_COLOR[answer.mode] ?? "text-muted-foreground"}`}>
              {modeLabel[answer.mode] ?? answer.mode}
            </span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">{answer.evidenceCount} {answer.evidenceCount === 1 ? t.brainSourceSingular : t.brainSourcePlural}</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground font-mono truncate max-w-xs">{answer.normalizedQuery}</span>
          </div>

          {/* answer */}
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-muted-foreground">{t.brainAnswer}</span>
              <button
                type="button"
                onClick={handleClear}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded hover:bg-muted"
              >
                {t.brainClear}
              </button>
            </div>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{answer.answer}</p>
          </div>

          {/* warnings — no se reescriben */}
          {answer.warnings && answer.warnings.length > 0 && (
            <div className="rounded-lg border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/30 px-4 py-3 space-y-1">
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide">{t.brainWarnings}</p>
              {answer.warnings.map((w, i) => (
                <p key={i} className="text-xs text-amber-700 dark:text-amber-400">{w}</p>
              ))}
            </div>
          )}

          {/* sources — siempre visibles */}
          {answer.sources.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">{t.brainSources}</p>
              {answer.sources.map((s, i) => (
                <div key={`${s.type}-${s.id}`} className="rounded-lg border border-border bg-card/50 px-3 py-2.5 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400">
                      {s.type}
                    </span>
                    <span className="text-xs font-medium truncate flex-1">{s.title}</span>
                    <span className="text-[10px] text-muted-foreground/40 shrink-0 font-mono">{s.origin}</span>
                    <span className="text-[10px] text-muted-foreground/40 shrink-0">[{i + 1}]</span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-3">{s.excerpt}</p>
                </div>
              ))}
            </div>
          )}

          {answer.sources.length === 0 && (
            <p className="text-xs text-muted-foreground">
              {t.brainLocalNoSources}
              {' '}
              {t.brainLocalNoSourcesHint}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
