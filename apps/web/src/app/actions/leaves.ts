'use server'

import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { calcWorkingDays } from '@/lib/payroll-calculator'
import { z } from 'zod'

// Tipos que existen en el enum LeaveType del schema Prisma
const LeaveRequestSchema = z.object({
  workspaceId: z.string(),
  employeeId: z.string(),
  leaveType: z.enum([
    'VACACIONES', 'ASUNTOS_PROPIOS', 'BAJA_MEDICA', 'CITA_MEDICA',
    'MATERNIDAD', 'PATERNIDAD', 'NACIMIENTO_HIJO', 'MATRIMONIO',
    'FALLECIMIENTO_FAMILIAR_1', 'FALLECIMIENTO_FAMILIAR_2',
    'HOSPITALIZACION_FAMILIAR', 'MUDANZA', 'DEBER_INEXCUSABLE',
    'FORMACION', 'EXCEDENCIA', 'REDUCCION_JORNADA', 'OTROS',
  ]),
  startDate: z.string(),
  endDate: z.string(),
  reason: z.string().optional(),
})

async function getWorkspaceMember(workspaceId: string, userId: string) {
  return db.workspaceMember.findFirst({
    where: { workspaceId, userId },
    select: { role: true },
  })
}

export async function createLeaveRequest(data: z.infer<typeof LeaveRequestSchema>) {
  const { userId } = await auth()
  if (!userId) throw new Error('No autenticado')

  const member = await getWorkspaceMember(data.workspaceId, userId)
  if (!member) throw new Error('Sin permisos')

  const start = new Date(data.startDate)
  const end = new Date(data.endDate)
  if (end < start) throw new Error('La fecha fin debe ser posterior a la fecha inicio')

  // Obtener festivos del workspace para calcular días hábiles
  const holidays = await db.publicHoliday.findMany({
    where: {
      workspaceId: data.workspaceId,
      date: { gte: start, lte: end },
    },
    select: { date: true },
  })

  const workingDays = calcWorkingDays(start, end, holidays.map((h) => h.date))

  const leave = await db.leaveRequest.create({
    data: {
      workspaceId: data.workspaceId,
      employeeId: data.employeeId,
      type: data.leaveType,
      startDate: start,
      endDate: end,
      workingDays,
      reason: data.reason ?? null,
      status: 'PENDIENTE',
    },
  })

  revalidatePath(`/workspace/${data.workspaceId}/leaves`)
  return leave
}

export async function approveLeave(leaveId: string, workspaceId: string) {
  const { userId } = await auth()
  if (!userId) throw new Error('No autenticado')

  const member = await getWorkspaceMember(workspaceId, userId)
  if (!member || !['OWNER', 'ADMIN'].includes(member.role)) {
    throw new Error('Sin permisos para aprobar ausencias')
  }

  const leave = await db.leaveRequest.update({
    where: { id: leaveId, workspaceId },
    data: { status: 'APROBADA', approvedById: userId, approvedAt: new Date() },
  })

  // Actualizar balance de vacaciones si aplica
  if (leave.type === 'VACACIONES') {
    const currentYear = new Date().getFullYear()
    await db.leaveBalance.upsert({
      where: { employeeId_year_leaveType: { employeeId: leave.employeeId, year: currentYear, leaveType: 'VACACIONES' } },
      update: { used: { increment: leave.workingDays } },
      create: {
        workspaceId,
        employeeId: leave.employeeId,
        year: currentYear,
        leaveType: 'VACACIONES',
        entitled: 22,
        used: leave.workingDays,
        pending: 0,
        remaining: 22 - leave.workingDays,
      },
    })
  }

  revalidatePath(`/workspace/${workspaceId}/leaves`)
  return leave
}

export async function rejectLeave(leaveId: string, workspaceId: string, reason: string) {
  const { userId } = await auth()
  if (!userId) throw new Error('No autenticado')

  const member = await getWorkspaceMember(workspaceId, userId)
  if (!member || !['OWNER', 'ADMIN'].includes(member.role)) {
    throw new Error('Sin permisos para rechazar ausencias')
  }

  const leave = await db.leaveRequest.update({
    where: { id: leaveId, workspaceId },
    data: { status: 'DENEGADA', denialReason: reason, approvedById: userId, approvedAt: new Date() },
  })

  revalidatePath(`/workspace/${workspaceId}/leaves`)
  return leave
}

export async function getLeaves(workspaceId: string) {
  const { userId } = await auth()
  if (!userId) throw new Error('No autenticado')

  const member = await getWorkspaceMember(workspaceId, userId)
  if (!member) throw new Error('Sin permisos')

  return db.leaveRequest.findMany({
    where: { workspaceId },
    include: {
      employee: { select: { firstName: true, lastName: true, jobTitle: true } },
    },
    orderBy: { startDate: 'desc' },
  })
}

export async function getLeaveBalance(employeeId: string, workspaceId: string, year: number) {
  const { userId } = await auth()
  if (!userId) throw new Error('No autenticado')

  const member = await getWorkspaceMember(workspaceId, userId)
  if (!member) throw new Error('Sin permisos')

  const balance = await db.leaveBalance.findUnique({
    where: { employeeId_year_leaveType: { employeeId, year, leaveType: 'VACACIONES' } },
  })

  return balance ?? { entitled: 22, used: 0, pending: 0, carried: 0 }
}

// ── Festivos ────────────────────────────────────────────────
export async function seedNationalHolidays(workspaceId: string) {
  const { userId } = await auth()
  if (!userId) throw new Error('No autenticado')

  const member = await getWorkspaceMember(workspaceId, userId)
  if (!member || !['OWNER', 'ADMIN'].includes(member.role)) {
    throw new Error('Sin permisos')
  }

  const nationalHolidays2026 = [
    { date: '2026-01-01', name: 'Año Nuevo' },
    { date: '2026-01-06', name: 'Epifanía del Señor' },
    { date: '2026-04-02', name: 'Jueves Santo' },
    { date: '2026-04-03', name: 'Viernes Santo' },
    { date: '2026-05-01', name: 'Fiesta del Trabajo' },
    { date: '2026-08-15', name: 'Asunción de la Virgen' },
    { date: '2026-10-12', name: 'Fiesta Nacional de España' },
    { date: '2026-11-01', name: 'Todos los Santos' },
    { date: '2026-12-06', name: 'Día de la Constitución' },
    { date: '2026-12-08', name: 'Inmaculada Concepción' },
    { date: '2026-12-25', name: 'Navidad' },
    { date: '2026-12-26', name: 'San Esteban' }, // substituible
  ]

  const created = await Promise.all(
    nationalHolidays2026.map((h) =>
      db.publicHoliday.upsert({
        where: {
          workspaceId_date_scope_region: {
            workspaceId,
            date: new Date(h.date),
            scope: 'NACIONAL',
            region: '',
          },
        },
        update: {},
        create: {
          workspaceId,
          date: new Date(h.date),
          name: h.name,
          scope: 'NACIONAL',
        },
      }),
    ),
  )

  revalidatePath(`/workspace/${workspaceId}/leaves`)
  return created
}
