# Generate-all-307 todo

- [ ] Read queue, last gated scheduledFor, confirm topic list
- [ ] Test deepseek-v4-pro reachable from sandbox via the project's lib
- [ ] Generate 307 articles in parallel (subagents that emit article JSON conforming to StoredArticle)
- [ ] Generate 307 unique hero images, upload to Bunny
- [ ] Assign scheduledFor for each, Mon-Sat 9am PT, starting after existing gated queue
- [ ] Push all 307 articles to Bunny
- [ ] Run prebuild ASIN guard, fix any non-cabinet ASIN, build, push to git
- [ ] Wait Railway, verify live: queue length 0, gated count = current+307, schedule looks right
