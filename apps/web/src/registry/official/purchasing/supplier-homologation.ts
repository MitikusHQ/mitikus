import type { OfficialToolDefinition } from '../_types'
import { oid } from '../_helpers'

export const supplierHomologation: OfficialToolDefinition = {
  meta: {
    displayCategory: 'Compras',
    icon: '✅',
    color: '#16A34A',
    tags: ['homologación', 'proveedor', 'alta proveedor', 'compras', 'aprobación'],
    keywords: ['homologación proveedor', 'supplier approval', 'alta proveedor', 'aprobación proveedor', 'vendor qualification', 'qualified supplier'],
    synonyms: ['aprobación de proveedor', 'vendor homologation', 'supplier qualification'],
    complexity: 'intermediate',
    estimatedMinutes: 45,
  },
  schema: {
    id: oid(19),
    slug: 'supplier-homologation',
    name: 'Homologación de Proveedor',
    description: 'Herramienta para gestionar el proceso de alta y homologación de nuevos proveedores. Recopila documentación, verifica requisitos y registra la decisión de homologación.',
    category: 'evaluation',
    version: '1',
    isPublic: true,
    createdBy: 'official',
    aiPrompt: `Eres un consultor de homologacion de proveedores para empresas de tecnologia. Genera un informe de homologacion con: evaluacion completa del proveedor segun criterios del proceso (capacidad tecnica, solvencia financiera, referencias, certificaciones, RGPD), resultado de cada criterio con evidencia documental revisada, riesgos identificados con medidas de mitigacion, decision de homologacion (aprobado/con condiciones/rechazado) con justificacion, y condiciones especiales si las hay. El informe queda en el expediente del proveedor.`,
    permissions: { defaultMemberRole: 'EDITOR', allowPublicShare: false },
    dataSchema: {
      fields: {
        proveedor: { type: 'string', label: 'Nombre del proveedor', required: true },
        cif: { type: 'string', label: 'CIF / NIF', required: true },
        categoria: { type: 'string', label: 'Categoría de producto / servicio', required: true },
        solicitante: { type: 'string', label: 'Comprador solicitante', required: true },
        fecha_solicitud: { type: 'date', label: 'Fecha de solicitud', required: true },
        certificaciones: { type: 'string', label: 'Certificaciones (ISO, etc.)', required: false },
        resultado: { type: 'select', label: 'Resultado de homologación', required: true, options: ['Aprobado', 'Aprobado con condiciones', 'Pendiente documentación', 'Rechazado'] },
        fecha_homologacion: { type: 'date', label: 'Fecha de homologación', required: false },
        observaciones: { type: 'textarea', label: 'Observaciones', required: false },
      },
    },
    capabilities: [
      {
        type: 'CHECKLIST',
        instanceId: 'checklist-homologacion',
        label: 'Documentación requerida',
        isDefault: true,
        config: {
          completionType: 'check',
          showProgress: true,
          categories: ['Documentos legales', 'Calidad', 'Económico-financiero', 'Seguridad'],
          items: [
            { id: 'escritura', label: 'Escritura de constitución / CIF', category: 'Documentos legales', required: true },
            { id: 'alta_iae', label: 'Alta en IAE / actividad económica', category: 'Documentos legales' },
            { id: 'seguro', label: 'Póliza de seguro de responsabilidad civil', category: 'Documentos legales', required: true },
            { id: 'iso_calidad', label: 'Certificado ISO 9001 (si aplica)', category: 'Calidad' },
            { id: 'muestra', label: 'Muestra de producto / servicio enviada', category: 'Calidad' },
            { id: 'cuenta_bancaria', label: 'Datos bancarios verificados', category: 'Económico-financiero', required: true },
            { id: 'referencias', label: 'Referencias comerciales aportadas', category: 'Económico-financiero' },
            { id: 'prl', label: 'Documentación PRL (si accede a instalaciones)', category: 'Seguridad' },
          ],
        },
      },
      {
        type: 'TABLE',
        instanceId: 'tabla-homologaciones',
        label: 'Registro de proveedores',
        isDefault: false,
        config: {
          columns: [
            { fieldId: 'proveedor', label: 'Proveedor' },
            { fieldId: 'categoria', label: 'Categoría' },
            { fieldId: 'fecha_solicitud', label: 'Solicitud' },
            { fieldId: 'resultado', label: 'Resultado' },
            { fieldId: 'fecha_homologacion', label: 'Homologación' },
          ],
          showCreateButton: true,
        },
      },
    ],
  },
}
