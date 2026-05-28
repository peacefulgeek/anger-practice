# Backlink Websites — FINAL PASS Scope

Source: BacklinkWebsites-FinalPass.pdf (user upload, May 28 2026)
Apply to: theangerpractice.com (this repo)
Output format: one line per item — FIXED / VERIFIED ALREADY GOOD / BLOCKED <reason>
Then PUSH using github-push-workflow skill, deleting any zip first.

## 1. Writing engine
- CLAUDE_API_KEY = `sk-ant-api03-NPve1hqIxvPLVSbZ2lfZVCPex3vhNu4P2UM6RXCKpx64usvP3jl5nWjlRmDfPWX7V60DzUR9H2yS8wQHioIflg-icsUsQAA`
- Will be deleted later. Store as `CLAUDE_API_KEY` in secrets.
- Switch ALL article generation, rewrites, refresh crons to Claude. Model: `claude-sonnet-4-6`.

## 2. Writing quality (regenerate, do not patch, if violated)
- Lovely, warm, informative, encouraging, divinely inspired. Real voice, real heart.
- NO em-dashes anywhere. Use plain hyphen with spaces if one is needed.
- BANNED words/phrases (any one occurrence triggers regeneration):
  delve, tapestry, paradigm, synergy, leverage, unlock, empower, utilize, pivotal, embark,
  underscore, paramount, seamlessly, robust, beacon, foster, elevate, curate, curated,
  bespoke, resonate, harness, intricate, plethora, myriad, comprehensive, transformative,
  groundbreaking, innovative, cutting-edge, revolutionary, state-of-the-art, ever-evolving,
  profound, holistic, nuanced, multifaceted, stakeholders, ecosystem, landscape, realm,
  sphere, domain, furthermore, moreover, additionally, consequently, subsequently, thereby,
  streamline, optimize, facilitate, amplify, catalyze.
- BANNED phrases:
  "it's important to note", "in conclusion", "in summary", "in the realm of", "dive deep into",
  "at the end of the day", "in today's fast-paced world", "plays a crucial role",
  "a testament to", "when it comes to", "cannot be overstated", "needless to say",
  "first and foremost", "last but not least".
- Contractions throughout. Varied sentence length. Direct address OR first person — pick one and commit.
- At least 2 conversational openers per article. Concrete specifics over abstractions.

## 3. E-E-A-T (every published article must carry ALL six signals or it gets regenerated, not patched)
1. 3-sentence TL;DR block at the top, wrapped in `<section data-tldr="ai-overview" aria-label="In short">`. Each sentence declarative, under 32 words, no questions.
2. Self-referencing language woven into body: "in our experience," "when we tested," "across the articles we've published on this site," "in my own practice," "over the years I've seen."
3. At least 3 internal links with varied anchor text WOVEN INTO PROSE (not stacked at bottom).
4. At least 1 outbound link to authoritative source (.gov, .edu, NIH, CDC, WHO, PubMed, Nature, ScienceDirect) with rel="nofollow noopener" target="_blank".
5. Visible last-updated date in byline using proper datetime attribute.
6. Author byline block at the BOTTOM with credential, datetime, and 1-2 sentences of warm self-referencing context specific to that article's topic.

## 4. AEO and LLM discoverability — audit every item, fix what's missing
- Canonical tags on every public page with UTM params, fbclid, gclid, mc_eid stripped.
- Robots meta on every public page: index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1.
- Open Graph + Twitter Card meta on every page including: og:type, og:title, og:description, og:url, og:image, article:published_time, article:modified_time, article:author, article:section, twitter:card=summary_large_image.
- Article JSON-LD per article with: headline, description, datePublished, dateModified, author, publisher, image, articleSection, wordCount, inLanguage, isAccessibleForFree, mainEntityOfPage, reviewedBy, SpeakableSpecification pointing at the TL;DR block.
- BreadcrumbList JSON-LD per article: Home, All Articles, Category, Article.
- FAQPage JSON-LD auto-extracted from question-shaped H2/H3/H4 headings, capped at 6 pairs. Only emit if real question headings exist - do not invent them.
- HowTo JSON-LD where the article has an ordered list of steps. Mutually exclusive with MedicalCondition.
- WebSite JSON-LD with SearchAction on the homepage.
- Organization JSON-LD sitewide.
- AboutPage and Organization JSON-LD on the About page.
- CollectionPage and ItemList JSON-LD on the articles hub page.
- Person JSON-LD for the author with name, url pointing at the intermediary site, jobTitle, description, knowsAbout, sameAs.
- /sitemap.xml live with every published article, lastmod ISO-8601, newest first.
- /robots.txt explicitly allowing: GPTBot, ChatGPT-User, OAI-SearchBot, ClaudeBot, Claude-Web, anthropic-ai, PerplexityBot, Perplexity-User, Google-Extended, Bingbot, CCBot, Applebot, Applebot-Extended, DuckAssistBot, Meta-ExternalAgent, YouBot, MistralAI-User, Cohere-AI. Sitemap and llms files advertised at the bottom.
- /llms.txt live as markdown index of every published article grouped by category, one-line descriptions.
- /llms-full.txt live as plain-text corpus of every published article body, frontmatter-delimited, ready for RAG ingestion.
- All head meta server-rendered BEFORE React boots so AI crawlers without JS see a complete page on first byte. Verify via curl with GPTBot user agent — title, canonical, JSON-LD must all appear before the root div.

## 5. Validation (run after fixes)
- Google Rich Results Test on a sample article for Article, BreadcrumbList, FAQPage.
- Schema.org validator for generic JSON-LD validity.
- curl -I on /llms.txt expecting 200 and Content-Type text/markdown.
- curl on a published article URL with GPTBot user agent confirming full head present before React shell.
- /sitemap.xml returns 200 lists published articles only.
- /robots.txt is live and names all AI crawlers.

## 6. Article storage
- JSON on Bunny, NOT a database. Articles at `/articles/{slug}.json` on Bunny.
- DB holds only: slug, metadata (status, published_at, queued_at, last_modified_at, hero_url, category, tags, asins_used) and Bunny URL.
- All read paths fetch article body from Bunny.
- If anything is currently in DB body — migrate now. Body must NEVER live in DB.
- Sitemap, llms.txt, llms-full.txt, all public article routes must all fetch from Bunny.

## 7. Article counts
- Target: 30-100 published, 400-500 queued. (We are at 100 + 368 = 468 — hits target.)
- If short, write missing with Claude, run quality gate, never store a failed article.

## 8. Backdate published articles
- Every published article gets randomized published_at across the prior 3 months.
- Nothing should show today's date unless it was genuinely just published today.

## 9. Quarterly refresh cron
- When fires: rewrite article body with Claude — warmer, more specific, more encouraging, fully E-E-A-T + AEO compliant — run quality gate.
- If passes: update body on Bunny, byline date, dateModified in Article JSON-LD.
- If fails: keep original, update timestamp only.

## 10. Bylines
- Every published article must have proper author byline with: warm credential line, datetime matching published_at, 1-2 sentences of warm self-referencing context tied to that specific topic.
- Audit all of them. Patch any that are missing/generic.

## 11. No leakage
- No article, byline, schema, or page anywhere on this site should reference paulwagner.com or Paul Wagner by name.
- Intermediary sites handle that connection. This site stands on its own.

## 12. Done criteria
- One line per item in this scope: FIXED / VERIFIED ALREADY GOOD / BLOCKED <reason>
- Then PUSH using github-push-workflow skill, after deleting any zip files for clean push.
