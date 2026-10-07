import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const DEFAULT_ICE: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun.cloudflare.com:3478' },
  // Metered.ca relay (updated endpoints)
  { urls: 'turn:a.relay.metered.ca:80',                   username: 'openrelayproject', credential: 'openrelayproject' },
  { urls: 'turn:a.relay.metered.ca:80?transport=tcp',     username: 'openrelayproject', credential: 'openrelayproject' },
  { urls: 'turn:a.relay.metered.ca:443',                  username: 'openrelayproject', credential: 'openrelayproject' },
  { urls: 'turn:a.relay.metered.ca:443?transport=tcp',    username: 'openrelayproject', credential: 'openrelayproject' },
  { urls: 'turns:a.relay.metered.ca:443',                 username: 'openrelayproject', credential: 'openrelayproject' },
  // numb.viagenie.ca — free public TURN
  { urls: 'turn:numb.viagenie.ca', username: 'webrtc@live.com', credential: 'muazkh' },
  // FreeStan
  { urls: 'turn:freestun.net:3479', username: 'free', credential: 'free' },
  { urls: 'turns:freestun.net:5350', username: 'free', credential: 'free' },
]

// GET /api/guest/ice-servers?token=xxx — returns ICE servers for guest (no Clerk auth)
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 })

  const room = await db.guestRoom.findUnique({ where: { token } })
  if (!room || room.expiresAt < new Date()) {
    return NextResponse.json({ error: 'Room expired or not found' }, { status: 404 })
  }

  // Metered.ca TURN — dynamic HMAC credentials (preferred)
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

  // Twilio fallback
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
        return NextResponse.json({ iceServers })
      }
    } catch { /* fall through */ }
  }

  return NextResponse.json({ iceServers: DEFAULT_ICE })
}
