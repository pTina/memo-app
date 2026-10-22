# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with this repository.

## Project overview

Vite + React + TypeScript memo app (Korean UI). Tailwind CSS v4 + KRDS tokens, Zustand for UI state, TanStack Query for storage. Google login via Firebase Auth. Memos and settings go to Firestore; font files stay in IndexedDB. Without a real Firebase API key the app uses the local adapter (localStorage + IndexedDB).

Live site: https://ptina.github.io/memo-app/ · Source: https://github.com/pTina/memo-app

Local → account migration (requirements step 15) is not implemented. Do not add it unless asked.

## Running locally

```bash
npm install
npm run dev
# http://localhost:5173
```

Real Google login needs Firebase web config in `.env.local`. Do not read or commit those values. Production build is `npm run build` (`base` `/memo-app/`). Production must not enable `VITE_AUTH_BYPASS`, `VITE_USE_EMULATOR`, or `VITE_USE_AUTH_EMULATOR`.

## Architecture

- `src/shared/storage/index.ts` is the only place that chooses `firebaseAdapter` vs `localAdapter`.
- Adapter methods stay `async`. Font blobs always go through IndexedDB (`localAdapter`).
- Auth gate: `RequireAuth` → `LoginPage`. Secret scan runs before Firestore writes.
- Do not log memo titles or bodies.

## Working rules

- Do not `git push` or change GitHub settings without explicit user approval.
- Secrets live only in `.env.*.local`. `.env.example` lists key names only.
- After UI changes, verify in a browser (ask before long E2E runs).

## Other repo files

- `AGENTS.md` — Korean source of the working rules; keep both in sync if either changes.
- `CHANGELOG.md` — user-facing changelog.
- `docs/요구사항정의서.md` — product requirements.
