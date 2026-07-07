/**
 * Convierte Markdown básico a HTML seguro con clases Tailwind.
 * Cubre: encabezados (h1/h2/h3), negrita, cursiva, listas y saltos de línea.
 * Para contenido más complejo considerar react-markdown en iteraciones futuras.
 */
export function renderMarkdown(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/^### (.+)$/gm, '<h3 class="text-base font-semibold mt-5 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm,  '<h2 class="text-[17px] font-bold mt-6 mb-2 border-b pb-1">$1</h2>')
    .replace(/^# (.+)$/gm,   '<h1 class="text-xl font-bold mt-6 mb-3">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g,     '<em>$1</em>')
    .replace(/^[-•]\s+(.+)$/gm,       '<li class="ml-4 list-disc">$1</li>')
    .replace(/^(\d+)\.\s+(.+)$/gm,    '<li class="ml-4 list-decimal">$2</li>')
    .replace(/(<li[\s\S]*?<\/li>\n?)+/g, (m) => `<ul class="space-y-1 my-2">${m}</ul>`)
    .replace(/\n{2,}/g, '<br /><br />')
    .replace(/\n/g, '<br />')
}
