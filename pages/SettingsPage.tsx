import { useEffect, useState } from 'react'
import { Button, SectionHeader, Input, RadioGroup, useToast } from '../components/ui'
import { useFigmaMessage, usePostMessage } from '../hooks/useFigmaMessage'
import { Save, RotateCcw } from 'lucide-react'

interface Settings {
  collectionName: string
  namingConvention: 'kebab' | 'camel' | 'pascal'
  colorFormat: 'oklch' | 'hex' | 'rgba' | 'hsl'
}

const DEFAULT_SETTINGS: Settings = {
  collectionName: 'Design Tokens',
  namingConvention: 'kebab',
  colorFormat: 'oklch',
}

export function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const postMessage = usePostMessage()
  const { showSuccess } = useToast()

  // Load saved settings on mount
  useEffect(() => {
    postMessage({ type: 'load-settings' })
  }, [postMessage])

  useFigmaMessage((msg) => {
    if (msg.type === 'settings-loaded') {
      setSettings((prev) => ({ ...prev, ...msg.data }))
    }
  })

  const handleSave = () => {
    postMessage({ type: 'save-settings', data: settings })
    showSuccess('Settings saved')
  }

  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS)
    postMessage({ type: 'save-settings', data: DEFAULT_SETTINGS })
    showSuccess('Settings reset to defaults')
  }

  return (
    <div className="settings-page">
      <SectionHeader
        variant="primary"
        title="Plugin Settings"
        description="Configure how the plugin imports and manages design tokens"
      />

      <div className="settings-content">
        {/* Collection Settings */}
        <section className="settings-section">
          <h3>Collection Settings</h3>

          <Input
            label="Default Collection Name"
            description="Name for the Figma variable collection"
            value={settings.collectionName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSettings({ ...settings, collectionName: e.target.value })}
            placeholder="Design Tokens"
          />
        </section>

        {/* Naming Convention */}
        <section className="settings-section">
          <h3>Naming Convention</h3>

          <RadioGroup
            label="Variable Naming Style"
            description="How variable names should be formatted"
            name="namingConvention"
            value={settings.namingConvention}
            onChange={(value: string) => setSettings({ ...settings, namingConvention: value as Settings['namingConvention'] })}
            options={[
              { value: 'kebab', label: 'kebab-case', description: 'color-primary-500' },
              { value: 'camel', label: 'camelCase', description: 'colorPrimary500' },
              { value: 'pascal', label: 'PascalCase', description: 'ColorPrimary500' },
            ]}
          />
        </section>

        {/* Color Format */}
        <section className="settings-section">
          <h3>Export Settings</h3>

          <RadioGroup
            label="Default Color Format"
            description="Default format for exporting colors"
            name="colorFormat"
            value={settings.colorFormat}
            onChange={(value: string) => setSettings({ ...settings, colorFormat: value as Settings['colorFormat'] })}
            options={[
              { value: 'oklch', label: 'OKLCH', description: 'Modern perceptual color space (recommended)' },
              { value: 'hex', label: 'HEX', description: 'Traditional hexadecimal (#RRGGBB)' },
              { value: 'rgba', label: 'RGBA', description: 'RGB with alpha channel' },
              { value: 'hsl', label: 'HSL', description: 'Hue, saturation, lightness' },
            ]}
          />
        </section>
      </div>

      {/* Actions */}
      <div className="settings-actions">
        <Button variant="ghost" onClick={handleReset}>
          <RotateCcw size={14} />
          Reset to Defaults
        </Button>
        <Button variant="primary" onClick={handleSave}>
          <Save size={14} />
          Save Settings
        </Button>
      </div>
    </div>
  )
}
