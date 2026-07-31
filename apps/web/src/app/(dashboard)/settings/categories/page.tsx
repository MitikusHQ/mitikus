import { redirect } from 'next/navigation'
import Link from 'next/link'
import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { CategoryToggles } from './_components/CategoryToggles'
import type { ToolCategory } from '@prisma/client'

const CATEGORY_LABELS: Record<ToolCategory, string> = {
  AUDIT: 'Auditoría',
  EVALUATION: 'Evaluación',
  CHECKLIST: 'Checklist',
  CRM: 'CRM',
  REPORT: 'Reportes',
  HR: 'Recursos Humanos',
  OPERATIONS: 'Operaciones',
  FINANCE: 'Finanzas',
  CUSTOM: 'Personalizada',
}

export default async function SettingsCategoriesPage() {
  const user = await requireUser()
  if (user.role !== 'OWNER') redirect('/dashboard')

  const org = await db.organization.findUnique({
    where: { id: user.orgId },
    select: { enabledCategories: true },
  })

  const enabled = org?.enabledCategories ?? []

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
      <Link href="/settings" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
        Ajustes
      </Link>
      <div>
        <h1 className="text-xl font-semibold">Categorías activas</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Controla qué tipos de herramientas pueden crearse en tu organización. Todas activas por
          defecto.
        </p>
      </div>
      <CategoryToggles enabledCategories={enabled} categoryLabels={CATEGORY_LABELS} />
    </div>
  )
}
