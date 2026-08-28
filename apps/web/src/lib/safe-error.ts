const TECHNICAL_PATTERNS = [
  /^unauthorized$/i,
  /^user not found$/i,
  /^workspace not found$/i,
  /^file not found$/i,
  /^contract not found$/i,
  /^internal server error$/i,
  /^http \d{3}$/i,
  /^error \d{3}$/i,
  /^no stream body$/i,
  /^otp_not_verified$/i,
  /^invalid signature data url$/i,
  /^fetch failed$/i,
  /prisma/i,
  /^p\d{4}:/i,
]

const FALLBACK = 'Algo ha ido mal. Inténtalo de nuevo o recarga la página.'

export function safeErrorMessage(error: unknown, fallback = FALLBACK): string {
  const msg = error instanceof Error ? error.message : String(error ?? '')
  if (!msg || TECHNICAL_PATTERNS.some((r) => r.test(msg.trim()))) return fallback
  return msg
}
