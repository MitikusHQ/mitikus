// Templates de workflows preconstruidos.
// Cada nodo referencia un slug de ToolDefinition oficial.
// Las posiciones generan un layout horizontal con saltos de 380px.

export interface TemplateNode {
  slug: string
  label: string
  positionX: number
  positionY: number
}

export interface WorkflowTemplate {
  id: string
  name: string
  description: string
  icon: string
  color: string
  category: string
  estimatedMinutes: number
  nodes: TemplateNode[]
}

function chain(slugsAndLabels: [string, string][], startX = 60, startY = 180, stepX = 380): TemplateNode[] {
  return slugsAndLabels.map(([slug, label], i) => ({
    slug,
    label,
    positionX: startX + i * stepX,
    positionY: startY,
  }))
}

export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: 'iso9001-cycle',
    name: 'Ciclo completo ISO 9001',
    description: 'Auditoría → No conformidades → Acciones correctivas → Revisión de gestión',
    icon: '🛡',
    color: '#3B82F6',
    category: 'Calidad',
    estimatedMinutes: 90,
    nodes: chain([
      ['it-audit',            'Auditoría ISO 9001'],
      ['non-conformity',      'No Conformidades'],
      ['corrective-action',   'Acciones Correctivas'],
      ['preventive-action',   'Acciones Preventivas'],
    ]),
  },
  {
    id: 'strategic-diagnosis',
    name: 'Diagnóstico estratégico',
    description: 'Diagnóstico empresarial → DAFO → Plan estratégico',
    icon: '🎯',
    color: '#8B5CF6',
    category: 'Estrategia',
    estimatedMinutes: 60,
    nodes: chain([
      ['company-diagnosis',   'Diagnóstico Empresarial'],
      ['swot-analysis',       'Análisis DAFO'],
      ['strategic-plan',      'Plan Estratégico'],
    ]),
  },
  {
    id: 'sales-cycle',
    name: 'Ciclo de ventas completo',
    description: 'Discovery → Visita comercial → Seguimiento de oportunidad → Forecast',
    icon: '💼',
    color: '#10B981',
    category: 'Ventas',
    estimatedMinutes: 45,
    nodes: chain([
      ['discovery-session',     'Sesión Discovery'],
      ['commercial-visit',      'Informe Visita'],
      ['opportunity-tracking',  'Seguimiento Oportunidad'],
      ['sales-forecast',        'Previsión de Ventas'],
    ]),
  },
  {
    id: 'gdpr-compliance',
    name: 'Cumplimiento RGPD',
    description: 'Auditoría RGPD → Gestión de contratos → Control de accesos',
    icon: '🔒',
    color: '#F59E0B',
    category: 'Legal',
    estimatedMinutes: 75,
    nodes: chain([
      ['gdpr-audit',        'Auditoría RGPD'],
      ['contract-review',   'Revisión de Contratos'],
      ['access-control',    'Control de Accesos IT'],
    ]),
  },
  {
    id: 'it-audit-full',
    name: 'Auditoría IT completa',
    description: 'Inventario hardware y software → Incidencias → Verificación de backup',
    icon: '💻',
    color: '#6366F1',
    category: 'IT',
    estimatedMinutes: 60,
    nodes: chain([
      ['hardware-inventory',  'Inventario Hardware'],
      ['software-inventory',  'Inventario Software'],
      ['it-incidents',        'Gestión Incidencias'],
      ['backup-verification', 'Verificación Backup'],
    ]),
  },
  {
    id: 'hr-cycle',
    name: 'Ciclo RRHH',
    description: 'Entrevista → Onboarding → Seguimiento OKR → Evaluación anual',
    icon: '👥',
    color: '#EC4899',
    category: 'RRHH',
    estimatedMinutes: 50,
    nodes: chain([
      ['job-interview',       'Entrevista de Trabajo'],
      ['employee-onboarding', 'Onboarding'],
      ['objectives-tracking', 'Seguimiento OKR'],
      ['annual-review',       'Evaluación Anual'],
    ]),
  },
]
