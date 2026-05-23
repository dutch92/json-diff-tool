import { Panel } from '../ui/Panel'
import { DiffNavigator } from '../DiffNavigator/DiffNavigator'
import './SummaryPanel.css'

type SummaryPanelProps<ThemeValue extends string> = {
  diffCount: number
  activeDiffPath?: string
  themes: {
    value: ThemeValue
    label: string
  }[]
  selectedTheme: ThemeValue
  onSelectTheme: (theme: ThemeValue) => void
  activeDiffIndex: number
  onPreviousDiff: () => void
  onNextDiff: () => void
}

export function SummaryPanel<ThemeValue extends string>({
  diffCount,
  activeDiffPath,
  themes,
  selectedTheme,
  onSelectTheme,
  activeDiffIndex,
  onPreviousDiff,
  onNextDiff,
}: SummaryPanelProps<ThemeValue>) {
  return (
    <Panel variant="hero" className="summary-panel">
      <div className="summary-panel__brand">
        JSON Diff Tool
      </div>

      <DiffNavigator
        diffCount={diffCount}
        activeDiffIndex={activeDiffIndex}
        activeDiffPath={activeDiffPath}
        onPreviousDiff={onPreviousDiff}
        onNextDiff={onNextDiff}
      />

      <details className="theme-switcher">
        <summary className="theme-switcher__summary" aria-label="Open appearance settings">
          <span className="theme-switcher__dot" aria-hidden="true" />
          <span className="theme-switcher__current">
            {themes.find((theme) => theme.value === selectedTheme)?.label}
          </span>
        </summary>
        <div className="theme-switcher__menu">
          <span className="theme-switcher__label">Appearance</span>
          <select
            className="theme-switcher__select"
            value={selectedTheme}
            onChange={(event) => onSelectTheme(event.target.value as ThemeValue)}
          >
            {themes.map((theme) => (
              <option
                key={theme.value}
                value={theme.value}
              >
                {theme.label}
              </option>
            ))}
          </select>
        </div>
      </details>
    </Panel>
  )
}
