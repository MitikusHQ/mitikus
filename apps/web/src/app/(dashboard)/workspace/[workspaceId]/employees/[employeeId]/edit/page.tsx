import { notFound } from 'next/navigation'
import { getEmployee } from '@/app/actions/employees'
import { EmployeeEditForm } from './_components/EmployeeEditForm'

interface Props {
  params: Promise<{ workspaceId: string; employeeId: string }>
}

export default async function EmployeeEditPage({ params }: Props) {
  const { workspaceId, employeeId } = await params
  const employee = await getEmployee(employeeId, workspaceId).catch(() => null)
  if (!employee) notFound()

  return <EmployeeEditForm workspaceId={workspaceId} employee={employee} />
}
