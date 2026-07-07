export type EmailType = 'personal' | 'business' | 'disposable' | 'unknown'
export type TrialPlan = 'trial_personal' | 'trial_business' | 'blocked' | 'internal_dev'

const PERSONAL_DOMAINS = new Set([
  'gmail.com',
  'googlemail.com',
  'hotmail.com',
  'hotmail.es',
  'hotmail.co.uk',
  'outlook.com',
  'outlook.es',
  'live.com',
  'live.es',
  'msn.com',
  'yahoo.com',
  'yahoo.es',
  'yahoo.co.uk',
  'icloud.com',
  'me.com',
  'mac.com',
  'proton.me',
  'protonmail.com',
  'pm.me',
  'tutanota.com',
  'tutanota.de',
  'zoho.com',
  'aol.com',
  'mail.com',
  'gmx.com',
  'gmx.de',
  'gmx.es',
  'web.de',
  'yandex.com',
  'yandex.ru',
])

const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com',
  'tempmail.com',
  'temp-mail.org',
  '10minutemail.com',
  '10minutemail.net',
  'guerrillamail.com',
  'guerrillamail.net',
  'guerrillamail.org',
  'guerrillamail.biz',
  'guerrillamail.de',
  'yopmail.com',
  'yopmail.fr',
  'sharklasers.com',
  'guerrillamailblock.com',
  'grr.la',
  'spam4.me',
  'trashmail.com',
  'trashmail.io',
  'trashmail.me',
  'dispostable.com',
  'throwaway.email',
  'maildrop.cc',
  'fakeinbox.com',
  'mailnull.com',
  'spamgourmet.com',
  'spamgourmet.net',
  'spamgourmet.org',
  'trashmail.at',
  'trashmail.io',
  'mailnesia.com',
  'discard.email',
  'crap.la',
  'getairmail.com',
  'spamherelots.com',
  'spamherelots.org',
  'example.com',
  'example.org',
  'example.net',
  'test.com',
])

export interface EmailClassification {
  emailType: EmailType
  trialPlan: TrialPlan
  domain: string
}

export function classifyEmail(email: string): EmailClassification {
  const lower = email.toLowerCase().trim()
  const atIndex = lower.lastIndexOf('@')

  if (atIndex === -1) {
    return { emailType: 'unknown', trialPlan: 'trial_personal', domain: '' }
  }

  const domain = lower.slice(atIndex + 1)

  if (DISPOSABLE_DOMAINS.has(domain)) {
    return { emailType: 'disposable', trialPlan: 'blocked', domain }
  }

  if (PERSONAL_DOMAINS.has(domain)) {
    return { emailType: 'personal', trialPlan: 'trial_personal', domain }
  }

  // Dominios institucionales comunes (educación, gobierno)
  const tld = domain.split('.').pop() ?? ''
  const isInstitutional = ['edu', 'edu.es', 'ac.uk', 'gov', 'gov.es', 'gob.es'].some(
    (suffix) => domain.endsWith(suffix),
  )
  if (isInstitutional) {
    return { emailType: 'business', trialPlan: 'trial_business', domain }
  }

  // Cualquier otro dominio = corporativo por defecto
  return { emailType: 'business', trialPlan: 'trial_business', domain }
}

export function trialPlanLabel(plan: TrialPlan): string {
  switch (plan) {
    case 'trial_business': return 'Beta Empresarial'
    case 'trial_personal': return 'Beta Personal'
    case 'blocked': return 'Acceso bloqueado'
    case 'internal_dev': return 'Dev Interno'
  }
}

export function emailTypeLabel(type: EmailType): string {
  switch (type) {
    case 'personal': return 'Email personal'
    case 'business': return 'Email corporativo'
    case 'disposable': return 'Email temporal'
    case 'unknown': return 'Email desconocido'
  }
}
