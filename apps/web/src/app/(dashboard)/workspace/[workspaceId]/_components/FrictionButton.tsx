'use client'

import { useState } from 'react'
import { recordFriction } from '@/app/actions/pmf-friction'

interface Props {
  workspaceId: string
  nextStepId:    string
  nextStepLabel: string
}

const REASONS = [
  { id: 'no-entiendo', label: 'No entiendo el siguiente paso' },
  { id: 'sin-datos',   label: 'No tengo los datos a mano' },
  { id: 'sin-prisa',   label: 'No quiero emitir facturas todavía' },
  { id: 'explorando',  label: 'Solo estoy explorando' },
  { id: 'otro',        label: 'Otro' },
]

type Help = { title: string; body: string }

function getHelp(reasonId: string, stepId: string, stepLabel: string): Help {
  switch (reasonId) {
    case 'no-entiendo':
      return {
        title: `¿Qué hay que hacer exactamente en "${stepLabel}"?`,
        body: stepId === 'fiscal'
          ? 'Necesitamos tu nombre o razón social y NIF. Los encontrarás en tu DNI, pasaporte o declaración de la renta. Sin este dato las facturas salen en blanco.'
          : stepId === 'client'
            ? 'Solo necesitas el nombre de la empresa o persona a quien facturas. El email es opcional —solo lo usamos para enviarle el PDF.'
            : stepId === 'invoice'
              ? 'Abre Facturas → Nueva factura, elige el cliente, añade los conceptos (descripción + precio) y pulsa Guardar. MITIKUS calcula el IVA automáticamente.'
              : stepId === 'company'
                ? 'Abre Arkos y escribe dos frases sobre tu negocio: a qué te dedicas y a quién le vendes. Con eso Arkos adapta sus respuestas a tu sector.'
                : stepId === 'tool'
                  ? 'En el catálogo de herramientas elige la que más encaje con tu actividad (RGPD, auditorías, RRHH…) y pulsa Instalar. Es gratis y reversible.'
                  : 'Abre la herramienta instalada, responde las preguntas del formulario y pulsa Ejecutar. MITIKUS redacta el informe completo en minutos.',
      }
    case 'sin-datos':
      return {
        title: '¿Qué datos necesitas tener a mano?',
        body: stepId === 'fiscal'
          ? 'Tu NIF (9 caracteres del DNI/NIE/CIF) y tu nombre completo o razón social. Si eres autónomo, es el mismo NIF con el que declaras el IVA.'
          : stepId === 'client'
            ? 'Solo el nombre del cliente es obligatorio. Si quieres enviarle la factura por email, también necesitas su dirección. Puedes completarlo después.'
            : stepId === 'invoice'
              ? 'El concepto facturado (descripción breve), el precio sin IVA y el tipo de IVA (normalmente 21 %). Eso es todo.'
              : 'Puedes volver en cualquier momento — MITIKUS guarda tu progreso automáticamente.',
      }
    case 'sin-prisa':
      return {
        title: 'Sin prisas. ¿Qué más puedes explorar?',
        body: 'Mientras tanto puedes explorar el catálogo de herramientas (RGPD, auditorías, ISO 27001…) o usar Arkos para resolver cualquier duda de negocio. Las facturas estarán aquí cuando las necesites.',
      }
    case 'explorando':
      return {
        title: 'Perfecto. ¿Por dónde quieres explorar?',
        body: 'Prueba Arkos — nuestro copiloto IA — para ver cómo puede ayudarte con tu negocio, o echa un vistazo al catálogo de herramientas. No necesitas completar el checklist para usarlos.',
      }
    case 'otro':
    default:
      return {
        title: '¿Tienes alguna duda concreta?',
        body: 'Puedes preguntarle directamente a Arkos o escribirnos desde el menú de soporte. Estamos aquí para ayudarte.',
      }
  }
}

export function FrictionButton({ workspaceId, nextStepId, nextStepLabel }: Props) {
  const [open,   setOpen]   = useState(false)
  const [chosen, setChosen] = useState<string | null>(null)

  async function handleReason(id: string) {
    setChosen(id)
    await recordFriction(workspaceId, id)
  }

  const help = chosen ? getHelp(chosen, nextStepId, nextStepLabel) : null

  return (
    <div className="pt-1">
      {!open && !chosen && (
        <button
          onClick={() => setOpen(true)}
          className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
        >
          ¿Estás bloqueado o no sabes qué hacer?
        </button>
      )}

      {open && !chosen && (
        <div className="rounded-lg border bg-card p-3 space-y-2">
          <p className="text-xs font-medium">¿Qué te está frenando?</p>
          <div className="flex flex-col gap-1.5">
            {REASONS.map((r) => (
              <button
                key={r.id}
                onClick={() => handleReason(r.id)}
                className="text-left text-xs px-3 py-2 rounded-md border hover:bg-muted transition-colors"
              >
                {r.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setOpen(false)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Cerrar
          </button>
        </div>
      )}

      {chosen && help && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-1.5">
          <p className="text-xs font-semibold">{help.title}</p>
          <p className="text-xs text-muted-foreground leading-relaxed">{help.body}</p>
          <button
            onClick={() => { setChosen(null); setOpen(false) }}
            className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors mt-1"
          >
            Volver
          </button>
        </div>
      )}
    </div>
  )
}
