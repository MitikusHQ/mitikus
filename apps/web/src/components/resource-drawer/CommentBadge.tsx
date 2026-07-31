'use client'

import { useState } from 'react'
import { MessageSquare } from 'lucide-react'
import { ResourceDrawer } from './ResourceDrawer'
import type { ResourceType } from '@/app/actions/comments'

interface Props {
  workspaceId:   string
  resourceType:  ResourceType
  resourceId:    string
  resourceTitle: string
  currentUserId: string
}

export function CommentBadge({ workspaceId, resourceType, resourceId, resourceTitle, currentUserId }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(true) }}
        className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
        title="Comentarios y actividad"
      >
        <MessageSquare className="w-3.5 h-3.5" />
      </button>
      <ResourceDrawer
        open={open}
        onClose={() => setOpen(false)}
        workspaceId={workspaceId}
        resourceType={resourceType}
        resourceId={resourceId}
        resourceTitle={resourceTitle}
        currentUserId={currentUserId}
      />
    </>
  )
}
