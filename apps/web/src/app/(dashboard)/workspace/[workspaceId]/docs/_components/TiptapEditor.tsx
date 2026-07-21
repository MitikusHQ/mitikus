'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import { tiptapExtensions } from '@/lib/tiptap-extensions'

interface Props {
  initialContent: string
  onChange: (html: string, text: string) => void
}

export function TiptapEditor({ initialContent, onChange }: Props) {
  const editor = useEditor({
    extensions: tiptapExtensions,
    content: initialContent,
    onUpdate({ editor }) {
      onChange(editor.getHTML(), editor.getText())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[300px]',
      },
    },
  })

  if (!editor) return null

  return (
    <div className="border border-border rounded-lg bg-card overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 px-3 py-2 border-b border-border bg-muted/30">
        <ToolbarBtn
          active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Negrita"
        >
          <strong>B</strong>
        </ToolbarBtn>
        <ToolbarBtn
          active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Cursiva"
        >
          <em>I</em>
        </ToolbarBtn>
        <ToolbarBtn
          active={editor.isActive('strike')}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          title="Tachado"
        >
          <s>S</s>
        </ToolbarBtn>
        <Sep />
        <ToolbarBtn
          active={editor.isActive('heading', { level: 1 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          title="Título 1"
        >
          H1
        </ToolbarBtn>
        <ToolbarBtn
          active={editor.isActive('heading', { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          title="Título 2"
        >
          H2
        </ToolbarBtn>
        <ToolbarBtn
          active={editor.isActive('heading', { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          title="Título 3"
        >
          H3
        </ToolbarBtn>
        <Sep />
        <ToolbarBtn
          active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Lista"
        >
          •—
        </ToolbarBtn>
        <ToolbarBtn
          active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Lista numerada"
        >
          1.
        </ToolbarBtn>
        <Sep />
        <ToolbarBtn
          active={editor.isActive('link')}
          onClick={() => {
            const url = window.prompt('URL del enlace')
            if (url) editor.chain().focus().setLink({ href: url }).run()
            else editor.chain().focus().unsetLink().run()
          }}
          title="Enlace"
        >
          🔗
        </ToolbarBtn>
        <ToolbarBtn
          active={editor.isActive('table')}
          onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
          title="Tabla"
        >
          ⊞
        </ToolbarBtn>
        <ToolbarBtn
          active={editor.isActive('blockquote')}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          title="Cita"
        >
          "
        </ToolbarBtn>
        <ToolbarBtn
          active={editor.isActive('code')}
          onClick={() => editor.chain().focus().toggleCode().run()}
          title="Código"
        >
          {'</>'}
        </ToolbarBtn>
        <ToolbarBtn
          active={false}
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Regla horizontal"
        >
          —
        </ToolbarBtn>
      </div>

      {/* Área de edición */}
      <EditorContent editor={editor} className="px-6 py-5" />
    </div>
  )
}

function ToolbarBtn({
  children,
  active,
  onClick,
  title,
}: {
  children: React.ReactNode
  active: boolean
  onClick: () => void
  title: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`px-2 py-1 text-xs rounded transition-colors ${
        active
          ? 'bg-primary text-primary-foreground'
          : 'hover:bg-muted text-muted-foreground hover:text-foreground'
      }`}
    >
      {children}
    </button>
  )
}

function Sep() {
  return <div className="w-px h-4 bg-border mx-1" aria-hidden />
}
