import { NextRequest, NextResponse } from "next/server";
import { CoreClient } from "@/lib/core-client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
