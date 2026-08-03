'use client'

import { useActionState, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createWorkspaceWithProfile, type WorkspaceWithProfileState } from '@/app/actions/workspace'

const SECTORS = [
  { value: 'consultoria-gestion', label: 'Consultoría y servicios profesionales' },
  { value: 'marketing-comunicacion', label: 'Marketing y comunicación' },
  { value: 'diseno-creatividad', label: 'Diseño y creatividad' },
  { value: 'legal-juridico', label: 'Legal y asesoría' },
  { value: 'contabilidad-fiscal', label: 'Contabilidad y fiscal' },
  { value: 'tecnologia-it', label: 'Tecnología e IT' },
  { value: 'arquitectura-ingenieria', label: 'Arquitectura e ingeniería' },
  { value: 'salud-bienestar', label: 'Salud y bienestar' },
  { value: 'educacion-formacion', label: 'Educación y formación' },
  { value: 'inmobiliario', label: 'Inmobiliario' },
  { value: 'comercio-retail', label: 'Comercio y retail' },
  { value: 'otro', label: 'Otro' },
]

const SIZES = [
  { value: 'micro', label: 'Solo yo' },
  { value: 'small', label: '2–20 personas' },
  { value: 'medium', label: '20–100 personas' },
  { value: 'large', label: 'Más de 100' },
]

const CUSTOMER_TYPES = [
  { value: 'pymes', label: 'Pymes' },
  { value: 'grandes-cuentas', label: 'Grandes cuentas' },
  { value: 'administracion-publica', label: 'Administración pública' },
  { value: 'startups', label: 'Startups' },
  { value: 'mixto', label: 'Variado / mixto' },
]

const LEGAL_FORMS = [
  { value: 'autonomo',   label: 'Autónomo' },
  { value: 'sl',         label: 'SL / SLU' },
  { value: 'sa',         label: 'SA' },
  { value: 'comunidad',  label: 'Comunidad de bienes' },
  { value: 'otro',       label: 'Otra forma' },
]

const COUNTRIES = [
  { value: 'ES', label: '🇪🇸 España' },
  { value: 'FR', label: '🇫🇷 Francia' },
  { value: 'PT', label: '🇵🇹 Portugal' },
  { value: 'IT', label: '🇮🇹 Italia' },
  { value: 'BE', label: '🇧🇪 Bélgica' },
  { value: 'DE', label: '🇩🇪 Alemania' },
  { value: 'US', label: '🇺🇸 EE. UU.' },
  { value: 'CA', label: '🇨🇦 Canadá' },
  { value: 'IL', label: '🇮🇱 Israel' },
]

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const PLAN_HINT: Record<string, { plan: string; color: string; msg: string; link: string }> = {
  micro: {
    plan: 'Solo',
    color: 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300',
    msg: 'El plan Solo (29 €/mes) está hecho para ti — 1 usuario, 1 workspace y todas las herramientas incluidas.',
    link: '/pricing',
  },
  small: {
    plan: 'Starter',
    color: 'bg-violet-50 border-violet-200 text-violet-700 dark:bg-violet-900/20 dark:border-violet-800 dark:text-violet-300',
    msg: 'El plan Starter (49 €/mes) encaja perfectamente — hasta 2 usuarios, 1 workspace y todas las herramientas.',
    link: '/pricing',
  },
  medium: {
    plan: 'Professional',
    color: 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400',
    msg: 'Para equipos de hasta 15 personas recomendamos el plan Professional (149 €/mes) — 3 workspaces y soporte prioritario.',
    link: '/pricing',
  },
  large: {
    plan: 'Business',
    color: 'bg-gray-50 border-gray-200 text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300',
    msg: 'Para más de 100 personas, el plan Business (349 €/mes) ofrece hasta 15 usuarios y 10 workspaces.',
    link: '/pricing',
  },
}

type Step = 1 | 2 | 3

export function OnboardingWizard() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [workspaceId, setWorkspaceId] = useState<string | null>(null)
  const [slug, setSlug] = useState('')
  const [selectedSize, setSelectedSize] = useState<string>('')

  const [state, action, isPending] = useActionState<WorkspaceWithProfileState, FormData>(
    async (prev, formData) => {
      const result = await createWorkspaceWithProfile(prev, formData)
      if (result && 'workspaceId' in result && result.workspaceId) {
        setWorkspaceId(result.workspaceId)
        setStep(2)
      }
      return result
    },
    null,
  )

  if (step === 2 && workspaceId) {
    return <Step2 workspaceId={workspaceId} onInvite={() => setStep(3)} />
  }

  if (step === 3 && workspaceId) {
    return <Step3 workspaceId={workspaceId} />
  }

  return (
    <div className="w-full max-w-sm mx-auto">
      <StepIndicator current={1} total={3} />
      <h2 className="text-lg font-semibold mb-1">Cuéntanos sobre tu negocio</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Con esto Arkos podrá ayudarte desde el primer momento.
      </p>

      <form action={action} className="space-y-4">
        {/* Nombre workspace */}
        <div className="space-y-1">
          <label htmlFor="name" className="text-sm font-medium">
            Nombre de tu empresa o proyecto
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            autoFocus
            placeholder="Ej. Nexus Consulting"
            onChange={(e) => setSlug(toSlug(e.target.value))}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {slug && (
            <p className="text-xs text-muted-foreground font-mono">mitikus.com/ws/{slug}</p>
          )}
          <input type="hidden" name="slug" value={slug} />
        </div>

        {/* Sector */}
        <div className="space-y-1">
          <label htmlFor="sector" className="text-sm font-medium">
            Sector principal
          </label>
          <select
            id="sector"
            name="sector"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Selecciona…</option>
            {SECTORS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        {/* Tamaño equipo */}
        <div className="space-y-1.5">
          <span className="text-sm font-medium">Tamaño del equipo</span>
          <div className="grid grid-cols-2 gap-2">
            {SIZES.map((s) => (
              <label
                key={s.value}
                className="flex items-center gap-2 rounded-md border border-input px-3 py-2 text-sm cursor-pointer hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5 transition-colors"
              >
                <input
                  type="radio"
                  name="size"
                  value={s.value}
                  className="accent-primary"
                  onChange={() => setSelectedSize(s.value)}
                />
                {s.label}
              </label>
            ))}
          </div>

          {/* Banner de plan recomendado */}
          {selectedSize && PLAN_HINT[selectedSize] && (
            <div className={`mt-2 flex items-start gap-2.5 rounded-lg border px-3 py-2.5 text-xs ${PLAN_HINT[selectedSize]!.color}`}>
              <span className="mt-0.5 shrink-0">✦</span>
              <span>
                {PLAN_HINT[selectedSize]!.msg}{' '}
                <a
                  href={PLAN_HINT[selectedSize]!.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 font-medium"
                >
                  Ver plan {PLAN_HINT[selectedSize]!.plan}
                </a>
              </span>
            </div>
          )}
        </div>

        {/* Tipo cliente */}
        <div className="space-y-1">
          <label htmlFor="customerType" className="text-sm font-medium">
            Clientes habituales
          </label>
          <select
            id="customerType"
            name="customerType"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Selecciona…</option>
            {CUSTOMER_TYPES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        {/* País fiscal — opcional, activa el módulo fiscal */}
        <div className="space-y-1">
          <label htmlFor="country" className="text-sm font-medium">
            País fiscal <span className="text-muted-foreground font-normal">(opcional — activa el calendario fiscal)</span>
          </label>
          <select
            id="country"
            name="country"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">No especificado</option>
            {COUNTRIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        {/* Forma jurídica — solo para España */}
        <div className="space-y-1">
          <label htmlFor="legalForm" className="text-sm font-medium">
            Forma jurídica <span className="text-muted-foreground font-normal">(solo España)</span>
          </label>
          <select
            id="legalForm"
            name="legalForm"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">No especificado</option>
            {LEGAL_FORMS.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
        </div>

        {state && 'error' in state && state.error && (
          <p className="text-sm text-destructive">{state.error}</p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isPending ? 'Creando tu espacio…' : 'Continuar →'}
        </button>
      </form>
    </div>
  )
}

function Step2({ workspaceId, onInvite }: { workspaceId: string; onInvite: () => void }) {
  const router = useRouter()

  return (
    <div className="w-full max-w-sm mx-auto text-center">
      <StepIndicator current={2} total={3} />
      <div className="text-4xl mb-4">🎉</div>
      <h2 className="text-lg font-semibold mb-2">Tu espacio está listo</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Tienes acceso a todas las herramientas. ¿Por dónde quieres empezar?
      </p>

      <div className="space-y-3">
        <button
          onClick={() => router.push(`/workspace/${workspaceId}/office`)}
          className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
        >
          Explorar Mi Office →
        </button>
        <button
          onClick={() => router.push(`/workspace/${workspaceId}/fiscal`)}
          className="w-full rounded-md border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 px-4 py-2.5 text-sm font-medium text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
        >
          🗓️ Ver calendario fiscal
        </button>
        <button
          onClick={onInvite}
          className="w-full rounded-md border border-input px-4 py-2.5 text-sm font-medium hover:bg-muted/50 transition-colors"
        >
          Invitar a mi equipo
        </button>
        <button
          onClick={() => router.push(`/workspace/${workspaceId}`)}
          className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
        >
          Ir al panel principal
        </button>
      </div>
    </div>
  )
}

function Step3({ workspaceId }: { workspaceId: string }) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    // Redirige a /team con email prefilled via query param — la lógica de invite ya existe allí
    router.push(`/settings/team?invite=email`)
  }

  return (
    <div className="w-full max-w-sm mx-auto">
      <StepIndicator current={3} total={3} />
      <h2 className="text-lg font-semibold mb-2">Invita a tu equipo</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Los miembros invitados tendrán acceso a herramientas, clientes y documentos de este workspace.
      </p>

      <form onSubmit={handleInvite} className="space-y-4">
        <div className="space-y-1">
          <label htmlFor="invite-email" className="text-sm font-medium">
            Email del compañero
          </label>
          <input
            id="invite-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="compañero@empresa.com"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <button
          type="submit"
          disabled={!email}
          className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Enviar invitación →
        </button>
      </form>

      <button
        onClick={() => router.push(`/workspace/${workspaceId}`)}
        className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-4"
      >
        Saltar e ir al panel
      </button>
    </div>
  )
}

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5 mb-6">
      {Array.from({ length: total }, (_, i) => i + 1).map((n) => (
        <div
          key={n}
          className={`h-1 flex-1 rounded-full transition-colors ${
            n <= current ? 'bg-primary' : 'bg-muted'
          }`}
        />
      ))}
    </div>
  )
}
