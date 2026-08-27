'use client'

import Link from 'next/link'
import { recordOnboardingStepClicked } from '@/app/actions/pmf-onboarding'

interface Props {
  href: string
  stepId: string
  stepLabel: string
  workspaceId: string
  isNext: boolean
  children: React.ReactNode
}

export function TrackedStepLink({ href, stepId, stepLabel, workspaceId, isNext, children }: Props) {
  function handleClick() {
    void recordOnboardingStepClicked(workspaceId, stepId, stepLabel)
  }

  return (
    <Link
      href={href}
      onClick={handleClick}
      className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
        isNext
          ? 'bg-primary text-primary-foreground hover:bg-primary/90'
          : 'border hover:bg-muted text-muted-foreground'
      }`}
    >
      {children}
    </Link>
  )
}
