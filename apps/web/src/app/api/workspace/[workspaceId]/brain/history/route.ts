import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

// CLOUD4 — Brain Query History
// Returns the last 20 BrainQuery records for a workspace, including sources.
// Read-only from MITIKUS DB. No Core calls.
// CLOUD12 — includes sourceId so UI can open cloud MemoryItem sources.

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ workspaceId: string }>;
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { workspaceId } = await params;

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    select: { id: true, orgId: true },
  });
  if (!user) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  const workspace = await db.workspace.findFirst({
    where: { id: workspaceId, orgId: user.orgId },
    select: { id: true },
  });
  if (!workspace) {
    return NextResponse.json({ error: "Workspace no encontrado" }, { status: 404 });
  }

  const queries = await db.brainQuery.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      query: true,
      normalizedQuery: true,
      mode: true,
      answer: true,
      evidenceCount: true,
      warnings: true,
      sources: true,
      createdAt: true,
      sourcesList: {
        select: {
          id: true,
          origin: true,
          sourceType: true,
          sourceId: true,
          title: true,
          excerpt: true,
          score: true,
        },
      },
    },
  });

  return NextResponse.json({ queries });
}
