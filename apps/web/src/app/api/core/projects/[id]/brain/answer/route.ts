import { NextRequest, NextResponse } from "next/server";
import { CoreClient } from "@/lib/core-client";

export const dynamic = "force-dynamic";

function blockProductionDirectCoreAccess() {
  if (process.env.NODE_ENV !== "production") return null;
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const blocked = blockProductionDirectCoreAccess();
  if (blocked) return blocked;

  try {
    const { id } = await params;
    const query = req.nextUrl.searchParams.get("query") ?? "";
    if (!query.trim()) return NextResponse.json({ error: "query requerido" }, { status: 400 });
    const answer = await CoreClient.brainAnswer(Number(id), query);
    return NextResponse.json(answer);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 503 });
  }
}
