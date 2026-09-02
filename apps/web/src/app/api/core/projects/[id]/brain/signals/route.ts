import { NextRequest, NextResponse } from "next/server";
import { CoreClient } from "@/lib/core-client";

export const dynamic = "force-dynamic";

function blockProductionDirectCoreAccess() {
  if (process.env.NODE_ENV !== "production") return null;
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const blocked = blockProductionDirectCoreAccess();
  if (blocked) return blocked;

  try {
    const { id } = await params;
    const signals = await CoreClient.brainSignals(Number(id));
    return NextResponse.json(signals);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 503 });
  }
}
