/**
 * Catálogo de Objetivos Canónicos.
 *
 * Conecta cada CanonicalGoal con:
 *   - Keywords en español para detección rule-based
 *   - Herramientas del Capability Graph (slugs)
 *   - Entidades requeridas (para detectar missingInformation)
 *
 * Este archivo es la fuente de verdad del Normalizer.
 * No contiene lógica — solo conocimiento declarativo.
 */

import type { CanonicalGoal, CanonicalGoalDefinition, IntentEntity } from './types'

type RequiredKey = keyof IntentEntity

export const GOAL_CATALOG: Record<CanonicalGoal, CanonicalGoalDefinition> = {

  // ── MARKETING ────────────────────────────────────────────────────

  seo_optimization: {
    goal: 'seo_optimization',
    domain: 'marketing',
    labelEs: 'Optimización SEO',
    keywords: [
      'seo', 'posicionamiento', 'google', 'búsqueda orgánica', 'tráfico orgánico',
      'keywords', 'ranking', 'buscadores', 'indexación', 'visibilidad web',
      'optimizar web', 'auditoría seo', 'analizar seo', 'mejorar seo',
    ],
    primaryTools: ['seo-audit', 'seo-checklist', 'editorial-plan'],
    requiredEntities: ['website'] as RequiredKey[],
  },

  content_marketing: {
    goal: 'content_marketing',
    domain: 'marketing',
    labelEs: 'Marketing de contenidos',
    keywords: [
      'contenidos', 'blog', 'editorial', 'publicaciones', 'artículos',
      'calendario editorial', 'plan de contenidos', 'estrategia de contenidos',
      'copywriting', 'contenido digital',
    ],
    primaryTools: ['editorial-plan', 'seo-checklist', 'campaign-brief'],
    requiredEntities: [] as RequiredKey[],
  },

  campaign_management: {
    goal: 'campaign_management',
    domain: 'marketing',
    labelEs: 'Gestión de campañas',
    keywords: [
      'campaña', 'campaña de marketing', 'publicidad', 'anuncios', 'email marketing',
      'lanzamiento', 'campaña digital', 'campaña publicitaria', 'brief',
      'estrategia de campaña', 'resultados campaña', 'evaluar campaña',
    ],
    primaryTools: ['campaign-brief', 'editorial-plan', 'campaign-evaluation'],
    requiredEntities: ['product'] as RequiredKey[],
  },

  social_media_analysis: {
    goal: 'social_media_analysis',
    domain: 'marketing',
    labelEs: 'Análisis de redes sociales',
    keywords: [
      'redes sociales', 'social media', 'instagram', 'linkedin', 'twitter', 'facebook',
      'tiktok', 'engagement', 'seguidores', 'presencia digital', 'auditoría redes',
    ],
    primaryTools: ['social-media-audit', 'campaign-evaluation'],
    requiredEntities: [] as RequiredKey[],
  },

  // ── SALES ────────────────────────────────────────────────────────

  crm_lead_management: {
    goal: 'crm_lead_management',
    domain: 'sales',
    labelEs: 'Gestión de leads y CRM',
    keywords: [
      'leads', 'clientes potenciales', 'prospectos', 'crm', 'contactos',
      'captación', 'generación de leads', 'pipeline', 'embudo de ventas',
      'cualificar', 'base de datos de clientes',
    ],
    primaryTools: ['crm-leads', 'opportunity-tracking', 'commercial-visit'],
    requiredEntities: [] as RequiredKey[],
  },

  sales_pipeline_management: {
    goal: 'sales_pipeline_management',
    domain: 'sales',
    labelEs: 'Gestión del pipeline de ventas',
    keywords: [
      'pipeline', 'embudo de ventas', 'oportunidades', 'estado de ventas',
      'seguimiento comercial', 'etapas de venta', 'conversión', 'ventas en curso',
    ],
    primaryTools: ['sales-pipeline', 'opportunity-tracking', 'crm-leads'],
    requiredEntities: [] as RequiredKey[],
  },

  sales_forecasting: {
    goal: 'sales_forecasting',
    domain: 'sales',
    labelEs: 'Previsión de ventas',
    keywords: [
      'previsión de ventas', 'forecast', 'proyección ventas', 'objetivos ventas',
      'estimación ingresos', 'planificación comercial', 'presupuesto ventas',
    ],
    primaryTools: ['sales-forecast', 'sales-pipeline'],
    requiredEntities: [] as RequiredKey[],
  },

  commercial_visit_tracking: {
    goal: 'commercial_visit_tracking',
    domain: 'sales',
    labelEs: 'Seguimiento de visitas comerciales',
    keywords: [
      'visita comercial', 'visita cliente', 'informe visita', 'reunión cliente',
      'seguimiento cliente', 'registro visita',
    ],
    primaryTools: ['commercial-visit', 'opportunity-tracking'],
    requiredEntities: [] as RequiredKey[],
  },

  sales_diagnosis: {
    goal: 'sales_diagnosis',
    domain: 'sales',
    labelEs: 'Diagnóstico comercial',
    keywords: [
      'auditoría comercial', 'diagnóstico ventas', 'análisis equipo ventas',
      'rendimiento comercial', 'evaluación comercial',
    ],
    primaryTools: ['commercial-audit', 'sales-pipeline', 'sales-forecast'],
    requiredEntities: [] as RequiredKey[],
  },

  // ── HR ────────────────────────────────────────────────────────────

  employee_onboarding: {
    goal: 'employee_onboarding',
    domain: 'hr',
    labelEs: 'Incorporación de empleados',
    keywords: [
      'onboarding', 'incorporación', 'nuevo empleado', 'alta empleado',
      'bienvenida empleado', 'integración empleado', 'primer día',
    ],
    primaryTools: ['employee-onboarding', 'job-interview'],
    requiredEntities: [] as RequiredKey[],
  },

  employee_offboarding: {
    goal: 'employee_offboarding',
    domain: 'hr',
    labelEs: 'Baja de empleados',
    keywords: [
      'offboarding', 'baja empleado', 'salida empleado', 'despido', 'renuncia',
      'desvinculación', 'entrevista salida',
    ],
    primaryTools: ['employee-offboarding', 'access-control'],
    requiredEntities: [] as RequiredKey[],
  },

  performance_evaluation: {
    goal: 'performance_evaluation',
    domain: 'hr',
    labelEs: 'Evaluación de desempeño',
    keywords: [
      'evaluación desempeño', 'revisión desempeño', 'performance review',
      'feedback empleado', 'evaluación trimestral', 'evaluación semestral',
      'valorar empleado', 'competencias',
    ],
    primaryTools: ['performance-review', 'annual-review', 'objectives-tracking'],
    requiredEntities: [] as RequiredKey[],
  },

  okr_management: {
    goal: 'okr_management',
    domain: 'hr',
    labelEs: 'Gestión de OKRs y objetivos',
    keywords: [
      'okr', 'objetivos', 'key results', 'seguimiento objetivos', 'mbo',
      'gestión por objetivos', 'kpi', 'indicadores', 'metas',
    ],
    primaryTools: ['objectives-tracking', 'performance-review', 'annual-review'],
    requiredEntities: [] as RequiredKey[],
  },

  talent_acquisition: {
    goal: 'talent_acquisition',
    domain: 'hr',
    labelEs: 'Selección y contratación de personal',
    keywords: [
      'selección de personal', 'reclutamiento', 'contratación', 'entrevista',
      'candidato', 'proceso de selección', 'recruiting', 'headhunting', 'vacante',
    ],
    primaryTools: ['job-interview', 'employee-onboarding'],
    requiredEntities: [] as RequiredKey[],
  },

  // ── QUALITY ───────────────────────────────────────────────────────

  quality_management: {
    goal: 'quality_management',
    domain: 'quality',
    labelEs: 'Gestión de la calidad',
    keywords: [
      'calidad', 'no conformidad', 'gestión calidad', 'control calidad',
      'trazabilidad', 'incidencia calidad', 'defecto', 'reclamación calidad',
    ],
    primaryTools: ['non-conformity', 'corrective-action', 'quality-inspection'],
    requiredEntities: [] as RequiredKey[],
  },

  corrective_actions: {
    goal: 'corrective_actions',
    domain: 'quality',
    labelEs: 'Acciones correctivas',
    keywords: [
      'acción correctiva', 'corrección', 'causa raíz', 'análisis causa',
      'corregir problema', 'resolver no conformidad',
    ],
    primaryTools: ['corrective-action', 'non-conformity', 'preventive-action'],
    requiredEntities: [] as RequiredKey[],
  },

  preventive_actions: {
    goal: 'preventive_actions',
    domain: 'quality',
    labelEs: 'Acciones preventivas',
    keywords: [
      'acción preventiva', 'prevención', 'riesgo calidad', 'evitar problemas',
      'mejora preventiva', 'gestión proactiva calidad',
    ],
    primaryTools: ['preventive-action', 'corrective-action'],
    requiredEntities: [] as RequiredKey[],
  },

  production_quality_control: {
    goal: 'production_quality_control',
    domain: 'quality',
    labelEs: 'Control de calidad en producción',
    keywords: [
      'control producción', 'inspección', 'checklist producción', 'lote',
      'control entrada', 'verificación materiales', 'recepción calidad',
    ],
    primaryTools: ['production-checklist', 'quality-inspection', 'goods-reception'],
    requiredEntities: [] as RequiredKey[],
  },

  // ── COMPLIANCE / LEGAL ─────────────────────────────────────────────

  iso9001_certification: {
    goal: 'iso9001_certification',
    domain: 'quality',
    labelEs: 'Certificación ISO 9001',
    keywords: [
      'iso 9001', 'iso9001', 'certificación calidad', 'sgc', 'sistema gestión calidad',
      'auditoría iso', 'norma iso', 'certificar empresa', 'cumplimiento iso',
    ],
    primaryTools: ['iso9001-audit', 'corrective-action', 'preventive-action', 'quality-inspection'],
    requiredEntities: ['company_name', 'sector'] as RequiredKey[],
  },

  iso27001_certification: {
    goal: 'iso27001_certification',
    domain: 'it',
    labelEs: 'Certificación ISO 27001',
    keywords: [
      'iso 27001', 'iso27001', 'seguridad información', 'sgsi', 'ciberseguridad',
      'seguridad informática', 'certificación seguridad', 'auditoria seguridad',
    ],
    primaryTools: ['iso27001-audit', 'it-audit', 'access-control', 'backup-verification'],
    requiredEntities: ['company_name'] as RequiredKey[],
  },

  gdpr_compliance: {
    goal: 'gdpr_compliance',
    domain: 'legal',
    labelEs: 'Cumplimiento RGPD / GDPR',
    keywords: [
      'rgpd', 'gdpr', 'protección de datos', 'privacidad', 'lopd', 'datos personales',
      'cumplimiento rgpd', 'auditoría rgpd', 'derechos usuarios', 'tratamiento datos',
    ],
    primaryTools: ['gdpr-audit', 'iso27001-audit'],
    requiredEntities: ['company_name'] as RequiredKey[],
  },

  legal_compliance: {
    goal: 'legal_compliance',
    domain: 'legal',
    labelEs: 'Cumplimiento legal y contratos',
    keywords: [
      'contrato', 'revisión legal', 'cumplimiento legal', 'asesoría legal',
      'obligaciones legales', 'normativa', 'regulación', 'legislación',
    ],
    primaryTools: ['contract-review', 'gdpr-audit'],
    requiredEntities: [] as RequiredKey[],
  },

  // ── PROCUREMENT ───────────────────────────────────────────────────

  supplier_management: {
    goal: 'supplier_management',
    domain: 'procurement',
    labelEs: 'Gestión y evaluación de proveedores',
    keywords: [
      'proveedor', 'evaluación proveedor', 'homologación proveedor',
      'auditoría proveedor', 'selección proveedor', 'gestión proveedores',
      'calificar proveedor',
    ],
    primaryTools: ['supplier-evaluation', 'supplier-homologation', 'goods-reception'],
    requiredEntities: [] as RequiredKey[],
  },

  procurement_optimization: {
    goal: 'procurement_optimization',
    domain: 'procurement',
    labelEs: 'Optimización de compras',
    keywords: [
      'comparativa ofertas', 'negociación', 'optimizar compras', 'ahorro compras',
      'coste compras', 'adjudicación', 'selección oferta', 'comparar precios',
    ],
    primaryTools: ['offer-comparison', 'supplier-evaluation', 'expense-control'],
    requiredEntities: [] as RequiredKey[],
  },

  // ── STRATEGY ───────────────────────────────────────────────────────

  strategic_planning: {
    goal: 'strategic_planning',
    domain: 'strategy',
    labelEs: 'Planificación estratégica',
    keywords: [
      'plan estratégico', 'estrategia', 'planificación', 'misión', 'visión',
      'objetivos estratégicos', 'hoja de ruta', 'roadmap', 'plan de negocio',
      'dirección estratégica', 'plan anual',
    ],
    primaryTools: ['strategic-plan', 'swot-analysis', 'company-diagnosis'],
    requiredEntities: ['company_name', 'sector'] as RequiredKey[],
  },

  business_diagnosis: {
    goal: 'business_diagnosis',
    domain: 'strategy',
    labelEs: 'Diagnóstico empresarial',
    keywords: [
      'diagnóstico empresa', 'análisis empresa', 'dafo', 'foda', 'swot',
      'análisis situación', 'diagnóstico organizacional', 'consultoría',
      'análisis interno', 'fortalezas debilidades',
    ],
    primaryTools: ['swot-analysis', 'company-diagnosis', 'digital-maturity'],
    requiredEntities: ['company_name'] as RequiredKey[],
  },

  digital_transformation: {
    goal: 'digital_transformation',
    domain: 'strategy',
    labelEs: 'Transformación digital',
    keywords: [
      'transformación digital', 'madurez digital', 'digitalización', 'tecnología empresa',
      'automatización procesos', 'industria 4.0', 'innovation', 'innovación tecnológica',
    ],
    primaryTools: ['digital-maturity', 'strategic-plan', 'it-audit'],
    requiredEntities: ['company_name'] as RequiredKey[],
  },

  process_improvement: {
    goal: 'process_improvement',
    domain: 'operations',
    labelEs: 'Mejora e ingeniería de procesos',
    keywords: [
      'mapa de procesos', 'proceso', 'mejora procesos', 'optimización procesos',
      'procedimientos', 'flujo de trabajo', 'eficiencia', 'lean', 'bpm',
    ],
    primaryTools: ['process-map', 'corrective-action', 'preventive-action'],
    requiredEntities: [] as RequiredKey[],
  },

  // ── IT ────────────────────────────────────────────────────────────

  it_audit: {
    goal: 'it_audit',
    domain: 'it',
    labelEs: 'Auditoría IT',
    keywords: [
      'auditoría it', 'auditoría tecnológica', 'revisión sistemas', 'gobierno it',
      'ti', 'infraestructura it', 'sistemas informáticos', 'auditoria informatica',
    ],
    primaryTools: ['it-audit', 'iso27001-audit', 'hardware-inventory'],
    requiredEntities: [] as RequiredKey[],
  },

  it_infrastructure_management: {
    goal: 'it_infrastructure_management',
    domain: 'it',
    labelEs: 'Gestión de infraestructura IT',
    keywords: [
      'inventario hardware', 'inventario software', 'licencias', 'equipos',
      'gestión equipos', 'control activos it', 'parque informático', 'servidores',
    ],
    primaryTools: ['hardware-inventory', 'software-inventory', 'license-control'],
    requiredEntities: [] as RequiredKey[],
  },

  it_security_management: {
    goal: 'it_security_management',
    domain: 'it',
    labelEs: 'Gestión de seguridad IT',
    keywords: [
      'control accesos', 'permisos', 'usuarios', 'seguridad it', 'copias de seguridad',
      'backup', 'recuperación', 'incidentes seguridad', 'despliegue', 'deployment',
    ],
    primaryTools: ['access-control', 'backup-verification', 'deployment-checklist', 'it-incidents'],
    requiredEntities: [] as RequiredKey[],
  },

  // ── FINANCE & ADMIN ───────────────────────────────────────────────

  financial_control: {
    goal: 'financial_control',
    domain: 'finance',
    labelEs: 'Control financiero y gastos',
    keywords: [
      'gastos', 'control gastos', 'presupuesto', 'desviación presupuesto',
      'costes', 'contabilidad', 'finanzas', 'gasto empresa',
    ],
    primaryTools: ['expense-control', 'offer-comparison'],
    requiredEntities: [] as RequiredKey[],
  },

  asset_management: {
    goal: 'asset_management',
    domain: 'admin',
    labelEs: 'Gestión de activos empresariales',
    keywords: [
      'activos', 'inventario activos', 'patrimonio', 'bienes empresa',
      'gestión patrimonial', 'control activos',
    ],
    primaryTools: ['asset-inventory', 'hardware-inventory'],
    requiredEntities: [] as RequiredKey[],
  },
}

// ── Helper: todos los slugs de herramientas del catálogo ──────────

export function getAllCatalogTools(): string[] {
  return [...new Set(
    Object.values(GOAL_CATALOG).flatMap((def) => def.primaryTools),
  )]
}

// ── Helper: goals por dominio ──────────────────────────────────────

export function getGoalsByDomain(domain: string): CanonicalGoalDefinition[] {
  return Object.values(GOAL_CATALOG).filter((def) => def.domain === domain)
}
