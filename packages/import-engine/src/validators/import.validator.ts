import type { ImportFile, ValidationResult } from '../types/importer.types.js'

const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024 // 20 MB

const ALLOWED_MIME_TYPES = new Set([
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'text/csv',
  'application/csv',
  'application/json',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'application/pdf',
  'text/plain',
  'text/markdown',
  'application/octet-stream', // fallback genérico — se valida más con magic bytes
])

const ALLOWED_EXTENSIONS = new Set([
  'xlsx', 'xls', 'csv', 'json', 'docx', 'doc', 'pdf', 'txt', 'md', 'markdown',
])

// Patrones que nunca deben estar en el nombre de archivo
const DANGEROUS_NAME_PATTERNS = [
  /\.(exe|bat|cmd|sh|ps1|vbs|js|mjs|cjs|py|rb|php|jar|dll|so|dylib)$/i,
  /\.\./,
  /[<>:"|?*\x00-\x1f]/,
]

export function validateImportFile(file: ImportFile): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Tamaño
  if (file.sizeBytes > MAX_FILE_SIZE_BYTES) {
    errors.push(`El archivo supera el tamaño máximo permitido (${MAX_FILE_SIZE_BYTES / 1024 / 1024} MB)`)
  }
  if (file.sizeBytes === 0) {
    errors.push('El archivo está vacío')
  }

  // Nombre
  for (const pattern of DANGEROUS_NAME_PATTERNS) {
    if (pattern.test(file.name)) {
      errors.push(`Nombre de archivo no permitido: ${file.name}`)
      break
    }
  }

  // Extensión
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    errors.push(`Extensión no permitida: .${ext}`)
  }

  // MIME (advertencia, no error — puede venir mal del cliente)
  if (!ALLOWED_MIME_TYPES.has(file.mimeType)) {
    warnings.push(`Tipo MIME inusual: ${file.mimeType}. Se intentará detectar por contenido.`)
  }

  return { valid: errors.length === 0, errors, warnings }
}
