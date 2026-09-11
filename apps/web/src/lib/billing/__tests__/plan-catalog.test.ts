import { describe, it, expect } from 'vitest'
import {
  PLAN_CATALOG,
  getPlanDefinition,
  isUpgrade,
  type PlanLimits,
} from '../plan-catalog'
import type { PlanTier } from '@prisma/client'

const ALL_TIERS: PlanTier[] = ['AUTONOMO', 'STARTER', 'PROFESSIONAL', 'BUSINESS', 'ENTERPRISE']
const UNLIMITED = Number.MAX_SAFE_INTEGER

// ---------------------------------------------------------------------------
// PLAN_CATALOG shape
// ---------------------------------------------------------------------------

describe('PLAN_CATALOG', () => {
  it('has an entry for every PlanTier', () => {
    for (const tier of ALL_TIERS) {
      expect(PLAN_CATALOG[tier]).toBeDefined()
    }
  })

  it('every plan limits object has all required keys', () => {
    const requiredKeys: (keyof PlanLimits)[] = [
      'maxUsers', 'maxWorkspaces', 'maxActiveMissions',
      'aiGenerationsPerMonth', 'maxToolsInstalled',
      'brainQueriesPerMonth', 'maxStorageGB',
    ]
    for (const tier of ALL_TIERS) {
      const { limits } = PLAN_CATALOG[tier]
      for (const key of requiredKeys) {
        expect(typeof limits[key], `${tier}.${key} should be a number`).toBe('number')
      }
    }
  })

  it('every plan has a non-empty name', () => {
    for (const tier of ALL_TIERS) {
      expect(PLAN_CATALOG[tier].name.length).toBeGreaterThan(0)
    }
  })

  // Limit ordering: AUTONOMO ≤ STARTER ≤ PROFESSIONAL ≤ BUSINESS for numeric caps
  it('maxUsers grows across tiers in order', () => {
    expect(PLAN_CATALOG.AUTONOMO.limits.maxUsers).toBeLessThanOrEqual(PLAN_CATALOG.STARTER.limits.maxUsers)
    expect(PLAN_CATALOG.STARTER.limits.maxUsers).toBeLessThanOrEqual(PLAN_CATALOG.PROFESSIONAL.limits.maxUsers)
    expect(PLAN_CATALOG.PROFESSIONAL.limits.maxUsers).toBeLessThanOrEqual(PLAN_CATALOG.BUSINESS.limits.maxUsers)
  })

  it('aiGenerationsPerMonth grows across paid tiers', () => {
    expect(PLAN_CATALOG.AUTONOMO.limits.aiGenerationsPerMonth)
      .toBeLessThanOrEqual(PLAN_CATALOG.PROFESSIONAL.limits.aiGenerationsPerMonth)
    expect(PLAN_CATALOG.PROFESSIONAL.limits.aiGenerationsPerMonth)
      .toBeLessThanOrEqual(PLAN_CATALOG.BUSINESS.limits.aiGenerationsPerMonth)
  })

  it('ENTERPRISE has UNLIMITED on all limits', () => {
    const limits = PLAN_CATALOG.ENTERPRISE.limits
    for (const value of Object.values(limits)) {
      expect(value).toBe(UNLIMITED)
    }
  })

  it('BUSINESS has UNLIMITED on at least some limits', () => {
    const limits = PLAN_CATALOG.BUSINESS.limits
    const hasUnlimited = Object.values(limits).some((v) => v === UNLIMITED)
    expect(hasUnlimited).toBe(true)
  })

  it('AUTONOMO maxUsers is exactly 1', () => {
    expect(PLAN_CATALOG.AUTONOMO.limits.maxUsers).toBe(1)
  })

  it('all limits are non-negative', () => {
    for (const tier of ALL_TIERS) {
      for (const [key, value] of Object.entries(PLAN_CATALOG[tier].limits)) {
        expect(value, `${tier}.${key} must be >= 0`).toBeGreaterThanOrEqual(0)
      }
    }
  })

  it('UNLIMITED value is safe for JSON (no Infinity)', () => {
    // JSON.stringify(Infinity) returns "null"; MAX_SAFE_INTEGER serializes correctly
    expect(JSON.stringify(UNLIMITED)).not.toBe('null')
  })

  it('Enterprise has null priceMonthlyEUR (a medida)', () => {
    expect(PLAN_CATALOG.ENTERPRISE.priceMonthlyEUR).toBeNull()
  })

  it('paid tiers have positive priceMonthlyEUR', () => {
    for (const tier of ['AUTONOMO', 'STARTER', 'PROFESSIONAL', 'BUSINESS'] as PlanTier[]) {
      expect(PLAN_CATALOG[tier].priceMonthlyEUR).toBeGreaterThan(0)
    }
  })
})

// ---------------------------------------------------------------------------
// getPlanDefinition
// ---------------------------------------------------------------------------

describe('getPlanDefinition', () => {
  it('returns the correct plan for a given tier', () => {
    expect(getPlanDefinition('PROFESSIONAL').tier).toBe('PROFESSIONAL')
  })

  it('returns AUTONOMO plan correctly', () => {
    const plan = getPlanDefinition('AUTONOMO')
    expect(plan.limits.maxUsers).toBe(1)
  })
})

// ---------------------------------------------------------------------------
// isUpgrade
// ---------------------------------------------------------------------------

describe('isUpgrade', () => {
  it('AUTONOMO → PROFESSIONAL is an upgrade', () => {
    expect(isUpgrade('AUTONOMO', 'PROFESSIONAL')).toBe(true)
  })

  it('BUSINESS → ENTERPRISE is an upgrade', () => {
    expect(isUpgrade('BUSINESS', 'ENTERPRISE')).toBe(true)
  })

  it('PROFESSIONAL → STARTER is a downgrade', () => {
    expect(isUpgrade('PROFESSIONAL', 'STARTER')).toBe(false)
  })

  it('same tier is not an upgrade', () => {
    expect(isUpgrade('STARTER', 'STARTER')).toBe(false)
  })

  it('STARTER → BUSINESS is an upgrade', () => {
    expect(isUpgrade('STARTER', 'BUSINESS')).toBe(true)
  })

  it('ENTERPRISE → AUTONOMO is a downgrade', () => {
    expect(isUpgrade('ENTERPRISE', 'AUTONOMO')).toBe(false)
  })
})
