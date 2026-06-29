# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # start dev server with HMR
npm run build    # production build
npm run preview  # preview production build locally
npm run lint     # run ESLint
```

There is no test suite configured yet.

## Stack

- **React 19** with JSX (no TypeScript)
- **Vite 8** — bundler and dev server
- **Tailwind CSS 3** — utility classes available everywhere; `darkMode: "class"` is enabled
- **PostCSS** with Autoprefixer

## Architecture

This is an early-stage single-page app. All UI lives in [src/App.jsx](src/App.jsx), rendered into `#root` by [src/main.jsx](src/main.jsx).

### Styling conventions

Two styling layers coexist:

1. **Tailwind utilities** — used inline on JSX elements
2. **Component CSS** — `src/App.css` (scoped custom styles, imported directly into `App.jsx`). `src/index.css` only contains the Tailwind directives (`@tailwind base/components/utilities`).

`App.css` uses modern CSS nesting syntax (no preprocessor), relying on CSS custom properties (e.g. `--accent`, `--border`, `--shadow`) for theming.

SVG icons are loaded via an external SVG sprite at `/icons.svg` using `<use href="/icons.svg#icon-id">`.

## Environment

The app uses `ANTHROPIC_API_KEY` from `.env.local`. Never commit `.env.local`.

## What this app is

Settle it. — an AI-powered argument settler. Two people type their side of a disagreement and the app returns a percentage verdict and short written ruling via the Anthropic API. The tone is fun and slightly savage — think a brutally honest friend, not a judge.

## Folder structure

- src/components — reusable UI components
- src/screens — InputScreen, LoadingScreen, VerdictScreen, HistoryScreen, ErrorScreen
- src/services — verdictService.js, storageService.js
- src/context — ThemeProvider
- api — settle.js Vercel serverless function

## Core data models

Verdict: { id, topicLabel, createdAt, sideAPercentage, sideBPercentage, ruling, won }
Streak: { current, best }
ThemePreference: "dark" | "light" | "system"

## API — /api/settle.js

- Receives { sideA, sideB } strings (max 500 chars each)
- Returns { sideAPercentage, sideBPercentage, ruling, topicLabel }
- Never returns 0% or 100% — always finds nuance on both sides
- Tone matches subject — playful for trivial, measured for serious
- Error response: { error: true, errorType, message }
- errorType values: "rate_limited", "content_rejected", "api_unavailable", "invalid_request", "unknown"
- Rate limit: 10 requests per IP per hour
- API key via process.env.ANTHROPIC_API_KEY — never hardcoded

## Key product decisions

- Dark and light mode from day one — toggle in top corner of InputScreen
- No accounts, no onboarding — fully functional instantly
- Verdict reveal animated — meter fills from 50/50 to result over 1 second, numbers count up simultaneously
- Share card generated client-side via Canvas API
- Win streak tracked in localStorage — resets on a loss

## Design

- Dark-first, premium, minimal
- Single purple accent: #7c5cfc
- Mobile-first, max content width 480px centred on desktop
- Feels like Flinch or Duolingo meets a late night Discord call

## localStorage keys

- settleit_history — Verdict array, newest first
- settleit_streak — { current, best }
- settleit_theme — "dark" | "light" | "system"

## Build order

1. ThemeProvider context
2. StorageService
3. /api/settle.js serverless function + verdictService.js
4. InputScreen
5. LoadingScreen
6. VerdictScreen with reveal animation
7. HistoryScreen
8. BottomNav
9. ShareCard
10. ErrorScreen
