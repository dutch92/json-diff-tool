# UX Clarity Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the existing JSON diff UI clearer by adding color meaning, current-diff context, safer reset behavior, localized labels, and non-overlapping navigation.

**Architecture:** Keep the current React component structure. Add small pure helpers for user-facing parse messages and reset confirmation, then pass active diff path into the summary/navigation UI. Move `DiffNavigator` into normal layout flow through CSS and component props instead of introducing a new command bar.

**Tech Stack:** React 19, TypeScript, Vite, CSS modules-by-file, existing `npm run build` and `npm run lint` checks.

---

### Task 1: User Message Helpers

**Files:**
- Create: `src/lib/json/userMessages.ts`
- Create: `tests/userMessages.test.mjs`
- Modify: `package.json`

- [ ] **Step 1: Write failing tests**

Create `tests/userMessages.test.mjs` with:

```js
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
    '--target',
    'ES2023',
    '--module',
    'ES2022',
    '--moduleResolution',
    'bundler',
    '--outDir',
    outDir,
    '--skipLibCheck',
  ],
  { stdio: 'inherit' },
)

const compiled = readFileSync(join(outDir, 'userMessages.js'), 'utf8')
const dataUrl = `data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`
const { formatJsonParseError, shouldConfirmExampleReset } = await import(dataUrl)

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
```

- [ ] **Step 2: Add a test script**

Modify `package.json` scripts to include:

```json
"test": "node --test tests/*.test.mjs"
```

- [ ] **Step 3: Run tests and verify RED**

Run: `npm test`

Expected: FAIL because `src/lib/json/userMessages.ts` does not exist or does not export the tested functions.

- [ ] **Step 4: Implement minimal helper code**

Create `src/lib/json/userMessages.ts`:

```ts
const lineColumnPattern = /\(line (\d+) column (\d+)\)/

const parserMessageTranslations: [RegExp, string][] = [
  [/Expected property name or '\}'/i, 'ожидалось имя свойства'],
  [/Unexpected end of JSON input/i, 'неожиданный конец JSON'],
  [/Unexpected token/i, 'неожиданный символ'],
]

export function formatJsonParseError(message: string) {
  const location = message.match(lineColumnPattern)
  const translatedMessage =
    parserMessageTranslations.find(([pattern]) => pattern.test(message))?.[1] ??
    message

  if (!location) {
    return `Ошибка JSON: ${translatedMessage}.`
  }

  return `Ошибка JSON: ${translatedMessage}. Строка ${location[1]}, колонка ${location[2]}.`
}

export function shouldConfirmExampleReset(leftVersion: number, rightVersion: number) {
  return leftVersion > 0 || rightVersion > 0
}
```

- [ ] **Step 5: Run tests and verify GREEN**

Run: `npm test`

Expected: PASS.

### Task 2: Summary and Navigation Data

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/SummaryPanel/SummaryPanel.tsx`
- Modify: `src/components/DiffNavigator/DiffNavigator.tsx`

- [ ] **Step 1: Update `SummaryPanel` props**

Add `activeDiffPath?: string` to `SummaryPanelProps`, and render a path metric when present:

```tsx
{activeDiffPath ? (
  <div className="summary-panel__metric summary-panel__metric-path">
    <span>Текущее отличие</span>
    <strong>{activeDiffPath.replace(/^root\./, '')}</strong>
  </div>
) : null}
```

Change status text to:

```tsx
<strong>{canCompare ? 'Сравнение обновлено' : 'Исправьте JSON'}</strong>
```

Change theme labels in `App.tsx` to:

```ts
const themes: { value: Theme; label: string }[] = [
  { value: 'productive', label: 'Рабочая' },
  { value: 'calm', label: 'Спокойная' },
  { value: 'console', label: 'Консоль' },
]
```

- [ ] **Step 2: Update `DiffNavigator` props**

Add `activeDiffPath?: string` and render a compact path:

```tsx
{activeDiffPath ? (
  <span className="diff-navigator__path">{activeDiffPath.replace(/^root\./, '')}</span>
) : null}
```

- [ ] **Step 3: Wire active path through `App`**

Pass `activeDiffPath={activeDiffPath}` to both `SummaryPanel` and `DiffNavigator`.

- [ ] **Step 4: Verify TypeScript**

Run: `npm run build`

Expected: PASS.

### Task 3: Legend and Non-Floating Navigator Styling

**Files:**
- Modify: `src/components/SummaryPanel/SummaryPanel.tsx`
- Modify: `src/components/SummaryPanel/SummaryPanel.css`
- Modify: `src/components/DiffNavigator/DiffNavigator.css`
- Modify: `src/App.css`

- [ ] **Step 1: Add legend markup**

In `SummaryPanel`, render:

```tsx
<div className="summary-panel__legend" aria-label="Легенда отличий">
  <span><i className="summary-panel__swatch is-added" />Добавлено</span>
  <span><i className="summary-panel__swatch is-removed" />Удалено</span>
  <span><i className="summary-panel__swatch is-changed" />Изменено</span>
  <span><i className="summary-panel__swatch is-active" />Текущее</span>
</div>
```

- [ ] **Step 2: Style the legend and path metric**

Add CSS that keeps the legend compact, wrapping, and based on existing CSS variables:

```css
.summary-panel__legend {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 12px;
  color: var(--text);
  font-size: 0.76rem;
}

.summary-panel__legend span {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.summary-panel__swatch {
  width: 11px;
  height: 11px;
  border-radius: 3px;
  border-left: 3px solid transparent;
}
```

- [ ] **Step 3: Remove fixed navigator positioning**

Change `.diff-navigator` from `position: fixed` to normal flow:

```css
.diff-navigator {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 8px;
  width: fit-content;
  max-width: 100%;
  margin: -4px auto 0;
  padding: 7px 9px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--panel);
  box-shadow: var(--surface-shadow);
}
```

Remove the `@media (max-width: 1420px)` fixed-position override.

- [ ] **Step 4: Verify responsive layout manually**

Run the app and inspect `1280x720` and `390x844`. Expected: navigator appears between summary and workspace and does not cover JSON content.

### Task 4: Localized Errors and Safer Reset

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/JsonViewer/JsonViewer.tsx`

- [ ] **Step 1: Use helper functions**

Import in `App.tsx`:

```ts
import { shouldConfirmExampleReset } from './lib/json/userMessages'
```

Rename reset button to `Сбросить к примеру` and guard it:

```tsx
onClick={() => {
  const shouldConfirm = shouldConfirmExampleReset(leftJson.version, rightJson.version)

  if (
    shouldConfirm &&
    !window.confirm('Сбросить оба JSON к примеру? Текущий ввод будет заменен.')
  ) {
    return
  }

  setLeftText(formatJson(leftExample))
  setRightText(formatJson(rightExample))
}}
```

Import in `JsonViewer.tsx`:

```ts
import { formatJsonParseError } from '../../lib/json/userMessages'
```

Render status with:

```tsx
{visibleFileError ?? (parsed.error ? formatJsonParseError(parsed.error) : 'JSON валиден')}
```

- [ ] **Step 2: Run focused tests**

Run: `npm test`

Expected: PASS.

- [ ] **Step 3: Run full verification**

Run: `npm run lint`

Expected: PASS.

Run: `npm run build`

Expected: PASS.

### Task 5: Browser Verification

**Files:**
- No code changes.

- [ ] **Step 1: Start dev server**

Run: `npm run dev -- --host 127.0.0.1`

Expected: Vite serves the app at `http://127.0.0.1:5173/json-diff-tool/`.

- [ ] **Step 2: Check desktop UI**

Open the app at `1280x720`. Expected:

- Theme labels are Russian.
- Summary says `Сравнение обновлено`.
- Legend is visible.
- Current diff path is visible.
- Navigator is not floating over JSON.

- [ ] **Step 3: Check invalid JSON UI**

Edit the left JSON to `{ invalid json`.

Expected:

- Status changes to `Исправьте JSON`.
- Error is localized and includes line/column.
- Format button is disabled.

- [ ] **Step 4: Check mobile UI**

Set viewport to `390x844`.

Expected:

- Navigator stays in normal flow.
- No overlay covers JSON rows.
- Legend wraps without horizontal page overflow.

- [ ] **Step 5: Stop dev server**

Stop the Vite process after verification.
