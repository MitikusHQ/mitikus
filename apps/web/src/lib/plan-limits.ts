import type { TrialPlan } from './email-classification'

export interface PlanLimits {
  aiGenerationsPerDay: number
  aiGenerationsPerMonth: number
  maxToolsInstalled: number
  maxRecordsPerInstance: number
}

export const PLAN_LIMITS: Record<TrialPlan, PlanLimits> = {
  trial_personal: {
    aiGenerationsPerDay: 1,
    aiGenerationsPerMonth: 3,
    maxToolsInstalled: 3,
    maxRecordsPerInstance: 10,
  },
  trial_business: {
    aiGenerationsPerDay: 5,
    aiGenerationsPerMonth: 30,
    maxToolsInstalled: 15,
    maxRecordsPerInstance: 100,
  },
  blocked: {
    aiGenerationsPerDay: 0,
    aiGenerationsPerMonth: 0,
    maxToolsInstalled: 0,
    maxRecordsPerInstance: 0,
  },
  internal_dev: {
    aiGenerationsPerDay: 20,
    aiGenerationsPerMonth: 200,
    maxToolsInstalled: 100,
    maxRecordsPerInstance: 1000,
  },
}

export function getPlanLimits(plan: string): PlanLimits {
  return PLAN_LIMITS[plan as TrialPlan] ?? PLAN_LIMITS.trial_personal
}

export function startOfMonthUTC(): Date {
  const d = new Date()
  d.setUTCDate(1)
  d.setUTCHours(0, 0, 0, 0)
  return d
}
