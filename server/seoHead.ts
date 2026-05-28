/**
 * Server-side head + JSON-LD renderer.
 *
 * For AI crawlers (GPTBot, ClaudeBot, PerplexityBot, Google-Extended, etc.)
 * and any HTTP client that doesn't execute JavaScript, we inject a complete
 * <head> block into the HTML shell BEFORE the React app boots.
 *
 * Public scope:
 *   - injectHead(html, ctx): swaps a placeholder <!--SSR_HEAD--> in the shell
 *     for a fully built <head>, including OG/Twitter meta and full JSON-LD.
 *   - buildArticleContext(article): builds the per-article rendering context.
 *   - buildHomeContext(articles): builds the homepage rendering context.
 *   - buildArticlesIndexContext(articles): builds the /articles hub context.
 *   - buildAboutContext(): builds the /about page context.
 *
 * Notes:
 *   - All JSON-LD is emitted as <script type="application/ld+json"> blocks.
 *   - Canonical URLs strip UTM/fbclid/gclid/mc_eid query params before use.
 *   - Robots meta is "index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1".
 *   - We never invent FAQ entries; FAQPage JSON-LD is only emitted if real
 *     question-shaped headings exist in the article.
 */

import { SITE } from "../src/lib/config.js";

export interface RenderContext {
  title: string;
  description: string;
  canonical: string;
  ogType: "website" | "article";
  image?: string;
  pageType: "home" | "article" | "articles" | "about" | "static";
  jsonLd: object[];
  publishedAt?: string;
  modifiedAt?: string;
  author?: string;
  articleSection?: string;
  twitterCard?: "summary" | "summary_large_image";
}

export const SITE_URL = "https://theangerpractice.com";
export const ORG_LOGO = `${SITE.url}/favicon.svg`;

const STRIP_PARAMS = new Set([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "fbclid",
  "gclid",
  "mc_eid",
  "mc_cid",
  "yclid",
  "msclkid",
]);

export function canonicalUrl(reqPath: string): string {
  // reqPath comes from Express req.originalUrl (path + query). Strip tracking
  // params, drop trailing slash on subpaths, keep root "/" as-is.
  const u = new URL(reqPath, SITE_URL);
  const keys: string[] = [];
  u.searchParams.forEach((_v, k) => keys.push(k));
  for (const p of keys) {
    if (STRIP_PARAMS.has(p)) u.searchParams.delete(p);
  }
  let pathname = u.pathname;
  if (pathname.length > 1 && pathname.endsWith("/")) pathname = pathname.slice(0, -1);
  u.pathname = pathname;
  // Reorder unsupported chars off — output as string
  const qs = u.searchParams.toString();
  return `${SITE_URL}${pathname}${qs ? `?${qs}` : ""}`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeJson(o: unknown): string {
  // Avoid </script> injection in JSON-LD payloads
  return JSON.stringify(o).replace(/</g, "\\u003c");
}

function organizationLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: SITE.name,
    url: SITE_URL,
    logo: { "@type": "ImageObject", url: ORG_LOGO },
    sameAs: [SITE.authorLink],
  };
}

function personLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${SITE_URL}/#author`,
    name: SITE.author,
    url: SITE.authorLink,
    jobTitle: SITE.authorJobTitle,
    description:
      "Independent essayist on healthy anger, somatic release, and the spiritual dimension of feeling fully.",
    knowsAbout: [
      "anger",
      "rage work",
      "somatic release",
      "emotional regulation",
      "embodied spirituality",
      "polyvagal theory",
    ],
    sameAs: [SITE.authorLink],
  };
}

function websiteLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: SITE_URL,
    name: SITE.name,
    description: SITE.description,
    publisher: { "@id": `${SITE_URL}/#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/articles?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };
}

function breadcrumbLd(parts: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: parts.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: p.name,
      item: p.url,
    })),
  };
}

function extractFaqsFromBody(body: string): { q: string; a: string }[] {
  // Look for H2/H3/H4 headings ending in "?" and grab the next paragraph.
  const out: { q: string; a: string }[] = [];
  const re = /^(##+)\s+(.+\?)\s*$/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(body)) !== null && out.length < 6) {
    const q = m[2].trim();
    // Find next non-empty paragraph after the heading
    const after = body.slice(m.index + m[0].length);
    const paraMatch = after.match(/\n\s*\n([^\n][^\n]+(?:\n[^\n]+)*)/);
    let a = paraMatch ? paraMatch[1].trim() : "";
    // Strip markdown links/emphasis for clean answer text
    a = a.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/[*_`]/g, "");
    if (a.length > 600) a = a.slice(0, 580).trim() + " ...";
    if (q && a) out.push({ q, a });
  }
  return out;
}

function articleLd(args: {
  title: string;
  description: string;
  url: string;
  image: string;
  datePublished: string;
  dateModified: string;
  wordCount: number;
  articleSection: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${args.url}#article`,
    headline: args.title,
    description: args.description,
    image: [args.image],
    datePublished: args.datePublished,
    dateModified: args.dateModified,
    author: { "@id": `${SITE_URL}/#author` },
    publisher: { "@id": `${SITE_URL}/#organization` },
    mainEntityOfPage: { "@type": "WebPage", "@id": args.url },
    articleSection: args.articleSection,
    wordCount: args.wordCount,
    inLanguage: "en-US",
    isAccessibleForFree: true,
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: ['[data-tldr="ai-overview"]'],
    },
    reviewedBy: { "@id": `${SITE_URL}/#author` },
  };
}

function faqPageLd(faqs: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

function howToLdIfPresent(body: string, title: string, url: string) {
  // Detect ordered-step content: an H2 like "Steps", "How to", "Practice", or
  // a numbered list with at least 3 items.
  const orderedRe = /(?:^|\n)1\.\s+[^\n]+\n2\.\s+[^\n]+\n3\.\s+[^\n]+/;
  if (!orderedRe.test(body)) return null;
  const stepsMatch = body.match(/(?:^|\n)((?:\d+\.\s+[^\n]+\n?)+)/);
  if (!stepsMatch) return null;
  const stepLines = stepsMatch[1]
    .split(/\n/)
    .map((l) => l.match(/^\d+\.\s+(.+)$/))
    .filter(Boolean)
    .map((m) => (m as RegExpMatchArray)[1].trim());
  if (stepLines.length < 3) return null;
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: title,
    url,
    step: stepLines.map((t, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: t.length > 80 ? t.slice(0, 80) + "..." : t,
      text: t,
    })),
  };
}

export function buildArticleContext(article: {
  title: string;
  slug: string;
  dek: string;
  bodyMarkdown: string;
  heroImage: string;
  publishedAt: string | null;
  updatedAt?: string;
  wordCount: number;
}): RenderContext {
  const url = `${SITE_URL}/article/${article.slug}`;
  const datePublished = article.publishedAt || new Date().toISOString();
  const dateModified = article.updatedAt || datePublished;
  const description = (article.dek || "").slice(0, 280) || SITE.description;
  const faqs = extractFaqsFromBody(article.bodyMarkdown);
  const howTo = howToLdIfPresent(article.bodyMarkdown, article.title, url);

  const jsonLd: object[] = [
    organizationLd(),
    personLd(),
    websiteLd(),
    articleLd({
      title: article.title,
      description,
      url,
      image: article.heroImage,
      datePublished,
      dateModified,
      wordCount: article.wordCount,
      articleSection: "Anger Practice",
    }),
    breadcrumbLd([
      { name: "Home", url: SITE_URL + "/" },
      { name: "All Articles", url: SITE_URL + "/articles" },
      { name: article.title, url },
    ]),
  ];
  if (faqs.length > 0) jsonLd.push(faqPageLd(faqs));
  if (howTo) jsonLd.push(howTo);

  return {
    title: `${article.title} - The Anger Practice`,
    description,
    canonical: url,
    ogType: "article",
    image: article.heroImage,
    pageType: "article",
    jsonLd,
    publishedAt: datePublished,
    modifiedAt: dateModified,
    author: SITE.author,
    articleSection: "Anger Practice",
    twitterCard: "summary_large_image",
  };
}

export function buildHomeContext(articles: { slug: string; title: string }[]): RenderContext {
  const url = SITE_URL + "/";
  const jsonLd: object[] = [
    organizationLd(),
    personLd(),
    websiteLd(),
    breadcrumbLd([{ name: "Home", url }]),
  ];
  return {
    title: `${SITE.name} - Healthy Anger, Rage Work, and Emotional Healing`,
    description: SITE.description,
    canonical: url,
    ogType: "website",
    image: `${SITE.url}/og-default.png`,
    pageType: "home",
    jsonLd,
    twitterCard: "summary_large_image",
  };
}

export function buildArticlesIndexContext(articles: {
  slug: string;
  title: string;
  dek: string;
  publishedAt: string | null;
}[]): RenderContext {
  const url = SITE_URL + "/articles";
  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: articles.slice(0, 100).map((a, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE_URL}/article/${a.slug}`,
      name: a.title,
    })),
  };
  const collectionPage = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${url}#collection`,
    url,
    name: "All Articles - The Anger Practice",
    description: SITE.description,
    isPartOf: { "@id": `${SITE_URL}/#website` },
    mainEntity: itemList,
  };
  return {
    title: "All Articles - The Anger Practice",
    description:
      "Every published essay in The Anger Practice, ordered by most recent. Honest writing on anger, rage work, somatic release, and emotional healing.",
    canonical: url,
    ogType: "website",
    image: `${SITE.url}/og-default.png`,
    pageType: "articles",
    jsonLd: [organizationLd(), personLd(), websiteLd(), collectionPage, itemList, breadcrumbLd([
      { name: "Home", url: SITE_URL + "/" },
      { name: "All Articles", url },
    ])],
  };
}

export function buildAboutContext(): RenderContext {
  const url = SITE_URL + "/about";
  return {
    title: "About - The Anger Practice",
    description:
      "About The Anger Practice and The Oracle Lover - the journal's stance, our editorial philosophy, and how to read what we publish.",
    canonical: url,
    ogType: "website",
    image: `${SITE.url}/og-default.png`,
    pageType: "about",
    jsonLd: [
      organizationLd(),
      personLd(),
      websiteLd(),
      {
        "@context": "https://schema.org",
        "@type": "AboutPage",
        "@id": `${url}#aboutpage`,
        url,
        name: "About The Anger Practice",
        description: "About this journal and its editorial stance.",
        about: { "@id": `${SITE_URL}/#organization` },
        mainEntity: { "@id": `${SITE_URL}/#author` },
      },
      breadcrumbLd([
        { name: "Home", url: SITE_URL + "/" },
        { name: "About", url },
      ]),
    ],
  };
}

export function buildStaticContext(reqPath: string, label: string, description: string): RenderContext {
  const url = canonicalUrl(reqPath);
  return {
    title: `${label} - The Anger Practice`,
    description,
    canonical: url,
    ogType: "website",
    image: `${SITE.url}/og-default.png`,
    pageType: "static",
    jsonLd: [organizationLd(), personLd(), websiteLd(), breadcrumbLd([
      { name: "Home", url: SITE_URL + "/" },
      { name: label, url },
    ])],
  };
}

export function renderHead(ctx: RenderContext): string {
  const title = escapeHtml(ctx.title);
  const desc = escapeHtml(ctx.description);
  const canonical = escapeHtml(ctx.canonical);
  const image = escapeHtml(ctx.image || `${SITE.url}/og-default.png`);
  const ogType = ctx.ogType;
  const twitterCard = ctx.twitterCard || "summary_large_image";

  const lines: string[] = [];
  lines.push(`<title>${title}</title>`);
  lines.push(`<meta name="description" content="${desc}" />`);
  lines.push(
    `<meta name="robots" content="index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1" />`,
  );
  lines.push(`<link rel="canonical" href="${canonical}" />`);
  // Open Graph
  lines.push(`<meta property="og:site_name" content="${escapeHtml(SITE.name)}" />`);
  lines.push(`<meta property="og:title" content="${title}" />`);
  lines.push(`<meta property="og:description" content="${desc}" />`);
  lines.push(`<meta property="og:type" content="${ogType}" />`);
  lines.push(`<meta property="og:url" content="${canonical}" />`);
  lines.push(`<meta property="og:image" content="${image}" />`);
  lines.push(`<meta property="og:locale" content="en_US" />`);
  if (ctx.publishedAt) lines.push(`<meta property="article:published_time" content="${escapeHtml(ctx.publishedAt)}" />`);
  if (ctx.modifiedAt) lines.push(`<meta property="article:modified_time" content="${escapeHtml(ctx.modifiedAt)}" />`);
  if (ctx.author) lines.push(`<meta property="article:author" content="${escapeHtml(ctx.author)}" />`);
  if (ctx.articleSection) lines.push(`<meta property="article:section" content="${escapeHtml(ctx.articleSection)}" />`);
  // Twitter
  lines.push(`<meta name="twitter:card" content="${twitterCard}" />`);
  lines.push(`<meta name="twitter:title" content="${title}" />`);
  lines.push(`<meta name="twitter:description" content="${desc}" />`);
  lines.push(`<meta name="twitter:image" content="${image}" />`);

  // JSON-LD
  for (const block of ctx.jsonLd) {
    lines.push(`<script type="application/ld+json">${escapeJson(block)}</script>`);
  }

  return lines.join("\n    ");
}

/**
 * Inject the rendered <head> meta and a small SSR title block into the
 * static index.html shell. We strip out the existing <title>, description,
 * canonical, and og:* meta from the shell so the SSR ones are authoritative.
 */
export function injectHead(html: string, ctx: RenderContext): string {
  const head = renderHead(ctx);

  // Remove pre-existing baked-in title/description/canonical/og-* tags
  let out = html;
  out = out.replace(/<title>[\s\S]*?<\/title>\s*/i, "");
  out = out.replace(/<meta\s+name=["']description["'][^>]*\/?>\s*/gi, "");
  out = out.replace(/<link\s+rel=["']canonical["'][^>]*\/?>\s*/gi, "");
  out = out.replace(/<meta\s+property=["']og:[^"']+["'][^>]*\/?>\s*/gi, "");
  out = out.replace(/<meta\s+name=["']twitter:[^"']+["'][^>]*\/?>\s*/gi, "");
  out = out.replace(/<meta\s+name=["']robots["'][^>]*\/?>\s*/gi, "");
  out = out.replace(/<meta\s+property=["']article:[^"']+["'][^>]*\/?>\s*/gi, "");

  // Inject before </head>
  out = out.replace(
    /<\/head>/i,
    `    ${head}\n  </head>`,
  );

  // Inject SSR-visible body marker so curl shows a real page even with no JS
  const ssrBody = `<noscript>
    <header><h1>${escapeHtml(ctx.title)}</h1><p>${escapeHtml(ctx.description)}</p></header>
  </noscript>`;
  out = out.replace(/<div id="root">/, `${ssrBody}\n    <div id="root">`);

  return out;
}
