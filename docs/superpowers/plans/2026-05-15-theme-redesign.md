# Theme Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a polished three-theme visual system to JSON Diff Tool with a header segmented control and persisted theme selection.

**Architecture:** Theme state lives in `App.tsx`, is persisted to `localStorage`, and is applied as `data-theme` on the root app shell. Styling remains CSS-variable driven, with theme palettes defined in `src/index.css` and component CSS consuming semantic variables. The summary panel becomes the compact header that owns brand, metrics, and the theme segmented control.

**Tech Stack:** React 19, TypeScript, Vite, plain CSS modules-by-import convention, browser `localStorage`.

---

## File Structure

- Modify `src/App.tsx`: define theme types, initialize/persist selected theme, pass theme props into `SummaryPanel`, and apply `data-theme`.
- Modify `src/components/SummaryPanel/SummaryPanel.tsx`: render the brand, metrics, and segmented theme control.
- Modify `src/components/SummaryPanel/SummaryPanel.css`: turn the summary panel into a compact modern header with responsive wrapping.
- Modify `src/index.css`: define default typography/base variables, add theme-specific variable sets, remove the old one-note beige background treatment.
- Modify `src/App.css`: make the shell and workspace more compact, theme-aware, and stable across breakpoints.
- Modify `src/components/ui/Button.css`: reduce pill-heavy styling and use theme variables for a tighter tool feel.
- Modify `src/components/ui/Panel.css`: reduce radii, tune panel backgrounds/shadows, and ensure hero/soft panels use variables.
- Modify `src/components/JsonViewer/JsonViewer.css`: make viewer surfaces read as code editors in all themes, tune highlights and focus states.
- Modify `src/components/DiffNavigator/DiffNavigator.css`: make floating navigator match the selected theme and avoid collisions on mobile.

## Task 1: Add Theme State And Header API

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/SummaryPanel/SummaryPanel.tsx`

- [ ] **Step 1: Add the theme model and persistence helpers in `src/App.tsx`**

Add these definitions below the `JsonSideState` type:

```tsx
type Theme = 'productive' | 'calm' | 'console'

const themes: { value: Theme; label: string }[] = [
  { value: 'productive', label: 'Productive' },
  { value: 'calm', label: 'Calm' },
  { value: 'console', label: 'Console' },
]

const themeStorageKey = 'json-diff-tool-theme'

const isTheme = (value: string | null): value is Theme =>
  value === 'productive' || value === 'calm' || value === 'console'

const getInitialTheme = (): Theme => {
  if (typeof window === 'undefined') {
    return 'productive'
  }

  const storedTheme = window.localStorage.getItem(themeStorageKey)

  return isTheme(storedTheme) ? storedTheme : 'productive'
}
```

- [ ] **Step 2: Wire theme state in `App`**

Change the React import to include `useEffect`:

```tsx
import { useEffect, useState } from 'react'
```

Add state inside `App`, before the JSON side states:

```tsx
const [theme, setTheme] = useState<Theme>(getInitialTheme)

useEffect(() => {
  window.localStorage.setItem(themeStorageKey, theme)
}, [theme])
```

Update the root element:

```tsx
<main className="app-shell" data-theme={theme}>
```

Update the `SummaryPanel` call:

```tsx
<SummaryPanel
  canCompare={canCompare}
  diffCount={diffs.length}
  themes={themes}
  selectedTheme={theme}
  onSelectTheme={setTheme}
/>
```

- [ ] **Step 3: Extend `SummaryPanel` props and render the segmented control**

Replace `src/components/SummaryPanel/SummaryPanel.tsx` with:

```tsx
import { Panel } from '../ui/Panel'
import './SummaryPanel.css'

type ThemeOption = {
  value: string
  label: string
}

type SummaryPanelProps = {
  canCompare: boolean
  diffCount: number
  themes: ThemeOption[]
  selectedTheme: string
  onSelectTheme: (theme: string) => void
}

export function SummaryPanel({
  canCompare,
  diffCount,
  themes,
  selectedTheme,
  onSelectTheme,
}: SummaryPanelProps) {
  return (
    <Panel variant="hero" className="summary-panel">
      <div className="summary-panel__brand">JSON Diff Tool</div>

      <div className="summary-panel__content">
        <div className="summary-panel__metrics" aria-label="Статус сравнения">
          <div className="summary-panel__metric">
            <span>Статус</span>
            <strong>{canCompare ? 'Готово к сравнению' : 'Проверьте JSON'}</strong>
          </div>
          <div className="summary-panel__metric">
            <span>Различий</span>
            <strong>{diffCount}</strong>
          </div>
        </div>

        <div className="theme-switcher" aria-label="Тема интерфейса">
          {themes.map((theme) => (
            <button
              className="theme-switcher__button"
              type="button"
              key={theme.value}
              aria-pressed={theme.value === selectedTheme}
              onClick={() => onSelectTheme(theme.value)}
            >
              {theme.label}
            </button>
          ))}
        </div>
      </div>
    </Panel>
  )
}
```

- [ ] **Step 4: Run the build to expose TypeScript errors**

Run:

```bash
npm run build
```

Expected: it may fail only if a type signature was copied incorrectly. Fix any TypeScript mismatch before moving on. If it passes, continue.

- [ ] **Step 5: Commit Task 1**

```bash
git add src/App.tsx src/components/SummaryPanel/SummaryPanel.tsx
git commit -m "Add theme selection state"
```

## Task 2: Define Theme Variables

**Files:**
- Modify: `src/index.css`

- [ ] **Step 1: Replace the current `:root` variable block in `src/index.css`**

Use this structure for the top of the file:

```css
:root {
  --bg: #f4f7fb;
  --bg-deep: #e7edf6;
  --panel: rgba(255, 255, 255, 0.92);
  --panel-soft: rgba(255, 255, 255, 0.86);
  --panel-strong: #ffffff;
  --input-bg: #ffffff;
  --text: #5b6472;
  --text-strong: #111827;
  --border: rgba(17, 24, 39, 0.13);
  --accent: #2563eb;
  --accent-soft: rgba(37, 99, 235, 0.12);
  --success: #16803d;
  --success-soft: rgba(22, 128, 61, 0.13);
  --danger: #c24135;
  --danger-soft: rgba(194, 65, 53, 0.13);
  --warning: #b7791f;
  --warning-soft: rgba(183, 121, 31, 0.16);
  --json-key: #7c3aed;
  --json-string: #047857;
  --json-number: #b45309;
  --json-boolean: #be185d;
  --json-null: #2563eb;
  --button-bg: rgba(255, 255, 255, 0.78);
  --button-bg-hover: #ffffff;
  --button-border: rgba(17, 24, 39, 0.16);
  --shadow: 0 18px 46px rgba(15, 23, 42, 0.1);
  --surface-shadow: 0 1px 2px rgba(15, 23, 42, 0.06);
  --radius-panel: 16px;
  --radius-control: 10px;

  --sans: "Manrope", "Segoe UI", sans-serif;
  --heading: "Sora", "Segoe UI", sans-serif;
  --mono: "IBM Plex Mono", "SFMono-Regular", monospace;

  color: var(--text);
  background: var(--bg);
  font: 16px/1.5 var(--sans);
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

- [ ] **Step 2: Add theme-specific variable blocks after `:root`**

```css
[data-theme='productive'] {
  --bg: #f4f7fb;
  --bg-deep: #e7edf6;
  --panel: rgba(255, 255, 255, 0.94);
  --panel-soft: rgba(255, 255, 255, 0.9);
  --panel-strong: #ffffff;
  --input-bg: #ffffff;
  --text: #596273;
  --text-strong: #111827;
  --border: rgba(17, 24, 39, 0.13);
  --accent: #2563eb;
  --accent-soft: rgba(37, 99, 235, 0.12);
  --success: #16803d;
  --success-soft: rgba(22, 128, 61, 0.13);
  --danger: #c24135;
  --danger-soft: rgba(194, 65, 53, 0.13);
  --warning: #b7791f;
  --warning-soft: rgba(183, 121, 31, 0.16);
  --json-key: #6d28d9;
  --json-string: #047857;
  --json-number: #b45309;
  --json-boolean: #be185d;
  --json-null: #2563eb;
  --button-bg: rgba(255, 255, 255, 0.78);
  --button-bg-hover: #ffffff;
  --button-border: rgba(17, 24, 39, 0.16);
  --shadow: 0 18px 46px rgba(15, 23, 42, 0.1);
  --surface-shadow: 0 1px 2px rgba(15, 23, 42, 0.06);
}

[data-theme='calm'] {
  --bg: #f7f4ee;
  --bg-deep: #ebe5da;
  --panel: rgba(255, 253, 248, 0.94);
  --panel-soft: rgba(255, 251, 243, 0.88);
  --panel-strong: #fffdf8;
  --input-bg: #fffefa;
  --text: #625f59;
  --text-strong: #22201c;
  --border: rgba(64, 57, 47, 0.14);
  --accent: #0f766e;
  --accent-soft: rgba(15, 118, 110, 0.12);
  --success: #1e8449;
  --success-soft: rgba(30, 132, 73, 0.13);
  --danger: #ba3d38;
  --danger-soft: rgba(186, 61, 56, 0.13);
  --warning: #b66a00;
  --warning-soft: rgba(182, 106, 0, 0.15);
  --json-key: #7c3aed;
  --json-string: #0f766e;
  --json-number: #b45309;
  --json-boolean: #be185d;
  --json-null: #2563eb;
  --button-bg: rgba(255, 255, 255, 0.66);
  --button-bg-hover: #fffefa;
  --button-border: rgba(64, 57, 47, 0.16);
  --shadow: 0 18px 44px rgba(69, 44, 17, 0.09);
  --surface-shadow: 0 1px 2px rgba(69, 44, 17, 0.05);
}

[data-theme='console'] {
  --bg: #0f1720;
  --bg-deep: #111827;
  --panel: rgba(20, 29, 42, 0.94);
  --panel-soft: rgba(17, 25, 38, 0.92);
  --panel-strong: #192233;
  --input-bg: #0c121b;
  --text: #aab6c6;
  --text-strong: #eef4ff;
  --border: rgba(148, 163, 184, 0.2);
  --accent: #6ee7b7;
  --accent-soft: rgba(110, 231, 183, 0.14);
  --success: #74d99f;
  --success-soft: rgba(116, 217, 159, 0.16);
  --danger: #ff8a80;
  --danger-soft: rgba(255, 138, 128, 0.16);
  --warning: #f6c177;
  --warning-soft: rgba(246, 193, 119, 0.17);
  --json-key: #c4b5fd;
  --json-string: #6ee7b7;
  --json-number: #fbbf24;
  --json-boolean: #f0abfc;
  --json-null: #93c5fd;
  --button-bg: rgba(30, 41, 59, 0.74);
  --button-bg-hover: rgba(51, 65, 85, 0.9);
  --button-border: rgba(148, 163, 184, 0.24);
  --shadow: none;
  --surface-shadow: none;
}
```

- [ ] **Step 3: Replace global background decoration rules**

Update `body` and remove the old `body::before` grid. Use:

```css
body {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
  background:
    linear-gradient(180deg, var(--bg) 0%, var(--bg-deep) 100%);
}
```

- [ ] **Step 4: Keep typography stable**

Ensure `h1`, `h2`, `.section-kicker`, and media rules remain in the file. If `h1` is unused, do not remove it in this task; avoid unrelated cleanup.

- [ ] **Step 5: Run lint**

```bash
npm run lint
```

Expected: PASS.

- [ ] **Step 6: Commit Task 2**

```bash
git add src/index.css
git commit -m "Define theme design tokens"
```

## Task 3: Style Header And Theme Switcher

**Files:**
- Modify: `src/components/SummaryPanel/SummaryPanel.css`
- Modify: `src/components/ui/Panel.css`

- [ ] **Step 1: Replace `SummaryPanel.css` with compact header styles**

```css
.summary-panel {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 14px;
  border-radius: var(--radius-panel);
}

.summary-panel__brand {
  color: var(--text-strong);
  font-family: var(--heading);
  font-size: 0.92rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  white-space: nowrap;
}

.summary-panel__content {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  min-width: 0;
}

.summary-panel__metrics {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: wrap;
}

.summary-panel__metric {
  display: flex;
  align-items: baseline;
  gap: 7px;
  min-height: 34px;
  padding: 7px 10px;
  border: 1px solid var(--border);
  border-radius: var(--radius-control);
  background: var(--panel-strong);
  box-shadow: var(--surface-shadow);
}

.summary-panel__metric span {
  color: var(--text);
  font-size: 0.76rem;
}

.summary-panel__metric strong {
  color: var(--text-strong);
  font-size: 0.88rem;
}

.theme-switcher {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 3px;
  border: 1px solid var(--border);
  border-radius: calc(var(--radius-control) + 3px);
  background: var(--input-bg);
  box-shadow: var(--surface-shadow);
}

.theme-switcher__button {
  appearance: none;
  min-height: 30px;
  padding: 6px 10px;
  border: 0;
  border-radius: var(--radius-control);
  background: transparent;
  color: var(--text);
  cursor: pointer;
  font-family: var(--mono);
  font-size: 0.78rem;
  line-height: 1;
}

.theme-switcher__button:hover {
  color: var(--text-strong);
  background: var(--accent-soft);
}

.theme-switcher__button:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.theme-switcher__button[aria-pressed='true'] {
  background: var(--accent);
  color: var(--bg);
}

[data-theme='console'] .theme-switcher__button[aria-pressed='true'] {
  color: #071016;
}

@media (max-width: 860px) {
  .summary-panel {
    align-items: flex-start;
    flex-direction: column;
  }

  .summary-panel__content {
    align-items: flex-start;
    flex-direction: column;
    width: 100%;
  }

  .summary-panel__metrics {
    justify-content: flex-start;
  }

  .theme-switcher {
    max-width: 100%;
    overflow-x: auto;
  }
}
```

- [ ] **Step 2: Replace `Panel.css` with theme-aware panel styles**

```css
.ui-panel {
  position: relative;
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: var(--radius-panel);
  background: var(--panel);
  box-shadow: var(--shadow);
}

.ui-panel-soft {
  background: var(--panel-soft);
  box-shadow: var(--surface-shadow);
}

.ui-panel-hero {
  background: var(--panel);
}
```

- [ ] **Step 3: Run lint**

```bash
npm run lint
```

Expected: PASS.

- [ ] **Step 4: Commit Task 3**

```bash
git add src/components/SummaryPanel/SummaryPanel.css src/components/ui/Panel.css
git commit -m "Polish themed app header"
```

## Task 4: Polish Workspace, Buttons, And JSON Viewer

**Files:**
- Modify: `src/App.css`
- Modify: `src/components/ui/Button.css`
- Modify: `src/components/JsonViewer/JsonViewer.css`
- Modify: `src/components/DiffNavigator/DiffNavigator.css`

- [ ] **Step 1: Replace `src/App.css` with compact layout styles**

```css
.app-shell {
  display: grid;
  gap: 18px;
  min-height: 100vh;
  padding: 24px;
  color: var(--text);
}

.workspace-panel {
  padding: 16px;
  border: 1px solid var(--border);
  border-radius: var(--radius-panel);
  background: var(--panel);
  box-shadow: var(--shadow);
}

.workspace-panel__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 14px;
}

.workspace-panel__viewers {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

@media (max-width: 980px) {
  .app-shell {
    padding: 16px;
  }

  .workspace-panel__toolbar {
    align-items: flex-start;
    flex-direction: column;
  }

  .workspace-panel__viewers {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 2: Replace `src/components/ui/Button.css`**

```css
.ui-button {
  appearance: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 36px;
  border: 1px solid var(--button-border);
  background: var(--button-bg);
  color: var(--text-strong);
  border-radius: var(--radius-control);
  padding: 8px 12px;
  cursor: pointer;
  font-family: var(--mono);
  font-size: 0.82rem;
  font-weight: 500;
  line-height: 1;
  transition:
    border-color 0.18s ease,
    background 0.18s ease,
    color 0.18s ease;
  text-decoration: none;
}

.ui-button:hover {
  border-color: var(--accent);
  background: var(--button-bg-hover);
}

.ui-button:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.ui-button:disabled {
  cursor: not-allowed;
  opacity: 0.48;
}
```

- [ ] **Step 3: Update key blocks in `JsonViewer.css`**

Replace the top layout and surface styles with:

```css
.json-viewer {
  display: grid;
  gap: 12px;
  padding: 14px;
}

.json-viewer__head {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 10px;
}

.json-viewer__actions {
  display: flex;
  align-items: center;
  flex: 0 1 auto;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
  max-width: 100%;
}

.json-viewer__surface {
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 430px;
  max-height: 640px;
  padding: 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius-control);
  box-sizing: border-box;
  background: var(--input-bg);
  color: var(--text-strong);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
  font-family: var(--mono);
  font-size: 0.9rem;
  line-height: 1.58;
  overflow: auto;
}
```

Then replace the diff highlight blocks with:

```css
.json-node-added {
  background: var(--success-soft);
  border-left-color: var(--success);
}

.json-node-removed {
  background: var(--danger-soft);
  border-left-color: var(--danger);
}

.json-node-changed {
  background: var(--warning-soft);
  border-left-color: var(--warning);
}

.json-node-active {
  box-shadow:
    inset 0 0 0 1px var(--accent),
    0 0 0 3px var(--accent-soft);
  background: var(--accent-soft);
}
```

Ensure the existing mobile rule keeps:

```css
.json-viewer__surface {
  min-height: 280px;
  max-height: 520px;
}
```

- [ ] **Step 4: Replace `DiffNavigator.css`**

```css
.diff-navigator {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 20;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 7px;
  padding: 7px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--panel);
  box-shadow: var(--shadow);
  backdrop-filter: blur(16px);
}

.diff-navigator__button {
  appearance: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  padding: 0;
  border: 1px solid var(--button-border);
  border-radius: 999px;
  background: var(--button-bg);
  color: var(--accent);
  cursor: pointer;
}

.diff-navigator__button:hover {
  border-color: var(--accent);
  background: var(--button-bg-hover);
}

.diff-navigator__button:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.diff-navigator__button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.diff-navigator__button svg {
  width: 15px;
  height: 15px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.diff-navigator__count {
  min-width: 40px;
  color: var(--text-strong);
  font-family: var(--mono);
  font-size: 0.78rem;
  text-align: center;
}

@media (max-width: 720px) {
  .diff-navigator {
    top: auto;
    right: 12px;
    bottom: 12px;
  }
}
```

- [ ] **Step 5: Run lint**

```bash
npm run lint
```

Expected: PASS.

- [ ] **Step 6: Commit Task 4**

```bash
git add src/App.css src/components/ui/Button.css src/components/JsonViewer/JsonViewer.css src/components/DiffNavigator/DiffNavigator.css
git commit -m "Polish themed workspace surfaces"
```

## Task 5: Verify Theme Behavior In Browser

**Files:**
- No source edits expected unless verification reveals a defect.

- [ ] **Step 1: Run full static verification**

```bash
npm run lint
npm run build
```

Expected: both commands PASS.

- [ ] **Step 2: Start the dev server**

```bash
npm run dev
```

Expected: Vite prints a local URL, usually `http://localhost:5173/`.

- [ ] **Step 3: Browser-check desktop layout**

Open the local Vite URL. At the default desktop viewport, verify:

- Header shows brand, status, diff count, and the three theme buttons.
- `Productive` is active by default on a fresh profile.
- Clicking `Calm` changes the palette without moving core layout.
- Clicking `Console` changes to dark theme and keeps JSON readable.
- Floating diff navigator remains visible and theme-aware.

- [ ] **Step 4: Browser-check persistence**

Select `Console`, reload the page, and verify `Console` remains active.

- [ ] **Step 5: Browser-check narrow layout**

Set a narrow/mobile-like viewport around `390px` wide and verify:

- Header wraps without overlapping text or controls.
- Theme switcher remains usable.
- JSON viewers stack vertically.
- Floating diff navigator sits at the bottom-right and does not cover the theme switcher.

- [ ] **Step 6: Browser-check existing JSON workflows**

Verify:

- Toggle tree/edit mode works.
- Format is disabled only when JSON is invalid.
- Pasting invalid JSON shows the error in every theme.
- `Поменять местами` swaps left and right content.
- `Вернуть пример` restores examples.
- Diff navigation still changes the active highlighted diff.

- [ ] **Step 7: Commit verification fixes if needed**

If browser verification required source changes:

```bash
git add src
git commit -m "Fix theme verification issues"
```

If no source changes were needed, do not create an empty commit.
