import assert from 'node:assert/strict'
import test from 'node:test'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const outDir = join(tmpdir(), 'json-diff-tool-user-message-tests')

execFileSync(
  'npx',
  [
    'tsc',
    'src/lib/json/userMessages.ts',
    'src/lib/json/diffMarkers.ts',
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

const compiled = readFileSync(join(outDir, 'userMessages.js'), 'utf8')
const dataUrl = `data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`
const { formatJsonParseError, shouldConfirmExampleReset } = await import(dataUrl)
const markersCompiled = readFileSync(join(outDir, 'diffMarkers.js'), 'utf8')
const markersDataUrl = `data:text/javascript;base64,${Buffer.from(markersCompiled).toString('base64')}`
const { getDiffMarker } = await import(markersDataUrl)

test('formats JSON parser messages with line and column in Russian', () => {
  assert.equal(
    formatJsonParseError("Expected property name or '}' in JSON at position 2 (line 1 column 3)"),
    "Ошибка JSON: ожидалось имя свойства. Строка 1, колонка 3.",
  )
})

test('keeps useful parser message when line and column are unavailable', () => {
  assert.equal(
    formatJsonParseError('Unexpected end of JSON input'),
    'Ошибка JSON: неожиданный конец JSON.',
  )
})

test('asks for reset confirmation only after user edits', () => {
  assert.equal(shouldConfirmExampleReset(0, 0), false)
  assert.equal(shouldConfirmExampleReset(1, 0), true)
  assert.equal(shouldConfirmExampleReset(0, 2), true)
})

test('returns compact symbols for inline diff markers', () => {
  assert.deepEqual(getDiffMarker('added'), { symbol: '+', label: 'Добавлено' })
  assert.deepEqual(getDiffMarker('removed'), { symbol: '-', label: 'Удалено' })
  assert.deepEqual(getDiffMarker('changed'), { symbol: '~', label: 'Изменено' })
})
