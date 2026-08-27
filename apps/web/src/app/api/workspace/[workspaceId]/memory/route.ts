import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { CoreClient } from "@/lib/core-client";

// CLOUD5 — MemoryItem cloud CRUD
// GET  → list active MemoryItems for workspace (newest first, limit 50)
// POST → create MemoryItem { title, content, type? }
// CLOUD6 — POST writes MITIKUS DB first, then best-effort syncs to Core.
// MITIKUS DB remains source of truth; Core SQLite is a derived index.
// CLOUD8 — PATCH edits or archives MemoryItems in MITIKUS DB only.
// CLOUD9 — GET can list archived items and PATCH can restore them.
// CLOUD14 — GET can return one MemoryItem by id regardless of status.

export const dynamic = "force-dynamic";

const CORE_PROJECT_PREFIX = "MITIKUS:";
const ALLOWED_MEMORY_TYPES = new Set(["note", "decision", "hypothesis", "context"]);

interface RouteParams {
  params: Promise<{ workspaceId: string }>;
}

// ── shared auth + ownership helper ───────────────────────────────────────────

async function resolveUserAndWorkspace(userId: string, workspaceId: string) {
  const user = await db.user.findUnique({
    where: { clerkId: userId },
    select: { id: true, orgId: true },
  });
  if (!user) return null;

  const workspace = await db.workspace.findFirst({
    where: { id: workspaceId, orgId: user.orgId },
    select: { id: true, coreProjectId: true },
  });
  if (!workspace) return null;

  return { user, workspace };
}

async function resolveCoreProjectId(workspaceId: string, persistedCoreProjectId: number | null) {
  if (persistedCoreProjectId !== null) {
    return persistedCoreProjectId;
  }

  const projectName = `${CORE_PROJECT_PREFIX}${workspaceId}`;
  const projects = await CoreClient.listProjects();
  const matches = projects.filter((project) => project.name === projectName);
  if (matches.length === 0) return null;

  return matches.reduce((a, b) => (a.id < b.id ? a : b)).id;
}

function normalizeMemoryType(rawType: unknown) {
  const type = typeof rawType === "string" ? rawType.trim() : "";
  return ALLOWED_MEMORY_TYPES.has(type) ? type : "note";
}

function selectMemoryItemFields() {
  return {
    id: true,
    title: true,
    content: true,
    type: true,
    source: true,
    createdAt: true,
    updatedAt: true,
  } as const;
}

// ── GET /api/workspace/[workspaceId]/memory ──────────────────────────────────

export async function GET(req: NextRequest, { params }: RouteParams) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { workspaceId } = await params;

  const resolved = await resolveUserAndWorkspace(userId, workspaceId);
  if (!resolved) {
    return NextResponse.json({ error: "Workspace no encontrado" }, { status: 404 });
  }

  const requestedStatus = req.nextUrl.searchParams.get("status");
  const status = requestedStatus === "archived" ? "archived" : "active";
  const requestedId = req.nextUrl.searchParams.get("id")?.trim();

  if (requestedId) {
    const { user } = resolved;
    const item = await db.memoryItem.findFirst({
      where: { id: requestedId, workspaceId, orgId: user.orgId },
      select: {
        ...selectMemoryItemFields(),
        status: true,
      },
    });

    if (!item) {
      return NextResponse.json({ error: "Memoria no encontrada" }, { status: 404 });
    }

    return NextResponse.json({ item });
  }

  const items = await db.memoryItem.findMany({
    where: { workspaceId, status },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: selectMemoryItemFields(),
  });

  return NextResponse.json({ items });
}

// ── POST /api/workspace/[workspaceId]/memory ─────────────────────────────────

export async function POST(req: NextRequest, { params }: RouteParams) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { workspaceId } = await params;

  const resolved = await resolveUserAndWorkspace(userId, workspaceId);
  if (!resolved) {
    return NextResponse.json({ error: "Workspace no encontrado" }, { status: 404 });
  }
  const { user, workspace } = resolved;

  let body: { title?: string; content?: string; type?: string };
  try {
    body = (await req.json()) as { title?: string; content?: string; type?: string };
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const title = body.title?.trim() ?? "";
  const content = body.content?.trim() ?? "";
  const type = normalizeMemoryType(body.type);

  if (!title) {
    return NextResponse.json({ error: "El título es obligatorio" }, { status: 400 });
  }
  if (!content) {
    return NextResponse.json({ error: "El contenido es obligatorio" }, { status: 400 });
  }
  if (title.length > 200) {
    return NextResponse.json({ error: "El título no puede superar los 200 caracteres" }, { status: 400 });
  }

  const item = await db.memoryItem.create({
    data: {
      workspaceId,
      orgId: user.orgId,
      userId: user.id,
      title,
      content,
      type,
      status: "active",
      source: "manual",
    },
    select: selectMemoryItemFields(),
  });

  try {
    const coreProjectId = await resolveCoreProjectId(workspaceId, workspace.coreProjectId);
    if (coreProjectId !== null) {
      await CoreClient.createNote(coreProjectId, title, content);
    }
  } catch (err) {
    console.error("[CLOUD6] Core sync failed", err);
  }

  return NextResponse.json({ item }, { status: 201 });
}

// ── PATCH /api/workspace/[workspaceId]/memory ────────────────────────────────

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { workspaceId } = await params;

  const resolved = await resolveUserAndWorkspace(userId, workspaceId);
  if (!resolved) {
    return NextResponse.json({ error: "Workspace no encontrado" }, { status: 404 });
  }
  const { user } = resolved;

  let body: {
    id?: string;
    title?: string;
    content?: string;
    type?: string;
    action?: "archive" | "restore";
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const id = body.id?.trim() ?? "";
  if (!id) {
    return NextResponse.json({ error: "El id de memoria es obligatorio" }, { status: 400 });
  }

  const existing = await db.memoryItem.findFirst({
    where: { id, workspaceId, orgId: user.orgId },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Memoria no encontrada" }, { status: 404 });
  }

  if (body.action === "archive") {
    const item = await db.memoryItem.update({
      where: { id },
      data: { status: "archived" },
      select: selectMemoryItemFields(),
    });
    return NextResponse.json({ item });
  }

  if (body.action === "restore") {
    const item = await db.memoryItem.update({
      where: { id },
      data: { status: "active" },
      select: selectMemoryItemFields(),
    });
    return NextResponse.json({ item });
  }

  const title = body.title?.trim() ?? "";
  const content = body.content?.trim() ?? "";
  const type = normalizeMemoryType(body.type);

  if (!title) {
    return NextResponse.json({ error: "El título es obligatorio" }, { status: 400 });
  }
  if (!content) {
    return NextResponse.json({ error: "El contenido es obligatorio" }, { status: 400 });
  }
  if (title.length > 200) {
    return NextResponse.json({ error: "El título no puede superar los 200 caracteres" }, { status: 400 });
  }

  const item = await db.memoryItem.update({
    where: { id },
    data: { title, content, type },
    select: selectMemoryItemFields(),
  });

  return NextResponse.json({ item });
}
