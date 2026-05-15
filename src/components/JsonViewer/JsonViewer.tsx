import {
  useId,
  useState,
  type ChangeEvent,
  type ClipboardEvent,
  type DragEvent,
} from 'react'
import { highlightJsonText } from '../../lib/json/highlight'
import type { DiffKind, ParseResult } from '../../lib/json/types'
import { Button, FileButton } from '../ui/Button'
import { Panel } from '../ui/Panel'
import { JsonTree } from './JsonTree'
import './JsonViewer.css'

type JsonViewerProps = {
  kicker: string
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
  kicker,
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
  const [mode, setMode] = useState<'view' | 'edit'>('view')
  const isEditing = mode === 'edit'
  const [isDraggingFile, setIsDraggingFile] = useState(false)
  const [fileError, setFileError] = useState<{ message: string; inputVersion: number } | null>(
    null,
  )
  const visibleFileError =
    fileError?.inputVersion === inputVersion ? fileError.message : null

  const handleTextChange = (value: string) => {
    setFileError(null)
    onChangeText(value)
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
        <div>
          <span className="section-kicker">{kicker}</span>
        </div>
        <div className="json-viewer__actions">
          <Button
            onClick={() => {
              setMode((currentMode) => (currentMode === 'view' ? 'edit' : 'view'))
            }}
          >
            {isEditing ? 'Показать дерево' : 'Редактировать'}
          </Button>
          <FileButton htmlFor={inputId}>Загрузить файл</FileButton>
          <input
            id={inputId}
            className="json-viewer__file-input"
            type="file"
            accept=".json,application/json"
            onChange={handleFileInputChange}
          />
          <Button onClick={onFormat} disabled={!parsed.isValid}>
            Форматировать
          </Button>
        </div>
      </div>

      <div
        className={`json-viewer__surface ${isDraggingFile ? 'is-dragging-file' : ''}`.trim()}
        tabIndex={0}
        aria-label={kicker}
        onPaste={handleSurfacePaste}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isEditing ? (
          <textarea
            className="json-viewer__editor"
            aria-label={`${kicker}: исходный JSON`}
            spellCheck={false}
            value={text}
            onChange={(event) => handleTextChange(event.target.value)}
          />
        ) : parsed.isValid ? (
          <JsonTree
            value={parsed.value}
            diffStatuses={diffStatuses}
            activePath={activePath}
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
          ? 'Вставьте JSON вручную или перетащите .json файл в эту область'
          : 'Сфокусируйте область и вставьте JSON или перетащите .json файл'}
      </p>

      <p className={`json-viewer__status ${parsed.error || visibleFileError ? 'is-error' : 'is-ok'}`}>
        {visibleFileError ?? parsed.error ?? 'JSON валиден'}
      </p>
    </Panel>
  )
}
