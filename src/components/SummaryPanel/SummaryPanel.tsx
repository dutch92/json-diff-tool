import { Panel } from '../ui/Panel'
import './SummaryPanel.css'

type SummaryPanelProps<ThemeValue extends string> = {
  canCompare: boolean
  diffCount: number
  activeDiffPath?: string
  themes: {
    value: ThemeValue
    label: string
  }[]
  selectedTheme: ThemeValue
  onSelectTheme: (theme: ThemeValue) => void
}

export function SummaryPanel<ThemeValue extends string>({
  canCompare,
  diffCount,
  activeDiffPath,
  themes,
  selectedTheme,
  onSelectTheme,
}: SummaryPanelProps<ThemeValue>) {
  const displayPath = activeDiffPath?.replace(/^root\.?/, '') || activeDiffPath

  return (
    <Panel variant="hero" className="summary-panel">
      <div className="summary-panel__brand">
        JSON Diff Tool
      </div>

      <div className="summary-panel__metrics">
        <div className="summary-panel__metric">
          <span>Статус</span>
          <strong>{canCompare ? 'Сравнение обновлено' : 'Исправьте JSON'}</strong>
        </div>
        <div className="summary-panel__metric">
          <span>Различий найдено</span>
          <strong>{diffCount}</strong>
        </div>
        {displayPath ? (
          <div className="summary-panel__metric summary-panel__metric-path">
            <span>Текущее отличие</span>
            <strong>{displayPath}</strong>
          </div>
        ) : null}
      </div>

      <div className="summary-panel__legend" aria-label="Легенда отличий">
        <span><i className="summary-panel__swatch is-added" />Добавлено</span>
        <span><i className="summary-panel__swatch is-removed" />Удалено</span>
        <span><i className="summary-panel__swatch is-changed" />Изменено</span>
        <span><i className="summary-panel__swatch is-active" />Текущее</span>
      </div>

      <div className="theme-switcher">
        {themes.map((theme) => (
          <button
            type="button"
            className="theme-switcher__button"
            key={theme.value}
            aria-pressed={theme.value === selectedTheme}
            onClick={() => onSelectTheme(theme.value)}
          >
            {theme.label}
          </button>
        ))}
      </div>
    </Panel>
  )
}
