import { Metadata } from 'next'
import { GuestRoomClient } from './_components/GuestRoomClient'

interface Props {
  params: Promise<{ token: string }>
}

export const metadata: Metadata = {
  title: 'MITIKUS — Sala de reunión',
}

export default async function MeetPage({ params }: Props) {
  const { token } = await params
  return <GuestRoomClient token={token} />
}
