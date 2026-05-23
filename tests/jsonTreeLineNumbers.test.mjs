import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'

const jsonTreeSource = readFileSync('src/components/JsonViewer/JsonTree.tsx', 'utf8')
const viewerCss = readFileSync('src/components/JsonViewer/JsonViewer.css', 'utf8')

test('json tree line numbers are generated from visible rows', () => {
  assert.match(jsonTreeSource, /lineNumber:\s*number/)
  assert.match(jsonTreeSource, /lineNumber=\{lineNumber\}/)
  assert.match(jsonTreeSource, /lineNumber=\{nodeLineNumbers\?\.closing \?\? 0\}/)
  assert.doesNotMatch(viewerCss, /counter-reset:\s*json-line/)
  assert.doesNotMatch(viewerCss, /counter-increment:\s*json-line/)
  assert.doesNotMatch(viewerCss, /content:\s*counter\(json-line\)/)
})

test('collapsed json tree containers skip the hidden subtree line numbers', () => {
  assert.match(jsonTreeSource, /function countJsonTreeLines/)
  assert.match(
    jsonTreeSource,
    /isCollapsed[\s\S]*nextLineNumber:\s*lineNumber\s*\+\s*countJsonTreeLines\(value\)/,
  )
})
