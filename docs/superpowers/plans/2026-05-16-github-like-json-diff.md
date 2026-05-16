# GitHub-Like JSON Diff Viewer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render JSON tree view as a GitHub-like diff block with visible row numbers, marker column, full-row diff highlighting, and collapsible container rows.

**Architecture:** Keep `JsonTree` as the owner of tree rendering, collapse state, active diff expansion, and primitive editing. Introduce a reusable row layout inside `JsonTree.tsx` and assign visual line numbers with a render-pass counter. Replace the old left-border rail CSS with a grid row layout in `JsonViewer.css`.

**Tech Stack:** React 19, TypeScript, CSS, Node test runner, Vite build.

---

## File Structure

- Modify `tests/diffMarkerLayout.test.mjs`: replace old colored rail assertions with GitHub-like row/grid contract assertions.
- Modify `src/components/JsonViewer/JsonTree.tsx`: add visual line numbering, a row component, per-depth indentation, and closing-row numbering.
- Modify `src/components/JsonViewer/JsonViewer.css`: replace `.json-node` rail styles with `.json-tree`, `.json-node`, `.json-node__line-number`, `.json-node__marker`, and `.json-node__content` grid styles.

---

### Task 1: Update CSS Layout Contract Test

**Files:**
- Modify: `tests/diffMarkerLayout.test.mjs`

- [ ] **Step 1: Replace the old rail test with a failing GitHub-like grid test**

Replace the full contents of `tests/diffMarkerLayout.test.mjs` with:

```js
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
```

- [ ] **Step 2: Run the focused test and confirm it fails**

Run:

```bash
npm test -- tests/diffMarkerLayout.test.mjs
```

Expected: FAIL because `.json-tree`, `--json-line-number-width`, and the grid row layout do not exist yet.

- [ ] **Step 3: Commit the failing test**

Run:

```bash
git add tests/diffMarkerLayout.test.mjs
git commit -m "test: specify GitHub-like JSON diff rows"
```

---

### Task 2: Refactor JsonTree to Render Numbered Rows

**Files:**
- Modify: `src/components/JsonViewer/JsonTree.tsx`

- [ ] **Step 1: Add React type imports plus line-number and depth props**

Update the first import in `src/components/JsonViewer/JsonTree.tsx` to include the type imports used by `JsonRow`:

```ts
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from 'react'
```

Update `JsonNodeProps` in `src/components/JsonViewer/JsonTree.tsx` to include:

```ts
  depth: number
  getNextLineNumber: () => number
```

- [ ] **Step 2: Add a shared row component**

Add this type and component below `JsonNodeProps`:

```tsx
type JsonRowProps = {
  children: ReactNode
  className: string
  depth: number
  lineNumber: number
  marker: ReturnType<typeof getDiffMarker> | null
  nodeRef?: RefObject<HTMLDivElement | null>
}

function JsonRow({ children, className, depth, lineNumber, marker, nodeRef }: JsonRowProps) {
  return (
    <div ref={nodeRef} className={className}>
      <span className="json-node__line-number" aria-hidden="true">
        {lineNumber}
      </span>
      <span className="json-node__marker" aria-label={marker?.label ?? undefined}>
        {marker?.symbol ?? ''}
      </span>
      <span
        className="json-node__content"
        style={{ '--json-node-depth': depth } as CSSProperties}
      >
        {children}
      </span>
    </div>
  )
}
```

- [ ] **Step 3: Update primitive rendering to use JsonRow**

Inside `JsonNode`, create a line number before the primitive branch:

```ts
  const lineNumber = getNextLineNumber()
```

Replace the primitive branch wrapper with:

```tsx
    return (
      <JsonRow
        nodeRef={nodeRef}
        className={`json-node${statusClass}${activeClass}`}
        depth={depth}
        lineNumber={lineNumber}
        marker={marker}
      >
        {label ? <span className="json-key">{JSON.stringify(label)}: </span> : null}
        {isEditingValue ? (
          <span className="json-node__edit-wrap">
            <input
              ref={editInputRef}
              className="json-node__edit-input"
              aria-label={`${label ?? path}: JSON-значение`}
              value={draftValue}
              onBlur={applyEditingValue}
              onChange={(event) => {
                setDraftValue(event.target.value)
                setEditError(null)
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  applyEditingValue()
                }

                if (event.key === 'Escape') {
                  event.preventDefault()
                  cancelEditingValue()
                }
              }}
            />
            {editError ? <span className="json-node__edit-error">{editError}</span> : null}
          </span>
        ) : (
          <button
            className={`json-node__value ${getValueClassName(value)}`.trim()}
            type="button"
            aria-label={`Редактировать ${label ?? path}`}
            onClick={startEditingValue}
          >
            {formatPrimitive(value)}
          </button>
        )}
      </JsonRow>
    )
```

This preserves the existing edit input, blur, Enter/Escape, and `onChangeValue` behavior inside the row children.

- [ ] **Step 4: Update container opening and closing rows**

In the container branch, render the opening row with `JsonRow`:

```tsx
    <div className="json-node__group">
      <JsonRow
        nodeRef={nodeRef}
        className={`json-node${statusClass}${activeClass}`}
        depth={depth}
        lineNumber={lineNumber}
        marker={marker}
      >
        <button
          className="json-node__toggle"
          type="button"
          aria-expanded={!isCollapsed}
          onClick={() => onTogglePath(path)}
        >
          <svg
            className="json-node__chevron"
            viewBox="0 0 16 16"
            aria-hidden="true"
          >
            <path d="M5.75 3.5 10.25 8l-4.5 4.5" />
          </svg>
          {label ? <span className="json-key">{JSON.stringify(label)}: </span> : null}
          <span>{opening}</span>
          {isCollapsed ? (
            <>
              <span className="json-node__ellipsis">...</span>
              <span>{closing}</span>
              {isArray ? (
                <span className="json-node__meta">{getArrayLabel(value.length)}</span>
              ) : null}
            </>
          ) : null}
        </button>
      </JsonRow>

      {!isCollapsed ? (
        <>
          <div className="json-node__children">
            {entries.map(([key, childValue]) => (
              <JsonNode
                key={String(key)}
                label={typeof key === 'string' ? key : undefined}
                path={joinPath(path, key)}
                value={childValue}
                diffStatuses={diffStatuses}
                activePath={activePath}
                collapsedPaths={collapsedPaths}
                expandedPaths={expandedPaths}
                depth={depth + 1}
                getNextLineNumber={getNextLineNumber}
                onChangeValue={onChangeValue}
                onTogglePath={onTogglePath}
              />
            ))}
          </div>
          <JsonRow
            className="json-node json-node__closing"
            depth={depth}
            lineNumber={getNextLineNumber()}
            marker={null}
          >
            {closing}
          </JsonRow>
        </>
      ) : null}
    </div>
```

- [ ] **Step 5: Pass root depth and the render-pass counter**

In `JsonTree`, add a counter before `handleTogglePath`:

```ts
  let lineNumber = 0
  const getNextLineNumber = () => {
    lineNumber += 1
    return lineNumber
  }
```

Wrap the root in a tree container and pass the new props:

```tsx
  return (
    <div className="json-tree">
      <JsonNode
        path="root"
        value={value}
        diffStatuses={diffStatuses}
        activePath={activePath}
        collapsedPaths={collapsedPaths}
        expandedPaths={expandedPaths}
        depth={0}
        getNextLineNumber={getNextLineNumber}
        onChangeValue={onChangeValue}
        onTogglePath={handleTogglePath}
      />
    </div>
  )
```

- [ ] **Step 6: Run TypeScript check and confirm it fails on CSS-only expectations if code compiles**

Run:

```bash
npm run build
```

Expected: PASS for TypeScript after all props and imports are correct. If it fails, fix only TypeScript errors in `JsonTree.tsx`.

- [ ] **Step 7: Commit the JsonTree refactor**

Run:

```bash
git add src/components/JsonViewer/JsonTree.tsx
git commit -m "feat: render JSON tree as numbered rows"
```

---

### Task 3: Replace Rail CSS with GitHub-Like Row Styling

**Files:**
- Modify: `src/components/JsonViewer/JsonViewer.css`

- [ ] **Step 1: Replace `.json-node` and marker layout styles**

In `src/components/JsonViewer/JsonViewer.css`, replace the existing `.json-node` through `.json-node__children` layout block with:

```css
.json-tree {
  --json-line-number-width: 44px;
  --json-marker-width: 24px;
  --json-indent-width: 20px;

  min-width: max-content;
}

.json-node__group {
  display: contents;
}

.json-node {
  display: grid;
  grid-template-columns: var(--json-line-number-width) var(--json-marker-width) minmax(max-content, 1fr);
  min-height: 1.55em;
  margin-inline: -14px;
  white-space: nowrap;
}

.json-node__line-number {
  padding-inline: 8px;
  border-right: 1px solid var(--border);
  background: var(--panel-soft);
  color: var(--text);
  font-variant-numeric: tabular-nums;
  text-align: right;
  user-select: none;
}

.json-node__marker {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 100%;
  border: 0;
  border-radius: 0;
  color: var(--panel-strong);
  font-family: var(--mono);
  font-size: 0.7rem;
  font-style: normal;
  font-weight: 700;
  line-height: 1;
  user-select: none;
}

.json-node__content {
  min-width: 0;
  padding-inline: calc(8px + (var(--json-node-depth) * var(--json-indent-width))) 12px;
}

.json-node__children {
  display: contents;
}
```

Keep the existing `.json-node__toggle`, `.json-node__value`, edit input, chevron, ellipsis, meta, and JSON token color rules.

- [ ] **Step 2: Update diff status styles**

Replace the old `.json-node-added`, `.json-node-removed`, `.json-node-changed`, and marker child rules with:

```css
.json-node-added {
  background: var(--success-soft);
}

.json-node-added > .json-node__marker {
  background: var(--success);
}

.json-node-removed {
  background: var(--danger-soft);
}

.json-node-removed > .json-node__marker {
  background: var(--danger);
}

.json-node-changed {
  background: var(--warning-soft);
}

.json-node-changed > .json-node__marker {
  background: var(--warning);
}

.json-node-active {
  box-shadow:
    inset 0 0 0 1px var(--accent),
    0 0 0 3px var(--accent-soft);
  background: var(--accent-soft);
}
```

- [ ] **Step 3: Run the focused layout test**

Run:

```bash
npm test -- tests/diffMarkerLayout.test.mjs
```

Expected: PASS.

- [ ] **Step 4: Commit CSS update**

Run:

```bash
git add src/components/JsonViewer/JsonViewer.css
git commit -m "style: add GitHub-like JSON diff rows"
```

---

### Task 4: Full Verification and Visual Smoke Test

**Files:**
- No planned code changes. Fix only regressions found by verification.

- [ ] **Step 1: Run all automated checks**

Run:

```bash
npm test
npm run build
```

Expected: both commands PASS.

- [ ] **Step 2: Start the dev server**

Run:

```bash
npm run dev
```

Expected: Vite prints a local URL such as `http://localhost:5173/`.

- [ ] **Step 3: Smoke test in browser**

Open the dev server URL. Paste two valid JSON objects with at least one changed primitive and one nested object. Switch both sides to `Показать дерево`. Confirm:

- line numbers are visible on every displayed row;
- diff marker column shows `+`, `-`, or `~` for changed paths;
- nested objects can collapse and show `{ ... }` or `[ ... ]`;
- primitive values remain editable by click;
- previous/next diff navigation scrolls to the active row.

- [ ] **Step 4: Commit any verification fixes**

If fixes were needed, run:

```bash
git add src/components/JsonViewer/JsonTree.tsx src/components/JsonViewer/JsonViewer.css tests/diffMarkerLayout.test.mjs
git commit -m "fix: polish JSON diff row viewer"
```

Skip this commit if no fixes were needed.
