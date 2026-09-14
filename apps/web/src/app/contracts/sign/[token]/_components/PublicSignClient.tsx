'use client'

import { useState, useEffect, useRef } from 'react'
import { SignatureCanvas } from '@/components/signature-canvas'
import { signClientContract } from '@/app/actions/contracts'

interface Props {
  shareToken:    string
  contractTitle: string
  pdfDataArray:  number[]
  workspaceName: string | null
}

export function PublicSignClient({ shareToken, contractTitle, pdfDataArray, workspaceName }: Props) {
  const [isSigning, setIsSigning] = useState(false)
  const [signed,    setSigned]    = useState(false)
  const [error,     setError]     = useState<string | null>(null)
  const [pdfUrl,    setPdfUrl]    = useState<string | null>(null)
  const urlRef = useRef<string | null>(null)

  useEffect(() => {
    const bytes = new Uint8Array(pdfDataArray)
    const blob  = new Blob([bytes], { type: 'application/pdf' })
    const url   = URL.createObjectURL(blob)
    urlRef.current = url
    setPdfUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [pdfDataArray])

  async function handleSign(signatureDataUrl: string) {
    setIsSigning(true)
    setError(null)
    try {
      await signClientContract(shareToken, signatureDataUrl, true, '')
      setSigned(true)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido'
      setError(`Error al guardar la firma: ${msg}`)
    } finally {
      setIsSigning(false)
    }
  }

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
          {/* PDF viewer — iframe + blob URL, sin pdfjs */}
          <div className="flex-1 min-w-0 min-h-[500px] bg-muted/30 rounded-lg overflow-hidden">
            {pdfUrl ? (
              <iframe
                src={pdfUrl}
                className="w-full h-full min-h-[500px] border-0"
                title={contractTitle}
              />
            ) : (
              <div className="flex items-center justify-center h-64 text-sm text-muted-foreground">
                Cargando PDF…
              </div>
            )}
          </div>

          {/* Signature panel */}
          <div className="lg:w-72 shrink-0">
            <div className="sticky top-8 border rounded-lg p-4 space-y-4">
              <h2 className="text-sm font-semibold">Tu firma</h2>
              {error && (
                <p className="text-xs text-destructive bg-destructive/10 p-2 rounded">
                  {error}
                </p>
              )}
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
