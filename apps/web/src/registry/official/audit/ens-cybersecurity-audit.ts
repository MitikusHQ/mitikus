import type { OfficialToolDefinition } from '../_types'
import { oid } from '../_helpers'

const DEMO_HALLAZGOS = `H01 | Alta | Control de accesos | Ausencia de MFA en usuarios críticos | Evidencia: captura de configuración Microsoft Entra ID | Riesgo: compromiso de correo corporativo, fraude de facturas y acceso no autorizado | Recomendación: activar MFA obligatorio empezando por cuentas de gerencia y administración | Responsable: IT externo | Plazo: 0-30 días | Estado: Abierto

H02 | Alta | Gestión de identidades | Cuenta administrativa compartida entre proveedor IT y personal interno | Evidencia: listado de usuarios administradores revisado durante auditoría | Riesgo: falta de trazabilidad individual y mayor exposición ante uso indebido | Recomendación: crear cuentas nominales y eliminar cuentas compartidas | Responsable: IT externo | Plazo: 0-30 días | Estado: Abierto

H03 | Alta | Continuidad de negocio | Copias de seguridad no verificadas mediante prueba de restauración documentada | Evidencia: consola de backup y ausencia de registros de restauración | Riesgo: imposibilidad de recuperar información tras ransomware o fallo grave | Recomendación: ejecutar prueba mensual de restauración y conservar evidencias | Responsable: IT externo | Plazo: 0-30 días | Estado: Abierto

H04 | Media | Gestión de activos | Inventario de activos incompleto: no incluye varios portátiles recientes | Evidencia: archivo Inventario_IT_2023.xlsx | Riesgo: dificultad para gestionar vulnerabilidades, licencias y renovaciones | Recomendación: crear inventario centralizado con propietario, ubicación y criticidad | Responsable: Administración / IT | Plazo: 30-90 días | Estado: Abierto

H05 | Media | Control de accesos | Política de contraseñas insuficiente: mínimo 8 caracteres, sin política formal documentada | Evidencia: configuración Microsoft 365 y entrevista con responsable IT | Riesgo: mayor exposición a robo o reutilización de credenciales | Recomendación: adoptar contraseñas robustas, MFA y bloqueo por intentos fallidos | Responsable: IT externo | Plazo: 30-90 días | Estado: Abierto

H06 | Media | Gestión de incidentes | Ausencia de procedimiento formal para identificar, escalar y registrar incidentes | Evidencia: no se aporta procedimiento documentado | Riesgo: respuesta desordenada, pérdida de evidencias y retrasos en contención | Recomendación: crear procedimiento básico con responsables, canales, tiempos y registro | Responsable: Gerencia / IT | Plazo: 30-90 días | Estado: Abierto

H07 | Media | Protección de la información | Documentos técnicos, contratos y nóminas sin clasificación formal de información | Evidencia: revisión de servidor de ficheros | Riesgo: acceso inadecuado a información sensible | Recomendación: definir categorías: pública, interna, confidencial y restringida | Responsable: Gerencia / Administración | Plazo: 90-180 días | Estado: Abierto

H08 | Media | Control de accesos | Permisos excesivos: usuarios de producción acceden a carpetas administrativas con documentación económica | Evidencia: revisión de permisos en servidor de ficheros | Riesgo: acceso innecesario a información financiera | Recomendación: revisar permisos por departamento, aplicar mínimo privilegio | Responsable: IT externo | Plazo: 30-90 días | Estado: Abierto

H09 | Media | Seguridad de dispositivos | Tres portátiles comerciales sin cifrado de disco activado | Evidencia: muestreo de equipos durante auditoría | Riesgo: acceso no autorizado a datos corporativos en caso de pérdida o robo | Recomendación: activar BitLocker o equivalente en todos los portátiles | Responsable: IT externo | Plazo: 0-30 días | Estado: Abierto

H10 | Media | Concienciación | Sin sesiones de formación en ciberseguridad en los últimos 24 meses | Evidencia: entrevista con gerencia y ausencia de registros formativos | Riesgo: mayor probabilidad de phishing, malware o fraude por email | Recomendación: implantar formación anual y simulaciones periódicas de phishing | Responsable: Gerencia / RRHH | Plazo: 90-180 días | Estado: Abierto`

export const ensCybersecurityAudit: OfficialToolDefinition = {
  meta: {
    displayCategory: 'Auditoría',
    icon: '🛡️',
    color: '#0F172A',
    tags: ['ens', 'iso27001', 'ciberseguridad', 'pyme', 'auditoría', 'seguridad'],
    keywords: [
      'auditoría ciberseguridad', 'ens', 'esquema nacional seguridad', 'iso 27001',
      'pyme seguridad', 'diagnóstico ciberseguridad', 'informe seguridad', 'hallazgos seguridad',
      'plan acción ciberseguridad', 'pentesting', 'auditoria informatica',
    ],
    synonyms: ['cyber audit', 'security audit pyme', 'auditoría ens iso 27001'],
    complexity: 'advanced',
    estimatedMinutes: 120,
  },
  schema: {
    id: oid(52),
    slug: 'ens-cybersecurity-audit',
    name: 'Auditoría de Ciberseguridad ENS / ISO 27001',
    description: 'Herramienta vertical para consultoras IT: recoge datos del cliente, hallazgos de auditoría y genera informes profesionales alineados con ENS e ISO 27001 para pymes.',
    category: 'audit',
    version: '1',
    isPublic: true,
    createdBy: 'official',
    aiPrompt: `Eres un consultor senior de ciberseguridad y auditor ENS/ISO 27001 con experiencia en pymes. Trabajas para una consultora IT que entrega informes profesionales a clientes.

REGLAS:
- No inventes evidencias ni controles no mencionados
- Separa HECHOS (evidencias aportadas) de ESTIMACIONES (riesgos inferidos)
- Indica incertidumbre cuando falten datos
- No afirmes cumplimiento total si el diagnóstico es parcial
- No hagas recomendaciones inviables para pymes
- Mapea a ENS/ISO 27001 solo cuando hay base suficiente
- Sin afirmaciones legales absolutas, sin alarmismo

SALIDAS SEGÚN EL TIPO SOLICITADO:
• Resumen ejecutivo: tabla de hallazgos por severidad, 3-5 prioridades inmediatas, lenguaje de gerencia sin tecnicismos
• Informe técnico completo: portada contextual, hallazgos con código/severidad/área/descripción/evidencia/riesgo/recomendación y referencia ENS/ISO 27001 si procede
• Plan de acción: tabla por plazos (0-30d / 30-90d / 90-180d) con responsable y coste estimado (bajo/medio/alto)
• Matriz de riesgos: tabla hallazgo/probabilidad/impacto/nivel resultante/control sugerido
• Checklist de evidencias pendientes: documentación que aún falta recopilar
• Email de entrega al cliente: correo profesional breve con adjuntos sugeridos

SIEMPRE: ordena por Crítica > Alta > Media > Baja > Observación. Usa tablas markdown. Adapta el lenguaje al sector y tamaño indicados.

El campo HALLAZGOS contiene todos los hallazgos de la auditoría en formato "H01 | Severidad | Área | Título | Evidencia | Riesgo | Recomendación | Responsable | Plazo | Estado". Parsea cada hallazgo y úsalos tal como están. No inventes hallazgos adicionales.`,
    permissions: { defaultMemberRole: 'EDITOR', allowPublicShare: false },
    dataSchema: {
      fields: {
        // ── Sección 1: Datos del cliente ──────────────────────────
        nombre_cliente: {
          type: 'string',
          label: 'Nombre del cliente',
          required: true,
          placeholder: 'Ej: Industrias Mecánicas Valverde S.L.',
        },
        sector: {
          type: 'string',
          label: 'Sector',
          required: true,
          placeholder: 'Ej: Industrial / Manufactura',
        },
        pais: {
          type: 'string',
          label: 'País',
          required: false,
          placeholder: 'España',
        },
        num_empleados: {
          type: 'number',
          label: 'Número aproximado de empleados',
          required: false,
          min: 1,
        },
        tipo_cliente: {
          type: 'select',
          label: 'Tipo de cliente',
          required: true,
          options: [
            'Pyme industrial',
            'Retail',
            'Administración pública',
            'Proveedor de administración pública',
            'SaaS / Tecnología',
            'Servicios profesionales',
            'Otro',
          ],
        },
        // ── Sección 2: Objetivo de auditoría ─────────────────────
        objetivo_auditoria: {
          type: 'select',
          label: 'Objetivo de la auditoría',
          required: true,
          options: [
            'Diagnóstico inicial de ciberseguridad',
            'Preparación ENS',
            'Preparación ISO 27001',
            'Revisión Microsoft 365',
            'Auditoría interna',
            'Revisión post-incidente',
            'Auditoría para cliente final',
          ],
        },
        // ── Sección 3: Marco de referencia ───────────────────────
        marcos_referencia: {
          type: 'multiselect',
          label: 'Marco de referencia',
          required: false,
          options: [
            'ENS',
            'ISO 27001',
            'ISO 27002',
            'RGPD',
            'CIS Controls',
            'NIST CSF',
            'Buenas prácticas generales',
          ],
          helpText: 'Selecciona los marcos que aplican a esta auditoría.',
        },
        // ── Sección 4: Alcance ────────────────────────────────────
        alcance: {
          type: 'multiselect',
          label: 'Alcance de la auditoría',
          required: false,
          options: [
            'Microsoft 365',
            'Google Workspace',
            'Red local',
            'Servidores',
            'Copias de seguridad',
            'Puestos de usuario',
            'Accesos remotos',
            'Firewall / VPN',
            'Directorio activo / Entra ID',
            'Proveedor IT externo',
            'Sistemas industriales / OT',
            'Aplicaciones SaaS',
            'Gestión de usuarios',
            'Procedimientos internos',
            'Formación y concienciación',
          ],
          helpText: 'Marca los sistemas y áreas que se han revisado.',
        },
        // ── Sección 5: Evidencias ─────────────────────────────────
        evidencias_disponibles: {
          type: 'textarea',
          label: 'Evidencias disponibles',
          required: false,
          rows: 6,
          placeholder:
            'Inventario_IT_2023.xlsx\nContrato proveedor IT externo\nCapturas de configuración Microsoft 365\n...',
          helpText:
            'Lista los documentos y capturas que el cliente ha aportado o que has revisado durante la auditoría.',
        },
        // ── Sección 6: Hallazgos ──────────────────────────────────
        hallazgos: {
          type: 'textarea',
          label: 'Hallazgos de la auditoría',
          required: true,
          rows: 20,
          placeholder:
            'H01 | Alta | Control de accesos | Ausencia de MFA en usuarios críticos | Evidencia: captura Entra ID | Riesgo: compromiso de cuentas | Recomendación: activar MFA obligatorio | Responsable: IT externo | Plazo: 0-30 días | Estado: Abierto\n\nH02 | ...',
          helpText:
            'Un hallazgo por párrafo. Formato recomendado: Código | Severidad | Área | Título | Evidencia | Riesgo | Recomendación | Responsable | Plazo | Estado',
        },
        // ── Campos de la tabla de seguimiento (no en el FORM principal) ──
        codigo_hallazgo: {
          type: 'string',
          label: 'Código',
          required: false,
          placeholder: 'H01',
        },
        titulo_hallazgo: {
          type: 'string',
          label: 'Título del hallazgo',
          required: false,
          placeholder: 'Ausencia de MFA en usuarios críticos',
        },
        severidad_hallazgo: {
          type: 'select',
          label: 'Severidad',
          required: false,
          options: ['Crítica', 'Alta', 'Media', 'Baja', 'Observación'],
        },
        area_hallazgo: {
          type: 'select',
          label: 'Área',
          required: false,
          options: [
            'Control de accesos',
            'Copias de seguridad',
            'Gestión de activos',
            'Gestión de incidentes',
            'Protección de la información',
            'Seguridad de dispositivos',
            'Concienciación',
            'Continuidad de negocio',
            'Cumplimiento',
            'Gestión de identidades',
            'Otro',
          ],
        },
        responsable_hallazgo: {
          type: 'string',
          label: 'Responsable sugerido',
          required: false,
          placeholder: 'IT externo',
        },
        plazo_hallazgo: {
          type: 'select',
          label: 'Plazo recomendado',
          required: false,
          options: ['0-30 días', '30-90 días', '90-180 días', 'Más de 180 días'],
        },
        estado_hallazgo: {
          type: 'select',
          label: 'Estado',
          required: false,
          options: ['Abierto', 'En curso', 'Mitigado', 'Aceptado', 'Cerrado'],
        },
        fecha_objetivo_hallazgo: {
          type: 'date',
          label: 'Fecha objetivo',
          required: false,
        },
        notas_hallazgo: {
          type: 'textarea',
          label: 'Notas de seguimiento',
          required: false,
        },
        // ── Sección 7: Tipo de salida ─────────────────────────────
        tipo_salida: {
          type: 'multiselect',
          label: 'Tipo de salida a generar',
          required: true,
          options: [
            'Resumen ejecutivo para gerencia',
            'Informe técnico completo',
            'Plan de acción priorizado',
            'Matriz de riesgos',
            'Checklist de evidencias pendientes',
            'Email de entrega al cliente',
          ],
          helpText: 'Puedes seleccionar varios. La IA generará cada uno en el orden indicado.',
        },
      },
    },
    capabilities: [
      {
        type: 'FORM',
        instanceId: 'form-auditoria-ens',
        label: 'Generar informe',
        isDefault: true,
        config: {
          layout: 'sections',
          submitLabel: '✨ Generar informe con IA',
          sections: [
            {
              id: 'cliente',
              title: '1. Datos del cliente',
              fieldIds: ['nombre_cliente', 'sector', 'pais', 'num_empleados', 'tipo_cliente'],
            },
            {
              id: 'objetivo',
              title: '2. Objetivo de auditoría',
              fieldIds: ['objetivo_auditoria'],
            },
            {
              id: 'marco',
              title: '3. Marco de referencia',
              fieldIds: ['marcos_referencia'],
            },
            {
              id: 'alcance',
              title: '4. Alcance',
              fieldIds: ['alcance'],
            },
            {
              id: 'evidencias',
              title: '5. Evidencias disponibles',
              fieldIds: ['evidencias_disponibles'],
            },
            {
              id: 'hallazgos',
              title: '6. Hallazgos',
              fieldIds: ['hallazgos'],
            },
            {
              id: 'salida',
              title: '7. Tipo de salida',
              fieldIds: ['tipo_salida'],
            },
          ],
        },
      },
      {
        type: 'TABLE',
        instanceId: 'tabla-seguimiento-hallazgos',
        label: 'Seguimiento de hallazgos',
        isDefault: false,
        config: {
          columns: [
            { fieldId: 'codigo_hallazgo', label: 'Código' },
            { fieldId: 'titulo_hallazgo', label: 'Título' },
            { fieldId: 'severidad_hallazgo', label: 'Severidad' },
            { fieldId: 'area_hallazgo', label: 'Área' },
            { fieldId: 'responsable_hallazgo', label: 'Responsable' },
            { fieldId: 'plazo_hallazgo', label: 'Plazo' },
            { fieldId: 'estado_hallazgo', label: 'Estado' },
            { fieldId: 'fecha_objetivo_hallazgo', label: 'Fecha objetivo' },
            { fieldId: 'notas_hallazgo', label: 'Notas' },
          ],
          defaultSortField: 'severidad_hallazgo',
          showCreateButton: true,
        },
      },
    ],
  },
}

/** Datos demo precargados para la herramienta */
export const ENS_DEMO_VALUES: Record<string, string> = {
  nombre_cliente: 'Industrias Mecánicas Valverde S.L.',
  sector: 'Industrial / Manufactura',
  pais: 'España',
  num_empleados: '42',
  tipo_cliente: 'Pyme industrial',
  objetivo_auditoria: 'Diagnóstico inicial de ciberseguridad',
  marcos_referencia: 'ENS, ISO 27001, Buenas prácticas generales',
  alcance: 'Microsoft 365, Servidores, Copias de seguridad, Puestos de usuario, Accesos remotos, Proveedor IT externo',
  evidencias_disponibles: `Inventario_IT_2023.xlsx
Contrato proveedor IT externo
Capturas de configuración Microsoft 365
Política interna de uso de equipos (versión 2022)
Registro parcial de copias de seguridad
Listado de usuarios activos
Estructura de carpetas compartidas`,
  hallazgos: DEMO_HALLAZGOS,
  tipo_salida: 'Resumen ejecutivo para gerencia, Plan de acción priorizado',
}
