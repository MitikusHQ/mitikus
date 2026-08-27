import { NextResponse } from "next/server";
import { CoreClient } from "@/lib/core-client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const health = await CoreClient.health();
    return NextResponse.json(health);
  } catch {
    return NextResponse.json({ ok: false, error: "Core no disponible" }, { status: 503 });
  }
}
