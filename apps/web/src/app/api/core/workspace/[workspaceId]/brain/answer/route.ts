import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { CoreClient } from "@/lib/core-client";
import { checkPlanLimit } from "@/lib/billing/check-plan-limit";

// CLOUD2B — Core Memory Query Audit Integration
//
// Workspace-aware Brain answer proxy. Replaces the raw
// /api/core/projects/[id]/brain/answer route for client use.
//
// Responsibilities:
//   1. Auth + workspace ownership (same pattern as CLOUD3)
//   2. Resolve coreProjectId from MITIKUS DB (CLOUD3 fast path)
//   3. Call CoreClient.brainAnswer()
//   4. Persist BrainQuery + BrainSource[] with origin "local-memory" (non-fatal)
//   5. Return BrainAnswer unchanged — contract never modified

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ workspaceId: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  // ── auth ──────────────────────────────────────────────────────────────────
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { workspaceId } = await params;
  const query = req.nextUrl.searchParams.get("query") ?? "";
  if (!query.trim()) {
    return NextResponse.json({ error: "query requerido" }, { status: 400 });
  }

  // ── user + workspace ownership ────────────────────────────────────────────
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

  // ── plan limit — same counter as Brain cloud (brainQueriesPerMonth) ─────────
  // CLOUD3B: Core Brain queries count against the plan just like cloud queries.
  // If the limit is exceeded, the Core is never called and no BrainQuery is created.
  const limitCheck = await checkPlanLimit(user.orgId, "brainQueriesPerMonth");
  if (!limitCheck.allowed) {
    return NextResponse.json({ error: limitCheck.message }, { status: 429 });
  }

  // ── resolve Core project id ───────────────────────────────────────────────
  // Fast path: coreProjectId already persisted by CLOUD3
  // Fallback: look up by name convention (pre-CLOUD3 workspaces on first query)
  let coreProjectId = workspace.coreProjectId;

  if (coreProjectId === null) {
    let projects;
    try {
      projects = await CoreClient.listProjects();
    } catch {
      return NextResponse.json(
        { error: "MITIKUS AI Core no disponible. Arranca el Core local." },
        { status: 503 }
      );
    }
    const name = `MITIKUS:${workspaceId}`;
    const matches = projects.filter((p) => p.name === name);
    if (matches.length === 0) {
      return NextResponse.json(
        { error: "No hay proyecto Core para este workspace. Abre la pestaña Memoria local primero." },
        { status: 404 }
      );
    }
    coreProjectId = matches.reduce((a, b) => (a.id < b.id ? a : b)).id;
  }

  // ── call Core ─────────────────────────────────────────────────────────────
  let answer;
  try {
    answer = await CoreClient.brainAnswer(coreProjectId, query.trim());
  } catch {
    return NextResponse.json(
      { error: "MITIKUS AI Core no disponible. Arranca el Core local." },
      { status: 503 }
    );
  }

  // ── persist audit log (non-fatal) ─────────────────────────────────────────
  // If the DB write fails, the answer still reaches the user.
  try {
    await db.$transaction(async (tx) => {
      const record = await tx.brainQuery.create({
        data: {
          workspaceId,
          orgId: user.orgId,
          userId: user.id,
          query: answer.query,
          normalizedQuery: answer.normalizedQuery,
          mode: answer.mode,
          answer: answer.answer,
          evidenceCount: answer.evidenceCount,
          warnings: answer.warnings ?? [],
          sources: answer.sources.length,
        },
      });

      if (answer.sources.length > 0) {
        await tx.brainSource.createMany({
          data: answer.sources.map((s) => ({
            brainQueryId: record.id,
            sourceType: s.type,
            sourceId: String(s.id),
            title: s.title,
            excerpt: s.excerpt,
            score: s.score ?? null,
            origin: "local-memory",
          })),
        });
      }
    });
  } catch (err) {
    console.error("[CLOUD2B] Failed to persist BrainQuery for workspace", workspaceId, err);
  }

  // Return BrainAnswer verbatim — contract never modified
  return NextResponse.json(answer);
}
