import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'

const viewerCss = readFileSync('src/components/JsonViewer/JsonViewer.css', 'utf8')

test('json tree uses GitHub-like row columns for line numbers and diff markers', () => {
  assert.match(viewerCss, /\.json-tree\s*{/)
  assert.match(viewerCss, /--json-line-number-width:\s*44px/)
  assert.match(viewerCss, /--json-marker-width:\s*24px/)
  assert.match(viewerCss, /\.json-node\s*{[\s\S]*display:\s*grid/)
  assert.match(
    viewerCss,
    /grid-template-columns:\s*var\(--json-line-number-width\) var\(--json-marker-width\) minmax\(max-content,\s*1fr\)/,
  )
  assert.match(viewerCss, /\.json-node__line-number\s*{[\s\S]*text-align:\s*right/)
  assert.match(viewerCss, /\.json-node__marker\s*{[\s\S]*justify-content:\s*center/)
})

test('diff marker backgrounds stay mapped to each diff status', () => {
  assert.match(viewerCss, /\.json-node-added\s+>\s+\.json-node__marker\s*{[\s\S]*background:\s*var\(--success\)/)
  assert.match(viewerCss, /\.json-node-removed\s+>\s+\.json-node__marker\s*{[\s\S]*background:\s*var\(--danger\)/)
  assert.match(viewerCss, /\.json-node-changed\s+>\s+\.json-node__marker\s*{[\s\S]*background:\s*var\(--warning\)/)
  assert.match(viewerCss, /\.json-node-active\s*{[\s\S]*box-shadow:/)
})
