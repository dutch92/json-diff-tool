import { useState, type ChangeEvent } from 'react'
import { DiffNavigator } from './components/DiffNavigator/DiffNavigator'
import { JsonViewer } from './components/JsonViewer/JsonViewer'
import { SummaryPanel } from './components/SummaryPanel/SummaryPanel'
import { Button } from './components/ui/Button'
import { diffJson } from './lib/json/diff'
import { buildDiffStatusMap } from './lib/json/diffStatus'
import { leftExample, rightExample } from './lib/json/examples'
import { formatJson, parseInput } from './lib/json/format'
import './App.css'

function App() {
  const [leftText, setLeftText] = useState(formatJson(leftExample))
  const [rightText, setRightText] = useState(formatJson(rightExample))

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

  const createFileLoader =
    (setText: (value: string) => void) =>
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]

      if (!file) {
        return
      }

      const content = await file.text()
      const parsed = parseInput(content)

      setText(parsed.isValid ? formatJson(parsed.value) : content)
      event.target.value = ''
    }

  return (
    <main className="app-shell">
      <SummaryPanel
        canCompare={canCompare}
        diffCount={diffs.length}
      />
      <DiffNavigator
        diffCount={diffs.length}
        activeDiffIndex={effectiveActiveDiffIndex}
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
              setLeftText(rightText)
              setRightText(leftText)
            }}
          >
            Поменять местами
          </Button>
          <Button
            onClick={() => {
              setLeftText(formatJson(leftExample))
              setRightText(formatJson(rightExample))
            }}
          >
            Вернуть пример
          </Button>
        </div>

        <div className="workspace-panel__viewers">
          <JsonViewer
            kicker="Левый JSON"
            text={leftText}
            diffStatuses={leftDiffStatuses}
            activePath={activeDiffPath}
            parsed={leftParsed}
            onChangeText={setLeftText}
            onFormat={() => formatSide(leftText, setLeftText)}
            onLoadFile={createFileLoader(setLeftText)}
          />

          <JsonViewer
            kicker="Правый JSON"
            text={rightText}
            diffStatuses={rightDiffStatuses}
            activePath={activeDiffPath}
            parsed={rightParsed}
            onChangeText={setRightText}
            onFormat={() => formatSide(rightText, setRightText)}
            onLoadFile={createFileLoader(setRightText)}
          />
        </div>
      </section>

    </main>
  )
}

export default App
