import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Button,
  SectionHeader,
  Input,
  Badge,
  EmptyState,
  ConfirmDialog,
  useToast,
  LoadingState,
} from '../components/ui'
import { useFigmaMessage, usePostMessage } from '../hooks/useFigmaMessage'
import type { VariableInfo, CollectionInfo, DeletedVariableSnapshot } from '../types/messages'
import { Search, Trash2, PenLine, RefreshCw, Check, X, ChevronDown, ChevronRight, FolderInput, Copy, Pencil, Link } from 'lucide-react'

type SortField = 'name' | 'collection' | 'type'
type SortDir = 'asc' | 'desc'
type ActionPanel = 'rename' | 'move' | 'edit' | null

/** Per-variable, per-mode edit values. Key = variableId, value = { modeName: editedValue } */
type EditValuesMap = Record<string, Record<string, string>>

export function ManagePage() {
  const [variables, setVariables] = useState<VariableInfo[]>([])
  const [collections, setCollections] = useState<CollectionInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [filterCollection, setFilterCollection] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())
  const [lastClickedId, setLastClickedId] = useState<string | null>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Action panels
  const [activePanel, setActivePanel] = useState<ActionPanel>(null)

  // Rename state
  const [findText, setFindText] = useState('')
  const [replaceText, setReplaceText] = useState('')
  const [useRegex, setUseRegex] = useState(false)

  // Move state
  const [moveTargetId, setMoveTargetId] = useState<string>('')

  // Edit values state: { [variableId]: { [modeName]: value } }
  const [editValues, setEditValues] = useState<EditValuesMap>({})
  // Track which field is in alias-pick mode: "varId:modeName"
  const [aliasPickField, setAliasPickField] = useState<string | null>(null)
  const [aliasSearch, setAliasSearch] = useState('')

  // Delete confirmation
  const [pendingDelete, setPendingDelete] = useState(false)

  const postMessage = usePostMessage()
  const { showSuccess, showError } = useToast()

  const loadVariables = useCallback(() => {
    setLoading(true)
    postMessage({ type: 'get-variables' })
  }, [postMessage])

  useEffect(() => {
    loadVariables()
  }, [loadVariables])

  useFigmaMessage((msg) => {
    if (msg.type === 'variables-list') {
      setVariables(msg.data.variables)
      setCollections(msg.data.collections)
      setLoading(false)
    } else if (msg.type === 'variables-renamed') {
      const { success, failed, previousNames } = msg.data
      if (failed > 0) {
        showError(`${failed} rename(s) failed`)
      } else {
        showSuccess(
          `Renamed ${success} variable${success !== 1 ? 's' : ''}`,
          previousNames.length > 0
            ? {
                label: 'Undo',
                onClick: () => {
                  postMessage({
                    type: 'rename-variables',
                    data: { renames: previousNames.map(p => ({ id: p.id, newName: p.oldName })) },
                  })
                },
              }
            : undefined
        )
      }
      setActivePanel(null)
      setFindText('')
      setReplaceText('')
      loadVariables()
    } else if (msg.type === 'variables-deleted') {
      const { success, failed, snapshots } = msg.data as { success: number; failed: number; snapshots: DeletedVariableSnapshot[] }
      if (failed > 0) {
        showError(`${failed} deletion(s) failed`)
      } else {
        showSuccess(
          `Deleted ${success} variable${success !== 1 ? 's' : ''}`,
          snapshots.length > 0
            ? {
                label: 'Undo',
                onClick: () => {
                  postMessage({ type: 'restore-variables', data: { snapshots } })
                },
              }
            : undefined
        )
      }
      setSelectedIds(new Set())
      loadVariables()
    } else if (msg.type === 'variables-restored') {
      if (msg.data.failed > 0) {
        showError(`${msg.data.failed} restore(s) failed`)
      } else {
        showSuccess(`Restored ${msg.data.success} variable${msg.data.success !== 1 ? 's' : ''}`)
      }
      loadVariables()
    } else if (msg.type === 'variables-moved') {
      const { success, failed, previousCollections } = msg.data
      if (failed > 0) {
        showError(`${failed} move(s) failed`)
      } else {
        showSuccess(
          `Moved ${success} variable${success !== 1 ? 's' : ''}`,
          // Undo: move them back (requires re-fetch since IDs changed after recreate)
        )
      }
      setActivePanel(null)
      setSelectedIds(new Set())
      loadVariables()
    } else if (msg.type === 'variable-values-updated') {
      const { success, failed, previousValues } = msg.data
      if (failed > 0) {
        showError(`${failed} update(s) failed`)
      } else {
        showSuccess(
          `Updated ${success} variable${success !== 1 ? 's' : ''}`,
          previousValues.length > 0
            ? {
                label: 'Undo',
                onClick: () => {
                  postMessage({
                    type: 'update-variable-values',
                    data: { updates: previousValues },
                  })
                },
              }
            : undefined
        )
      }
      setActivePanel(null)
      setEditValues({})
      setAliasPickField(null)
      setAliasSearch('')
      loadVariables()
    } else if (msg.type === 'variables-duplicated') {
      const { success, failed, newVariableIds } = msg.data
      if (failed > 0) {
        showError(`${failed} duplication(s) failed`)
      } else {
        showSuccess(
          `Duplicated ${success} variable${success !== 1 ? 's' : ''}`,
          newVariableIds.length > 0
            ? {
                label: 'Undo',
                onClick: () => {
                  postMessage({ type: 'delete-variables', data: { variableIds: newVariableIds } })
                },
              }
            : undefined
        )
      }
      loadVariables()
    }
  })

  // Filter and sort
  const filtered = useMemo(() => {
    let result = [...variables]

    if (filterCollection !== 'all') {
      result = result.filter(v => v.collectionId === filterCollection)
    }
    if (filterType !== 'all') {
      result = result.filter(v => v.resolvedType === filterType)
    }
    if (search) {
      const lower = search.toLowerCase()
      result = result.filter(v =>
        v.name.toLowerCase().includes(lower) ||
        v.collectionName.toLowerCase().includes(lower) ||
        Object.values(v.valuesByMode).some(val => val.toLowerCase().includes(lower))
      )
    }

    result.sort((a, b) => {
      let cmp = 0
      if (sortField === 'name') cmp = a.name.localeCompare(b.name)
      else if (sortField === 'collection') cmp = a.collectionName.localeCompare(b.collectionName)
      else if (sortField === 'type') cmp = a.resolvedType.localeCompare(b.resolvedType)
      return sortDir === 'asc' ? cmp : -cmp
    })

    return result
  }, [variables, filterCollection, filterType, search, sortField, sortDir])

  // Group by collection, preserving sort order within groups
  const grouped = useMemo(() => {
    const groups = new Map<string, VariableInfo[]>()
    for (const v of filtered) {
      const key = v.collectionName
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(v)
    }
    // Sort groups by collection name
    const sortedEntries = Array.from(groups.entries()).sort(([a], [b]) => {
      const cmp = a.localeCompare(b)
      return sortField === 'collection' ? (sortDir === 'asc' ? cmp : -cmp) : cmp
    })
    return new Map(sortedEntries)
  }, [filtered, sortField, sortDir])

  const uniqueTypes = useMemo(() => {
    const types = new Set(variables.map(v => v.resolvedType))
    return Array.from(types).sort()
  }, [variables])

  // Selection helpers
  const toggleSelect = (id: string, event?: React.MouseEvent) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (event?.shiftKey && lastClickedId) {
        const allIds = filtered.map(v => v.id)
        const start = allIds.indexOf(lastClickedId)
        const end = allIds.indexOf(id)
        if (start !== -1 && end !== -1) {
          const [from, to] = start < end ? [start, end] : [end, start]
          for (let i = from; i <= to; i++) {
            next.add(allIds[i])
          }
          return next
        }
      }
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
    setLastClickedId(id)
  }

  const selectAll = () => setSelectedIds(new Set(filtered.map(v => v.id)))
  const selectNone = () => setSelectedIds(new Set())

  const toggleGroup = (collectionName: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev)
      if (next.has(collectionName)) next.delete(collectionName)
      else next.add(collectionName)
      return next
    })
  }

  // Rename preview
  const renamePreview = useMemo(() => {
    if (!findText || selectedIds.size === 0) return []
    const selected = variables.filter(v => selectedIds.has(v.id))
    try {
      const pattern = useRegex ? new RegExp(findText, 'g') : null
      return selected
        .map(v => {
          const newName = pattern
            ? v.name.replace(pattern, replaceText)
            : v.name.replaceAll(findText, replaceText)
          return newName !== v.name ? { id: v.id, oldName: v.name, newName } : null
        })
        .filter(Boolean) as { id: string; oldName: string; newName: string }[]
    } catch {
      return []
    }
  }, [findText, replaceText, useRegex, selectedIds, variables])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') return

      if (e.key === 'Escape') {
        if (activePanel) {
          setActivePanel(null)
        } else if (selectedIds.size > 0) {
          setSelectedIds(new Set())
        }
        return
      }

      if ((e.metaKey || e.ctrlKey) && e.key === 'a') {
        e.preventDefault()
        setSelectedIds(new Set(filtered.map(v => v.id)))
        return
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedIds.size > 0 && !activePanel) {
          e.preventDefault()
          setPendingDelete(true)
        }
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedIds, filtered, activePanel])

  // Actions
  const handleRename = () => {
    if (renamePreview.length === 0) return
    postMessage({
      type: 'rename-variables',
      data: { renames: renamePreview.map(r => ({ id: r.id, newName: r.newName })) },
    })
  }

  const handleDelete = () => {
    postMessage({
      type: 'delete-variables',
      data: { variableIds: Array.from(selectedIds) },
    })
    setPendingDelete(false)
  }

  const handleMove = () => {
    if (!moveTargetId) return
    postMessage({
      type: 'move-variables',
      data: { variableIds: Array.from(selectedIds), targetCollectionId: moveTargetId },
    })
  }

  const handleDuplicate = () => {
    postMessage({
      type: 'duplicate-variables',
      data: { variableIds: Array.from(selectedIds) },
    })
  }

  // Selected variables for editing
  const editSelectedVars = useMemo(() => {
    if (activePanel !== 'edit') return []
    return variables.filter(v => selectedIds.has(v.id))
  }, [activePanel, selectedIds, variables])

  // All mode names across selected variables (for column headers)
  const editModeNames = useMemo(() => {
    const modes = new Set<string>()
    for (const v of editSelectedVars) {
      for (const mode of Object.keys(v.valuesByMode)) {
        modes.add(mode)
      }
    }
    return Array.from(modes)
  }, [editSelectedVars])

  // Initialize edit values when edit panel opens — snapshot current values
  useEffect(() => {
    if (activePanel === 'edit' && editSelectedVars.length > 0) {
      const initial: EditValuesMap = {}
      for (const v of editSelectedVars) {
        initial[v.id] = { ...v.valuesByMode }
      }
      setEditValues(initial)
      setAliasPickField(null)
      setAliasSearch('')
    }
  }, [activePanel]) // Only run when panel opens, not on every var change

  // Alias options for a specific variable (same type, not self)
  const getAliasOptions = useCallback((varId: string, type: string) => {
    return variables
      .filter(v => v.resolvedType === type && v.id !== varId)
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [variables])

  // Filtered alias options by search
  const filteredAliasOptions = useMemo(() => {
    if (!aliasPickField) return []
    const [varId] = aliasPickField.split('|||')
    const v = variables.find(x => x.id === varId)
    if (!v) return []
    const options = getAliasOptions(varId, v.resolvedType)
    if (!aliasSearch) return options.slice(0, 50)
    const lower = aliasSearch.toLowerCase()
    return options
      .filter(o => o.name.toLowerCase().includes(lower) || o.collectionName.toLowerCase().includes(lower))
      .slice(0, 50)
  }, [aliasPickField, aliasSearch, getAliasOptions, variables])

  // Helper to update a single field in editValues
  const setEditField = (varId: string, modeName: string, value: string) => {
    setEditValues(prev => ({
      ...prev,
      [varId]: { ...prev[varId], [modeName]: value },
    }))
  }

  // Check if any values actually changed
  const editHasChanges = useMemo(() => {
    for (const v of editSelectedVars) {
      const edited = editValues[v.id]
      if (!edited) continue
      for (const [mode, original] of Object.entries(v.valuesByMode)) {
        if (edited[mode] !== original) return true
      }
    }
    return false
  }, [editSelectedVars, editValues])

  const handleEditValues = () => {
    // Collect only variables that actually changed
    const updates = editSelectedVars
      .filter(v => {
        const edited = editValues[v.id]
        if (!edited) return false
        return Object.entries(v.valuesByMode).some(([mode, original]) => edited[mode] !== original)
      })
      .map(v => ({
        id: v.id,
        valuesByMode: editValues[v.id],
      }))

    if (updates.length === 0) return
    postMessage({
      type: 'update-variable-values',
      data: { updates },
    })
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const openPanel = (panel: ActionPanel) => {
    setActivePanel(prev => prev === panel ? null : panel)
  }

  // Value rendering
  const isColorValue = (val: string) =>
    val.startsWith('#') || val.startsWith('rgb') || val.startsWith('hsl') || val.startsWith('oklch')

  const isReference = (val: string) => val.startsWith('{')

  const renderValue = (v: VariableInfo) => {
    const entries = Object.entries(v.valuesByMode)
    const isColor = v.resolvedType === 'COLOR'

    if (entries.length === 1) {
      const [, val] = entries[0]
      return (
        <span className="manage-value">
          {isColor && isColorValue(val) && (
            <span className="manage-color-swatch" style={{ backgroundColor: val }} />
          )}
          <span className={isReference(val) ? 'manage-ref-value' : ''}>{val}</span>
        </span>
      )
    }

    return (
      <div className="manage-value-modes">
        {entries.map(([mode, val]) => (
          <div key={mode} className="manage-mode-chip" title={`${mode}: ${val}`}>
            <span className="manage-mode-label">{mode}</span>
            {isColor && isColorValue(val) && (
              <span className="manage-color-swatch" style={{ backgroundColor: val }} />
            )}
            <span className={`manage-mode-val ${isReference(val) ? 'manage-ref-value' : ''}`}>
              {val}
            </span>
          </div>
        ))}
      </div>
    )
  }

  const renderNameSwatches = (v: VariableInfo) => {
    if (v.resolvedType !== 'COLOR') return null
    const entries = Object.entries(v.valuesByMode)
    const colorEntries = entries.filter(([, val]) => isColorValue(val))
    if (colorEntries.length === 0) return null

    return (
      <span className="manage-name-swatches">
        {colorEntries.map(([mode, val]) => (
          <span
            key={mode}
            className="manage-color-swatch"
            style={{ backgroundColor: val }}
            title={`${mode}: ${val}`}
          />
        ))}
      </span>
    )
  }

  // Move target options (exclude collections that all selected vars are already in)
  const moveTargetCollections = useMemo(() => {
    const selectedVars = variables.filter(v => selectedIds.has(v.id))
    const sourceCollectionIds = new Set(selectedVars.map(v => v.collectionId))
    // Show all collections, but mark the ones that are already sources
    return collections.map(c => ({
      ...c,
      isCurrent: sourceCollectionIds.size === 1 && sourceCollectionIds.has(c.id),
    }))
  }, [collections, selectedIds, variables])

  if (loading) {
    return (
      <div className="manage-page">
        <SectionHeader variant="primary" title="Manage Variables" description="Loading variables from Figma..." />
        <LoadingState message="Loading variables..." />
      </div>
    )
  }

  return (
    <div className="manage-page" ref={listRef}>
      <SectionHeader
        variant="primary"
        title="Manage Variables"
        description={`${variables.length} variables across ${collections.length} collection${collections.length !== 1 ? 's' : ''}`}
      />

      {/* Toolbar */}
      <div className="manage-toolbar">
        <div className="manage-toolbar-left">
          <div className="manage-search">
            <Search size={14} />
            <input
              type="text"
              placeholder="Search variables..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="manage-filter-select"
            value={filterCollection}
            onChange={(e) => setFilterCollection(e.target.value)}
          >
            <option value="all">All collections</option>
            {collections.map(c => (
              <option key={c.id} value={c.id}>{c.name} ({c.variableCount})</option>
            ))}
          </select>

          <select
            className="manage-filter-select"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">All types</option>
            {uniqueTypes.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div className="manage-toolbar-right">
          <Button variant="ghost" onClick={loadVariables} data-tooltip="Refresh">
            <RefreshCw size={14} />
          </Button>
        </div>
      </div>

      {/* Selection bar */}
      {selectedIds.size > 0 && (
        <div className="manage-selection-bar">
          <span>{selectedIds.size} selected</span>
          <div className="manage-selection-actions">
            <Button variant="ghost" onClick={() => openPanel('rename')} title="Rename (find/replace)">
              <PenLine size={14} />
              Rename
            </Button>
            <Button variant="ghost" onClick={() => openPanel('move')} title="Move to collection">
              <FolderInput size={14} />
              Move
            </Button>
            <Button variant="ghost" onClick={() => openPanel('edit')} title="Edit values">
              <Pencil size={14} />
              Edit
            </Button>
            <Button variant="ghost" onClick={handleDuplicate} title="Duplicate selected">
              <Copy size={14} />
              Duplicate
            </Button>
            <Button variant="ghost" onClick={() => setPendingDelete(true)} title="Delete (Del)">
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
      {activePanel === 'rename' && selectedIds.size > 0 && (
        <div className="manage-action-panel">
          <div className="manage-action-panel-header">
            <span>Rename — find & replace in variable names</span>
            <button type="button" className="manage-panel-close" onClick={() => setActivePanel(null)} data-tooltip="Close panel"><X size={14} /></button>
          </div>
          <div className="manage-rename-inputs">
            <Input
              label="Find"
              value={findText}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFindText(e.target.value)}
              placeholder="Text to find..."
            />
            <Input
              label="Replace"
              value={replaceText}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReplaceText(e.target.value)}
              placeholder="Replace with..."
            />
            <label
              className="manage-regex-toggle"
              title="Use regular expressions for advanced pattern matching (e.g. color/(\w+) → colour/$1)"
            >
              <input
                type="checkbox"
                checked={useRegex}
                onChange={(e) => setUseRegex(e.target.checked)}
              />
              Regex
              <span className="manage-regex-hint">.*</span>
            </label>
          </div>

          <div className="manage-rename-hint">
            {useRegex
              ? 'Using regex patterns. Use capture groups like (\\w+) and reference them with $1, $2 in replace.'
              : 'Replaces all exact matches of the find text in each variable name.'
            }
          </div>

          {renamePreview.length > 0 && (
            <div className="manage-rename-preview">
              <div className="manage-rename-preview-header">
                {renamePreview.length} variable{renamePreview.length !== 1 ? 's' : ''} will be renamed:
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
                  <div className="manage-rename-preview-more">
                    ...and {renamePreview.length - 10} more
                  </div>
                )}
              </div>
              <div className="manage-panel-actions">
                <Button variant="ghost" onClick={() => setActivePanel(null)}>Cancel</Button>
                <Button variant="primary" onClick={handleRename}>
                  <Check size={14} />
                  Apply Rename
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Move panel */}
      {activePanel === 'move' && selectedIds.size > 0 && (
        <div className="manage-action-panel">
          <div className="manage-action-panel-header">
            <span>Move {selectedIds.size} variable{selectedIds.size !== 1 ? 's' : ''} to collection</span>
            <button type="button" className="manage-panel-close" onClick={() => setActivePanel(null)} data-tooltip="Close panel"><X size={14} /></button>
          </div>
          <div className="manage-move-options">
            {moveTargetCollections.map(c => (
              <label key={c.id} className={`manage-move-option ${c.isCurrent ? 'manage-move-current' : ''}`}>
                <input
                  type="radio"
                  name="moveTarget"
                  value={c.id}
                  checked={moveTargetId === c.id}
                  onChange={() => setMoveTargetId(c.id)}
                  disabled={c.isCurrent}
                />
                <span>{c.name}</span>
                <span className="manage-move-count">{c.variableCount} vars</span>
                {c.isCurrent && <Badge>current</Badge>}
              </label>
            ))}
          </div>
          <div className="manage-panel-actions">
            <Button variant="ghost" onClick={() => setActivePanel(null)}>Cancel</Button>
            <Button variant="primary" onClick={handleMove} disabled={!moveTargetId}>
              <FolderInput size={14} />
              Move
            </Button>
          </div>
        </div>
      )}

      {/* Edit values panel — inline editable list */}
      {activePanel === 'edit' && editSelectedVars.length > 0 && (
        <div className="manage-action-panel manage-edit-panel">
          <div className="manage-action-panel-header">
            <span>Edit {editSelectedVars.length} variable{editSelectedVars.length !== 1 ? 's' : ''}</span>
            <button type="button" className="manage-panel-close" onClick={() => setActivePanel(null)} data-tooltip="Close panel"><X size={14} /></button>
          </div>

          <div className="manage-edit-table">
            {/* Column headers */}
            <div className="manage-edit-table-header">
              <div className="manage-edit-col-name">Variable</div>
              {editModeNames.map(mode => (
                <div key={mode} className="manage-edit-col-value">
                  {editModeNames.length > 1 ? mode : 'Value'}
                </div>
              ))}
            </div>

            {/* Editable rows */}
            <div className="manage-edit-table-body">
              {editSelectedVars.map(v => (
                <div key={v.id} className="manage-edit-row">
                  <div className="manage-edit-col-name" title={v.name}>
                    {v.resolvedType === 'COLOR' && (
                      <span className="manage-name-swatches">
                        {editModeNames.map(mode => {
                          const val = editValues[v.id]?.[mode] || ''
                          return isColorValue(val) ? (
                            <span key={mode} className="manage-color-swatch" style={{ backgroundColor: val }} />
                          ) : null
                        })}
                      </span>
                    )}
                    <span className="manage-edit-var-name">{v.name}</span>
                    <Badge>{v.resolvedType}</Badge>
                  </div>
                  {editModeNames.map(mode => {
                    const fieldKey = `${v.id}|||${mode}`
                    const val = editValues[v.id]?.[mode] ?? ''
                    const isAlias = isReference(val)
                    const isPickingAlias = aliasPickField === fieldKey

                    return (
                      <div key={mode} className="manage-edit-col-value">
                        {isPickingAlias ? (
                          /* Alias picker inline */
                          <div className="manage-edit-alias-field">
                            <div className="manage-edit-alias-search">
                              <input
                                type="text"
                                placeholder="Search variables..."
                                value={aliasSearch}
                                onChange={(e) => setAliasSearch(e.target.value)}
                                className="manage-edit-alias-input"
                                autoFocus
                              />
                              <div className="manage-edit-alias-list">
                                {filteredAliasOptions.map(opt => (
                                  <button
                                    key={opt.id}
                                    type="button"
                                    className={`manage-edit-alias-option ${val === `{${opt.name}}` ? 'active' : ''}`}
                                    onClick={() => {
                                      setEditField(v.id, mode, `{${opt.name}}`)
                                      setAliasPickField(null)
                                      setAliasSearch('')
                                    }}
                                  >
                                    {opt.resolvedType === 'COLOR' && (
                                      <span className="manage-color-swatch" style={{ backgroundColor: Object.values(opt.valuesByMode)[0] || '' }} />
                                    )}
                                    <span className="manage-edit-alias-name">{opt.name}</span>
                                    <span className="manage-edit-alias-collection">{opt.collectionName}</span>
                                  </button>
                                ))}
                                {filteredAliasOptions.length === 0 && (
                                  <div className="manage-edit-alias-empty">No matching variables</div>
                                )}
                              </div>
                            </div>
                            <button
                              type="button"
                              className="manage-edit-unlink"
                              onClick={() => { setAliasPickField(null); setAliasSearch('') }}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : isAlias ? (
                          /* Show alias reference with change/unlink options */
                          <div className="manage-edit-alias-display">
                            <span className="manage-ref-value" title={val}>{val}</span>
                            <button
                              type="button"
                              className="manage-edit-link-btn"
                              data-tooltip="Change linked variable"
                              onClick={() => { setAliasPickField(fieldKey); setAliasSearch('') }}
                            >
                              <Link size={12} />
                            </button>
                            <button
                              type="button"
                              className="manage-edit-unlink"
                              data-tooltip="Unlink"
                              onClick={() => setEditField(v.id, mode, '')}
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ) : (
                          /* Raw value input */
                          <div className="manage-edit-input-row">
                            {v.resolvedType === 'COLOR' && isColorValue(val) && (
                              <input
                                type="color"
                                className="manage-edit-color-picker"
                                value={val.startsWith('#') ? val.slice(0, 7) : '#000000'}
                                onChange={(e) => setEditField(v.id, mode, e.target.value)}
                              />
                            )}
                            {v.resolvedType === 'BOOLEAN' ? (
                              <select
                                className="manage-filter-select"
                                value={val || 'false'}
                                onChange={(e) => setEditField(v.id, mode, e.target.value)}
                              >
                                <option value="true">true</option>
                                <option value="false">false</option>
                              </select>
                            ) : (
                              <input
                                type={v.resolvedType === 'FLOAT' ? 'number' : 'text'}
                                className="manage-edit-input"
                                value={val}
                                onChange={(e) => setEditField(v.id, mode, e.target.value)}
                                placeholder={v.resolvedType === 'COLOR' ? '#000000' : `${v.resolvedType}...`}
                              />
                            )}
                            {v.resolvedType !== 'BOOLEAN' && (
                              <button
                                type="button"
                                className="manage-edit-link-btn"
                                data-tooltip="Link to variable"
                                onClick={() => { setAliasPickField(fieldKey); setAliasSearch('') }}
                              >
                                <Link size={12} />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>

          <div className="manage-panel-actions">
            <Button variant="ghost" onClick={() => setActivePanel(null)}>Cancel</Button>
            <Button variant="primary" onClick={handleEditValues} disabled={!editHasChanges}>
              <Check size={14} />
              Save {editSelectedVars.length > 1 ? `(${editSelectedVars.length})` : ''}
            </Button>
          </div>
        </div>
      )}

      {/* Variable list */}
      {filtered.length === 0 ? (
        <EmptyState
          title="No variables found"
          description={variables.length === 0
            ? "This file has no local variables. Import some tokens or create variables in Figma."
            : "No variables match your current filters."
          }
        />
      ) : (
        <div className="manage-list">
          {/* Header */}
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
            <div className="manage-col-value">Value</div>
            <div className="manage-col-type manage-sortable" onClick={() => handleSort('type')}>
              Type {sortField === 'type' && (sortDir === 'asc' ? '↑' : '↓')}
            </div>
          </div>

          {/* Grouped rows */}
          {Array.from(grouped.entries()).map(([collectionName, vars]) => {
            const isCollapsed = collapsedGroups.has(collectionName)
            const groupSelected = vars.filter(v => selectedIds.has(v.id)).length
            return (
              <div key={collectionName} className="manage-group">
                <div
                  className="manage-group-header"
                  onClick={() => toggleGroup(collectionName)}
                >
                  {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                  <span className="manage-group-name">{collectionName}</span>
                  <Badge>{vars.length}</Badge>
                  {groupSelected > 0 && (
                    <Badge variant="info">{groupSelected} selected</Badge>
                  )}
                </div>
                {!isCollapsed && vars.map(v => (
                  <div
                    key={v.id}
                    className={`manage-row ${selectedIds.has(v.id) ? 'manage-row-selected' : ''}`}
                    onClick={(e) => toggleSelect(v.id, e)}
                    onContextMenu={(e) => {
                      e.preventDefault()
                      setSelectedIds(new Set([v.id]))
                      setLastClickedId(v.id)
                    }}
                  >
                    <div className="manage-col-check">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(v.id)}
                        onChange={() => {}}
                      />
                    </div>
                    <div className="manage-col-name">
                      {renderNameSwatches(v)}
                      <span className="manage-var-name" title={v.name}>{v.name}</span>
                    </div>
                    <div className="manage-col-value">{renderValue(v)}</div>
                    <div className="manage-col-type">
                      <Badge>{v.resolvedType}</Badge>
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
        title="Delete Variables"
        message={`Are you sure you want to delete ${selectedIds.size} variable${selectedIds.size !== 1 ? 's' : ''}? This cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  )
}
