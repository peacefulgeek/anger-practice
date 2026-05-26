# The Anger Practice

A companion journal to [theoraclelover.com](https://theoraclelover.com) on healthy
anger, rage work, somatic release, and the body's wisdom. Not an influencer blog.

## Stack

- **Client:** React 19, Vite 7, Tailwind 4, wouter, Streamdown
- **Server:** Node 22, Express, node-cron, TypeScript (esbuild bundle)
- **Content:** File-based JSON articles (`data/articles/*.json`)
- **Editorial queue:** `data/topics-queue.json` (500 items)
- **AI:** DeepSeek V4-Pro via OpenAI-compatible SDK
- **Images:** Bunny CDN library (40 themed images) at
  `https://anger-practice.b-cdn.net/library/lib-01.webp` … `lib-40.webp`
- **Amazon Associates tag:** `spankyspinola-20`

## Pages

- `/` — Journal homepage (editorial masthead + featured issue)
- `/article/:slug` — Two-column article with hero image, products, byline
- `/assessments` — Nine self-assessments (suppression, somatic, boundary,
  passive-aggression, liver fire TCM, pitta Ayurveda, anger/grief,
  childhood rules, rage-readiness)
- `/assessments/:slug` — Interactive Likert assessment with scored bands
- `/herbs` — 203 verified-ASIN herbs, supplements, formulas, and rituals across twelve modalities
- `/fire-toolkit` — Nine body-first practices
- `/about` — Editorial stance and byline
- `/privacy` — Disclosures + Amazon Associates + not-medical-advice

## Runtime endpoints

- `GET /health` — `{ ok, articles, autoGen, deepseekModel, time }`
- `GET /api/articles` — JSON list of published articles

## In-code crons (node-cron)

| Schedule (PT)          | Task                                |
| ---------------------- | ----------------------------------- |
| Every 6 hours          | Pop next topic from queue, generate |
| Daily 07:00            | Rotate homepage product spotlight   |
| Monthly 1st 02:00      | Rebuild article index               |
| Quarterly 2nd 03:00    | Audit existing articles             |
| Weekly Sunday 04:00    | ASIN health check                   |

Enable / disable via `AUTO_GEN_ENABLED=true|false`.

## Local development

```bash
pnpm install
pnpm dev       # vite dev on :3000
```

Generate seed articles:

```bash
OPENAI_API_KEY=... OPENAI_BASE_URL=https://api.deepseek.com \
  OPENAI_MODEL=deepseek-v4-pro node --import tsx scripts/seed-articles.mjs 20
node scripts/compile-articles.mjs
```

## Deploy

### Railway (recommended for one-off + cron)

See [`DEPLOY-RAILWAY.md`](./DEPLOY-RAILWAY.md) for the full checklist (env vars,
volume mount, smoke tests, rollback). Short version:

1. Point Railway at this repo.
2. Nixpacks detects `nixpacks.toml`, installs pnpm + Node 22.
3. Set env vars from `ENV_TEMPLATE.md` (`OPENAI_API_KEY` is the only one you'd typically override; Bunny credentials are hardcoded in `src/lib/config.ts`).
4. **Mount a persistent volume** at `/app/data` and set `DATA_ROOT=/app/data`, otherwise cron-generated articles disappear on redeploy.
5. Railway runs `node dist/index.js` and keeps the in-process crons alive.

### DigitalOcean App Platform

`.do/app.yaml` is ready. Create the app, add secrets, connect
`peacefulgeek/anger-practice`, done.

### Build output

```
dist/
  index.js          (server bundle, esbuild)
  public/
    index.html
    assets/...      (client bundle, Vite)
```

## Content safety

- Voice Gate (`src/lib/voiceGate.ts`) runs on every generated piece.
- Banned patterns include "delve into", "tapestry of", "in today's fast-paced
  world", "embark on a journey", and about 40 others.
- Paul Wagner and related names are banned.
- Articles under 1,800 words are gated out of the public bundle by `scripts/cap-published.mjs`.
- `pnpm cap:published` re-runs the cap any time — keeps the public list at 100 articles, all ≥1,800 words.
- Voice-gate rejects raw generations under 900 words and requeues them.

## License

Proprietary. © The Oracle Lover.
