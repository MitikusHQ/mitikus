'use server'

import { db } from '@/lib/db'
import { requireUser } from '@/lib/auth'
import { can } from '@/lib/permissions'
import { revalidatePath } from 'next/cache'
import { calculatePayroll } from '@/lib/payroll-calculator'
import type { EmployeeFiscalData } from '@/lib/payroll-calculator'

export async function generatePayroll(
  employeeId: string,
  workspaceId: string,
  year: number,
  month: number,
) {
  const user = await requireUser()
  if (!can(user, 'manage_members')) throw new Error('Sin permisos')

  const employee = await db.employee.findFirst({
    where: { id: employeeId, workspaceId, active: true },
  })
  if (!employee) throw new Error('Empleado no encontrado')

  const existing = await db.payroll.findFirst({
    where: { employeeId, year, month },
  })
  if (existing) throw new Error(`Ya existe nómina para ${month}/${year}`)

  const fiscalData: EmployeeFiscalData = {
    annualGrossSalary: employee.annualGrossSalary,
    extraPayments: employee.extraPayments,
    extraPaymentsProrrated: employee.extraPaymentsProrrated,
    workingHours: employee.workingHours,
    maritalStatus: employee.maritalStatus as EmployeeFiscalData['maritalStatus'],
    spouseEarnsOver1500: employee.spouseEarnsOver1500,
    childrenCount: employee.childrenCount,
    childrenUnder3: employee.childrenUnder3,
    ascendantsOver65: employee.ascendantsOver65,
    ascendantsOver75: employee.ascendantsOver75,
    workerDisabilityPct: employee.workerDisabilityPct,
    workerNeedsAssistance: employee.workerNeedsAssistance,
    dependantsDisabled: employee.dependantsDisabled,
    compensatoryPension: employee.compensatoryPension,
    irpfManual: employee.irpfManual,
    irpfPct: employee.irpfPct ?? null,
  }

  const result = calculatePayroll(fiscalData, month)

  const payroll = await db.payroll.create({
    data: {
      workspaceId,
      employeeId,
      year,
      month,
      baseSalary: result.baseSalary,
      extraPayment: result.extraPayment,
      grossTotal: result.grossTotal,
      ssContingencias: result.ssContingencias,
      ssDesempleo: result.ssDesempleo,
      ssFormacion: result.ssFormacion,
      ssFogasa: result.ssFogasa,
      ssMei: result.ssMei,
      ssTotal: result.ssTotal,
      irpfAmount: result.irpfAmount,
      ssCompanyTotal: result.ssCompanyTotal,
      totalDeductions: result.totalDeductions,
      netSalary: result.netSalary,
      status: 'BORRADOR',
      notes: `IRPF ${result.irpfPct}%`,
    },
  })

  revalidatePath(`/workspace/${workspaceId}/employees/${employeeId}`)
  revalidatePath(`/workspace/${workspaceId}/payroll`)
  return payroll
}

export async function approvePayroll(payrollId: string, workspaceId: string) {
  const user = await requireUser()
  if (!can(user, 'manage_members')) throw new Error('Sin permisos')

  const payroll = await db.payroll.update({
    where: { id: payrollId, workspaceId },
    data: { status: 'GENERADA' },
  })

  revalidatePath(`/workspace/${workspaceId}/payroll`)
  return payroll
}

export async function payPayroll(payrollId: string, workspaceId: string) {
  const user = await requireUser()
  if (!can(user, 'manage_members')) throw new Error('Sin permisos')

  const payroll = await db.payroll.update({
    where: { id: payrollId, workspaceId },
    data: { status: 'PAGADA', paidAt: new Date() },
  })

  revalidatePath(`/workspace/${workspaceId}/payroll`)
  return payroll
}

export async function getPayrolls(workspaceId: string, year?: number) {
  await requireUser()

  return db.payroll.findMany({
    where: { workspaceId, ...(year ? { year } : {}) },
    include: { employee: { select: { firstName: true, lastName: true, jobTitle: true } } },
    orderBy: [{ year: 'desc' }, { month: 'desc' }],
  })
}
