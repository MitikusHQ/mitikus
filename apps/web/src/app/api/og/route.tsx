import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'flex-start',
          padding: '80px',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Logo mark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '36px' }}>
          <svg width="52" height="52" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="og" x1="10" y1="10" x2="190" y2="190" gradientUnits="userSpaceOnUse">
                <stop offset="0%"   stopColor="#FFD040"/>
                <stop offset="28%"  stopColor="#FF7028"/>
                <stop offset="50%"  stopColor="#FF2878"/>
                <stop offset="72%"  stopColor="#8B28FF"/>
                <stop offset="100%" stopColor="#1820B8"/>
              </linearGradient>
              <clipPath id="ogc"><circle cx="100" cy="100" r="87"/></clipPath>
            </defs>
            <circle cx="100" cy="100" r="90" fill="none" stroke="url(#og)" strokeWidth="5.5"/>
            <g clipPath="url(#ogc)">
              <polygon points="-10,0 192,95 192,100 -10,98" fill="url(#og)"/>
              <polygon points="-10,102 192,100 192,105 -10,200" fill="url(#og)"/>
            </g>
          </svg>
          <span style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '0.18em', background: 'linear-gradient(100deg,#FFD040,#FF7028,#FF2878,#8B28FF,#1820B8)', backgroundClip: 'text', color: 'transparent' }}>
            MITIKUS
          </span>
        </div>
        <h1 style={{ color: '#ffffff', fontSize: '56px', fontWeight: 800, lineHeight: 1.1, margin: '0 0 24px 0', maxWidth: '900px' }}>
          Auditorías IT en minutos, no en horas
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '24px', lineHeight: 1.5, margin: 0, maxWidth: '800px' }}>
          Convierte cada auditoría, checklist e informe para tus clientes en un proceso guiado por IA.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', marginTop: '48px', gap: '16px' }}>
          <div style={{ background: '#f97316', color: '#fff', borderRadius: '999px', padding: '8px 20px', fontSize: '14px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Beta
          </div>
          <span style={{ color: '#64748b', fontSize: '16px' }}>Para consultoras IT de 3 a 15 personas</span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
