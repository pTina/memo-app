# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

A build-free static web app (Korean-language custom memo/note editor). Pure HTML/CSS/JavaScript — no package manager, no bundler, no framework. jQuery 3.7.1 and html2canvas are loaded via CDN `<script>` tags in `index.html`. All data (notes, uploaded font files) lives only in the browser's IndexedDB (`memoAppDB`); there is no backend and none should be added.

Live site: https://ptina.github.io/memo-app/ · Source: https://github.com/pTina/memo-app

## Running locally

```bash
python3 -m http.server 8080
# open http://localhost:8080
```

Double-clicking `index.html` mostly works too, but use the local server to avoid file:// quirks. There is no build, lint, or automated test command — this repo has no test suite (no unit/e2e code), so verification means driving the app in an actual browser.

## Verifying changes

There is no automated test suite. After any UI-affecting change, launch a headless browser (Playwright) against the local server and exercise the relevant flow, checking for console errors, uncaught page errors, and failed network requests — do not report a change complete without doing this. See `TEST_REPORT.md` for the kind of end-to-end flow (list → new note → editing → floating toolbar/highlight → link insert → font manager → image export → search → dark mode → backup/restore → bulk delete) previously used to validate the app; a known unresolved issue is documented there too (list-preview text loses line breaks — `plainText()` in `js/app.js`).

## Architecture

Three files carry all the logic:

- **`index.html`** — all markup for every screen and modal in one document: list view (`#view-list`), editor view (`#view-editor`), floating selection toolbar (`#float-toolbar`), link popover, and modals for fonts, image export, delete confirmation, help, backup, and settings. Views are shown/hidden by toggling `.hidden`/`.view` classes rather than routing.
- **`js/app.js`** — single IIFE (`$(function () { ... })`) containing all UI logic, jQuery-style (callbacks/promise chains, `var`, no ES modules/classes). All state lives in one in-memory `state` object (notes, fonts, current note id, undo/redo stacks, selection, etc.) that's kept in sync with IndexedDB — every mutation writes through `DB.*` and updates `state` + re-renders.
- **`js/db.js`** — thin promise-wrapped IndexedDB layer (`DB` global) exposing `DB.notes` and `DB.fonts` stores (`getAll`/`put`/`delete`) plus `DB.uid()`. This is the only place that talks to IndexedDB directly.
- **`css/style.css`** — all styling; light/dark theme is done via CSS custom properties, toggled at the root, not separate stylesheets.

Notable subsystems inside `js/app.js` worth knowing before touching them:
- **Rich-text selection styling**: the floating toolbar (color, 4-color highlight, letter/line spacing) applies inline spans to the current selection via `wrapSavedRange`/`toggleHighlight`, with `splitOneLevel`/`promoteOutOfCategory` handling nested-span splitting so overlapping styles (e.g. color + highlight) don't corrupt each other. `CATEGORY_MATCHERS` defines which style categories exist.
- **Undo/redo**: a custom snapshot-based stack (`pushUndoSnapshot`/`performUndo`/`performRedo`) captures editor HTML, debounced via `UNDO_GROUP_GAP` so a burst of typing becomes one undo step.
- **Fonts**: uploaded font files are stored as blobs in the `fonts` IndexedDB store and registered as `FontFace` objects at runtime (`loadFontFace`); `state.loadedFontFamilies` tracks which are already injected into the document.
- **Image export**: `html2canvas` renders either the full note or just the active text selection (captured into `#export-capture`) into a downloadable PNG, with adjustable background/corner-radius/padding (`exportState`).
- **Backup/restore**: exports notes + fonts + settings as a single JSON file (fonts re-encoded as data URLs); import matches fonts by `name` (not `id`) to avoid duplicating a font that was uploaded independently on another device, remapping any note's `fontId` accordingly.

## Working rules

- **Do not introduce a build step.** No transpiler, bundler, or framework — that's a deliberate constraint of this project, not an oversight.
- **Data stays client-side in IndexedDB.** No server/backend, and none is planned.
- **Match the existing style in `js/app.js`**: jQuery-style callbacks/promise chains, existing indentation and function-declaration patterns — don't introduce classes, `let`/`const`-only rewrites, or a different paradigm in this file.
- **Don't `git push` or change GitHub settings (e.g. enabling Pages) without explicit user approval before committing** — this affects the live site.

## Other repo files

- `AGENTS.md` — the Korean-language source of the working rules above; keep both in sync if either changes.
- `CHANGELOG.md` — user-facing changelog.
- `llms.txt` — SEO/LLM-discovery description of the app's purpose and features.
