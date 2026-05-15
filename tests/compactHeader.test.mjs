import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'

const summaryPanelSource = readFileSync('src/components/SummaryPanel/SummaryPanel.tsx', 'utf8')
const appSource = readFileSync('src/App.tsx', 'utf8')

test('summary panel keeps only compact header controls', () => {
  assert.match(summaryPanelSource, /<select/)
  assert.doesNotMatch(summaryPanelSource, /summary-panel__legend/)
  assert.doesNotMatch(summaryPanelSource, /Статус/)
  assert.doesNotMatch(summaryPanelSource, /Различий найдено/)
  assert.doesNotMatch(summaryPanelSource, /Текущее отличие/)
})

test('diff navigation is rendered inside the fixed header panel', () => {
  assert.match(summaryPanelSource, /DiffNavigator/)
  assert.doesNotMatch(appSource, /<DiffNavigator/)
})
