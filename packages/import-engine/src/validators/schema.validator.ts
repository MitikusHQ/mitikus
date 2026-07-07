import { validateToolSchema } from '@protools/schema'
import type { ValidatedToolSchema } from '@protools/schema'

export interface SchemaValidationResult {
  valid: boolean
  schema?: ValidatedToolSchema
  errors: string[]
}

export function validateImportedSchema(raw: unknown): SchemaValidationResult {
  const result = validateToolSchema(raw)
  if (result.success) {
    return { valid: true, schema: result.data, errors: [] }
  }
  const errors = result.error.errors
    .slice(0, 10)
    .map((e) => `${e.path.join('.')}: ${e.message}`)
  return { valid: false, errors }
}
