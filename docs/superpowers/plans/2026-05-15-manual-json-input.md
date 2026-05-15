# Manual JSON Input Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a unified JSON panel surface where users can view diffs, switch into manual editing, paste JSON, and drop JSON files without separate upload and text-entry areas.

**Architecture:** Keep `App.tsx` as the owner of the left/right JSON strings and parsing flow. Expand `JsonViewer` into a small modeful component with local `view`/`edit`, drag-over, and file-read error state while delegating text updates back through `onChangeText`. Preserve the existing tree renderer and formatting/parser utilities.

**Tech Stack:** React 19, TypeScript, Vite, existing CSS modules-by-file, native browser File and Clipboard APIs.

---

## File Structure

- Modify `src/App.tsx`: pass `onChangeText` into each `JsonViewer`; keep file-content normalization in a helper used by both file picker and drop handling.
- Modify `src/components/JsonViewer/JsonViewer.tsx`: add mode toggle, textarea edit surface, paste/drop handling, drag-over state, local file-read error, and `onChangeText` prop.
- Modify `src/components/JsonViewer/JsonViewer.css`: style the edit textarea, unified surface drag state, mode controls, and responsive wrapping.
- Modify `README.md`: update the feature list to mention manual paste/edit and drag-and-drop JSON loading.

## Task 1: Add Text Update Contract

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/JsonViewer/JsonViewer.tsx`

- [ ] **Step 1: Update `JsonViewerProps` with the new callback**

In `src/components/JsonViewer/JsonViewer.tsx`, change the props type to include:

```tsx
type JsonViewerProps = {
  kicker: string
  text: string
  diffStatuses: Map<string, DiffKind>
  activePath?: string
  parsed: ParseResult
  onChangeText: (value: string) => void
  onFormat: () => void
  onLoadFile: (event: ChangeEvent<HTMLInputElement>) => void
}
```

Update the destructuring signature:

```tsx
export function JsonViewer({
  kicker,
  text,
  diffStatuses,
  activePath,
  parsed,
  onChangeText,
  onFormat,
  onLoadFile,
}: JsonViewerProps) {
```

- [ ] **Step 2: Pass the callback from `App.tsx`**

In `src/App.tsx`, update the left viewer:

```tsx
<JsonViewer
  kicker="Левый JSON"
  text={leftText}
  diffStatuses={leftDiffStatuses}
  activePath={activeDiffPath}
  parsed={leftParsed}
  onChangeText={setLeftText}
  onFormat={() => formatSide(leftText, setLeftText)}
  onLoadFile={createFileLoader(setLeftText)}
/>
```

Update the right viewer:

```tsx
<JsonViewer
  kicker="Правый JSON"
  text={rightText}
  diffStatuses={rightDiffStatuses}
  activePath={activeDiffPath}
  parsed={rightParsed}
  onChangeText={setRightText}
  onFormat={() => formatSide(rightText, setRightText)}
  onLoadFile={createFileLoader(setRightText)}
/>
```

- [ ] **Step 3: Run TypeScript build to verify the contract**

Run: `npm run build`

Expected: PASS. The app should compile with the new required prop supplied for both viewers.

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx src/components/JsonViewer/JsonViewer.tsx
git commit -m "Add JSON viewer text update contract"
```

## Task 2: Add View/Edit Mode

**Files:**
- Modify: `src/components/JsonViewer/JsonViewer.tsx`
- Modify: `src/components/JsonViewer/JsonViewer.css`

- [ ] **Step 1: Import `useState`**

Change the React import in `src/components/JsonViewer/JsonViewer.tsx`:

```tsx
import { useId, useState, type ChangeEvent } from 'react'
```

- [ ] **Step 2: Add local mode state**

Inside `JsonViewer`, after `const inputId = useId()`, add:

```tsx
const [mode, setMode] = useState<'view' | 'edit'>('view')
const isEditing = mode === 'edit'
```

- [ ] **Step 3: Add the mode toggle action**

Inside `.json-viewer__actions`, before the file button, add:

```tsx
<Button
  onClick={() => {
    setMode((currentMode) => (currentMode === 'view' ? 'edit' : 'view'))
  }}
>
  {isEditing ? 'Показать дерево' : 'Редактировать'}
</Button>
```

- [ ] **Step 4: Render textarea in edit mode**

Replace the current `.json-viewer__surface` contents with this conditional structure:

```tsx
<div className="json-viewer__surface" tabIndex={0} aria-label={kicker}>
  {isEditing ? (
    <textarea
      className="json-viewer__editor"
      aria-label={`${kicker}: исходный JSON`}
      spellCheck={false}
      value={text}
      onChange={(event) => onChangeText(event.target.value)}
    />
  ) : parsed.isValid ? (
    <JsonTree
      value={parsed.value}
      diffStatuses={diffStatuses}
      activePath={activePath}
    />
  ) : (
    <pre
      className="json-viewer__raw"
      dangerouslySetInnerHTML={{ __html: highlightJsonText(text) }}
    />
  )}
</div>
```

- [ ] **Step 5: Add editor styles**

In `src/components/JsonViewer/JsonViewer.css`, after `.json-viewer__surface`, add:

```css
.json-viewer__editor {
  display: block;
  width: 100%;
  min-height: 100%;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  line-height: inherit;
  resize: none;
  outline: none;
}
```

Update `.json-viewer__surface` so textarea height is stable by adding:

```css
  display: flex;
  flex-direction: column;
```

- [ ] **Step 6: Run build**

Run: `npm run build`

Expected: PASS. Edit mode compiles and preserves tree mode.

- [ ] **Step 7: Commit**

```bash
git add src/components/JsonViewer/JsonViewer.tsx src/components/JsonViewer/JsonViewer.css
git commit -m "Add JSON viewer edit mode"
```

## Task 3: Add Unified Paste Handling

**Files:**
- Modify: `src/components/JsonViewer/JsonViewer.tsx`

- [ ] **Step 1: Import clipboard event type**

Change the React import:

```tsx
import { useId, useState, type ChangeEvent, type ClipboardEvent } from 'react'
```

- [ ] **Step 2: Add a paste handler**

Inside `JsonViewer`, below the mode state, add:

```tsx
const handleSurfacePaste = (event: ClipboardEvent<HTMLDivElement>) => {
  if (event.target instanceof HTMLTextAreaElement) {
    return
  }

  const pastedText = event.clipboardData.getData('text')

  if (!pastedText.trim()) {
    return
  }

  event.preventDefault()
  onChangeText(pastedText)
  setMode('edit')
}
```

- [ ] **Step 3: Wire paste to the surface**

Update the surface opening tag:

```tsx
<div
  className="json-viewer__surface"
  tabIndex={0}
  aria-label={kicker}
  onPaste={handleSurfacePaste}
>
```

- [ ] **Step 4: Run build**

Run: `npm run build`

Expected: PASS. Pasting on the focused surface replaces that side's JSON and switches to edit mode.

- [ ] **Step 5: Commit**

```bash
git add src/components/JsonViewer/JsonViewer.tsx
git commit -m "Add paste handling to JSON panels"
```

## Task 4: Add Drag-and-Drop File Loading

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/JsonViewer/JsonViewer.tsx`
- Modify: `src/components/JsonViewer/JsonViewer.css`

- [ ] **Step 1: Normalize file loading through a reusable helper**

In `src/App.tsx`, replace `createFileLoader` with:

```tsx
const readJsonFile = async (file: File, setText: (value: string) => void) => {
  const content = await file.text()
  const parsed = parseInput(content)

  setText(parsed.isValid ? formatJson(parsed.value) : content)
}

const createFileLoader =
  (setText: (value: string) => void) =>
  async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    await readJsonFile(file, setText)
    event.target.value = ''
  }
```

Add a new callback prop to the left viewer:

```tsx
onLoadDroppedFile={(file) => readJsonFile(file, setLeftText)}
```

Add a new callback prop to the right viewer:

```tsx
onLoadDroppedFile={(file) => readJsonFile(file, setRightText)}
```

- [ ] **Step 2: Add the new prop and drag event imports**

In `src/components/JsonViewer/JsonViewer.tsx`, change the import:

```tsx
import {
  useId,
  useState,
  type ChangeEvent,
  type ClipboardEvent,
  type DragEvent,
} from 'react'
```

Add the prop:

```tsx
onLoadDroppedFile: (file: File) => Promise<void>
```

Destructure it:

```tsx
onLoadDroppedFile,
```

- [ ] **Step 3: Add drag and file error state**

Inside `JsonViewer`, below `isEditing`, add:

```tsx
const [isDraggingFile, setIsDraggingFile] = useState(false)
const [fileError, setFileError] = useState<string | null>(null)
```

- [ ] **Step 4: Add drag/drop handlers**

Inside `JsonViewer`, below `handleSurfacePaste`, add:

```tsx
const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
  event.preventDefault()
  setIsDraggingFile(true)
}

const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
  if (event.currentTarget.contains(event.relatedTarget as Node | null)) {
    return
  }

  setIsDraggingFile(false)
}

const handleDrop = async (event: DragEvent<HTMLDivElement>) => {
  event.preventDefault()
  setIsDraggingFile(false)

  const file = event.dataTransfer.files[0]

  if (!file) {
    return
  }

  try {
    await onLoadDroppedFile(file)
    setFileError(null)
    setMode('edit')
  } catch {
    setFileError('Не удалось прочитать файл')
  }
}
```

- [ ] **Step 5: Wire drag/drop to the surface and class name**

Replace the surface opening tag with:

```tsx
<div
  className={`json-viewer__surface ${isDraggingFile ? 'is-dragging-file' : ''}`.trim()}
  tabIndex={0}
  aria-label={kicker}
  onPaste={handleSurfacePaste}
  onDragOver={handleDragOver}
  onDragLeave={handleDragLeave}
  onDrop={handleDrop}
>
```

- [ ] **Step 6: Show file read errors**

Replace the status paragraph contents:

```tsx
<p className={`json-viewer__status ${parsed.error || fileError ? 'is-error' : 'is-ok'}`}>
  {fileError ?? parsed.error ?? 'JSON валиден'}
</p>
```

- [ ] **Step 7: Add drag styles**

In `src/components/JsonViewer/JsonViewer.css`, after `.json-viewer__surface:focus-visible`, add:

```css
.json-viewer__surface.is-dragging-file {
  border-color: var(--accent);
  background:
    linear-gradient(rgba(15, 118, 110, 0.08), rgba(15, 118, 110, 0.08)),
    var(--input-bg);
}
```

- [ ] **Step 8: Run build**

Run: `npm run build`

Expected: PASS. File picker and drag-and-drop use the same normalization behavior.

- [ ] **Step 9: Commit**

```bash
git add src/App.tsx src/components/JsonViewer/JsonViewer.tsx src/components/JsonViewer/JsonViewer.css
git commit -m "Add drag and drop JSON loading"
```

## Task 5: Polish Unified Surface and Documentation

**Files:**
- Modify: `src/components/JsonViewer/JsonViewer.tsx`
- Modify: `src/components/JsonViewer/JsonViewer.css`
- Modify: `README.md`

- [ ] **Step 1: Add subtle helper text**

In `src/components/JsonViewer/JsonViewer.tsx`, between the surface and status paragraph, add:

```tsx
<p className="json-viewer__hint">
  {isEditing
    ? 'Вставьте JSON вручную или перетащите .json файл в эту область'
    : 'Сфокусируйте область и вставьте JSON или перетащите .json файл'}
</p>
```

- [ ] **Step 2: Add hint and mobile action styles**

In `src/components/JsonViewer/JsonViewer.css`, after `.json-viewer__status`, add:

```css
.json-viewer__hint {
  margin: -6px 0 0;
  color: var(--text);
  font-size: 0.78rem;
}
```

Inside the existing `@media (max-width: 980px)` block, update `.json-viewer__actions`:

```css
  .json-viewer__actions {
    flex-wrap: wrap;
    justify-content: flex-start;
  }
```

- [ ] **Step 3: Update README feature bullets**

In `README.md`, replace:

```md
- Upload JSON files for the left and right side.
- Format valid JSON with stable key ordering.
```

with:

```md
- Paste or edit JSON directly in either side panel.
- Upload or drag-and-drop JSON files for the left and right side.
- Format valid JSON with stable key ordering.
```

- [ ] **Step 4: Run verification**

Run:

```bash
npm run lint
npm run build
```

Expected: both commands PASS.

- [ ] **Step 5: Start the dev server**

Run: `npm run dev -- --host 127.0.0.1`

Expected: Vite prints a local URL such as `http://127.0.0.1:5173/json-diff-tool/`.

- [ ] **Step 6: Manual browser verification**

In the app browser, verify:

- click `Редактировать` on the left panel, type valid JSON, and confirm the diff updates;
- paste JSON into a focused right panel surface and confirm the right text changes;
- type invalid JSON and confirm the existing parse error appears;
- drag a `.json` file onto one panel and confirm the panel content updates;
- shrink to the mobile breakpoint and confirm buttons and text do not overlap.

- [ ] **Step 7: Commit**

```bash
git add README.md src/components/JsonViewer/JsonViewer.tsx src/components/JsonViewer/JsonViewer.css
git commit -m "Polish manual JSON input experience"
```

## Self-Review Notes

- Spec coverage: view/edit mode is covered in Task 2; paste is covered in Task 3; drag-and-drop and read errors are covered in Task 4; documentation and browser verification are covered in Task 5.
- Placeholder scan: every task has concrete files, code snippets, commands, and expected outcomes.
- Type consistency: `onChangeText(value: string)` and `onLoadDroppedFile(file: File) => Promise<void>` are introduced before use and kept consistent across tasks.
