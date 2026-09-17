import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

const STUN_ONLY: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun.cloudflare.com:3478' },
]

// GET /api/team/ice-servers
// Returns ICE server list with TURN credentials.
// Priority: Twilio > metered.ca > STUN-only fallback (no relay)
export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // ── Option 1: Twilio Network Traversal Service ────────────────────────────
  const twilioSid = process.env.TWILIO_ACCOUNT_SID
  const twilioToken = process.env.TWILIO_AUTH_TOKEN
  if (twilioSid && twilioToken) {
    try {
      const credentials = Buffer.from(`${twilioSid}:${twilioToken}`).toString('base64')
      const r = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Tokens.json`,
        {
          method: 'POST',
          headers: { Authorization: `Basic ${credentials}` },
          next: { revalidate: 3600 },
        }
      )
      if (r.ok) {
        const data = await r.json() as { ice_servers: Array<{ urls: string; username?: string; credential?: string }> }
        const iceServers: RTCIceServer[] = data.ice_servers.map(s => ({
          urls: s.urls,
          ...(s.username ? { username: s.username } : {}),
          ...(s.credential ? { credential: s.credential } : {}),
        }))
        return NextResponse.json({ iceServers, source: 'twilio' })
      }
    } catch { /* fall through */ }
  }

  // ── Option 2: metered.ca with API key ────────────────────────────────────
  const meteredKey = process.env.METERED_TURN_API_KEY
  const meteredApp = process.env.METERED_APP_NAME ?? 'openrelay'
  if (meteredKey) {
    try {
      const r = await fetch(
        `https://${meteredApp}.metered.live/api/v1/turn/credentials?apiKey=${meteredKey}`,
        { next: { revalidate: 3600 } }
      )
      if (r.ok) {
        const servers = await r.json() as RTCIceServer[]
        return NextResponse.json({ iceServers: [...STUN_ONLY, ...servers], source: 'metered' })
      }
    } catch { /* fall through */ }
  }

  // ── Fallback: STUN only (no relay — cross-network calls will fail) ────────
  return NextResponse.json({ iceServers: STUN_ONLY, source: 'stun-only' })
}
