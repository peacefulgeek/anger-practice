# The Anger Practice - Todo

- [ ] Generate 40 themed hero images
- [ ] Upload 40 images to Bunny CDN at /library/lib-01..40.webp
- [ ] Build Paul Voice Gate lib
- [ ] Build DeepSeek V4-Pro generator (OpenAI SDK compat)
- [ ] Build assignHeroImage() with hardcoded Bunny creds
- [ ] Build verified-asins.json (Amazon, tag=spankyspinola-20)
- [ ] Build 5 in-code node-cron runners (article publisher, product spotlight, monthly, quarterly, asin health)
- [ ] Build scripts/start-with-cron.mjs
- [ ] Build scripts/bulk-seed.mjs (500 topic queue)
- [ ] Seed 30 initial published articles
- [ ] Homepage (journal masthead, vertical article stream)
- [ ] About page (Oracle Lover, theoraclelover.com link)
- [ ] Article page (two-column, theoraclelover.com byline, floating share rail, bio at bottom)
- [ ] 9 assessments (interactive quizzes)
- [ ] 40 herbs/supplements page with verified ASINs
- [ ] The Fire Toolkit (recommended products)
- [ ] Privacy policy (Amazon Associate + health disclaimer)
- [ ] /health endpoint on server
- [ ] .do/app.yaml for DigitalOcean
- [ ] Remove susandrury references (N/A, none exist)
- [ ] Create GitHub repo peacefulgeek/anger-practice
- [ ] Push to peacefulgeek/anger-practice

## Bunny password in code (user request)
- [ ] Hardcode Bunny credentials in src/lib/config.ts
- [ ] Remove env fallbacks; grep for BUNNY_STORAGE_PASSWORD
- [ ] Commit + push to peacefulgeek/anger-practice

## 500-article pre-seed (one-time, in Manus sandbox)
- [ ] Define 12 image buckets (trauma, couples, women's-rage, parental, somatic, TCM, ayurveda, grief, workplace, spiritual-bypass, boundaries, rituals)
- [ ] Generate 120 themed images, compressed WebP, uploaded to Bunny /buckets/{bucket}/img-XX.webp
- [ ] Add bucketMatcher() that scores each topic and picks bucket
- [ ] Bump min words 1800; max_tokens 7000; voice-gate threshold; hero assignment from matched bucket
- [ ] Build resumable bulk-seed runner with checkpoint
- [ ] Run 500 generations in parallel batches
- [ ] Verify: 500 ≥1800w, all gated, byline, hero on Bunny, only 30 published
- [ ] Audit: zero Manus deps, all crons in-code only
- [ ] Commit + push

## Continuation: get to 500 gated articles in this session
- [ ] Verify bulk-seed process is alive
- [ ] If dead, restart at concurrency=2 with hardened backoff
- [ ] Watch for "best-attempt under 1800" failures and add salvage logic if many
- [ ] Poll every 30 min, commit/push to GitHub
- [ ] Reach 500 articles
- [ ] Verify all 500 ≥1800 words, voice-gated, byline, bucket image
- [ ] Confirm only first 30 published, rest scheduledFor staggered
- [ ] Final Manus-free audit + push
