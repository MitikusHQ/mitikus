'use client'

import { useState, useCallback } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import { SignatureCanvas } from '@/components/signature-canvas'
import { signClientContract } from '@/app/actions/contracts'

pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js'

interface Props {
  shareToken:    string
  contractTitle: string
  pdfDataArray:  number[]
  workspaceName: string | null
}

export function PublicSignClient({ shareToken, contractTitle, pdfDataArray, workspaceName }: Props) {
  const [numPages,  setNumPages]  = useState(0)
  const [isSigning, setIsSigning] = useState(false)
  const [signed,    setSigned]    = useState(false)
  const [error,     setError]     = useState<string | null>(null)

  const pdfFile = { data: new Uint8Array(pdfDataArray) }

  async function handleSign(signatureDataUrl: string) {
    setIsSigning(true)
    setError(null)
    try {
      await signClientContract(shareToken, signatureDataUrl, true, '')
      setSigned(true)
    } catch {
      setError('Error al guardar la firma. Inténtalo de nuevo.')
    } finally {
      setIsSigning(false)
    }
  }

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
  }, [])

  if (signed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-sm mx-auto px-4">
          <div className="text-4xl mb-4">✅</div>
          <h1 className="text-xl font-semibold mb-2">Contrato firmado</h1>
          <p className="text-sm text-muted-foreground">
            Recibirás una copia por email con el documento firmado.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b px-6 py-4 flex items-center gap-3">
        <span className="font-bold text-lg">MITIKUS</span>
        {workspaceName && (
          <span className="text-sm text-muted-foreground">
            · {workspaceName} te invita a firmar
          </span>
        )}
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-xl font-semibold mb-6">{contractTitle}</h1>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* PDF viewer */}
          <div className="flex-1 min-w-0">
            <Document
              file={pdfFile}
              onLoadSuccess={onDocumentLoadSuccess}
              className="flex flex-col items-center gap-4"
            >
              {Array.from({ length: numPages }, (_, i) => (
                <Page
                  key={i + 1}
                  pageNumber={i + 1}
                  width={Math.min(600, typeof window !== 'undefined' ? window.innerWidth - 80 : 600)}
                  className="shadow-md max-w-full"
                />
              ))}
            </Document>
          </div>

          {/* Signature panel */}
          <div className="lg:w-72 shrink-0">
            <div className="sticky top-8 border rounded-lg p-4 space-y-4">
              <h2 className="text-sm font-semibold">Tu firma</h2>
              {error && <p className="text-xs text-destructive">{error}</p>}
              {isSigning ? (
                <p className="text-sm text-muted-foreground">Guardando firma...</p>
              ) : (
                <SignatureCanvas
                  onSave={handleSign}
                  label="He leído y acepto este documento"
                />
              )}
              <p className="text-xs text-muted-foreground">
                Al firmar quedará registrado tu IP y timestamp.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
