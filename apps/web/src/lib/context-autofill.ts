/**
 * Auto-relleno de variables de herramientas desde BusinessContext.
 * Mapea claves de campos a valores conocidos de la empresa.
 */

import type { BusinessContext } from './business-memory/memory-types'

// Palabras clave que identifican cada tipo de dato. Se normalizan a minúsculas.
const MATCHERS: Array<{ keys: string[]; resolve: (ctx: BusinessContext) => string | null }> = [
  {
    keys: ['empresa', 'company', 'nombre_empresa', 'company_name', 'razon_social', 'nombre'],
    resolve: (ctx) => ctx.companyName,
  },
  {
    keys: ['sector', 'industria', 'industry', 'area_negocio', 'actividad'],
    resolve: (ctx) => ctx.sector,
  },
  {
    keys: ['pais', 'country', 'país', 'location', 'ubicacion', 'ubicación'],
    resolve: (ctx) => ctx.country,
  },
  {
    keys: ['web', 'website', 'url', 'pagina_web', 'sitio_web', 'dominio', 'domain'],
    resolve: (ctx) => ctx.website,
  },
  {
    keys: ['idioma', 'language', 'lang', 'language_code'],
    resolve: (ctx) => ctx.languages[0] ?? null,
  },
  {
    keys: ['servicios', 'services', 'oferta', 'productos_servicios'],
    resolve: (ctx) => ctx.services.length > 0 ? ctx.services.join(', ') : null,
  },
  {
    keys: ['productos', 'products', 'catalogo', 'catálogo'],
    resolve: (ctx) => ctx.products.length > 0 ? ctx.products.join(', ') : null,
  },
  {
    keys: ['mercados', 'markets', 'target_market', 'mercado_objetivo', 'clientes_objetivo'],
    resolve: (ctx) => ctx.markets.length > 0 ? ctx.markets.join(', ') : null,
  },
  {
    keys: ['competidores', 'competitors', 'competencia'],
    resolve: (ctx) => ctx.competitors.length > 0 ? ctx.competitors.join(', ') : null,
  },
  {
    keys: ['tamaño', 'tamano', 'size', 'num_empleados', 'empleados'],
    resolve: (ctx) => {
      const labels: Record<string, string> = {
        micro: 'Micro (1-9)', small: 'Pequeña (10-49)',
        medium: 'Mediana (50-249)', large: 'Grande (250+)', enterprise: 'Empresa (1000+)',
      }
      return labels[ctx.size] ?? null
    },
  },
]

function normalize(key: string): string {
  return key.toLowerCase().replace(/[-\s]/g, '_')
}

/**
 * Devuelve un objeto con los campos que se pueden pre-rellenar desde el contexto.
 * Solo rellena campos con valor no vacío; respeta `existingValues` (no sobreescribe).
 */
export function computeContextDefaults(
  fieldKeys: string[],
  context: BusinessContext,
  existingValues: Record<string, string> = {},
): Record<string, string> {
  if (context.isEmpty) return {}

  const defaults: Record<string, string> = {}

  for (const fieldKey of fieldKeys) {
    if (existingValues[fieldKey]) continue   // ya tiene valor — no sobreescribir

    const norm = normalize(fieldKey)
    for (const matcher of MATCHERS) {
      if (matcher.keys.some((k) => norm.includes(k) || k.includes(norm))) {
        const value = matcher.resolve(context)
        if (value) {
          defaults[fieldKey] = value
          break
        }
      }
    }
  }

  return defaults
}

/**
 * Construye un bloque de texto con el contexto de empresa para inyectar
 * al inicio del system prompt de la IA.
 */
export function buildCompanyContextBlock(context: BusinessContext): string {
  if (context.isEmpty) return ''

  const lines: string[] = ['[CONTEXTO DE EMPRESA — usa esta información para personalizar el análisis]']

  if (context.companyName) lines.push(`Empresa: ${context.companyName}`)
  if (context.sector)      lines.push(`Sector: ${context.sector}`)
  if (context.country)     lines.push(`País: ${context.country}`)
  if (context.size && context.size !== 'unknown') {
    const sizeLabels: Record<string, string> = {
      micro: 'micro (1-9 empleados)', small: 'pequeña (10-49)', medium: 'mediana (50-249)',
      large: 'grande (250+)', enterprise: 'empresa grande (1000+)',
    }
    lines.push(`Tamaño: ${sizeLabels[context.size] ?? context.size}`)
  }
  if (context.website)               lines.push(`Web: ${context.website}`)
  if (context.services.length > 0)   lines.push(`Servicios: ${context.services.join(', ')}`)
  if (context.products.length > 0)   lines.push(`Productos: ${context.products.join(', ')}`)
  if (context.markets.length > 0)    lines.push(`Mercados: ${context.markets.join(', ')}`)
  if (context.competitors.length > 0) lines.push(`Competidores: ${context.competitors.join(', ')}`)
  if (context.certifications.length > 0) lines.push(`Certificaciones: ${context.certifications.join(', ')}`)
  if (context.regulations.length > 0)    lines.push(`Regulaciones aplicables: ${context.regulations.join(', ')}`)
  if (context.softwareUsed.length > 0)   lines.push(`Software en uso: ${context.softwareUsed.join(', ')}`)
  if (context.languages.length > 0)      lines.push(`Idiomas: ${context.languages.join(', ')}`)

  lines.push('[FIN CONTEXTO DE EMPRESA]')

  return lines.join('\n')
}
