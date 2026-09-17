import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

const STUN: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun.cloudflare.com:3478' },
]

// GET /api/team/ice-servers
// Priority: Twilio > metered.ca API key > static TURN credentials > STUN-only
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
        { method: 'POST', headers: { Authorization: `Basic ${credentials}` } }
      )
      if (r.ok) {
        const data = await r.json() as { ice_servers: Array<{ urls: string; username?: string; credential?: string }> }
        const iceServers: RTCIceServer[] = data.ice_servers.map(s => ({
          urls: s.urls,
          ...(s.username ? { username: s.username } : {}),
          ...(s.credential ? { credential: s.credential } : {}),
        }))
        return NextResponse.json({ iceServers, turnConfigured: true, source: 'twilio' })
      }
    } catch { /* fall through */ }
  }

  // ── Option 2: metered.ca with API key ────────────────────────────────────
  const meteredKey = process.env.METERED_TURN_API_KEY
  const meteredApp = process.env.METERED_APP_NAME ?? 'openrelay'
  if (meteredKey) {
    try {
      const r = await fetch(
        `https://${meteredApp}.metered.live/api/v1/turn/credentials?apiKey=${meteredKey}`
      )
      if (r.ok) {
        const servers = await r.json() as RTCIceServer[]
        return NextResponse.json({ iceServers: [...STUN, ...servers], turnConfigured: true, source: 'metered' })
      }
    } catch { /* fall through */ }
  }

  // ── Option 3: static TURN credentials (no API call needed) ───────────────
  const turnUsername = process.env.METERED_TURN_USERNAME
  const turnCredential = process.env.METERED_TURN_CREDENTIAL
  const turnHost = process.env.METERED_TURN_HOST ?? 'standard.relay.metered.ca'
  if (turnUsername && turnCredential) {
    const turnServers: RTCIceServer[] = [
      { urls: `turn:${turnHost}:80`, username: turnUsername, credential: turnCredential },
      { urls: `turn:${turnHost}:80?transport=tcp`, username: turnUsername, credential: turnCredential },
      { urls: `turn:${turnHost}:443`, username: turnUsername, credential: turnCredential },
      { urls: `turn:${turnHost}:443?transport=tcp`, username: turnUsername, credential: turnCredential },
      { urls: `turns:${turnHost}:443?transport=tcp`, username: turnUsername, credential: turnCredential },
    ]
    return NextResponse.json({ iceServers: [...STUN, ...turnServers], turnConfigured: true, source: 'static' })
  }

  // ── Fallback: STUN only — cross-network calls will fail ──────────────────
  return NextResponse.json({ iceServers: STUN, turnConfigured: false, source: 'stun-only' })
}
