#!/usr/bin/env python3
"""
Verify live deployment of theangerpractice.com:
- /health returns ok
- /api/articles returns 100 published articles, each containing only ASINs
  in the verified pool (HERBS + BOOKS)
- /sitemap.xml has article URLs
- /robots.txt is sane
"""
import json, re, sys, urllib.request, random, os

BASE = "https://theangerpractice.com"

def fetch(path, parse_json=True, timeout=120):
    with urllib.request.urlopen(f"{BASE}{path}", timeout=timeout) as r:
        body = r.read().decode("utf-8")
    return json.loads(body) if parse_json else body

def parse_asins(path):
    raw = open(path).read()
    return set(re.findall(r'asin:\s*"([A-Z0-9]+)"', raw))

verified = parse_asins("src/lib/herbs.ts") | parse_asins("src/lib/books.ts")
print(f"Verified pool size (HERBS+BOOKS): {len(verified)}")

# /health
print("\n--- /health ---")
print(fetch("/health", parse_json=False).strip())

# /api/articles (full list with bodyMarkdown)
arts = fetch("/api/articles")
arts = arts if isinstance(arts, list) else arts.get("articles", [])
print(f"\n--- /api/articles ---")
print(f"count: {len(arts)}")

# Walk every article, gather every ASIN, check against verified pool
print("\n--- ASIN audit across ALL articles ---")
total_asin_refs = 0
unverified = {}  # asin -> list of slugs
for a in arts:
    body = a.get("bodyMarkdown", "")
    body_asins = set(re.findall(r"amazon\.com/dp/([A-Z0-9]+)", body))
    inline = {p["asin"] for p in a.get("inlineProducts", [])}
    bottom = {p["asin"] for p in a.get("bottomProducts", [])}
    all_a = body_asins | inline | bottom
    total_asin_refs += len(all_a)
    for x in all_a:
        if x not in verified:
            unverified.setdefault(x, []).append(a["slug"])

print(f"distinct (article, asin) pairs: {total_asin_refs}")
print(f"unverified ASINs found: {len(unverified)}")
if unverified:
    for a, slugs in unverified.items():
        print(f"  {a} -> {len(slugs)} articles, first: {slugs[0]}")

# /sitemap.xml
print("\n--- /sitemap.xml ---")
sm = fetch("/sitemap.xml", parse_json=False)
print(f"<url> elements: {sm.count('<url>')}")
print(f"contains theangerpractice.com: {'https://theangerpractice.com' in sm}")
print(f"contains /articles/: {'/articles/' in sm}")

# /robots.txt
print("\n--- /robots.txt ---")
print(fetch("/robots.txt", parse_json=False).strip())

if unverified:
    print("\nFAIL: unverified ASINs still live")
    sys.exit(1)
print("\nPASS: every live ASIN is in the verified pool.")
