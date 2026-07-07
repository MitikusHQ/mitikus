'use client'

import { useState, useCallback } from 'react'
import { saveConfig, type InstallationConfig } from '@/app/actions/config'
import { ConfigSection, ConfigField } from './ConfigSection'
import { ProviderCard } from './ProviderCard'
import { ModelCard } from './ModelCard'
import { TemperatureSlider } from './TemperatureSlider'
import { PROVIDERS, LANGUAGE_LABELS, OUTPUT_FORMAT_LABELS, getDefaultModel } from '@/lib/providers'

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

interface Props {
  toolInstanceId: string
  workspaceId: string
  initialConfig: InstallationConfig
  availableProviderIds: string[]
}

export function ConfigClient({ toolInstanceId, workspaceId, initialConfig, availableProviderIds }: Props) {
  const [config, setConfig] = useState<InstallationConfig>(initialConfig)
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const set = useCallback(<K extends keyof InstallationConfig>(key: K, value: InstallationConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }))
    setSaveState('idle')
  }, [])

  const handleProviderChange = useCallback((providerId: string) => {
    setConfig((prev) => ({
      ...prev,
      provider: providerId,
      model: getDefaultModel(providerId),
    }))
    setSaveState('idle')
  }, [])

  const handleSave = async () => {
    setSaveState('saving')
    const result = await saveConfig(toolInstanceId, workspaceId, config)
    if ('error' in result) {
      setErrorMessage(result.error)
      setSaveState('error')
    } else {
      setSaveState('saved')
      setTimeout(() => setSaveState('idle'), 2500)
    }
  }

  const currentProvider = PROVIDERS.find((p) => p.id === config.provider)
  const currentModels = currentProvider?.models ?? []

  return (
    <div className="space-y-5">

      {/* ── Modelo IA ── */}
      <ConfigSection
        icon="🤖"
        title="Modelo IA"
        description="Elige el proveedor y modelo que usará esta herramienta al ejecutarse"
      >
        {/* Providers */}
        <ConfigField label="Proveedor">
          <div className="grid gap-3 sm:grid-cols-3">
            {PROVIDERS.map((provider) => (
              <ProviderCard
                key={provider.id}
                provider={provider}
                isSelected={config.provider === provider.id}
                isAvailable={availableProviderIds.includes(provider.id)}
                onSelect={handleProviderChange}
              />
            ))}
          </div>
        </ConfigField>

        {/* Models within selected provider */}
        {currentModels.length > 0 && (
          <ConfigField label="Modelo">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {currentModels.map((model) => (
                <ModelCard
                  key={model.id}
                  model={model}
                  isSelected={config.model === model.id}
                  onSelect={(id) => set('model', id)}
                />
              ))}
            </div>
          </ConfigField>
        )}
      </ConfigSection>

      {/* ── Creatividad ── */}
      <ConfigSection
        icon="🎨"
        title="Creatividad"
        description="Controla la aleatoriedad y creatividad de las respuestas"
      >
        <TemperatureSlider
          label="Temperatura"
          value={config.temperature}
          onChange={(v) => set('temperature', v)}
          min={0}
          max={1}
          step={0.05}
          hint="0 = determinista y preciso · 1 = más creativo y variado"
          nullLabel="Por defecto del modelo"
        />
        <TemperatureSlider
          label="Top-P (nucleus sampling)"
          value={config.topP}
          onChange={(v) => set('topP', v)}
          min={0}
          max={1}
          step={0.05}
          hint="Controla la diversidad de tokens candidatos. Solo modifica si sabes lo que haces."
          nullLabel="Por defecto del modelo"
        />
      </ConfigSection>

      {/* ── Salida ── */}
      <ConfigSection
        icon="📤"
        title="Salida"
        description="Idioma, formato y longitud máxima de las respuestas"
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <ConfigField label="Idioma de respuesta">
            <select
              value={config.language}
              onChange={(e) => set('language', e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {Object.entries(LANGUAGE_LABELS).map(([code, label]) => (
                <option key={code} value={code}>{label}</option>
              ))}
            </select>
          </ConfigField>

          <ConfigField label="Formato de respuesta">
            <select
              value={config.outputFormat}
              onChange={(e) => set('outputFormat', e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {Object.entries(OUTPUT_FORMAT_LABELS).map(([code, label]) => (
                <option key={code} value={code}>{label}</option>
              ))}
            </select>
          </ConfigField>
        </div>

        <ConfigField
          label="Tokens máximos de salida"
          hint="Vacío = máximo del modelo. Reducir limita la longitud de respuesta."
        >
          <input
            type="number"
            min={100}
            max={32000}
            step={100}
            value={config.maxTokens ?? ''}
            onChange={(e) =>
              set('maxTokens', e.target.value === '' ? null : parseInt(e.target.value, 10))
            }
            placeholder="Máximo del modelo"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-mono focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </ConfigField>
      </ConfigSection>

      {/* ── Instrucciones ── */}
      <ConfigSection
        icon="📝"
        title="Instrucciones personalizadas"
        description="Ajusta o sustituye el comportamiento de la IA para esta instalación"
      >
        <ConfigField
          label="Instrucciones adicionales"
          hint="Se añaden al final del prompt del sistema. Usa esto para añadir contexto de tu empresa, formato de salida específico, etc."
        >
          <textarea
            rows={4}
            value={config.customInstructions ?? ''}
            onChange={(e) => set('customInstructions', e.target.value || null)}
            placeholder="Ejemplo: Nuestro estilo de informes es conciso y ejecutivo. Siempre incluye una sección de próximos pasos."
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-mono resize-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </ConfigField>

        <ConfigField
          label="Sustituir prompt del sistema completo"
          hint="⚠ Avanzado — reemplaza por completo el prompt de sistema generado. Deja vacío para usar el prompt automático de la herramienta."
        >
          <textarea
            rows={6}
            value={config.systemPromptOverride ?? ''}
            onChange={(e) => set('systemPromptOverride', e.target.value || null)}
            placeholder="Escribe aquí el prompt de sistema personalizado (opcional)..."
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-mono resize-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </ConfigField>
      </ConfigSection>

      {/* ── Guardar ── */}
      <div className="flex items-center justify-between rounded-xl border bg-card px-6 py-4 sticky bottom-4 shadow-lg">
        <div className="text-xs text-muted-foreground">
          Los cambios se aplican en la próxima ejecución
        </div>
        <div className="flex items-center gap-3">
          {saveState === 'error' && (
            <p className="text-xs text-destructive">{errorMessage}</p>
          )}
          {saveState === 'saved' && (
            <p className="text-xs text-green-600 dark:text-green-400 font-medium">✓ Guardado</p>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={saveState === 'saving'}
            className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50 transition-all"
          >
            {saveState === 'saving' ? 'Guardando…' : 'Guardar configuración'}
          </button>
        </div>
      </div>
    </div>
  )
}
