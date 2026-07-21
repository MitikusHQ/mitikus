import StarterKit from '@tiptap/starter-kit'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import { Link } from '@tiptap/extension-link'

export const tiptapExtensions = [
  StarterKit,
  Table.configure({ resizable: false }),
  TableRow,
  TableCell,
  TableHeader,
  Link.configure({ openOnClick: false }),
]
