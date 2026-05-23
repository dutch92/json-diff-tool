import {
  useId,
  useState,
  type ChangeEvent,
  type ClipboardEvent,
  type DragEvent,
} from 'react'
import { updateJsonValueAtPath } from '../../lib/json/editValue'
import { formatJson } from '../../lib/json/format'
import { highlightJsonText } from '../../lib/json/highlight'
import type { DiffKind, JsonValue, ParseResult } from '../../lib/json/types'
import { Button, FileButton } from '../ui/Button'
import { Panel } from '../ui/Panel'
import { formatJsonParseError } from '../../lib/json/userMessages'
import { JsonTree } from './JsonTree'
import './JsonViewer.css'

type JsonViewerProps = {
  label: string
  text: string
  inputVersion: number
  diffStatuses: Map<string, DiffKind>
  activePath?: string
  parsed: ParseResult
  onChangeText: (value: string) => void
  onFormat: () => void
  onLoadSelectedFile: (file: File) => Promise<void>
}

export function JsonViewer({
  label,
  text,
  inputVersion,
  diffStatuses,
  activePath,
  parsed,
  onChangeText,
  onFormat,
  onLoadSelectedFile,
}: JsonViewerProps) {
  const inputId = useId()
  const [mode, setMode] = useState<'view' | 'edit'>('edit')
  const isEditing = mode === 'edit'
  const [isDraggingFile, setIsDraggingFile] = useState(false)
  const [fileError, setFileError] = useState<{ message: string; inputVersion: number } | null>(
    null,
  )
  const visibleFileError =
    fileError?.inputVersion === inputVersion ? fileError.message : null
  const isBlank = text.trim() === ''
  const validationError = !isBlank && parsed.error
  const statusTone = visibleFileError || validationError ? 'error' : parsed.isValid && !isBlank ? 'valid' : 'empty'
  const statusLabel =
    statusTone === 'error' ? 'Invalid' : statusTone === 'valid' ? 'Valid JSON' : 'Waiting'

  const handleTextChange = (value: string) => {
    setFileError(null)
    onChangeText(value)
  }

  const handleTreeValueChange = (path: string, value: JsonValue) => {
    if (!parsed.isValid) {
      return
    }

    handleTextChange(formatJson(updateJsonValueAtPath(parsed.value, path, value)))
  }

  const handleSurfacePaste = (event: ClipboardEvent<HTMLDivElement>) => {
    if (event.target instanceof HTMLTextAreaElement) {
      return
    }

    const pastedText = event.clipboardData.getData('text')

    if (!pastedText.trim()) {
      return
    }

    event.preventDefault()
    handleTextChange(pastedText)
    setMode('edit')
  }

  const loadFile = async (file: File) => {
    try {
      await onLoadSelectedFile(file)
      setFileError(null)
      setMode('edit')
    } catch {
      setFileError({ message: 'Не удалось прочитать файл', inputVersion })
    }
  }

  const handleFileInputChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    try {
      await loadFile(file)
    } finally {
      event.target.value = ''
    }
  }

  const hasDraggedFiles = (event: DragEvent<HTMLDivElement>) =>
    Array.from(event.dataTransfer.types).includes('Files')

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    if (!hasDraggedFiles(event)) {
      return
    }

    event.preventDefault()
    setIsDraggingFile(true)
  }

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    if (!isDraggingFile) {
      return
    }

    if (event.currentTarget.contains(event.relatedTarget as Node | null)) {
      return
    }

    setIsDraggingFile(false)
  }

  const handleDrop = async (event: DragEvent<HTMLDivElement>) => {
    const file = event.dataTransfer.files[0]

    if (!file) {
      return
    }

    event.preventDefault()
    setIsDraggingFile(false)
    await loadFile(file)
  }

  return (
    <Panel as="article" variant="soft" className="json-viewer">
      <div className="json-viewer__head">
        <div className="json-viewer__title-group">
          <h2 className="json-viewer__title">{label}</h2>
          <span className={`json-viewer__badge is-${statusTone}`}>
            {statusLabel}
          </span>
        </div>
        <div className="json-viewer__actions">
          <Button
            onClick={() => {
              setMode((currentMode) => (currentMode === 'view' ? 'edit' : 'view'))
            }}
          >
            {isEditing ? 'Tree' : 'Edit'}
          </Button>
          <FileButton htmlFor={inputId}>Upload</FileButton>
          <input
            id={inputId}
            className="json-viewer__file-input"
            type="file"
            accept=".json,application/json"
            onChange={handleFileInputChange}
          />
          <Button onClick={onFormat} disabled={!parsed.isValid}>
            Format
          </Button>
        </div>
      </div>

      <div
        className={`json-viewer__surface ${isDraggingFile ? 'is-dragging-file' : ''}`.trim()}
        tabIndex={0}
        aria-label={label}
        onPaste={handleSurfacePaste}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isEditing ? (
          <textarea
            className="json-viewer__editor"
            aria-label={`${label}: source JSON`}
            placeholder={`Paste ${label.toLowerCase()} here`}
            spellCheck={false}
            value={text}
            onChange={(event) => handleTextChange(event.target.value)}
          />
        ) : parsed.isValid ? (
          <JsonTree
            value={parsed.value}
            diffStatuses={diffStatuses}
            activePath={activePath}
            onChangeValue={handleTreeValueChange}
          />
        ) : (
          <pre
            className="json-viewer__raw"
            dangerouslySetInnerHTML={{ __html: highlightJsonText(text) }}
          />
        )}
      </div>

      <p className="json-viewer__hint">
        {isEditing
          ? 'Paste JSON or drop a .json file into this pane'
          : 'Focus the pane to paste JSON, or drop a .json file'}
      </p>

      {isBlank && !visibleFileError ? null : (
        <p className={`json-viewer__status ${validationError || visibleFileError ? 'is-error' : 'is-ok'}`}>
          {visibleFileError ?? (validationError ? formatJsonParseError(validationError) : 'JSON is valid')}
        </p>
      )}
    </Panel>
  )
}
