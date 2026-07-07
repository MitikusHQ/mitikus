import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import { validateToolSchema } from '@protools/schema'
import type { FormConfig } from '@protools/schema'
import { updateRecord } from '@/app/actions/record'
import { FormRenderer } from '../../../_components/FormRenderer'

interface Props {
  params: Promise<{ workspaceId: string; instanceId: string; recordId: string }>
}

export default async function EditRecordPage({ params }: Props) {
  const [{ workspaceId, instanceId, recordId }, user] = await Promise.all([params, requireUser()])

  const [workspace, instance, record] = await Promise.all([
    db.workspace.findFirst({ where: { id: workspaceId, orgId: user.orgId } }),
    db.toolInstance.findFirst({
      where: { id: instanceId, workspaceId, status: 'ACTIVE' },
      include: { toolDefinition: true },
    }),
    db.toolRecord.findFirst({
      where: { id: recordId, toolInstanceId: instanceId, isDeleted: false },
    }),
  ])

  if (!workspace || !instance || !record) notFound()

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
    submitLabel: 'Guardar cambios',
  }

  const defaultValues = (record.data ?? {}) as Record<string, unknown>

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <h1 className="text-xl font-semibold mb-8">Editar registro</h1>
      <FormRenderer
        action={updateRecord}
        instanceId={instanceId}
        dataSchema={schema.dataSchema}
        formConfig={formConfig}
        defaultValues={defaultValues}
        recordId={recordId}
      />
    </div>
  )
}
