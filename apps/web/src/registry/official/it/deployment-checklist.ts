import type { OfficialToolDefinition } from '../_types'
import { oid } from '../_helpers'

export const deploymentChecklist: OfficialToolDefinition = {
  meta: {
    displayCategory: 'IT',
    icon: '🚀',
    color: '#4F46E5',
    tags: ['despliegue', 'deploy', 'release', 'devops', 'producción'],
    keywords: ['checklist despliegue', 'deployment checklist', 'release checklist', 'go live', 'puesta en producción', 'devops', 'ci/cd', 'release management'],
    synonyms: ['lista de despliegue', 'release checklist', 'go-live checklist'],
    complexity: 'intermediate',
    estimatedMinutes: 30,
  },
  schema: {
    id: oid(45),
    slug: 'deployment-checklist',
    name: 'Checklist de Despliegue',
    description: 'Herramienta para verificar todos los pasos antes, durante y después de un despliegue a producción. Reduce el riesgo de incidencias en puestas en producción.',
    category: 'checklist',
    version: '1',
    isPublic: true,
    createdBy: 'official',
    permissions: { defaultMemberRole: 'EDITOR', allowPublicShare: false },
    dataSchema: {
      fields: {
        aplicacion: { type: 'string', label: 'Aplicación / Servicio', required: true },
        version: { type: 'string', label: 'Versión a desplegar', required: true },
        responsable: { type: 'string', label: 'Responsable del despliegue', required: true },
        fecha: { type: 'date', label: 'Fecha planificada', required: true },
        entorno: { type: 'select', label: 'Entorno', required: true, options: ['Staging/Pre', 'Producción'] },
        resultado: { type: 'select', label: 'Resultado del despliegue', required: false, options: ['Exitoso', 'Exitoso con incidencias', 'Revertido', 'Fallido'] },
        observaciones: { type: 'textarea', label: 'Observaciones', required: false },
      },
    },
    capabilities: [
      {
        type: 'CHECKLIST',
        instanceId: 'checklist-despliegue',
        label: 'Verificación de despliegue',
        isDefault: true,
        config: {
          completionType: 'check',
          showProgress: true,
          categories: ['Pre-despliegue', 'Despliegue', 'Post-despliegue'],
          items: [
            { id: 'tests', label: 'Tests unitarios y de integración superados', category: 'Pre-despliegue', required: true },
            { id: 'code_review', label: 'Code review aprobado', category: 'Pre-despliegue', required: true },
            { id: 'staging_ok', label: 'Despliegue en staging verificado', category: 'Pre-despliegue', required: true },
            { id: 'backup', label: 'Backup de base de datos realizado', category: 'Pre-despliegue', required: true },
            { id: 'plan_rollback', label: 'Plan de rollback documentado y accesible', category: 'Pre-despliegue' },
            { id: 'comunicacion', label: 'Comunicado de mantenimiento enviado (si aplica)', category: 'Pre-despliegue' },
            { id: 'artefacto', label: 'Artefacto de despliegue verificado', category: 'Despliegue', required: true },
            { id: 'migracion_bd', label: 'Migraciones de base de datos ejecutadas', category: 'Despliegue' },
            { id: 'variables_entorno', label: 'Variables de entorno configuradas', category: 'Despliegue', required: true },
            { id: 'smoke_tests', label: 'Smoke tests post-despliegue superados', category: 'Post-despliegue', required: true },
            { id: 'monitorizacion', label: 'Monitorizacion y alertas activas', category: 'Post-despliegue' },
            { id: 'logs', label: 'Logs revisados — sin errores críticos', category: 'Post-despliegue', required: true },
          ],
        },
      },
      {
        type: 'TABLE',
        instanceId: 'tabla-despliegues',
        label: 'Historial de despliegues',
        isDefault: false,
        config: {
          columns: [
            { fieldId: 'aplicacion', label: 'Aplicación' },
            { fieldId: 'version', label: 'Versión' },
            { fieldId: 'entorno', label: 'Entorno' },
            { fieldId: 'fecha', label: 'Fecha' },
            { fieldId: 'resultado', label: 'Resultado' },
          ],
          showCreateButton: true,
        },
      },
    ],
  },
}
