"use client";

import { useEffect, useState } from "react";
import { BrainPanel } from "./BrainPanel";
import { CoreMemoryPanel } from "./CoreMemoryPanel";
import { BrainHistoryPanel } from "./BrainHistoryPanel";
import { MemoryCloudPanel } from "./MemoryCloudPanel";
import { cn } from "@/lib/utils";

interface Props {
  workspaceId: string;
}

type Tab = "cloud" | "local" | "history" | "memory";
const VALID_TABS = new Set<Tab>(["cloud", "local", "history", "memory"]);

export function BrainTabs({ workspaceId }: Props) {
  const [tab, setTab] = useState<Tab>("cloud");
  const [focusedMemoryId, setFocusedMemoryId] = useState<string | null>(null);
  const [focusedMemoryKey, setFocusedMemoryKey] = useState(0);

  const updateUrl = (nextTab: Tab, memoryId?: string | null) => {
    if (typeof window === "undefined") return;

    const url = new URL(window.location.href);
    if (nextTab === "cloud") {
      url.searchParams.delete("tab");
    } else {
      url.searchParams.set("tab", nextTab);
    }

    if (memoryId) {
      url.searchParams.set("memory", memoryId);
    } else {
      url.searchParams.delete("memory");
    }

    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  };

  const selectTab = (nextTab: Tab) => {
    setTab(nextTab);
    setFocusedMemoryId(null);
    updateUrl(nextTab, null);
  };

  const openMemorySource = (memoryId: string) => {
    setFocusedMemoryId(memoryId);
    setFocusedMemoryKey((key) => key + 1);
    setTab("memory");
    updateUrl("memory", memoryId);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const memoryId = params.get("memory")?.trim() || null;
    const requestedTab = params.get("tab")?.trim() as Tab | null;

    if (memoryId) {
      setFocusedMemoryId(memoryId);
      setFocusedMemoryKey((key) => key + 1);
      setTab("memory");
      return;
    }

    if (requestedTab && VALID_TABS.has(requestedTab)) {
      setTab(requestedTab);
    }
  }, [workspaceId]);

  return (
    <div className="flex flex-col h-full gap-5">
      {/* tab bar */}
      <div className="flex gap-1 border-b border-border shrink-0 -mb-1">
        <button
          type="button"
          onClick={() => selectTab("cloud")}
          className={cn(
            "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
            tab === "cloud"
              ? "border-foreground text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          ✦ Brain
        </button>
        <button
          type="button"
          onClick={() => selectTab("local")}
          className={cn(
            "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
            tab === "local"
              ? "border-foreground text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Memoria local
        </button>
        <button
          type="button"
          onClick={() => selectTab("history")}
          className={cn(
            "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
            tab === "history"
              ? "border-foreground text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Historial
        </button>
        <button
          type="button"
          onClick={() => selectTab("memory")}
          className={cn(
            "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
            tab === "memory"
              ? "border-foreground text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Memoria
        </button>
      </div>

      {/* panels */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {tab === "cloud" && (
          <BrainPanel
            workspaceId={workspaceId}
            compact={false}
            onOpenMemorySource={openMemorySource}
          />
        )}
        {tab === "local" && (
          <CoreMemoryPanel workspaceId={workspaceId} />
        )}
        {tab === "history" && (
          <BrainHistoryPanel
            workspaceId={workspaceId}
            onOpenMemorySource={openMemorySource}
          />
        )}
        {tab === "memory" && (
          <MemoryCloudPanel
            workspaceId={workspaceId}
            focusMemoryId={focusedMemoryId}
            focusMemoryKey={focusedMemoryKey}
          />
        )}
      </div>
    </div>
  );
}
