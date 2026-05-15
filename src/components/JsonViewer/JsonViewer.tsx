import { useId, type ChangeEvent } from 'react'
import { highlightJsonText } from '../../lib/json/highlight'
import type { DiffKind, ParseResult } from '../../lib/json/types'
import { Button, FileButton } from '../ui/Button'
import { Panel } from '../ui/Panel'
import { JsonTree } from './JsonTree'
import './JsonViewer.css'

type JsonViewerProps = {
  kicker: string
  text: string
  diffStatuses: Map<string, DiffKind>
  activePath?: string
  parsed: ParseResult
  onChangeText: (value: string) => void
  onFormat: () => void
  onLoadFile: (event: ChangeEvent<HTMLInputElement>) => void
}

export function JsonViewer({
  kicker,
  text,
  diffStatuses,
  activePath,
  parsed,
  onFormat,
  onLoadFile,
}: JsonViewerProps) {
  const inputId = useId()

  return (
    <Panel as="article" variant="soft" className="json-viewer">
      <div className="json-viewer__head">
        <div>
          <span className="section-kicker">{kicker}</span>
        </div>
        <div className="json-viewer__actions">
          <FileButton htmlFor={inputId}>Загрузить файл</FileButton>
          <input
            id={inputId}
            className="json-viewer__file-input"
            type="file"
            accept=".json,application/json"
            onChange={onLoadFile}
          />
          <Button onClick={onFormat} disabled={!parsed.isValid}>
            Форматировать
          </Button>
        </div>
      </div>

      <div className="json-viewer__surface" tabIndex={0} aria-label={kicker}>
        {parsed.isValid ? (
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

      <p className={`json-viewer__status ${parsed.error ? 'is-error' : 'is-ok'}`}>
        {parsed.error ?? 'JSON валиден'}
      </p>
    </Panel>
  )
}
