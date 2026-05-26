# Honest audit — what I actually need to verify

Status legend: [ ] not checked | [✓] verified working | [✗] broken | [!] suspicious

## Site / build
- [ ] Dev server actually loads in browser (Home page)
- [ ] Build succeeds clean (no errors)
- [ ] Production server boots and serves the SPA
- [ ] /api/articles returns exactly 100 in prod
- [ ] /health returns exactly 100 in prod

## Routes & pages
- [ ] / (Home) renders without runtime error
- [ ] /assessments lists 9 items
- [ ] /assessments/:slug works for at least 3 slugs
- [ ] /herbs lists 203 items in 12 categories, no React errors
- [ ] /article/:slug works for the lead and a random other slug

## Data integrity
- [ ] 171 article JSON files exist with no malformed ones
- [ ] Exactly 100 have published:true
- [ ] All 71 gated have future scheduledFor
- [ ] herbs.ts has 203 entries, all unique ASINs
- [ ] All herb ASINs render Amazon links with the spankyspinola-20 tag
- [ ] Word-count claim: random sample of 5 published articles ≥1800 words

## Crons
- [ ] node-cron in package.json
- [ ] startCrons wired into server boot
- [ ] No Manus scheduler references anywhere
- [ ] No Manus runtime imports

## Railway readiness
- [ ] railway.json valid
- [ ] nixpacks.toml valid
- [ ] Procfile valid
- [ ] package.json engines pins Node 22
- [ ] prebuild step runs
- [ ] DEPLOY-RAILWAY.md exists and is accurate

## Known suspicious things to verify
- [ ] Did my path refactor break the dev server? (dev uses tsx, not dist)
- [ ] Does the publish-cron promotion actually fire? Test by manually setting scheduledFor=past on a gated article and running `node dist/index.js publish`
- [ ] Are the bunny CDN image URLs actually live? Spot check 3
- [ ] Article word counts — sample 5 random published articles
- [ ] Is there a Journal route that uses any data I broke?
- [ ] Word "Forty" or "Forty herbs" or stale counts left anywhere
