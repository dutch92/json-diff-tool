import { useEffect, useState } from 'react'
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
  { value: 'productive', label: 'Рабочая' },
  { value: 'calm', label: 'Спокойная' },
  { value: 'console', label: 'Консоль' },
]

const themeStorageKey = 'json-diff-tool-theme'

const isTheme = (value: string | null): value is Theme =>
  value === 'productive' || value === 'calm' || value === 'console'

const getInitialTheme = (): Theme => {
  if (typeof window === 'undefined') {
    return 'productive'
  }

  try {
    const storedTheme = window.localStorage.getItem(themeStorageKey)

    return isTheme(storedTheme) ? storedTheme : 'productive'
  } catch {
    return 'productive'
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

  const leftParsed = parseInput(leftText)
  const rightParsed = parseInput(rightText)
  const canCompare = leftParsed.isValid && rightParsed.isValid
  const diffs = canCompare ? diffJson(leftParsed.value, rightParsed.value) : []
  const [activeDiffIndex, setActiveDiffIndex] = useState(0)
  const effectiveActiveDiffIndex = diffs.length === 0 ? 0 : activeDiffIndex % diffs.length
  const activeDiff = diffs[effectiveActiveDiffIndex]
  const activeDiffPath = activeDiff?.path

  const leftDiffStatuses = buildDiffStatusMap(diffs, 'left')
  const rightDiffStatuses = buildDiffStatusMap(diffs, 'right')

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
          setActiveDiffIndex((current) =>
            diffs.length === 0 ? 0 : (current - 1 + diffs.length) % diffs.length,
          )
        }}
        onNextDiff={() => {
          setActiveDiffIndex((current) =>
            diffs.length === 0 ? 0 : (current + 1) % diffs.length,
          )
        }}
      />

      <section className="workspace-panel">
        <div className="workspace-panel__viewers">
          <JsonViewer
            label="Левый JSON"
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
            label="Правый JSON"
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
