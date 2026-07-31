import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import OpenAI from 'openai'

const SYSTEM_PROMPT = `You are an OCR assistant that extracts structured data from receipt and invoice images.
Always respond with a JSON object only, no markdown, no explanation.`

const USER_PROMPT = `Extract all information from this receipt/invoice image. Return ONLY a valid JSON object with exactly these fields:
{
  "vendor": "store or company name (string or null)",
  "date": "date in YYYY-MM-DD format (string or null)",
  "total": total amount as number (or null),
  "subtotal": subtotal before tax as number (or null),
  "tax": tax amount as number (or null),
  "taxRate": tax percentage as number e.g. 21 (or null),
  "currency": "3-letter currency code e.g. EUR, USD (string)",
  "items": [{"description": "item name", "qty": 1, "unitPrice": 10.0, "total": 10.0}],
  "category": "suggested category from: alimentación, transporte, restaurante, alojamiento, material oficina, servicios, suministros, otro (string or null)"
}
If a field cannot be determined, use null. Items array can be empty if line items are not visible.`

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> },
) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await params // validate param exists

  const formData = await req.formData()
  const file = formData.get('image') as File | null
  if (!file) return NextResponse.json({ error: 'No image provided' }, { status: 400 })

  // Validate file type
  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'File must be an image' }, { status: 400 })
  }

  // Convert to base64
  const bytes = await file.arrayBuffer()
  const base64 = Buffer.from(bytes).toString('base64')
  const dataUri = `data:${file.type};base64,${base64}`

  // Limit size: 10MB
  if (bytes.byteLength > 10 * 1024 * 1024) {
    return NextResponse.json({ error: 'Image too large (max 10MB)' }, { status: 400 })
  }

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    max_tokens: 1024,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: [
          { type: 'text', text: USER_PROMPT },
          { type: 'image_url', image_url: { url: dataUri, detail: 'high' } },
        ],
      },
    ],
  })

  const raw = response.choices[0]?.message.content ?? '{}'

  let parsed: Record<string, unknown>
  try {
    parsed = JSON.parse(raw.replace(/```json\n?|\n?```/g, '').trim())
  } catch {
    parsed = {}
  }

  return NextResponse.json({ ...parsed, imageData: dataUri })
}
