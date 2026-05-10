# Open Hits

An open-source clone of the board game [Hitster](https://hitstergame.com/), built as a static site that streams music through your own Spotify account. A song plays, a wheel decides what your friends have to guess (artist, song title, exact year, year ±3, or decade), and the metadata stays hidden until reveal. Optionally, players can play along on their own phones with a 5×5 bingo card.

Live demo (you aren't able to host unless the owner of the repo/Spotify application has added you as a test user): https://rugern.github.io/open-hits/

## Stack

TypeScript + React + Tailwind. No backend — everything runs in the browser, including Spotify auth via PKCE. Deployed as a static site to GitHub Pages.

## How it works

- **Host** signs in with their Spotify account, picks a playlist, and runs the wheel. Music plays through any Spotify device they own (phone, desktop, smart speaker). Spotify Premium is required to play.
- **Players** open the same site on their own phones, tap "Join game", and get a bingo card to mark off as they guess each round. They can also type their guess into an input field and rotate their phone to landscape to reveal it in big text across the room. No Spotify account needed.

For the architectural details (PKCE flow, Connect API choice, the metadata-hiding constraint, etc.), see [CLAUDE.md](./CLAUDE.md).

## Run your own deployment

The hosted demo above runs against my Spotify dev app, which is in **Development Mode**. Spotify caps Development Mode apps at a small allowlist of test users (currently 5 — you have to add each user's Spotify email to the dashboard before they can sign in). That means the demo can't scale beyond a handful of friends.

If you want to host your own instance for your own group, fork this repo and follow the steps below. Total time: ~15 minutes.

### 1. Fork and rename if you like

Fork [rugern/open-hits](https://github.com/rugern/open-hits). The default branch is `main`; the GitHub Action in `.github/workflows/deploy.yml` will deploy `main` to GitHub Pages on every push.

If you change the repo name (e.g. `your-username/hitster-clone`), update two places that hard-code the path `/open-hits/`:

- `vite.config.ts` — change `base: '/open-hits/'` to `/your-repo-name/`.
- `public/404.html` — `pathSegmentsToKeep` stays at `1`; no change needed unless you deploy at a deeper path.

If you keep the repo name `open-hits`, no path changes needed.

### 2. Enable GitHub Pages

In your fork's repo settings → **Pages** → set **Source** to **GitHub Actions**. The first push to `main` will then publish to `https://<your-username>.github.io/<repo-name>/`.

Verify the action succeeded under **Actions** → **Deploy to GitHub Pages**.

### 3. Create a Spotify Developer app

1. Go to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) and sign in.
2. Click **Create app**.
3. Fill in:
   - **App name** / **App description**: anything (e.g. "Open Hits — me & friends")
   - **Redirect URIs** — this must match exactly, including the trailing slash:
     - For production: `https://<your-username>.github.io/<repo-name>/`
     - For local dev: `http://127.0.0.1:5173/<repo-name>/` (Spotify rejects `localhost` for apps registered after early 2025 — use the IPv4 loopback)
   - **Which API/SDKs are you planning to use?**: tick **Web API**.
4. Save. Copy the **Client ID** from the app's **Settings** page.

### 4. Add test users

Still on your app's dashboard:

1. Open **Settings** → **User Management**.
2. Add the Spotify email + display name of every person who'll sign in as a host. They must already have a Spotify account.
3. Spotify limits Development Mode to a fixed number of users (around 5 at the time of writing). If you outgrow that, you can apply for [Extended Quota Mode](https://developer.spotify.com/documentation/web-api/concepts/quota-modes) if you fulfill their requirements, but for a small group of friends Development Mode is enough.

Players who only join via the bingo card (`/join`) don't need to be added — only people who sign in as the host.

### 5. Plug in your Client ID

Edit `src/spotify/config.ts` and replace the `SPOTIFY_CLIENT_ID` value with the one from your Spotify dashboard:

```ts
export const SPOTIFY_CLIENT_ID = 'your-client-id-here'
```

The redirect URI is computed automatically from the deployed URL, so as long as the URI you registered in step 3 matches your Pages URL, no further config is needed.

Commit, push to `main`, and the deploy action will publish your version. You're done.

## Local development

```bash
npm install
npm run dev
```

The dev server runs at **http://127.0.0.1:5173/open-hits/** (use the IPv4 loopback, not `localhost` — Spotify rejects `localhost` redirect URIs for new apps). Make sure `http://127.0.0.1:5173/<repo-name>/` is registered as a redirect URI in your Spotify app's dashboard, otherwise sign-in will fail.

To produce a production build:

```bash
npm run build
npm run preview   # serves dist/ for a final check
```
