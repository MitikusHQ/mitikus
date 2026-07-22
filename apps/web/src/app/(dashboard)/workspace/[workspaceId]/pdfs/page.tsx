import { getPdfs } from '@/app/actions/pdfs'
import { requireUser } from '@/lib/auth'
import { PdfList } from './_components/PdfList'

interface Props {
  params: Promise<{ workspaceId: string }>
}

export default async function PdfsPage({ params }: Props) {
  const [{ workspaceId }] = await Promise.all([params, requireUser()])
  const pdfs = await getPdfs(workspaceId)

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold">PDFs</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Sube archivos PDF para visualizarlos y convertirlos a documentos editables
        </p>
      </div>
      <PdfList workspaceId={workspaceId} initial={pdfs} />
    </div>
  )
}
