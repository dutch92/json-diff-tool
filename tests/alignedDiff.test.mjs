import assert from 'node:assert/strict'
import test from 'node:test'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const outDir = join(tmpdir(), 'json-diff-alignment-tests')
execFileSync(process.execPath, ['node_modules/typescript/bin/tsc', 'src/lib/json/alignedDiff.ts', '--target', 'ES2023', '--module', 'ES2022', '--moduleResolution', 'bundler', '--outDir', outDir, '--skipLibCheck', '--ignoreConfig'])
const source = readFileSync(join(outDir, 'alignedDiff.js'), 'utf8')
const { buildAlignedRows, changedSpan, foldUnchanged } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`)
const reconstruct = (rows, side) => JSON.parse(rows.flatMap(row => row[side] ? [row[side].text] : []).join('\n'))

test('aligns inserted subtrees without shifting following matching values', () => {
  const a = { a: 1, z: 'same' }
  const b = { a: 1, new: { nested: [1, 2] }, z: 'same' }
  const rows = buildAlignedRows(a, b)
  assert.deepEqual(reconstruct(rows, 'left'), a)
  assert.deepEqual(reconstruct(rows, 'right'), b)
  assert.ok(rows.filter(row => row.kind === 'added').every(row => !row.left))
  const last = rows.find(row => row.path === 'root.z')
  assert.equal(last.left.text, last.right.text)
  assert.ok(last.left.number < last.right.number)
})

test('preserves both documents across types, empty containers, deletions and arrays', () => {
  const pairs = [
    [null, { a: 'x' }], [{ a: { deep: [1, 2] } }, { a: false }],
    [{ a: 1 }, {}], [[], [false, null]], [{ a: [] }, { a: [1] }],
    [[1, 2, 3], [3]], ['<script>alert(1)</script>', 'safe'],
    [JSON.parse('{"__proto__":1,"a.b":2}'), {}], [false, false],
  ]
  for (const [a, b] of pairs) {
    const rows = buildAlignedRows(a, b)
    assert.deepEqual(reconstruct(rows, 'left'), a)
    assert.deepEqual(reconstruct(rows, 'right'), b)
    for (const side of ['left', 'right']) {
      assert.deepEqual(rows.filter(row => row[side]).map(row => row[side].number),
        rows.filter(row => row[side]).map((_, i) => i + 1))
    }
  }
})

test('ignores object key order but compares arrays by index', () => {
  assert.ok(buildAlignedRows({ b: 2, a: 1 }, { a: 1, b: 2 }).every(row => !row.kind))
  assert.equal(buildAlignedRows([1, 2], [2, 1]).filter(row => row.kind === 'changed').length, 2)
})

test('folding retains changed rows and three lines of surrounding context', () => {
  const a = Array.from({ length: 40 }, (_, i) => i)
  const b = [...a]; b[20] = 100
  const rows = buildAlignedRows(a, b)
  const visible = foldUnchanged(rows)
  const changedIndex = rows.findIndex(row => row.kind)
  const shown = visible.filter(row => row.type === 'line').map(row => row.index)
  assert.deepEqual(shown, Array.from({ length: 7 }, (_, i) => changedIndex - 3 + i))
  assert.equal(visible.filter(row => row.type === 'fold').length, 2)
  const all = visible.flatMap(row => row.type === 'line' ? [row.index] : Array.from({ length: row.end - row.start }, (_, i) => row.start + i))
  assert.deepEqual(all, rows.map((_, i) => i))
})

test('character highlighting isolates replacements and handles empty spans', () => {
  assert.deepEqual(changedSpan('"name": "Alex",', '"name": "Alexander",'), [13, 13])
  assert.deepEqual(changedSpan('abc123xyz', 'abc456xyz'), [3, 6])
  assert.deepEqual(changedSpan('same', 'same'), [4, 4])
  assert.deepEqual(changedSpan('', 'value'), [0, 0])
})
