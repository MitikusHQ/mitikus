import { NextRequest, NextResponse } from "next/server";
import { CoreClient } from "@/lib/core-client";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const signals = await CoreClient.brainSignals(Number(id));
    return NextResponse.json(signals);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 503 });
  }
}
