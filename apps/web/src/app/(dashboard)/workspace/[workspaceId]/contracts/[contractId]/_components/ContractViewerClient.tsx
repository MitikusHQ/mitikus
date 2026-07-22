'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import { Buffer } from 'buffer'
import { SignatureCanvas } from '@/components/signature-canvas'
import { SendToClientModal } from './SendToClientModal'
import { signInternalContract, sendContractToClient } from '@/app/actions/contracts'
import type { ContractDetail } from '@/app/actions/contracts'

pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js'

interface Props {
  contract:    ContractDetail
  workspaceId: string
}

const STATUS_LABEL: Record<string, string> = {
  DRAFT:  'BORRADOR',
  SENT:   'ENVIADO',
  SIGNED: 'FIRMADO',
}

const STATUS_CLASS: Record<string, string> = {
  DRAFT:  'bg-secondary text-secondary-foreground',
  SENT:   'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  SIGNED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
}

export function ContractViewerClient({ contract, workspaceId }: Props) {
  const router = useRouter()
  const [numPages,       setNumPages]       = useState<number>(0)
  const [isSavingSig,    setIsSavingSig]    = useState(false)
  const [isSending,      setIsSending]      = useState(false)
  const [showSendModal,  setShowSendModal]  = useState(false)
  const [sigError,       setSigError]       = useState<string | null>(null)
  const [sendError,      setSendError]      = useState<string | null>(null)

  const pdfBytes = new Uint8Array(contract.pdfDataArray)
  const pdfFile  = { data: pdfBytes }

  const internalSigDataUrl = contract.internalSignatureArray
    ? `data:image/png;base64,${Buffer.from(contract.internalSignatureArray).toString('base64')}`
    : null

  const clientSigDataUrl = contract.clientSignatureArray
    ? `data:image/png;base64,${Buffer.from(contract.clientSignatureArray).toString('base64')}`
    : null

  const canSend  = contract.internalAccepted && contract.status === 'DRAFT'
  const isSigned = contract.status === 'SIGNED'

  async function handleSaveSignature(dataUrl: string) {
    setIsSavingSig(true)
    setSigError(null)
    try {
      await signInternalContract(contract.id, workspaceId, dataUrl, true)
      router.refresh()
    } catch {
      setSigError('Error al guardar la firma. Inténtalo de nuevo.')
    } finally {
      setIsSavingSig(false)
    }
  }

  async function handleSend(clientName: string, clientEmail: string) {
    setIsSending(true)
    setSendError(null)
    try {
      await sendContractToClient(contract.id, workspaceId, clientName, clientEmail)
      setShowSendModal(false)
      router.refresh()
    } catch {
      setSendError('Error al enviar al cliente. Inténtalo de nuevo.')
    } finally {
      setIsSending(false)
    }
  }

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
  }, [])

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <h1 className="text-base font-semibold truncate">{contract.title}</h1>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${STATUS_CLASS[contract.status] ?? ''}`}>
            {STATUS_LABEL[contract.status] ?? contract.status}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-4">
          {isSigned && (
            <a
              href={`/api/contracts/${contract.id}/sign-pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md border border-input px-3 py-1.5 text-sm hover:bg-muted"
            >
              ↓ PDF firmado
            </a>
          )}
          <button
            onClick={() => setShowSendModal(true)}
            disabled={!canSend}
            className="rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-sm font-medium hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Enviar al cliente →
          </button>
        </div>
      </div>
      {sendError && (
        <p className="px-6 py-2 text-xs text-destructive bg-destructive/10">{sendError}</p>
      )}

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* PDF viewer */}
        <div className="flex-1 overflow-auto p-4 bg-muted/30">
          <Document
            file={pdfFile}
            onLoadSuccess={onDocumentLoadSuccess}
            className="flex flex-col items-center gap-4"
          >
            {Array.from({ length: numPages }, (_, i) => (
              <Page
                key={i + 1}
                pageNumber={i + 1}
                width={Math.min(700, typeof window !== 'undefined' ? window.innerWidth - 340 : 700)}
                className="shadow-md"
              />
            ))}
          </Document>
        </div>

        {/* Signature panel */}
        <div className="w-64 shrink-0 border-l overflow-y-auto p-4 space-y-4">
          {/* Internal signature */}
          <div className="rounded-lg border p-3 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tu firma</p>
            {sigError && <p className="text-xs text-destructive">{sigError}</p>}
            {isSavingSig ? (
              <p className="text-xs text-muted-foreground">Guardando firma...</p>
            ) : (
              <SignatureCanvas
                onSave={handleSaveSignature}
                existingSignature={internalSigDataUrl}
                label="Acepto los términos"
                disabled={contract.status !== 'DRAFT'}
              />
            )}
            {contract.internalSignedAt && (
              <p className="text-xs text-muted-foreground">
                ✓ Firmado el {new Date(contract.internalSignedAt).toLocaleDateString('es-ES')}
              </p>
            )}
          </div>

          {/* Client signature */}
          <div className={`rounded-lg border p-3 space-y-2 ${contract.status === 'DRAFT' ? 'opacity-50' : ''}`}>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Firma cliente</p>
            {contract.status === 'DRAFT' && (
              <p className="text-xs text-muted-foreground">Pendiente de envío</p>
            )}
            {contract.status === 'SENT' && (
              <p className="text-xs text-muted-foreground">
                Enviado a {contract.clientEmail ?? '—'}, pendiente de firma
              </p>
            )}
            {contract.status === 'SIGNED' && clientSigDataUrl && (
              <>
                <SignatureCanvas
                  onSave={() => {}}
                  existingSignature={clientSigDataUrl}
                  disabled
                />
                {contract.clientSignedAt && (
                  <p className="text-xs text-muted-foreground">
                    ✓ Firmado el {new Date(contract.clientSignedAt).toLocaleDateString('es-ES')}
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <SendToClientModal
        isOpen={showSendModal}
        isSending={isSending}
        onClose={() => setShowSendModal(false)}
        onSend={handleSend}
      />
    </div>
  )
}
