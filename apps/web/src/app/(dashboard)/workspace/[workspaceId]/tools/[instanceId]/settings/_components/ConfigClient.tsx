'use client'

import { useState, useCallback } from 'react'
import { saveConfig, type InstallationConfig } from '@/app/actions/config'
import { ConfigSection, ConfigField } from './ConfigSection'
import { ProviderCard } from './ProviderCard'
import { ModelCard } from './ModelCard'
import { TemperatureSlider } from './TemperatureSlider'
import { PROVIDERS, LANGUAGE_LABELS, OUTPUT_FORMAT_LABELS, getDefaultModel } from '@/lib/providers'
import type { Locale } from '@/i18n/config'
import { getDashboardTranslations } from '@/i18n/dashboard-translations'

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

interface Props {
  toolInstanceId: string
  workspaceId: string
  initialConfig: InstallationConfig
  availableProviderIds: string[]
  locale: Locale
}

export function ConfigClient({ toolInstanceId, workspaceId, initialConfig, availableProviderIds, locale }: Props) {
  const t = getDashboardTranslations(locale)
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

      <ConfigSection
        icon="🤖"
        title={t.toolSettingsAiModel}
        description={t.toolSettingsAiModelDescription}
      >
        <ConfigField label={t.toolSettingsProvider}>
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

        {currentModels.length > 0 && (
          <ConfigField label={t.toolSettingsModel}>
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

      <ConfigSection
        icon="🎨"
        title={t.toolSettingsCreativity}
        description={t.toolSettingsCreativityDescription}
      >
        <TemperatureSlider
          label={t.toolSettingsTemperature}
          value={config.temperature}
          onChange={(v) => set('temperature', v)}
          min={0}
          max={1}
          step={0.05}
          hint={t.toolSettingsTemperatureHint}
          nullLabel={t.toolSettingsModelDefault}
        />
        <TemperatureSlider
          label="Top-P (nucleus sampling)"
          value={config.topP}
          onChange={(v) => set('topP', v)}
          min={0}
          max={1}
          step={0.05}
          hint={t.toolSettingsTopPHint}
          nullLabel={t.toolSettingsModelDefault}
        />
      </ConfigSection>

      <ConfigSection
        icon="📤"
        title={t.toolSettingsOutput}
        description={t.toolSettingsOutputDescription}
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <ConfigField label={t.toolSettingsResponseLanguage}>
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

          <ConfigField label={t.toolSettingsResponseFormat}>
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
          label={t.toolSettingsMaxOutputTokens}
          hint={t.toolSettingsMaxOutputTokensHint}
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
            placeholder={t.toolSettingsMaxModel}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-mono focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </ConfigField>
      </ConfigSection>

      <ConfigSection
        icon="📝"
        title={t.toolSettingsCustomInstructions}
        description={t.toolSettingsCustomInstructionsDescription}
      >
        <ConfigField
          label={t.toolSettingsAdditionalInstructions}
          hint={t.toolSettingsAdditionalInstructionsHint}
        >
          <textarea
            rows={4}
            value={config.customInstructions ?? ''}
            onChange={(e) => set('customInstructions', e.target.value || null)}
            placeholder={t.toolSettingsAdditionalInstructionsPlaceholder}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-mono resize-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </ConfigField>

        <ConfigField
          label={t.toolSettingsSystemPromptOverride}
          hint={t.toolSettingsSystemPromptOverrideHint}
        >
          <textarea
            rows={6}
            value={config.systemPromptOverride ?? ''}
            onChange={(e) => set('systemPromptOverride', e.target.value || null)}
            placeholder={t.toolSettingsSystemPromptOverridePlaceholder}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-mono resize-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </ConfigField>
      </ConfigSection>

      <div className="flex items-center justify-between rounded-xl border bg-card px-6 py-4 sticky bottom-4 shadow-lg">
        <div className="text-xs text-muted-foreground">
          {t.toolSettingsChangesNextRun}
        </div>
        <div className="flex items-center gap-3">
          {saveState === 'error' && (
            <p className="text-xs text-destructive">{errorMessage}</p>
          )}
          {saveState === 'saved' && (
            <p className="text-xs text-green-600 dark:text-green-400 font-medium">✓ {t.toolSettingsSaved}</p>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={saveState === 'saving'}
            className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50 transition-all"
          >
            {saveState === 'saving' ? `${t.toolApprovalSaving.replace('...', '')}…` : t.toolSettingsSaveConfig}
          </button>
        </div>
      </div>
    </div>
  )
}
