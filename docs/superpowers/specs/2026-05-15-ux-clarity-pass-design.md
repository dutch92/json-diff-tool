# UX Clarity Pass Design

## Goal

Improve the JSON Diff Tool's clarity without rebuilding the app layout. The first pass should help users understand what changed, where they are in the diff list, what colors mean, and when an action may overwrite their input.

## Scope

This pass includes:

- A visible diff legend for added, removed, changed, and active rows.
- A current-diff path display, such as `profile.active`.
- A non-floating diff navigator that no longer covers JSON content.
- Russian theme labels: `Рабочая`, `Спокойная`, `Консоль`.
- Short Russian JSON parse errors with line and column when available.
- A safer example reset flow that asks for confirmation after user edits.

This pass does not include a full command bar redesign, advanced inline editor diagnostics, search, export, or a new diff algorithm.

## Interface Design

`SummaryPanel` remains the top status surface. It should show the brand, comparison status, diff count, theme switcher, and a small legend. The status language should make automatic comparison clearer: valid inputs mean the comparison is current; invalid inputs mean the user should fix JSON first.

`DiffNavigator` moves from fixed positioning into normal document flow below the summary. It should be compact and easy to scan: previous button, `current / total`, next button, and the current path when a diff is active. On mobile it should wrap cleanly and never overlap a JSON panel.

`JsonViewer` keeps its current view/edit split. Its parse status should prefer a localized message over raw JavaScript parser text. The raw parser details can be simplified into a sentence that includes line and column when the runtime provides them.

The example reset button should be renamed to `Сбросить к примеру`. If either side has been edited since page load or a file/paste action, reset should ask for confirmation before replacing both sides.

## Data Flow

`App` already owns JSON text, versions, parsed results, active diff index, and diff data. It should derive the current active path from `activeDiff?.path` and pass it to summary/navigation components. It should also derive whether the user has modified input from each side's `version`.

Parse error presentation should stay close to `JsonViewer`, since that component already owns the parse status UI. A small formatting helper can convert raw parser messages into user-facing Russian text.

## Error Handling

Invalid JSON disables formatting and comparison as it does today. The visible error should be concise and localized:

- `Ошибка JSON: ожидалось имя свойства. Строка 1, колонка 3.`
- If the parser message does not contain line and column, show a generic localized fallback plus the original message only when it is still useful.

Reset confirmation should use the browser confirmation dialog for this pass. If the user cancels, no state changes.

## Testing

Add focused tests for pure behavior where possible:

- Localized parse error formatting.
- Reset confirmation guard behavior if it is extracted into a helper.

Run the existing lint and build checks. Verify the UI manually in desktop and mobile browser viewports, with valid JSON, invalid JSON, and active diff navigation.
