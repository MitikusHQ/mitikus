export type SlideLayout = 'title-body' | 'title-bullets' | 'title-image' | 'blank'

export type SlideContent =
  | { type: 'text';    value: string }
  | { type: 'bullets'; value: string[] }
  | { type: 'image';   value: string }
  | { type: 'blank';   value: null }

export interface SlideData {
  id:       string
  order:    number
  layout:   SlideLayout
  title:    string
  content:  SlideContent
  imageUrl: string | null
}

export interface PresentationData {
  id:          string
  title:       string
  accentColor: string
  shareToken:  string
  slideCount:  number
  createdAt:   string
  creatorName: string | null
}

export interface PresentationDetail extends PresentationData {
  slides: SlideData[]
}

export interface PresentationPublic {
  id:          string
  title:       string
  accentColor: string
  slides:      SlideData[]
}

export interface SlideInput {
  layout?:   SlideLayout
  title?:    string
  content?:  SlideContent
  imageUrl?: string | null
}

export const TEMPLATES: Record<string, { label: string; slides: Omit<SlideData, 'id' | 'order'>[] }> = {
  pitch: {
    label: 'Pitch',
    slides: [
      { layout: 'blank',         title: 'Nombre del Proyecto', content: { type: 'text', value: 'Tu tagline aquí' }, imageUrl: null },
      { layout: 'title-body',    title: 'El Problema',         content: { type: 'text', value: 'Describe el problema que resuelves.' }, imageUrl: null },
      { layout: 'title-body',    title: 'La Solución',         content: { type: 'text', value: 'Cómo lo resuelves.' }, imageUrl: null },
      { layout: 'title-bullets', title: 'Mercado',             content: { type: 'bullets', value: ['TAM: ...', 'SAM: ...', 'SOM: ...'] }, imageUrl: null },
      { layout: 'title-body',    title: 'Equipo & CTA',        content: { type: 'text', value: 'Quiénes somos y próximos pasos.' }, imageUrl: null },
    ],
  },
  propuesta: {
    label: 'Propuesta Comercial',
    slides: [
      { layout: 'blank',         title: 'Propuesta Comercial',  content: { type: 'text', value: 'Para [Cliente]' }, imageUrl: null },
      { layout: 'title-body',    title: 'Contexto',             content: { type: 'text', value: 'Situación actual del cliente.' }, imageUrl: null },
      { layout: 'title-bullets', title: 'Propuesta de Valor',   content: { type: 'bullets', value: ['Beneficio 1', 'Beneficio 2', 'Beneficio 3'] }, imageUrl: null },
      { layout: 'title-body',    title: 'Próximos Pasos',       content: { type: 'text', value: 'Cómo avanzamos juntos.' }, imageUrl: null },
    ],
  },
  informe: {
    label: 'Informe',
    slides: [
      { layout: 'blank',         title: 'Informe',      content: { type: 'text', value: 'Período: ...' }, imageUrl: null },
      { layout: 'title-bullets', title: 'Datos Clave',  content: { type: 'bullets', value: ['Dato 1', 'Dato 2', 'Dato 3'] }, imageUrl: null },
      { layout: 'title-body',    title: 'Conclusiones', content: { type: 'text', value: 'Resumen y recomendaciones.' }, imageUrl: null },
    ],
  },
}
