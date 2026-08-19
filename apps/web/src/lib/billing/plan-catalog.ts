/**
 * Plan Catalog (BILLING-001) — única fuente de verdad de qué incluye cada
 * plan. Precios y límites validados en GTM-003 (beachhead: consultoras IT).
 *
 * Stripe solo conoce price IDs; el significado de negocio de cada plan
 * vive exclusivamente aquí.
 */

import type { PlanTier } from '@prisma/client'

export interface PlanLimits {
  maxUsers:              number
  maxWorkspaces:         number
  maxActiveMissions:     number
  aiGenerationsPerMonth: number
  maxToolsInstalled:     number
  brainQueriesPerMonth:  number
}

export interface PlanFeatures {
  aiRecommendations: boolean
  prioritySupport:   boolean
  customBranding:    boolean
}

export interface PlanDefinition {
  tier:            PlanTier
  name:            string
  priceMonthlyEUR: number | null // null = "a medida" (Enterprise)
  /** Variable de entorno que contiene el Stripe Price ID mensual de este plan */
  stripePriceEnvVar: string | null
  limits:   PlanLimits
  features: PlanFeatures
}

const UNLIMITED = Number.POSITIVE_INFINITY

export const PLAN_CATALOG: Record<PlanTier, PlanDefinition> = {
  AUTONOMO: {
    tier: 'AUTONOMO',
    name: 'Solo',
    priceMonthlyEUR: 29,
    stripePriceEnvVar: 'STRIPE_PRICE_AUTONOMO_MONTHLY',
    limits: {
      maxUsers: 1,
      maxWorkspaces: 1,
      maxActiveMissions: 5,
      aiGenerationsPerMonth: 100,
      maxToolsInstalled: 5,
      brainQueriesPerMonth: 20,
    },
    features: {
      aiRecommendations: true,
      prioritySupport: false,
      customBranding: false,
    },
  },
  STARTER: {
    tier: 'STARTER',
    name: 'Starter',
    priceMonthlyEUR: 49,
    stripePriceEnvVar: 'STRIPE_PRICE_STARTER_MONTHLY',
    limits: {
      maxUsers: 2,
      maxWorkspaces: 1,
      maxActiveMissions: 5,
      aiGenerationsPerMonth: 100,
      maxToolsInstalled: 5,
      brainQueriesPerMonth: 50,
    },
    features: {
      aiRecommendations: true,
      prioritySupport: false,
      customBranding: false,
    },
  },
  PROFESSIONAL: {
    tier: 'PROFESSIONAL',
    name: 'Professional',
    priceMonthlyEUR: 149,
    stripePriceEnvVar: 'STRIPE_PRICE_PROFESSIONAL_MONTHLY',
    limits: {
      maxUsers: 5,
      maxWorkspaces: 3,
      maxActiveMissions: 30,
      aiGenerationsPerMonth: 500,
      maxToolsInstalled: 20,
      brainQueriesPerMonth: 200,
    },
    features: {
      aiRecommendations: true,
      prioritySupport: false,
      customBranding: false,
    },
  },
  BUSINESS: {
    tier: 'BUSINESS',
    name: 'Business',
    priceMonthlyEUR: 349,
    stripePriceEnvVar: 'STRIPE_PRICE_BUSINESS_MONTHLY',
    limits: {
      maxUsers: 15,
      maxWorkspaces: 10,
      maxActiveMissions: UNLIMITED,
      aiGenerationsPerMonth: 2000,
      maxToolsInstalled: UNLIMITED,
      brainQueriesPerMonth: UNLIMITED,
    },
    features: {
      aiRecommendations: true,
      prioritySupport: true,
      customBranding: false,
    },
  },
  ENTERPRISE: {
    tier: 'ENTERPRISE',
    name: 'Enterprise',
    priceMonthlyEUR: null, // a medida — no se vende todavía (GTM-003: Potencial Enterprise 2/10)
    stripePriceEnvVar: null,
    limits: {
      maxUsers: UNLIMITED,
      maxWorkspaces: UNLIMITED,
      maxActiveMissions: UNLIMITED,
      aiGenerationsPerMonth: UNLIMITED,
      maxToolsInstalled: UNLIMITED,
      brainQueriesPerMonth: UNLIMITED,
    },
    features: {
      aiRecommendations: true,
      prioritySupport: true,
      customBranding: true,
    },
  },
}

/** Orden de "tamaño" de plan — para decidir si un cambio es upgrade o downgrade. */
const TIER_RANK: Record<PlanTier, number> = {
  AUTONOMO: 0,
  STARTER: 1,
  PROFESSIONAL: 2,
  BUSINESS: 3,
  ENTERPRISE: 4,
}

export function isUpgrade(from: PlanTier, to: PlanTier): boolean {
  return TIER_RANK[to] > TIER_RANK[from]
}

export function getPlanDefinition(tier: PlanTier): PlanDefinition {
  return PLAN_CATALOG[tier]
}

/** Resuelve el Stripe Price ID real de un plan desde las variables de entorno. */
export function getStripePriceId(tier: PlanTier): string | null {
  const envVar = PLAN_CATALOG[tier].stripePriceEnvVar
  if (!envVar) return null
  return process.env[envVar] ?? null
}

export function getTierFromStripePriceId(priceId: string): PlanTier | null {
  for (const def of Object.values(PLAN_CATALOG)) {
    if (def.stripePriceEnvVar && process.env[def.stripePriceEnvVar] === priceId) {
      return def.tier
    }
  }
  return null
}
