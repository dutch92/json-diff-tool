import { Panel } from '../ui/Panel'
import './SummaryPanel.css'

type SummaryPanelProps = {
  canCompare: boolean
  diffCount: number
}

export function SummaryPanel({
  canCompare,
  diffCount,
}: SummaryPanelProps) {
  return (
    <Panel variant="hero" className="summary-panel">
      <div className="summary-panel__brand">
        JSON Diff Tool
      </div>

      <div className="summary-panel__metrics">
        <div className="summary-panel__metric">
          <span>Статус</span>
          <strong>{canCompare ? 'Готово к сравнению' : 'Проверьте JSON'}</strong>
        </div>
        <div className="summary-panel__metric">
          <span>Различий найдено</span>
          <strong>{diffCount}</strong>
        </div>
      </div>
    </Panel>
  )
}
