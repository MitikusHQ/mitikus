import type { OfficialToolDefinition } from '../_types'
import { oid } from '../_helpers'

export const evacuationChecklist: OfficialToolDefinition = {
  meta: {
    displayCategory: 'Seguridad',
    icon: '🚪',
    color: '#F59E0B',
    tags: ['evacuación', 'emergencias', 'simulacro', 'seguridad', 'protección civil'],
    keywords: ['checklist evacuación', 'simulacro evacuación', 'plan emergencias', 'emergency evacuation', 'fire drill', 'protección civil', 'plan autoprotección'],
    synonyms: ['lista evacuación', 'plan de emergencia', 'fire evacuation checklist'],
    complexity: 'simple',
    estimatedMinutes: 20,
  },
  schema: {
    id: oid(40),
    slug: 'evacuation-checklist',
    name: 'Checklist de Evacuación',
    description: 'Herramienta para verificar la preparación y ejecutar simulacros de evacuación. Confirma que todos los elementos del plan de emergencias están operativos.',
    category: 'checklist',
    version: '1',
    isPublic: true,
    createdBy: 'official',
    permissions: { defaultMemberRole: 'EDITOR', allowPublicShare: false },
    dataSchema: {
      fields: {
        edificio: { type: 'string', label: 'Edificio / Centro', required: true },
        responsable: { type: 'string', label: 'Responsable de emergencias', required: true },
        fecha: { type: 'date', label: 'Fecha del simulacro', required: true },
        tipo: { type: 'select', label: 'Tipo de ejercicio', required: true, options: ['Simulacro completo', 'Verificación periódica', 'Revisión plan emergencias'] },
        tiempo_evacuacion: { type: 'number', label: 'Tiempo de evacuación (minutos)', required: false, min: 0 },
        incidencias: { type: 'textarea', label: 'Incidencias detectadas', required: false },
      },
    },
    capabilities: [
      {
        type: 'CHECKLIST',
        instanceId: 'checklist-evacuacion',
        label: 'Verificación plan de emergencias',
        isDefault: true,
        config: {
          completionType: 'yes_no',
          showProgress: true,
          categories: ['Señalización', 'Vías de evacuación', 'Medios de extinción', 'Comunicación', 'Personal'],
          items: [
            { id: 'senales_evacuacion', label: 'Señales de evacuación visibles y luminosas', category: 'Señalización', required: true },
            { id: 'planos', label: 'Planos de evacuación actualizados y visibles', category: 'Señalización' },
            { id: 'via_principal', label: 'Vía de evacuación principal libre', category: 'Vías de evacuación', required: true },
            { id: 'via_alternativa', label: 'Vías alternativas de evacuación libres', category: 'Vías de evacuación', required: true },
            { id: 'puertas', label: 'Puertas cortafuego funcionando correctamente', category: 'Vías de evacuación' },
            { id: 'punto_reunion', label: 'Punto de reunión señalizado y accesible', category: 'Vías de evacuación', required: true },
            { id: 'extintores_vigentes', label: 'Extintores con revisión anual vigente', category: 'Medios de extinción', required: true },
            { id: 'bie', label: 'BIEs (Bocas de Incendio) operativas', category: 'Medios de extinción' },
            { id: 'alarma', label: 'Sistema de alarma probado y funcionando', category: 'Comunicación', required: true },
            { id: 'megafonia', label: 'Sistema de megafonía operativo', category: 'Comunicación' },
            { id: 'coordinador', label: 'Coordinador de emergencias designado', category: 'Personal', required: true },
            { id: 'equipos_emergencia', label: 'Equipos de emergencia con formación vigente', category: 'Personal', required: true },
          ],
        },
      },
      {
        type: 'TABLE',
        instanceId: 'tabla-simulacros',
        label: 'Historial de simulacros',
        isDefault: false,
        config: {
          columns: [
            { fieldId: 'edificio', label: 'Edificio' },
            { fieldId: 'fecha', label: 'Fecha' },
            { fieldId: 'tipo', label: 'Tipo' },
            { fieldId: 'tiempo_evacuacion', label: 'Tiempo (min)' },
          ],
          showCreateButton: true,
        },
      },
    ],
  },
}
