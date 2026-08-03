import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import { LeadFormClient } from './_components/LeadFormClient'
import Image from 'next/image'

interface Props {
  params: Promise<{ workspaceId: string }>
}

export default async function PublicLeadFormPage({ params }: Props) {
  const { workspaceId } = await params

  const workspace = await db.workspace.findUnique({ where: { id: workspaceId } })
  if (!workspace) notFound()

  const brandColor = workspace.brandColor ?? '#3B82F6'

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {/* Header workspace */}
        <div className="text-center mb-8 space-y-3">
          <div className="flex justify-center mb-4">
            {workspace.logoUrl ? (
              <div className="w-20 h-20 rounded-2xl border bg-white flex items-center justify-center overflow-hidden shadow-sm">
                <Image
                  src={workspace.logoUrl}
                  alt={workspace.name}
                  width={80}
                  height={80}
                  className="object-contain w-full h-full p-2"
                />
              </div>
            ) : (
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-sm text-white text-3xl font-bold"
                style={{ backgroundColor: brandColor }}
              >
                {workspace.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <h1 className="text-2xl font-semibold">{workspace.name}</h1>
          <p className="text-sm text-muted-foreground">
            Rellena el formulario y nos pondremos en contacto contigo.
          </p>
        </div>

        <LeadFormClient workspaceId={workspaceId} brandColor={brandColor} />

        <p className="text-center text-xs text-muted-foreground mt-6">
          Powered by <span className="font-semibold tracking-wide">MITIKUS</span>
        </p>
      </div>
    </div>
  )
}
