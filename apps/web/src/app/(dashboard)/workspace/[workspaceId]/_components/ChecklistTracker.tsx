'use client'

import { useEffect, useRef } from 'react'
import { recordOnboardingViewed } from '@/app/actions/pmf-onboarding'

interface Props {
  workspaceId: string
}

export function ChecklistTracker({ workspaceId }: Props) {
  const fired = useRef(false)

  useEffect(() => {
    if (fired.current) return
    fired.current = true
    void recordOnboardingViewed(workspaceId)
  }, [workspaceId])

  return null
}
