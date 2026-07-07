import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import { GenerateToolForm } from './_components/GenerateToolForm'
import { getLocale } from '@/i18n/locale'

interface Props {
  params: Promise<{ workspaceId: string }>
}

export default async function GenerateToolPage({ params }: Props) {
  const [{ workspaceId }, user, locale] = await Promise.all([params, requireUser(), getLocale()])

  const workspace = await db.workspace.findFirst({
    where: { id: workspaceId, orgId: user.orgId },
  })
  if (!workspace) notFound()

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-xl font-semibold">Nueva herramienta</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Describe el proceso. Lo convertimos en herramienta.
        </p>
      </div>
      <GenerateToolForm workspaceId={workspaceId} locale={locale} />
    </div>
  )
}
