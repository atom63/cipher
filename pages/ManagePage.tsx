import { useCallback, useEffect, useMemo, useState } from 'react'
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
import { Search, Trash2, PenLine, RefreshCw, Check, X, ChevronDown, ChevronRight } from 'lucide-react'

type SortField = 'name' | 'collection' | 'type'
type SortDir = 'asc' | 'desc'

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

  // Rename state
  const [renameMode, setRenameMode] = useState(false)
  const [findText, setFindText] = useState('')
  const [replaceText, setReplaceText] = useState('')
  const [useRegex, setUseRegex] = useState(false)

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
      setRenameMode(false)
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
    }
  })

  // Filter and sort
  const filtered = useMemo(() => {
    let result = variables

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
        v.collectionName.toLowerCase().includes(lower)
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

  // Group by collection
  const grouped = useMemo(() => {
    const groups = new Map<string, VariableInfo[]>()
    for (const v of filtered) {
      const key = v.collectionName
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(v)
    }
    return groups
  }, [filtered])

  const uniqueTypes = useMemo(() => {
    const types = new Set(variables.map(v => v.resolvedType))
    return Array.from(types).sort()
  }, [variables])

  // Selection helpers
  const toggleSelect = (id: string, event?: React.MouseEvent) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (event?.shiftKey && lastClickedId) {
        // Range select
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
  const [lastClickedId, setLastClickedId] = useState<string | null>(null)

  const selectAll = () => {
    setSelectedIds(new Set(filtered.map(v => v.id)))
  }

  const selectNone = () => {
    setSelectedIds(new Set())
  }

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

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

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

    // Multi-mode: show each mode as a labeled chip with swatch
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

  // For the name column, show side-by-side swatches as a quick visual
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

  if (loading) {
    return (
      <div className="manage-page">
        <SectionHeader variant="primary" title="Manage Variables" description="Loading variables from Figma..." />
        <LoadingState message="Loading variables..." />
      </div>
    )
  }

  return (
    <div className="manage-page">
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
          <Button variant="ghost" onClick={loadVariables} title="Refresh">
            <RefreshCw size={14} />
          </Button>
        </div>
      </div>

      {/* Selection bar */}
      {selectedIds.size > 0 && (
        <div className="manage-selection-bar">
          <span>{selectedIds.size} selected</span>
          <div className="manage-selection-actions">
            <Button variant="ghost" onClick={() => setRenameMode(!renameMode)}>
              <PenLine size={14} />
              Rename
            </Button>
            <Button variant="ghost" onClick={() => setPendingDelete(true)}>
              <Trash2 size={14} />
              Delete
            </Button>
            <Button variant="ghost" onClick={selectNone}>
              <X size={14} />
              Clear
            </Button>
          </div>
        </div>
      )}

      {/* Rename panel */}
      {renameMode && selectedIds.size > 0 && (
        <div className="manage-rename-panel">
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
              <div className="manage-rename-actions">
                <Button variant="ghost" onClick={() => setRenameMode(false)}>Cancel</Button>
                <Button variant="primary" onClick={handleRename}>
                  <Check size={14} />
                  Apply Rename
                </Button>
              </div>
            </div>
          )}
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
