# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Open-source clone of the board game **Hitster**. Players hear a song, then guess one of five things — selected by a spinning wheel:

1. Artist
2. Song title
3. Exact release year
4. Release year ±3 years
5. Decade of release

The app plays music via the user's Spotify account (from a playlist they choose) and keeps song metadata hidden until players choose to reveal it.

## Stack & deployment

- TypeScript + React + Tailwind CSS
- Built to static files via GitHub Actions, hosted on GitHub Pages
- **No backend** — everything runs in the browser

## Architectural constraints worth knowing

**Spotify auth must be PKCE (Authorization Code with PKCE flow).** Implicit Grant is deprecated, and Client Credentials can't access user playlists. Since there is no backend, the client secret cannot be used — PKCE is the only viable flow. The redirect URI must be the GitHub Pages URL.

**Playback model.** Two paths exist; pick deliberately:
- **Web Playback SDK** — plays audio in the browser tab itself. Requires Spotify Premium. Gives precise control and is the cleanest fit for "hide metadata while audio plays."
- **Connect API** (`/me/player/play`) — controls an existing Spotify app on the user's device. Works with Free accounts, but the Spotify app/device shows song info, defeating the hide-metadata requirement.
  
  The Web Playback SDK path is the one that satisfies the game requirement; document any deviation.

**Hiding metadata.** When a track is queued via the Web Playback SDK, the `currentTrack` payload contains artist/title/album. The UI must withhold these until the players trigger reveal. Treat the track metadata as a controlled secret in app state — do not log it, do not render it in any debug surface, and be careful with React DevTools-friendly prop drilling.

**Release year.** Spotify's track object exposes `album.release_date` and `album.release_date_precision` (`year` | `month` | `day`). Year-precision is enough for all five question types, but the precision field must be checked — some albums only have year, which still works; the failure mode is missing data, not wrong data.

**GitHub Pages base path.** If deployed at `username.github.io/open-hits/`, the build needs a non-root base path (Vite `base`, React Router `basename`). The OAuth redirect URI must match exactly.

## Status

Project is not yet scaffolded. No `package.json`, build config, or source files exist. The first task is choosing a build tool (Vite is the natural fit for this stack) and setting up the toolchain.
