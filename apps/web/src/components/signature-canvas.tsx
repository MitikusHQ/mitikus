'use client'

import { useRef, useState } from 'react'
import SignatureCanvasLib from 'react-signature-canvas'

interface Props {
  onSave:             (dataUrl: string) => void
  disabled?:          boolean
  existingSignature?: string | null
  label?:             string
}

export function SignatureCanvas({ onSave, disabled, existingSignature, label }: Props) {
  const canvasRef = useRef<SignatureCanvasLib>(null)
  const [isEmpty, setIsEmpty]   = useState(true)
  const [accepted, setAccepted] = useState(false)

  function handleClear() {
    canvasRef.current?.clear()
    setIsEmpty(true)
  }

  function handleSave() {
    if (!canvasRef.current || canvasRef.current.isEmpty()) return
    const dataUrl = canvasRef.current.getTrimmedCanvas().toDataURL('image/png')
    onSave(dataUrl)
  }

  if (existingSignature) {
    return (
      <div className="space-y-2">
        {label && <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>}
        <img
          src={existingSignature}
          alt="Firma guardada"
          className="border border-border rounded-md max-h-20 bg-white"
        />
        <p className="text-xs text-green-600 font-medium">✓ Firmado</p>
      </div>
    )
  }

  if (disabled) {
    return (
      <div className="space-y-2">
        {label && <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>}
        <div className="border border-dashed border-border rounded-md h-20 flex items-center justify-center">
          <p className="text-xs text-muted-foreground">Pendiente</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {label && <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>}
      <div className="border border-border rounded-md overflow-hidden bg-white">
        <SignatureCanvasLib
          ref={canvasRef}
          penColor="#1a1a1a"
          canvasProps={{ width: 240, height: 80, className: 'w-full' }}
          onBegin={() => setIsEmpty(false)}
        />
      </div>
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-1.5 text-xs cursor-pointer select-none">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            className="rounded"
          />
          Acepto los términos
        </label>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleClear}
          className="text-xs px-2 py-1 rounded border border-border hover:bg-muted transition-colors"
        >
          Borrar
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={isEmpty || !accepted}
          className="text-xs px-3 py-1 rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-40"
        >
          Guardar firma
        </button>
      </div>
    </div>
  )
}
