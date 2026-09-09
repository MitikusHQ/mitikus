import type { Metadata } from 'next'
import { requireUser } from '@/lib/auth'
import { getLocale } from '@/i18n/locale'
import { getDashboardTranslations } from '@/i18n/dashboard-translations'
import { ProfileClient } from './_components/ProfileClient'

export const metadata: Metadata = { title: 'My profile — MITIKUS' }

export default async function ProfilePage() {
  const [user, locale] = await Promise.all([requireUser(), getLocale()])
  const t = getDashboardTranslations(locale)
  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold mb-1">{t.profileTitle}</h1>
      <p className="text-muted-foreground text-sm mb-8">{t.profileSubtitle}</p>
      <ProfileClient
        userId={user.id}
        name={user.name ?? user.email}
        email={user.email}
        avatarUrl={user.avatarUrl ?? null}
        jobTitle={user.jobTitle ?? null}
        role={user.role}
        locale={locale}
      />
    </div>
  )
}
