// Calendario fiscal multi-país 2025-2026

export type LegalForm = 'autonomo' | 'sl' | 'sa' | 'comunidad' | 'cooperativa' | 'asociacion' | 'fundacion' | 'otro'

export type Country = 'ES' | 'FR' | 'PT' | 'IT' | 'BE' | 'DE' | 'US' | 'CA' | 'IL'

export type FiscalEventStatus = 'vencido' | 'proximo' | 'pendiente' | 'sin_aplica'

export interface FiscalEvent {
  id:          string
  modelo:      string
  titulo:      string
  descripcion: string
  deadline:    Date
  periodo:     string
  aplica:      string[]   // legalForms ([] = aplica a todos)
  url:         string
  country:     Country
}

export interface FiscalEventWithStatus extends FiscalEvent {
  status:   FiscalEventStatus
  daysLeft: number | null
}

function d(y: number, m: number, day: number) {
  return new Date(y, m - 1, day)
}

// ── España ──────────────────────────────────────────────────────────────────
// Abreviaturas de grupos para aplica[]
// IVA_SUJETOS   : todos los que realizan actividad económica sujeta a IVA
// RETENCIONES   : todos los que pueden tener empleados o pagar alquileres
// IS_SUJETOS    : entidades sujetas al Impuesto sobre Sociedades
// REG_MERC      : entidades con obligación de depósito en Registro Mercantil
// COMUNIDAD     : solo comunidades de bienes
// AUTONOMO      : solo autónomos persona física

const IVA_SUJETOS  = ['autonomo','sl','sa','comunidad','cooperativa','asociacion','fundacion','otro'] as const
const RETENCIONES  = ['autonomo','sl','sa','comunidad','cooperativa','asociacion','fundacion','otro'] as const
const IS_SUJETOS   = ['sl','sa','cooperativa','asociacion','fundacion','otro'] as const
const REG_MERC     = ['sl','sa','cooperativa'] as const

const EVENTS_ES: FiscalEvent[] = [
  // ══════════════════════════════════════════════════════════════════
  // TRIMESTRALES 2025 (todas vencidas, se conservan para historial)
  // ══════════════════════════════════════════════════════════════════
  // Q1 2025 (plazo: 20 abr 2025)
  { id: 'es-303-q1-2025', modelo: '303', titulo: 'IVA 1T 2025',              descripcion: 'Declaración trimestral IVA (ene–mar 2025)',                             deadline: d(2025,4,20),  periodo: 'Q1 2025', aplica: [...IVA_SUJETOS], url: 'https://sede.agenciatributaria.gob.es/Sede/iva/modelo-303.html',                                      country: 'ES' },
  { id: 'es-130-q1-2025', modelo: '130', titulo: 'IRPF fraccionado 1T 2025', descripcion: 'Pago fraccionado IRPF estimación directa (ene–mar 2025)',               deadline: d(2025,4,20),  periodo: 'Q1 2025', aplica: ['autonomo'],          url: 'https://sede.agenciatributaria.gob.es/Sede/irpf/modelo-130.html',                                     country: 'ES' },
  { id: 'es-111-q1-2025', modelo: '111', titulo: 'Retenciones trab. 1T 2025', descripcion: 'Retenciones IRPF trabajadores y profesionales (si procede) Q1 2025',   deadline: d(2025,4,20),  periodo: 'Q1 2025', aplica: [...RETENCIONES],     url: 'https://sede.agenciatributaria.gob.es/Sede/retenciones-ingresos-cuenta/modelo-111.html',             country: 'ES' },
  { id: 'es-115-q1-2025', modelo: '115', titulo: 'Ret. arrendamiento 1T 2025', descripcion: 'Retenciones sobre arrendamientos de inmuebles (si procede) Q1 2025',  deadline: d(2025,4,20),  periodo: 'Q1 2025', aplica: [...RETENCIONES],     url: 'https://sede.agenciatributaria.gob.es/Sede/retenciones-ingresos-cuenta/modelo-115.html',             country: 'ES' },
  { id: 'es-202-1p-2025', modelo: '202', titulo: 'Pago fraccionado IS 1P 2025', descripcion: '1er pago fraccionado Impuesto sobre Sociedades 2025',                  deadline: d(2025,4,20),  periodo: '1P 2025', aplica: [...IS_SUJETOS],      url: 'https://sede.agenciatributaria.gob.es/Sede/impuesto-sobre-sociedades/modelo-202.html',               country: 'ES' },
  // Q2 2025 (plazo: 20 jul 2025)
  { id: 'es-303-q2-2025', modelo: '303', titulo: 'IVA 2T 2025',              descripcion: 'Declaración trimestral IVA (abr–jun 2025)',                             deadline: d(2025,7,20),  periodo: 'Q2 2025', aplica: [...IVA_SUJETOS], url: 'https://sede.agenciatributaria.gob.es/Sede/iva/modelo-303.html',                                      country: 'ES' },
  { id: 'es-130-q2-2025', modelo: '130', titulo: 'IRPF fraccionado 2T 2025', descripcion: 'Pago fraccionado IRPF estimación directa (abr–jun 2025)',               deadline: d(2025,7,20),  periodo: 'Q2 2025', aplica: ['autonomo'],          url: 'https://sede.agenciatributaria.gob.es/Sede/irpf/modelo-130.html',                                     country: 'ES' },
  { id: 'es-111-q2-2025', modelo: '111', titulo: 'Retenciones trab. 2T 2025', descripcion: 'Retenciones IRPF trabajadores y profesionales (si procede) Q2 2025',   deadline: d(2025,7,20),  periodo: 'Q2 2025', aplica: [...RETENCIONES],     url: 'https://sede.agenciatributaria.gob.es/Sede/retenciones-ingresos-cuenta/modelo-111.html',             country: 'ES' },
  { id: 'es-115-q2-2025', modelo: '115', titulo: 'Ret. arrendamiento 2T 2025', descripcion: 'Retenciones sobre arrendamientos de inmuebles (si procede) Q2 2025',  deadline: d(2025,7,20),  periodo: 'Q2 2025', aplica: [...RETENCIONES],     url: 'https://sede.agenciatributaria.gob.es/Sede/retenciones-ingresos-cuenta/modelo-115.html',             country: 'ES' },
  // Q3 2025 (plazo: 20 oct 2025)
  { id: 'es-303-q3-2025', modelo: '303', titulo: 'IVA 3T 2025',              descripcion: 'Declaración trimestral IVA (jul–sep 2025)',                             deadline: d(2025,10,20), periodo: 'Q3 2025', aplica: [...IVA_SUJETOS], url: 'https://sede.agenciatributaria.gob.es/Sede/iva/modelo-303.html',                                      country: 'ES' },
  { id: 'es-130-q3-2025', modelo: '130', titulo: 'IRPF fraccionado 3T 2025', descripcion: 'Pago fraccionado IRPF estimación directa (jul–sep 2025)',               deadline: d(2025,10,20), periodo: 'Q3 2025', aplica: ['autonomo'],          url: 'https://sede.agenciatributaria.gob.es/Sede/irpf/modelo-130.html',                                     country: 'ES' },
  { id: 'es-111-q3-2025', modelo: '111', titulo: 'Retenciones trab. 3T 2025', descripcion: 'Retenciones IRPF trabajadores y profesionales (si procede) Q3 2025',   deadline: d(2025,10,20), periodo: 'Q3 2025', aplica: [...RETENCIONES],     url: 'https://sede.agenciatributaria.gob.es/Sede/retenciones-ingresos-cuenta/modelo-111.html',             country: 'ES' },
  { id: 'es-115-q3-2025', modelo: '115', titulo: 'Ret. arrendamiento 3T 2025', descripcion: 'Retenciones sobre arrendamientos de inmuebles (si procede) Q3 2025',  deadline: d(2025,10,20), periodo: 'Q3 2025', aplica: [...RETENCIONES],     url: 'https://sede.agenciatributaria.gob.es/Sede/retenciones-ingresos-cuenta/modelo-115.html',             country: 'ES' },
  { id: 'es-202-2p-2025', modelo: '202', titulo: 'Pago fraccionado IS 2P 2025', descripcion: '2º pago fraccionado Impuesto sobre Sociedades 2025',                  deadline: d(2025,10,20), periodo: '2P 2025', aplica: [...IS_SUJETOS],      url: 'https://sede.agenciatributaria.gob.es/Sede/impuesto-sobre-sociedades/modelo-202.html',               country: 'ES' },
  // Q4 2025 (plazo: 20 ene 2026)
  { id: 'es-303-q4-2025', modelo: '303', titulo: 'IVA 4T 2025',              descripcion: 'Declaración trimestral IVA (oct–dic 2025)',                             deadline: d(2026,1,20),  periodo: 'Q4 2025', aplica: [...IVA_SUJETOS], url: 'https://sede.agenciatributaria.gob.es/Sede/iva/modelo-303.html',                                      country: 'ES' },
  { id: 'es-130-q4-2025', modelo: '130', titulo: 'IRPF fraccionado 4T 2025', descripcion: 'Pago fraccionado IRPF estimación directa (oct–dic 2025)',               deadline: d(2026,1,20),  periodo: 'Q4 2025', aplica: ['autonomo'],          url: 'https://sede.agenciatributaria.gob.es/Sede/irpf/modelo-130.html',                                     country: 'ES' },
  { id: 'es-111-q4-2025', modelo: '111', titulo: 'Retenciones trab. 4T 2025', descripcion: 'Retenciones IRPF trabajadores y profesionales (si procede) Q4 2025',   deadline: d(2026,1,20),  periodo: 'Q4 2025', aplica: [...RETENCIONES],     url: 'https://sede.agenciatributaria.gob.es/Sede/retenciones-ingresos-cuenta/modelo-111.html',             country: 'ES' },
  { id: 'es-115-q4-2025', modelo: '115', titulo: 'Ret. arrendamiento 4T 2025', descripcion: 'Retenciones sobre arrendamientos de inmuebles (si procede) Q4 2025',  deadline: d(2026,1,20),  periodo: 'Q4 2025', aplica: [...RETENCIONES],     url: 'https://sede.agenciatributaria.gob.es/Sede/retenciones-ingresos-cuenta/modelo-115.html',             country: 'ES' },
  { id: 'es-202-3p-2025', modelo: '202', titulo: 'Pago fraccionado IS 3P 2025', descripcion: '3er pago fraccionado Impuesto sobre Sociedades 2025',                  deadline: d(2025,12,20), periodo: '3P 2025', aplica: [...IS_SUJETOS],      url: 'https://sede.agenciatributaria.gob.es/Sede/impuesto-sobre-sociedades/modelo-202.html',               country: 'ES' },

  // ══════════════════════════════════════════════════════════════════
  // ANUALES ejercicio 2024 (plazos en 2025 — todas vencidas)
  // ══════════════════════════════════════════════════════════════════
  { id: 'es-347-2024',   modelo: '347',       titulo: 'Op. con terceros 2024',          descripcion: 'Operaciones con terceros >3.000 € ejercicio 2024',                   deadline: d(2025,2,28),  periodo: 'Anual 2024', aplica: [...IVA_SUJETOS], url: 'https://sede.agenciatributaria.gob.es/Sede/iva/modelo-347.html',                             country: 'ES' },
  { id: 'es-390-2024',   modelo: '390',       titulo: 'Resumen anual IVA 2024',         descripcion: 'Declaración resumen anual IVA ejercicio 2024',                        deadline: d(2025,1,30),  periodo: 'Anual 2024', aplica: [...IVA_SUJETOS], url: 'https://sede.agenciatributaria.gob.es/Sede/iva/modelo-390.html',                             country: 'ES' },
  { id: 'es-190-2024',   modelo: '190',       titulo: 'Resumen retenciones 2024',       descripcion: 'Resumen anual retenciones e ingresos a cuenta ejercicio 2024',        deadline: d(2025,1,31),  periodo: 'Anual 2024', aplica: [...RETENCIONES], url: 'https://sede.agenciatributaria.gob.es/Sede/retenciones-ingresos-cuenta/modelo-190.html',     country: 'ES' },
  { id: 'es-184-2024',   modelo: '184',       titulo: 'Atribución de rentas 2024',      descripcion: 'Entidades en régimen de atribución de rentas ejercicio 2024',         deadline: d(2025,3,31),  periodo: 'Anual 2024', aplica: ['comunidad'],    url: 'https://sede.agenciatributaria.gob.es/Sede/irpf/modelo-184.html',                            country: 'ES' },
  { id: 'es-100-2024',   modelo: '100',       titulo: 'Declaración de la Renta 2024',   descripcion: 'IRPF anual ejercicio 2024 — autónomos en estimación directa',         deadline: d(2025,6,30),  periodo: 'Anual 2024', aplica: ['autonomo'],     url: 'https://sede.agenciatributaria.gob.es/Sede/irpf.html',                                       country: 'ES' },
  { id: 'es-200-2024',   modelo: '200',       titulo: 'Impuesto sobre Sociedades 2024', descripcion: 'IS anual ejercicio 2024 (cooperativas tipo 20%, asoc/fund tipo 10%)', deadline: d(2025,7,25),  periodo: 'Anual 2024', aplica: [...IS_SUJETOS],  url: 'https://sede.agenciatributaria.gob.es/Sede/impuesto-sobre-sociedades/modelo-200.html',       country: 'ES' },
  { id: 'es-rm-2024',    modelo: 'Reg. Merc.', titulo: 'Depósito cuentas 2024',         descripcion: 'Depósito de cuentas anuales en Registro Mercantil (6 meses del cierre)', deadline: d(2025,7,31), periodo: 'Anual 2024', aplica: [...REG_MERC],   url: 'https://www.registradores.org',                                                              country: 'ES' },

  // ══════════════════════════════════════════════════════════════════
  // ANUALES ejercicio 2025 (plazos en 2026 — algunos aún visibles)
  // ══════════════════════════════════════════════════════════════════
  { id: 'es-390-2025',   modelo: '390',       titulo: 'Resumen anual IVA 2025',         descripcion: 'Declaración resumen anual IVA ejercicio 2025',                        deadline: d(2026,1,30),  periodo: 'Anual 2025', aplica: [...IVA_SUJETOS], url: 'https://sede.agenciatributaria.gob.es/Sede/iva/modelo-390.html',                             country: 'ES' },
  { id: 'es-190-2025',   modelo: '190',       titulo: 'Resumen retenciones 2025',       descripcion: 'Resumen anual retenciones e ingresos a cuenta ejercicio 2025',        deadline: d(2026,1,31),  periodo: 'Anual 2025', aplica: [...RETENCIONES], url: 'https://sede.agenciatributaria.gob.es/Sede/retenciones-ingresos-cuenta/modelo-190.html',     country: 'ES' },
  { id: 'es-347-2025',   modelo: '347',       titulo: 'Op. con terceros 2025',          descripcion: 'Operaciones con terceros >3.000 € ejercicio 2025',                   deadline: d(2026,2,28),  periodo: 'Anual 2025', aplica: [...IVA_SUJETOS], url: 'https://sede.agenciatributaria.gob.es/Sede/iva/modelo-347.html',                             country: 'ES' },
  { id: 'es-184-2025',   modelo: '184',       titulo: 'Atribución de rentas 2025',      descripcion: 'Entidades en régimen de atribución de rentas ejercicio 2025',         deadline: d(2026,3,31),  periodo: 'Anual 2025', aplica: ['comunidad'],    url: 'https://sede.agenciatributaria.gob.es/Sede/irpf/modelo-184.html',                            country: 'ES' },
  { id: 'es-100-2025',   modelo: '100',       titulo: 'Declaración de la Renta 2025',   descripcion: 'IRPF anual ejercicio 2025 — autónomos en estimación directa',         deadline: d(2026,6,30),  periodo: 'Anual 2025', aplica: ['autonomo'],     url: 'https://sede.agenciatributaria.gob.es/Sede/irpf.html',                                       country: 'ES' },
  { id: 'es-200-2025',   modelo: '200',       titulo: 'Impuesto sobre Sociedades 2025', descripcion: 'IS anual ejercicio 2025 (cooperativas tipo 20%, asoc/fund tipo 10%)', deadline: d(2026,7,25),  periodo: 'Anual 2025', aplica: [...IS_SUJETOS],  url: 'https://sede.agenciatributaria.gob.es/Sede/impuesto-sobre-sociedades/modelo-200.html',       country: 'ES' },
  { id: 'es-rm-2025',    modelo: 'Reg. Merc.', titulo: 'Depósito cuentas 2025',         descripcion: 'Depósito de cuentas anuales en Registro Mercantil (6 meses del cierre)', deadline: d(2026,7,31), periodo: 'Anual 2025', aplica: [...REG_MERC],   url: 'https://www.registradores.org',                                                              country: 'ES' },

  // ══════════════════════════════════════════════════════════════════
  // TRIMESTRALES 2026
  // ══════════════════════════════════════════════════════════════════
  // Q1 2026 (plazo: 20 abr 2026)
  { id: 'es-303-q1-2026', modelo: '303', titulo: 'IVA 1T 2026',              descripcion: 'Declaración trimestral IVA (ene–mar 2026)',                             deadline: d(2026,4,20),  periodo: 'Q1 2026', aplica: [...IVA_SUJETOS], url: 'https://sede.agenciatributaria.gob.es/Sede/iva/modelo-303.html',                                      country: 'ES' },
  { id: 'es-130-q1-2026', modelo: '130', titulo: 'IRPF fraccionado 1T 2026', descripcion: 'Pago fraccionado IRPF estimación directa (ene–mar 2026)',               deadline: d(2026,4,20),  periodo: 'Q1 2026', aplica: ['autonomo'],          url: 'https://sede.agenciatributaria.gob.es/Sede/irpf/modelo-130.html',                                     country: 'ES' },
  { id: 'es-111-q1-2026', modelo: '111', titulo: 'Retenciones trab. 1T 2026', descripcion: 'Retenciones IRPF trabajadores y profesionales (si procede) Q1 2026',   deadline: d(2026,4,20),  periodo: 'Q1 2026', aplica: [...RETENCIONES],     url: 'https://sede.agenciatributaria.gob.es/Sede/retenciones-ingresos-cuenta/modelo-111.html',             country: 'ES' },
  { id: 'es-115-q1-2026', modelo: '115', titulo: 'Ret. arrendamiento 1T 2026', descripcion: 'Retenciones sobre arrendamientos de inmuebles (si procede) Q1 2026',  deadline: d(2026,4,20),  periodo: 'Q1 2026', aplica: [...RETENCIONES],     url: 'https://sede.agenciatributaria.gob.es/Sede/retenciones-ingresos-cuenta/modelo-115.html',             country: 'ES' },
  { id: 'es-202-1p-2026', modelo: '202', titulo: 'Pago fraccionado IS 1P 2026', descripcion: '1er pago fraccionado Impuesto sobre Sociedades 2026',                  deadline: d(2026,4,20),  periodo: '1P 2026', aplica: [...IS_SUJETOS],      url: 'https://sede.agenciatributaria.gob.es/Sede/impuesto-sobre-sociedades/modelo-202.html',               country: 'ES' },
  // Q2 2026 (plazo: 20 jul 2026)
  { id: 'es-303-q2-2026', modelo: '303', titulo: 'IVA 2T 2026',              descripcion: 'Declaración trimestral IVA (abr–jun 2026)',                             deadline: d(2026,7,20),  periodo: 'Q2 2026', aplica: [...IVA_SUJETOS], url: 'https://sede.agenciatributaria.gob.es/Sede/iva/modelo-303.html',                                      country: 'ES' },
  { id: 'es-130-q2-2026', modelo: '130', titulo: 'IRPF fraccionado 2T 2026', descripcion: 'Pago fraccionado IRPF estimación directa (abr–jun 2026)',               deadline: d(2026,7,20),  periodo: 'Q2 2026', aplica: ['autonomo'],          url: 'https://sede.agenciatributaria.gob.es/Sede/irpf/modelo-130.html',                                     country: 'ES' },
  { id: 'es-111-q2-2026', modelo: '111', titulo: 'Retenciones trab. 2T 2026', descripcion: 'Retenciones IRPF trabajadores y profesionales (si procede) Q2 2026',   deadline: d(2026,7,20),  periodo: 'Q2 2026', aplica: [...RETENCIONES],     url: 'https://sede.agenciatributaria.gob.es/Sede/retenciones-ingresos-cuenta/modelo-111.html',             country: 'ES' },
  { id: 'es-115-q2-2026', modelo: '115', titulo: 'Ret. arrendamiento 2T 2026', descripcion: 'Retenciones sobre arrendamientos de inmuebles (si procede) Q2 2026',  deadline: d(2026,7,20),  periodo: 'Q2 2026', aplica: [...RETENCIONES],     url: 'https://sede.agenciatributaria.gob.es/Sede/retenciones-ingresos-cuenta/modelo-115.html',             country: 'ES' },
  // Q3 2026 (plazo: 20 oct 2026)
  { id: 'es-303-q3-2026', modelo: '303', titulo: 'IVA 3T 2026',              descripcion: 'Declaración trimestral IVA (jul–sep 2026)',                             deadline: d(2026,10,20), periodo: 'Q3 2026', aplica: [...IVA_SUJETOS], url: 'https://sede.agenciatributaria.gob.es/Sede/iva/modelo-303.html',                                      country: 'ES' },
  { id: 'es-130-q3-2026', modelo: '130', titulo: 'IRPF fraccionado 3T 2026', descripcion: 'Pago fraccionado IRPF estimación directa (jul–sep 2026)',               deadline: d(2026,10,20), periodo: 'Q3 2026', aplica: ['autonomo'],          url: 'https://sede.agenciatributaria.gob.es/Sede/irpf/modelo-130.html',                                     country: 'ES' },
  { id: 'es-111-q3-2026', modelo: '111', titulo: 'Retenciones trab. 3T 2026', descripcion: 'Retenciones IRPF trabajadores y profesionales (si procede) Q3 2026',   deadline: d(2026,10,20), periodo: 'Q3 2026', aplica: [...RETENCIONES],     url: 'https://sede.agenciatributaria.gob.es/Sede/retenciones-ingresos-cuenta/modelo-111.html',             country: 'ES' },
  { id: 'es-115-q3-2026', modelo: '115', titulo: 'Ret. arrendamiento 3T 2026', descripcion: 'Retenciones sobre arrendamientos de inmuebles (si procede) Q3 2026',  deadline: d(2026,10,20), periodo: 'Q3 2026', aplica: [...RETENCIONES],     url: 'https://sede.agenciatributaria.gob.es/Sede/retenciones-ingresos-cuenta/modelo-115.html',             country: 'ES' },
  { id: 'es-202-2p-2026', modelo: '202', titulo: 'Pago fraccionado IS 2P 2026', descripcion: '2º pago fraccionado Impuesto sobre Sociedades 2026',                  deadline: d(2026,10,20), periodo: '2P 2026', aplica: [...IS_SUJETOS],      url: 'https://sede.agenciatributaria.gob.es/Sede/impuesto-sobre-sociedades/modelo-202.html',               country: 'ES' },
  // 3P IS diciembre 2026
  { id: 'es-202-3p-2026', modelo: '202', titulo: 'Pago fraccionado IS 3P 2026', descripcion: '3er pago fraccionado Impuesto sobre Sociedades 2026',                  deadline: d(2026,12,20), periodo: '3P 2026', aplica: [...IS_SUJETOS],      url: 'https://sede.agenciatributaria.gob.es/Sede/impuesto-sobre-sociedades/modelo-202.html',               country: 'ES' },
  // Q4 2026 (plazo: 20 ene 2027)
  { id: 'es-303-q4-2026', modelo: '303', titulo: 'IVA 4T 2026',              descripcion: 'Declaración trimestral IVA (oct–dic 2026)',                             deadline: d(2027,1,20),  periodo: 'Q4 2026', aplica: [...IVA_SUJETOS], url: 'https://sede.agenciatributaria.gob.es/Sede/iva/modelo-303.html',                                      country: 'ES' },
  { id: 'es-130-q4-2026', modelo: '130', titulo: 'IRPF fraccionado 4T 2026', descripcion: 'Pago fraccionado IRPF estimación directa (oct–dic 2026)',               deadline: d(2027,1,20),  periodo: 'Q4 2026', aplica: ['autonomo'],          url: 'https://sede.agenciatributaria.gob.es/Sede/irpf/modelo-130.html',                                     country: 'ES' },
  { id: 'es-111-q4-2026', modelo: '111', titulo: 'Retenciones trab. 4T 2026', descripcion: 'Retenciones IRPF trabajadores y profesionales (si procede) Q4 2026',   deadline: d(2027,1,20),  periodo: 'Q4 2026', aplica: [...RETENCIONES],     url: 'https://sede.agenciatributaria.gob.es/Sede/retenciones-ingresos-cuenta/modelo-111.html',             country: 'ES' },
  { id: 'es-115-q4-2026', modelo: '115', titulo: 'Ret. arrendamiento 4T 2026', descripcion: 'Retenciones sobre arrendamientos de inmuebles (si procede) Q4 2026',  deadline: d(2027,1,20),  periodo: 'Q4 2026', aplica: [...RETENCIONES],     url: 'https://sede.agenciatributaria.gob.es/Sede/retenciones-ingresos-cuenta/modelo-115.html',             country: 'ES' },

  // ══════════════════════════════════════════════════════════════════
  // ANUALES ejercicio 2026 (plazos en 2027)
  // ══════════════════════════════════════════════════════════════════
  { id: 'es-390-2026',   modelo: '390',       titulo: 'Resumen anual IVA 2026',         descripcion: 'Declaración resumen anual IVA ejercicio 2026',                        deadline: d(2027,1,30),  periodo: 'Anual 2026', aplica: [...IVA_SUJETOS], url: 'https://sede.agenciatributaria.gob.es/Sede/iva/modelo-390.html',                             country: 'ES' },
  { id: 'es-190-2026',   modelo: '190',       titulo: 'Resumen retenciones 2026',       descripcion: 'Resumen anual retenciones e ingresos a cuenta ejercicio 2026',        deadline: d(2027,1,31),  periodo: 'Anual 2026', aplica: [...RETENCIONES], url: 'https://sede.agenciatributaria.gob.es/Sede/retenciones-ingresos-cuenta/modelo-190.html',     country: 'ES' },
  { id: 'es-347-2026',   modelo: '347',       titulo: 'Op. con terceros 2026',          descripcion: 'Operaciones con terceros >3.000 € ejercicio 2026',                   deadline: d(2027,2,28),  periodo: 'Anual 2026', aplica: [...IVA_SUJETOS], url: 'https://sede.agenciatributaria.gob.es/Sede/iva/modelo-347.html',                             country: 'ES' },
  { id: 'es-184-2026',   modelo: '184',       titulo: 'Atribución de rentas 2026',      descripcion: 'Entidades en régimen de atribución de rentas ejercicio 2026',         deadline: d(2027,3,31),  periodo: 'Anual 2026', aplica: ['comunidad'],    url: 'https://sede.agenciatributaria.gob.es/Sede/irpf/modelo-184.html',                            country: 'ES' },
  { id: 'es-100-2026',   modelo: '100',       titulo: 'Declaración de la Renta 2026',   descripcion: 'IRPF anual ejercicio 2026 — autónomos en estimación directa',         deadline: d(2027,6,30),  periodo: 'Anual 2026', aplica: ['autonomo'],     url: 'https://sede.agenciatributaria.gob.es/Sede/irpf.html',                                       country: 'ES' },
  { id: 'es-200-2026',   modelo: '200',       titulo: 'Impuesto sobre Sociedades 2026', descripcion: 'IS anual ejercicio 2026 (cooperativas tipo 20%, asoc/fund tipo 10%)', deadline: d(2027,7,25),  periodo: 'Anual 2026', aplica: [...IS_SUJETOS],  url: 'https://sede.agenciatributaria.gob.es/Sede/impuesto-sobre-sociedades/modelo-200.html',       country: 'ES' },
  { id: 'es-rm-2026',    modelo: 'Reg. Merc.', titulo: 'Depósito cuentas 2026',         descripcion: 'Depósito de cuentas anuales en Registro Mercantil (6 meses del cierre)', deadline: d(2027,7,31), periodo: 'Anual 2026', aplica: [...REG_MERC],   url: 'https://www.registradores.org',                                                              country: 'ES' },
]

// ── Francia ─────────────────────────────────────────────────────────────────

const EVENTS_FR: FiscalEvent[] = [
  { id: 'fr-tva-q1-2025', modelo: 'TVA',  titulo: 'TVA 1er trimestre',        descripcion: 'Déclaration trimestrielle de TVA (jan–mar 2025)',    deadline: d(2025, 4, 30),  periodo: 'Q1 2025',    aplica: [], url: 'https://www.impots.gouv.fr/professionnel/la-tva',                             country: 'FR' },
  { id: 'fr-tva-q2-2025', modelo: 'TVA',  titulo: 'TVA 2e trimestre',         descripcion: 'Déclaration trimestrielle de TVA (avr–jun 2025)',    deadline: d(2025, 7, 31),  periodo: 'Q2 2025',    aplica: [], url: 'https://www.impots.gouv.fr/professionnel/la-tva',                             country: 'FR' },
  { id: 'fr-tva-q3-2025', modelo: 'TVA',  titulo: 'TVA 3e trimestre',         descripcion: 'Déclaration trimestrielle de TVA (jul–sep 2025)',    deadline: d(2025, 10, 31), periodo: 'Q3 2025',    aplica: [], url: 'https://www.impots.gouv.fr/professionnel/la-tva',                             country: 'FR' },
  { id: 'fr-tva-q4-2025', modelo: 'TVA',  titulo: 'TVA 4e trimestre',         descripcion: 'Déclaration trimestrielle de TVA (oct–déc 2025)',    deadline: d(2026, 1, 31),  periodo: 'Q4 2025',    aplica: [], url: 'https://www.impots.gouv.fr/professionnel/la-tva',                             country: 'FR' },
  { id: 'fr-is-2024',     modelo: 'IS',   titulo: 'Impôt sur les Sociétés',   descripcion: 'IS exercice 2024 (sociétés clôture 31/12)',          deadline: d(2025, 5, 15),  periodo: 'Anual 2024', aplica: [], url: 'https://www.impots.gouv.fr/professionnel/impot-sur-les-societes',              country: 'FR' },
  { id: 'fr-ir-2024',     modelo: 'IR',   titulo: 'Déclaration revenus 2024', descripcion: 'Impôt sur le revenu exercice 2024',                  deadline: d(2025, 5, 22),  periodo: 'Anual 2024', aplica: [], url: 'https://www.impots.gouv.fr/particulier/declaration-de-revenus',               country: 'FR' },
  { id: 'fr-cfe-2025',    modelo: 'CFE',  titulo: 'Cotisation Foncière',      descripcion: 'Cotisation Foncière des Entreprises 2025',           deadline: d(2025, 12, 15), periodo: 'Anual 2025', aplica: [], url: 'https://www.impots.gouv.fr/professionnel/cotisation-fonciere-des-entreprises', country: 'FR' },
]

// ── Portugal ─────────────────────────────────────────────────────────────────

const EVENTS_PT: FiscalEvent[] = [
  { id: 'pt-iva-q1-2025', modelo: 'IVA',        titulo: 'IVA 1º trimestre',        descripcion: 'Declaração periódica IVA (jan–mar 2025)',              deadline: d(2025, 5, 15),  periodo: 'Q1 2025',    aplica: [], url: 'https://info.portaldasfinancas.gov.pt/pt/apoio_contribuinte/guias/Pages/iva.aspx', country: 'PT' },
  { id: 'pt-iva-q2-2025', modelo: 'IVA',        titulo: 'IVA 2º trimestre',        descripcion: 'Declaração periódica IVA (abr–jun 2025)',              deadline: d(2025, 8, 15),  periodo: 'Q2 2025',    aplica: [], url: 'https://info.portaldasfinancas.gov.pt/pt/apoio_contribuinte/guias/Pages/iva.aspx', country: 'PT' },
  { id: 'pt-iva-q3-2025', modelo: 'IVA',        titulo: 'IVA 3º trimestre',        descripcion: 'Declaração periódica IVA (jul–set 2025)',              deadline: d(2025, 11, 15), periodo: 'Q3 2025',    aplica: [], url: 'https://info.portaldasfinancas.gov.pt/pt/apoio_contribuinte/guias/Pages/iva.aspx', country: 'PT' },
  { id: 'pt-irc-2024',    modelo: 'IRC',        titulo: 'IRC exercício 2024',      descripcion: 'Imposto sobre o Rendimento das Pessoas Coletivas 2024', deadline: d(2025, 5, 31),  periodo: 'Anual 2024', aplica: [], url: 'https://info.portaldasfinancas.gov.pt/pt/apoio_contribuinte/guias/Pages/irc.aspx', country: 'PT' },
  { id: 'pt-irs-2024',    modelo: 'IRS',        titulo: 'IRS exercício 2024',      descripcion: 'Declaração de rendimentos IRS 2024',                  deadline: d(2025, 6, 30),  periodo: 'Anual 2024', aplica: [], url: 'https://info.portaldasfinancas.gov.pt/pt/apoio_contribuinte/guias/Pages/irs.aspx', country: 'PT' },
  { id: 'pt-ies-2024',    modelo: 'IES',        titulo: 'IES / DA 2024',           descripcion: 'Informação Empresarial Simplificada exercício 2024',   deadline: d(2025, 7, 15),  periodo: 'Anual 2024', aplica: [], url: 'https://info.portaldasfinancas.gov.pt/pt/apoio_contribuinte/guias/Pages/ies.aspx', country: 'PT' },
  { id: 'pt-pec-2025',    modelo: 'PEC',        titulo: 'Pagamento Especial Conta', descripcion: 'PEC exercício 2025 (prazo normal: março)',             deadline: d(2025, 3, 31),  periodo: 'Anual 2025', aplica: [], url: 'https://info.portaldasfinancas.gov.pt/pt/apoio_contribuinte/guias/Pages/irc.aspx', country: 'PT' },
]

// ── Italia ───────────────────────────────────────────────────────────────────

const EVENTS_IT: FiscalEvent[] = [
  { id: 'it-iva-q1-2025', modelo: 'IVA',  titulo: 'Liquidazione IVA Q1',       descripcion: 'Liquidazione trimestrale IVA (gen–mar 2025)',        deadline: d(2025, 5, 16),  periodo: 'Q1 2025',    aplica: [], url: 'https://www.agenziaentrate.gov.it/portale/web/guest/iva', country: 'IT' },
  { id: 'it-iva-q2-2025', modelo: 'IVA',  titulo: 'Liquidazione IVA Q2',       descripcion: 'Liquidazione trimestrale IVA (apr–giu 2025)',        deadline: d(2025, 8, 20),  periodo: 'Q2 2025',    aplica: [], url: 'https://www.agenziaentrate.gov.it/portale/web/guest/iva', country: 'IT' },
  { id: 'it-iva-q3-2025', modelo: 'IVA',  titulo: 'Liquidazione IVA Q3',       descripcion: 'Liquidazione trimestrale IVA (lug–set 2025)',        deadline: d(2025, 11, 17), periodo: 'Q3 2025',    aplica: [], url: 'https://www.agenziaentrate.gov.it/portale/web/guest/iva', country: 'IT' },
  { id: 'it-ires-2024',   modelo: 'IRES', titulo: 'IRES esercizio 2024',       descripcion: 'Imposta sul Reddito delle Società 2024',            deadline: d(2025, 11, 30), periodo: 'Anual 2024', aplica: [], url: 'https://www.agenziaentrate.gov.it/portale/web/guest/ires', country: 'IT' },
  { id: 'it-irap-2024',   modelo: 'IRAP', titulo: 'IRAP esercizio 2024',       descripcion: 'Imposta Regionale sulle Attività Produttive 2024',  deadline: d(2025, 11, 30), periodo: 'Anual 2024', aplica: [], url: 'https://www.agenziaentrate.gov.it/portale/web/guest/irap', country: 'IT' },
  { id: 'it-730-2024',    modelo: '730',  titulo: 'Dichiarazione 730 2024',    descripcion: 'Dichiarazione dei redditi persone fisiche 2024',     deadline: d(2025, 9, 30),  periodo: 'Anual 2024', aplica: [], url: 'https://www.agenziaentrate.gov.it/portale/web/guest/dichiarazione-730', country: 'IT' },
  { id: 'it-f24-q1-2025', modelo: 'F24',  titulo: 'Versamenti F24 Q1',         descripcion: 'Pagamenti contributivi e fiscali (Q1 2025)',         deadline: d(2025, 4, 16),  periodo: 'Q1 2025',    aplica: [], url: 'https://www.agenziaentrate.gov.it/portale/web/guest/modello-f24', country: 'IT' },
]

// ── Bélgica ──────────────────────────────────────────────────────────────────

const EVENTS_BE: FiscalEvent[] = [
  { id: 'be-tva-q1-2025', modelo: 'TVA',  titulo: 'TVA 1er trimestre',         descripcion: 'Déclaration trimestrielle TVA (jan–mar 2025)',       deadline: d(2025, 4, 20),  periodo: 'Q1 2025',    aplica: [], url: 'https://finances.belgium.be/fr/entreprises/tva',      country: 'BE' },
  { id: 'be-tva-q2-2025', modelo: 'TVA',  titulo: 'TVA 2e trimestre',          descripcion: 'Déclaration trimestrielle TVA (avr–jun 2025)',       deadline: d(2025, 7, 20),  periodo: 'Q2 2025',    aplica: [], url: 'https://finances.belgium.be/fr/entreprises/tva',      country: 'BE' },
  { id: 'be-tva-q3-2025', modelo: 'TVA',  titulo: 'TVA 3e trimestre',          descripcion: 'Déclaration trimestrielle TVA (jul–sep 2025)',       deadline: d(2025, 10, 20), periodo: 'Q3 2025',    aplica: [], url: 'https://finances.belgium.be/fr/entreprises/tva',      country: 'BE' },
  { id: 'be-tva-q4-2025', modelo: 'TVA',  titulo: 'TVA 4e trimestre',          descripcion: 'Déclaration trimestrielle TVA (oct–déc 2025)',       deadline: d(2026, 1, 20),  periodo: 'Q4 2025',    aplica: [], url: 'https://finances.belgium.be/fr/entreprises/tva',      country: 'BE' },
  { id: 'be-isoc-2024',   modelo: 'ISOC', titulo: 'Impôt Sociétés 2024',       descripcion: 'Impôt des sociétés exercice 2024',                  deadline: d(2025, 9, 25),  periodo: 'Anual 2024', aplica: [], url: 'https://finances.belgium.be/fr/entreprises/impot-des-societes', country: 'BE' },
  { id: 'be-ipp-2024',    modelo: 'IPP',  titulo: 'Impôt Personnes Physiques', descripcion: 'Déclaration à l\'impôt des personnes physiques 2024', deadline: d(2025, 7, 15),  periodo: 'Anual 2024', aplica: [], url: 'https://finances.belgium.be/fr/particuliers/impot-des-personnes-physiques', country: 'BE' },
  { id: 'be-onss-q1-2025', modelo: 'ONSS', titulo: 'Cotisations ONSS Q1',      descripcion: 'Cotisations sociales patronales (Q1 2025)',          deadline: d(2025, 4, 30),  periodo: 'Q1 2025',    aplica: [], url: 'https://www.onss.be',                                country: 'BE' },
]

// ── Alemania ─────────────────────────────────────────────────────────────────

const EVENTS_DE: FiscalEvent[] = [
  { id: 'de-ust-q1-2025', modelo: 'USt',   titulo: 'Umsatzsteuer Q1',           descripcion: 'Umsatzsteuer-Voranmeldung (Jan–Mär 2025)',          deadline: d(2025, 4, 10),  periodo: 'Q1 2025',    aplica: [], url: 'https://www.bzst.de/DE/Unternehmen/Umsatzsteuer/umsatzsteuer_node.html', country: 'DE' },
  { id: 'de-ust-q2-2025', modelo: 'USt',   titulo: 'Umsatzsteuer Q2',           descripcion: 'Umsatzsteuer-Voranmeldung (Apr–Jun 2025)',          deadline: d(2025, 7, 10),  periodo: 'Q2 2025',    aplica: [], url: 'https://www.bzst.de/DE/Unternehmen/Umsatzsteuer/umsatzsteuer_node.html', country: 'DE' },
  { id: 'de-ust-q3-2025', modelo: 'USt',   titulo: 'Umsatzsteuer Q3',           descripcion: 'Umsatzsteuer-Voranmeldung (Jul–Sep 2025)',          deadline: d(2025, 10, 10), periodo: 'Q3 2025',    aplica: [], url: 'https://www.bzst.de/DE/Unternehmen/Umsatzsteuer/umsatzsteuer_node.html', country: 'DE' },
  { id: 'de-ust-q4-2025', modelo: 'USt',   titulo: 'Umsatzsteuer Q4',           descripcion: 'Umsatzsteuer-Voranmeldung (Okt–Dez 2025)',          deadline: d(2026, 1, 10),  periodo: 'Q4 2025',    aplica: [], url: 'https://www.bzst.de/DE/Unternehmen/Umsatzsteuer/umsatzsteuer_node.html', country: 'DE' },
  { id: 'de-kst-2024',    modelo: 'KSt',   titulo: 'Körperschaftsteuer 2024',   descripcion: 'Körperschaftsteuererklärung Geschäftsjahr 2024',    deadline: d(2025, 7, 31),  periodo: 'Anual 2024', aplica: [], url: 'https://www.bundesfinanzministerium.de/Web/DE/Themen/Steuern/Unternehmenssteuern/koerperschaftsteuer.html', country: 'DE' },
  { id: 'de-est-2024',    modelo: 'ESt',   titulo: 'Einkommensteuer 2024',      descripcion: 'Einkommensteuererklärung 2024',                     deadline: d(2025, 7, 31),  periodo: 'Anual 2024', aplica: [], url: 'https://www.bundesfinanzministerium.de/Web/DE/Themen/Steuern/einkommensteuer.html', country: 'DE' },
  { id: 'de-gew-2024',    modelo: 'GewSt', titulo: 'Gewerbesteuer 2024',        descripcion: 'Gewerbesteuererklärung Geschäftsjahr 2024',         deadline: d(2025, 7, 31),  periodo: 'Anual 2024', aplica: [], url: 'https://www.bundesfinanzministerium.de/Web/DE/Themen/Steuern/gewerbesteuer.html', country: 'DE' },
]

// ── Estados Unidos ───────────────────────────────────────────────────────────

const EVENTS_US: FiscalEvent[] = [
  { id: 'us-est-q1-2025', modelo: 'Est. Tax', titulo: 'Estimated Tax Q1 2025',   descripcion: 'Federal estimated tax payment — Jan 1–Mar 31 2025',  deadline: d(2025, 4, 15),  periodo: 'Q1 2025',    aplica: [], url: 'https://www.irs.gov/businesses/small-businesses-self-employed/estimated-taxes', country: 'US' },
  { id: 'us-est-q2-2025', modelo: 'Est. Tax', titulo: 'Estimated Tax Q2 2025',   descripcion: 'Federal estimated tax payment — Apr 1–May 31 2025',  deadline: d(2025, 6, 16),  periodo: 'Q2 2025',    aplica: [], url: 'https://www.irs.gov/businesses/small-businesses-self-employed/estimated-taxes', country: 'US' },
  { id: 'us-est-q3-2025', modelo: 'Est. Tax', titulo: 'Estimated Tax Q3 2025',   descripcion: 'Federal estimated tax payment — Jun 1–Aug 31 2025',  deadline: d(2025, 9, 15),  periodo: 'Q3 2025',    aplica: [], url: 'https://www.irs.gov/businesses/small-businesses-self-employed/estimated-taxes', country: 'US' },
  { id: 'us-est-q4-2025', modelo: 'Est. Tax', titulo: 'Estimated Tax Q4 2025',   descripcion: 'Federal estimated tax payment — Sep 1–Dec 31 2025',  deadline: d(2026, 1, 15),  periodo: 'Q4 2025',    aplica: [], url: 'https://www.irs.gov/businesses/small-businesses-self-employed/estimated-taxes', country: 'US' },
  { id: 'us-1040-2024',   modelo: '1040',     titulo: 'Form 1040 — 2024',        descripcion: 'Individual Income Tax Return fiscal year 2024',       deadline: d(2025, 4, 15),  periodo: 'Anual 2024', aplica: [], url: 'https://www.irs.gov/forms-pubs/about-form-1040',              country: 'US' },
  { id: 'us-1120-2024',   modelo: '1120',     titulo: 'Form 1120 — 2024',        descripcion: 'Corporate Income Tax Return fiscal year 2024',        deadline: d(2025, 4, 15),  periodo: 'Anual 2024', aplica: [], url: 'https://www.irs.gov/forms-pubs/about-form-1120',              country: 'US' },
  { id: 'us-940-2024',    modelo: '940',      titulo: 'Form 940 — FUTA 2024',    descripcion: 'Federal Unemployment Tax Return 2024',               deadline: d(2025, 1, 31),  periodo: 'Anual 2024', aplica: [], url: 'https://www.irs.gov/forms-pubs/about-form-940',              country: 'US' },
  { id: 'us-941-q1-2025', modelo: '941',      titulo: 'Form 941 Q1 2025',        descripcion: 'Employer\'s Quarterly Federal Tax Return Q1',         deadline: d(2025, 4, 30),  periodo: 'Q1 2025',    aplica: [], url: 'https://www.irs.gov/forms-pubs/about-form-941',              country: 'US' },
  { id: 'us-941-q2-2025', modelo: '941',      titulo: 'Form 941 Q2 2025',        descripcion: 'Employer\'s Quarterly Federal Tax Return Q2',         deadline: d(2025, 7, 31),  periodo: 'Q2 2025',    aplica: [], url: 'https://www.irs.gov/forms-pubs/about-form-941',              country: 'US' },
  { id: 'us-941-q3-2025', modelo: '941',      titulo: 'Form 941 Q3 2025',        descripcion: 'Employer\'s Quarterly Federal Tax Return Q3',         deadline: d(2025, 10, 31), periodo: 'Q3 2025',    aplica: [], url: 'https://www.irs.gov/forms-pubs/about-form-941',              country: 'US' },
]

// ── Canadá ───────────────────────────────────────────────────────────────────

const EVENTS_CA: FiscalEvent[] = [
  { id: 'ca-gst-q1-2025', modelo: 'GST/HST', titulo: 'GST/HST Q1 2025',        descripcion: 'Quarterly GST/HST return (Jan–Mar 2025)',            deadline: d(2025, 4, 30),  periodo: 'Q1 2025',    aplica: [], url: 'https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/gst-hst-businesses.html', country: 'CA' },
  { id: 'ca-gst-q2-2025', modelo: 'GST/HST', titulo: 'GST/HST Q2 2025',        descripcion: 'Quarterly GST/HST return (Apr–Jun 2025)',            deadline: d(2025, 7, 31),  periodo: 'Q2 2025',    aplica: [], url: 'https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/gst-hst-businesses.html', country: 'CA' },
  { id: 'ca-gst-q3-2025', modelo: 'GST/HST', titulo: 'GST/HST Q3 2025',        descripcion: 'Quarterly GST/HST return (Jul–Sep 2025)',            deadline: d(2025, 10, 31), periodo: 'Q3 2025',    aplica: [], url: 'https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/gst-hst-businesses.html', country: 'CA' },
  { id: 'ca-gst-q4-2025', modelo: 'GST/HST', titulo: 'GST/HST Q4 2025',        descripcion: 'Quarterly GST/HST return (Oct–Dec 2025)',            deadline: d(2026, 1, 31),  periodo: 'Q4 2025',    aplica: [], url: 'https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/gst-hst-businesses.html', country: 'CA' },
  { id: 'ca-t1-2024',     modelo: 'T1',      titulo: 'T1 Personal Tax Return',  descripcion: 'Personal income tax return fiscal year 2024',        deadline: d(2025, 4, 30),  periodo: 'Anual 2024', aplica: [], url: 'https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return.html', country: 'CA' },
  { id: 'ca-t2-2024',     modelo: 'T2',      titulo: 'T2 Corporate Tax Return', descripcion: 'Corporate income tax return (6 months after year-end)', deadline: d(2025, 6, 30), periodo: 'Anual 2024', aplica: [], url: 'https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/corporations/corporation-income-tax-return.html', country: 'CA' },
  { id: 'ca-t4-2024',     modelo: 'T4',      titulo: 'T4 Slips — 2024',         descripcion: 'Statement of Remuneration Paid (employees)',         deadline: d(2025, 2, 28),  periodo: 'Anual 2024', aplica: [], url: 'https://www.canada.ca/en/revenue-agency/services/forms-publications/publications/t4001.html', country: 'CA' },
]

// ── Israel ────────────────────────────────────────────────────────────────────

const EVENTS_IL: FiscalEvent[] = [
  { id: 'il-vat-feb-2025', modelo: 'VAT',    titulo: 'VAT — Febrero 2025',       descripcion: 'Monthly VAT return (January 2025)',                   deadline: d(2025, 2, 15),  periodo: 'Ene 2025',   aplica: [], url: 'https://www.gov.il/en/departments/israel_tax_authority', country: 'IL' },
  { id: 'il-vat-apr-2025', modelo: 'VAT',    titulo: 'VAT — Abril 2025',         descripcion: 'Monthly VAT return (March 2025)',                     deadline: d(2025, 4, 15),  periodo: 'Mar 2025',   aplica: [], url: 'https://www.gov.il/en/departments/israel_tax_authority', country: 'IL' },
  { id: 'il-vat-jun-2025', modelo: 'VAT',    titulo: 'VAT — Junio 2025',         descripcion: 'Monthly VAT return (May 2025)',                       deadline: d(2025, 6, 15),  periodo: 'May 2025',   aplica: [], url: 'https://www.gov.il/en/departments/israel_tax_authority', country: 'IL' },
  { id: 'il-vat-aug-2025', modelo: 'VAT',    titulo: 'VAT — Agosto 2025',        descripcion: 'Monthly VAT return (July 2025)',                      deadline: d(2025, 8, 15),  periodo: 'Jul 2025',   aplica: [], url: 'https://www.gov.il/en/departments/israel_tax_authority', country: 'IL' },
  { id: 'il-vat-oct-2025', modelo: 'VAT',    titulo: 'VAT — Octubre 2025',       descripcion: 'Monthly VAT return (September 2025)',                 deadline: d(2025, 10, 15), periodo: 'Sep 2025',   aplica: [], url: 'https://www.gov.il/en/departments/israel_tax_authority', country: 'IL' },
  { id: 'il-vat-dec-2025', modelo: 'VAT',    titulo: 'VAT — Diciembre 2025',     descripcion: 'Monthly VAT return (November 2025)',                  deadline: d(2025, 12, 15), periodo: 'Nov 2025',   aplica: [], url: 'https://www.gov.il/en/departments/israel_tax_authority', country: 'IL' },
  { id: 'il-corp-2024',    modelo: 'Corp Tax', titulo: 'Corporate Tax 2024',     descripcion: 'Annual corporate income tax return 2024',             deadline: d(2025, 4, 30),  periodo: 'Anual 2024', aplica: [], url: 'https://www.gov.il/en/departments/israel_tax_authority', country: 'IL' },
  { id: 'il-pers-2024',    modelo: 'Mas Hachnasa', titulo: 'Mas Hachnasa 2024', descripcion: 'Annual personal income tax return (מס הכנסה) 2024', deadline: d(2025, 4, 30),  periodo: 'Anual 2024', aplica: [], url: 'https://www.gov.il/en/departments/israel_tax_authority', country: 'IL' },
  { id: 'il-adv-q1-2025',  modelo: 'Mekadmot', titulo: 'Advance Payments Q1',   descripcion: 'Monthly advance income tax payments (Q1 2025)',       deadline: d(2025, 4, 15),  periodo: 'Q1 2025',    aplica: [], url: 'https://www.gov.il/en/departments/israel_tax_authority', country: 'IL' },
]

// ── Mapa por país ─────────────────────────────────────────────────────────────

const EVENTS_BY_COUNTRY: Record<Country, FiscalEvent[]> = {
  ES: EVENTS_ES,
  FR: EVENTS_FR,
  PT: EVENTS_PT,
  IT: EVENTS_IT,
  BE: EVENTS_BE,
  DE: EVENTS_DE,
  US: EVENTS_US,
  CA: EVENTS_CA,
  IL: EVENTS_IL,
}

// ── Funciones públicas ────────────────────────────────────────────────────────

// Formas jurídicas que heredan las obligaciones de 'otro' hasta tener datos específicos
const LEGALFORM_FALLBACK: Record<string, string> = {
  cooperativa: 'otro',
  asociacion:  'otro',
  fundacion:   'otro',
}

export function getFiscalEvents(country: string, legalForm?: string | null): FiscalEventWithStatus[] {
  const countryKey = (country as Country) in EVENTS_BY_COUNTRY ? (country as Country) : 'ES'
  const events = EVENTS_BY_COUNTRY[countryKey]

  const effectiveForm = legalForm ? (LEGALFORM_FALLBACK[legalForm] ?? legalForm) : legalForm

  const filtered = countryKey === 'ES' && effectiveForm
    ? events.filter((e) => e.aplica.length === 0 || e.aplica.includes(effectiveForm))
    : events

  const now = new Date()

  return filtered
    .map((e): FiscalEventWithStatus => {
      const msLeft  = e.deadline.getTime() - now.getTime()
      const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24))

      let status: FiscalEventStatus
      if (daysLeft < 0)        status = 'vencido'
      else if (daysLeft <= 30) status = 'proximo'
      else                     status = 'pendiente'

      return { ...e, status, daysLeft: daysLeft < -30 ? null : daysLeft }
    })
    .sort((a, b) => a.deadline.getTime() - b.deadline.getTime())
}

export const LEGAL_FORM_LABELS: Record<LegalForm, string> = {
  autonomo:    'Autónomo',
  sl:          'Sociedad Limitada (SL)',
  sa:          'Sociedad Anónima (SA)',
  comunidad:   'Comunidad de bienes',
  cooperativa: 'Cooperativa',
  asociacion:  'Asociación',
  fundacion:   'Fundación',
  otro:        'Otro',
}

export const COUNTRY_LABELS: Record<Country, string> = {
  ES: '🇪🇸 España',
  FR: '🇫🇷 Francia',
  PT: '🇵🇹 Portugal',
  IT: '🇮🇹 Italia',
  BE: '🇧🇪 Bélgica',
  DE: '🇩🇪 Alemania',
  US: '🇺🇸 Estados Unidos',
  CA: '🇨🇦 Canadá',
  IL: '🇮🇱 Israel',
}

export const COUNTRY_AGENCY: Record<Country, string> = {
  ES: 'AEAT',
  FR: 'Impôts',
  PT: 'AT / Finanças',
  IT: 'AdE',
  BE: 'SPF Finances',
  DE: 'Finanzamt',
  US: 'IRS',
  CA: 'CRA',
  IL: 'ITA',
}
