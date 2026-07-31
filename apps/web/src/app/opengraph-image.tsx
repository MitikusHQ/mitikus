import { ImageResponse } from 'next/og'

export const runtime     = 'edge'
export const alt         = 'MITIKUS — Auditorías profesionales en 8 minutos'
export const size        = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    <div
      style={{
        background: '#0f172a',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '80px 90px',
      }}
    >
      {/* Logo wordmark */}
      <div
        style={{
          fontSize: 15,
          fontWeight: 700,
          color: '#475569',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          marginBottom: 32,
        }}
      >
        MITIKUS
      </div>

      {/* Headline */}
      <div
        style={{
          fontSize: 62,
          fontWeight: 700,
          color: '#f8fafc',
          lineHeight: 1.15,
          marginBottom: 28,
        }}
      >
        Auditorías profesionales{'\n'}en 8 minutos
      </div>

      {/* Subline */}
      <div
        style={{
          fontSize: 22,
          color: '#94a3b8',
          lineHeight: 1.55,
          maxWidth: 680,
        }}
      >
        Convierte tus procesos de auditoría IT, RGPD e ISO 27001 en flujos repetibles.
        Genera informes listos para entregar.
      </div>

      {/* Bottom tag */}
      <div
        style={{
          position: 'absolute',
          bottom: 52,
          right: 90,
          fontSize: 14,
          color: '#334155',
          letterSpacing: '0.05em',
        }}
      >
        mitikus.com
      </div>
    </div>,
    { ...size },
  )
}
