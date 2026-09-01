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
      ['iso-9001-audit',      'Auditoría ISO 9001'],
      ['non-conformity',      'No Conformidades'],
      ['corrective-action',   'Acciones Correctivas'],
      ['preventive-action',   'Acciones Preventivas'],
    ]),
  },
  {
    id: 'client-acquisition',
    name: 'Captación de clientes',
    description: 'Leads CRM → Discovery → Visita comercial → Pipeline',
    icon: '🤝',
    color: '#0EA5E9',
    category: 'Ventas',
    estimatedMinutes: 50,
    nodes: chain([
      ['crm-leads',           'Registro de Leads'],
      ['discovery-session',   'Sesión Discovery'],
      ['commercial-visit',    'Visita Comercial'],
      ['sales-pipeline',      'Pipeline Comercial'],
    ]),
  },
  {
    id: 'marketing-launch',
    name: 'Lanzamiento de campaña',
    description: 'Brief → Plan editorial → Gestión social → Evaluación de campaña',
    icon: '📣',
    color: '#F97316',
    category: 'Marketing',
    estimatedMinutes: 55,
    nodes: chain([
      ['campaign-brief',        'Brief de Campaña'],
      ['editorial-plan',        'Plan Editorial'],
      ['social-media-manager',  'Gestión Social'],
      ['campaign-evaluation',   'Evaluación'],
    ]),
  },
  {
    id: 'seo-growth',
    name: 'Mejora SEO continua',
    description: 'Auditoría SEO → Checklist SEO → Plan editorial → Evaluación',
    icon: '📈',
    color: '#22C55E',
    category: 'Marketing',
    estimatedMinutes: 60,
    nodes: chain([
      ['seo-audit',           'Auditoría SEO'],
      ['seo-checklist',       'Checklist SEO'],
      ['editorial-plan',      'Plan Editorial'],
      ['campaign-evaluation', 'Evaluación'],
    ]),
  },
  {
    id: 'supplier-purchase',
    name: 'Compra con proveedor',
    description: 'Homologación → Comparativa de ofertas → Solicitud → Recepción',
    icon: '📦',
    color: '#14B8A6',
    category: 'Compras',
    estimatedMinutes: 65,
    nodes: chain([
      ['supplier-homologation', 'Homologación'],
      ['offer-comparison',      'Comparativa'],
      ['purchase-request',      'Solicitud Compra'],
      ['goods-reception',       'Recepción'],
    ]),
  },
  {
    id: 'supplier-review',
    name: 'Evaluación de proveedores',
    description: 'Homologación → Evaluación → No conformidad → Acción correctiva',
    icon: '🏷',
    color: '#06B6D4',
    category: 'Compras',
    estimatedMinutes: 70,
    nodes: chain([
      ['supplier-homologation', 'Homologación'],
      ['supplier-evaluation',   'Evaluación'],
      ['non-conformity',        'No Conformidad'],
      ['corrective-action',     'Acción Correctiva'],
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
    id: 'security-incident',
    name: 'Gestión de incidente',
    description: 'Reporte de incidente → Checklist PRL → Evacuación → Acción preventiva',
    icon: '🚨',
    color: '#EF4444',
    category: 'Seguridad',
    estimatedMinutes: 45,
    nodes: chain([
      ['incident-report',       'Reporte Incidente'],
      ['prl-checklist',         'Checklist PRL'],
      ['evacuation-checklist',  'Evacuación'],
      ['preventive-action',     'Acción Preventiva'],
    ]),
  },
  {
    id: 'cybersecurity-compliance',
    name: 'Ciberseguridad básica',
    description: 'ENS → ISO 27001 → Control de accesos → Backup',
    icon: '🔐',
    color: '#7C3AED',
    category: 'IT',
    estimatedMinutes: 85,
    nodes: chain([
      ['ens-cybersecurity-audit', 'Auditoría ENS'],
      ['iso-27001-audit',         'Auditoría ISO 27001'],
      ['access-control',          'Control Accesos'],
      ['backup-verification',     'Backup'],
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
  {
    id: 'employee-exit',
    name: 'Salida de empleado',
    description: 'Offboarding → Control de accesos → Inventario software → Revisión contractual',
    icon: '🚪',
    color: '#F43F5E',
    category: 'RRHH',
    estimatedMinutes: 40,
    nodes: chain([
      ['employee-offboarding', 'Offboarding'],
      ['access-control',       'Retirar Accesos'],
      ['software-inventory',   'Inventario Software'],
      ['contract-review',      'Revisión Contractual'],
    ]),
  },
  {
    id: 'asset-and-license-control',
    name: 'Control de activos y licencias',
    description: 'Inventario de activos → Inventario software → Control de licencias → Backup',
    icon: '🧾',
    color: '#64748B',
    category: 'Administración',
    estimatedMinutes: 50,
    nodes: chain([
      ['asset-inventory',      'Inventario Activos'],
      ['software-inventory',   'Inventario Software'],
      ['license-control',      'Control Licencias'],
      ['backup-verification',  'Verificación Backup'],
    ]),
  },
  {
    id: 'expense-contract-control',
    name: 'Control de gastos y contratos',
    description: 'Gastos → Contratos → Licencias → Evaluación de proveedor',
    icon: '💶',
    color: '#84CC16',
    category: 'Administración',
    estimatedMinutes: 45,
    nodes: chain([
      ['expense-control',       'Control Gastos'],
      ['contract-review',       'Revisión Contratos'],
      ['license-control',       'Control Licencias'],
      ['supplier-evaluation',   'Proveedor'],
    ]),
  },
  {
    id: 'digital-transformation',
    name: 'Transformación digital',
    description: 'Madurez digital → Mapa de procesos → DAFO → Plan estratégico',
    icon: '⚙️',
    color: '#A855F7',
    category: 'Estrategia',
    estimatedMinutes: 75,
    nodes: chain([
      ['digital-maturity',   'Madurez Digital'],
      ['process-map',        'Mapa Procesos'],
      ['swot-analysis',      'DAFO'],
      ['strategic-plan',     'Plan Estratégico'],
    ]),
  },
]
