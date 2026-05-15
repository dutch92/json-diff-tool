# Manual JSON Input Design

## Goal

Add manual JSON input to the diff tool without splitting the experience into separate text-entry and file-upload areas. Each side should feel like one working surface where users can view the diff, paste JSON, edit JSON, or load a file.

## Selected Direction

Use a hybrid of two interaction models:

- Keep the tree/diff view as the default state so the existing comparison workflow remains intact.
- Add an edit mode inside the same panel surface for manual JSON entry.
- Allow file loading and clipboard paste directly on the same panel surface in both view and edit modes.

This follows the spirit of JSON Editor Online's unified import/edit area while preserving this app's side-by-side diff focus.

## User Experience

Each JSON panel has one primary surface:

- In view mode, valid JSON renders as the current collapsible tree with diff highlights.
- In edit mode, the same area becomes a text editor for the raw JSON source.
- A compact panel action switches between view and edit modes.
- The existing format action remains available when the current text parses as valid JSON.
- Users can drag a `.json` file onto the panel surface. The surface highlights during drag-over, reads the file, and replaces that side's JSON.
- Users can paste JSON while the surface is focused. The pasted text replaces that side's JSON.
- If loaded or pasted JSON is valid, the app normalizes it using the existing formatter. If it is invalid, the app keeps the raw text and shows the existing parse error.
- The existing file picker can remain as a fallback action, but it should not create a separate upload area.

## Component Design

`App.tsx` continues to own `leftText` and `rightText`.

`JsonViewer` receives one new text update callback:

- `onChangeText(value: string)`.

`JsonViewer` becomes responsible for local interaction state:

- current mode: `view` or `edit`;
- drag-over visual state;
- textarea focus and paste/drop handlers.

The current `onLoadFile` callback can either stay in `App.tsx` or be replaced with a file-content callback if that makes the component cleaner. The implementation should stay small and follow the current local component style.

## Data Flow

1. User edits, pastes, or drops a file in one panel.
2. `JsonViewer` passes the raw text to `App.tsx`.
3. `App.tsx` updates `leftText` or `rightText`.
4. Existing parsing, formatting, diffing, and status rendering recalculate from state.

No new global state or storage is needed.

## Error Handling

- Invalid JSON remains visible as raw text and shows the existing parse error.
- File read failures should not crash the app. The panel should keep its previous text and surface a short local error message.
- Non-JSON files are discouraged through the file picker `accept` attribute, but drag-and-drop should still handle text content gracefully.

## Testing

Add focused coverage through the existing project checks:

- `npm run lint`
- `npm run build`

Manual browser verification should cover:

- toggling view/edit mode;
- editing valid JSON and seeing the diff update;
- editing invalid JSON and seeing the parse error;
- pasting JSON into a focused panel surface;
- dragging a `.json` file onto a panel;
- responsive layout on the existing narrow breakpoint.
