import { useEffect, useState } from 'react'
import { Button, SectionHeader, LoadingState, EmptyState, CheckboxWithLabel, RadioGroup, Alert, Tabs, TabPanel } from '../components/ui'
import { Download, Check, FileDown, Database, Paintbrush, Palette, Type, Sparkles, Grid } from 'lucide-react'
import styles from './ExportPage.module.css'

interface Collection {
  id: string
  name: string
  variableCount: number
  modes: string[]
}

interface StyleGroup {
  name: string
  count: number
}

interface StylesByCategory {
  paint: StyleGroup[]
  text: StyleGroup[]
  effect: StyleGroup[]
  grid: StyleGroup[]
}

type ExportViewState = 'selection' | 'exporting' | 'success'
type ColorFormat = 'oklch' | 'hex' | 'rgba'

export function ExportPage() {
  const [view, setView] = useState<ExportViewState>('selection')
  const [activeTab, setActiveTab] = useState<'variables' | 'styles'>('variables')
  const [collections, setCollections] = useState<Collection[]>([])
  const [selectedCollectionIds, setSelectedCollectionIds] = useState<string[]>([])
  const [stylesByCategory, setStylesByCategory] = useState<StylesByCategory>({ paint: [], text: [], effect: [], grid: [] })
  const [selectedStyleGroups, setSelectedStyleGroups] = useState<{ category: string; group: string }[]>([])
  const [colorFormat, setColorFormat] = useState<ColorFormat>('oklch')
  const [loading, setLoading] = useState(true)
  const [exportResult, setExportResult] = useState<{
    tokens: any
    collectionCount: number
    variableCount: number
    format: ColorFormat
  } | null>(null)
  const [stylesExportResult, setStylesExportResult] = useState<{
    styles: any
    counts: any
    format: ColorFormat
  } | null>(null)

  useEffect(() => {
    // Request collections and styles from Figma
    parent.postMessage({ pluginMessage: { type: 'get-collections' } }, '*')
    parent.postMessage({ pluginMessage: { type: 'get-styles' } }, '*')

    // Listen for messages
    const handleMessage = (event: MessageEvent) => {
      const msg = event.data.pluginMessage

      if (msg.type === 'collections-list') {
        const cols = msg.data.collections.map((c: any) => ({
          id: c.id,
          name: c.name,
          variableCount: c.variableCount,
          modes: c.modes || ['Default']
        }))
        setCollections(cols)
        // Select all by default
        setSelectedCollectionIds(cols.map((c: Collection) => c.id))
        setLoading(false)
      }

      if (msg.type === 'styles-list') {
        const styles = msg.data.stylesByCategory as StylesByCategory
        setStylesByCategory(styles)
        // Select all by default
        const allSelections: { category: string; group: string }[] = []
        Object.entries(styles).forEach(([category, groups]) => {
          groups.forEach((group: StyleGroup) => {
            allSelections.push({ category, group: group.name })
          })
        })
        setSelectedStyleGroups(allSelections)
      }

      if (msg.type === 'export-complete') {
        // Backend now returns the format that was used
        setExportResult(msg.data)
        setView('success')
        // Trigger download
        downloadJSON(msg.data.tokens, 'design-tokens')
      }

      if (msg.type === 'styles-export-complete') {
        setStylesExportResult(msg.data)
        setView('success')
        // Trigger download with different filename
        downloadJSON(msg.data.styles, 'figma-styles')
      }

      if (msg.type === 'export-error') {
        alert(`Export error: ${msg.data.message}`)
        setView('selection')
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  const handleToggleCollection = (collectionId: string) => {
    setSelectedCollectionIds(prev => 
      prev.includes(collectionId)
        ? prev.filter(id => id !== collectionId)
        : [...prev, collectionId]
    )
  }

  const handleToggleAll = () => {
    if (selectedCollectionIds.length === collections.length) {
      setSelectedCollectionIds([])
    } else {
      setSelectedCollectionIds(collections.map(c => c.id))
    }
  }

  const handleToggleStyleGroup = (category: string, groupName: string) => {
    setSelectedStyleGroups(prev => {
      const exists = prev.some(s => s.category === category && s.group === groupName)
      if (exists) {
        return prev.filter(s => !(s.category === category && s.group === groupName))
      }
      return [...prev, { category, group: groupName }]
    })
  }

  const handleToggleAllStyles = () => {
    const totalGroups = Object.values(stylesByCategory).reduce((sum, groups) => sum + groups.length, 0)
    if (selectedStyleGroups.length === totalGroups) {
      setSelectedStyleGroups([])
    } else {
      const allSelections: { category: string; group: string }[] = []
      Object.entries(stylesByCategory).forEach(([category, groups]) => {
        groups.forEach((group: StyleGroup) => {
          allSelections.push({ category, group: group.name })
        })
      })
      setSelectedStyleGroups(allSelections)
    }
  }

  const isStyleGroupSelected = (category: string, groupName: string) => {
    return selectedStyleGroups.some(s => s.category === category && s.group === groupName)
  }

  const handleExport = () => {
    if (selectedCollectionIds.length === 0) {
      alert('Please select at least one collection to export')
      return
    }

    setView('exporting')
    parent.postMessage(
      {
        pluginMessage: {
          type: 'export-variables',
          data: { 
            collectionIds: selectedCollectionIds,
            colorFormat: colorFormat
          }
        }
      },
      '*'
    )
  }

  const downloadJSON = (data: any, prefix: string = 'export') => {
    const json = JSON.stringify(data, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${prefix}-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleExportStyles = () => {
    if (selectedStyleGroups.length === 0) {
      alert('Please select at least one style group to export')
      return
    }

    console.log('🎨 UI: Exporting styles with colorFormat:', colorFormat)
    
    setView('exporting')
    parent.postMessage(
      {
        pluginMessage: {
          type: 'export-styles',
          data: { 
            selectedGroups: selectedStyleGroups,
            colorFormat: colorFormat
          }
        }
      },
      '*'
    )
  }

  const handleExportAgain = () => {
    setView('selection')
    setExportResult(null)
    setStylesExportResult(null)
  }

  const handleClose = () => {
    parent.postMessage({ pluginMessage: { type: 'close' } }, '*')
  }

  // Determine initial tab - if no collections, default to styles
  useEffect(() => {
    const totalStyles = Object.values(stylesByCategory).reduce((sum, groups) => sum + groups.length, 0)
    if (!loading && collections.length === 0 && totalStyles > 0) {
      setActiveTab('styles')
    }
  }, [loading, collections.length, stylesByCategory])

  if (loading) {
    return (
      <div className="page-content">
        <LoadingState message="Loading..." />
      </div>
    )
  }

  if (view === 'exporting') {
    return (
      <div className="page-content">
        <LoadingState message={exportResult ? 'Exporting variables...' : 'Exporting styles...'} />
      </div>
    )
  }

  if (view === 'success' && (exportResult || stylesExportResult)) {
    return (
      <div className="page-content">
        <div className={styles.successView}>
          <div className={styles.successIcon}>
            <Check size={40} />
          </div>
          
          <div className={styles.successContent}>
            <h2>Export Complete!</h2>
            <p>Your {exportResult ? 'design tokens' : 'Figma styles'} have been downloaded</p>
          </div>

          {exportResult && (
          <div className={styles.successStats}>
            <div className={styles.successStatsContent}>
              <div className={styles.successStatRow}>
                <span className={styles.successStatLabel}>Collections:</span>
                <strong className={styles.successStatValue}>{exportResult.collectionCount}</strong>
              </div>
              <div className={styles.successStatRow}>
                <span className={styles.successStatLabel}>Variables:</span>
                <strong className={styles.successStatValue}>{exportResult.variableCount}</strong>
              </div>
              <div className={styles.successStatRow}>
                <span className={styles.successStatLabel}>Color Format:</span>
                <strong className={styles.successStatValue}>{exportResult.format.toUpperCase()}</strong>
              </div>
            </div>
          </div>
          )}

          {stylesExportResult && (
            <div className={styles.successStats}>
              <div className={styles.successStatsContent}>
                <div className={styles.successStatRow}>
                  <span className={styles.successStatLabel}>Color:</span>
                  <strong className={styles.successStatValue}>{stylesExportResult.counts.paint}</strong>
                </div>
                <div className={styles.successStatRow}>
                  <span className={styles.successStatLabel}>Text:</span>
                  <strong className={styles.successStatValue}>{stylesExportResult.counts.text}</strong>
                </div>
                <div className={styles.successStatRow}>
                  <span className={styles.successStatLabel}>Effect:</span>
                  <strong className={styles.successStatValue}>{stylesExportResult.counts.effect}</strong>
                </div>
                <div className={styles.successStatRow}>
                  <span className={styles.successStatLabel}>Layout grid:</span>
                  <strong className={styles.successStatValue}>{stylesExportResult.counts.grid}</strong>
                </div>
                <div className={styles.successStatRow}>
                  <span className={styles.successStatLabel}>Color Format:</span>
                  <strong className={styles.successStatValue}>{stylesExportResult.format.toUpperCase()}</strong>
                </div>
              </div>
            </div>
          )}

          <div className={styles.successActions}>
            <Button variant="ghost" onClick={handleExportAgain}>
              <FileDown size={14} />
              Export More
            </Button>
            <Button variant="primary" onClick={handleClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-content">
      <SectionHeader
        variant="primary"
        title="Export"
        description="Export Variables or Styles from your Figma file"
      />

      <Tabs
        tabs={[
          {
            id: 'variables',
            label: 'Variables',
            icon: <Database size={16} />
          },
          {
            id: 'styles',
            label: 'Styles',
            icon: <Paintbrush size={16} />
          }
        ]}
        activeTab={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId as 'variables' | 'styles')}
      >
        <TabPanel id="variables" activeTab={activeTab}>
          {collections.length === 0 ? (
            <EmptyState
              icon="📦"
              title="No Variable Collections"
              description="This file has no variable collections. Try the Styles tab to export Figma Styles instead."
            />
          ) : (
            <>
      {/* Color Format Selection */}
      <div className={styles.formatSection}>
        <RadioGroup
          label="Color Format"
          description="Choose how colors should be exported"
          name="color-format"
          variant="inline"
          value={colorFormat}
          onChange={(value) => setColorFormat(value as ColorFormat)}
          options={[
            {
              value: 'oklch',
              label: 'OKLCH',
              description: 'Modern perceptual color space with alpha support (recommended)'
            },
            {
              value: 'hex',
              label: 'HEX',
              description: 'Hexadecimal format (#RRGGBB or #RRGGBBAA with opacity)'
            },
            {
              value: 'rgba',
              label: 'RGBA',
              description: 'RGB with alpha channel rgba(r, g, b, a)'
            }
          ]}
        />
      </div>

      {/* Select All / Deselect All */}
      <div className={styles.selectAllSection}>
        <CheckboxWithLabel
          id="select-all"
          label="Select All Collections"
          checked={selectedCollectionIds.length === collections.length}
          onChange={() => handleToggleAll()}
        />
      </div>

      {/* Collection List */}
      <div className={styles.collectionList}>
        {collections.map(collection => {
          const isSelected = selectedCollectionIds.includes(collection.id)
          return (
            <div
              key={collection.id}
              className={styles.collectionCard}
              data-selected={isSelected}
              onClick={() => handleToggleCollection(collection.id)}
            >
              <div className={styles.collectionCardContent}>
                <CheckboxWithLabel
                  id={`collection-${collection.id}`}
                  label={collection.name}
                  checked={isSelected}
                  onChange={() => handleToggleCollection(collection.id)}
                />
                <div className={styles.collectionMeta}>
                  <span>{collection.variableCount} variable{collection.variableCount !== 1 ? 's' : ''}</span>
                  <span>•</span>
                  <span>{collection.modes.join(', ')}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Export Actions */}
      <div className={styles.exportActions}>
        <Button
          variant="primary"
          onClick={handleExport}
          disabled={selectedCollectionIds.length === 0}
        >
          <Download size={14} />
                  Export Variables {selectedCollectionIds.length > 0 && `(${selectedCollectionIds.length})`}
        </Button>
      </div>

      {/* Info Note */}
              <Alert variant="info" title="Variables">
                Export Figma Variables as design tokens in the same format used for imports. 
                Perfect for version control and team collaboration.
              </Alert>
            </>
          )}
        </TabPanel>

        <TabPanel id="styles" activeTab={activeTab}>
          {Object.values(stylesByCategory).every(cat => cat.length === 0) ? (
            <EmptyState
              icon="🎨"
              title="No Styles Found"
              description="This file has no Figma Styles. Modern files typically use Variables instead."
            />
          ) : (
            <>
              {/* Color Format Selection */}
              <div className={styles.formatSection}>
                <RadioGroup
                  label="Color Format"
                  description="Choose how colors should be exported"
                  name="color-format-styles"
                  variant="inline"
                  value={colorFormat}
                  onChange={(value) => setColorFormat(value as ColorFormat)}
                  options={[
                    {
                      value: 'oklch',
                      label: 'OKLCH',
                      description: 'Modern perceptual color space (recommended)'
                    },
                    {
                      value: 'hex',
                      label: 'HEX',
                      description: 'Traditional hexadecimal format (#RRGGBB)'
                    },
                    {
                      value: 'rgba',
                      label: 'RGBA',
                      description: 'RGB with alpha channel rgba(r, g, b, a)'
                    }
                  ]}
                />
              </div>

              {/* Select All / Deselect All */}
              <div className={styles.selectAllSection}>
                <CheckboxWithLabel
                  id="select-all-styles"
                  label="Select All Style Groups"
                  checked={selectedStyleGroups.length === Object.values(stylesByCategory).reduce((sum, groups) => sum + groups.length, 0)}
                  onChange={() => handleToggleAllStyles()}
                />
              </div>

              {/* Style Categories */}
              <div className={styles.styleCategoriesContainer}>
                {stylesByCategory.paint.length > 0 && (
                  <div className={styles.categorySection}>
                    <div className={styles.categoryHeader}>
                      <Palette size={16} />
                      <h3>Color</h3>
                      <span className={styles.categoryCount}>({stylesByCategory.paint.length})</span>
                    </div>
                    <div className={styles.categoryGroups}>
                      {stylesByCategory.paint.map(group => {
                        const isSelected = isStyleGroupSelected('paint', group.name)
                        return (
                          <div
                            key={`paint-${group.name}`}
                            className={styles.styleGroupItem}
                            data-selected={isSelected}
                            onClick={() => handleToggleStyleGroup('paint', group.name)}
                          >
                            <CheckboxWithLabel
                              id={`paint-${group.name}`}
                              label={group.name}
                              checked={isSelected}
                              onChange={() => handleToggleStyleGroup('paint', group.name)}
                            />
                            <span className={styles.styleGroupCount}>{group.count} style{group.count !== 1 ? 's' : ''}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {stylesByCategory.text.length > 0 && (
                  <div className={styles.categorySection}>
                    <div className={styles.categoryHeader}>
                      <Type size={16} />
                      <h3>Text</h3>
                      <span className={styles.categoryCount}>({stylesByCategory.text.length})</span>
                    </div>
                    <div className={styles.categoryGroups}>
                      {stylesByCategory.text.map(group => {
                        const isSelected = isStyleGroupSelected('text', group.name)
                        return (
                          <div
                            key={`text-${group.name}`}
                            className={styles.styleGroupItem}
                            data-selected={isSelected}
                            onClick={() => handleToggleStyleGroup('text', group.name)}
                          >
                            <CheckboxWithLabel
                              id={`text-${group.name}`}
                              label={group.name}
                              checked={isSelected}
                              onChange={() => handleToggleStyleGroup('text', group.name)}
                            />
                            <span className={styles.styleGroupCount}>{group.count} style{group.count !== 1 ? 's' : ''}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {stylesByCategory.effect.length > 0 && (
                  <div className={styles.categorySection}>
                    <div className={styles.categoryHeader}>
                      <Sparkles size={16} />
                      <h3>Effect</h3>
                      <span className={styles.categoryCount}>({stylesByCategory.effect.length})</span>
                    </div>
                    <div className={styles.categoryGroups}>
                      {stylesByCategory.effect.map(group => {
                        const isSelected = isStyleGroupSelected('effect', group.name)
                        return (
                          <div
                            key={`effect-${group.name}`}
                            className={styles.styleGroupItem}
                            data-selected={isSelected}
                            onClick={() => handleToggleStyleGroup('effect', group.name)}
                          >
                            <CheckboxWithLabel
                              id={`effect-${group.name}`}
                              label={group.name}
                              checked={isSelected}
                              onChange={() => handleToggleStyleGroup('effect', group.name)}
                            />
                            <span className={styles.styleGroupCount}>{group.count} style{group.count !== 1 ? 's' : ''}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {stylesByCategory.grid.length > 0 && (
                  <div className={styles.categorySection}>
                    <div className={styles.categoryHeader}>
                      <Grid size={16} />
                      <h3>Layout grid</h3>
                      <span className={styles.categoryCount}>({stylesByCategory.grid.length})</span>
                    </div>
                    <div className={styles.categoryGroups}>
                      {stylesByCategory.grid.map(group => {
                        const isSelected = isStyleGroupSelected('grid', group.name)
                        return (
                          <div
                            key={`grid-${group.name}`}
                            className={styles.styleGroupItem}
                            data-selected={isSelected}
                            onClick={() => handleToggleStyleGroup('grid', group.name)}
                          >
                            <CheckboxWithLabel
                              id={`grid-${group.name}`}
                              label={group.name}
                              checked={isSelected}
                              onChange={() => handleToggleStyleGroup('grid', group.name)}
                            />
                            <span className={styles.styleGroupCount}>{group.count} style{group.count !== 1 ? 's' : ''}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Export Actions */}
              <div className={styles.exportActions}>
                <Button
                  variant="primary"
                  onClick={handleExportStyles}
                  disabled={selectedStyleGroups.length === 0}
                >
                  <Download size={14} />
                  Export Styles {selectedStyleGroups.length > 0 && `(${selectedStyleGroups.length})`}
                </Button>
              </div>

              {/* Info Notes */}
              <Alert variant="info" title="Styles Export & Import">
                Export and import legacy Figma Styles with full variable binding support.
                Variable bindings will be automatically restored when importing if the referenced variables exist.
              </Alert>

              <Alert variant="info" title="What Gets Exported">
                • <strong>Color:</strong> Solid colors, gradients (with variable bindings)<br />
                • <strong>Text:</strong> Typography settings and font properties<br />
                • <strong>Effect:</strong> Shadows and blurs<br />
                • <strong>Layout grid:</strong> Grid layouts and guides
      </Alert>
            </>
          )}
        </TabPanel>
      </Tabs>
    </div>
  )
}
