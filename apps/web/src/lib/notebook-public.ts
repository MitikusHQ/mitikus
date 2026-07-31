import { db } from '@/lib/db'

export async function getNotebookByToken(shareToken: string): Promise<{
  title: string
  synthesisCache: string | null
  sources: { title: string; type: string; charCount: number }[]
} | null> {
  const notebook = await db.notebook.findUnique({
    where: { shareToken },
    select: {
      title: true,
      synthesisCache: true,
      sources: { select: { title: true, type: true, charCount: true } },
    },
  })
  return notebook
}
