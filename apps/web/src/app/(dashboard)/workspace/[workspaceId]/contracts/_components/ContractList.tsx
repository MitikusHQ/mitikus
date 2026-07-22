'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { ContractData } from '@/app/actions/contracts'
import { ContractUploadZone } from './ContractUploadZone'

interface Props {
  workspaceId: string
  initial:     ContractData[]
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

export function ContractList({ workspaceId, initial }: Props) {
  const [contracts] = useState(initial)

  return (
    <div className="space-y-6">
      <ContractUploadZone workspaceId={workspaceId} />

      {contracts.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">Aún no hay contratos</p>
      ) : (
        <div className="divide-y divide-border rounded-lg border">
          {contracts.map((c) => (
            <Link
              key={c.id}
              href={`/workspace/${workspaceId}/contracts/${c.id}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors group"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                  {c.title}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {new Date(c.createdAt).toLocaleDateString('es-ES')}
                  {c.clientName ? ` · ${c.clientName}` : ''}
                  {c.clientEmail ? ` · ${c.clientEmail}` : ''}
                </p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ml-3 ${STATUS_CLASS[c.status] ?? ''}`}>
                {STATUS_LABEL[c.status] ?? c.status}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
