import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'

const viewerCss = readFileSync('src/components/JsonViewer/JsonViewer.css', 'utf8')

test('diff marker is embedded into the colored status rail', () => {
  assert.match(viewerCss, /--diff-rail-width:\s*18px/)
  assert.match(viewerCss, /border-left:\s*var\(--diff-rail-width\) solid transparent/)
  assert.match(viewerCss, /left:\s*calc\(var\(--diff-rail-width\) \* -1\)/)
  assert.match(viewerCss, /border-radius:\s*0/)
  assert.match(viewerCss, /background:\s*var\(--success\)/)
  assert.match(viewerCss, /background:\s*var\(--danger\)/)
  assert.match(viewerCss, /background:\s*var\(--warning\)/)
})
