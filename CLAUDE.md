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
- **@supabase/supabase-js** — installed, for room system (see Room System Spec)
- **react-router-dom** — to be installed for room system URL routing

## Architecture

This is an early-stage single-page app. All UI lives in [src/App.jsx](src/App.jsx), rendered into `#root` by [src/main.jsx](src/main.jsx).

### Styling conventions

Two styling layers coexist:

1. **Tailwind utilities** — used inline on JSX elements
2. **Component CSS** — `src/App.css` (scoped custom styles, imported directly into `App.jsx`). `src/index.css` only contains the Tailwind directives (`@tailwind base/components/utilities`).

`App.css` uses modern CSS nesting syntax (no preprocessor), relying on CSS custom properties (e.g. `--accent`, `--border`, `--shadow`) for theming.

SVG icons are loaded via an external SVG sprite at `/icons.svg` using `<use href="/icons.svg#icon-id">`.

## Environment

`.env.local` — never commit. Required variables:

- `ANTHROPIC_API_KEY` — Anthropic API key for the Vercel serverless function
- `VITE_SUPABASE_URL` — Supabase project URL (for room system)
- `VITE_SUPABASE_ANON_KEY` — Supabase anon key (for room system)

## What this app is

Settle it. — an AI-powered argument settler. Two people type their side of a disagreement and the app returns a percentage verdict and short written ruling via the Anthropic API. The tone is fun and slightly savage — think a brutally honest friend, not a judge. A room-based multiplayer mode is being added where two people each write their own side privately on separate devices, with the verdict revealing simultaneously to both.

## Folder structure

- src/screens — InputScreen, LoadingScreen, VerdictScreen, HistoryScreen, SettingsScreen, ThemePickerScreen, PrivacyScreen, ErrorScreen
- src/services — verdictService.js, storageService.js, shareCard.js, soundService.js
- src/context — ThemeProvider, AccentThemeProvider, AccentThemeContext.js, useTheme.js, useAccentTheme.js
- src/components — Icons.jsx, BottomNav.jsx
- src/utils — touch.js (shared touch press-feedback handlers)
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

- Dark and light mode from day one — brightness control in SettingsScreen (system/light/dark)
- Anonymous by default — users get a silent Supabase anonymous auth identity on first load with no UI or prompt. Optional account creation planned for v2 to enable cross-device history sync.
- Verdict reveal animated — segmented meter bar (10 segments) fills left to right over 1 second with spring easing, numbers count up simultaneously
- Two accent themes — purple (`#7c5cfc`) and forest green (`#3ba373`), toggled via ThemePickerScreen, stored as `--accent` CSS custom property
- Settings screen — brightness, accent theme, sound effects toggle, privacy policy, clear history
- Sound effects via Web Audio API (soundService.js)
- Share card generated client-side via Canvas API (shareCard.js), segmented bar matches in-app design
- Win streak tracked in localStorage — resets on a loss
- PWA home screen support

## Design

- Dark-first, premium, minimal
- Two accent themes: purple `#7c5cfc` (default) and forest green `#3ba373`, switchable in settings
- Mobile-first, max content width 480px centred on desktop
- Feels like Flinch or Duolingo meets a late night Discord call

## localStorage keys

- settleit_history — Verdict array, newest first
- settleit_streak — { current, best }
- settleit_theme — "dark" | "light" | "system"
- settleit_accent_theme — "purple" | "forest"
- settleit_sound — boolean (sound effects enabled)

## Room System Spec 
🔗 Room System Technical Spec

Overview
Settle it. adds a second mode alongside the existing quick settle: a room-based multiplayer settle where two people each write their own side privately on their own device, and the verdict reveals simultaneously to both when both have submitted. The existing single-screen flow remains completely unchanged.

Database Schema (Supabase)
Three tables:
sql-- Users (managed by Supabase Auth, extended here)
profiles
  id          uuid references auth.users primary key
  display_name text
  created_at  timestamp default now()

-- Rooms
rooms
  id           uuid primary key default gen_random_uuid()
  short_code   text unique not null  -- 6-char human-readable code e.g. "ABC123"
  status       text default 'waiting' -- waiting | both_submitted | verdict_ready | expired
  side_a       text  -- submitted by creator
  side_b       text  -- submitted by joiner
  verdict_json jsonb -- { sideAPercentage, sideBPercentage, ruling, topicLabel }
  creator_id   uuid  -- anonymous session id or auth user id
  joiner_id    uuid  -- anonymous session id or auth user id
  expires_at   timestamp -- created_at + 5 hours
  created_at   timestamp default now()
  updated_at   timestamp default now()

-- Optional: link rooms to user profiles for history
user_rooms
  id         uuid primary key default gen_random_uuid()
  user_id    uuid references profiles(id)
  room_id    uuid references rooms(id)
  role       text -- 'creator' | 'joiner'
  created_at timestamp default now()

Supabase Setup Steps
Before Claude Code touches the app:

Create a Supabase project at supabase.com (free tier)
Run the schema SQL above in the Supabase SQL editor
Enable Row Level Security (RLS) on all tables
Add RLS policies: users can only read/write rooms they created or joined
Enable Realtime on the rooms table
Copy the project URL and anon key to .env.local:

   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key

Install the Supabase client: npm install @supabase/supabase-js


Anonymous Identity
Every device gets a persistent anonymous identity via Supabase Auth anonymous sign-in. This happens silently on app first load — no UI, no prompt. The anonymous user gets a real UUID that persists in localStorage. When a user later creates an account, Supabase merges the anonymous identity into their real account, preserving all their rooms and history.
javascript// On app init — runs once, silently
const { data } = await supabase.auth.signInAnonymously()
// data.user.id is now the persistent identity for this device

Room Flow — Step by Step
Creating a room:

User taps "challenge someone" on InputScreen
App calls Supabase to create a new room row — status: waiting, creator_id: current user's anonymous ID, short_code: randomly generated 6-char code, expires_at: now + 5 hours
App navigates to RoomWaitingScreen showing the share link: settle-it-ten.vercel.app/room/ABC123
Creator sees: "waiting for your opponent…" with the shareable link and a copy/share button
Creator can optionally write their side now, or wait — their text field is available immediately

Joining a room:

Second person opens the link on their device
App detects the /room/ABC123 URL, looks up the room by short_code
If room status is waiting and joiner_id is null — valid join, app sets joiner_id to current user
Both users now see the RoomSettleScreen — two text areas, their own side only editable by them, the other side hidden until both submit
If room is expired, full, or already has a verdict — show appropriate error state

Both sides submitted:

Either user submits their side — their text is saved to side_a or side_b in the room row, status updates to reflect one side done
The other user's screen updates in real-time via Supabase realtime subscription — they see "opponent has submitted their side"
When both sides are in — the verdict API call fires (from a Supabase Edge Function, not the client) and the result is written to verdict_json, status becomes verdict_ready
Both users' screens update simultaneously via realtime — both navigate to the verdict reveal at the same time

Verdict:
The same VerdictScreen used for quick settle, with one addition: a "room verdict" badge showing this was a real two-sided settle, not a quick settle.

New Screens Required
InputScreen changes:

Two mode buttons replace the current single layout: "quick settle" (existing flow) and "challenge someone" (room flow)
Quick settle keeps the existing two text areas
Challenge someone shows a single "create room" button

RoomWaitingScreen (new):

Shows the shareable link with copy and native share buttons
"Your side" text area — creator can write while waiting
Status indicator: "waiting for opponent" → "opponent joined — write your side"
Timer showing time remaining before room expires
Cancel room button

RoomSettleScreen (new):

Both users see this once the joiner has joined
Each user sees only their own text area — labelled "your side"
Opponent's side shows as a locked/blurred placeholder: "they're writing their side…"
Submit button — once tapped, shows "waiting for opponent to submit…"
Real-time status: when opponent submits, shows "opponent is ready — submit when you are"
Both users navigate to verdict simultaneously when both have submitted

RoomVerdictScreen (new, or extend existing VerdictScreen):

Same verdict layout as existing
Small badge: "live settle" or "two-sided" to distinguish from quick settle
Both users see this at the same time
Share card shows "live settle" label

RoomJoinScreen (new):

Shown when opening a room link
Validates the room (not expired, not full, not already settled)
"Join this settle" button
Error states: expired, already full, already settled


URL Routing
The app currently has no URL routing — it's a single-page app with screen state. The room system requires URL-based routing since room links need to be shareable. Add React Router:
bashnpm install react-router-dom
Routes:

/ — existing app (InputScreen)
/room/:code — RoomJoinScreen, then RoomSettleScreen
/room/:code/verdict — RoomVerdictScreen


Supabase Edge Function
The verdict API call for rooms should happen server-side via a Supabase Edge Function rather than from the client — this prevents either user from being able to trigger the verdict before both sides are submitted, and keeps the Anthropic API key secure.
javascript// supabase/functions/generate-verdict/index.ts
// Triggered when both sides are submitted
// Reads side_a and side_b from the room
// Calls Anthropic API
// Writes verdict_json back to the room
// Updates room status to verdict_ready
This replaces the existing Vercel API route for room verdicts only — the quick settle flow continues using the existing /api/settle.js Vercel function unchanged.

Realtime Subscriptions
Two subscriptions needed per active room session:
javascript// Subscribe to room status changes
supabase
  .channel('room-' + roomId)
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'rooms',
    filter: 'id=eq.' + roomId
  }, (payload) => {
    // Update local room state
    // Navigate to verdict if status === 'verdict_ready'
  })
  .subscribe()

Build Order

Supabase project setup + schema + RLS policies
Install Supabase client + React Router, set up env vars
Anonymous auth on app init (silent, no UI)
InputScreen mode split — quick settle vs challenge someone
Room creation flow + RoomWaitingScreen
Room join flow + RoomJoinScreen
RoomSettleScreen with realtime status updates
Supabase Edge Function for verdict generation
RoomVerdictScreen
Polish — expiry handling, error states, room history for logged-in users


What stays exactly the same:

The entire existing quick settle flow
All existing screens (InputScreen, LoadingScreen, VerdictScreen, HistoryScreen, SettingsScreen)
The existing Vercel API route for quick settle verdicts
All localStorage-based history and streak for quick settles