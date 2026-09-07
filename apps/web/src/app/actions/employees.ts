'use server'

import { db } from '@/lib/db'
import { requireUser } from '@/lib/auth'
import { can } from '@/lib/permissions'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const EmployeeSchema = z.object({
  workspaceId: z.string(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  nif: z.string().optional(),
  phone: z.string().optional(),
  position: z.string().min(1),
  department: z.string().optional(),
  startDate: z.string(),
  contractType: z.enum(['INDEFINIDO', 'TEMPORAL', 'PRACTICAS', 'FORMACION', 'TIEMPO_PARCIAL', 'OBRA_SERVICIO']),
  workingHours: z.number().min(1).max(40).default(40),
  annualGrossSalary: z.number().min(0),
  extraPayments: z.number().min(0).max(2).default(2),
  extraPaymentsProrrated: z.boolean().default(false),
  maritalStatus: z.enum(['SOLTERO', 'CASADO', 'DIVORCIADO', 'VIUDO', 'SEPARADO', 'PAREJA_HECHO']).default('SOLTERO'),
  spouseEarnsOver1500: z.boolean().default(false),
  childrenCount: z.number().min(0).default(0),
  childrenUnder3: z.number().min(0).default(0),
  ascendantsOver65: z.number().min(0).default(0),
  ascendantsOver75: z.number().min(0).default(0),
  workerDisabilityPct: z.number().min(0).default(0),
  workerNeedsAssistance: z.boolean().default(false),
  dependantsDisabled: z.number().min(0).default(0),
  compensatoryPension: z.number().min(0).default(0),
  irpfPct: z.number().min(0).max(45).nullable().default(null),
  irpfManual: z.boolean().default(false),
})

export async function createEmployee(data: z.infer<typeof EmployeeSchema>) {
  const user = await requireUser()
  if (!can(user, 'manage_members')) throw new Error('Sin permisos')

  const parsed = EmployeeSchema.parse(data)

  const employee = await db.employee.create({
    data: {
      workspaceId: parsed.workspaceId,
      firstName: parsed.firstName,
      lastName: parsed.lastName,
      email: parsed.email,
      nif: parsed.nif ?? null,
      phone: parsed.phone ?? null,
      jobTitle: parsed.position,
      department: parsed.department ?? null,
      startDate: new Date(parsed.startDate),
      contractType: parsed.contractType,
      workingHours: parsed.workingHours,
      annualGrossSalary: parsed.annualGrossSalary,
      extraPayments: parsed.extraPayments,
      extraPaymentsProrrated: parsed.extraPaymentsProrrated,
      maritalStatus: parsed.maritalStatus,
      spouseEarnsOver1500: parsed.spouseEarnsOver1500,
      childrenCount: parsed.childrenCount,
      childrenUnder3: parsed.childrenUnder3,
      ascendantsOver65: parsed.ascendantsOver65,
      ascendantsOver75: parsed.ascendantsOver75,
      workerDisabilityPct: parsed.workerDisabilityPct,
      workerNeedsAssistance: parsed.workerNeedsAssistance,
      dependantsDisabled: parsed.dependantsDisabled,
      compensatoryPension: parsed.compensatoryPension,
      irpfPct: parsed.irpfPct,
      irpfManual: parsed.irpfManual,
    },
  })

  revalidatePath(`/workspace/${parsed.workspaceId}/employees`)
  return employee
}

export async function updateEmployee(
  employeeId: string,
  workspaceId: string,
  data: Partial<z.infer<typeof EmployeeSchema>>,
) {
  const user = await requireUser()
  if (!can(user, 'manage_members')) throw new Error('Sin permisos')

  const { workspaceId: _ws, position, startDate, ...rest } = data

  const employee = await db.employee.update({
    where: { id: employeeId, workspaceId },
    data: {
      ...rest,
      ...(position !== undefined ? { jobTitle: position } : {}),
      ...(startDate !== undefined ? { startDate: new Date(startDate) } : {}),
    },
  })

  revalidatePath(`/workspace/${workspaceId}/employees`)
  return employee
}

export async function deactivateEmployee(employeeId: string, workspaceId: string) {
  const user = await requireUser()
  if (!can(user, 'manage_members')) throw new Error('Sin permisos')

  await db.employee.update({
    where: { id: employeeId, workspaceId },
    data: { active: false, endDate: new Date() },
  })

  revalidatePath(`/workspace/${workspaceId}/employees`)
}

export async function getEmployees(workspaceId: string) {
  await requireUser()

  return db.employee.findMany({
    where: { workspaceId, active: true },
    orderBy: { lastName: 'asc' },
  })
}

export async function getEmployee(employeeId: string, workspaceId: string) {
  await requireUser()

  return db.employee.findFirst({
    where: { id: employeeId, workspaceId },
    include: {
      payrolls: { orderBy: { year: 'desc' }, take: 12 },
      leaveRequests: { orderBy: { startDate: 'desc' }, take: 10 },
    },
  })
}
