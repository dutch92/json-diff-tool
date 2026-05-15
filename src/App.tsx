import { useEffect, useState } from 'react'
import { DiffNavigator } from './components/DiffNavigator/DiffNavigator'
import { JsonViewer } from './components/JsonViewer/JsonViewer'
import { SummaryPanel } from './components/SummaryPanel/SummaryPanel'
import { Button } from './components/ui/Button'
import { diffJson } from './lib/json/diff'
import { buildDiffStatusMap } from './lib/json/diffStatus'
import { leftExample, rightExample } from './lib/json/examples'
import { formatJson, parseInput } from './lib/json/format'
import { shouldConfirmExampleReset } from './lib/json/userMessages'
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
    text: formatJson(leftExample),
    version: 0,
  })
  const [rightJson, setRightJson] = useState<JsonSideState>({
    text: formatJson(rightExample),
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
        canCompare={canCompare}
        diffCount={diffs.length}
        activeDiffPath={activeDiffPath}
        themes={themes}
        selectedTheme={theme}
        onSelectTheme={setTheme}
      />
      <DiffNavigator
        diffCount={diffs.length}
        activeDiffIndex={effectiveActiveDiffIndex}
        activeDiffPath={activeDiffPath}
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
        <div className="workspace-panel__toolbar">
          <Button
            onClick={() => {
              setLeftJson((current) => ({ text: rightText, version: current.version + 1 }))
              setRightJson((current) => ({ text: leftText, version: current.version + 1 }))
            }}
          >
            Поменять местами
          </Button>
          <Button
            onClick={() => {
              const shouldConfirm = shouldConfirmExampleReset(leftJson.version, rightJson.version)

              if (
                shouldConfirm &&
                !window.confirm('Сбросить оба JSON к примеру? Текущий ввод будет заменен.')
              ) {
                return
              }

              setLeftText(formatJson(leftExample))
              setRightText(formatJson(rightExample))
            }}
          >
            Сбросить к примеру
          </Button>
        </div>

        <div className="workspace-panel__viewers">
          <JsonViewer
            kicker="Левый JSON"
            text={leftText}
            inputVersion={leftJson.version}
            diffStatuses={leftDiffStatuses}
            activePath={activeDiffPath}
            parsed={leftParsed}
            onChangeText={setLeftText}
            onFormat={() => formatSide(leftText, setLeftText)}
            onLoadSelectedFile={(file) => readJsonFile(file, setLeftText)}
          />

          <JsonViewer
            kicker="Правый JSON"
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
