# JSON Diff Tool Developer Utility Redesign

## Goal

Redesign JSON Diff Tool as a focused developer utility. The app should feel dense, precise, and fast: a workbench for comparing API payloads, fixtures, and JSON responses, not a teaching tool or marketing surface.

## Approved Direction

Use the Focused split layout. Keep the current two-pane comparison model, but make the shell, toolbar, pane structure, diff navigation, and empty states feel sharper and more purpose-built.

## Visual Direction

The default surface is dark because the primary scene is a developer comparing API payloads on a desktop monitor during a debugging session, likely in dim or mixed light. The palette should be restrained: tinted dark neutrals, one cool accent, and clear semantic colors for added, removed, and changed JSON.

Theme switching remains secondary. The main header should not look like a theme showcase.

## Scope

This pass changes the app surface and component styling while preserving existing functionality:

- Paste and edit JSON in either pane.
- Toggle between editor and tree view.
- Upload JSON files.
- Format valid JSON.
- Swap left and right sides.
- Navigate differences.
- Show validation and file errors.

It does not add a diff rail, inspector sidebar, tutorial flow, or new data model.

## Layout

Use a compact sticky command bar above the workspace. The command bar contains the product name, diff navigator, and secondary settings. The workspace is a direct two-pane comparison area, with a small centered swap control between panes.

Each pane should have its own header with label, validation status, and local actions. Empty panes should communicate where to paste or drop JSON without becoming documentation.

## Interaction

Controls remain explicit text controls where clarity matters. The diff navigator keeps icon buttons and a compact path display. Theme selection is tucked into a secondary settings surface. Focus states must remain visible in all controls and JSON surfaces.

## States

Required states:

- Empty left or right pane.
- Valid JSON.
- Invalid JSON.
- File read error.
- Disabled format action.
- No differences.
- One or more differences with active path.
- Added, removed, changed, and active JSON rows.

## Anti-goals

Do not create a docs-heavy teaching tool. Avoid glossy SaaS decoration, playful JSON branding, heavy IDE side rails, gradient text, glassmorphism, and oversized cards.

## Verification

Run lint, tests, and build. Verify the redesigned app in the browser at desktop width, including empty state, valid JSON, invalid JSON, tree mode, diff navigation, theme settings, and the two-pane layout.
