'use server'

import Anthropic from '@anthropic-ai/sdk'
import { type LegalForm } from '@/lib/fiscal-calendar'

const client = new Anthropic()

const KNOWN_FORMS: LegalForm[] = [
  'autonomo', 'sl', 'sa', 'comunidad', 'cooperativa', 'asociacion', 'fundacion', 'otro',
]

export async function classifyLegalForm(description: string): Promise<{
  form: LegalForm
  explanation: string
}> {
  const message = await client.messages.create({
    model: 'claude-opus-5',
    max_tokens: 200,
    messages: [
      {
        role: 'user',
        content: `Eres un experto en formas jurídicas españolas. El usuario describe su entidad así: "${description}"

Clasifícala en UNA de estas opciones exactas (responde SOLO con el JSON, sin markdown):
- autonomo: trabajador por cuenta propia, freelance, autónomo individual
- sl: sociedad limitada
- sa: sociedad anónima
- comunidad: comunidad de bienes, varios propietarios sin personalidad jurídica propia
- cooperativa: cooperativa de trabajo, de consumidores, agrícola, etc.
- asociacion: asociación sin ánimo de lucro
- fundacion: fundación
- otro: no encaja en ninguna de las anteriores

Responde con este JSON exacto:
{"form": "<opción>", "explanation": "<una frase corta explicando por qué>"}`,
      },
    ],
  })

  const text = message.content[0]?.type === 'text' ? message.content[0].text.trim() : ''
  try {
    const parsed = JSON.parse(text) as { form: string; explanation: string }
    const form = KNOWN_FORMS.includes(parsed.form as LegalForm)
      ? (parsed.form as LegalForm)
      : 'otro'
    return { form, explanation: parsed.explanation ?? '' }
  } catch {
    return { form: 'otro', explanation: 'No se pudo clasificar automáticamente.' }
  }
}
