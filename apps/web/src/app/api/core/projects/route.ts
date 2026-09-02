import { NextRequest, NextResponse } from "next/server";
import { CoreClient } from "@/lib/core-client";

export const dynamic = "force-dynamic";

function blockProductionDirectCoreAccess() {
  if (process.env.NODE_ENV !== "production") return null;
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

export async function GET() {
  const blocked = blockProductionDirectCoreAccess();
  if (blocked) return blocked;

  try {
    const projects = await CoreClient.listProjects();
    return NextResponse.json({ projects });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  const blocked = blockProductionDirectCoreAccess();
  if (blocked) return blocked;

  try {
    const body = await req.json();
    const project = await CoreClient.createProject(body.name, body.objective);
    return NextResponse.json({ project }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 503 });
  }
}
