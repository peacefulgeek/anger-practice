# Full audit todo — anger-practice

## Phase 1: Inventory
- [ ] Tree of src/, server/, client/src/, scripts/
- [ ] tsc --noEmit on full project
- [ ] pnpm build clean
- [ ] grep for known anti-patterns (any, ts-ignore, TODO, console.error, throw)

## Phase 2: Server / lib / cron / scripts
- [ ] server/index.ts — route order, error handling
- [ ] src/lib/store.ts — bunny resync, listArticles vs listAllArticles
- [ ] src/lib/bunnyStore.ts — error handling, retries
- [ ] src/lib/config.ts — env defaults safe
- [ ] src/lib/herbs.ts — all 133 ASINs valid shape
- [ ] src/lib/articles*.ts — generation, validation
- [ ] src/cron/index.ts — schedules, 1800w gate, gated promotion
- [ ] scripts/*.mjs — paths, error paths, push-to-bunny

## Phase 3: Client
- [ ] client/index.html
- [ ] client/src/App.tsx — routes, layout
- [ ] client/src/components/SiteLayout.tsx
- [ ] client/src/pages/Home.tsx — broken images? lazy state?
- [ ] client/src/pages/Articles.tsx — search/filter, dates
- [ ] client/src/pages/Article.tsx — sidebar/body, formatDate, gated state
- [ ] client/src/pages/Assessments.tsx + Assessment.tsx
- [ ] client/src/pages/Herbs.tsx
- [ ] client/src/pages/FireToolkit.tsx
- [ ] client/src/pages/About.tsx
- [ ] client/src/data/articles.json fresh
- [ ] tailwind tokens, font loading

## Phase 4: Fix all + verify
## Phase 5: Push + verify live
## Phase 6: Report
