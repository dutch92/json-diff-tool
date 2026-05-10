# JSON Diff Tool

JSON Diff Tool is a small browser app for comparing two JSON documents side by side.
It renders JSON as a collapsible tree, highlights changed values, and lets you move
through every difference without editing the source data.

Live demo: https://dutch92.github.io/json-diff-tool/

## Features

- Compare two JSON objects and arrays recursively.
- Highlight added, removed, and changed values directly inside the JSON tree.
- Collapse and expand objects and arrays.
- Show item count for collapsed arrays.
- Navigate between differences with a floating previous/next control.
- Upload JSON files for the left and right side.
- Format valid JSON with stable key ordering.
- Swap left and right JSON documents.
- Reset to built-in sample data.

## Tech Stack

- React
- TypeScript
- Vite
- GitHub Pages
- GitHub Actions

## Local Development

Use Node.js 22 or newer.

```bash
npm install
npm run dev
```

Run checks:

```bash
npm run lint
npm run build
```

## Project Structure

```text
src/
  components/
    DiffNavigator/   floating diff navigation
    JsonViewer/      read-only collapsible JSON tree
    SummaryPanel/    compact app header
    ui/              local UI primitives
  lib/json/          JSON parsing, formatting, diffing, highlighting
```

## Deployment

The app is deployed to GitHub Pages from the `main` branch.

Deployment is handled by `.github/workflows/deploy-pages.yml`:

1. Install dependencies with `npm ci`.
2. Build the app with `npm run build`.
3. Upload `dist`.
4. Publish through GitHub Pages.

The Vite `base` option is set to `/json-diff-tool/` for the project page URL.
