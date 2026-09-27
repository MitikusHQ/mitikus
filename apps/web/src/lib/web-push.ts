import webPush from 'web-push'
import { db } from '@/lib/db'

function getVapidConfig() {
  const subject = process.env.WEB_PUSH_SUBJECT ?? process.env.NEXT_PUBLIC_APP_URL ?? 'mailto:soporte@mitikus.com'
  const publicKey = process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY
  const privateKey = process.env.WEB_PUSH_PRIVATE_KEY
  if (!publicKey || !privateKey) return null
  return { subject, publicKey, privateKey }
}

function configureWebPush() {
  const config = getVapidConfig()
  if (!config) return false
  webPush.setVapidDetails(config.subject, config.publicKey, config.privateKey)
  return true
}

export function isWebPushConfigured() {
  return Boolean(getVapidConfig())
}

export async function sendCalendarReminderPush(userId: string) {
  if (!configureWebPush()) return { sent: 0, removed: 0 }

  const subscriptions = await db.pushSubscription.findMany({
    where: { userId },
    select: { id: true, endpoint: true, p256dh: true, auth: true },
  })

  const payload = JSON.stringify({
    title: 'MITIKUS',
    body: 'Tienes un evento próximo en MITIKUS.',
    url: '/',
  })

  let sent = 0
  let removed = 0

  await Promise.all(subscriptions.map(async (subscription) => {
    try {
      await webPush.sendNotification(
        {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth,
          },
        },
        payload,
      )
      sent += 1
    } catch (error) {
      const statusCode = typeof error === 'object' && error && 'statusCode' in error
        ? Number((error as { statusCode?: unknown }).statusCode)
        : null
      if (statusCode === 404 || statusCode === 410) {
        await db.pushSubscription.delete({ where: { id: subscription.id } }).catch(() => null)
        removed += 1
      }
    }
  }))

  return { sent, removed }
}
