import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs/promises'

const ALLOWED: Record<string, string> = {
  'reveal.css':      'text/css',
  'reveal.js':       'application/javascript',
  'theme/white.css': 'text/css',
  'theme/black.css': 'text/css',
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ file: string[] }> }
) {
  const { file } = await params
  const filePath  = file.join('/')           // e.g. "theme/white.css" or "reveal.js"
  const contentType = ALLOWED[filePath]
  if (!contentType) return new NextResponse('Not found', { status: 404 })

  const revealDist = path.join(process.cwd(), 'node_modules', 'reveal.js', 'dist')
  const fullPath   = path.resolve(revealDist, filePath)

  // Evitar path traversal
  if (!fullPath.startsWith(revealDist)) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  try {
    const content = await fs.readFile(fullPath, 'utf-8')
    return new NextResponse(content, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
      },
    })
  } catch {
    return new NextResponse('Not found', { status: 404 })
  }
}
