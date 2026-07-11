/**
 * Sugerencias de recuperación por dominio/sector.
 * Se muestran como chips clicables cuando el intent falla o no hay planes.
 * El usuario las puede pinchar directamente para reenviar la frase al Copilot.
 */

import type { CopilotSuggestion } from './copilot-types'

/** Frases concretas que el usuario puede enviar directamente al Copilot. */
const DOMAIN_PHRASES: Record<string, { label: string; icon: string }[]> = {
  marketing: [
    { label: 'Quiero hacer una auditoría SEO de mi web',          icon: '🔍' },
    { label: 'Necesito un plan de contenidos para redes sociales', icon: '📱' },
    { label: 'Quiero lanzar una campaña de email marketing',       icon: '📧' },
    { label: 'Analiza el rendimiento de mis redes sociales',       icon: '📊' },
  ],
  sales: [
    { label: 'Quiero mejorar mi pipeline de ventas',              icon: '📈' },
    { label: 'Necesito gestionar mejor mis leads y oportunidades', icon: '🎯' },
    { label: 'Quiero preparar un informe de previsión de ventas',  icon: '💰' },
    { label: 'Necesito un sistema de seguimiento comercial',       icon: '🤝' },
  ],
  hr: [
    { label: 'Quiero mejorar el proceso de incorporación de empleados', icon: '👥' },
    { label: 'Necesito implementar evaluaciones de desempeño',          icon: '⭐' },
    { label: 'Quiero gestionar los OKRs del equipo',                    icon: '🎯' },
    { label: 'Necesito un proceso de offboarding para bajas',           icon: '📋' },
  ],
  quality: [
    { label: 'Quiero preparar la certificación ISO 9001',              icon: '✅' },
    { label: 'Necesito gestionar las no conformidades del proceso',     icon: '⚠️' },
    { label: 'Quiero implementar acciones correctivas',                 icon: '🔧' },
    { label: 'Necesito hacer una auditoría de calidad interna',         icon: '🔎' },
  ],
  it: [
    { label: 'Quiero hacer una auditoría de seguridad IT',             icon: '🛡' },
    { label: 'Necesito preparar la certificación ISO 27001',            icon: '🔒' },
    { label: 'Quiero revisar el inventario de hardware y software',     icon: '💻' },
    { label: 'Necesito mejorar la gestión de accesos y permisos',       icon: '🔑' },
  ],
  legal: [
    { label: 'Quiero hacer una auditoría de cumplimiento RGPD',        icon: '⚖️' },
    { label: 'Necesito revisar mis contratos con clientes',             icon: '📜' },
    { label: 'Quiero asegurar el cumplimiento normativo de la empresa', icon: '🏛' },
    { label: 'Necesito documentar el tratamiento de datos personales',  icon: '📁' },
  ],
  finance: [
    { label: 'Quiero mejorar el control de gastos de la empresa',      icon: '💳' },
    { label: 'Necesito comparar ofertas de proveedores',                icon: '📊' },
    { label: 'Quiero hacer un análisis financiero trimestral',          icon: '📈' },
    { label: 'Necesito optimizar el proceso de aprobación de compras',  icon: '✅' },
  ],
  procurement: [
    { label: 'Quiero homologar a mis proveedores',                     icon: '🏭' },
    { label: 'Necesito un proceso de evaluación de proveedores',        icon: '⭐' },
    { label: 'Quiero gestionar mejor las recepciones de mercancía',     icon: '📦' },
    { label: 'Necesito comparar ofertas antes de comprar',              icon: '🔍' },
  ],
  operations: [
    { label: 'Quiero mapear y mejorar un proceso clave de la empresa', icon: '🔀' },
    { label: 'Necesito identificar ineficiencias operativas',           icon: '⚙️' },
    { label: 'Quiero implementar mejoras en la cadena de producción',   icon: '🏗' },
    { label: 'Necesito documentar los procesos del equipo',             icon: '📋' },
  ],
  strategy: [
    { label: 'Quiero hacer un diagnóstico completo de mi empresa',     icon: '🔭' },
    { label: 'Necesito un análisis DAFO',                               icon: '🧭' },
    { label: 'Quiero definir un plan estratégico para este año',        icon: '🗺' },
    { label: 'Necesito evaluar la madurez digital de mi empresa',       icon: '💡' },
  ],
  admin: [
    { label: 'Quiero inventariar todos los activos de la empresa',     icon: '📦' },
    { label: 'Necesito gestionar el inventario de hardware',            icon: '💻' },
    { label: 'Quiero organizar los procesos administrativos',           icon: '📂' },
    { label: 'Necesito digitalizar la gestión de activos',              icon: '🔄' },
  ],
}

/** Frases genéricas cuando no conocemos el sector. */
const GENERIC_PHRASES: { label: string; icon: string }[] = [
  { label: 'Quiero hacer un diagnóstico de mi empresa',          icon: '🔭' },
  { label: 'Necesito mejorar el SEO de mi web',                  icon: '🔍' },
  { label: 'Quiero gestionar mejor mis clientes y ventas',       icon: '🤝' },
  { label: 'Necesito preparar una certificación de calidad',     icon: '✅' },
  { label: 'Quiero auditar la seguridad IT de mi empresa',       icon: '🛡' },
]

/**
 * Devuelve hasta 4 sugerencias de recuperación basadas en el sector/dominio
 * conocido de la empresa. Si no se conoce el sector, devuelve las genéricas.
 */
export function getFallbackSuggestions(sector: string | null): CopilotSuggestion[] {
  const key = (sector ?? '').toLowerCase().trim()
  const phrases = DOMAIN_PHRASES[key] ?? GENERIC_PHRASES

  return phrases.slice(0, 4).map((p, i) => ({
    id:            `fallback-${key || 'generic'}-${i}`,
    category:      'domain' as const,
    label:         p.label,
    description:   '',
    canonicalGoal: null,
    icon:          p.icon,
  }))
}
