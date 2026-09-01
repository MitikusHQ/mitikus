import { describe, it, expect } from 'vitest'
import { buildSimpleFallbackSchema, detectPattern, slugify } from '../simple-fallback'
import { validateToolSchema } from '@protools/schema'

describe('detectPattern', () => {
  it('detects clientDocs', () => {
    expect(detectPattern('gestión de documentos por cliente')).toBe('clientDocs')
    expect(detectPattern('fichero de cliente')).toBe('clientDocs')
  })

  it('detects crm', () => {
    expect(detectPattern('seguimiento de clientes comerciales')).toBe('crm')
    expect(detectPattern('gestión de leads y contactos')).toBe('crm')
  })

  it('detects hr', () => {
    expect(detectPattern('registro de empleados')).toBe('hr')
    expect(detectPattern('gestión de personal y RRHH')).toBe('hr')
  })

  it('falls back to generic', () => {
    expect(detectPattern('lista de tareas del equipo')).toBe('generic')
    expect(detectPattern('inventario de equipos')).toBe('generic')
  })
})

describe('slugify', () => {
  it('converts to slug', () => {
    expect(slugify('Gestor de Documentos')).toBe('gestor-de-documentos')
    expect(slugify('Evaluación de proveedores')).toBe('evaluacion-de-proveedores')
  })

  it('handles empty string', () => {
    expect(slugify('')).toBe('herramienta-simple')
  })
})

describe('buildSimpleFallbackSchema', () => {
  const patterns = [
    { label: 'clientDocs', prompt: 'gestión de ficheros por cliente' },
    { label: 'crm', prompt: 'seguimiento de contactos y leads' },
    { label: 'hr', prompt: 'registro de empleados de RRHH' },
    { label: 'generic', prompt: 'seguimiento de proyectos internos' },
  ] as const

  for (const { label, prompt } of patterns) {
    it(`produces a valid ToolSchemaV1 for pattern "${label}"`, () => {
      const schema = buildSimpleFallbackSchema(prompt)
      const result = validateToolSchema(schema)
      expect(result.success, `Schema inválido para "${label}": ${!result.success ? JSON.stringify((result as { error: unknown }).error) : ''}`).toBe(true)
    })

    it(`has TABLE + FORM capabilities for pattern "${label}"`, () => {
      const schema = buildSimpleFallbackSchema(prompt)
      const types = schema.capabilities.map((c) => c.type)
      expect(types).toContain('TABLE')
      expect(types).toContain('FORM')
    })

    it(`TABLE columns reference existing fields for pattern "${label}"`, () => {
      const schema = buildSimpleFallbackSchema(prompt)
      const fieldIds = Object.keys(schema.dataSchema.fields)
      const tableCap = schema.capabilities.find((c) => c.type === 'TABLE')!
      const tableConfig = tableCap.config as { columns: Array<{ fieldId: string }> }
      for (const col of tableConfig.columns) {
        expect(fieldIds, `Column fieldId "${col.fieldId}" not in dataSchema`).toContain(col.fieldId)
      }
    })

    it(`FORM sections reference existing fields for pattern "${label}"`, () => {
      const schema = buildSimpleFallbackSchema(prompt)
      const fieldIds = Object.keys(schema.dataSchema.fields)
      const formCap = schema.capabilities.find((c) => c.type === 'FORM')!
      const formConfig = formCap.config as { sections?: Array<{ fieldIds: string[] }> }
      for (const section of formConfig.sections ?? []) {
        for (const fid of section.fieldIds) {
          expect(fieldIds, `Form section fieldId "${fid}" not in dataSchema`).toContain(fid)
        }
      }
    })
  }
})
