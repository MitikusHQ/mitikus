import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { CoreClient } from "@/lib/core-client";

// CLOUD3 — Persist Workspace Core Link
// Resolves workspaceId → Core projectId with the following priority:
//   1. Workspace.coreProjectId (persisted in MITIKUS DB) — fast path, no Core call
//   2. Name-based lookup in Core ("MITIKUS:<workspaceId>") — bootstrap/migration
//   3. Create new Core project + persist coreProjectId — first mount
//
// The name-based fallback (step 2) remains for workspaces that existed before CLOUD3
// so they keep their Core project without losing memory. Once the id is written to DB,
// subsequent calls take the fast path and never depend on the name convention again.

const PREFIX = "MITIKUS:";

interface RouteParams {
  params: Promise<{ workspaceId: string }>;
}

export async function GET(_req: Request, { params }: RouteParams) {
  // ── auth ──────────────────────────────────────────────────────────────────
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { workspaceId } = await params;
  if (!workspaceId || typeof workspaceId !== "string") {
    return NextResponse.json({ error: "workspaceId inválido" }, { status: 400 });
  }

  // ── ownership check ───────────────────────────────────────────────────────
  const user = await db.user.findUnique({
    where: { clerkId: userId },
    select: { id: true, orgId: true },
  });
  if (!user) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  const workspace = await db.workspace.findFirst({
    where: { id: workspaceId, orgId: user.orgId },
    select: { id: true, coreProjectId: true },
  });
  if (!workspace) {
    return NextResponse.json({ error: "Workspace no encontrado" }, { status: 404 });
  }

  // ── fast path: already linked ─────────────────────────────────────────────
  if (workspace.coreProjectId !== null) {
    return NextResponse.json({ projectId: workspace.coreProjectId, created: false, linked: true });
  }

  // ── Core required from here ───────────────────────────────────────────────
  const projectName = `${PREFIX}${workspaceId}`;

  let projects;
  try {
    projects = await CoreClient.listProjects();
  } catch {
    return NextResponse.json(
      { error: "MITIKUS AI Core no disponible. Arranca el Core local." },
      { status: 503 }
    );
  }

  // Bootstrap: check if a project already exists by name (pre-CLOUD3 workspaces)
  const matches = projects.filter((p) => p.name === projectName);

  let coreProjectId: number;
  let created = false;

  if (matches.length > 0) {
    // Pick oldest (lowest id) to be deterministic
    const canonical = matches.reduce((a, b) => (a.id < b.id ? a : b));
    coreProjectId = canonical.id;
  } else {
    // First mount — create Core project
    try {
      const newProject = await CoreClient.createProject(
        projectName,
        "Memoria privada del workspace MITIKUS"
      );
      coreProjectId = newProject.id;
      created = true;
    } catch {
      return NextResponse.json(
        { error: "No se pudo crear el proyecto en MITIKUS AI Core." },
        { status: 500 }
      );
    }
  }

  // Persist the link in MITIKUS DB — from now on the fast path applies
  try {
    await db.workspace.update({
      where: { id: workspaceId },
      data: { coreProjectId },
    });
  } catch {
    // Non-fatal: the id is returned even if persisting fails.
    // Next request will go through Core again — acceptable degraded mode.
    console.error("[CLOUD3] Failed to persist coreProjectId for workspace", workspaceId);
  }

  return NextResponse.json({ projectId: coreProjectId, created, linked: false },
    created ? { status: 201 } : undefined
  );
}
