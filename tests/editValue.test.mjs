import assert from 'node:assert/strict'
import test from 'node:test'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const outDir = join(tmpdir(), 'json-diff-tool-edit-value-tests')

execFileSync(
  'npx',
  [
    'tsc',
    'src/lib/json/editValue.ts',
    '--target',
    'ES2023',
    '--module',
    'ES2022',
    '--moduleResolution',
    'bundler',
    '--outDir',
    outDir,
    '--skipLibCheck',
    '--ignoreConfig',
  ],
  { stdio: 'inherit' },
)

const compiled = readFileSync(join(outDir, 'editValue.js'), 'utf8')
const dataUrl = `data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`
const { parseJsonLiteral, updateJsonValueAtPath } = await import(dataUrl)

test('parses inline JSON literals with their intended type', () => {
  assert.deepEqual(parseJsonLiteral('123'), { isValid: true, value: 123 })
  assert.deepEqual(parseJsonLiteral('"123"'), { isValid: true, value: '123' })
  assert.deepEqual(parseJsonLiteral('true'), { isValid: true, value: true })
  assert.deepEqual(parseJsonLiteral('null'), { isValid: true, value: null })
})

test('reports invalid inline JSON literal input', () => {
  const result = parseJsonLiteral('hello')

  assert.equal(result.isValid, false)
  assert.equal(result.value, null)
  assert.equal(typeof result.error, 'string')
})

test('updates a nested object value without mutating the original JSON', () => {
  const original = { profile: { age: '42', name: 'Ada' } }
  const updated = updateJsonValueAtPath(original, 'root.profile.age', 42)

  assert.deepEqual(updated, { profile: { age: 42, name: 'Ada' } })
  assert.deepEqual(original, { profile: { age: '42', name: 'Ada' } })
})

test('updates array values and can replace the root value', () => {
  assert.deepEqual(updateJsonValueAtPath({ items: ['1'] }, 'root.items[0]', 1), { items: [1] })
  assert.equal(updateJsonValueAtPath('1', 'root', 1), 1)
})
