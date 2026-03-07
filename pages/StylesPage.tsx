import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Button,
  SectionHeader,
  Badge,
  EmptyState,
  ConfirmDialog,
  useToast,
  LoadingState,
  Input,
} from '../components/ui'
import { useFigmaMessage, usePostMessage } from '../hooks/useFigmaMessage'
import type { StyleInfo, StyleCounts, PaintInfo, EffectInfo, RebindSuggestion } from '../types/messages'
import { Search, Trash2, PenLine, RefreshCw, Check, X, ChevronDown, ChevronRight, Palette, Type, Sparkles, Grid, Link, Unlink } from 'lucide-react'

type CategoryFilter = 'all' | 'paint' | 'text' | 'effect' | 'grid'
type SortField = 'name' | 'category'
type SortDir = 'asc' | 'desc'

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  paint: <Palette size={12} />,
  text: <Type size={12} />,
  effect: <Sparkles size={12} />,
  grid: <Grid size={12} />,
}

const CATEGORY_LABELS: Record<string, string> = {
  paint: 'Color',
  text: 'Text',
  effect: 'Effect',
  grid: 'Grid',
}

export function StylesPage() {
  const [styles, setStyles] = useState<StyleInfo[]>([])
  const [counts, setCounts] = useState<StyleCounts | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [filterCategory, setFilterCategory] = useState<CategoryFilter>('all')
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())
  const [lastClickedId, setLastClickedId] = useState<string | null>(null)

  // Action panels
  const [showRename, setShowRename] = useState(false)
  const [findText, setFindText] = useState('')
  const [replaceText, setReplaceText] = useState('')
  const [pendingDelete, setPendingDelete] = useState(false)
  const [showRebind, setShowRebind] = useState(false)
  const [rebindSuggestions, setRebindSuggestions] = useState<RebindSuggestion[]>([])
  const [rebindLoading, setRebindLoading] = useState(false)
  const [rebindExcluded, setRebindExcluded] = useState<Set<number>>(new Set())

  const postMessage = usePostMessage()
  const { showSuccess, showError } = useToast()

  const loadStyles = useCallback(() => {
    setLoading(true)
    postMessage({ type: 'get-style-details' })
  }, [postMessage])

  useEffect(() => {
    loadStyles()
  }, [loadStyles])

  useFigmaMessage((msg) => {
    if (msg.type === 'style-details-list') {
      setStyles(msg.data.styles)
      setCounts(msg.data.counts)
      setLoading(false)
    } else if (msg.type === 'styles-renamed') {
      const { success, failed } = msg.data
      // Capture current rename preview for undo before clearing state
      const undoRenames = renamePreview.map(r => ({
        id: r.id,
        category: r.category as 'paint' | 'text' | 'effect' | 'grid',
        newName: r.oldName,
      }))
      if (failed > 0) showError(`${failed} rename(s) failed`)
      else showSuccess(
        `Renamed ${success} style${success !== 1 ? 's' : ''}`,
        undoRenames.length > 0
          ? {
              label: 'Undo',
              onClick: () => {
                postMessage({ type: 'rename-styles', data: { renames: undoRenames } })
              },
            }
          : undefined
      )
      setShowRename(false)
      setFindText('')
      setReplaceText('')
      loadStyles()
    } else if (msg.type === 'styles-deleted') {
      const { success, failed } = msg.data
      if (failed > 0) showError(`${failed} deletion(s) failed`)
      else showSuccess(`Deleted ${success} style${success !== 1 ? 's' : ''}`)
      setSelectedIds(new Set())
      loadStyles()
    } else if (msg.type === 'rebind-suggestions') {
      setRebindSuggestions(msg.data.suggestions)
      setRebindLoading(false)
      setRebindExcluded(new Set())
      if (msg.data.suggestions.length === 0) {
        showSuccess('No unbound colors found that match any local variables')
        setShowRebind(false)
      }
    } else if (msg.type === 'rebind-applied') {
      const { success, failed, applied } = msg.data
      if (failed > 0) showError(`${failed} rebind(s) failed`)
      else showSuccess(
        `Rebound ${success} color${success !== 1 ? 's' : ''} to variables`,
        applied.length > 0
          ? {
              label: 'Undo',
              onClick: () => {
                postMessage({ type: 'undo-rebind', data: { bindings: applied } })
              },
            }
          : undefined
      )
      setShowRebind(false)
      setRebindSuggestions([])
      loadStyles()
    } else if (msg.type === 'rebind-undone') {
      const { success, failed } = msg.data
      if (failed > 0) showError(`${failed} unbind(s) failed`)
      else showSuccess(`Unbound ${success} color${success !== 1 ? 's' : ''}`)
      loadStyles()
    }
  })

  // Filter and sort
  const filtered = useMemo(() => {
    let result = [...styles]

    if (filterCategory !== 'all') {
      result = result.filter(s => s.category === filterCategory)
    }
    if (search) {
      const lower = search.toLowerCase()
      result = result.filter(s =>
        s.name.toLowerCase().includes(lower) ||
        s.description.toLowerCase().includes(lower)
      )
    }

    const naturalCompare = (a: string, b: string) =>
      a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })

    result.sort((a, b) => {
      let cmp = 0
      if (sortField === 'name') cmp = naturalCompare(a.name, b.name)
      else if (sortField === 'category') cmp = a.category.localeCompare(b.category)
      return sortDir === 'asc' ? cmp : -cmp
    })

    return result
  }, [styles, filterCategory, search, sortField, sortDir])

  // Group by root folder
  const grouped = useMemo(() => {
    const groups = new Map<string, StyleInfo[]>()
    for (const s of filtered) {
      const parts = s.name.split('/')
      const groupKey = parts.length > 1 ? `${s.category}/${parts[0]}` : `${s.category}/Root`
      if (!groups.has(groupKey)) groups.set(groupKey, [])
      groups.get(groupKey)!.push(s)
    }
    const sorted = Array.from(groups.entries()).sort(([a], [b]) =>
      a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
    )
    return new Map(sorted)
  }, [filtered])

  // Selection
  const toggleSelect = (id: string, event?: React.MouseEvent) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (event?.shiftKey && lastClickedId) {
        const allIds = filtered.map(s => s.id)
        const start = allIds.indexOf(lastClickedId)
        const end = allIds.indexOf(id)
        if (start !== -1 && end !== -1) {
          const [from, to] = start < end ? [start, end] : [end, start]
          for (let i = from; i <= to; i++) next.add(allIds[i])
          return next
        }
      }
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
    setLastClickedId(id)
  }

  const selectAll = () => setSelectedIds(new Set(filtered.map(s => s.id)))
  const selectNone = () => setSelectedIds(new Set())

  const toggleGroup = (groupKey: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev)
      if (next.has(groupKey)) next.delete(groupKey)
      else next.add(groupKey)
      return next
    })
  }

  // Rename preview
  const renamePreview = useMemo(() => {
    if (!findText || selectedIds.size === 0) return []
    const selected = styles.filter(s => selectedIds.has(s.id))
    return selected
      .map(s => {
        const newName = s.name.replaceAll(findText, replaceText)
        return newName !== s.name ? { id: s.id, category: s.category, oldName: s.name, newName } : null
      })
      .filter(Boolean) as { id: string; category: string; oldName: string; newName: string }[]
  }, [findText, replaceText, selectedIds, styles])

  const handleRename = () => {
    if (renamePreview.length === 0) return
    postMessage({
      type: 'rename-styles',
      data: {
        renames: renamePreview.map(r => ({
          id: r.id,
          category: r.category as 'paint' | 'text' | 'effect' | 'grid',
          newName: r.newName,
        })),
      },
    })
  }

  const handleDelete = () => {
    // Group by category for the message
    const selected = styles.filter(s => selectedIds.has(s.id))
    const byCategory = new Map<string, string[]>()
    for (const s of selected) {
      if (!byCategory.has(s.category)) byCategory.set(s.category, [])
      byCategory.get(s.category)!.push(s.id)
    }
    // Send one delete per category
    for (const [category, ids] of byCategory) {
      postMessage({
        type: 'delete-styles',
        data: { styleIds: ids, category: category as 'paint' | 'text' | 'effect' | 'grid' },
      })
    }
    setPendingDelete(false)
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('asc') }
  }

  const handleScanRebind = () => {
    const ids = selectedIds.size > 0 ? Array.from(selectedIds) : styles.filter(s => s.category === 'paint' || s.category === 'effect').map(s => s.id)
    setRebindLoading(true)
    setShowRebind(true)
    setShowRename(false)
    postMessage({ type: 'scan-rebind', data: { styleIds: ids } })
  }

  const handleApplyRebind = () => {
    const activeSuggestions = rebindSuggestions.filter((_, i) => !rebindExcluded.has(i))
    if (activeSuggestions.length === 0) return
    postMessage({
      type: 'apply-rebind',
      data: {
        bindings: activeSuggestions.map(s => ({
          styleId: s.styleId,
          field: s.field,
          variableId: s.suggestedVariableId,
        })),
      },
    })
  }

  const toggleRebindExclude = (index: number) => {
    setRebindExcluded(prev => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  // Render a single paint layer
  const renderPaintLayer = (paint: PaintInfo, i: number) => {
    if (paint.paintType === 'SOLID') {
      const gradientBg = paint.color || '#000'
      return (
        <span key={i} className="styles-paint-layer">
          <span className="manage-color-swatch" style={{ backgroundColor: gradientBg, opacity: paint.opacity }} />
          <span className="styles-preview-text">
            {paint.colorVariable ? (
              <span className="styles-var-ref" data-tooltip={`Variable: ${paint.colorVariable}`}>
                <Link size={10} /> {paint.colorVariable.split('/').pop()}
              </span>
            ) : (
              paint.color || 'empty'
            )}
            {paint.opacity != null && paint.opacity < 1 && (
              <span className="styles-opacity">
                {paint.opacityVariable ? (
                  <span className="styles-var-ref" data-tooltip={`Opacity variable: ${paint.opacityVariable}`}>
                    <Link size={10} /> {paint.opacityVariable.split('/').pop()}
                  </span>
                ) : (
                  ` ${Math.round(paint.opacity * 100)}%`
                )}
              </span>
            )}
          </span>
        </span>
      )
    }

    if (paint.paintType.startsWith('GRADIENT_')) {
      const stops = paint.stops || []
      // Build CSS gradient for swatch
      const gradientColors = stops.map(s => s.color).join(', ')
      const gradientBg = `linear-gradient(90deg, ${gradientColors})`
      return (
        <span key={i} className="styles-paint-layer styles-gradient-layer">
          <span className="manage-color-swatch styles-gradient-swatch" style={{ background: gradientBg, opacity: paint.opacity }} />
          <span className="styles-gradient-stops">
            {stops.map((s, j) => (
              <span key={j} className="styles-gradient-stop">
                <span className="manage-color-swatch" style={{ backgroundColor: s.color }} />
                {s.variable ? (
                  <span className="styles-var-ref" data-tooltip={s.variable}>
                    <Link size={10} /> {s.variable.split('/').pop()}
                  </span>
                ) : (
                  <span className="styles-stop-color">{s.color}</span>
                )}
                <span className="styles-stop-pos">{Math.round(s.position * 100)}%</span>
              </span>
            ))}
            {paint.opacity != null && paint.opacity < 1 && (
              <span className="styles-gradient-opacity">
                {paint.opacityVariable ? (
                  <span className="styles-var-ref" data-tooltip={`Opacity: ${paint.opacityVariable}`}>
                    <Link size={10} /> {paint.opacityVariable.split('/').pop()}
                  </span>
                ) : (
                  <span className="styles-stop-pos">{Math.round(paint.opacity * 100)}% opacity</span>
                )}
              </span>
            )}
          </span>
        </span>
      )
    }

    if (paint.paintType === 'IMAGE') {
      return (
        <span key={i} className="styles-paint-layer">
          <span className="styles-preview-text">Image fill</span>
        </span>
      )
    }

    return <span key={i} className="styles-preview-text">{paint.paintType}</span>
  }

  // Render a single effect layer
  const renderEffectLayer = (effect: EffectInfo, i: number) => {
    const hasVars = effect.colorVariable || effect.radiusVariable || effect.spreadVariable
    return (
      <span key={i} className="styles-effect-layer">
        {effect.color && <span className="manage-color-swatch" style={{ backgroundColor: effect.color }} />}
        <span className="styles-preview-text">{effect.description}</span>
        {hasVars && (
          <span className="styles-var-refs">
            {effect.colorVariable && (
              <span className="styles-var-ref" data-tooltip={`Color: ${effect.colorVariable}`}>
                <Link size={10} /> {effect.colorVariable.split('/').pop()}
              </span>
            )}
            {effect.radiusVariable && (
              <span className="styles-var-ref" data-tooltip={`Radius: ${effect.radiusVariable}`}>
                <Link size={10} /> {effect.radiusVariable.split('/').pop()}
              </span>
            )}
          </span>
        )}
      </span>
    )
  }

  // Render preview
  const renderPreview = (s: StyleInfo) => {
    const p = s.preview
    if (p.type === 'paint') {
      return (
        <span className="styles-preview-colors">
          {p.paints.map((paint, i) => renderPaintLayer(paint, i))}
          {p.paints.length === 0 && <span className="styles-preview-text">empty</span>}
        </span>
      )
    }
    if (p.type === 'text') {
      return (
        <span className="styles-preview-text">
          {p.fontFamily} {p.fontStyle} {p.fontSize}/{p.lineHeight}
          {p.variables && Object.keys(p.variables).length > 0 && (
            <span className="styles-var-refs">
              {Object.entries(p.variables).map(([prop, varName]) => (
                <span key={prop} className="styles-var-ref" data-tooltip={`${prop}: ${varName}`}>
                  <Link size={10} /> {varName.split('/').pop()}
                </span>
              ))}
            </span>
          )}
        </span>
      )
    }
    if (p.type === 'effect') {
      return (
        <span className="styles-preview-effects">
          {p.effects.map((effect, i) => renderEffectLayer(effect, i))}
          {p.effects.length === 0 && <span className="styles-preview-text">none</span>}
        </span>
      )
    }
    if (p.type === 'grid') {
      return <span className="styles-preview-text">{p.patterns.join(', ') || 'none'}</span>
    }
    return null
  }

  if (loading) {
    return (
      <div className="manage-page">
        <SectionHeader variant="primary" title="Styles" description="Loading styles from Figma..." />
        <LoadingState message="Loading styles..." />
      </div>
    )
  }

  return (
    <div className="manage-page">
      <SectionHeader
        variant="primary"
        title="Styles"
        description={counts ? `${counts.total} styles — ${counts.paint} color, ${counts.text} text, ${counts.effect} effect, ${counts.grid} grid` : ''}
      />

      {/* Toolbar */}
      <div className="manage-toolbar">
        <div className="manage-toolbar-left">
          <div className="manage-search">
            <Search size={14} />
            <input
              type="text"
              placeholder="Search styles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="manage-filter-select"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value as CategoryFilter)}
          >
            <option value="all">All types</option>
            <option value="paint">Color ({counts?.paint ?? 0})</option>
            <option value="text">Text ({counts?.text ?? 0})</option>
            <option value="effect">Effect ({counts?.effect ?? 0})</option>
            <option value="grid">Grid ({counts?.grid ?? 0})</option>
          </select>
        </div>

        <div className="manage-toolbar-right">
          <Button variant="ghost" onClick={handleScanRebind} data-tooltip="Rebind unbound colors to variables">
            <Unlink size={14} />
          </Button>
          <Button variant="ghost" onClick={loadStyles} data-tooltip="Refresh">
            <RefreshCw size={14} />
          </Button>
        </div>
      </div>

      {/* Selection bar */}
      {selectedIds.size > 0 && (
        <div className="manage-selection-bar">
          <span>{selectedIds.size} selected</span>
          <div className="manage-selection-actions">
            <Button variant="ghost" onClick={() => setShowRename(!showRename)} title="Rename (find/replace)">
              <PenLine size={14} />
              Rename
            </Button>
            <Button variant="ghost" onClick={handleScanRebind} title="Rebind unbound colors to matching variables">
              <Unlink size={14} />
              Rebind
            </Button>
            <Button variant="ghost" onClick={() => setPendingDelete(true)} title="Delete">
              <Trash2 size={14} />
              Delete
            </Button>
            <Button variant="ghost" onClick={selectNone} data-tooltip="Clear selection (Esc)">
              <X size={14} />
            </Button>
          </div>
        </div>
      )}

      {/* Rename panel */}
      {showRename && selectedIds.size > 0 && (
        <div className="manage-action-panel">
          <div className="manage-action-panel-header">
            <span>Rename — find & replace in style names</span>
            <button type="button" className="manage-panel-close" onClick={() => setShowRename(false)} data-tooltip="Close panel"><X size={14} /></button>
          </div>
          <div className="manage-rename-inputs">
            <Input label="Find" value={findText} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFindText(e.target.value)} placeholder="Text to find..." />
            <Input label="Replace" value={replaceText} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReplaceText(e.target.value)} placeholder="Replace with..." />
          </div>

          {renamePreview.length > 0 && (
            <div className="manage-rename-preview">
              <div className="manage-rename-preview-header">
                {renamePreview.length} style{renamePreview.length !== 1 ? 's' : ''} will be renamed:
              </div>
              <div className="manage-rename-preview-list">
                {renamePreview.slice(0, 10).map(r => (
                  <div key={r.id} className="manage-rename-preview-item">
                    <span className="manage-rename-old">{r.oldName}</span>
                    <span className="manage-rename-arrow">→</span>
                    <span className="manage-rename-new">{r.newName}</span>
                  </div>
                ))}
                {renamePreview.length > 10 && (
                  <div className="manage-rename-preview-more">...and {renamePreview.length - 10} more</div>
                )}
              </div>
              <div className="manage-panel-actions">
                <Button variant="ghost" onClick={() => setShowRename(false)}>Cancel</Button>
                <Button variant="primary" onClick={handleRename}>
                  <Check size={14} />
                  Apply Rename
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Rebind panel */}
      {showRebind && (
        <div className="manage-action-panel">
          <div className="manage-action-panel-header">
            <span>Rebind — reconnect unbound colors to matching variables</span>
            <button type="button" className="manage-panel-close" onClick={() => { setShowRebind(false); setRebindSuggestions([]) }} data-tooltip="Close panel"><X size={14} /></button>
          </div>

          {rebindLoading ? (
            <div className="styles-rebind-loading">Scanning for unbound colors...</div>
          ) : rebindSuggestions.length > 0 ? (
            <div className="styles-rebind-list">
              <div className="styles-rebind-header">
                {rebindSuggestions.length - rebindExcluded.size} of {rebindSuggestions.length} suggestion{rebindSuggestions.length !== 1 ? 's' : ''} selected
              </div>
              <div className="styles-rebind-items">
                {rebindSuggestions.map((s, i) => (
                  <div key={`${s.styleId}-${s.field}-${i}`} className={`styles-rebind-item ${rebindExcluded.has(i) ? 'styles-rebind-excluded' : ''}`}>
                    <input type="checkbox" checked={!rebindExcluded.has(i)} onChange={() => toggleRebindExclude(i)} />
                    <span className="manage-color-swatch" style={{ backgroundColor: s.currentColor }} />
                    <span className="styles-rebind-style-name" title={s.styleName}>
                      {s.styleName.split('/').pop()}
                      <span className="styles-rebind-field">{s.field.startsWith('stop:') ? ` (gradient stop)` : s.field.startsWith('effect:') ? ` (effect)` : ''}</span>
                    </span>
                    <span className="manage-rename-arrow">→</span>
                    <span className="styles-var-ref">
                      <Link size={10} /> {s.suggestedVariableName}
                    </span>
                    <Badge variant={s.matchType === 'exact' ? 'success' : 'warning'}>{s.matchType}</Badge>
                  </div>
                ))}
              </div>
              <div className="manage-panel-actions">
                <Button variant="ghost" onClick={() => { setShowRebind(false); setRebindSuggestions([]) }}>Cancel</Button>
                <Button variant="primary" onClick={handleApplyRebind} disabled={rebindExcluded.size === rebindSuggestions.length}>
                  <Check size={14} />
                  Apply {rebindSuggestions.length - rebindExcluded.size} Rebinding{rebindSuggestions.length - rebindExcluded.size !== 1 ? 's' : ''}
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Style list */}
      {filtered.length === 0 ? (
        <EmptyState
          title="No styles found"
          description={styles.length === 0
            ? "This file has no local styles."
            : "No styles match your current filters."
          }
        />
      ) : (
        <div className="manage-list">
          <div className="manage-list-header">
            <div className="manage-col-check">
              <input
                type="checkbox"
                checked={selectedIds.size === filtered.length && filtered.length > 0}
                onChange={() => selectedIds.size === filtered.length ? selectNone() : selectAll()}
              />
            </div>
            <div className="manage-col-name manage-sortable" onClick={() => handleSort('name')}>
              Name {sortField === 'name' && (sortDir === 'asc' ? '↑' : '↓')}
            </div>
            <div className="manage-col-value">Preview</div>
            <div className="manage-col-type manage-sortable" onClick={() => handleSort('category')}>
              Type {sortField === 'category' && (sortDir === 'asc' ? '↑' : '↓')}
            </div>
          </div>

          {Array.from(grouped.entries()).map(([groupKey, groupStyles]) => {
            const isCollapsed = collapsedGroups.has(groupKey)
            const groupSelected = groupStyles.filter(s => selectedIds.has(s.id)).length
            const [cat, ...nameParts] = groupKey.split('/')
            const groupLabel = nameParts.join('/') || 'Root'
            return (
              <div key={groupKey} className="manage-group">
                <div className="manage-group-header" onClick={() => toggleGroup(groupKey)}>
                  {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                  {CATEGORY_ICONS[cat]}
                  <span className="manage-group-name">{groupLabel}</span>
                  <Badge>{groupStyles.length}</Badge>
                  {groupSelected > 0 && <Badge variant="info">{groupSelected} selected</Badge>}
                </div>
                {!isCollapsed && groupStyles.map(s => (
                  <div
                    key={s.id}
                    className={`manage-row ${selectedIds.has(s.id) ? 'manage-row-selected' : ''}`}
                    onClick={(e) => toggleSelect(s.id, e)}
                    onContextMenu={(e) => {
                      e.preventDefault()
                      setSelectedIds(new Set([s.id]))
                      setLastClickedId(s.id)
                    }}
                  >
                    <div className="manage-col-check">
                      <input type="checkbox" checked={selectedIds.has(s.id)} onChange={() => {}} />
                    </div>
                    <div className="manage-col-name">
                      <span className="manage-var-name" title={s.name}>
                        {s.name.split('/').pop()}
                      </span>
                    </div>
                    <div className="manage-col-value">{renderPreview(s)}</div>
                    <div className="manage-col-type">
                      <Badge>{CATEGORY_LABELS[s.category]}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      )}

      <ConfirmDialog
        isOpen={pendingDelete}
        onClose={() => setPendingDelete(false)}
        onConfirm={handleDelete}
        title="Delete Styles"
        message={`Are you sure you want to delete ${selectedIds.size} style${selectedIds.size !== 1 ? 's' : ''}? This cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  )
}
