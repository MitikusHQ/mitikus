/**
 * Plantillas de misión predefinidas — listos para usar sin pasar por Arkos.
 * Cada plantilla se convierte en un CompanyObjective + MissionSteps al instanciarla.
 */

import type { StepPriority, ResponsibleActor } from './types'

export interface TemplateStep {
  title:            string
  description:      string
  responsibleActor: ResponsibleActor
  estimatedMinutes: number
  recommendedCategory?: string
}

export interface MissionTemplate {
  id:          string
  label:       string
  description: string
  icon:        string
  tag:         string
  priority:    StepPriority
  steps:       TemplateStep[]
}

export const MISSION_TEMPLATES: MissionTemplate[] = [
  {
    id:          'client-onboarding',
    label:       'Onboarding de cliente nuevo',
    description: 'Proceso completo para incorporar un cliente: contrato, brief y seguimiento.',
    icon:        '🤝',
    tag:         'Clientes',
    priority:    'high',
    steps: [
      { title: 'Redactar y enviar contrato de servicios', description: 'Prepara el contrato con el alcance acordado y envíalo al cliente para firma digital.', responsibleActor: 'user', estimatedMinutes: 30, recommendedCategory: 'CHECKLIST' },
      { title: 'Completar brief del proyecto', description: 'Documenta los objetivos, plazos, entregables y expectativas del cliente.', responsibleActor: 'user', estimatedMinutes: 45, recommendedCategory: 'CHECKLIST' },
      { title: 'Crear hoja de seguimiento del proyecto', description: 'Hoja de cálculo con hitos, responsables y fechas clave.', responsibleActor: 'user', estimatedMinutes: 20 },
      { title: 'Enviar bienvenida y accesos al cliente', description: 'Email de bienvenida con accesos, canales de comunicación y próximos pasos.', responsibleActor: 'user', estimatedMinutes: 15 },
    ],
  },
  {
    id:          'proposal-close',
    label:       'Cierre de propuesta comercial',
    description: 'Desde la investigación del cliente hasta la firma del contrato.',
    icon:        '📋',
    tag:         'Comercial',
    priority:    'high',
    steps: [
      { title: 'Investigar al cliente y su sector', description: 'Recopila información sobre la empresa, competencia y necesidades del cliente.', responsibleActor: 'shared', estimatedMinutes: 60, recommendedCategory: 'REPORT' },
      { title: 'Redactar propuesta de servicios', description: 'Documento con alcance, metodología, equipo, plazos y precio.', responsibleActor: 'ai', estimatedMinutes: 90, recommendedCategory: 'REPORT' },
      { title: 'Preparar presentación para el cliente', description: 'Deck de presentación con los puntos clave de la propuesta.', responsibleActor: 'user', estimatedMinutes: 60 },
      { title: 'Enviar propuesta y hacer seguimiento', description: 'Envía la propuesta y programa los siguientes contactos.', responsibleActor: 'user', estimatedMinutes: 20 },
      { title: 'Preparar y firmar contrato', description: 'Una vez aceptada la propuesta, genera y envía el contrato para firma OTP.', responsibleActor: 'user', estimatedMinutes: 30, recommendedCategory: 'CHECKLIST' },
    ],
  },
  {
    id:          'project-closure',
    label:       'Cierre de proyecto',
    description: 'Documenta los entregables, obtén la firma del cliente y archiva el proyecto.',
    icon:        '✅',
    tag:         'Proyectos',
    priority:    'medium',
    steps: [
      { title: 'Elaborar informe final del proyecto', description: 'Documenta qué se hizo, resultados obtenidos y lecciones aprendidas.', responsibleActor: 'ai', estimatedMinutes: 90, recommendedCategory: 'REPORT' },
      { title: 'Redactar acta de entrega', description: 'Documento de aceptación formal de los entregables por parte del cliente.', responsibleActor: 'user', estimatedMinutes: 30, recommendedCategory: 'CHECKLIST' },
      { title: 'Obtener firma de aceptación del cliente', description: 'Envía el acta de entrega para firma digital OTP.', responsibleActor: 'user', estimatedMinutes: 15 },
      { title: 'Archivar documentación del proyecto', description: 'Organiza todos los documentos, contratos y entregables en el workspace.', responsibleActor: 'user', estimatedMinutes: 20 },
    ],
  },
  {
    id:          'budget-proposal',
    label:       'Elaboración de presupuesto',
    description: 'Calcula costes, redacta la propuesta económica y prepara el contrato.',
    icon:        '💰',
    tag:         'Finanzas',
    priority:    'high',
    steps: [
      { title: 'Calcular costes y márgenes del proyecto', description: 'Hoja de cálculo con desglose de horas, materiales y margen de beneficio.', responsibleActor: 'user', estimatedMinutes: 45, recommendedCategory: 'FINANCE' },
      { title: 'Redactar propuesta económica', description: 'Documento con el presupuesto detallado, condiciones de pago y validez.', responsibleActor: 'ai', estimatedMinutes: 30, recommendedCategory: 'REPORT' },
      { title: 'Revisar y aprobar el presupuesto internamente', description: 'Revisión por dirección o responsable antes de enviarlo al cliente.', responsibleActor: 'user', estimatedMinutes: 20 },
      { title: 'Enviar al cliente y preparar contrato', description: 'Envía el presupuesto y, si se aprueba, genera el contrato correspondiente.', responsibleActor: 'user', estimatedMinutes: 25, recommendedCategory: 'CHECKLIST' },
    ],
  },
  {
    id:          'employee-onboarding',
    label:       'Incorporación de empleado',
    description: 'Gestiona la documentación y el proceso de bienvenida de un nuevo miembro.',
    icon:        '👤',
    tag:         'RRHH',
    priority:    'high',
    steps: [
      { title: 'Preparar contrato laboral', description: 'Redacta el contrato de trabajo con condiciones, salario y funciones acordadas.', responsibleActor: 'user', estimatedMinutes: 45, recommendedCategory: 'HR' },
      { title: 'Enviar contrato para firma digital', description: 'Envía el contrato al futuro empleado para firma OTP.', responsibleActor: 'user', estimatedMinutes: 10 },
      { title: 'Crear cuaderno de onboarding', description: 'Documenta el plan de incorporación, recursos necesarios y objetivos del primer mes.', responsibleActor: 'user', estimatedMinutes: 60 },
      { title: 'Preparar accesos y herramientas', description: 'Checklist de accesos al workspace, herramientas y canales de comunicación.', responsibleActor: 'user', estimatedMinutes: 30, recommendedCategory: 'HR' },
    ],
  },
  {
    id:          'internal-audit',
    label:       'Auditoría interna',
    description: 'Planifica y ejecuta una auditoría interna con informe de hallazgos.',
    icon:        '🛡',
    tag:         'Auditoría',
    priority:    'medium',
    steps: [
      { title: 'Definir alcance y criterios de la auditoría', description: 'Documenta qué áreas se van a auditar, con qué criterios y en qué plazo.', responsibleActor: 'user', estimatedMinutes: 30, recommendedCategory: 'AUDIT' },
      { title: 'Ejecutar checklist de auditoría', description: 'Recorre los puntos de control y registra hallazgos y evidencias.', responsibleActor: 'user', estimatedMinutes: 120, recommendedCategory: 'AUDIT' },
      { title: 'Redactar informe de hallazgos', description: 'Documento con el resumen de hallazgos, riesgos identificados y recomendaciones.', responsibleActor: 'ai', estimatedMinutes: 60, recommendedCategory: 'REPORT' },
      { title: 'Definir plan de acción correctivo', description: 'Lista priorizada de acciones con responsable y fecha límite para cada hallazgo.', responsibleActor: 'user', estimatedMinutes: 45 },
    ],
  },
  {
    id:          'product-launch',
    label:       'Lanzamiento de producto o servicio',
    description: 'Coordina todos los entregables para preparar y ejecutar un lanzamiento.',
    icon:        '🚀',
    tag:         'Estrategia',
    priority:    'high',
    steps: [
      { title: 'Documentar el producto o servicio', description: 'Ficha completa con propuesta de valor, público objetivo, precios y diferenciadores.', responsibleActor: 'ai', estimatedMinutes: 60, recommendedCategory: 'REPORT' },
      { title: 'Preparar materiales de ventas', description: 'Presentación comercial y documento de propuesta listos para enviar a clientes.', responsibleActor: 'user', estimatedMinutes: 90 },
      { title: 'Crear hoja de seguimiento de oportunidades', description: 'Registra los contactos, estado de cada conversación y siguientes pasos.', responsibleActor: 'user', estimatedMinutes: 30 },
      { title: 'Redactar contrato tipo de venta', description: 'Plantilla de contrato adaptada al nuevo producto o servicio.', responsibleActor: 'user', estimatedMinutes: 45, recommendedCategory: 'CHECKLIST' },
    ],
  },
  {
    id:          'content-campaign',
    label:       'Campaña de contenidos',
    description: 'Planifica, crea y presenta una campaña de contenidos a un cliente.',
    icon:        '✍️',
    tag:         'Marketing',
    priority:    'medium',
    steps: [
      { title: 'Investigar audiencia y competencia', description: 'Cuaderno de análisis con datos del cliente, audiencia objetivo y benchmarking.', responsibleActor: 'shared', estimatedMinutes: 90, recommendedCategory: 'EVALUATION' },
      { title: 'Crear calendario editorial', description: 'Hoja de cálculo con fechas, formatos, temas y responsables de cada pieza.', responsibleActor: 'user', estimatedMinutes: 60 },
      { title: 'Redactar propuesta de campaña', description: 'Documento con estrategia, objetivos, KPIs y plan de contenidos detallado.', responsibleActor: 'ai', estimatedMinutes: 60, recommendedCategory: 'REPORT' },
      { title: 'Presentar campaña al cliente', description: 'Deck de presentación con los puntos clave de la campaña propuesta.', responsibleActor: 'user', estimatedMinutes: 45 },
    ],
  },
]
