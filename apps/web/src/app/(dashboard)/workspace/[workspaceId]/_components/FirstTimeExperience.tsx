'use client'

import { useState, useRef, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { quickInstallTool } from '@/app/actions/tool'
import { UpgradeModal } from '@/app/(dashboard)/_components/UpgradeModal'
import { createMissionFromTemplate } from '@/app/actions/mission-templates'
import { MISSION_TEMPLATES } from '@/lib/missions/templates'

const LIMIT_ERRORS   = ['Límite de herramientas alcanzado', 'límite de herramientas']
const BLOCKED_ERRORS = ['no está permitido para la beta', 'lista de espera']
function upgradeReason(msg: string): 'limit' | 'blocked' | null {
  if (LIMIT_ERRORS.some((s) => msg.includes(s))) return 'limit'
  if (BLOCKED_ERRORS.some((s) => msg.includes(s))) return 'blocked'
  return null
}

interface Props {
  workspaceId: string
  userName:    string
  sector:      string | null
}

const PILLARS = [
  { icon: '🔧', label: 'Herramientas', desc: 'Ejecuta auditorías e informes con un clic' },
  { icon: '🎯', label: 'Misiones',     desc: 'Convierte objetivos en pasos concretos' },
  { icon: '🏢', label: 'Clientes',     desc: 'Todo el trabajo vinculado a cada cuenta' },
  { icon: '📊', label: 'Historial',    desc: 'Cada ejecución guardada y exportable' },
]

type Audit = {
  slug:  string
  icon:  string
  label: string
  desc:  string
  tag:   string | null
}

const AUDITS: Audit[] = [
  {
    slug:  'it-audit',
    icon:  '🔐',
    label: 'Auditoría de seguridad IT',
    desc:  'Evalúa controles, accesos, infraestructura y vulnerabilidades. La más solicitada por consultoras IT.',
    tag:   'La más popular',
  },
  {
    slug:  'gdpr-audit',
    icon:  '📋',
    label: 'Cumplimiento RGPD',
    desc:  'Diagnóstico de tratamiento de datos personales, base legal, contratos y medidas de seguridad.',
    tag:   'Obligatorio para clientes UE',
  },
  {
    slug:  'iso-27001-audit',
    icon:  '🏛️',
    label: 'ISO 27001',
    desc:  'Evaluación del Sistema de Gestión de Seguridad de la Información según el estándar internacional.',
    tag:   null,
  },
  {
    slug:  'ens-cybersecurity-audit',
    icon:  '🔒',
    label: 'Esquema Nacional de Seguridad',
    desc:  'Auditoría de cumplimiento ENS para organismos públicos y proveedores de servicios digitales en España.',
    tag:   'Específico España',
  },
  {
    slug:  'digital-maturity',
    icon:  '📊',
    label: 'Diagnóstico de madurez digital',
    desc:  'Evalúa el nivel de digitalización y recomienda prioridades de transformación para el cliente.',
    tag:   null,
  },
]

// Slugs prioritizados por sector (los primeros aparecen destacados)
const SECTOR_PRIORITY: Record<string, string[]> = {
  'ciberseguridad':         ['it-audit', 'iso-27001-audit', 'ens-cybersecurity-audit', 'gdpr-audit'],
  'infraestructura-it':     ['it-audit', 'iso-27001-audit', 'gdpr-audit', 'digital-maturity'],
  'consultoria-gestion':    ['digital-maturity', 'gdpr-audit', 'it-audit', 'iso-27001-audit'],
  'datos-analytics':        ['gdpr-audit', 'digital-maturity', 'it-audit', 'iso-27001-audit'],
  'desarrollo-software':    ['gdpr-audit', 'it-audit', 'digital-maturity', 'iso-27001-audit'],
  'transformacion-digital': ['digital-maturity', 'it-audit', 'gdpr-audit', 'iso-27001-audit'],
}

function getOrderedAudits(sector: string | null): Array<Audit & { recommended: boolean }> {
  const priority = sector ? (SECTOR_PRIORITY[sector] ?? []) : []
  const prioritySet = new Set(priority)
  const ordered = [
    ...priority.map((slug) => AUDITS.find((a) => a.slug === slug)!).filter(Boolean),
    ...AUDITS.filter((a) => !prioritySet.has(a.slug)),
  ]
  return ordered.map((a, i) => ({ ...a, recommended: priority.length > 0 && i === 0 }))
}

export function FirstTimeExperience({ workspaceId, userName, sector }: Props) {
  const orderedAudits = getOrderedAudits(sector)
  const [step,            setStep]           = useState<'intro' | 'company' | 'audit-select' | 'mission-select'>('intro')
  const [input,           setInput]          = useState('')
  const [visible,         setVisible]        = useState(false)
  const [installing,      setInstalling]     = useState<string | null>(null)
  const [installedToolId, setInstalledToolId] = useState<string | null>(null)
  const [creatingMission, setCreatingMission] = useState<string | null>(null)
  const [error,           setError]          = useState<string | null>(null)
  const [upgradeOpen,     setUpgradeOpen]    = useState<'limit' | 'blocked' | null>(null)
  const [, startTransition]                  = useTransition()
  const inputRef                             = useRef<HTMLTextAreaElement>(null)
  const router                               = useRouter()

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (step === 'company') setTimeout(() => inputRef.current?.focus(), 80)
  }, [step])

  function handleCompanySubmit(e: React.FormEvent) {
    e.preventDefault()
    const msg = input.trim()
    if (!msg) return
    // Guardamos el contexto en el copiloto en background y pasamos al selector
    void fetch(`/workspace/${workspaceId}/copilot?setup=${encodeURIComponent(msg)}`, { method: 'HEAD' }).catch(() => null)
    setStep('audit-select')
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleCompanySubmit(e as unknown as React.FormEvent)
    }
  }

  function handleAuditSelect(slug: string) {
    if (installing) return
    setInstalling(slug)
    setError(null)
    startTransition(async () => {
      const result = await quickInstallTool(workspaceId, slug)
      if ('error' in result) {
        const reason = upgradeReason(result.error)
        if (reason) {
          setUpgradeOpen(reason)
        } else {
          setError(result.error)
        }
        setInstalling(null)
      } else {
        setInstalledToolId(result.instanceId)
        setInstalling(null)
        setStep('mission-select')
      }
    })
  }

  function handleMissionSelect(templateId: string) {
    if (creatingMission) return
    setCreatingMission(templateId)
    startTransition(async () => {
      try {
        const { objectiveId } = await createMissionFromTemplate(workspaceId, templateId)
        router.push(`/workspace/${workspaceId}/missions/${objectiveId}`)
      } catch {
        setCreatingMission(null)
        router.push(`/workspace/${workspaceId}`)
      }
    })
  }

  function finishOnboarding() {
    if (installedToolId) {
      router.push(`/workspace/${workspaceId}/tools/${installedToolId}/run`)
    } else {
      router.push(`/workspace/${workspaceId}`)
    }
  }

  return (
    <>
      {upgradeOpen && (
        <UpgradeModal reason={upgradeOpen} onClose={() => setUpgradeOpen(null)} />
      )}
    <div
      className={`
        fixed inset-0 z-50 flex flex-col items-center justify-center
        bg-background px-6
        transition-opacity duration-500
        ${visible ? 'opacity-100' : 'opacity-0'}
      `}
    >
      <p className="absolute top-7 left-8 text-sm font-semibold tracking-widest text-muted-foreground/50 uppercase">
        mitikus
      </p>

      {/* ── Paso 1: intro ────────────────────────────────────── */}
      {step === 'intro' && (
        <div className="w-full max-w-lg space-y-8">
          <div className="space-y-2">
            <p className="text-muted-foreground text-base">Hola, {userName}.</p>
            <h1 className="text-3xl font-semibold leading-snug">
              Bienvenido a MITIKUS.
            </h1>
            <p className="text-muted-foreground text-sm leading-relaxed pt-1">
              La plataforma que convierte tus auditorías en procesos repetibles — para que entregues más en menos tiempo.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {PILLARS.map((p) => (
              <div key={p.label} className="rounded-xl border bg-card p-4 space-y-1.5">
                <span className="text-xl">{p.icon}</span>
                <p className="text-sm font-semibold">{p.label}</p>
                <p className="text-xs text-muted-foreground">{p.desc}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => router.push(`/workspace/${workspaceId}?skip=1`)}
              className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition underline-offset-4 hover:underline"
            >
              Explorar por mi cuenta
            </button>
            <button
              type="button"
              onClick={() => setStep('company')}
              className="px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition"
            >
              Empezar →
            </button>
          </div>
        </div>
      )}

      {/* ── Paso 2: descripción empresa ──────────────────────── */}
      {step === 'company' && (
        <div className="w-full max-w-lg space-y-8">
          <div className="space-y-2">
            <p className="text-xs text-primary font-semibold uppercase tracking-widest">Paso 1 de 2</p>
            <h1 className="text-3xl font-semibold leading-snug">
              ¿A qué se dedica<br />tu consultora?
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Arkos aprenderá tu sector y servicios para personalizar todas las herramientas desde el primer momento.
            </p>
          </div>

          <form onSubmit={handleCompanySubmit} className="space-y-4">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Somos una consultoría de ciberseguridad para pymes industriales en España…"
              rows={4}
              className="
                w-full resize-none rounded-xl border bg-card px-4 py-3
                text-base placeholder:text-muted-foreground/40
                focus:outline-none focus:ring-2 focus:ring-primary/40
                transition
              "
            />
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep('intro')}
                className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition"
              >
                ← Volver
              </button>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setStep('audit-select')}
                  className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition underline-offset-4 hover:underline"
                >
                  Saltar por ahora
                </button>
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="
                    px-5 py-2.5 rounded-lg bg-primary text-primary-foreground
                    text-sm font-medium
                    disabled:opacity-40 disabled:cursor-not-allowed
                    hover:opacity-90 transition
                  "
                >
                  Continuar →
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* ── Paso 3: elige primera auditoría ──────────────────── */}
      {step === 'audit-select' && (
        <div className="w-full max-w-2xl flex flex-col gap-5 overflow-y-auto max-h-[calc(100vh-80px)] py-4">
          <div className="space-y-1 text-center">
            <p className="text-xs text-primary font-semibold uppercase tracking-widest">Paso 2 de 3</p>
            <h1 className="text-2xl font-semibold leading-snug">
              Elige tu primera auditoría
            </h1>
            <p className="text-sm text-muted-foreground">
              Se instalará y estará lista para ejecutar en segundos. En 5 minutos tendrás un borrador real.
            </p>
          </div>

          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}

          <div className="grid sm:grid-cols-2 gap-3">
            {orderedAudits.map((a) => (
              <button
                key={a.slug}
                type="button"
                onClick={() => handleAuditSelect(a.slug)}
                disabled={!!installing}
                className={`
                  relative text-left rounded-xl border bg-card p-5 space-y-2
                  hover:border-primary hover:bg-primary/5
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-all group
                  ${a.recommended ? 'border-primary/40 ring-1 ring-primary/20' : ''}
                `}
              >
                {a.recommended ? (
                  <span className="absolute top-3 right-3 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary text-primary-foreground">
                    Para tu sector
                  </span>
                ) : a.tag ? (
                  <span className="absolute top-3 right-3 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                    {a.tag}
                  </span>
                ) : null}
                <div className="text-2xl">{a.icon}</div>
                <p className="text-sm font-semibold pr-20 group-hover:text-primary transition-colors">
                  {installing === a.slug ? '…' : a.label}
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">{a.desc}</p>
                {installing === a.slug && (
                  <p className="text-xs text-primary font-medium">Instalando…</p>
                )}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep('company')}
              className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition"
            >
              ← Volver
            </button>
            <button
              type="button"
              onClick={() => router.push(`/workspace/${workspaceId}?skip=1`)}
              className="text-sm text-muted-foreground hover:text-foreground transition underline-offset-4 hover:underline"
            >
              Saltar este paso →
            </button>
          </div>
        </div>
      )}

      {/* ── Paso 4: primera misión ────────────────────────────── */}
      {step === 'mission-select' && (
        <div className="w-full max-w-2xl space-y-8">
          <div className="space-y-2 text-center">
            <p className="text-xs text-primary font-semibold uppercase tracking-widest">Paso 3 de 3</p>
            <h1 className="text-3xl font-semibold leading-snug">
              Crea tu primera misión
            </h1>
            <p className="text-sm text-muted-foreground">
              Una misión convierte un objetivo de tu empresa en pasos concretos. Elige una plantilla para empezar al instante.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            {MISSION_TEMPLATES.slice(0, 4).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => handleMissionSelect(t.id)}
                disabled={!!creatingMission}
                className="
                  text-left rounded-xl border bg-card p-5 space-y-2
                  hover:border-primary hover:bg-primary/5
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-all group
                "
              >
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{t.icon}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{t.tag}</span>
                </div>
                <p className="text-sm font-semibold group-hover:text-primary transition-colors">
                  {creatingMission === t.id ? 'Creando…' : t.label}
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">{t.description}</p>
                <p className="text-[10px] text-muted-foreground">{t.steps.length} pasos incluidos</p>
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep('audit-select')}
              className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition"
            >
              ← Volver
            </button>
            <button
              type="button"
              onClick={finishOnboarding}
              className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition underline-offset-4 hover:underline"
            >
              Saltar por ahora
            </button>
          </div>
        </div>
      )}
    </div>
    </>
  )
}
