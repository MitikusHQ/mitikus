import type { ImportFile, IImporter, IImporterRegistry, DetectionResult } from '../types/importer.types.js'
import type { ImportFormat } from '../types/normalized-document.js'

// Magic bytes para detección robusta (independiente del MIME del cliente)
const MAGIC_BYTES: Array<{ bytes: number[]; format: ImportFormat; offset?: number }> = [
  { bytes: [0x50, 0x4b, 0x03, 0x04], format: 'excel' },   // ZIP → xlsx, docx
  { bytes: [0xd0, 0xcf, 0x11, 0xe0], format: 'excel' },   // OLE2 → xls
  { bytes: [0x25, 0x50, 0x44, 0x46], format: 'pdf' },     // %PDF
]

const EXTENSION_MAP: Record<string, ImportFormat> = {
  xlsx: 'excel',
  xls: 'excel',
  csv: 'csv',
  json: 'json',
  docx: 'docx',
  doc: 'docx',
  pdf: 'pdf',
  md: 'markdown',
  markdown: 'markdown',
  txt: 'plain-text',
}

class ImporterRegistry implements IImporterRegistry {
  private importers = new Map<ImportFormat, IImporter>()

  register(importer: IImporter): void {
    this.importers.set(importer.format, importer)
  }

  detect(file: ImportFile): DetectionResult {
    const warnings: string[] = []

    // 1. Magic bytes (más fiable)
    for (const magic of MAGIC_BYTES) {
      const offset = magic.offset ?? 0
      const match = magic.bytes.every((b, i) => file.buffer[offset + i] === b)
      if (match) {
        // ZIP puede ser xlsx o docx — afinar con extensión
        if (magic.format === 'excel') {
          const ext = file.name.split('.').pop()?.toLowerCase()
          if (ext === 'docx' || ext === 'doc') {
            return { format: 'docx', confidence: 0.95, mimeType: file.mimeType, warnings }
          }
          return { format: 'excel', confidence: 0.95, mimeType: file.mimeType, warnings }
        }
        return { format: magic.format, confidence: 0.95, mimeType: file.mimeType, warnings }
      }
    }

    // 2. Extensión del nombre de archivo
    const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
    if (ext in EXTENSION_MAP) {
      return { format: EXTENSION_MAP[ext]!, confidence: 0.85, mimeType: file.mimeType, warnings }
    }

    // 3. MIME type del cliente (menos fiable)
    if (file.mimeType.includes('spreadsheet') || file.mimeType.includes('excel')) {
      return { format: 'excel', confidence: 0.7, mimeType: file.mimeType, warnings }
    }
    if (file.mimeType === 'text/csv') {
      return { format: 'csv', confidence: 0.8, mimeType: file.mimeType, warnings }
    }
    if (file.mimeType === 'application/json') {
      return { format: 'json', confidence: 0.8, mimeType: file.mimeType, warnings }
    }
    if (file.mimeType === 'application/pdf') {
      return { format: 'pdf', confidence: 0.8, mimeType: file.mimeType, warnings }
    }
    if (file.mimeType.startsWith('text/')) {
      return { format: 'plain-text', confidence: 0.6, mimeType: file.mimeType, warnings }
    }

    warnings.push(`Formato no reconocido: ${file.mimeType} (${file.name})`)
    return { format: 'unknown', confidence: 0, mimeType: file.mimeType, warnings }
  }

  getImporter(format: ImportFormat): IImporter | null {
    return this.importers.get(format) ?? null
  }

  getAll(): IImporter[] {
    return Array.from(this.importers.values())
  }
}

// Singleton exportado
export const registry = new ImporterRegistry()
