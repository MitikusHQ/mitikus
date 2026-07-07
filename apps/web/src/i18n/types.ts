import type enDict from './dictionaries/en.json'

/**
 * Tipo del diccionario derivado de en.json (fuente de verdad).
 * TypeScript garantiza que es.json cubre exactamente los mismos campos.
 */
export type Dictionary = typeof enDict

/**
 * Ruta de puntos válida para un diccionario.
 * Ejemplo: "common.save" | "auth.signIn" | "locale.banner.switch"
 */
type Join<K, P> = K extends string | number
  ? P extends string | number
    ? `${K}${'.' extends string ? '.' : never}${P}`
    : never
  : never

type Leaves<T> = T extends object
  ? { [K in keyof T]-?: Join<K, Leaves<T[K]>> }[keyof T]
  : ''

export type DictionaryPath = Leaves<Dictionary>
