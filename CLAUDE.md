# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Open-source clone of the board game **Hitster**. Players hear a song, then guess one of five things — selected by a spinning wheel. The default 5 are Artist / Title / Exact release year / Release year ±3 / Decade. The host can also pick alternate game modes (currently "Eurovision", which swaps ±3 and Decade for Country and Placement and sources year from `eurovision.json` rather than Spotify's release date). See "Game modes" below for how the mode system works and how to add another.

The app plays music via the user's Spotify account (from a playlist they choose) and keeps song metadata hidden until players choose to reveal it.

## Stack & deployment

- TypeScript + React + Tailwind CSS
- Built to static files via GitHub Actions, hosted on GitHub Pages
- **No backend** — everything runs in the browser

## Architectural constraints worth knowing

**Spotify auth must be PKCE (Authorization Code with PKCE flow).** Implicit Grant is deprecated, and Client Credentials can't access user playlists. Since there is no backend, the client secret cannot be used — PKCE is the only viable flow. The redirect URI must be the GitHub Pages URL.

**Playback model.** Two paths exist; pick deliberately:
- **Web Playback SDK** — plays audio in the browser tab itself. Requires Spotify Premium. Gives precise control and is the cleanest fit for "hide metadata while audio plays."
- **Connect API** (`/me/player/play`) — controls an existing Spotify app on the user's device. Works with Free accounts (in theory; `/play` still requires Premium in practice), but the Spotify app/device shows song info, defeating the hide-metadata requirement.

**Active choice: Connect API.** This project chose the Connect API path for device flexibility — players can use their phone, desktop app, or smart speaker as the audio output. The trade-off is that the *receiving device's* Spotify UI displays the title/artist/album art, so players need to keep that screen out of sight during play. The web app itself still hides metadata until reveal. This is the deviation flagged below in "Hiding metadata".

**Hiding metadata.** Track payloads from `/v1/playlists/{id}/items` contain artist/title/album. The web UI must withhold these until the players trigger reveal. Treat the track list as a controlled secret in app state — do not log it, do not render it anywhere except the reveal card, and be careful with React DevTools-friendly prop drilling. Note the Connect API caveat above: the *receiving Spotify device's screen* will show this info regardless — that's an accepted trade-off, not a bug.

**Premium gating happens at click-time.** `/v1/me/player/play` requires a Premium account, but we deliberately do **not** request the `user-read-private` scope (which would expose `product` on `/me` and let us detect Premium upfront). Instead, Free users discover the limitation when the play call returns 403 with `reason: PREMIUM_REQUIRED`, and `PlayingView` renders an inline amber banner explaining what's needed. This is a scope-minimization tradeoff, not an oversight.

**Release year.** Spotify's track object exposes `album.release_date` and `album.release_date_precision` (`year` | `month` | `day`). Year-precision is enough for all five question types, but the precision field must be checked — some albums only have year, which still works; the failure mode is missing data, not wrong data.

**GitHub Pages base path.** If deployed at `username.github.io/open-hits/`, the build needs a non-root base path (Vite `base`, React Router `basename`). The OAuth redirect URI must match exactly.

**Local dev: 127.0.0.1, not localhost.** Spotify rejects `localhost` redirect URIs for apps registered after early 2025. `vite.config.ts` sets `server.host: '127.0.0.1'` so the dev server binds to the IPv4 loopback. Visit `http://127.0.0.1:5173/open-hits/` — `localhost:5173` will time out by design, since the dev server isn't bound there.

**Category color is the visual reminder.** Each wheel category has a distinctive hex color (defined per game mode in `src/game/modes.ts`, or in the legacy `WHEEL_CATEGORIES` in `src/game/wheel.ts` which doubles as the default-mode list). Reuse that color anywhere the player needs to be reminded of the current category — already done on the wheel segments, the `PlayingView` heading + button, the `RevealingView` category pill + button, and the bingo cells. When adding new UI that references a category, pull the color from the active mode's `categories[i].color` rather than re-picking; consistency is the whole point. **Important constraint:** the bingo card on `/join` does not know which game mode the host picked — it always looks up colors from the default `WHEEL_CATEGORIES`. So any new game mode must reuse the 5 default hex colors in the same slot positions, otherwise the player's ticked cells won't match the host's wheel. See "Game modes" below.

**Game modes.** Categories are organized by *game mode*, registered in `src/game/modes.ts` as `GAME_MODES`. Two modes today: `default` (Artist / Title / Exact year / Year ±3 / Decade) and `eurovision` (Artist / Title / Eurovision year / Country / Placement). The host picks the mode in a dropdown on the ready screen, above the Start button. `Wheel`, `PlayingView`, and `RevealingView` are mode-aware: they receive `categories: readonly WheelCategory[]` as a prop instead of importing the constant. `useGame` is also parameterized — its `spin_now` action takes a `categoryCount` so `pickCategoryIndex` respects the active mode.

To add a new mode:
1. Append a `GameMode` entry to `GAME_MODES` in `src/game/modes.ts`. Reuse the 5 default hex colors slot-for-slot (see constraint above).
2. If the mode introduces new `CategoryId` values, add them to the union in `src/game/wheel.ts`.
3. If the mode needs extra per-track data (like Eurovision does), add an optional field to `GameTrack` in `src/spotify/api.ts` and enrich tracks inside the `Game` component before passing them to `GameSession`. Mirror the `eurovision?: EurovisionMatch | null` pattern: `undefined` means the mode doesn't apply, `null` means lookup attempted but failed, an object means matched.
4. If reveal output differs by mode, branch on `modeId` in `RevealCard` (the prop is already threaded through `RevealingView`).
5. Do **not** modify the bingo card. It is intentionally mode-agnostic.

**Eurovision specifics.** Source data is `public/eurovision.json` (a ~336KB array of ~1,800 entries, fields `country` / `artist` / `song` / `year` / `placement.{rank, status, semiFinalRank?}`). Statuses: `final`, `DNQ`, `DNS` (not yet competed, e.g. 2026), `DSQ`, `cancelled`, `no-placement`. Loaded once when the host picks Eurovision via `fetchEurovisionData()` in `src/game/eurovision.ts`, using `${import.meta.env.BASE_URL}eurovision.json` so it resolves under the GH Pages base path. Spotify tracks are matched on song + artist using `normalizeForMatch()` (NFD, strip combining diacritics, drop parenthetical/bracket suffixes and `" - "` tails, lowercase, strip non-alphanumerics). Artist match is loose: either side substring of the other, so "feat." and multi-artist credits work. Unmatched tracks still play; the reveal screen shows an amber "not found" banner and falls back to the Spotify release year. Placement display uses `formatPlacement()` for status-aware labels ("1st place", "Did not qualify", "Not yet competed", etc.).

**Static JSON pattern.** When fetching anything from `/public` at runtime, use `${import.meta.env.BASE_URL}<name>` (not a bare `/foo.json`) so it works under the GH Pages base path. `eurovision.json` is the first example of this pattern.

**Routing.** React Router v7 (`react-router-dom`) with `<BrowserRouter basename={import.meta.env.BASE_URL}>`. Three routes:
- `/` — landing hero with two CTAs ("Start as host" / "Join game"). Never auto-redirects based on auth state, so the same browser can open `/host` in one tab and `/join` in another without one stealing the other. Also processes the Spotify OAuth callback (the redirect URI is `BASE_URL` itself); on a successful callback it forwards to `/host`.
- `/host` — the host flow: playlist grid → device picker → game loop. Requires authentication; if status is idle/error the route bounces to `/`. "Sign out" works the same way: status flips to idle and the route effect navigates home.
- `/join` — player flow: bingo card. No Spotify auth required.

Direct loads of any route except `/` on GitHub Pages would 404; `public/404.html` plus a decoder in `index.html` form the standard SPA fallback (rafgraph/spa-github-pages pattern), so deep links and refreshes work.

**Spotify app status: Development Mode.** The registered app hasn't been submitted for Extended Quota Mode review, which carries two practical consequences:
- **Spotify-curated playlists 403** on the tracks endpoint. Anything where `owner.id === 'spotify'` (Discover Weekly, editorial like "Today's Top Hits") is unreadable. We filter these out of the playlist grid in `App.tsx`.
- **Third-party playlists are an inconsistent signal.** A user can read playlists they've collaborated on, but the API's `collaborative` flag isn't reliably set for newer share-via-link / add-user flows. There's no field on the simplified playlist object that says "you can read this". We show all non-curated playlists optimistically and let `fetchPlaylistTracks` surface a friendly amber error in `GameView` when one 403s — see the `tracks_fetch_403` branch of the error UI.

To lift either, the app needs to be approved for Extended Quota Mode via the Spotify dev dashboard.

## Tooling and verification

**No linter, no formatter, no test runner.** The only scripts in `package.json` are `dev` (Vite), `build` (`tsc -b && vite build`), and `preview`. Type-check and build correctness happen together via `npm run build` — run it before claiming a change is done. Anything beyond that requires manual testing in the dev server (`npm run dev`, then visit `http://127.0.0.1:5173/open-hits/`). Don't go looking for `npm run lint` or `npm test`; they don't exist. If you want a quick "does it still type-check" loop without the Vite build, `npx tsc -b` alone works.

## Sharp edges

**`useGame`'s reducer initializer runs once.** The hook in `src/game/useGame.ts` uses `useReducer(reducer, initialTracks, init)` — `init` only fires on mount. Changing `initialTracks` later does *not* update the reducer state. This is why `GameView.tsx` is split into `Game` (the setup/Ready gateway that holds mode + Eurovision enrichment state) and `GameSession` (mounts `useGame` only after Start is clicked, with the tracks locked in). If you ever need to swap tracks after the game starts, add a dedicated reducer action — don't expect a prop change to flow through.

**`Game` vs `GameSession`.** `Game` owns: `gameMode`, `enrichedTracks`, `usePlayback` (kept here so device selection survives the Ready→Session transition), and the `hasStarted` gate. `GameSession` owns the game-loop state (`useGame`, `playError`, `partyMode`, wake lock). The `usePlayback` instance is passed down so the device the user picked on Ready is the device that plays in Session. Do not re-instantiate `usePlayback` inside `GameSession`.

**Wheel segment math is per-component.** `src/components/Wheel.tsx` used to compute `SEGMENT_ANGLE` at module scope from `WHEEL_CATEGORIES.length`. After the game-modes refactor, segment angle is derived from the `categories` prop inside the component, and `segmentPath` / `rotationForSegment` take it as a parameter. If you change the wheel, keep the math localized — don't reintroduce a module-level constant that hardcodes the count.

## Status

Fully scaffolded, deployed at https://rugern.github.io/open-hits/, and the entire game loop works end-to-end: sign in (PKCE) → playlist grid (with filter input and Spotify-curated hidden) → click a playlist → ready screen with device picker + game-mode dropdown (Default / Eurovision) → spin wheel (5–11s, click-to-trigger, optional carnival "Bop it" mode) → track plays in background → reveal album art + title + artists + (year *or* Eurovision country/placement/year, depending on mode), color-coded to the category → continue → game over with re-shuffle / pick-another. The screen wake lock is held while a game is active. There is also a player-side `/join` route with a 5×5 bingo card (color-only cells, balanced 5-each) and a guess input that goes full-screen on landscape orientation for a "show your phone" reveal. Outstanding ideas live in `TODO.md`.
