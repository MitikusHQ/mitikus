"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

// CLOUD4 — Brain Query History UI
// Displays the last 20 BrainQuery records for the workspace.
// Reads from MITIKUS DB via /api/workspace/[workspaceId]/brain/history.
// No Core calls. Answer/warnings/sources are never rewritten.
// CLOUD12 can open cloud-memory sources in the Memory tab.

interface BrainSourceRecord {
  id: string;
  origin: string;
  sourceType: string;
  sourceId: string;
  title: string;
  excerpt: string;
  score: number | null;
}

interface BrainQueryRecord {
  id: string;
  query: string;
  normalizedQuery: string | null;
  mode: string | null;
  answer: string | null;
  evidenceCount: number | null;
  warnings: unknown;
  sources: number;
  createdAt: string;
  sourcesList: BrainSourceRecord[];
}

type OriginFilter = "all" | "cloud-memory" | "local-memory";

interface Props {
  workspaceId: string;
  onOpenMemorySource?: (memoryId: string) => void;
}

export function BrainHistoryPanel({ workspaceId, onOpenMemorySource }: Props) {
  const [queries, setQueries] = useState<BrainQueryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<OriginFilter>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/workspace/${workspaceId}/brain/history`)
      .then((r) => r.json())
      .then((data: { queries?: BrainQueryRecord[]; error?: string }) => {
        if (cancelled) return;
        if (data.error) {
          setError(data.error);
        } else {
          setQueries(data.queries ?? []);
        }
      })
      .catch(() => {
        if (!cancelled) setError("No se pudo cargar el historial.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [workspaceId]);

  const warnings = (q: BrainQueryRecord): string[] => {
    if (!q.warnings) return [];
    if (Array.isArray(q.warnings)) return q.warnings as string[];
    return [];
  };

  const filteredQueries = queries.filter((q) => {
    if (filter === "all") return true;
    // A query matches the origin filter if any of its sources match, or if it has no
    // sources and we infer origin from mode (orientation = local-memory).
    if (q.sourcesList.length > 0) {
      return q.sourcesList.some((s) => s.origin === filter);
    }
    // No sources: cloud-memory queries come from Brain cloud (mode evidence/insufficient)
    // local-memory queries come from Core (all three modes possible but same for no-source)
    if (filter === "local-memory") return q.mode === "orientation";
    return filter === "cloud-memory";
  });

  const modeLabel: Record<string, string> = {
    evidence: "Evidencia",
    insufficient: "Sin evidencia",
    orientation: "Orientación",
  };

  const modeBadge = (mode: string | null) => {
    const label = mode ? (modeLabel[mode] ?? mode) : "—";
    const cls =
      mode === "evidence"
        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
        : mode === "insufficient"
        ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
        : "bg-muted text-muted-foreground";
    return (
      <span className={cn("px-2 py-0.5 rounded text-xs font-medium", cls)}>
        {label}
      </span>
    );
  };

  const originBadge = (origin: string) => {
    const isCloud = origin === "cloud-memory";
    return (
      <span
        className={cn(
          "px-1.5 py-0.5 rounded text-xs font-medium",
          isCloud
            ? "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300"
            : "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300"
        )}
      >
        {isCloud ? "cloud" : "local"}
      </span>
    );
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
        Cargando historial…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
        {error}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* filter bar */}
      <div className="flex gap-1">
        {(["all", "cloud-memory", "local-memory"] as OriginFilter[]).map((o) => (
          <button
            key={o}
            type="button"
            onClick={() => setFilter(o)}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-medium transition-colors",
              filter === o
                ? "bg-foreground text-background"
                : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            {o === "all" ? "Todos" : o === "cloud-memory" ? "✦ Cloud" : "Local"}
          </button>
        ))}
        <span className="ml-auto text-xs text-muted-foreground self-center">
          {filteredQueries.length} consulta{filteredQueries.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* empty state */}
      {filteredQueries.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
          <span className="text-2xl">📭</span>
          <p className="text-sm">No hay consultas registradas todavía.</p>
          {filter !== "all" && (
            <p className="text-xs">
              Prueba a seleccionar "Todos" para ver todas las fuentes.
            </p>
          )}
        </div>
      )}

      {/* query list */}
      <ul className="flex flex-col gap-2">
        {filteredQueries.map((q) => {
          const expanded = expandedId === q.id;
          const w = warnings(q);
          const inferredOrigin =
            q.sourcesList.length > 0
              ? (q.sourcesList[0]?.origin ?? "cloud-memory")
              : q.mode === "orientation"
              ? "local-memory"
              : "cloud-memory";

          return (
            <li
              key={q.id}
              className="border border-border rounded-lg overflow-hidden"
            >
              {/* header row */}
              <button
                type="button"
                onClick={() => setExpandedId(expanded ? null : q.id)}
                className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{q.query}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-xs text-muted-foreground">
                      {formatDate(q.createdAt)}
                    </span>
                    {modeBadge(q.mode)}
                    {originBadge(inferredOrigin)}
                    {q.sources > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {q.sources} fuente{q.sources !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-muted-foreground text-xs pt-1">
                  {expanded ? "▲" : "▼"}
                </span>
              </button>

              {/* expanded body */}
              {expanded && (
                <div className="border-t border-border px-4 py-4 flex flex-col gap-4 bg-muted/20">
                  {/* normalized query */}
                  {q.normalizedQuery && q.normalizedQuery !== q.query && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                        Consulta normalizada
                      </p>
                      <p className="text-sm text-muted-foreground italic">
                        {q.normalizedQuery}
                      </p>
                    </div>
                  )}

                  {/* answer */}
                  {q.answer && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                        Respuesta
                      </p>
                      <p className="text-sm whitespace-pre-wrap">{q.answer}</p>
                    </div>
                  )}

                  {/* warnings — verbatim, never rewritten */}
                  {w.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                        Avisos
                      </p>
                      <ul className="flex flex-col gap-1">
                        {w.map((warn, i) => (
                          <li
                            key={i}
                            className="text-sm text-amber-700 dark:text-amber-400"
                          >
                            ⚠ {warn}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* sources */}
                  {q.sourcesList.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                        Fuentes ({q.sourcesList.length})
                      </p>
                      <ul className="flex flex-col gap-3">
                        {q.sourcesList.map((s) => (
                          <li
                            key={s.id}
                            className="border border-border rounded-md px-3 py-2 bg-background"
                          >
                            <div className="flex items-center gap-2 mb-1">
                              {originBadge(s.origin)}
                              <span className="text-xs text-muted-foreground">
                                {s.sourceType}
                              </span>
                              {s.score != null && (
                                <span className="text-xs text-muted-foreground ml-auto">
                                  {(s.score * 100).toFixed(0)}%
                                </span>
                              )}
                            </div>
                            <p className="text-sm font-medium">{s.title}</p>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-3">
                              {s.excerpt}
                            </p>
                            {s.origin === "cloud-memory" && s.sourceType === "memory" && onOpenMemorySource && (
                              <button
                                type="button"
                                onClick={() => onOpenMemorySource(s.sourceId)}
                                className="mt-2 text-xs font-medium text-primary hover:underline"
                              >
                                Ver memoria
                              </button>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
