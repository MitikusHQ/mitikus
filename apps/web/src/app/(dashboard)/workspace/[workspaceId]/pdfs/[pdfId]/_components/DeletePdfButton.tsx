'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { deletePdf } from '@/app/actions/pdfs'
import { getDashboardTranslations } from '@/i18n/dashboard-translations'
import type { Locale } from '@/i18n/config'

interface Props {
  pdfId:       string
  workspaceId: string
  locale:      Locale
}

export function DeletePdfButton({ pdfId, workspaceId, locale }: Props) {
  const t = getDashboardTranslations(locale)
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    if (!window.confirm(t.pdfsDeleteConfirm)) return
    startTransition(async () => {
      await deletePdf(pdfId, workspaceId)
      router.push(`/workspace/${workspaceId}/pdfs`)
    })
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="text-xs px-2 py-1 rounded border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
    >
      {isPending ? t.pdfsDeleting : t.pdfsDelete}
    </button>
  )
}
