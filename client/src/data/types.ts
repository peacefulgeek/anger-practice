import { useEffect, useState } from "react";
import raw from "./articles.json";

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

// Bundled articles (what the client ships with at build time).
export const articles: Article[] = raw as Article[];

export function getArticle(slug: string): Article | undefined {
  return articles.find((a) => a.slug === slug);
}

/**
 * Hook to keep the article list fresh with what the server has at runtime.
 * Falls back to the bundled list if the API is unreachable (static hosting mode).
 */
export function useArticles(): Article[] {
  const [list, setList] = useState<Article[]>(articles);
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
        setList(sorted);
      })
      .catch(() => {
        /* ignore; keep bundled */
      });
    return () => {
      cancelled = true;
    };
  }, []);
  return list;
}

export function useArticle(slug: string): Article | undefined {
  const all = useArticles();
  return all.find((a) => a.slug === slug);
}
