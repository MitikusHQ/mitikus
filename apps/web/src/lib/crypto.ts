import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'

const ALGO = 'aes-256-gcm'
const IV_LEN = 12
const TAG_LEN = 16

function getKey(): Buffer {
  const raw = process.env.MITIKUS_ENCRYPTION_KEY
  if (!raw) throw new Error('MITIKUS_ENCRYPTION_KEY no está configurada.')
  const buf = Buffer.from(raw, 'hex')
  if (buf.length !== 32) throw new Error('MITIKUS_ENCRYPTION_KEY debe ser 32 bytes en hexadecimal (64 caracteres).')
  return buf
}

/** Cifra `plaintext` con AES-256-GCM. Devuelve base64 de `iv + tag + ciphertext`. */
export function encrypt(plaintext: string): string {
  const key = getKey()
  const iv = randomBytes(IV_LEN)
  const cipher = createCipheriv(ALGO, key, iv)
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, enc]).toString('base64')
}

/** Descifra un valor producido por `encrypt`. Lanza si el tag no es válido. */
export function decrypt(encrypted: string): string {
  const key = getKey()
  const buf = Buffer.from(encrypted, 'base64')
  const iv = buf.subarray(0, IV_LEN)
  const tag = buf.subarray(IV_LEN, IV_LEN + TAG_LEN)
  const ciphertext = buf.subarray(IV_LEN + TAG_LEN)
  const decipher = createDecipheriv(ALGO, key, iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8')
}

/** Devuelve `null` si `MITIKUS_ENCRYPTION_KEY` no está disponible. Seguro en build time. */
export function encryptSafe(plaintext: string | null | undefined): string | null {
  if (!plaintext) return null
  try {
    return encrypt(plaintext)
  } catch {
    return null
  }
}

export function decryptSafe(encrypted: string | null | undefined): string | null {
  if (!encrypted) return null
  try {
    return decrypt(encrypted)
  } catch {
    return null
  }
}
