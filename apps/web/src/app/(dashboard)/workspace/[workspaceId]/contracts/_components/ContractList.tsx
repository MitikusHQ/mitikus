'use client'

import Link from 'next/link'
import type { ContractData } from '@/app/actions/contracts'
import { ContractUploadZone } from './ContractUploadZone'
import { CommentBadge } from '@/components/resource-drawer'

interface Props {
  workspaceId:   string
  initial:       ContractData[]
  currentUserId: string
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

export function ContractList({ workspaceId, initial, currentUserId }: Props) {
  const contracts = initial

  return (
    <div className="space-y-6">
      <ContractUploadZone workspaceId={workspaceId} />

      {contracts.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-card p-10 text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl mx-auto">📄</div>
          <div className="space-y-1">
            <p className="font-semibold text-sm">Sube tu primer contrato</p>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
              Arrastra un PDF arriba o usa el botón de carga. El cliente puede firmarlo digitalmente con verificación OTP.
            </p>
          </div>
        </div>
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
              <div className="flex items-center gap-2 ml-3 shrink-0">
                <CommentBadge
                  workspaceId={workspaceId}
                  resourceType="contract"
                  resourceId={c.id}
                  resourceTitle={c.title}
                  currentUserId={currentUserId}
                />
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_CLASS[c.status] ?? ''}`}>
                  {STATUS_LABEL[c.status] ?? c.status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
