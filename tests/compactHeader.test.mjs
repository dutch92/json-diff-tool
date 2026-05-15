import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'

const summaryPanelSource = readFileSync('src/components/SummaryPanel/SummaryPanel.tsx', 'utf8')
const appSource = readFileSync('src/App.tsx', 'utf8')
const diffNavigatorSource = readFileSync('src/components/DiffNavigator/DiffNavigator.tsx', 'utf8')
const diffNavigatorCss = readFileSync('src/components/DiffNavigator/DiffNavigator.css', 'utf8')

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

test('diff navigator keeps arrow controls grouped before the path', () => {
  assert.match(diffNavigatorSource, /diff-navigator__controls/)
  assert.match(diffNavigatorSource, /diff-navigator__meta/)
  assert.match(diffNavigatorCss, /grid-template-columns:\s*auto minmax\(0, 1fr\)/)
  assert.match(diffNavigatorCss, /diff-navigator__controls[\s\S]*display: inline-flex/)
  assert.match(diffNavigatorCss, /diff-navigator__path[\s\S]*justify-self: start/)
})
