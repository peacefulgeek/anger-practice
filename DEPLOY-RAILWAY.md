# Deploying The Anger Practice to Railway

This site is a **full-stack Node service** (Express + Vite static client + in-process `node-cron`).
It runs as a single Railway service. No external CDN beyond Bunny (which is already configured
in `src/lib/config.ts` and serves all images from `https://anger-practice.b-cdn.net`).

---

## 1. One-time setup

1. **Create a new Railway project** → "Deploy from GitHub repo" → pick this repo.
2. Railway will read `nixpacks.toml` + `railway.json` and pick:
   - Node 22 (pinned in `package.json` `engines`)
   - pnpm install (frozen-lockfile off so it tolerates lockfile drift)
   - `pnpm build` (runs `prebuild` → `compile-articles.mjs` → vite + esbuild)
   - `node dist/index.js` as the start command
   - `/health` as the healthcheck (returns `{ ok, articles, autoGen, time }`)

## 2. Environment variables to set in Railway

Open the service → **Variables**. Paste:

```env
OPENAI_API_KEY=sk-...your-deepseek-key...
OPENAI_BASE_URL=https://api.deepseek.com
OPENAI_MODEL=deepseek-v4-pro
AUTO_GEN_ENABLED=true
NODE_ENV=production
PORT=3000
```

Notes:
- `OPENAI_*` variables are reused for DeepSeek (DeepSeek is OpenAI-compatible).
- `AUTO_GEN_ENABLED=false` disables all 5 crons (useful for staging).
- `PORT` is set by Railway automatically; the env line above is a safety default.
- **Bunny CDN credentials are hardcoded in `src/lib/config.ts`** — nothing to set here.
- **No Manus runtime variables.** This site has zero Manus dependencies.

## 3. Persistent volume (required for article storage)

Railway containers are ephemeral. Add a volume so articles, the queue, and
generated state survive restarts:

1. Service → **Settings** → **Volumes** → **+ New Volume**
2. Mount path: `/app/data`
3. Size: 1 GB (plenty for the ~478-article corpus)

The repo writes everything that must persist into `data/` (articles, queue, etc.).
At container `cwd` this maps cleanly to `/app/data`.

> If you skip the volume, the first deploy is fine because the articles are committed
> to the repo, but cron-generated new pieces will vanish on every redeploy. Use a volume.

## 4. Publish-state policy

**Cap: 100 articles are publicly visible at any time. The rest are gated.**

- `scripts/cap-published.mjs` enforces the cap. Already run; current state is **100 published / 71 gated**.
- Gated articles have `published: false` + a future `scheduledFor` date staggered every 6 hours.
- The publish-cron (every 6h) promotes the next gated article when its `scheduledFor` matures —
  one per tick. No bursts.
- The Express `/api/articles` endpoint and the build-time bundle (`compile-articles.mjs`) both
  filter to live-only via the shared `isLive()` predicate in `src/lib/store.ts`.

To re-cap at any time (e.g., after a fresh seed):

```bash
pnpm cap:published
```

## 5. Five in-process crons (all DeepSeek-backed, no Manus, no external scheduler)

| Cron | Schedule (PT) | What it does |
| --- | --- | --- |
| publish | every 6h | promote next gated draft OR generate next queue topic |
| spotlight | daily 07:00 | rotate herb + book spotlight JSON |
| monthly index | 1st of month 02:00 | rebuild article index + client bundle |
| quarterly refresh | 2nd of Jan/Apr/Jul/Oct 03:00 | audit pass |
| ASIN health | weekly Sun 04:00 | HEAD-check every Amazon link |

All five live in `src/cron/index.ts`. They auto-start when `server/index.ts` boots, unless
`AUTO_GEN_ENABLED=false`.

## 6. Domain

After first deploy:

1. Service → **Settings** → **Networking** → **Custom Domain** → add `theangerpractice.com`
   (or whatever Squarespace/Cloudflare host you're using).
2. Point your DNS CNAME at the Railway-provided target.
3. Railway issues the TLS cert automatically.

## 7. Smoke tests after deploy

```bash
# Health endpoint should return JSON with articles: 100
curl https://YOUR-DOMAIN/health

# Public API should also be exactly 100
curl -s https://YOUR-DOMAIN/api/articles | jq 'length'

# Spot-check a gated article (should 404 in the SPA, but the JSON file is on disk
# for the cron to promote later)
```

## 8. Re-deploy

Push to `main` → Railway redeploys automatically. The `prebuild` step refreshes the
client article bundle, so any newly-promoted articles ship on the next deploy.

## 9. Rollback

Railway dashboard → **Deployments** → click any prior deployment → **Redeploy**.
