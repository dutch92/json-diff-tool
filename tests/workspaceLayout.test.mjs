import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'

const appSource = readFileSync('src/App.tsx', 'utf8')
const viewerSource = readFileSync('src/components/JsonViewer/JsonViewer.tsx', 'utf8')

test('workspace starts with empty JSON inputs and no example reset control', () => {
  assert.match(appSource, /text:\s*''/)
  assert.doesNotMatch(appSource, /leftExample/)
  assert.doesNotMatch(appSource, /rightExample/)
  assert.doesNotMatch(appSource, /Сбросить к примеру/)
  assert.doesNotMatch(appSource, /shouldConfirmExampleReset/)
})

test('workspace renders swap as an icon control between comparison panes', () => {
  assert.match(appSource, /workspace-panel__swap/)
  assert.match(appSource, /aria-label="Поменять JSON местами"/)
  assert.doesNotMatch(appSource, />\s*Поменять местами\s*</)
})

test('json viewers do not render visible left and right JSON headings', () => {
  assert.doesNotMatch(appSource, /kicker="Левый JSON"/)
  assert.doesNotMatch(appSource, /kicker="Правый JSON"/)
  assert.doesNotMatch(viewerSource, /section-kicker/)
  assert.match(viewerSource, /useState<'view' \| 'edit'>\('edit'\)/)
})

test('json viewers hide validation status while input is blank', () => {
  assert.match(viewerSource, /const isBlank = text\.trim\(\) === ''/)
  assert.match(viewerSource, /!isBlank && parsed\.error/)
})
