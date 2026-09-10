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
  email: z.string().email().optional().or(z.literal('')).transform(v => v === '' ? undefined : v),
  nif: z.string().optional(),
  nss: z.string().optional(),
  phone: z.string().optional(),
  position: z.string().optional(),
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

export async function createEmployee(data: z.infer<typeof EmployeeSchema>): Promise<{ ok: true; employee: { id: string } } | { ok: false; error: string }> {
  try {
    const user = await requireUser()
    if (!can(user, 'manage_members')) return { ok: false, error: 'Sin permisos (se requiere rol Admin o superior)' }

    const parsed = EmployeeSchema.safeParse(data)
    if (!parsed.success) return { ok: false, error: parsed.error.errors.map(e => e.message).join(', ') }

    const employee = await db.employee.create({
      data: {
        workspaceId: parsed.data.workspaceId,
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
        email: parsed.data.email ?? null,
        nif: parsed.data.nif ?? null,
        nss: parsed.data.nss ?? null,
        phone: parsed.data.phone ?? null,
        jobTitle: parsed.data.position ?? null,
        department: parsed.data.department ?? null,
        startDate: new Date(parsed.data.startDate),
        contractType: parsed.data.contractType,
        workingHours: parsed.data.workingHours,
        annualGrossSalary: parsed.data.annualGrossSalary,
        extraPayments: parsed.data.extraPayments,
        extraPaymentsProrrated: parsed.data.extraPaymentsProrrated,
        maritalStatus: parsed.data.maritalStatus,
        spouseEarnsOver1500: parsed.data.spouseEarnsOver1500,
        childrenCount: parsed.data.childrenCount,
        childrenUnder3: parsed.data.childrenUnder3,
        ascendantsOver65: parsed.data.ascendantsOver65,
        ascendantsOver75: parsed.data.ascendantsOver75,
        workerDisabilityPct: parsed.data.workerDisabilityPct,
        workerNeedsAssistance: parsed.data.workerNeedsAssistance,
        dependantsDisabled: parsed.data.dependantsDisabled,
        compensatoryPension: parsed.data.compensatoryPension,
        irpfPct: parsed.data.irpfPct,
        irpfManual: parsed.data.irpfManual,
      },
    })

    revalidatePath(`/workspace/${parsed.data.workspaceId}/employees`)
    return { ok: true, employee: { id: employee.id } }
  } catch (e) {
    // Re-throw Next.js redirect/notFound errors — they must propagate
    if ((e as { digest?: string })?.digest?.startsWith('NEXT_REDIRECT') || (e as { digest?: string })?.digest === 'NEXT_NOT_FOUND') throw e
    const msg = e instanceof Error ? e.message : 'Error inesperado al crear el empleado'
    return { ok: false, error: msg }
  }
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

export async function inviteEmployee(
  employeeId: string,
  workspaceId: string,
  email: string,
): Promise<{ ok: true; link: string } | { ok: false; error: string }> {
  try {
    const user = await requireUser()
    if (!can(user, 'manage_members')) return { ok: false, error: 'Sin permisos (se requiere rol Admin o superior)' }

    const TTL_MS = 7 * 24 * 60 * 60 * 1000
    const invitation = await db.orgInvitation.create({
      data: {
        orgId: user.orgId,
        email: email.trim().toLowerCase(),
        role: 'EDITOR',
        expiresAt: new Date(Date.now() + TTL_MS),
        createdBy: user.id,
      },
    })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.mitikus.com'
    const link = `${appUrl}/invite/${invitation.token}`

    const { sendInvitationLinkEmail } = await import('@/lib/email')
    const org = await db.organization.findUnique({ where: { id: user.orgId }, select: { name: true } })
    void sendInvitationLinkEmail({
      to: email.trim().toLowerCase(),
      orgName: org?.name ?? 'tu equipo',
      inviteUrl: link,
      expiresAt: invitation.expiresAt,
    }).catch(() => null)

    revalidatePath(`/workspace/${workspaceId}/employees/${employeeId}`)
    return { ok: true, link }
  } catch (e) {
    if ((e as { digest?: string })?.digest?.startsWith('NEXT_REDIRECT')) throw e
    const msg = e instanceof Error ? e.message : 'Error inesperado al enviar la invitación'
    return { ok: false, error: msg }
  }
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
