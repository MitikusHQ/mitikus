import { requireUser } from "@/lib/auth";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CoreSmokePanel } from "./_components/CoreSmokePanel";

export const metadata: Metadata = { title: "Core Smoke — MITIKUS Admin" };

const SUPERADMIN_EMAILS = (process.env.SUPERADMIN_EMAILS ?? "borjaprietomark82@gmail.com")
  .split(",")
  .map((e) => e.trim());

export default async function CoreSmokePage() {
  const user = await requireUser();
  if (!SUPERADMIN_EMAILS.includes(user.email)) notFound();

  return (
    <div className="max-w-2xl mx-auto px-6 py-10 space-y-8">
      <div>
        <h1 className="text-xl font-semibold">MITIKUS AI Core — Smoke Test</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Integración INTG3 · Pantalla interna de validación · No es producto final
        </p>
      </div>
      <CoreSmokePanel />
    </div>
  );
}
