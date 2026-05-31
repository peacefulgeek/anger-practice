import { useEffect, useState } from "react";

const CDN_BASE = "https://anger-practice.b-cdn.net";

export interface Article {
  title: string;
  slug: string;
  dek: string;
  bodyMarkdown: string;
  heroImage: string;
  heroIndex: number;
  wordCount: number;
  voiceScore: number;
  researchers: string[];
  inlineProducts: { asin: string; title: string; link: string }[];
  bottomProducts: { asin: string; title: string; link: string; category: string }[];
  createdAt: string;
  publishedAt: string;
}

/** Lightweight index entry (no bodyMarkdown — that's fetched on demand from CDN). */
export interface ArticleIndex {
  title: string;
  slug: string;
  dek: string;
  heroImage: string;
  publishedAt: string;
  wordCount: number;
}

/**
 * Hook: fetches the published article index from the server API.
 * The server already has the full list in memory (synced from Bunny).
 * Returns lightweight index entries for listing pages.
 */
export function useArticles(): ArticleIndex[] {
  const [list, setList] = useState<ArticleIndex[]>([]);
  useEffect(() => {
    let cancelled = false;
    fetch("/api/articles")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !Array.isArray(data) || !data.length) return;
        const sorted = [...data].sort(
          (a, b) =>
            new Date(b.publishedAt || b.createdAt).getTime() -
            new Date(a.publishedAt || a.createdAt).getTime(),
        );
        // Map to lightweight index
        setList(
          sorted.map((a) => ({
            title: a.title,
            slug: a.slug,
            dek: a.dek,
            heroImage: a.heroImage || `${CDN_BASE}/articles-hero/${a.slug}.webp`,
            publishedAt: a.publishedAt,
            wordCount: a.wordCount,
          })),
        );
      })
      .catch(() => {
        /* server unreachable — empty list until retry */
      });
    return () => {
      cancelled = true;
    };
  }, []);
  return list;
}

/**
 * Hook: fetches a single full article from Bunny CDN by slug.
 * Globally cached, fast. Falls back to server API if CDN fails.
 */
export function useArticle(slug: string): { article: Article | null; loading: boolean } {
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);

    // Primary: fetch from Bunny CDN (globally cached)
    fetch(`${CDN_BASE}/articles/${slug}.json`)
      .then((r) => {
        if (!r.ok) throw new Error(`CDN ${r.status}`);
        return r.json();
      })
      .then((data) => {
        if (cancelled) return;
        // Ensure heroImage uses CDN URL
        if (!data.heroImage || !data.heroImage.startsWith("http")) {
          data.heroImage = `${CDN_BASE}/articles-hero/${slug}.webp`;
        }
        setArticle(data);
        setLoading(false);
      })
      .catch(() => {
        // Fallback: try server API
        if (cancelled) return;
        fetch(`/api/articles`)
          .then((r) => (r.ok ? r.json() : null))
          .then((all) => {
            if (cancelled) return;
            const found = Array.isArray(all) ? all.find((a: Article) => a.slug === slug) : null;
            setArticle(found || null);
            setLoading(false);
          })
          .catch(() => {
            if (!cancelled) {
              setArticle(null);
              setLoading(false);
            }
          });
      });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  return { article, loading };
}

// Legacy compat: getArticle is no longer synchronous. Use useArticle hook instead.
export function getArticle(_slug: string): Article | undefined {
  return undefined; // Deprecated — use useArticle hook
}

// Legacy compat
export const articles: Article[] = [];
