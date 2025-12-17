import { useMemo, useState } from 'react'
import type { DesignToken } from '../../types/tokens'
import { Input, RadioGroup, Button, Dialog, DialogActions } from '../ui'
import styles from './BatchRenameDialog.module.css'

interface BatchRenameDialogProps {
  tokens: DesignToken[]
  onApply: (find: string, replace: string, scope: 'all' | 'name' | 'path') => void
  onClose: () => void
}

export function BatchRenameDialog({ tokens, onApply, onClose }: BatchRenameDialogProps) {
  const [find, setFind] = useState('')
  const [replace, setReplace] = useState('')
  const [scope, setScope] = useState<'all' | 'name' | 'path'>('all')

  const handleApply = () => {
    if (find.trim()) {
      onApply(find, replace, scope)
      onClose()
    }
  }

  // Calculate preview of changes
  const preview = useMemo(() => {
    if (!find.trim()) {
      return []
    }

    const regex = new RegExp(find, 'gi')
    const changes: Array<{
      token: DesignToken
      before: string
      after: string
      changed: boolean
    }> = []

    for (const token of tokens) {
      let before = ''
      let after = ''

      if (scope === 'all' || scope === 'name') {
        before = token.name
        after = token.name.replace(regex, replace)
      }

      if (scope === 'all' || scope === 'path') {
        if (scope === 'all' && before) {
          before += ` → ${token.figmaName}`
          after += ` → ${token.figmaName.replace(regex, replace)}`
        } else {
          before = token.figmaName
          after = token.figmaName.replace(regex, replace)
        }
      }

      const changed = before !== after
      if (changed || changes.length < 20) {
        // Show changed items first, then up to 20 total
        changes.push({ token, before, after, changed })
      }
    }

    // Sort: changed items first
    return changes.sort((a, b) => {
      if (a.changed && !b.changed) {
        return -1
      }
      if (!a.changed && b.changed) {
        return 1
      }
      return 0
    })
  }, [tokens, find, replace, scope])

  const affectedCount = useMemo(() => {
    return preview.filter(p => p.changed).length
  }, [preview])

  // Group tokens by category for reference
  const tokensByCategory = useMemo(() => {
    const groups: Record<string, DesignToken[]> = {}
    for (const token of tokens) {
      if (!groups[token.category]) {
        groups[token.category] = []
      }
      groups[token.category].push(token)
    }
    return groups
  }, [tokens])

  return (
    <Dialog
      isOpen={true}
      onClose={onClose}
      title="Batch Rename"
      maxWidth="xl"
      footer={
        <DialogActions>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleApply} disabled={!find.trim()}>
            Apply Changes {affectedCount > 0 && `(${affectedCount})`}
          </Button>
        </DialogActions>
      }
    >
      <div className={styles.dialogLayout}>
            {/* Left side: Form */}
            <div className={styles.dialogForm}>
              <Input
                label="Find:"
                id="find"
                autoFocus
                value={find}
                onChange={e => setFind(e.target.value)}
                placeholder="e.g., gray"
                type="text"
              />

              <Input
                label="Replace with:"
                id="replace"
                value={replace}
                onChange={e => setReplace(e.target.value)}
                placeholder="e.g., neutral"
                type="text"
              />

              <RadioGroup
                label="Scope:"
                name="scope"
                variant="inline"
                value={scope}
                onChange={(value) => setScope(value as typeof scope)}
                options={[
                  { value: 'all', label: 'All (original + Figma name)' },
                  { value: 'name', label: 'Original name only' },
                  { value: 'path', label: 'Figma path only' },
                ]}
              />

              {affectedCount > 0 && (
                <div className={styles.affectedCount}>
                  ✨ Will affect <strong>{affectedCount}</strong> token
                  {affectedCount !== 1 ? 's' : ''}
                </div>
              )}
            </div>

            {/* Right side: Token reference & preview */}
            <div className={styles.dialogReference}>
              {!find ? (
                <div className={styles.referenceSection}>
                  <h4>Your Tokens</h4>
                  <div className={styles.tokenCategories}>
                    {Object.entries(tokensByCategory).map(([category, categoryTokens]) => (
                      <details key={category} open={category === 'colors'}>
                        <summary>
                          {category} ({categoryTokens.length})
                        </summary>
                        <ul className={styles.tokenReferenceList}>
                          {categoryTokens.slice(0, 10).map(token => (
                            <li className={styles.tokenReferenceItem} key={token.id}>
                              <span className={styles.refName}>{token.name}</span>
                              <span className={styles.refArrow}>→</span>
                              <span className={styles.refPath}>{token.figmaName}</span>
                            </li>
                          ))}
                          {categoryTokens.length > 10 && (
                            <li className={styles.tokenMore}>+{categoryTokens.length - 10} more...</li>
                          )}
                        </ul>
                      </details>
                    ))}
                  </div>
                </div>
              ) : (
                <div className={styles.previewSection}>
                  <h4>Preview Changes</h4>
                  {preview.length === 0 ? (
                    <p className={styles.previewEmpty}>No matches found</p>
                  ) : (
                    <div className={styles.previewList}>
                      {preview.slice(0, 15).map((item, _idx) => (
                        <div
                          className={`${styles.previewItem} ${item.changed ? styles.changed : styles.unchanged}`}
                          key={item.token.id}
                        >
                          {item.changed ? (
                            <>
                              <div className={styles.previewBefore}>{item.before}</div>
                              <div className={styles.previewArrow}>↓</div>
                              <div className={styles.previewAfter}>{item.after}</div>
                            </>
                          ) : (
                            <div className={styles.previewUnchanged}>{item.before}</div>
                          )}
                        </div>
                      ))}
                      {preview.length > 15 && (
                        <div className={styles.previewMore}>+{preview.length - 15} more tokens...</div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
    </Dialog>
  )
}
