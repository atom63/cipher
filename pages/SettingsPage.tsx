import { useState } from 'react'
import { Button, SectionHeader, Input, RadioGroup } from '../components/ui'
import { Save, RotateCcw } from 'lucide-react'

interface Settings {
  collectionName: string
  namingConvention: 'kebab' | 'camel' | 'pascal'
}

export function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    collectionName: 'Design Tokens',
    namingConvention: 'kebab',
  })

  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    // Save to local storage or plugin data
    localStorage.setItem('pluginSettings', JSON.stringify(settings))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleReset = () => {
    const defaultSettings: Settings = {
      collectionName: 'Design Tokens',
      namingConvention: 'kebab',
    }
    setSettings(defaultSettings)
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
      </div>

      {/* Actions */}
      <div className="settings-actions">
        <Button variant="ghost" onClick={handleReset}>
          <RotateCcw size={14} />
          Reset to Defaults
        </Button>
        <Button variant="primary" onClick={handleSave}>
          <Save size={14} />
          {saved ? 'Saved!' : 'Save Settings'}
        </Button>
      </div>
    </div>
  )
}
