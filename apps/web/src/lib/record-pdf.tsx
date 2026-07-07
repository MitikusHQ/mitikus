import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { ValidatedToolSchema, ChecklistConfig, ScoringConfig } from '@protools/schema'

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    padding: 48,
    backgroundColor: '#ffffff',
    color: '#111827',
  },
  header: {
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 16,
  },
  toolName: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
    color: '#111827',
  },
  meta: {
    fontSize: 9,
    color: '#6b7280',
    marginTop: 2,
  },
  section: {
    marginTop: 20,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#374151',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 4,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 6,
    gap: 8,
  },
  label: {
    width: '35%',
    fontSize: 9,
    color: '#6b7280',
    fontFamily: 'Helvetica-Bold',
  },
  value: {
    flex: 1,
    fontSize: 9,
    color: '#111827',
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 5,
    gap: 6,
  },
  checkBox: {
    width: 10,
    height: 10,
    borderWidth: 1,
    borderColor: '#6b7280',
    marginTop: 1,
    flexShrink: 0,
  },
  checkBoxChecked: {
    width: 10,
    height: 10,
    backgroundColor: '#2563eb',
    borderWidth: 1,
    borderColor: '#2563eb',
    marginTop: 1,
    flexShrink: 0,
  },
  checkLabel: {
    fontSize: 9,
    flex: 1,
    color: '#111827',
  },
  checkLabelDone: {
    fontSize: 9,
    flex: 1,
    color: '#9ca3af',
  },
  categoryTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#374151',
    marginTop: 10,
    marginBottom: 4,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
    paddingVertical: 3,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  scoreCriterion: {
    fontSize: 9,
    flex: 1,
    color: '#374151',
  },
  scoreValue: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
    width: 40,
    textAlign: 'right',
  },
  totalBox: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#374151',
  },
  totalValue: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
  },
  footer: {
    position: 'absolute',
    bottom: 32,
    left: 48,
    right: 48,
    fontSize: 8,
    color: '#9ca3af',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
})

interface Props {
  schema: ValidatedToolSchema
  data: Record<string, unknown>
  toolName: string
  workspaceName: string
  clientName?: string | null
  createdAt: Date
  recordId: string
}

export function RecordPdfDocument({
  schema,
  data,
  toolName,
  workspaceName,
  clientName,
  createdAt,
}: Props) {
  const recordType = data._type as string | undefined

  const dateStr = createdAt.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.toolName}>{toolName}</Text>
          <Text style={styles.meta}>Workspace: {workspaceName}</Text>
          {clientName && <Text style={styles.meta}>Cliente: {clientName}</Text>}
          <Text style={styles.meta}>Fecha: {dateStr}</Text>
        </View>

        {/* Content based on record type */}
        {recordType === 'checklist' ? (
          <ChecklistSection schema={schema} data={data} />
        ) : recordType === 'scoring' ? (
          <ScoringSection schema={schema} data={data} />
        ) : (
          <FormSection schema={schema} data={data} />
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>{toolName} — MITIKUS</Text>
          <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}

function FormSection({
  schema,
  data,
}: {
  schema: ValidatedToolSchema
  data: Record<string, unknown>
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Datos del registro</Text>
      {Object.entries(schema.dataSchema.fields).map(([fieldId, field]) => {
        const value = data[fieldId]
        let displayValue = '—'
        if (value !== null && value !== undefined) {
          if (field.type === 'boolean') displayValue = value ? 'Sí' : 'No'
          else if (field.type === 'date') {
            try {
              displayValue = new Date(String(value)).toLocaleDateString('es-ES')
            } catch {
              displayValue = String(value)
            }
          } else {
            displayValue = String(value)
          }
        }
        return (
          <View key={fieldId} style={styles.row}>
            <Text style={styles.label}>{field.label}</Text>
            <Text style={styles.value}>{displayValue}</Text>
          </View>
        )
      })}
    </View>
  )
}

function ChecklistSection({
  schema,
  data,
}: {
  schema: ValidatedToolSchema
  data: Record<string, unknown>
}) {
  const checklistCap = schema.capabilities.find((c) => c.type === 'CHECKLIST')
  if (!checklistCap) return null
  const config = checklistCap.config as ChecklistConfig
  const items = (data._items ?? {}) as Record<string, boolean>

  const totalItems = config.items.length
  const checkedCount = Object.values(items).filter(Boolean).length
  const percent = totalItems > 0 ? Math.round((checkedCount / totalItems) * 100) : 0

  // Show form fields first (employee info, etc.)
  const hasFormFields = Object.keys(schema.dataSchema.fields).length > 0

  // Group items by category
  const orderedCategories: string[] = config.categories
    ? config.categories
    : [...new Set(config.items.map((i) => i.category).filter((c): c is string => !!c))]

  const grouped: Array<{ name: string; items: typeof config.items }> = []
  for (const cat of orderedCategories) {
    const catItems = config.items.filter((i) => i.category === cat)
    if (catItems.length > 0) grouped.push({ name: cat, items: catItems })
  }
  const uncategorized = config.items.filter((i) => !i.category)
  if (uncategorized.length > 0) grouped.push({ name: '', items: uncategorized })

  return (
    <>
      {hasFormFields && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información</Text>
          {Object.entries(schema.dataSchema.fields).map(([fieldId, field]) => {
            const value = data[fieldId]
            if (value == null) return null
            return (
              <View key={fieldId} style={styles.row}>
                <Text style={styles.label}>{field.label}</Text>
                <Text style={styles.value}>{String(value)}</Text>
              </View>
            )
          })}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Checklist — {checkedCount}/{totalItems} ({percent}%)
        </Text>
        {grouped.map((group) => (
          <View key={group.name || '__all__'}>
            {group.name && <Text style={styles.categoryTitle}>{group.name}</Text>}
            {group.items.map((item) => (
              <View key={item.id} style={styles.checkItem}>
                <View style={items[item.id] ? styles.checkBoxChecked : styles.checkBox} />
                <Text style={items[item.id] ? styles.checkLabelDone : styles.checkLabel}>
                  {item.label}
                </Text>
              </View>
            ))}
          </View>
        ))}
      </View>
    </>
  )
}

function ScoringSection({
  schema,
  data,
}: {
  schema: ValidatedToolSchema
  data: Record<string, unknown>
}) {
  const scoringCap = schema.capabilities.find((c) => c.type === 'SCORING')
  if (!scoringCap) return null
  const config = scoringCap.config as ScoringConfig
  const scores = (data._scores ?? {}) as Record<string, number>
  const total = typeof data._total === 'number' ? data._total : 0

  const threshold = config.thresholds?.find((t) => total >= t.min && total <= t.max)

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Evaluación de puntuación</Text>
      {config.criteria.map((criterion) => (
        <View key={criterion.id} style={styles.scoreRow}>
          <Text style={styles.scoreCriterion}>
            {criterion.label}
            {criterion.weight !== undefined ? ` (${Math.round(criterion.weight * 100)}%)` : ''}
          </Text>
          <Text style={styles.scoreValue}>
            {scores[criterion.id] ?? '—'}/{criterion.max ?? 10}
          </Text>
        </View>
      ))}
      <View style={styles.totalBox}>
        <Text style={styles.totalLabel}>
          Puntuación total{threshold ? ` — ${threshold.label}` : ''}
        </Text>
        <Text style={styles.totalValue}>{total.toFixed(2)}</Text>
      </View>
    </View>
  )
}
