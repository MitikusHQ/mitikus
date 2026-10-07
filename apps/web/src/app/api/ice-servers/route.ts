import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'

const DEFAULT_ICE: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun.cloudflare.com:3478' },
  { urls: 'turn:a.relay.metered.ca:80',                username: 'openrelayproject', credential: 'openrelayproject' },
  { urls: 'turn:a.relay.metered.ca:80?transport=tcp',  username: 'openrelayproject', credential: 'openrelayproject' },
  { urls: 'turn:a.relay.metered.ca:443',               username: 'openrelayproject', credential: 'openrelayproject' },
  { urls: 'turn:a.relay.metered.ca:443?transport=tcp', username: 'openrelayproject', credential: 'openrelayproject' },
  { urls: 'turns:a.relay.metered.ca:443',              username: 'openrelayproject', credential: 'openrelayproject' },
]

// GET /api/ice-servers — returns ICE servers for authenticated host
export async function GET() {
  await requireUser()

  const meteredKey = process.env.METERED_API_KEY
  const meteredApp = process.env.METERED_APP_NAME
  if (meteredKey && meteredApp) {
    try {
      const r = await fetch(
        `https://${meteredApp}.metered.live/api/v1/turn/credentials?apiKey=${meteredKey}`
      )
      if (r.ok) {
        const iceServers = await r.json() as RTCIceServer[]
        return NextResponse.json({ iceServers })
      }
    } catch { /* fall through */ }
  }

  return NextResponse.json({ iceServers: DEFAULT_ICE })
}
