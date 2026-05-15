# JSON Diff Tool Theme Redesign Design

## Goal

Refresh the JSON Diff Tool so it feels like a modern, polished developer utility rather than a rough prototype. The redesign keeps the current diff workflow intact and adds three selectable visual themes:

- `productive`: a clean, compact, professional SaaS-style tool.
- `calm`: a softer light editor style with lower visual pressure.
- `console`: a darker developer-console style with high contrast.

The user can switch between all three themes from the app header.

## Current Context

The app is a Vite React application with component-scoped CSS. Its main surface is `App.tsx`, with `SummaryPanel`, `DiffNavigator`, `JsonViewer`, and shared `Button` / `Panel` components. Styling already depends heavily on CSS custom properties in `src/index.css`, which makes a variable-based theme system the lowest-risk fit.

## UI Structure

The top of the app becomes a compact header area instead of a loose summary card:

- Brand: `JSON Diff Tool`.
- Status metric: valid or invalid JSON state.
- Diff metric: number of detected differences.
- Theme segmented control: `Productive`, `Calm`, `Console`.

The workspace remains a two-column comparison surface on desktop and a stacked layout on smaller screens. The current viewer actions stay available:

- Toggle tree/edit mode.
- Load JSON file.
- Format JSON.
- Swap sides.
- Restore examples.

The floating diff navigator remains available for moving between differences, but it should visually match the selected theme.

## Theme Architecture

Theme state is managed in React and applied to the root app shell with a `data-theme` attribute:

```tsx
<main className="app-shell" data-theme={theme}>
```

The selected theme is persisted in `localStorage`. On first load, the app uses `productive`.

Styling is driven by CSS variables. Components should continue to consume semantic variables such as:

- `--bg`
- `--panel`
- `--panel-soft`
- `--input-bg`
- `--text`
- `--text-strong`
- `--border`
- `--accent`
- `--success`
- `--danger`
- `--warning`
- JSON token colors
- button and shadow variables

Theme-specific rules should live primarily under `[data-theme='productive']`, `[data-theme='calm']`, and `[data-theme='console']`, with component CSS reusing the same variables rather than branching per component.

## Theme Direction

### Productive

The default theme. It should feel like a focused SaaS productivity tool:

- Light neutral background.
- Clear panel borders.
- Compact spacing.
- Reduced decorative gradients.
- Confident blue or blue-teal accent.
- JSON syntax colors that read clearly on light editor surfaces.

### Calm

The softer light theme:

- Warm but restrained neutral background.
- Gentle panels and lower contrast chrome.
- Green or teal accent.
- Less visual intensity than `productive`.
- Still crisp enough for repeated developer use.

### Console

The dark technical theme:

- Dark app background and editor surfaces.
- Stronger contrast for text and JSON syntax.
- Subtle borders instead of heavy shadows.
- Bright but controlled accent.
- Diff highlight states must remain readable without glowing or washing out code.

## Component Design Notes

Buttons should become more utilitarian and less pill-like where appropriate. The theme control is a segmented control in the header, not a floating picker or side rail.

Panels should use smaller radii than the current large rounded cards. The JSON viewer surface should feel like a code editor: stable dimensions, readable monospace type, clear focus state, and theme-aware selection/highlight colors.

The existing diff colors need to remain semantically consistent:

- Added: success.
- Removed: danger.
- Changed: warning.
- Active diff: accent.

## Responsive Behavior

Desktop layout keeps the two JSON viewers side by side. On narrower screens, viewers stack vertically. The header wraps cleanly without overlapping controls. The theme segmented control remains accessible and should not collide with the floating diff navigator.

## Accessibility And State

The theme segmented control should expose the active theme using accessible button state, such as `aria-pressed`. Focus states must be visible in all themes.

Invalid JSON status, file read errors, disabled format buttons, and diff navigation disabled states must be readable in every theme.

## Testing And Verification

Verification should include:

- `npm run lint`
- `npm run build`
- Browser check of all three themes on desktop width.
- Browser check of all three themes on a narrow/mobile-like width.
- Confirm that theme choice persists after reload.
- Confirm that JSON validation, diff highlighting, active diff navigation, file loading, formatting, swap, and restore examples still work.
