import type { OfficialToolDefinition } from '../_types'
import { oid } from '../_helpers'

export const backupVerification: OfficialToolDefinition = {
  meta: {
    displayCategory: 'IT',
    icon: '💾',
    color: '#0369A1',
    tags: ['backup', 'copia seguridad', 'recuperación', 'it', 'continuidad'],
    keywords: ['verificación backup', 'backup verification', 'copias de seguridad', 'disaster recovery', 'rto', 'rpo', 'recuperación datos', 'business continuity'],
    synonyms: ['verificación copias seguridad', 'backup check', 'copia de seguridad'],
    complexity: 'simple',
    estimatedMinutes: 15,
  },
  schema: {
    id: oid(46),
    slug: 'backup-verification',
    name: 'Verificación de Backup',
    description: 'Herramienta para registrar y verificar las copias de seguridad. Garantiza que los backups se realizan correctamente, son recuperables y cumplen los objetivos de RPO/RTO.',
    category: 'audit',
    version: '1',
    isPublic: true,
    createdBy: 'official',
    aiPrompt: `Eres un consultor IT especializado en continuidad de negocio y recuperación ante desastres. Genera un informe de verificación de backup con: estado del backup analizado, validación de integridad y completitud, análisis del RTO/RPO real vs objetivo del cliente, riesgos identificados si el backup falla, y recomendaciones para mejorar la estrategia de backup. Incluye una valoración de si el cliente está protegido ante un ransomware o fallo de hardware crítico.`,
    permissions: { defaultMemberRole: 'EDITOR', allowPublicShare: false },
    dataSchema: {
      fields: {
        sistema: { type: 'string', label: 'Sistema / Aplicación', required: true },
        tipo_backup: { type: 'select', label: 'Tipo de backup', required: true, options: ['Completo', 'Incremental', 'Diferencial', 'Snapshot'] },
        fecha_backup: { type: 'date', label: 'Fecha del backup', required: true },
        responsable: { type: 'string', label: 'Responsable de verificación', required: true },
        tamano_gb: { type: 'number', label: 'Tamaño (GB)', required: false, min: 0 },
        duracion_minutos: { type: 'number', label: 'Duración (minutos)', required: false, min: 0 },
        restauracion_probada: { type: 'boolean', label: '¿Restauración probada?', required: false },
        resultado: { type: 'select', label: 'Resultado', required: true, options: ['Correcto', 'Correcto con advertencias', 'Fallido', 'Parcial'] },
        observaciones: { type: 'textarea', label: 'Observaciones', required: false },
      },
    },
    capabilities: [
      {
        type: 'FORM',
        instanceId: 'form-verificacion-backup',
        label: 'Registrar verificación',
        isDefault: true,
        config: { layout: 'two-column', submitLabel: 'Registrar backup' },
      },
      {
        type: 'TABLE',
        instanceId: 'tabla-backups',
        label: 'Historial de backups',
        isDefault: false,
        config: {
          columns: [
            { fieldId: 'sistema', label: 'Sistema' },
            { fieldId: 'tipo_backup', label: 'Tipo' },
            { fieldId: 'fecha_backup', label: 'Fecha' },
            { fieldId: 'tamano_gb', label: 'Tamaño (GB)' },
            { fieldId: 'restauracion_probada', label: 'Restauración probada' },
            { fieldId: 'resultado', label: 'Resultado' },
          ],
          defaultSortField: 'fecha_backup',
          defaultSortDirection: 'desc',
          showCreateButton: true,
        },
      },
    ],
  },
}
