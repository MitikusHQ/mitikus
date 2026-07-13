import type { OfficialToolDefinition } from '../_types'
import { oid } from '../_helpers'

export const gdprAudit: OfficialToolDefinition = {
  meta: {
    displayCategory: 'Auditoría',
    icon: '🛡️',
    color: '#7C3AED',
    tags: ['rgpd', 'gdpr', 'protección datos', 'privacidad', 'aepd'],
    keywords: ['rgpd', 'gdpr', 'protección de datos', 'privacidad', 'lopdgdd', 'aepd', 'datos personales', 'data protection', 'privacy audit', 'responsable tratamiento'],
    synonyms: ['auditoría protección datos', 'revisión rgpd', 'gdpr compliance', 'privacy review'],
    complexity: 'advanced',
    estimatedMinutes: 90,
  },
  schema: {
    id: oid(6),
    slug: 'gdpr-audit',
    name: 'Auditoría RGPD / Protección de Datos',
    description: 'Herramienta para auditar el cumplimiento del Reglamento General de Protección de Datos (RGPD/GDPR). Revisa tratamientos, bases legales y derechos de interesados.',
    category: 'audit',
    version: '1',
    isPublic: true,
    createdBy: 'official',
    aiPrompt: `Eres un consultor especializado en privacidad y cumplimiento RGPD para empresas. Tu cliente es una consultora IT que necesita documentación de cumplimiento para entregar a su cliente. Genera un informe RGPD con: evaluación del aspecto analizado, identificación de riesgos de incumplimiento con su base legal aplicable, impacto potencial (multa estimada y reputacional), medidas correctoras concretas ordenadas por urgencia, y referencia al artículo del RGPD aplicable. Lenguaje técnico-legal accesible.`,
    permissions: { defaultMemberRole: 'EDITOR', allowPublicShare: false },
    dataSchema: {
      fields: {
        actividad_tratamiento: { type: 'string', label: 'Actividad de tratamiento', required: true },
        responsable: { type: 'string', label: 'Responsable del tratamiento', required: true },
        fecha: { type: 'date', label: 'Fecha de revisión', required: true },
        base_legal: { type: 'select', label: 'Base legal', required: true, options: ['Consentimiento', 'Contrato', 'Obligación legal', 'Interés vital', 'Interés público', 'Interés legítimo'] },
        categorias_datos: { type: 'select', label: 'Categorías de datos', required: true, options: ['Datos básicos', 'Datos sensibles', 'Datos de menores', 'Datos financieros', 'Datos de salud'] },
        cumplimiento: { type: 'select', label: 'Nivel de cumplimiento', required: true, options: ['Conforme', 'Requiere mejoras', 'No conforme', 'En revisión'] },
        medidas_seguridad: { type: 'textarea', label: 'Medidas de seguridad implementadas', required: false },
        riesgos: { type: 'textarea', label: 'Riesgos identificados', required: false },
        acciones: { type: 'textarea', label: 'Acciones de mejora', required: false },
      },
    },
    capabilities: [
      {
        type: 'FORM',
        instanceId: 'form-tratamiento-rgpd',
        label: 'Registrar tratamiento',
        isDefault: true,
        config: { layout: 'two-column', submitLabel: 'Guardar registro' },
      },
      {
        type: 'TABLE',
        instanceId: 'tabla-tratamientos',
        label: 'Registro de tratamientos',
        isDefault: false,
        config: {
          columns: [
            { fieldId: 'actividad_tratamiento', label: 'Actividad' },
            { fieldId: 'base_legal', label: 'Base legal' },
            { fieldId: 'categorias_datos', label: 'Categorías' },
            { fieldId: 'fecha', label: 'Fecha' },
            { fieldId: 'cumplimiento', label: 'Cumplimiento' },
          ],
          showCreateButton: true,
        },
      },
    ],
  },
}
