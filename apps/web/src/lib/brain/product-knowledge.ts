import { allOfficialTools } from '@/registry/official'
import type { BrainFragment } from './brain-search'

interface ProductHelpEntry {
  id: string
  title: string
  body: string
  keywords: string[]
}

const SEARCH_STOPWORDS = new Set([
  'como',
  'funciona',
  'funcionan',
  'mitikus',
  'esto',
  'esta',
  'este',
  'para',
  'sirve',
  'sobre',
  'cual',
  'que',
  'del',
  'los',
  'las',
  'una',
  'uno',
  'con',
  'por',
])

const PRODUCT_HELP: ProductHelpEntry[] = [
  {
    id: 'section-today',
    title: 'Mi dia',
    body: 'Mi dia es el panel de arranque del workspace. Resume lo importante para trabajar hoy: primeros pasos, tareas pendientes, control horario, obligaciones fiscales proximas, facturas pendientes y avisos operativos. Sirve para saber por donde empezar sin recorrer todo MITIKUS.',
    keywords: ['mi dia', 'inicio', 'panel', 'hoy', 'primeros pasos', 'tareas', 'control horario', 'facturas pendientes'],
  },
  {
    id: 'section-arkos',
    title: 'Arkos',
    body: 'Arkos es el copiloto de MITIKUS. Ayuda a convertir una necesidad en una mision, orientar el siguiente paso y conectar herramientas, clientes, tareas y memoria del workspace. No sustituye la revision del usuario: propone y guia.',
    keywords: ['arkos', 'copiloto', 'asistente', 'mision', 'misiones', 'ayuda', 'siguiente paso'],
  },
  {
    id: 'section-brain',
    title: 'Brain',
    body: 'Brain permite preguntar a la memoria del workspace. Busca en documentos, memoria, conversaciones, herramientas y ayuda interna de MITIKUS. Cuando tiene fuentes las muestra; cuando no tiene evidencia debe decirlo claramente.',
    keywords: ['brain', 'memoria', 'preguntar', 'fuentes', 'evidencia', 'documentos', 'ayuda'],
  },
  {
    id: 'section-mail',
    title: 'Correo',
    body: 'Correo centraliza emails del workspace: recibidos, enviados, borradores, spam y papelera. Permite redactar, responder, vincular mensajes a clientes o facturas y usar la configuracion SMTP/IMAP del workspace para enviar y actualizar recibidos.',
    keywords: ['correo', 'email', 'smtp', 'imap', 'recibidos', 'enviados', 'responder', 'redactar', 'facturas'],
  },
  {
    id: 'section-clients',
    title: 'Clientes',
    body: 'Clientes guarda personas, autonomos o empresas a las que se presta servicio. Incluye tipo de cliente, empresa o nombre, contacto, email, NIF/CIF si hace falta, direccion fiscal, notas, archivos vinculados y accesos a facturas o correo.',
    keywords: ['clientes', 'cliente', 'empresa', 'contacto', 'autonomo', 'particular', 'nif', 'cif', 'archivos'],
  },
  {
    id: 'section-leads',
    title: 'Leads',
    body: 'Leads sirve para registrar oportunidades comerciales antes de que sean clientes. Ayuda a seguir contactos, interes, origen, estado y proximas acciones para convertirlos en clientes reales.',
    keywords: ['leads', 'oportunidades', 'ventas', 'prospectos', 'contactos comerciales'],
  },
  {
    id: 'section-tasks',
    title: 'Tareas',
    body: 'Tareas organiza trabajo pendiente del workspace. Permite priorizar acciones, asociarlas a clientes o misiones y controlar que lo importante no quede perdido entre conversaciones o documentos.',
    keywords: ['tareas', 'pendientes', 'prioridad', 'trabajo', 'acciones'],
  },
  {
    id: 'section-tools',
    title: 'Herramientas',
    body: 'Herramientas es el catalogo de pequenas apps operativas de MITIKUS. Cada herramienta resuelve un proceso concreto como redes sociales, solicitudes de compra, auditorias, revisiones, inventarios o checklist. Algunas pueden estar disponibles aunque aun no esten instaladas en el workspace.',
    keywords: ['herramientas', 'catalogo', 'apps', 'instalar', 'procesos', 'tool', 'tools'],
  },
  {
    id: 'section-flows',
    title: 'Flujos',
    body: 'Flujos agrupa automatizaciones o procesos por pasos dentro del workspace. Sirve para ordenar tareas repetibles y evitar que cada trabajo dependa de memoria manual.',
    keywords: ['flujos', 'workflow', 'automatizacion', 'procesos', 'pasos'],
  },
  {
    id: 'section-office',
    title: 'Mi Office',
    body: 'Mi Office concentra archivos y documentos del workspace. Permite guardar material, organizarlo en carpetas, vincularlo a clientes y exportar documentos del workspace cuando haga falta.',
    keywords: ['mi office', 'office', 'archivos', 'documentos', 'carpetas', 'galeria', 'almacenamiento'],
  },
  {
    id: 'section-missions',
    title: 'Misiones',
    body: 'Misiones organiza objetivos o trabajos importantes. Una mision puede reunir tareas, herramientas, contexto y seguimiento para avanzar en un resultado concreto del negocio.',
    keywords: ['misiones', 'mision', 'objetivos', 'proyectos', 'seguimiento'],
  },
  {
    id: 'section-fiscal',
    title: 'Fiscal',
    body: 'Fiscal ayuda a configurar los datos fiscales del workspace y ver obligaciones relevantes segun la forma juridica y pais. Tambien da acceso a calculos y recordatorios orientativos para preparar obligaciones.',
    keywords: ['fiscal', 'iva', 'irpf', 'modelo 303', 'modelo 130', 'aeat', 'autonomo', 'forma juridica'],
  },
  {
    id: 'section-invoices',
    title: 'Facturas',
    body: 'Facturas permite crear, emitir, enviar y descargar facturas. Usa los datos fiscales del emisor y del cliente, calcula bases, IVA y total, genera PDF y mantiene trazabilidad preparada para Verifactu sin afirmar remision real a AEAT hasta que exista esa integracion.',
    keywords: ['facturas', 'factura', 'emitir', 'pdf', 'iva', 'verifactu', 'aeat', 'enviar factura'],
  },
  {
    id: 'section-expenses',
    title: 'Gastos',
    body: 'Gastos sirve para registrar costes del negocio y conservar informacion asociada. Ayuda a controlar salidas de dinero y preparar mejor la vision financiera del workspace.',
    keywords: ['gastos', 'costes', 'compras', 'finanzas'],
  },
  {
    id: 'section-analytics',
    title: 'Analitica',
    body: 'Analitica resume datos de uso y actividad del workspace. Sirve para entender avances, volumen de trabajo, facturacion y senales relevantes sin revisar cada modulo manualmente.',
    keywords: ['analitica', 'metricas', 'datos', 'dashboard', 'actividad'],
  },
  {
    id: 'section-plan',
    title: 'Uso del plan',
    body: 'Uso del plan muestra limites y consumo del workspace, como consultas de IA, almacenamiento o capacidades disponibles segun el plan contratado.',
    keywords: ['uso del plan', 'plan', 'limites', 'suscripcion', 'almacenamiento', 'cuota'],
  },
  {
    id: 'section-audit',
    title: 'Auditoria',
    body: 'Auditoria registra eventos importantes del workspace para trazabilidad interna: acciones de usuarios, cambios relevantes y actividad que ayuda a entender que ha pasado.',
    keywords: ['auditoria', 'audit log', 'registro', 'trazabilidad', 'eventos'],
  },
  {
    id: 'section-admin-org',
    title: 'Admin Org',
    body: 'Admin Org gestiona ajustes de organizacion, miembros y permisos. Es una zona administrativa para roles con permiso suficiente.',
    keywords: ['admin org', 'organizacion', 'miembros', 'permisos', 'roles', 'rbac'],
  },
  {
    id: 'section-settings',
    title: 'Ajustes del workspace',
    body: 'Ajustes permite configurar marca, logo, nombre del workspace, datos visibles, correo y envios. Es donde se preparan datos que luego aparecen en sidebar, facturas o emails.',
    keywords: ['ajustes', 'configuracion', 'logo', 'marca', 'correo', 'envios', 'workspace'],
  },
  {
    id: 'section-profile',
    title: 'Mi perfil',
    body: 'Mi perfil gestiona datos personales visibles del usuario, como nombre, email y foto. Son datos del usuario, no de la empresa.',
    keywords: ['mi perfil', 'perfil', 'foto', 'usuario', 'cuenta'],
  },
  {
    id: 'section-support',
    title: 'Soporte',
    body: 'Soporte es el punto de ayuda cuando el usuario necesita asistencia. Puede servir para pedir ayuda sobre configuracion, facturacion, correo o funcionamiento general.',
    keywords: ['soporte', 'ayuda', 'contacto', 'incidencia'],
  },
  {
    id: 'section-timelog',
    title: 'Control horario',
    body: 'Control horario permite fichar entrada y salida desde cualquier seccion de MITIKUS. El boton de reloj aparece en la barra superior. Registra jornadas, acumula horas por dia y permite ver el historial de jornadas. Util para autonomos y trabajadores que necesitan justificar horas o controlar su tiempo de trabajo.',
    keywords: ['control horario', 'fichar', 'jornada', 'horas', 'timelog', 'entrada', 'salida', 'reloj'],
  },
  {
    id: 'section-notebooks',
    title: 'Cuadernos',
    body: 'Cuadernos son espacios de trabajo con IA donde el usuario puede cargar documentos, PDFs, textos o URLs como fuentes, y luego hacer preguntas o pedir resumenes sobre ese contenido. Cada cuaderno tiene su propio contexto independiente. Util para analizar informes, contratos o documentacion sin mezclar con la memoria general del workspace.',
    keywords: ['cuadernos', 'notebooks', 'cuaderno', 'notebook', 'documentos', 'pdf', 'ia', 'fuentes', 'resumir', 'analizar'],
  },
  {
    id: 'section-timelog-setup',
    title: 'Cómo usar el control horario',
    body: 'Para fichar: 1) Haz clic en el icono de reloj de la barra superior. 2) Pulsa "Iniciar jornada" para registrar la entrada. 3) Al terminar, vuelve a pulsar y selecciona "Finalizar jornada". Las jornadas quedan guardadas en el historial. Si cierras la sesion sin fichar la salida, el sistema preguntara al volver.',
    keywords: ['como fichar', 'como usar control horario', 'iniciar jornada', 'finalizar jornada', 'historial horas'],
  },
  {
    id: 'howto-mail-smtp',
    title: 'Cómo configurar el correo SMTP e IMAP',
    body: 'Para usar tu propio correo en MITIKUS: 1) Ve a Ajustes del workspace (icono de engranaje en el sidebar). 2) Busca la seccion "Correo". 3) Introduce los datos SMTP (servidor, puerto, usuario y contrasena) para poder enviar. 4) Introduce los datos IMAP (servidor, puerto, usuario y contrasena) para poder recibir y sincronizar. 5) Usa los botones "Probar SMTP" o "Probar IMAP" para verificar que la conexion funciona antes de guardar. 6) Guarda los cambios. Si usas Gmail, los datos suelen ser: SMTP smtp.gmail.com puerto 587, IMAP imap.gmail.com puerto 993. Necesitas activar acceso SMTP en tu cuenta de Google.',
    keywords: ['smtp', 'imap', 'configurar correo', 'como configurar email', 'servidor correo', 'gmail smtp', 'contrasena correo', 'ajustes correo'],
  },
  {
    id: 'howto-invoice-create',
    title: 'Cómo crear una factura',
    body: 'Para emitir una factura en MITIKUS: 1) Ve a la seccion Facturas en el sidebar. 2) Pulsa el boton "+ Nueva factura". 3) Selecciona el cliente (debe estar dado de alta en Clientes). 4) Revisa los datos fiscales del emisor — si faltan, ve a Ajustes y completa NIF, nombre fiscal y direccion. 5) Anade las lineas de concepto con descripcion, cantidad y precio. 6) MITIKUS calcula la base, IVA y total automaticamente. 7) Guarda la factura. 8) Descarga el PDF o enviala por correo desde la propia factura.',
    keywords: ['crear factura', 'nueva factura', 'emitir factura', 'como facturar', 'pdf factura', 'enviar factura', 'lineas factura', 'concepto'],
  },
  {
    id: 'howto-client-create',
    title: 'Cómo añadir un cliente',
    body: 'Para dar de alta un cliente: 1) Ve a la seccion Clientes en el sidebar. 2) Pulsa "+ Nuevo cliente". 3) Indica si es empresa, autonomo o particular. 4) Rellena nombre, email y, si vas a facturarle, su NIF/CIF y direccion fiscal. 5) Guarda. El cliente ya estara disponible para vincularlo a facturas, correos y tareas.',
    keywords: ['anadir cliente', 'nuevo cliente', 'dar de alta cliente', 'crear cliente', 'nif cliente', 'cif cliente'],
  },
  {
    id: 'howto-members-invite',
    title: 'Cómo invitar miembros al workspace',
    body: 'Para invitar a alguien: 1) Ve a Admin Org en el sidebar (necesitas permisos de administrador). 2) Pulsa "Invitar miembro". 3) Introduce el email de la persona. 4) Elige su rol: Administrador (acceso total), Editor (puede crear y editar) o Viewer (solo lectura). 5) La persona recibira un email con el enlace de invitacion. 6) Al aceptar, tendra acceso al workspace segun su rol.',
    keywords: ['invitar miembro', 'anadir usuario', 'nuevo miembro', 'roles', 'admin', 'editor', 'viewer', 'permisos', 'compartir workspace'],
  },
  {
    id: 'howto-signature-setup',
    title: 'Cómo configurar la firma de correo',
    body: 'Para establecer la firma que aparece en los correos enviados desde MITIKUS: 1) Ve a Ajustes del workspace. 2) Busca la seccion "Correo" o "Marca". 3) Encuentra el campo "Firma de correo". 4) Escribe o pega el texto de tu firma. 5) Guarda los cambios. La firma se anadira automaticamente al redactar nuevos correos desde el modulo Correo.',
    keywords: ['firma correo', 'firma email', 'signature', 'configurar firma', 'pie de correo'],
  },
  {
    id: 'section-verifactu',
    title: 'Verifactu',
    body: 'Verifactu es el sistema obligatorio de verificacion de facturas que exige la AEAT a partir de enero de 2026 (RD 1007/2023). Implica que cada factura lleve un hash encadenado y un codigo QR verificable por AEAT. MITIKUS prepara la trazabilidad necesaria en cada factura, pero aun no remite datos a AEAT directamente. La integracion de envio real se implementara antes del plazo legal. Para autonomos y empresas espanolas con software de facturacion propio, el cumplimiento de Verifactu sera obligatorio.',
    keywords: ['verifactu', 'aeat', 'hacienda', 'hash factura', 'qr factura', 'obligacion fiscal', 'rd 1007/2023', 'verificacion facturas'],
  },
  {
    id: 'section-plans-limits',
    title: 'Planes y límites de MITIKUS',
    body: 'MITIKUS ofrece distintos planes con diferentes capacidades. Los limites incluyen: consultas al Brain por mes, almacenamiento de archivos, numero de workspaces y funciones avanzadas. Puedes consultar el consumo actual en "Uso del plan" dentro de Ajustes. Si superas un limite, MITIKUS te avisara antes de bloquear la operacion. Para cambiar de plan o ampliar capacidades, ve a la seccion de suscripcion en Ajustes.',
    keywords: ['plan', 'planes', 'limites', 'suscripcion', 'upgrade', 'capacidad', 'almacenamiento', 'consultas brain', 'precio'],
  },
  {
    id: 'howto-leads-vs-clients',
    title: 'Diferencia entre Leads y Clientes',
    body: 'Leads son contactos que todavia no son clientes: personas o empresas con interes potencial. Se usan para seguir el proceso comercial antes de cerrar un acuerdo. Clientes son contactos con relacion activa a los que ya se presta servicio o se factura. Cuando un lead se convierte en cliente, se puede pasar a la seccion Clientes para empezar a facturarle y vincularlo a tareas o correos.',
    keywords: ['leads vs clientes', 'diferencia lead cliente', 'lead', 'prospecto', 'convertir lead', 'pipeline comercial'],
  },
  {
    id: 'howto-export-data',
    title: 'Cómo exportar o descargar datos',
    body: 'MITIKUS permite descargar facturas en PDF desde la propia factura, descargar archivos del expediente de un cliente desde Mi Office o desde la ficha del cliente. El modulo de Analitica permite ver datos de actividad. Si necesitas exportar un listado completo de facturas o clientes en formato CSV, usa la opcion de exportar disponible en cada seccion (icono de descarga). Para copias de seguridad completas del workspace, contacta con Soporte.',
    keywords: ['exportar', 'descargar', 'csv', 'pdf', 'backup', 'copia seguridad', 'factura pdf', 'listado facturas'],
  },
]

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function queryTokens(query: string): string[] {
  return normalize(query)
    .split(/[^a-z0-9]+/i)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3 && !SEARCH_STOPWORDS.has(token))
}

function scoreEntry(entry: ProductHelpEntry, tokens: string[]): number {
  const haystack = normalize(`${entry.title} ${entry.body} ${entry.keywords.join(' ')}`)
  const title = normalize(entry.title)
  let score = 0

  for (const token of tokens) {
    if (title.includes(token)) score += 3
    if (haystack.includes(token)) score += 1
  }

  for (const keyword of entry.keywords) {
    const normalizedKeyword = normalize(keyword)
    if (normalizedKeyword && normalize(tokens.join(' ')).includes(normalizedKeyword)) score += 4
  }

  return score
}

function toExcerpt(text: string): string {
  return text.length <= 450 ? text : `${text.slice(0, 447)}...`
}

function officialToolHelpEntries(): ProductHelpEntry[] {
  return allOfficialTools.map((tool) => {
    const tags = tool.meta.tags ?? []
    const keywords = tool.meta.keywords ?? []
    const synonyms = tool.meta.synonyms ?? []
    const name = tool.schema.name
    const category = tool.meta.displayCategory || tool.schema.category
    const minutes = tool.meta.estimatedMinutes
    const complexity = tool.meta.complexity
    const description = tool.schema.description

    return {
      id: `official-tool-${tool.schema.slug}`,
      title: `Herramienta: ${name}`,
      body: `${description} Categoria: ${category}. Complejidad: ${complexity}. Tiempo estimado: ${minutes} min. Estado: disponible en el catalogo oficial de MITIKUS; puede requerir instalacion en el workspace antes de usarla.`,
      keywords: [name, tool.schema.slug, category, complexity, ...tags, ...keywords, ...synonyms],
    }
  })
}

export function searchProductKnowledge(query: string): BrainFragment[] {
  const tokens = queryTokens(query)
  if (tokens.length === 0) return []

  const sectionMatches = PRODUCT_HELP
    .map((entry) => ({ entry, score: scoreEntry(entry, tokens) + 3 }))
    .filter(({ score }) => score > 3)

  const toolMatches = officialToolHelpEntries()
    .map((entry) => ({ entry, score: scoreEntry(entry, tokens) }))
    .filter(({ score }) => score > 1)

  return [...sectionMatches, ...toolMatches]
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map(({ entry, score }) => ({
      type: 'help' as const,
      id: entry.id,
      title: entry.title,
      excerpt: toExcerpt(entry.body),
      score: Number((0.05 + Math.min(score, 10) / 100).toFixed(4)),
    }))
}

