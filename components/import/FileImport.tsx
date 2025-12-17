import type React from 'react'
import { useRef, useState } from 'react'
import { Button, SectionHeader, Textarea, LoadingState } from '../ui'
import { FileText, Upload } from 'lucide-react'
import type { ParsedTokens } from '../../types/tokens'
import styles from './FileImport.module.css'

interface FileImportProps {
  onTokensParsed: (tokens: ParsedTokens) => void
  onFileParsed?: (data: any) => void
}

export function FileImport({ onTokensParsed, onFileParsed }: FileImportProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [pastedContent, setPastedContent] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    setIsLoading(true)
    try {
      const content = await file.text()
      parseContent(content)
    } catch (error) {
      alert(`Error reading file: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const parseContent = (content: string) => {
    // Try to parse as JSON first to detect file type
    try {
      const data = JSON.parse(content)
      
      // Check if it's a styles export file
      if (data.$schema === 'figma-styles-export' && onFileParsed) {
        onFileParsed(data)
        return
      }
    } catch (e) {
      // If JSON parse fails, fall back to backend parser
    }
    
    // Send to plugin backend for parsing (for variable tokens)
    parent.postMessage(
      {
        pluginMessage: {
          type: 'parse-tokens',
          data: { content, format: 'json' },
        },
      },
      '*'
    )
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files[0]
    if (file) {
      handleFile(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFile(file)
    }
  }

  const handlePaste = () => {
    if (pastedContent.trim()) {
      parseContent(pastedContent)
    }
  }

  return (
    <div className={styles.fileImport}>
      <SectionHeader
        variant="secondary"
        title="Import Design Tokens"
        description="Upload or paste your design tokens to sync with Figma"
      />

      {/* File Drop Zone */}
      <div
        className={`${styles.dropZone} ${isDragging ? styles.dragging : ''}`}
        onClick={() => fileInputRef.current?.click()}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input
          accept=".json"
          onChange={handleFileSelect}
          ref={fileInputRef}
          style={{ display: 'none' }}
          type="file"
        />

        {isLoading ? (
          <LoadingState message="Reading file..." />
        ) : (
          <>
            <div className={styles.uploadIcon}>📁</div>
            <p className={styles.dropZonePrimary}>Drop a file here or click to browse</p>
            <p className={styles.dropZoneSecondary}>Supports JSON files with design tokens</p>
          </>
        )}
      </div>

      {/* Or Divider */}
      <div className={styles.divider}>
        <span>OR</span>
      </div>

      {/* Paste Area */}
      <div className={styles.pasteArea}>
        <Textarea
          label="Paste JSON"
          onChange={e => setPastedContent(e.target.value)}
          placeholder={`{\n  "$collections": {...},\n  "tokens": {...}\n}`}
          rows={8}
          value={pastedContent}
        />
        <Button
          variant="primary"
          disabled={!pastedContent.trim() || isLoading}
          onClick={handlePaste}
        >
          <FileText size={14} />
          Parse Tokens
        </Button>
      </div>

      {/* Example */}
      <div className={styles.example}>
        <details>
          <summary>View example formats</summary>
          <div className={styles.exampleSection}>
            <h4>Multi-Collection Format:</h4>
            <pre>{`{
  "$collections": {
    "primitives": { "name": "Primitives", "modes": ["Default"] },
    "semantic": { "name": "Semantic", "modes": ["Light", "Dark"] }
  },
  "tokens": {
    "primitives": {
      "blue": { "value": "oklch(0.623 0.214 259.815)", "type": "color" }
    },
    "semantic": {
      "background": {
        "type": "color",
        "modes": {
          "Light": "{primitives.blue}",
          "Dark": "#000000"
        }
      }
    }
  }
}`}</pre>
          </div>
          <div className={styles.exampleSection}>
            <h4>Simple Format (Legacy):</h4>
            <pre>{`{
  "colors": {
    "primary": "#3B82F6",
    "gray-100": "#F3F4F6"
  },
  "spacing": {
    "xs": 4,
    "md": 16
  }
}`}</pre>
          </div>
        </details>
      </div>
    </div>
  )
}
