'use client'

import { useEffect, useCallback } from 'react'
import { useState } from 'react'

const STORAGE_KEY = 'mitikus-onboarding-seen-v1'

interface Slide {
  tag: string
  tagColor: string
  tagBg: string
  title: string
  desc: string
  tips: { icon: string; text: string }[]
  illustrationColor: string
  illustration: React.ReactNode
}

const SLIDES: Slide[] = [
  // ─── 1. Bienvenida ───────────────────────────────────────────────────
  {
    tag: '✦ Bienvenido',
    tagColor: '#4F46E5',
    tagBg: '#EEF2FF',
    title: 'Tu oficina inteligente para profesionales',
    desc: 'MITIKUS reúne en un solo lugar todo lo que necesitas para gestionar tu negocio: clientes, facturas, tareas, documentos y tu asistente de IA.',
    tips: [
      { icon: '→', text: 'Este tour te llevará por las secciones principales en menos de 2 minutos.' },
      { icon: '⌨', text: 'Usa las teclas ← → para navegar entre diapositivas o Esc para cerrar.' },
    ],
    illustrationColor: '#4F46E5',
    illustration: (
      <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="s1g" x1="10" y1="10" x2="190" y2="190" gradientUnits="userSpaceOnUse">
            <stop offset="0%"   stopColor="#FFD040"/>
            <stop offset="28%"  stopColor="#FF7028"/>
            <stop offset="50%"  stopColor="#FF2878"/>
            <stop offset="72%"  stopColor="#8B28FF"/>
            <stop offset="100%" stopColor="#1820B8"/>
          </linearGradient>
          <clipPath id="s1c"><circle cx="100" cy="100" r="87"/></clipPath>
        </defs>
        {/* App chrome background */}
        <rect width="160" height="160" fill="#F5F4FF" rx="10"/>
        {/* Sidebar strip */}
        <rect x="0" y="0" width="24" height="160" fill="#EAE8FF" rx="10"/>
        <rect x="4" y="6" width="16" height="16" rx="3" fill="#6366F1" opacity=".25"/>
        {([32,48,64,78,92] as number[]).map((y, i) => (
          <rect key={i} x="6" y={y} width="12" height="3" rx="1.5" fill="#6366F1" opacity=".18"/>
        ))}
        {/* Topbar */}
        <rect x="24" y="0" width="136" height="13" fill="#EAE8FF" opacity=".6"/>
        <rect x="28" y="4" width="48" height="5" rx="2.5" fill="#6366F1" opacity=".12"/>
        <circle cx="143" cy="6.5" r="4" fill="#6366F1" opacity=".2"/>
        <circle cx="131" cy="6.5" r="4" fill="#6366F1" opacity=".15"/>
        {/* MITIKUS logo — real, centered in content area */}
        <g transform="translate(66, 28) scale(0.28)">
          <circle cx="100" cy="100" r="90" fill="none" stroke="url(#s1g)" strokeWidth="5.5"/>
          <g clipPath="url(#s1c)">
            <polygon points="-10,0 192,95 192,100 -10,98" fill="url(#s1g)"/>
            <polygon points="-10,102 192,100 192,105 -10,200" fill="url(#s1g)"/>
          </g>
        </g>
        {/* Wordmark */}
        <text x="92" y="110" textAnchor="middle" fontSize="12" fontWeight="800" fontFamily="system-ui, sans-serif" fill="#1820B8" letterSpacing="2.5">MITIKUS</text>
        <text x="92" y="123" textAnchor="middle" fontSize="7" fontFamily="system-ui, sans-serif" fill="#6366F1" opacity=".65">Tu negocio, all in one</text>
        {/* Decorative sparkles */}
        <circle cx="36" cy="135" r="3.5" fill="#8B28FF" opacity=".18"/>
        <circle cx="148" cy="42" r="4"   fill="#FF7028" opacity=".13"/>
        <circle cx="145" cy="138" r="2.5" fill="#4F46E5" opacity=".18"/>
        <circle cx="40"  cy="26"  r="2"   fill="#FF2878" opacity=".2"/>
      </svg>
    ),
  },

  // ─── 2. Mi día ───────────────────────────────────────────────────────
  {
    tag: '☀ Mi día',
    tagColor: '#D97706',
    tagBg: '#FEF3C7',
    title: 'Tu punto de partida cada mañana',
    desc: 'Accede a Mi día para ver de un vistazo: tus tareas pendientes, el control de fichaje, facturas recientes y alertas fiscales.',
    tips: [
      { icon: '📋', text: 'Los pasos pendientes de tus misiones aparecen aquí con un enlace directo.' },
      { icon: '✓', text: 'La lista de primeros pasos desaparece sola cuando completas el setup inicial.' },
    ],
    illustrationColor: '#F59E0B',
    illustration: (
      <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Background */}
        <rect width="160" height="160" fill="#FFFDF5" rx="10"/>
        {/* Top header */}
        <rect x="0" y="0" width="160" height="18" fill="#FEF3C7" rx="10"/>
        <text x="10" y="13" fontSize="8" fontWeight="700" fontFamily="system-ui, sans-serif" fill="#92400E">☀  Mi día</text>
        <text x="130" y="13" fontSize="6" fontFamily="system-ui, sans-serif" fill="#B45309" opacity=".7">dom 3 ago</text>
        {/* Card: Tareas */}
        <rect x="8" y="24" width="68" height="60" rx="6" fill="white" stroke="#FDE68A" strokeWidth="1"/>
        <text x="15" y="35" fontSize="5.8" fontWeight="700" fontFamily="system-ui, sans-serif" fill="#78350F">Tareas pendientes</text>
        {[
          { y: 48, done: true,  label: 'Enviar prop. Acme' },
          { y: 60, done: false, label: 'Llamar proveedor' },
          { y: 72, done: false, label: 'Revisar contrato' },
        ].map((t, i) => (
          <g key={i}>
            <rect x="15" y={t.y - 5} width="6" height="6" rx="1.5"
              fill={t.done ? '#F59E0B' : 'none'}
              stroke={t.done ? '#F59E0B' : '#D1D5DB'} strokeWidth="1"/>
            {t.done && <path d={`M${16} ${t.y - 2.5} l1.5 1.5 2.5-2.5`} stroke="white" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>}
            <text x="26" y={t.y + 0.5} fontSize="4.8" fontFamily="system-ui, sans-serif"
              fill={t.done ? '#9CA3AF' : '#374151'}
              textDecoration={t.done ? 'line-through' : undefined}>
              {t.label}
            </text>
          </g>
        ))}
        {/* Card: Reloj fichaje */}
        <rect x="84" y="24" width="68" height="38" rx="6" fill="white" stroke="#FDE68A" strokeWidth="1"/>
        <text x="91" y="35" fontSize="5.8" fontWeight="700" fontFamily="system-ui, sans-serif" fill="#78350F">Control horario</text>
        <text x="118" y="49" textAnchor="middle" fontSize="12.5" fontWeight="800" fontFamily="system-ui, sans-serif" fill="#F59E0B">09:32</text>
        <text x="118" y="58" textAnchor="middle" fontSize="4.4" fontFamily="system-ui, sans-serif" fill="#92400E" opacity=".7">En curso · 2h 14m</text>
        {/* Card: Alerta fiscal */}
        <rect x="8" y="112" width="144" height="22" rx="6" fill="#FEF3C7" stroke="#FDE68A" strokeWidth="1"/>
        <circle cx="22" cy="123" r="5.5" fill="#F59E0B"/>
        <text x="22" y="126" textAnchor="middle" fontSize="7.5" fontFamily="system-ui, sans-serif" fill="white" fontWeight="700">!</text>
        <text x="34" y="121" fontSize="6.2" fontWeight="700" fontFamily="system-ui, sans-serif" fill="#92400E">Modelo 303 · Plazo en 3 días</text>
        <text x="34" y="129.5" fontSize="5.2" fontFamily="system-ui, sans-serif" fill="#B45309" opacity=".8">IVA 2T 2026 · Vence el 21 ago</text>
        {/* Card: Factura reciente */}
        <rect x="84" y="68" width="68" height="36" rx="6" fill="white" stroke="#FDE68A" strokeWidth="1"/>
        <text x="91" y="79" fontSize="5.8" fontWeight="700" fontFamily="system-ui, sans-serif" fill="#78350F">Facturas</text>
        <text x="91" y="89" fontSize="4.8" fontFamily="system-ui, sans-serif" fill="#6B7280">FAC-012 · Acme</text>
        <text x="91" y="99" fontSize="6.6" fontWeight="700" fontFamily="system-ui, sans-serif" fill="#059669">2.400 €</text>
        <rect x="127" y="90" width="18" height="7" rx="3.5" fill="#D1FAE5"/>
        <text x="136" y="95.5" textAnchor="middle" fontSize="4.5" fontWeight="700" fontFamily="system-ui, sans-serif" fill="#065F46">PAGADA</text>
        {/* Bottom progress bar */}
        <rect x="8" y="140" width="144" height="5" rx="2.5" fill="#FDE68A" opacity=".4"/>
        <rect x="8" y="140" width="90" height="5" rx="2.5" fill="#F59E0B" opacity=".7"/>
        <text x="8" y="154" fontSize="5.5" fontFamily="system-ui, sans-serif" fill="#92400E" opacity=".7">Configuración: 63% completado</text>
      </svg>
    ),
  },

  // ─── 3. Arkos IA ─────────────────────────────────────────────────────
  {
    tag: '✦ Arkos IA',
    tagColor: '#7C3AED',
    tagBg: '#F5F3FF',
    title: 'Tu asesor estratégico con IA',
    desc: 'Cuéntale a Arkos qué hace tu empresa. Él genera misiones, sugiere pasos y te recomienda qué herramientas usar para ejecutar tu estrategia.',
    tips: [
      { icon: '💬', text: 'Empieza escribiendo: "Soy consultor y quiero conseguir 3 clientes nuevos este trimestre"' },
      { icon: '🎯', text: 'Arkos accede al contexto de tu empresa para darte respuestas más precisas.' },
    ],
    illustrationColor: '#8B5CF6',
    illustration: (
      <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Background */}
        <rect width="160" height="160" fill="#FAFAFE" rx="10"/>
        {/* Header */}
        <rect x="0" y="0" width="160" height="18" fill="#EDE9FE" rx="10"/>
        <circle cx="12" cy="9" r="5" fill="#7C3AED" opacity=".8"/>
        <text x="12" y="12" textAnchor="middle" fontSize="7" fontFamily="system-ui, sans-serif" fill="white" fontWeight="800">✦</text>
        <text x="22" y="13" fontSize="8" fontWeight="700" fontFamily="system-ui, sans-serif" fill="#5B21B6">Arkos</text>
        <text x="137" y="13" textAnchor="middle" fontSize="5" fontFamily="system-ui, sans-serif" fill="#7C3AED" opacity=".6">Copiloto IA</text>
        {/* AI bubble 1 */}
        <circle cx="16" cy="32" r="6" fill="#7C3AED"/>
        <text x="16" y="35" textAnchor="middle" fontSize="7" fontFamily="system-ui, sans-serif" fill="white" fontWeight="700">A</text>
        <rect x="27" y="24" width="112" height="24" rx="5" fill="#EDE9FE"/>
        <text x="34" y="33" fontSize="5.3" fontFamily="system-ui, sans-serif" fill="#4C1D95">Hola. Soy Arkos, tu copiloto estratégico.</text>
        <text x="34" y="42" fontSize="5.3" fontFamily="system-ui, sans-serif" fill="#4C1D95">¿En qué quieres que trabajemos hoy?</text>
        {/* User bubble */}
        <rect x="18" y="55" width="118" height="16" rx="5" fill="#7C3AED"/>
        <text x="77" y="62" textAnchor="middle" fontSize="5.4" fontFamily="system-ui, sans-serif" fill="white">Quiero captar 3 clientes nuevos</text>
        <text x="77" y="69" textAnchor="middle" fontSize="5.4" fontFamily="system-ui, sans-serif" fill="white" opacity=".85">este trimestre</text>
        {/* AI response bubble */}
        <circle cx="16" cy="87" r="6" fill="#7C3AED"/>
        <text x="16" y="90" textAnchor="middle" fontSize="7" fontFamily="system-ui, sans-serif" fill="white" fontWeight="700">A</text>
        <rect x="27" y="78" width="124" height="42" rx="5" fill="#EDE9FE"/>
        <text x="34" y="89" fontSize="5.4" fontFamily="system-ui, sans-serif" fill="#4C1D95">Perfecto. Te propongo 3 misiones:</text>
        <rect x="34" y="93" width="6" height="6" rx="1" fill="#7C3AED" opacity=".6"/>
        <text x="44" y="98.5" fontSize="4.9" fontFamily="system-ui, sans-serif" fill="#5B21B6">Optimizar propuesta comercial</text>
        <rect x="34" y="103" width="6" height="6" rx="1" fill="#7C3AED" opacity=".4"/>
        <text x="44" y="108.5" fontSize="4.9" fontFamily="system-ui, sans-serif" fill="#5B21B6">Activar canal LinkedIn</text>
        <rect x="34" y="113" width="6" height="6" rx="1" fill="#7C3AED" opacity=".2"/>
        <text x="44" y="118.5" fontSize="4.9" fontFamily="system-ui, sans-serif" fill="#5B21B6">Crear caso de estudio</text>
        {/* Input bar */}
        <rect x="8" y="132" width="144" height="20" rx="6" fill="white" stroke="#DDD6FE" strokeWidth="1"/>
        <text x="18" y="146" fontSize="6" fontFamily="system-ui, sans-serif" fill="#9CA3AF">Escribe a Arkos…</text>
        <rect x="136" y="136" width="12" height="12" rx="3" fill="#7C3AED"/>
        <path d="M142 140 l1 3 -4 0" fill="white"/>
      </svg>
    ),
  },

  // ─── 4. Misiones ─────────────────────────────────────────────────────
  {
    tag: '🎯 Misiones',
    tagColor: '#059669',
    tagBg: '#ECFDF5',
    title: 'Objetivos convertidos en pasos accionables',
    desc: 'Una misión es un objetivo de negocio descompuesto en pasos concretos. Arkos puede generarlas automáticamente o puedes crearlas tú.',
    tips: [
      { icon: '📊', text: 'Cada misión muestra su progreso, tiempo estimado e impacto esperado.' },
      { icon: '🔗', text: 'Los pasos pueden vincularse directamente a una herramienta o flujo de trabajo.' },
    ],
    illustrationColor: '#10B981',
    illustration: (
      <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Background */}
        <rect width="160" height="160" fill="#F7FFFC" rx="10"/>
        {/* Header */}
        <rect x="0" y="0" width="160" height="18" fill="#D1FAE5" rx="10"/>
        <text x="10" y="13" fontSize="8" fontWeight="700" fontFamily="system-ui, sans-serif" fill="#065F46">🎯  Misiones</text>
        <rect x="128" y="5" width="24" height="8" rx="4" fill="#10B981"/>
        <text x="140" y="11" textAnchor="middle" fontSize="5.5" fontWeight="700" fontFamily="system-ui, sans-serif" fill="white">+ Nueva</text>
        {/* Mission card 1 */}
        <rect x="8" y="26" width="144" height="36" rx="6" fill="white" stroke="#A7F3D0" strokeWidth="1"/>
        <circle cx="18" cy="44" r="5" fill="#10B981"/>
        <text x="18" y="47" textAnchor="middle" fontSize="7" fill="white" fontWeight="700">↑</text>
        <text x="30" y="36" fontSize="6.5" fontWeight="700" fontFamily="system-ui, sans-serif" fill="#065F46">Captación de 3 clientes nuevos</text>
        <text x="30" y="45" fontSize="5.5" fontFamily="system-ui, sans-serif" fill="#6B7280">6 pasos · 3 completados</text>
        <rect x="30" y="50" width="100" height="4" rx="2" fill="#D1FAE5"/>
        <rect x="30" y="50" width="50" height="4" rx="2" fill="#10B981"/>
        <text x="133" y="54" fontSize="5.5" fontWeight="700" fontFamily="system-ui, sans-serif" fill="#059669">50%</text>
        {/* Mission card 2 */}
        <rect x="8" y="70" width="144" height="36" rx="6" fill="white" stroke="#BAE6FD" strokeWidth="1"/>
        <circle cx="18" cy="88" r="5" fill="#3B82F6"/>
        <text x="18" y="91" textAnchor="middle" fontSize="7" fill="white" fontWeight="700">✦</text>
        <text x="30" y="80" fontSize="6.5" fontWeight="700" fontFamily="system-ui, sans-serif" fill="#1E40AF">Presencia digital en LinkedIn</text>
        <text x="30" y="89" fontSize="5.5" fontFamily="system-ui, sans-serif" fill="#6B7280">4 pasos · 1 completado</text>
        <rect x="30" y="94" width="100" height="4" rx="2" fill="#DBEAFE"/>
        <rect x="30" y="94" width="25" height="4" rx="2" fill="#3B82F6"/>
        <text x="133" y="98" fontSize="5.5" fontWeight="700" fontFamily="system-ui, sans-serif" fill="#1D4ED8">25%</text>
        {/* Mission card 3 */}
        <rect x="8" y="114" width="144" height="36" rx="6" fill="white" stroke="#E5E7EB" strokeWidth="1"/>
        <circle cx="18" cy="132" r="5" fill="#8B5CF6"/>
        <text x="18" y="135" textAnchor="middle" fontSize="6" fill="white" fontWeight="700">▶</text>
        <text x="30" y="124" fontSize="6.5" fontWeight="700" fontFamily="system-ui, sans-serif" fill="#5B21B6">Automatizar onboarding de clientes</text>
        <text x="30" y="133" fontSize="5.5" fontFamily="system-ui, sans-serif" fill="#6B7280">5 pasos · Sin iniciar</text>
        <rect x="30" y="138" width="100" height="4" rx="2" fill="#EDE9FE"/>
        <text x="133" y="142" fontSize="5.5" fontWeight="700" fontFamily="system-ui, sans-serif" fill="#7C3AED">0%</text>
      </svg>
    ),
  },

  // ─── 5. Clientes + Tareas ────────────────────────────────────────────
  {
    tag: '👥 Clientes · Tareas',
    tagColor: '#1D4ED8',
    tagBg: '#EFF6FF',
    title: 'Organiza tu trabajo por cliente',
    desc: 'Registra tus clientes con sus datos de contacto. Asocia tareas, facturas y misiones a cada uno para tener una visión 360° de la relación.',
    tips: [
      { icon: '🏷', text: 'Las tareas tienen prioridades, fechas límite y se pueden compartir con un enlace público.' },
      { icon: '🔔', text: 'Recibirás una notificación cuando se acerque la fecha límite de una tarea.' },
    ],
    illustrationColor: '#3B82F6',
    illustration: (
      <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Background */}
        <rect width="160" height="160" fill="#F8FAFF" rx="10"/>
        {/* ── Left panel: Clientes ── */}
        <rect x="0" y="0" width="78" height="160" fill="#EFF6FF" rx="10"/>
        <rect x="0" y="12" width="78" height="148" fill="#EFF6FF"/>
        <text x="8" y="12" fontSize="7" fontWeight="700" fontFamily="system-ui, sans-serif" fill="#1D4ED8">Clientes</text>
        <rect x="4" y="16" width="70" height="1" fill="#BFDBFE"/>
        {[
          { y: 28, name: 'Acme Corp',  tag: 'Activo', c: '#3B82F6', bg: '#DBEAFE', tc: '#1D4ED8' },
          { y: 52, name: 'Beta S.L.',  tag: 'Lead',   c: '#8B5CF6', bg: '#EDE9FE', tc: '#5B21B6' },
          { y: 76, name: 'Gamma Dev',  tag: 'Activo', c: '#10B981', bg: '#D1FAE5', tc: '#065F46' },
          { y: 100, name: 'Delta Pro', tag: 'Cerrado', c: '#9CA3AF', bg: '#F3F4F6', tc: '#6B7280' },
        ].map((cl, i) => (
          <g key={i}>
            <rect x="4" y={cl.y - 10} width="70" height="20" rx="4" fill={i === 0 ? '#DBEAFE' : 'white'} stroke="#BFDBFE" strokeWidth={i === 0 ? 1.5 : 0.5}/>
            <circle cx="14" cy={cl.y} r="6" fill={cl.c} opacity=".8"/>
            <text x="14" y={cl.y + 2.5} textAnchor="middle" fontSize="6" fontFamily="system-ui, sans-serif" fill="white" fontWeight="700">{cl.name[0]}</text>
            <text x="24" y={cl.y - 1} fontSize="6" fontWeight="600" fontFamily="system-ui, sans-serif" fill="#1E3A8A">{cl.name}</text>
            <rect x="24" y={cl.y + 3} width={cl.tag.length * 4 + 4} height="7" rx="3.5" fill={cl.bg}/>
            <text x={24 + (cl.tag.length * 4 + 4)/2} y={cl.y + 8} textAnchor="middle" fontSize="4.5" fontWeight="700" fontFamily="system-ui, sans-serif" fill={cl.tc}>{cl.tag}</text>
          </g>
        ))}
        {/* ── Right panel: Tareas ── */}
        <text x="86" y="12" fontSize="7" fontWeight="700" fontFamily="system-ui, sans-serif" fill="#1D4ED8">Tareas</text>
        <rect x="80" y="16" width="76" height="1" fill="#BFDBFE"/>
        {[
          { y: 30, label: 'Enviar propuesta v2',   prio: 'Alta',  done: false, pc: '#EF4444', pb: '#FEE2E2' },
          { y: 50, label: 'Revisión de contrato',   prio: 'Media', done: false, pc: '#F59E0B', pb: '#FEF3C7' },
          { y: 70, label: 'Reunión de seguimiento', prio: 'Baja',  done: true,  pc: '#9CA3AF', pb: '#F3F4F6' },
          { y: 90, label: 'Actualizar brief',       prio: 'Alta',  done: false, pc: '#EF4444', pb: '#FEE2E2' },
          { y: 110, label: 'Factura diciembre',     prio: 'Media', done: true,  pc: '#9CA3AF', pb: '#F3F4F6' },
        ].map((t, i) => (
          <g key={i}>
            <rect x="82" y={t.y - 12} width="72" height="18" rx="4" fill="white" stroke="#E0EAFF" strokeWidth="0.75"/>
            <rect x="85" y={t.y - 9} width="6" height="6" rx="1.5"
              fill={t.done ? '#3B82F6' : 'none'}
              stroke={t.done ? '#3B82F6' : '#D1D5DB'} strokeWidth="1"/>
            {t.done && <path d={`M86.3 ${t.y - 6.3} l1.4 1.4 2.3-2.3`} stroke="white" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>}
            <text x="95" y={t.y - 4} fontSize="5.5" fontFamily="system-ui, sans-serif"
              fill={t.done ? '#9CA3AF' : '#374151'}
              textDecoration={t.done ? 'line-through' : 'none'}>{t.label}</text>
            <rect x="95" y={t.y + 0} width={t.prio.length * 4} height="5.5" rx="2.75" fill={t.done ? '#F3F4F6' : t.pb}/>
            <text x={95 + t.prio.length * 2} y={t.y + 4.2} textAnchor="middle" fontSize="4" fontWeight="700" fontFamily="system-ui, sans-serif" fill={t.done ? '#9CA3AF' : t.pc}>{t.prio}</text>
          </g>
        ))}
      </svg>
    ),
  },

  // ─── 6. Facturas ─────────────────────────────────────────────────────
  {
    tag: '💶 Facturas',
    tagColor: '#C2410C',
    tagBg: '#FFF7ED',
    title: 'Emite facturas profesionales en segundos',
    desc: 'Crea facturas con líneas de detalle, IVA automático y número correlativo. Descarga el PDF listo para enviar o márcala como cobrada con un clic.',
    tips: [
      { icon: '📄', text: 'El panel lateral muestra el detalle completo de cada factura sin salir de la lista.' },
      { icon: '📊', text: 'Las stats muestran lo emitido este mes y lo pendiente de cobro.' },
    ],
    illustrationColor: '#F97316',
    illustration: (
      <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Background */}
        <rect width="160" height="160" fill="#FFFDF9" rx="10"/>
        {/* Stats row */}
        <rect x="4" y="4" width="46" height="20" rx="5" fill="#FFF7ED" stroke="#FED7AA" strokeWidth="1"/>
        <text x="27" y="10" textAnchor="middle" fontSize="4.6" fontFamily="system-ui, sans-serif" fill="#92400E">Emitido mes</text>
        <text x="27" y="20" textAnchor="middle" fontSize="6.6" fontWeight="800" fontFamily="system-ui, sans-serif" fill="#EA580C">8.400 €</text>
        <rect x="56" y="4" width="46" height="20" rx="5" fill="#FFF7ED" stroke="#FED7AA" strokeWidth="1"/>
        <text x="79" y="10" textAnchor="middle" fontSize="4.6" fontFamily="system-ui, sans-serif" fill="#92400E">Pendiente</text>
        <text x="79" y="20" textAnchor="middle" fontSize="6.6" fontWeight="800" fontFamily="system-ui, sans-serif" fill="#EA580C">3.200 €</text>
        <rect x="108" y="4" width="48" height="20" rx="5" fill="#F97316"/>
        <text x="132" y="16.5" textAnchor="middle" fontSize="5.2" fontWeight="700" fontFamily="system-ui, sans-serif" fill="white">+ Nueva</text>
        {/* Table header */}
        <rect x="4" y="30" width="152" height="10" rx="3" fill="#FEF3C7"/>
        <text x="8"   y="37.5" fontSize="5" fontWeight="700" fontFamily="system-ui, sans-serif" fill="#92400E">Nº</text>
        <text x="26"  y="37.5" fontSize="5" fontWeight="700" fontFamily="system-ui, sans-serif" fill="#92400E">Cliente</text>
        <text x="82"  y="37.5" fontSize="5" fontWeight="700" fontFamily="system-ui, sans-serif" fill="#92400E">Fecha</text>
        <text x="110" y="37.5" fontSize="5" fontWeight="700" fontFamily="system-ui, sans-serif" fill="#92400E">Importe</text>
        <text x="135" y="37.5" fontSize="5" fontWeight="700" fontFamily="system-ui, sans-serif" fill="#92400E">Estado</text>
        {/* Invoice rows */}
        {[
          { n: 'FAC-012', client: 'Acme Corp',  date: '01/08/26', amt: '2.400 €', tag: 'PAGADA',   bc: '#D1FAE5', tc: '#065F46' },
          { n: 'FAC-011', client: 'Beta S.L.',  date: '28/07/26', amt: '1.200 €', tag: 'EMITIDA',  bc: '#DBEAFE', tc: '#1D4ED8' },
          { n: 'FAC-010', client: 'Gamma Dev',  date: '20/07/26', amt: '3.800 €', tag: 'PAGADA',   bc: '#D1FAE5', tc: '#065F46' },
          { n: 'FAC-009', client: 'Delta Pro',  date: '15/07/26', amt: '600 €',   tag: 'BORR.',    bc: '#F3F4F6', tc: '#6B7280' },
          { n: 'FAC-008', client: 'Acme Corp',  date: '10/07/26', amt: '1.800 €', tag: 'PAGADA',   bc: '#D1FAE5', tc: '#065F46' },
        ].map((inv, i) => (
          <g key={i}>
            <rect x="4" y={42 + i * 22} width="152" height="20" rx="3" fill={i % 2 === 0 ? 'white' : '#FFFBF7'} stroke="#FED7AA" strokeWidth="0.5"/>
            <text x="8"   y={55 + i * 22} fontSize="4.8" fontWeight="600" fontFamily="system-ui, sans-serif" fill="#374151">{inv.n}</text>
            <text x="26"  y={55 + i * 22} fontSize="4.8" fontFamily="system-ui, sans-serif" fill="#374151">{inv.client}</text>
            <text x="82"  y={55 + i * 22} fontSize="4.8" fontFamily="system-ui, sans-serif" fill="#6B7280">{inv.date}</text>
            <text x="110" y={55 + i * 22} fontSize="4.8" fontWeight="600" fontFamily="system-ui, sans-serif" fill="#111827">{inv.amt}</text>
            <rect x="133" y={46 + i * 22} width={inv.tag === 'EMITIDA' ? 24 : 22} height="9" rx="4.5" fill={inv.bc}/>
            <text x={147} y={53 + i * 22} textAnchor="middle" fontSize="4.5" fontWeight="700" fontFamily="system-ui, sans-serif" fill={inv.tc}>{inv.tag}</text>
          </g>
        ))}
      </svg>
    ),
  },

  // ─── 7. Fiscal ───────────────────────────────────────────────────────
  {
    tag: '📅 Fiscal',
    tagColor: '#B91C1C',
    tagBg: '#FEF2F2',
    title: 'Nunca más olvides una obligación fiscal',
    desc: 'Configura tu forma jurídica y MITIKUS te muestra el calendario fiscal completo: modelo 303, 130, 111 y todos los plazos del año.',
    tips: [
      { icon: '⚠️', text: 'Los modelos próximos al plazo aparecen en amarillo; los vencidos en rojo.' },
      { icon: '📋', text: 'Puedes calcular el importe en la app y exportar un resumen para tu gestor.' },
    ],
    illustrationColor: '#EF4444',
    illustration: (
      <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Background */}
        <rect width="160" height="160" fill="#FFFAFA" rx="10"/>
        {/* Header */}
        <rect x="0" y="0" width="160" height="18" fill="#FEE2E2" rx="10"/>
        <text x="10" y="13" fontSize="8" fontWeight="700" fontFamily="system-ui, sans-serif" fill="#991B1B">📅  Calendario Fiscal · 2026</text>
        {/* Stats row */}
        <rect x="4" y="22" width="34" height="17" rx="4" fill="#FEE2E2"/>
        <text x="21" y="28" textAnchor="middle" fontSize="4.3" fontFamily="system-ui, sans-serif" fill="#991B1B">Próximos</text>
        <text x="21" y="36" textAnchor="middle" fontSize="6.4" fontWeight="800" fontFamily="system-ui, sans-serif" fill="#DC2626">3</text>
        <rect x="42" y="22" width="34" height="17" rx="4" fill="#FEF3C7"/>
        <text x="59" y="28" textAnchor="middle" fontSize="4.3" fontFamily="system-ui, sans-serif" fill="#92400E">Este mes</text>
        <text x="59" y="36" textAnchor="middle" fontSize="6.4" fontWeight="800" fontFamily="system-ui, sans-serif" fill="#D97706">2</text>
        <rect x="80" y="22" width="34" height="17" rx="4" fill="#D1FAE5"/>
        <text x="97" y="28" textAnchor="middle" fontSize="4.3" fontFamily="system-ui, sans-serif" fill="#065F46">Cumplidos</text>
        <text x="97" y="36" textAnchor="middle" fontSize="6.4" fontWeight="800" fontFamily="system-ui, sans-serif" fill="#059669">7</text>
        {/* Deadline cards */}
        {[
          { model: '303', label: 'IVA 2T 2026', deadline: '21 ago 2026', days: '3 días', urgent: true,  color: '#DC2626', bg: '#FEE2E2', bd: '#FECACA' },
          { model: '130', label: 'IRPF 2T 2026', deadline: '21 ago 2026', days: '3 días', urgent: true,  color: '#DC2626', bg: '#FEE2E2', bd: '#FECACA' },
          { model: '303', label: 'IVA 3T 2026', deadline: '20 oct 2026', days: '78 días', urgent: false, color: '#D97706', bg: '#FEF3C7', bd: '#FDE68A' },
          { model: '111', label: 'Retenciones 3T', deadline: '20 oct 2026', days: '78 días', urgent: false, color: '#D97706', bg: '#FEF3C7', bd: '#FDE68A' },
        ].map((d, i) => (
          <g key={i}>
            <rect x="4" y={44 + i * 28} width="152" height="24" rx="5" fill={d.bg} stroke={d.bd} strokeWidth="1"/>
            <rect x="8" y={48 + i * 28} width="18" height="16" rx="3" fill={d.color}/>
            <text x="17" y={55 + i * 28} textAnchor="middle" fontSize="5" fontWeight="800" fontFamily="system-ui, sans-serif" fill="white">Mod.</text>
            <text x="17" y={61 + i * 28} textAnchor="middle" fontSize="6.5" fontWeight="800" fontFamily="system-ui, sans-serif" fill="white">{d.model}</text>
            <text x="32" y={55 + i * 28} fontSize="6.5" fontWeight="700" fontFamily="system-ui, sans-serif" fill={d.color}>{d.label}</text>
            <text x="32" y={64 + i * 28} fontSize="5.5" fontFamily="system-ui, sans-serif" fill="#6B7280">Vence: {d.deadline}</text>
            <rect x="118" y={48 + i * 28} width="34" height="12" rx="6" fill={d.color} opacity={d.urgent ? 1 : 0.7}/>
            <text x="135" y={57 + i * 28} textAnchor="middle" fontSize="5" fontWeight="700" fontFamily="system-ui, sans-serif" fill="white">{d.days}</text>
          </g>
        ))}
      </svg>
    ),
  },

  // ─── 8. Mi Office ────────────────────────────────────────────────────
  {
    tag: '📁 Mi Office',
    tagColor: '#0E7490',
    tagBg: '#ECFEFF',
    title: 'Todos tus documentos en un solo lugar',
    desc: 'Mi Office incluye editor de texto con IA, hojas de cálculo, visor de PDFs con búsqueda, notebooks, contratos con firma digital y presentaciones.',
    tips: [
      { icon: '✍️', text: 'Los contratos pueden enviarse al cliente para firma digital con verificación OTP.' },
      { icon: '🤖', text: 'El Notebook analiza documentos y PDFs y responde preguntas sobre su contenido.' },
    ],
    illustrationColor: '#06B6D4',
    illustration: (
      <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Background */}
        <rect width="160" height="160" fill="#F0FDFF" rx="10"/>
        {/* Header */}
        <rect x="0" y="0" width="160" height="18" fill="#CFFAFE" rx="10"/>
        <text x="10" y="13" fontSize="8" fontWeight="700" fontFamily="system-ui, sans-serif" fill="#155E75">📁  Mi Office</text>
        {/* 2×3 tool grid */}
        {[
          { x: 6,  y: 24, emoji: '📝', label: 'Documentos', c: '#0891B2', bg: '#E0F7FA' },
          { x: 58, y: 24, emoji: '📊', label: 'Hojas',      c: '#059669', bg: '#D1FAE5' },
          { x: 110, y: 24, emoji: '📑', label: 'PDFs',       c: '#DC2626', bg: '#FEE2E2' },
          { x: 6,  y: 94, emoji: '✍️', label: 'Contratos',  c: '#7C3AED', bg: '#EDE9FE' },
          { x: 58, y: 94, emoji: '🖥', label: 'Presentac.', c: '#D97706', bg: '#FEF3C7' },
          { x: 110, y: 94, emoji: '🔍', label: 'Notebooks',  c: '#4F46E5', bg: '#EEF2FF' },
        ].map((tool, i) => (
          <g key={i}>
            <rect x={tool.x} y={tool.y} width="46" height="64" rx="8" fill="white" stroke={tool.c} strokeWidth="0.75" opacity=".8"/>
            <rect x={tool.x + 8} y={tool.y + 10} width="30" height="30" rx="6" fill={tool.bg}/>
            <text x={tool.x + 23} y={tool.y + 31} textAnchor="middle" fontSize="16" fontFamily="system-ui, sans-serif">{tool.emoji}</text>
            <text x={tool.x + 23} y={tool.y + 53} textAnchor="middle" fontSize="6" fontWeight="600" fontFamily="system-ui, sans-serif" fill={tool.c}>{tool.label}</text>
            {/* Mini file lines */}
            <rect x={tool.x + 10} y={tool.y + 57} width="26" height="2" rx="1" fill={tool.c} opacity=".15"/>
            <rect x={tool.x + 14} y={tool.y + 61} width="18" height="2" rx="1" fill={tool.c} opacity=".1"/>
          </g>
        ))}
      </svg>
    ),
  },

  // ─── 9. Control Horario ──────────────────────────────────────────────
  {
    tag: '⏱ Control Horario',
    tagColor: '#4338CA',
    tagBg: '#EEF2FF',
    title: 'Ficha y registra tu jornada laboral',
    desc: 'Registra entradas y salidas con el widget del reloj en Mi día. En Control Horario verás la tabla semanal e imputarás horas a clientes o proyectos.',
    tips: [
      { icon: '📊', text: 'La tabla semanal muestra las horas por día con totales. Edita cualquier entrada directamente.' },
      { icon: '🗂', text: 'Imputa horas a un cliente o proyecto para llevar control de facturación por tiempo.' },
    ],
    illustrationColor: '#6366F1',
    illustration: (
      <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Background */}
        <rect width="160" height="160" fill="#F8F8FF" rx="10"/>
        {/* Header */}
        <rect x="0" y="0" width="160" height="18" fill="#E0E7FF" rx="10"/>
        <text x="10" y="13" fontSize="8" fontWeight="700" fontFamily="system-ui, sans-serif" fill="#312E81">⏱  Control Horario</text>
        <text x="135" y="13" fontSize="6" fontFamily="system-ui, sans-serif" fill="#4338CA">Sem. 31</text>
        {/* Clock widget */}
        <rect x="4" y="22" width="50" height="32" rx="6" fill="white" stroke="#C7D2FE" strokeWidth="1"/>
        <text x="29" y="33" textAnchor="middle" fontSize="5.1" fontFamily="system-ui, sans-serif" fill="#6B7280">Hoy trabajado</text>
        <text x="29" y="46" textAnchor="middle" fontSize="10" fontWeight="800" fontFamily="system-ui, sans-serif" fill="#4338CA">6h 32m</text>
        <rect x="58" y="22" width="50" height="32" rx="6" fill="#4338CA"/>
        <text x="83" y="32" textAnchor="middle" fontSize="5.1" fontFamily="system-ui, sans-serif" fill="#C7D2FE">Esta semana</text>
        <text x="83" y="45" textAnchor="middle" fontSize="9.5" fontWeight="800" fontFamily="system-ui, sans-serif" fill="white">32h 10m</text>
        <rect x="112" y="22" width="44" height="32" rx="6" fill="white" stroke="#C7D2FE" strokeWidth="1"/>
        <text x="134" y="32" textAnchor="middle" fontSize="6" fontFamily="system-ui, sans-serif" fill="#6B7280">Fichar</text>
        <rect x="118" y="36" width="32" height="12" rx="6" fill="#10B981"/>
        <text x="134" y="45" textAnchor="middle" fontSize="6" fontWeight="700" fontFamily="system-ui, sans-serif" fill="white">● Salida</text>
        {/* Week table */}
        {/* Header */}
        {(['L','M','X','J','V','S','D'] as string[]).map((d, i) => (
          <g key={i}>
            <rect x={4 + i * 22} y={60} width={20} height={10} rx={2} fill={i < 5 ? '#E0E7FF' : '#F3F4F6'}/>
            <text x={14 + i * 22} y={67.5} textAnchor="middle" fontSize="6" fontWeight="700" fontFamily="system-ui, sans-serif" fill={i < 5 ? '#4338CA' : '#9CA3AF'}>{d}</text>
          </g>
        ))}
        {/* Hours bars */}
        {([8.5, 7.2, 9.0, 6.3, 5.5, 0, 0] as number[]).map((h, i) => {
          const maxH = 9
          const barH = (h / maxH) * 52
          return (
            <g key={i}>
              <rect x={4 + i * 22} y={72} width={20} height={52} rx={2} fill={i < 5 ? '#EEF2FF' : '#F9FAFB'}/>
              {h > 0 && (
                <>
                  <rect x={4 + i * 22} y={72 + 52 - barH} width={20} height={barH} rx={2} fill={i < 5 ? '#6366F1' : '#E5E7EB'} opacity={i === 4 ? 0.7 : 1}/>
                  <text x={14 + i * 22} y={135} textAnchor="middle" fontSize="4.5" fontWeight="600" fontFamily="system-ui, sans-serif" fill="#4338CA">{h}h</text>
                </>
              )}
            </g>
          )
        })}
        {/* Total */}
        <rect x="4" y="140" width="152" height="14" rx="4" fill="#E0E7FF"/>
        <text x="10" y="150" fontSize="6" fontWeight="700" fontFamily="system-ui, sans-serif" fill="#312E81">Total semana:</text>
        <text x="68" y="150" fontSize="6" fontFamily="system-ui, sans-serif" fill="#4338CA">32h 10m</text>
        <text x="105" y="150" fontSize="6" fontFamily="system-ui, sans-serif" fill="#6B7280">Objetivo: 40h</text>
        <rect x="140" y="144" width="10" height="6" rx="3" fill="#6366F1" opacity=".3"/>
        <rect x="140" y="144" width="8" height="6" rx="3" fill="#6366F1" opacity=".7"/>
      </svg>
    ),
  },

  // ─── 10. ¡Listo! ─────────────────────────────────────────────────────
  {
    tag: '🚀 ¡Listo!',
    tagColor: '#059669',
    tagBg: '#ECFDF5',
    title: '¡Ya tienes todo lo que necesitas!',
    desc: 'Empieza por donde quieras. Si no sabes por dónde, habla con Arkos: él analizará tu situación y te propondrá un plan de acción personalizado.',
    tips: [
      { icon: '💡', text: 'Desde Mi día puedes completar los primeros pasos de configuración guiada.' },
      { icon: '❓', text: 'Puedes volver a ver este tour en cualquier momento desde "Tour de bienvenida" en el menú lateral.' },
    ],
    illustrationColor: '#10B981',
    illustration: (
      <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="s10g" x1="10" y1="10" x2="190" y2="190" gradientUnits="userSpaceOnUse">
            <stop offset="0%"   stopColor="#FFD040"/>
            <stop offset="28%"  stopColor="#FF7028"/>
            <stop offset="50%"  stopColor="#FF2878"/>
            <stop offset="72%"  stopColor="#8B28FF"/>
            <stop offset="100%" stopColor="#1820B8"/>
          </linearGradient>
          <clipPath id="s10c"><circle cx="100" cy="100" r="87"/></clipPath>
        </defs>
        {/* Background */}
        <rect width="160" height="160" fill="#F0FDF8" rx="10"/>
        {/* Large checkmark circle */}
        <circle cx="80" cy="85" r="52" fill="#D1FAE5"/>
        <circle cx="80" cy="85" r="40" fill="#A7F3D0"/>
        <path d="M62 85 l12 12 24-24" stroke="#059669" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
        {/* MITIKUS logo on top */}
        <circle cx="80" cy="42" r="20" fill="white" stroke="#D1FAE5" strokeWidth="2"/>
        <g transform="translate(63, 25) scale(0.17)">
          <circle cx="100" cy="100" r="90" fill="none" stroke="url(#s10g)" strokeWidth="5.5"/>
          <g clipPath="url(#s10c)">
            <polygon points="-10,0 192,95 192,100 -10,98" fill="url(#s10g)"/>
            <polygon points="-10,102 192,100 192,105 -10,200" fill="url(#s10g)"/>
          </g>
        </g>
        {/* Text */}
        <text x="80" y="148" textAnchor="middle" fontSize="9" fontWeight="800" fontFamily="system-ui, sans-serif" fill="#065F46">¡Bienvenido a MITIKUS!</text>
        <text x="80" y="158" textAnchor="middle" fontSize="6.5" fontFamily="system-ui, sans-serif" fill="#059669" opacity=".8">Tu oficina, lista para empezar</text>
        {/* Sparkles */}
        <circle cx="28"  cy="40"  r="3"   fill="#10B981" opacity=".4"/>
        <circle cx="136" cy="38"  r="4"   fill="#34D399" opacity=".35"/>
        <circle cx="20"  cy="120" r="2.5" fill="#6EE7B7" opacity=".5"/>
        <circle cx="145" cy="115" r="3"   fill="#10B981" opacity=".3"/>
        <path d="M130 55 l2-4 2 4-4-2 4 2z" fill="#059669" opacity=".4"/>
        <path d="M32 65 l1.5-3 1.5 3-3-1.5 3 1.5z" fill="#10B981" opacity=".35"/>
      </svg>
    ),
  },
]

interface Props {
  open: boolean
  onClose: () => void
}

export function OnboardingModal({ open, onClose }: Props) {
  const [current, setCurrent] = useState(0)
  const total = SLIDES.length

  const slide = SLIDES[current]!

  const next = useCallback(() => {
    if (current < total - 1) setCurrent((c) => c + 1)
    else {
      localStorage.setItem(STORAGE_KEY, '1')
      onClose()
    }
  }, [current, total, onClose])

  const prev = useCallback(() => {
    if (current > 0) setCurrent((c) => c - 1)
  }, [current])

  const close = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, '1')
    onClose()
  }, [onClose])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight') next()
      else if (e.key === 'ArrowLeft') prev()
      else if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, next, prev, close])

  // Reset to first slide when reopened
  useEffect(() => {
    if (open) setCurrent(0)
  }, [open])

  if (!open) return null

  const progress = ((current + 1) / total) * 100
  const isLast = current === total - 1

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Tour de bienvenida MITIKUS"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={close}
        aria-hidden
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-[720px] bg-background border border-border rounded-2xl overflow-hidden shadow-2xl">

        {/* Progress bar */}
        <div className="h-0.5 bg-muted">
          <div
            className="h-full bg-primary transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Close button */}
        <button
          type="button"
          onClick={close}
          aria-label="Cerrar tour"
          className="absolute top-3 right-3 z-20 w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M18 6 6 18M6 6l12 12"/>
          </svg>
        </button>

        {/* Slide body */}
        <div className="flex min-h-[380px]">

          {/* Illustration */}
          <div
            className="hidden sm:flex w-[42%] flex-shrink-0 items-center justify-center p-8 relative overflow-hidden transition-colors duration-500"
            style={{ background: `${slide.illustrationColor}0d` }}
          >
            {/* Radial glow */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `radial-gradient(ellipse at 50% 40%, ${slide.illustrationColor}22 0%, transparent 70%)`,
              }}
            />
            <div className="relative z-10 w-full max-w-[180px] transition-all duration-300">
              {slide.illustration}
            </div>
          </div>

          {/* Text */}
          <div className="flex flex-col gap-3 p-7 sm:p-8 min-w-0 flex-1">
            <span
              className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full w-fit"
              style={{ color: slide.tagColor, background: slide.tagBg }}
            >
              {slide.tag}
            </span>

            <h2 className="text-xl font-bold leading-snug tracking-tight">
              {slide.title}
            </h2>

            <p className="text-sm text-muted-foreground leading-relaxed">
              {slide.desc}
            </p>

            <div className="flex flex-col gap-2 mt-1">
              {slide.tips.map((tip, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2.5 text-xs text-muted-foreground bg-muted/50 border border-border rounded-lg px-3 py-2"
                >
                  <span className="shrink-0 mt-0.5">{tip.icon}</span>
                  <span className="leading-relaxed">{tip.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border gap-4">

          {/* Dots + counter */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5" role="tablist" aria-label="Diapositivas">
              {SLIDES.map((_, i) => (
                <button
                  key={i}
                  role="tab"
                  aria-selected={i === current}
                  aria-label={`Diapositiva ${i + 1}`}
                  onClick={() => setCurrent(i)}
                  className={`h-1.5 rounded-full transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    i === current
                      ? 'w-5 bg-primary'
                      : 'w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground tabular-nums">
              {current + 1} / {total}
            </span>
          </div>

          {/* Nav buttons */}
          <div className="flex items-center gap-2">
            {current > 0 && (
              <button
                type="button"
                onClick={prev}
                className="px-3.5 py-1.5 rounded-lg text-sm font-medium bg-muted hover:bg-muted/80 text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                ← Anterior
              </button>
            )}
            <button
              type="button"
              onClick={next}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                isLast
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-primary hover:bg-primary/90'
              }`}
            >
              {isLast ? '¡Empezar!' : 'Siguiente →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export { STORAGE_KEY as ONBOARDING_STORAGE_KEY }
