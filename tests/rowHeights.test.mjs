import assert from 'node:assert/strict'
import test from 'node:test'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
const out = join(tmpdir(), 'json-diff-row-heights-tests')
execFileSync(process.execPath, ['node_modules/typescript/bin/tsc', 'src/lib/virtual/RowHeights.ts', '--target', 'ES2023', '--module', 'ES2022', '--outDir', out, '--skipLibCheck', '--ignoreConfig'])
const { RowHeights } = await import(`data:text/javascript;base64,${Buffer.from(readFileSync(join(out, 'RowHeights.js'))).toString('base64')}`)

test('finds visible rows at exact boundaries and clamps document ends', () => {
  const h = new RowHeights([24, 48, 32])
  assert.deepEqual([0, 23, 24, 71, 72, 104, 999].map(x => h.indexAt(x)), [0, 0, 1, 1, 2, 2, 2])
  assert.deepEqual([0, 1, 2, 3].map(x => h.offset(x)), [0, 24, 72, 104])
})
test('measurement changes and viewport resets preserve accurate row offsets', () => {
  const h = new RowHeights([24, 24, 24])
  assert.equal(h.update(0, 120), true)
  assert.equal(h.offset(2), 144)
  assert.equal(h.indexAt(130), 1)
  assert.equal(h.update(0, 120), false)
  h.reset([48, 24, 48])
  assert.equal(h.offset(3), 120)
  assert.equal(h.indexAt(70), 1)
})
test('large mixed-height documents match a linear reference after many measurements', () => {
  const values = Array.from({ length: 50000 }, (_, i) => i % 7 ? 24 : 48)
  const h = new RowHeights(values)
  for (let i = 0; i < values.length; i += 113) { values[i] = 240; h.update(i, 240) }
  let offset = 0
  values.forEach((height, index) => {
    assert.equal(h.offset(index), offset)
    assert.equal(h.indexAt(offset + height - 1), index)
    offset += height
  })
  assert.equal(h.offset(values.length), offset)
})
