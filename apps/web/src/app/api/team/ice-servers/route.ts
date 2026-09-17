import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

const STATIC_FALLBACK: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun.cloudflare.com:3478' },
  { urls: 'turn:openrelay.metered.ca:80', username: 'openrelayproject', credential: 'openrelayproject' },
  { urls: 'turn:openrelay.metered.ca:80?transport=tcp', username: 'openrelayproject', credential: 'openrelayproject' },
  { urls: 'turn:openrelay.metered.ca:443', username: 'openrelayproject', credential: 'openrelayproject' },
  { urls: 'turn:openrelay.metered.ca:443?transport=tcp', username: 'openrelayproject', credential: 'openrelayproject' },
  { urls: 'turns:openrelay.metered.ca:443', username: 'openrelayproject', credential: 'openrelayproject' },
  { urls: 'turns:openrelay.metered.ca:443?transport=tcp', username: 'openrelayproject', credential: 'openrelayproject' },
]

// GET /api/team/ice-servers
// Returns ICE server config including TURN credentials.
// Fetches fresh credentials from metered.ca API; falls back to static list.
export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const apiKey = process.env.METERED_TURN_API_KEY
  if (apiKey) {
    try {
      const r = await fetch(
        `https://openrelay.metered.ca/api/v1/turn/credentials?apiKey=${apiKey}`,
        { next: { revalidate: 3600 } }
      )
      if (r.ok) {
        const servers = await r.json() as RTCIceServer[]
        const withStun: RTCIceServer[] = [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun.cloudflare.com:3478' },
          ...servers,
        ]
        return NextResponse.json({ iceServers: withStun })
      }
    } catch { /* fall through */ }
  }

  return NextResponse.json({ iceServers: STATIC_FALLBACK })
}
