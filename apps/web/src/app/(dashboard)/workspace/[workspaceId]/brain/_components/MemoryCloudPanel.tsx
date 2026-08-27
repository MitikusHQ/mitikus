"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

// CLOUD5 — MemoryCloudPanel
// Cloud source of truth for free-form workspace memory.
// Reads from and writes to MITIKUS DB via /api/workspace/[workspaceId]/memory.
// CLOUD8 adds edit/archive actions. Archived items stay in DB and leave Brain search.
// CLOUD9 adds archived view and restore.
// CLOUD10 adds client-side search and type filters.
// CLOUD11 can focus a MemoryItem when opened from a Brain source.
// CLOUD13 falls back to archived view when a focused MemoryItem is no longer active.
// CLOUD14 can directly load a focused MemoryItem by id.

interface MemoryItemRecord {
  id: string;
  title: string;
  content: string;
  type: string;
  status?: "active" | "archived";
  source: string;
  createdAt: string;
  updatedAt: string;
}

const TYPE_OPTIONS = [
  { value: "note", label: "Nota" },
  { value: "decision", label: "Decisión" },
  { value: "hypothesis", label: "Hipótesis" },
  { value: "context", label: "Contexto" },
];

const TYPE_BADGE: Record<string, string> = {
  note: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  decision: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  hypothesis: "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300",
  context: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
};

const TYPE_LABEL: Record<string, string> = {
  note: "Nota",
  decision: "Decisión",
  hypothesis: "Hipótesis",
  context: "Contexto",
};

interface Props {
  workspaceId: string;
  focusMemoryId?: string | null;
  focusMemoryKey?: number;
}

export function MemoryCloudPanel({ workspaceId, focusMemoryId, focusMemoryKey = 0 }: Props) {
  const [items, setItems] = useState<MemoryItemRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [statusView, setStatusView] = useState<"active" | "archived">("active");
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [focusFallbackTried, setFocusFallbackTried] = useState(false);
  const [focusLoadError, setFocusLoadError] = useState<string | null>(null);

  // form state
  const [formOpen, setFormOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState("note");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  // edit/archive state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editType, setEditType] = useState("note");
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [archivingId, setArchivingId] = useState<string | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const fetchItems = async () => {
    setLoading(true);
    setError(null);
    setExpandedId(null);
    cancelEdit();
    try {
      const query = statusView === "archived" ? "?status=archived" : "";
      const res = await fetch(`/api/workspace/${workspaceId}/memory${query}`);
      const data = (await res.json()) as { items?: MemoryItemRecord[]; error?: string };
      if (!res.ok || data.error) {
        setError(data.error ?? `HTTP ${res.status}`);
      } else {
        setItems(data.items ?? []);
      }
    } catch {
      setError("No se pudo cargar la memoria cloud.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId, statusView]);

  useEffect(() => {
    if (formOpen) {
      setTimeout(() => titleRef.current?.focus(), 50);
    }
  }, [formOpen]);

  useEffect(() => {
    if (statusView === "archived") {
      setFormOpen(false);
      setSaveError(null);
    }
  }, [statusView]);

  useEffect(() => {
    if (!focusMemoryId) return;
    setStatusView("active");
    setSearchTerm("");
    setTypeFilter("all");
    setExpandedId(focusMemoryId);
    setFocusFallbackTried(false);
    setFocusLoadError(null);
    cancelEdit();
  }, [focusMemoryId, focusMemoryKey]);

  useEffect(() => {
    if (!focusMemoryId) return;

    let cancelled = false;
    setFocusLoadError(null);

    fetch(`/api/workspace/${workspaceId}/memory?id=${encodeURIComponent(focusMemoryId)}`)
      .then((res) => res.json().then((data: { item?: MemoryItemRecord; error?: string }) => ({ res, data })))
      .then(({ res, data }) => {
        if (cancelled) return;
        if (!res.ok || data.error || !data.item) {
          setFocusLoadError(data.error ?? "No se pudo abrir la memoria.");
          return;
        }

        const item = data.item;
        setStatusView(item.status === "archived" ? "archived" : "active");
        setSearchTerm("");
        setTypeFilter("all");
        setItems((prev) => [item, ...prev.filter((existing) => existing.id !== item.id)]);
        setExpandedId(item.id);
      })
      .catch(() => {
        if (!cancelled) {
          setFocusLoadError("No se pudo abrir la memoria.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [focusMemoryId, focusMemoryKey, workspaceId]);

  useEffect(() => {
    if (!focusMemoryId || loading) return;

    const found = items.some((item) => item.id === focusMemoryId);
    if (found) {
      setExpandedId(focusMemoryId);
      return;
    }

    if (statusView === "active" && !focusFallbackTried) {
      setFocusFallbackTried(true);
      setStatusView("archived");
    }
  }, [focusMemoryId, loading, items, statusView, focusFallbackTried]);

  const handleSave = async () => {
    setSaveError(null);
    if (!title.trim()) { setSaveError("El título es obligatorio."); return; }
    if (!content.trim()) { setSaveError("El contenido es obligatorio."); return; }

    setSaving(true);
    try {
      const res = await fetch(`/api/workspace/${workspaceId}/memory`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), content: content.trim(), type }),
      });
      const data = (await res.json()) as { item?: MemoryItemRecord; error?: string };
      if (!res.ok || data.error) {
        setSaveError(data.error ?? `HTTP ${res.status}`);
      } else if (data.item) {
        setItems((prev) => [data.item!, ...prev]);
        setTitle("");
        setContent("");
        setType("note");
        setFormOpen(false);
        setExpandedId(data.item.id);
      }
    } catch {
      setSaveError("Error al guardar. Inténtalo de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (item: MemoryItemRecord) => {
    setEditingId(item.id);
    setEditTitle(item.title);
    setEditContent(item.content);
    setEditType(item.type);
    setEditError(null);
    setExpandedId(item.id);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
    setEditContent("");
    setEditType("note");
    setEditError(null);
  };

  const handleUpdate = async () => {
    if (!editingId || editSaving) return;
    setEditError(null);
    if (!editTitle.trim()) { setEditError("El título es obligatorio."); return; }
    if (!editContent.trim()) { setEditError("El contenido es obligatorio."); return; }

    setEditSaving(true);
    try {
      const res = await fetch(`/api/workspace/${workspaceId}/memory`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingId,
          title: editTitle.trim(),
          content: editContent.trim(),
          type: editType,
        }),
      });
      const data = (await res.json()) as { item?: MemoryItemRecord; error?: string };
      if (!res.ok || data.error) {
        setEditError(data.error ?? `HTTP ${res.status}`);
      } else if (data.item) {
        setItems((prev) => prev.map((item) => (item.id === data.item!.id ? data.item! : item)));
        cancelEdit();
        setExpandedId(data.item.id);
      }
    } catch {
      setEditError("Error al actualizar. Inténtalo de nuevo.");
    } finally {
      setEditSaving(false);
    }
  };

  const handleArchive = async (item: MemoryItemRecord) => {
    if (archivingId) return;
    const confirmed = window.confirm(`¿Archivar "${item.title}"? Dejará de aparecer en Brain, pero no se borrará.`);
    if (!confirmed) return;

    setArchivingId(item.id);
    setEditError(null);
    try {
      const res = await fetch(`/api/workspace/${workspaceId}/memory`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, action: "archive" }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok || data.error) {
        setEditError(data.error ?? `HTTP ${res.status}`);
        setExpandedId(item.id);
      } else {
        setItems((prev) => prev.filter((memory) => memory.id !== item.id));
        if (expandedId === item.id) setExpandedId(null);
        if (editingId === item.id) cancelEdit();
      }
    } catch {
      setEditError("Error al archivar. Inténtalo de nuevo.");
      setExpandedId(item.id);
    } finally {
      setArchivingId(null);
    }
  };

  const handleRestore = async (item: MemoryItemRecord) => {
    if (restoringId) return;
    setRestoringId(item.id);
    setEditError(null);
    try {
      const res = await fetch(`/api/workspace/${workspaceId}/memory`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, action: "restore" }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok || data.error) {
        setEditError(data.error ?? `HTTP ${res.status}`);
        setExpandedId(item.id);
      } else {
        setItems((prev) => prev.filter((memory) => memory.id !== item.id));
        if (expandedId === item.id) setExpandedId(null);
      }
    } catch {
      setEditError("Error al restaurar. Inténtalo de nuevo.");
      setExpandedId(item.id);
    } finally {
      setRestoringId(null);
    }
  };

  const filteredItems = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return items.filter((item) => {
      const matchesType = typeFilter === "all" || item.type === typeFilter;
      if (!matchesType) return false;

      if (!normalizedSearch) return true;

      const haystack = `${item.title} ${item.content}`.toLowerCase();
      return haystack.includes(normalizedSearch);
    });
  }, [items, searchTerm, typeFilter]);

  const filtersActive = searchTerm.trim().length > 0 || typeFilter !== "all";

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

  // ── render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-5">

      {/* cloud notice */}
      <div className="rounded-md border border-blue-200 bg-blue-50 dark:border-blue-900/50 dark:bg-blue-950/30 px-4 py-3 text-sm text-blue-700 dark:text-blue-300 flex items-start gap-2">
        <span className="shrink-0 mt-0.5">☁</span>
        <span>
          Esta memoria se guarda en MITIKUS Cloud como fuente de verdad.
          Cuando el Core local está disponible, MITIKUS intenta indexarla también
          como copia secundaria.
        </span>
      </div>

      {/* controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex w-fit rounded-md border border-border bg-muted/30 p-1">
          <button
            type="button"
            onClick={() => setStatusView("active")}
            className={cn(
              "px-3 py-1.5 rounded text-sm font-medium transition-colors",
              statusView === "active"
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Activas
          </button>
          <button
            type="button"
            onClick={() => setStatusView("archived")}
            className={cn(
              "px-3 py-1.5 rounded text-sm font-medium transition-colors",
              statusView === "archived"
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Archivadas
          </button>
        </div>

        <button
          type="button"
          onClick={() => { setFormOpen((v) => !v); setSaveError(null); }}
          disabled={statusView === "archived"}
          className={cn(
            "px-4 py-2 rounded-md text-sm font-medium transition-colors",
            statusView === "archived"
              ? "bg-muted text-muted-foreground opacity-60 cursor-not-allowed"
              : formOpen
              ? "bg-muted text-muted-foreground hover:bg-muted/80"
              : "bg-foreground text-background hover:bg-foreground/90"
          )}
        >
          {formOpen ? "Cancelar" : "+ Nueva memoria"}
        </button>
      </div>

      {/* search + filters */}
      <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Buscar
          </label>
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setExpandedId(null);
            }}
            placeholder="Busca por título o contenido"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Tipo
          </label>
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setExpandedId(null);
            }}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">Todos</option>
            {TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {!loading && !error && items.length > 0 && (
        <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>
            {filteredItems.length} de {items.length} memorias
          </span>
          {filtersActive && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setTypeFilter("all");
                setExpandedId(null);
              }}
              className="font-medium hover:text-foreground transition-colors"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      )}

      {/* form */}
      {formOpen && (
        <div className="border border-border rounded-lg p-4 flex flex-col gap-3 bg-muted/20">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Título
            </label>
            <input
              ref={titleRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="p. ej. Decisión sobre arquitectura de auth"
              maxLength={200}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Tipo
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Contenido
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              placeholder="Escribe aquí el contenido de la memoria…"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-y"
            />
          </div>

          {saveError && (
            <p className="text-sm text-destructive">{saveError}</p>
          )}

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 rounded-md text-sm font-medium bg-foreground text-background hover:bg-foreground/90 disabled:opacity-50 transition-colors"
            >
              {saving ? "Guardando…" : "Guardar en cloud"}
            </button>
          </div>
        </div>
      )}

      {/* list */}
      {loading && (
        <div className="flex items-center justify-center h-24 text-muted-foreground text-sm">
          Cargando memoria cloud…
        </div>
      )}

      {error && !loading && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {focusLoadError && !loading && (
        <div className="rounded-md border border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/30 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
          {focusLoadError}
        </div>
      )}

      {!loading && !error && filteredItems.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
          <span className="text-2xl">🧠</span>
          <p className="text-sm font-medium">
            {filtersActive
              ? "No hay memorias que coincidan."
              : statusView === "archived"
              ? "No hay memorias archivadas."
              : "No hay memoria cloud todavía."}
          </p>
          <p className="text-xs">
            {filtersActive
              ? "Prueba con otra búsqueda o limpia los filtros."
              : statusView === "archived"
              ? "Cuando archives una memoria, aparecerá aquí."
              : "Crea la primera con el botón de arriba."}
          </p>
        </div>
      )}

      {!loading && !error && filteredItems.length > 0 && (
        <ul className="flex flex-col gap-2">
          {filteredItems.map((item) => {
            const expanded = expandedId === item.id;
            const focused = focusMemoryId === item.id && statusView === "active";
            return (
              <li
                key={item.id}
                className={cn(
                  "border rounded-lg overflow-hidden transition-colors",
                  focused ? "border-primary/60 bg-primary/5" : "border-border"
                )}
              >
                <button
                  type="button"
                  onClick={() => setExpandedId(expanded ? null : item.id)}
                  className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.title}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-xs text-muted-foreground">
                        {formatDate(item.createdAt)}
                      </span>
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded text-xs font-medium",
                          TYPE_BADGE[item.type] ?? TYPE_BADGE["note"]
                        )}
                      >
                        {TYPE_LABEL[item.type] ?? item.type}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                        cloud
                      </span>
                      {statusView === "archived" && (
                        <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground">
                          archivada
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-muted-foreground text-xs pt-1">
                    {expanded ? "▲" : "▼"}
                  </span>
                </button>

                {expanded && (
                  <div className="border-t border-border px-4 py-4 bg-muted/20">
                    {editingId === item.id ? (
                      <div className="flex flex-col gap-3">
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Título
                          </label>
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            maxLength={200}
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                          />
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Tipo
                          </label>
                          <select
                            value={editType}
                            onChange={(e) => setEditType(e.target.value)}
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                          >
                            {TYPE_OPTIONS.map((o) => (
                              <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                          </select>
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Contenido
                          </label>
                          <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            rows={6}
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-y"
                          />
                        </div>

                        {editError && (
                          <p className="text-sm text-destructive">{editError}</p>
                        )}

                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={cancelEdit}
                            disabled={editSaving}
                            className="px-3 py-2 rounded-md text-sm font-medium border border-border hover:bg-muted transition-colors disabled:opacity-50"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            onClick={handleUpdate}
                            disabled={editSaving}
                            className="px-3 py-2 rounded-md text-sm font-medium bg-foreground text-background hover:bg-foreground/90 disabled:opacity-50 transition-colors"
                          >
                            {editSaving ? "Guardando…" : "Guardar cambios"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-4">
                        <p className="text-sm whitespace-pre-wrap">{item.content}</p>

                        {editError && expandedId === item.id && (
                          <p className="text-sm text-destructive">{editError}</p>
                        )}

                        {statusView === "active" ? (
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => startEdit(item)}
                              className="px-3 py-2 rounded-md text-sm font-medium border border-border hover:bg-muted transition-colors"
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleArchive(item)}
                              disabled={archivingId === item.id}
                              className="px-3 py-2 rounded-md text-sm font-medium border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                            >
                              {archivingId === item.id ? "Archivando…" : "Archivar"}
                            </button>
                          </div>
                        ) : (
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={() => void handleRestore(item)}
                              disabled={restoringId === item.id}
                              className="px-3 py-2 rounded-md text-sm font-medium border border-border hover:bg-muted transition-colors disabled:opacity-50"
                            >
                              {restoringId === item.id ? "Restaurando…" : "Restaurar"}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
