'use client'

import { Fragment, useEffect, useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { getLogoImageStyle, getLogoTextStyle } from '@/lib/logo-crop'
import { WorkspaceSidebarItem, type NavItem } from './WorkspaceSidebarItem'

interface NavGroup {
  label?: string
  items: NavItem[]
}

interface Props {
  workspaceId: string
  workspaceName: string
  workspaceLogoUrl?: string | null
  workspaceBrandColor?: string
  workspaceLogoShowName?: boolean
  workspaceLogoCrop?: { x: number; y: number; zoom: number }
  workspaceLogoText?: { x: number; y: number; size: number; color: string; font: string }
  navGroups: NavGroup[]
  collapsed?: boolean
  onOpenOnboarding?: () => void
}

export function WorkspaceSidebar({ workspaceId, workspaceName, workspaceLogoUrl, workspaceBrandColor = '#3B82F6', workspaceLogoShowName = false, workspaceLogoCrop, workspaceLogoText, navGroups, collapsed = false, onOpenOnboarding }: Props) {
  const logoCrop = workspaceLogoCrop ?? { x: 0, y: 0, zoom: 1 }
  const logoText = workspaceLogoText ?? { x: 12, y: 12, size: 16, color: '#FFFFFF', font: 'Inter' }
  const [logoSize, setLogoSize] = useState<{ width: number; height: number } | null>(null)
  useEffect(() => {
    if (!workspaceLogoUrl) { setLogoSize(null); return }
    const img = new Image()
    img.onload = () => setLogoSize({ width: img.naturalWidth, height: img.naturalHeight })
    img.onerror = () => setLogoSize(null)
    img.src = workspaceLogoUrl
  }, [workspaceLogoUrl])
  const logoFrame = { width: 208, height: 40 }
  const logoImageStyle = getLogoImageStyle(logoSize, logoCrop, logoFrame)
  const logoTextStyle = getLogoTextStyle(logoText, logoFrame)

  return (
    <aside
      className={cn(
        'flex flex-col h-full bg-card border-r border-border transition-all duration-200 shrink-0',
        collapsed ? 'w-14' : 'w-60',
      )}
      aria-label="Navegación del workspace"
    >
      {/* Logo / Workspace name */}
      <div className={cn(
        'h-14 flex items-center border-b border-border shrink-0',
        collapsed ? 'justify-center px-2' : 'px-4 gap-3',
      )}>
        {/* Workspace logo / initial */}
        {workspaceLogoUrl && !collapsed ? (
          <Link
            href={`/workspace/${workspaceId}`}
            className="relative flex h-10 min-w-0 flex-1 items-center overflow-hidden rounded-lg border border-border bg-muted hover:border-primary/60 transition-colors"
            title={workspaceName}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={workspaceLogoUrl}
              alt={workspaceName}
              className="absolute max-w-none select-none"
              onLoad={(e) => {
                const img = e.currentTarget
                setLogoSize({ width: img.naturalWidth, height: img.naturalHeight })
              }}
              style={{
                ...logoImageStyle,
              }}
            />
            {workspaceLogoShowName && (
              <span className="absolute inset-0 bg-gradient-to-r from-black/45 via-black/15 to-transparent">
                <span
                  className="absolute max-w-[calc(100%-16px)] truncate font-bold text-white [text-shadow:0_1px_8px_rgba(0,0,0,0.85)]"
                  style={{
                    ...logoTextStyle,
                  }}
                >
                  {workspaceName}
                </span>
              </span>
            )}
          </Link>
        ) : (
          <>
            <div className="shrink-0 w-7 h-7 rounded-lg overflow-hidden">
              {workspaceLogoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={workspaceLogoUrl} alt={workspaceName} className="object-cover w-full h-full" />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: workspaceBrandColor }}
                >
                  {workspaceName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            {!collapsed && (
              <Link
                href={`/workspace/${workspaceId}`}
                className="font-semibold text-sm text-foreground truncate hover:text-primary transition-colors"
                title={workspaceName}
              >
                {workspaceName}
              </Link>
            )}
          </>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-5">
        {navGroups.map((group, gi) => {
          const isLastGroup = gi === navGroups.length - 1
          return (
            <div key={gi}>
              {group.label && !collapsed && (
                <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                  {group.label}
                </p>
              )}
              <ul className="space-y-0.5">
                {group.items.map((item, ii) => (
                  <Fragment key={item.href}>
                    <li>
                      <WorkspaceSidebarItem item={item} collapsed={collapsed} />
                    </li>
                    {isLastGroup && ii === group.items.length - 1 && onOpenOnboarding && (
                      <li key="tour">
                        <button
                          type="button"
                          onClick={onOpenOnboarding}
                          className={cn(
                            'flex items-center gap-2 w-full rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors',
                            collapsed ? 'justify-center p-2' : 'px-3 py-2',
                          )}
                          title="Tour de bienvenida"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="shrink-0">
                            <circle cx="12" cy="12" r="10"/>
                            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                            <path d="M12 17h.01"/>
                          </svg>
                          {!collapsed && <span>Tour de bienvenida</span>}
                        </button>
                      </li>
                    )}
                  </Fragment>
                ))}
              </ul>
            </div>
          )
        })}
      </nav>

      {/* Footer — solo "Powered by MITIKUS" */}
      <div className={cn(
        'border-t border-border shrink-0',
        collapsed
          ? 'flex justify-center px-2 pt-3 pb-[calc(2rem+env(safe-area-inset-bottom))]'
          : 'px-3 pt-3 pb-[calc(2rem+env(safe-area-inset-bottom))]',
      )}>
        {!collapsed && (
          <p className="px-3 text-[10px] text-muted-foreground/50 truncate flex items-center gap-1.5">
            <svg width="16" height="16" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-hidden className="shrink-0">
              <defs>
                <linearGradient id="mitikus-g-footer" x1="10" y1="10" x2="190" y2="190" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#FFD040"/>
                  <stop offset="28%" stopColor="#FF7028"/>
                  <stop offset="50%" stopColor="#FF2878"/>
                  <stop offset="72%" stopColor="#8B28FF"/>
                  <stop offset="100%" stopColor="#1820B8"/>
                </linearGradient>
                <clipPath id="mitikus-c-footer"><circle cx="100" cy="100" r="87"/></clipPath>
              </defs>
              <circle cx="100" cy="100" r="90" fill="none" stroke="url(#mitikus-g-footer)" strokeWidth="5.5"/>
              <g clipPath="url(#mitikus-c-footer)">
                <polygon points="-10,0 192,95 192,100 -10,98" fill="url(#mitikus-g-footer)"/>
                <polygon points="-10,102 192,100 192,105 -10,200" fill="url(#mitikus-g-footer)"/>
              </g>
            </svg>
            Powered by <span className="font-semibold">MITIKUS</span>
          </p>
        )}
      </div>
    </aside>
  )
}
