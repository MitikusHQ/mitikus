import type { OfficialToolDefinition } from '../_types'
import { oid } from '../_helpers'

export const iso27001Audit: OfficialToolDefinition = {
  meta: {
    displayCategory: 'Auditoría',
    icon: '🔒',
    color: '#1D4ED8',
    tags: ['iso', 'seguridad', 'información', 'ciberseguridad', 'sgsi'],
    keywords: ['iso 27001', 'seguridad información', 'ciberseguridad', 'sgsi', 'compliance', 'información confidencial', 'controles de seguridad', 'information security'],
    synonyms: ['auditoría seguridad', 'auditoría sgsi', 'information security audit'],
    complexity: 'advanced',
    estimatedMinutes: 120,
  },
  schema: {
    id: oid(2),
    slug: 'iso-27001-audit',
    name: 'Auditoría ISO 27001',
    description: 'Herramienta para auditar el sistema de gestión de seguridad de la información (SGSI) conforme a ISO/IEC 27001:2022. Evalúa controles por dominio.',
    category: 'audit',
    version: '1',
    isPublic: true,
    createdBy: 'official',
    aiPrompt: `Eres un consultor de seguridad IT especializado en ISO 27001 trabajando para una consultora IT que audita a sus clientes. Genera un informe de cumplimiento ISO 27001 profesional con: evaluación del control analizado, gap identificado respecto al estándar, nivel de riesgo con justificación, plan de remediación priorizado con responsables y plazos estimados, y referencia al anexo A aplicable. El informe debe ser entregable directamente al cliente y útil para el CISO o responsable IT.`,
    permissions: { defaultMemberRole: 'EDITOR', allowPublicShare: false },
    dataSchema: {
      fields: {
        organizacion: { type: 'string', label: 'Organización', required: true },
        dominio: { type: 'select', label: 'Dominio de control', required: true, options: ['A.5 Políticas', 'A.6 Organización', 'A.7 RRHH', 'A.8 Activos', 'A.9 Acceso', 'A.10 Criptografía', 'A.11 Física', 'A.12 Operaciones', 'A.13 Comunicaciones', 'A.14 Adquisición', 'A.15 Proveedores', 'A.16 Incidentes', 'A.17 Continuidad', 'A.18 Conformidad'] },
        control: { type: 'string', label: 'Control específico', required: true, placeholder: 'Ej: A.9.1.1 Control de acceso' },
        auditor: { type: 'string', label: 'Auditor', required: true },
        fecha: { type: 'date', label: 'Fecha', required: true },
        estado: { type: 'select', label: 'Estado del control', required: true, options: ['Implementado', 'Parcialmente implementado', 'No implementado', 'No aplica'] },
        nivel_riesgo: { type: 'select', label: 'Nivel de riesgo', required: true, options: ['Crítico', 'Alto', 'Medio', 'Bajo'] },
        hallazgo: { type: 'textarea', label: 'Hallazgo / Observación', required: false },
        accion_correctiva: { type: 'textarea', label: 'Acción correctiva', required: false },
      },
    },
    capabilities: [
      {
        type: 'FORM',
        instanceId: 'form-control-sgsi',
        label: 'Registrar control',
        isDefault: true,
        config: { layout: 'two-column', submitLabel: 'Guardar control' },
      },
      {
        type: 'TABLE',
        instanceId: 'tabla-controles',
        label: 'Controles auditados',
        isDefault: false,
        config: {
          columns: [
            { fieldId: 'dominio', label: 'Dominio' },
            { fieldId: 'control', label: 'Control' },
            { fieldId: 'fecha', label: 'Fecha' },
            { fieldId: 'estado', label: 'Estado' },
            { fieldId: 'nivel_riesgo', label: 'Riesgo' },
          ],
          defaultSortField: 'nivel_riesgo',
          showCreateButton: true,
        },
      },
    ],
  },
}
