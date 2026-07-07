import type { NormalizedDocument, ImportFormat } from './normalized-document.js'

export interface ImportFile {
  name: string
  mimeType: string
  sizeBytes: number
  buffer: Buffer
}

export interface DetectionResult {
  format: ImportFormat
  confidence: number // 0–1
  mimeType: string
  warnings: string[]
}

export interface ParseResult {
  raw: unknown
  format: ImportFormat
  warnings: string[]
}

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

// Interfaz que todo importador debe implementar
export interface IImporter {
  readonly format: ImportFormat
  readonly supportedMimeTypes: string[]
  readonly supportedExtensions: string[]

  /** Detecta si este importador puede manejar el archivo */
  canHandle(file: ImportFile): boolean

  /** Parsea el buffer crudo → estructura intermedia */
  parse(file: ImportFile): Promise<ParseResult>

  /** Normaliza la estructura intermedia → NormalizedDocument */
  normalize(parsed: ParseResult, file: ImportFile): Promise<NormalizedDocument>
}

// Registro central de importadores
export interface IImporterRegistry {
  register(importer: IImporter): void
  detect(file: ImportFile): DetectionResult
  getImporter(format: ImportFormat): IImporter | null
  getAll(): IImporter[]
}
