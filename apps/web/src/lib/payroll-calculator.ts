/**
 * Motor de cálculo de nóminas — legislación española 2026
 */

export interface EmployeeFiscalData {
  annualGrossSalary: number
  extraPayments: number          // 0, 1 o 2 pagas extras
  extraPaymentsProrrated: boolean
  workingHours: number           // horas semanales (jornada completa = 40)
  maritalStatus: 'SOLTERO' | 'CASADO' | 'DIVORCIADO' | 'VIUDO' | 'SEPARADO' | 'PAREJA_HECHO'
  spouseEarnsOver1500: boolean
  childrenCount: number
  childrenUnder3: number
  ascendantsOver65: number
  ascendantsOver75: number
  workerDisabilityPct: number    // 0, 33, 65, 75
  workerNeedsAssistance: boolean
  dependantsDisabled: number
  compensatoryPension: number
  irpfManual: boolean
  irpfPct: number | null
}

export interface PayrollResult {
  // Devengos
  baseSalary: number
  extraPayment: number
  grossTotal: number

  // SS trabajador
  ssContingencias: number
  ssDesempleo: number
  ssFormacion: number
  ssFogasa: number
  ssMei: number
  ssTotal: number

  // IRPF
  irpfPct: number
  irpfAmount: number

  // SS empresa (informativo)
  ssCompanyTotal: number

  // Resultado
  totalDeductions: number
  netSalary: number
}

// ── Tipos cotización SS trabajador 2026 ──────────────────────
const SS_CONTINGENCIAS = 0.047
const SS_DESEMPLEO = 0.0155
const SS_FORMACION = 0.001
const SS_FOGASA = 0.0002
const SS_MEI = 0.001
// SS empresa (informativo)
const SS_COMPANY_CONTINGENCIAS = 0.235
const SS_COMPANY_DESEMPLEO = 0.055
const SS_COMPANY_FORMACION = 0.006
const SS_COMPANY_FOGASA = 0.002
const SS_COMPANY_MEI = 0.005
const SS_COMPANY_TOTAL = SS_COMPANY_CONTINGENCIAS + SS_COMPANY_DESEMPLEO + SS_COMPANY_FORMACION + SS_COMPANY_FOGASA + SS_COMPANY_MEI

// ── Mínimo personal y familiar 2026 ─────────────────────────
function calcMinimumPersonalFamiliar(data: EmployeeFiscalData): number {
  let min = 5550

  // Mínimo por descendientes
  const childrenAllowances = [2400, 2700, 4000, 4500]
  for (let i = 0; i < data.childrenCount; i++) {
    min += childrenAllowances[Math.min(i, 3)] ?? 4500
  }
  // Menores de 3 años: +2.800€ adicionales por cada uno
  min += data.childrenUnder3 * 2800

  // Mínimo por ascendientes
  min += data.ascendantsOver65 * 1150
  min += data.ascendantsOver75 * 1400  // adicional sobre el de >65

  // Mínimo por discapacidad del contribuyente
  if (data.workerDisabilityPct >= 65) {
    min += 9000
    if (data.workerNeedsAssistance) min += 3000
  } else if (data.workerDisabilityPct >= 33) {
    min += 3000
  }

  // Mínimo por discapacidad de dependientes
  min += data.dependantsDisabled * 3000

  return min
}

// ── Cuota íntegra IRPF — escala estatal + autonómica media 2026 ──
// Escala conjunta (estatal + autonómica media nacional)
function irpfRate(base: number): number {
  const tramos = [
    { hasta: 12450,  tipo: 0.19 },
    { hasta: 20200,  tipo: 0.24 },
    { hasta: 35200,  tipo: 0.30 },
    { hasta: 60000,  tipo: 0.37 },
    { hasta: 300000, tipo: 0.45 },
    { hasta: Infinity, tipo: 0.47 },
  ]
  let cuota = 0
  let prev = 0
  for (const tramo of tramos) {
    if (base <= prev) break
    const taxable = Math.min(base, tramo.hasta) - prev
    cuota += taxable * tramo.tipo
    prev = tramo.hasta
  }
  return cuota
}

function calcIrpfPct(data: EmployeeFiscalData, annualGross: number): number {
  // Base imponible = rendimiento neto - SS anual
  const annualSS = annualGross * (SS_CONTINGENCIAS + SS_DESEMPLEO + SS_FORMACION + SS_FOGASA + SS_MEI)
  const rendimientoNeto = annualGross - annualSS

  // Reducción por obtención de rendimientos del trabajo (art. 20 LIRPF 2026)
  let reduccionRendimientos = 0
  if (rendimientoNeto <= 14852) reduccionRendimientos = 6498
  else if (rendimientoNeto <= 17673.52) reduccionRendimientos = Math.max(0, 6498 - 1.14 * (rendimientoNeto - 14852))
  else reduccionRendimientos = 2364

  // Pensión compensatoria al ex-cónyuge (reduce base)
  const baseImponible = Math.max(0, rendimientoNeto - reduccionRendimientos - data.compensatoryPension)

  // Mínimo personal y familiar
  const minPersonalFamiliar = calcMinimumPersonalFamiliar(data)

  // Cuota íntegra sobre base imponible
  const cuotaBase = irpfRate(baseImponible)
  // Cuota íntegra sobre mínimo personal y familiar (al 19%)
  const cuotaMin = irpfRate(Math.min(baseImponible, minPersonalFamiliar))

  const cuotaIntegra = Math.max(0, cuotaBase - cuotaMin)

  // Tipo de retención = cuota íntegra / rendimiento total (anual)
  if (annualGross <= 0) return 0
  const tipo = cuotaIntegra / annualGross
  // Mínimo legal 2%
  return Math.max(0.02, Math.round(tipo * 1000) / 10)  // redondeo a 1 decimal
}

// ── Función principal ────────────────────────────────────────
export function calculatePayroll(data: EmployeeFiscalData, month: number): PayrollResult {
  const partTimeRatio = data.workingHours / 40
  const baseAnnual = data.annualGrossSalary * partTimeRatio

  // Pagas: 12 mensualidades + extras (o todo prorrateado)
  const numPayments = 12 + (data.extraPaymentsProrrated ? 0 : data.extraPayments)
  const baseSalary = data.extraPaymentsProrrated
    ? baseAnnual / 12
    : baseAnnual / (12 + data.extraPayments)

  // Paga extra: en junio (mes 6) y diciembre (mes 12) si no están prorrateadas
  let extraPayment = 0
  if (!data.extraPaymentsProrrated && data.extraPayments > 0) {
    if (data.extraPayments === 2 && (month === 6 || month === 12)) {
      extraPayment = baseSalary
    } else if (data.extraPayments === 1 && month === 12) {
      extraPayment = baseSalary
    }
  }

  const grossTotal = baseSalary + extraPayment

  // SS trabajador (sobre el salario bruto mensual)
  const ssContingencias = round2(grossTotal * SS_CONTINGENCIAS)
  const ssDesempleo = round2(grossTotal * SS_DESEMPLEO)
  const ssFormacion = round2(grossTotal * SS_FORMACION)
  const ssFogasa = round2(grossTotal * SS_FOGASA)
  const ssMei = round2(grossTotal * SS_MEI)
  const ssTotal = round2(ssContingencias + ssDesempleo + ssFormacion + ssFogasa + ssMei)

  // IRPF
  const irpfPct = data.irpfManual && data.irpfPct != null
    ? data.irpfPct
    : calcIrpfPct(data, baseAnnual / numPayments * 12)  // anualizado normalizado

  const irpfAmount = round2(grossTotal * (irpfPct / 100))

  // SS empresa
  const ssCompanyTotal = round2(grossTotal * SS_COMPANY_TOTAL)

  const totalDeductions = round2(ssTotal + irpfAmount)
  const netSalary = round2(grossTotal - totalDeductions)

  return {
    baseSalary: round2(baseSalary),
    extraPayment: round2(extraPayment),
    grossTotal: round2(grossTotal),
    ssContingencias,
    ssDesempleo,
    ssFormacion,
    ssFogasa,
    ssMei,
    ssTotal,
    irpfPct,
    irpfAmount,
    ssCompanyTotal,
    totalDeductions,
    netSalary,
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

// ── Cálculo de días hábiles entre dos fechas ────────────────
export function calcWorkingDays(
  start: Date,
  end: Date,
  holidays: Date[],
): number {
  const holidaySet = new Set(holidays.map((d) => d.toISOString().split('T')[0]))
  let count = 0
  const current = new Date(start)
  while (current <= end) {
    const dow = current.getDay()
    const iso = current.toISOString().split('T')[0]!
    if (dow !== 0 && dow !== 6 && !holidaySet.has(iso)) count++
    current.setDate(current.getDate() + 1)
  }
  return count
}
