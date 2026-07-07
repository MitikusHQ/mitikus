import { registry } from './detectors/registry.js'
import { validateImportFile } from './validators/import.validator.js'
import { validateImportedSchema } from './validators/schema.validator.js'
import { ExcelParser } from './parsers/excel.parser.js'
import { CsvParser } from './parsers/csv.parser.js'
import { JsonParser } from './parsers/json.parser.js'
import { DocxParser } from './parsers/docx.parser.js'
import { PdfParser } from './parsers/pdf.parser.js'
import type { ImportFile } from './types/importer.types.js'
import type { NormalizedDocument } from './types/normalized-document.js'

// Registrar todos los importadores
registry.register(new ExcelParser())
registry.register(new CsvParser())
registry.register(new JsonParser())
registry.register(new DocxParser())
registry.register(new PdfParser())

export interface PipelineResult {
  document: NormalizedDocument
  isDirectSchema: boolean // true = JSON ToolSchema válido, sin necesidad de IA
  detectionConfidence: number
  validationErrors: string[]
  warnings: string[]
  durationMs: number
}

export async function processFile(file: ImportFile): Promise<PipelineResult> {
  const startMs = Date.now()
  const warnings: string[] = []

  // 1. Validar el archivo antes de procesarlo
  const validation = validateImportFile(file)
  if (!validation.valid) {
    throw new Error(`Archivo rechazado: ${validation.errors.join('; ')}`)
  }
  warnings.push(...validation.warnings)

  // 2. Detectar formato
  const detection = registry.detect(file)
  warnings.push(...detection.warnings)

  if (detection.format === 'unknown') {
    throw new Error('Formato de archivo no reconocido. Formatos soportados: Excel, CSV, JSON, Word, PDF')
  }

  // 3. Obtener el importador
  const importer = registry.getImporter(detection.format)
  if (!importer) {
    throw new Error(`No hay importador disponible para el formato: ${detection.format}`)
  }

  // 4. Parsear
  const parsed = await importer.parse(file)
  warnings.push(...parsed.warnings)

  // 5. Normalizar
  const document = await importer.normalize(parsed, file)
  warnings.push(...document.metadata.warnings.filter((w) => !warnings.includes(w)))

  // 6. Si es ToolSchema válido → passthrough directo
  let isDirectSchema = false
  const validationErrors: string[] = []

  if (document.metadata.format === 'tool-schema') {
    const schemaValidation = validateImportedSchema(JSON.parse(document.rawText))
    if (schemaValidation.valid) {
      isDirectSchema = true
    } else {
      validationErrors.push(...schemaValidation.errors)
      warnings.push('El JSON parece un ToolSchema pero tiene errores de validación')
    }
  }

  return {
    document,
    isDirectSchema,
    detectionConfidence: detection.confidence,
    validationErrors,
    warnings,
    durationMs: Date.now() - startMs,
  }
}

export { registry }
