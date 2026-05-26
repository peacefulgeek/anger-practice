# Deploy: Git → Railway → Bunny

The Anger Practice is a **stateless** Express + Vite service. Article JSON
lives on **Bunny Storage** (zone `anger-practice`). Railway is just compute.
No volume needed.

```
┌─────────┐    git push     ┌──────────┐   boot pulls cache    ┌──────────┐
│ Local   │ ───────────────▶│ Railway  │ ◀───────────────────▶ │ Bunny    │
│ laptop  │                 │ (Node 22)│   crons read & write  │ Storage  │
└─────────┘                 └──────────┘                       └──────────┘
                                  │                                  │
                                  └── serves /api/articles ──────────┘
```

## What is on Bunny

| Bunny path                              | Purpose                              |
| --------------------------------------- | ------------------------------------ |
| `anger-practice/articles/<slug>.json`   | Every article (live + gated)         |
| `anger-practice/data/topics-queue.json` | Editorial backlog (309 topics today) |
| `anger-practice/library/lib-NN.webp`    | 40 hero images (already there)       |
| `anger-practice/buckets/...`            | Bucket-specific hero pools           |

Reads go through the pull-zone `https://anger-practice.b-cdn.net/...`
(CDN-cached, free egress). Writes go through `ny.storage.bunnycdn.com`
with the storage key hard-coded in `src/lib/config.ts` per spec.

## Required Railway env vars

| Variable             | Value                        | Why                                       |
| -------------------- | ---------------------------- | ----------------------------------------- |
| `NODE_ENV`           | `production`                 | Auto-activates the bunny storage driver   |
| `STORAGE_DRIVER`     | `bunny` (optional)           | Defaults to `bunny` in production         |
| `OPENAI_API_KEY`     | your real DeepSeek key       | DeepSeek V4-Pro for article generation    |
| `OPENAI_BASE_URL`    | `https://api.deepseek.com`   | Direct call (bypasses any sandbox proxy)  |
| `OPENAI_MODEL`       | `deepseek-v4-pro`            | Matches voice & length already shipped    |
| `AUTO_GEN_ENABLED`   | `true`                       | Activates the in-process crons            |

**No volume is required.** The ~3 MB of article JSON lives in the container's
ephemeral disk and is repopulated from Bunny on every boot (~4-8 seconds for
the full 171 articles, 16-way concurrency).

## Deploy steps

1. **Push the repo** to GitHub (`peacefulgeek/anger-practice`).
2. **In Railway:** New Project → Deploy from GitHub repo.
3. **Variables tab:** paste in the table above.
4. **Deploy.** Nixpacks reads `nixpacks.toml`, runs `pnpm install`,
   `pnpm build`, then `node dist/index.js`.
5. **Watch the first lines of logs:**
   ```
   [store] driver=bunny pulled=171 cached=171
   [cron] starting 5 schedulers
   Server running on http://0.0.0.0:<port>/
   ```
6. **Smoke-test from your laptop:**
   ```bash
   curl https://<railway-url>/health
   # → {"ok":true,"articles":100,"storageDriver":"bunny",...}

   curl -s https://<railway-url>/api/articles | jq 'length'
   # → 100
   ```
7. **Bind your custom domain** in Networking → Custom Domains. Railway
   issues the TLS cert automatically.

## Publish-state policy

- **Exactly 100 articles are publicly visible.** Every published article
  has `wordCount >= 1800` (enforced by `scripts/cap-published.mjs`).
- All other articles are gated: `published: false`, with a future
  `scheduledFor` date staggered every 6 hours.
- The publish-cron promotes ONE gated article per tick when its
  `scheduledFor` matures. No bursts.
- The Express `/api/articles` endpoint and the build-time bundle both
  filter to live-only via `isLive()` in `src/lib/store.ts`.

To re-cap at any time (also pushes updates to Bunny):

```bash
STORAGE_DRIVER=bunny node scripts/cap-published.mjs
```

## The five in-process crons (all DeepSeek-backed, no Manus, no external scheduler)

| Cron              | Schedule (PT)              | What it does                                  |
| ----------------- | -------------------------- | --------------------------------------------- |
| publish           | every 6h                   | promote next gated OR generate next topic     |
| spotlight         | daily 07:00                | rotate herb + book spotlight JSON             |
| monthly index     | 1st of month 02:00         | rebuild article index + client bundle         |
| quarterly refresh | 2nd of Jan/Apr/Jul/Oct 03  | audit pass over existing articles             |
| ASIN health       | weekly Sun 04:00           | HEAD-check every Amazon link                  |

All five live in `src/cron/index.ts`. They auto-start when the server boots,
unless `AUTO_GEN_ENABLED=false`.

## Re-migrate local → Bunny

If you've made local changes you want to push:

```bash
node scripts/migrate-to-bunny.mjs
# → uploads every data/articles/*.json + data/topics-queue.json (6-8s)
```

## Rollback

Railway keeps every deploy. Click any prior deploy → "Redeploy". No
data-level rollback is needed because Bunny is the canonical store; the
container is disposable.

## What is NOT on Manus

- **No Manus CDN dependency** — all images on `anger-practice.b-cdn.net`
- **No Manus scheduling** — all crons are `node-cron` in-process
- **No Manus runtime imports** anywhere in the codebase
- **No Manus secrets** — Bunny key in code by spec, DeepSeek key via Railway env

This entire stack is portable: clone the repo, set the four env vars on
any Node-22 host, and it runs. Railway is just our chosen host.
