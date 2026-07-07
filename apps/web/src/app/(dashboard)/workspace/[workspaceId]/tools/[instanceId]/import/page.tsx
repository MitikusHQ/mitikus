import { requireUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import { validateToolSchema } from '@protools/schema'
import Link from 'next/link'
import { ImportClient } from './_components/ImportClient'

interface Props {
  params: Promise<{ workspaceId: string; instanceId: string }>
}

export default async function ImportPage({ params }: Props) {
  const [{ workspaceId, instanceId }, user] = await Promise.all([params, requireUser()])

  const instance = await db.toolInstance.findFirst({
    where: { id: instanceId, workspaceId, status: 'ACTIVE', workspace: { orgId: user.orgId } },
    include: { toolDefinition: true },
  })
  if (!instance) notFound()

  const schemaResult = validateToolSchema(instance.toolDefinition.schema)
  if (!schemaResult.success) notFound()

  const { dataSchema } = schemaResult.data
  const hasFormCap = schemaResult.data.capabilities.some((c) => c.type === 'FORM')
  if (!hasFormCap) notFound()

  const fields = Object.entries(dataSchema.fields).map(([id, field]) => ({
    id,
    label:    field.label,
    type:     field.type,
    required: field.required ?? false,
  }))

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <Link
            href={`/workspace/${workspaceId}/tools/${instanceId}`}
            className="hover:text-foreground transition-colors"
          >
            {instance.name}
          </Link>
          <span>›</span>
          <span>Importar CSV</span>
        </div>
        <h1 className="text-xl font-semibold">Importar registros desde CSV</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Sube un fichero CSV. Las cabeceras deben coincidir con los nombres de campo de la herramienta.
          Descarga la plantilla si no tienes el formato.
        </p>
      </div>

      <ImportClient
        instanceId={instanceId}
        workspaceId={workspaceId}
        fields={fields}
      />
    </div>
  )
}
