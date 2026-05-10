import { previewValue } from '../../lib/json/format'
import type { DiffEntry, DiffKind } from '../../lib/json/types'
import { Badge } from '../ui/Badge'
import { Panel } from '../ui/Panel'
import './DiffResults.css'

type DiffResultsProps = {
  canCompare: boolean
  diffs: DiffEntry[]
  summary: Record<DiffKind, number>
}

export function DiffResults({ canCompare, diffs, summary }: DiffResultsProps) {
  return (
    <Panel className="diff-results">
      <div className="diff-results__head">
        <div>
          <span className="section-kicker">Результат</span>
          <h2>Структурные различия</h2>
        </div>
        <div className="diff-results__badges">
          <Badge tone="added">Добавлено: {summary.added}</Badge>
          <Badge tone="removed">Удалено: {summary.removed}</Badge>
          <Badge tone="changed">Изменено: {summary.changed}</Badge>
        </div>
      </div>

      {!canCompare ? (
        <div className="diff-results__empty">
          Исправьте ошибки в JSON, и список различий появится автоматически.
        </div>
      ) : diffs.length === 0 ? (
        <div className="diff-results__empty">
          Объекты совпадают. Структура и значения полностью одинаковые.
        </div>
      ) : (
        <div className="diff-results__list" role="list">
          {diffs.map((entry) => (
            <article
              className={`diff-results__item diff-results__item-${entry.kind}`}
              key={`${entry.kind}-${entry.path}`}
              role="listitem"
            >
              <div className="diff-results__meta">
                <span className="diff-results__kind">{entry.kind}</span>
                <code>{entry.path}</code>
              </div>
              <div className="diff-results__values">
                <div>
                  <span>Было</span>
                  <pre>{previewValue(entry.before)}</pre>
                </div>
                <div>
                  <span>Стало</span>
                  <pre>{previewValue(entry.after)}</pre>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </Panel>
  )
}
