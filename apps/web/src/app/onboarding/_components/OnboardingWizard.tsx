'use client'

import { useActionState, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createWorkspaceWithProfile, type WorkspaceWithProfileState } from '@/app/actions/workspace'

const SECTORS = [
  { value: 'consultoria-gestion', label: 'ConsultorÃ­a y servicios profesionales' },
  { value: 'marketing-comunicacion', label: 'Marketing y comunicaciÃ³n' },
  { value: 'diseno-creatividad', label: 'DiseÃ±o y creatividad' },
  { value: 'legal-juridico', label: 'Legal y asesorÃ­a' },
  { value: 'contabilidad-fiscal', label: 'Contabilidad y fiscal' },
  { value: 'tecnologia-it', label: 'TecnologÃ­a e IT' },
  { value: 'arquitectura-ingenieria', label: 'Arquitectura e ingenierÃ­a' },
  { value: 'salud-bienestar', label: 'Salud y bienestar' },
  { value: 'educacion-formacion', label: 'EducaciÃ³n y formaciÃ³n' },
  { value: 'inmobiliario', label: 'Inmobiliario' },
  { value: 'comercio-retail', label: 'Comercio y retail' },
  { value: 'otro', label: 'Otro' },
]

const SIZES = [
  { value: 'micro', label: 'Solo yo' },
  { value: 'small', label: '2â€“20 personas' },
  { value: 'medium', label: '20â€“100 personas' },
  { value: 'large', label: 'MÃ¡s de 100' },
]

const CUSTOMER_TYPES = [
  { value: 'pymes', label: 'Pymes' },
  { value: 'grandes-cuentas', label: 'Grandes cuentas' },
  { value: 'administracion-publica', label: 'AdministraciÃ³n pÃºblica' },
  { value: 'startups', label: 'Startups' },
  { value: 'mixto', label: 'Variado / mixto' },
]

const LEGAL_FORMS = [
  { value: 'autonomo',   label: 'AutÃ³nomo' },
  { value: 'sl',         label: 'SL / SLU' },
  { value: 'sa',         label: 'SA' },
  { value: 'comunidad',  label: 'Comunidad de bienes' },
  { value: 'otro',       label: 'Otra forma' },
]

const COUNTRIES = [
  { value: 'ES', label: 'ðŸ‡ªðŸ‡¸ EspaÃ±a' },
  { value: 'FR', label: 'ðŸ‡«ðŸ‡· Francia' },
  { value: 'PT', label: 'ðŸ‡µðŸ‡¹ Portugal' },
  { value: 'IT', label: 'ðŸ‡®ðŸ‡¹ Italia' },
  { value: 'BE', label: 'ðŸ‡§ðŸ‡ª BÃ©lgica' },
  { value: 'DE', label: 'ðŸ‡©ðŸ‡ª Alemania' },
  { value: 'US', label: 'ðŸ‡ºðŸ‡¸ EE. UU.' },
  { value: 'CA', label: 'ðŸ‡¨ðŸ‡¦ CanadÃ¡' },
  { value: 'IL', label: 'ðŸ‡®ðŸ‡± Israel' },
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
    msg: 'El plan Solo (29 â‚¬/mes) estÃ¡ hecho para ti â€” 1 usuario, 1 workspace y todas las herramientas incluidas.',
    link: '/pricing',
  },
  small: {
    plan: 'Starter',
    color: 'bg-violet-50 border-violet-200 text-violet-700 dark:bg-violet-900/20 dark:border-violet-800 dark:text-violet-300',
    msg: 'El plan Starter (49 â‚¬/mes) encaja perfectamente â€” hasta 2 usuarios, 1 workspace y todas las herramientas.',
    link: '/pricing',
  },
  medium: {
    plan: 'Professional',
    color: 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400',
    msg: 'Para equipos de hasta 15 personas recomendamos el plan Professional (149 â‚¬/mes) â€” 3 workspaces y soporte prioritario.',
    link: '/pricing',
  },
  large: {
    plan: 'Business',
    color: 'bg-gray-50 border-gray-200 text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300',
    msg: 'Para mÃ¡s de 100 personas, el plan Business (349 â‚¬/mes) ofrece hasta 15 usuarios y 10 workspaces.',
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
      <h2 className="text-lg font-semibold mb-1">CuÃ©ntanos sobre tu negocio</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Con esto Arkos podrÃ¡ ayudarte desde el primer momento.
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
            <option value="">Seleccionaâ€¦</option>
            {SECTORS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        {/* TamaÃ±o equipo */}
        <div className="space-y-1.5">
          <span className="text-sm font-medium">TamaÃ±o del equipo</span>
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
              <span className="mt-0.5 shrink-0">âœ¦</span>
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
            <option value="">Seleccionaâ€¦</option>
            {CUSTOMER_TYPES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        {/* PaÃ­s fiscal â€” opcional, activa el mÃ³dulo fiscal */}
        <div className="space-y-1">
          <label htmlFor="country" className="text-sm font-medium">
            PaÃ­s fiscal <span className="text-muted-foreground font-normal">(opcional â€” activa el calendario fiscal)</span>
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

        {/* Forma jurÃ­dica â€” solo para EspaÃ±a */}
        <div className="space-y-1">
          <label htmlFor="legalForm" className="text-sm font-medium">
            Forma jurÃ­dica <span className="text-muted-foreground font-normal">(solo EspaÃ±a)</span>
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
          {isPending ? 'Creando tu espacioâ€¦' : 'Continuar â†’'}
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
      <div className="text-4xl mb-4">ðŸŽ‰</div>
      <h2 className="text-lg font-semibold mb-2">Tu espacio estÃ¡ listo</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Tienes acceso a todas las herramientas. Â¿Por dÃ³nde quieres empezar?
      </p>

      <div className="space-y-3">
        <button
          onClick={() => router.push(`/workspace/${workspaceId}/office`)}
          className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
        >
          Explorar Studio â†’
        </button>
        <button
          onClick={() => router.push(`/workspace/${workspaceId}/fiscal/configurar`)}
          className="w-full rounded-md border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 px-4 py-2.5 text-sm font-medium text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
        >
          ðŸ§¾ AÃ±adir mis datos fiscales
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
    // Redirige a /team con email prefilled via query param â€” la lÃ³gica de invite ya existe allÃ­
    router.push(`/settings/team?invite=email`)
  }

  return (
    <div className="w-full max-w-sm mx-auto">
      <StepIndicator current={3} total={3} />
      <h2 className="text-lg font-semibold mb-2">Invita a tu equipo</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Los miembros invitados tendrÃ¡n acceso a herramientas, clientes y documentos de este workspace.
      </p>

      <form onSubmit={handleInvite} className="space-y-4">
        <div className="space-y-1">
          <label htmlFor="invite-email" className="text-sm font-medium">
            Email del compaÃ±ero
          </label>
          <input
            id="invite-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="compaÃ±ero@empresa.com"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <button
          type="submit"
          disabled={!email}
          className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Enviar invitaciÃ³n â†’
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

