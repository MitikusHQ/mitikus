import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { validateToolSchema } from '@protools/schema'
import type { FormConfig } from '@protools/schema'
import { createRecord } from '@/app/actions/record'
import { FormRenderer } from '../../_components/FormRenderer'

interface Props {
  params: Promise<{ workspaceId: string; instanceId: string }>
}

export default async function NewRecordPage({ params }: Props) {
  const [{ workspaceId, instanceId }, user] = await Promise.all([params, requireUser()])

  const [workspace, instance] = await Promise.all([
    db.workspace.findFirst({ where: { id: workspaceId, orgId: user.orgId } }),
    db.toolInstance.findFirst({
      where: { id: instanceId, workspaceId, status: 'ACTIVE' },
      include: { toolDefinition: true },
    }),
  ])

  if (!workspace || !instance) notFound()

  const schemaResult = validateToolSchema(instance.toolDefinition.schema)
  if (!schemaResult.success) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-destructive text-sm">Schema de herramienta inválido.</p>
      </div>
    )
  }

  const schema = schemaResult.data
  const formCap = schema.capabilities.find((c) => c.type === 'FORM')
  const formConfig: FormConfig = (formCap?.config as FormConfig | undefined) ?? {
    layout: 'single-column',
    submitLabel: 'Guardar',
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <Link href={`/workspace/${workspaceId}/tools/${instanceId}`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
        {instance.name}
      </Link>
      <h1 className="text-xl font-semibold mb-8">Nueva entrada</h1>
      <FormRenderer
        action={createRecord}
        instanceId={instanceId}
        dataSchema={schema.dataSchema}
        formConfig={formConfig}
      />
    </div>
  )
}
