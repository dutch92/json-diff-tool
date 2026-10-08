import { useEffect, useMemo, useState } from 'react'
import { AlignedDiff } from './components/DiffResults/AlignedDiff'
import { JsonViewer } from './components/JsonViewer/JsonViewer'
import { SummaryPanel } from './components/SummaryPanel/SummaryPanel'
import { Button } from './components/ui/Button'
import { diffJson } from './lib/json/diff'
import { buildDiffStatusMap } from './lib/json/diffStatus'
import { formatJson, parseInput } from './lib/json/format'
import './App.css'

type JsonSideState = {
  text: string
  version: number
}

type Theme = 'productive' | 'calm' | 'console'

const themes: { value: Theme; label: string }[] = [
  { value: 'console', label: 'Workbench' },
  { value: 'productive', label: 'Daylight' },
  { value: 'calm', label: 'Review' },
]

const themeStorageKey = 'json-diff-tool-theme'

const isTheme = (value: string | null): value is Theme =>
  value === 'productive' || value === 'calm' || value === 'console'

const getInitialTheme = (): Theme => {
  if (typeof window === 'undefined') {
    return 'console'
  }

  try {
    const storedTheme = window.localStorage.getItem(themeStorageKey)

    return isTheme(storedTheme) ? storedTheme : 'console'
  } catch {
    return 'console'
  }
}

function App() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.dataset.theme = theme
    }

    try {
      window.localStorage.setItem(themeStorageKey, theme)
    } catch {
      // Ignore blocked or unavailable storage.
    }
  }, [theme])

  const [leftJson, setLeftJson] = useState<JsonSideState>({
    text: '',
    version: 0,
  })
  const [rightJson, setRightJson] = useState<JsonSideState>({
    text: '',
    version: 0,
  })
  const leftText = leftJson.text
  const rightText = rightJson.text

  const setLeftText = (value: string) => {
    setLeftJson((current) => ({ text: value, version: current.version + 1 }))
  }

  const setRightText = (value: string) => {
    setRightJson((current) => ({ text: value, version: current.version + 1 }))
  }

  const leftParsed = useMemo(() => parseInput(leftText), [leftText])
  const rightParsed = useMemo(() => parseInput(rightText), [rightText])
  const canCompare = leftParsed.isValid && rightParsed.isValid
  const diffs = useMemo(() => canCompare ? diffJson(leftParsed.value, rightParsed.value) : [], [canCompare, leftParsed, rightParsed])
  const [view, setView] = useState<'edit' | 'compare'>('edit')
  const [hideUnchanged, setHideUnchanged] = useState(false)
  const [unified, setUnified] = useState(false)
  const [activeDiffIndex, setActiveDiffIndex] = useState(0)
  const effectiveActiveDiffIndex = diffs.length === 0 ? 0 : activeDiffIndex % diffs.length
  const activeDiff = diffs[effectiveActiveDiffIndex]
  const activeDiffPath = activeDiff?.path

  const leftDiffStatuses = useMemo(() => buildDiffStatusMap(diffs, 'left'), [diffs])
  const rightDiffStatuses = useMemo(() => buildDiffStatusMap(diffs, 'right'), [diffs])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'F7' || event.altKey || event.ctrlKey || event.metaKey || !diffs.length) return
      event.preventDefault()
      setView('compare')
      setActiveDiffIndex(current => (current + (event.shiftKey ? -1 : 1) + diffs.length) % diffs.length)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [diffs.length])

  const formatSide = (text: string, setText: (value: string) => void) => {
    const parsed = parseInput(text)

    if (parsed.isValid) {
      setText(formatJson(parsed.value))
    }
  }

  const readJsonFile = async (file: File, setText: (value: string) => void) => {
    const content = await file.text()
    const parsed = parseInput(content)

    setText(parsed.isValid ? formatJson(parsed.value) : content)
  }

  return (
    <main className="app-shell" data-theme={theme}>
      <SummaryPanel
        diffCount={diffs.length}
        activeDiffIndex={effectiveActiveDiffIndex}
        activeDiffPath={activeDiffPath}
        themes={themes}
        selectedTheme={theme}
        onSelectTheme={setTheme}
        onPreviousDiff={() => {
          if (canCompare) setView('compare')
          setActiveDiffIndex((current) =>
            diffs.length === 0 ? 0 : (current - 1 + diffs.length) % diffs.length,
          )
        }}
        onNextDiff={() => {
          if (canCompare) setView('compare')
          setActiveDiffIndex((current) =>
            diffs.length === 0 ? 0 : (current + 1) % diffs.length,
          )
        }}
      />

      <div className="comparison-toolbar">
        <div className="comparison-toolbar__modes" role="group" aria-label="Workspace mode">
          <button type="button" aria-pressed={view === 'edit'} onClick={() => setView('edit')}>Edit JSON</button>
          <button type="button" aria-pressed={view === 'compare'} disabled={!canCompare}
            onClick={() => setView('compare')}>Compare</button>
        </div>
        {view === 'compare' && canCompare ? <>
          <select aria-label="Comparison layout" value={unified ? 'unified' : 'split'} onChange={event => setUnified(event.target.value === 'unified')}>
            <option value="split">Side by side</option><option value="unified">Unified</option>
          </select>
          <label className="comparison-toolbar__checkbox"><input type="checkbox" checked={hideUnchanged}
            onChange={event => setHideUnchanged(event.target.checked)} />Hide unchanged</label>
          <div className="comparison-toolbar__legend" aria-label="Difference types">
            <span className="is-added">+ Added</span><span className="is-removed">− Removed</span><span className="is-changed">≠ Changed</span>
          </div>
        </> : <span className="comparison-toolbar__hint">{canCompare ? 'Ready to compare' : 'Paste or upload two JSON documents to compare'}</span>}
      </div>

      {view === 'compare' && canCompare ? <AlignedDiff
        key={`${leftJson.version}:${rightJson.version}`}
        left={leftParsed.value} right={rightParsed.value} diffs={diffs}
        activeIndex={effectiveActiveDiffIndex} onSelect={setActiveDiffIndex}
        hideUnchanged={hideUnchanged} unified={unified}
      /> : null}

      <section hidden={view === 'compare' && canCompare} className="workspace-panel" aria-label="JSON comparison workspace">
        <div className="workspace-panel__viewers">
          <JsonViewer
            suspended={view === 'compare' && canCompare}
            label="Left JSON"
            text={leftText}
            inputVersion={leftJson.version}
            diffStatuses={leftDiffStatuses}
            activePath={activeDiffPath}
            parsed={leftParsed}
            onChangeText={setLeftText}
            onFormat={() => formatSide(leftText, setLeftText)}
            onLoadSelectedFile={(file) => readJsonFile(file, setLeftText)}
          />

          <Button
            className="workspace-panel__swap"
            aria-label="Поменять JSON местами"
            onClick={() => {
              setLeftJson((current) => ({ text: rightText, version: current.version + 1 }))
              setRightJson((current) => ({ text: leftText, version: current.version + 1 }))
            }}
          >
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <path d="M5 6h10m0 0-3-3m3 3-3 3M15 14H5m0 0 3-3m-3 3 3 3" />
            </svg>
          </Button>

          <JsonViewer
            suspended={view === 'compare' && canCompare}
            label="Right JSON"
            text={rightText}
            inputVersion={rightJson.version}
            diffStatuses={rightDiffStatuses}
            activePath={activeDiffPath}
            parsed={rightParsed}
            onChangeText={setRightText}
            onFormat={() => formatSide(rightText, setRightText)}
            onLoadSelectedFile={(file) => readJsonFile(file, setRightText)}
          />
        </div>
      </section>

    </main>
  )
}

export default App
