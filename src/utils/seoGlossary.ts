export interface GlossaryEntry {
  id: string;
  shortName: string;
  term: string;
  category: 'Core Web Vitals & Speed' | 'Content & Authority (EEAT)' | 'Technical & Crawlability' | 'Structured Data & Schema' | 'AI & Generative Search';
  definition: string;
  whyItMatters: string;
  benchmark: string;
  actionableTip: string;
  aliases: string[];
  referenceUrl?: string;
}

export const SEO_GLOSSARY_DATABASE: Record<string, GlossaryEntry> = {
  eeat: {
    id: 'eeat',
    shortName: 'E-E-A-T',
    term: 'Experience, Expertise, Authoritativeness, Trustworthiness',
    category: 'Content & Authority (EEAT)',
    definition:
      'A core Google Search Quality Rater framework evaluating whether content creators possess firsthand life experience, verified professional expertise, industry authority, and reliable transparency (Trust being the central anchor).',
    whyItMatters:
      'Directly dictates ranking safety, especially for YMYL (Your Money, Your Life) topics such as health, finance, legal, and major purchase decisions. Pages lacking author credentials or editorial oversight are systematically demoted.',
    benchmark:
      'Verified author bylines, linked author bio pages with credentials, transparent contact pages, clear editorial policies, and external citations.',
    actionableTip:
      'Publish detailed author bios with professional qualifications, display physical business addresses with phone numbers, and cite authoritative primary sources.',
    aliases: ['eeat', 'e-e-a-t', 'eat', 'experience expertise authoritativeness trustworthiness', 'author signals', 'editorial standard'],
    referenceUrl: 'https://developers.google.com/search/docs/fundamentals/creating-helpful-content',
  },

  cwv: {
    id: 'cwv',
    shortName: 'Core Web Vitals',
    term: 'Core Web Vitals (CWV)',
    category: 'Core Web Vitals & Speed',
    definition:
      'A set of three standardized performance metrics defined by Google that quantify real-world user experience: loading speed (LCP), visual layout stability (CLS), and interaction responsiveness (INP).',
    whyItMatters:
      'Official Google page experience ranking signal across mobile and desktop searches. Passing all three vitals qualifies pages for ranking boosts, lower bounce rates, and higher conversion rates.',
    benchmark:
      'LCP ≤ 2.5s, CLS ≤ 0.1, and INP ≤ 200ms measured at the 75th percentile of all real mobile user sessions.',
    actionableTip:
      'Audit unoptimized hero media, eliminate render-blocking stylesheets/scripts, and reserve fixed aspect ratios on all image and ad containers.',
    aliases: ['core web vitals', 'cwv', 'web vitals', 'crux metrics'],
    referenceUrl: 'https://web.dev/explore/learn-core-web-vitals',
  },

  lcp: {
    id: 'lcp',
    shortName: 'LCP',
    term: 'Largest Contentful Paint',
    category: 'Core Web Vitals & Speed',
    definition:
      'Measures the elapsed time from when the page begins loading to when the largest visible text block, hero image, or banner is fully rendered in the primary viewport.',
    whyItMatters:
      'Represents perceived loading speed to visitors. Slow LCP triggers immediate abandonment and lower organic search rankings.',
    benchmark:
      'Good: ≤ 2.5 seconds | Needs Improvement: 2.5s – 4.0s | Poor: > 4.0s.',
    actionableTip:
      'Preload hero image tags with fetchpriority="high", serve images in modern WebP/AVIF formats, and minimize server response time (TTFB).',
    aliases: ['lcp', 'largest contentful paint', 'hero loading'],
    referenceUrl: 'https://web.dev/articles/lcp',
  },

  cls: {
    id: 'cls',
    shortName: 'CLS',
    term: 'Cumulative Layout Shift',
    category: 'Core Web Vitals & Speed',
    definition:
      'Measures the sum total of all unexpected layout shifts that occur throughout the entire lifespan of a page as dynamic fonts, late images, or ads pop in.',
    whyItMatters:
      'Prevents frustrating user accidents (e.g. accidental clicks on the wrong button). High CLS degrades search ranking and mobile usability scores.',
    benchmark:
      'Good: ≤ 0.1 | Needs Improvement: 0.1 – 0.25 | Poor: > 0.25.',
    actionableTip:
      'Always include explicit width and height attributes on <img> and <video> tags, reserve CSS min-height for dynamically injected ad slots, and use font-display: optional.',
    aliases: ['cls', 'cumulative layout shift', 'layout stability'],
    referenceUrl: 'https://web.dev/articles/cls',
  },

  inp: {
    id: 'inp',
    shortName: 'INP',
    term: 'Interaction to Next Paint',
    category: 'Core Web Vitals & Speed',
    definition:
      'Replaced FID (First Input Delay) as a Core Web Vital. INP assesses overall page responsiveness by measuring the latency of every click, tap, and keyboard interaction throughout a visit.',
    whyItMatters:
      'Ensures user interfaces feel snappy and instant. Pages with heavy JavaScript execution freeze the main thread, resulting in poor INP and search demotions.',
    benchmark:
      'Good: ≤ 200 milliseconds | Needs Improvement: 200ms – 500ms | Poor: > 500ms.',
    actionableTip:
      'Break up long JavaScript tasks (>50ms), defer non-critical analytics or tag managers, and use scheduler.yield() or requestIdleCallback().',
    aliases: ['inp', 'interaction to next paint', 'responsiveness', 'fid', 'first input delay'],
    referenceUrl: 'https://web.dev/articles/inp',
  },

  ttfb: {
    id: 'ttfb',
    shortName: 'TTFB',
    term: 'Time to First Byte',
    category: 'Core Web Vitals & Speed',
    definition:
      'The time taken between the browser issuing an HTTP request and receiving the initial byte of data from the web server or CDN.',
    whyItMatters:
      'Foundational bottleneck for all downstream Core Web Vitals (LCP, FCP). A sluggish TTFB caps maximum attainable loading speeds.',
    benchmark:
      'Good: ≤ 800 milliseconds (ideal: < 200ms with Edge CDN caching).',
    actionableTip:
      'Leverage Edge caching via Cloudflare or Fastly, enable server-level database query caching, and use HTTP/2 or HTTP/3 protocols.',
    aliases: ['ttfb', 'time to first byte', 'server latency', 'server response time'],
    referenceUrl: 'https://web.dev/articles/ttfb',
  },

  schema: {
    id: 'schema',
    shortName: 'Schema / JSON-LD',
    term: 'Structured Data & Schema.org Markup',
    category: 'Structured Data & Schema',
    definition:
      'Standardized semantic vocabulary injected via JSON-LD scripts that explicitly tells search engines what page content represents (e.g. LocalBusiness, Product, FAQ, Article, Person).',
    whyItMatters:
      'Enables Google Rich Results (star ratings, event dates, pricing, recipe cards, FAQs) in SERPs, significantly elevating click-through rates (CTR) and answering AI engines accurately.',
    benchmark:
      'Valid Schema markup matching page content with zero syntax errors, missing required fields, or unlinked entities.',
    actionableTip:
      'Inject Organization, LocalBusiness, BreadcrumbList, and Article JSON-LD markup on relevant templates with verified @id cross-linking.',
    aliases: ['schema', 'schema.org', 'json-ld', 'structured data', 'microdata', 'rich snippets', 'rich results'],
    referenceUrl: 'https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data',
  },

  canonical: {
    id: 'canonical',
    shortName: 'Canonical Tag',
    term: 'Canonical Tag (rel="canonical")',
    category: 'Technical & Crawlability',
    definition:
      'An HTML link element (<link rel="canonical" href="...">) that indicates the primary, authoritative URL version when duplicate or near-duplicate pages exist (e.g. tracking parameters, HTTP/HTTPS, www/non-www).',
    whyItMatters:
      'Prevents keyword cannibalization, consolidates internal backlink equity into one primary URL, and prevents Google from burning crawl budget on duplicate pages.',
    benchmark:
      'Self-referencing absolute canonical tags present on all standard indexable pages with zero redirecting or 404 targets.',
    actionableTip:
      'Always specify canonical URLs as full absolute URLs (including https:// and exact trailing slash) rather than relative paths.',
    aliases: ['canonical', 'canonical tag', 'rel=canonical', 'rel="canonical"', 'canonicalization'],
    referenceUrl: 'https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls',
  },

  robots: {
    id: 'robots',
    shortName: 'Robots.txt',
    term: 'Robots Exclusion Standard (robots.txt)',
    category: 'Technical & Crawlability',
    definition:
      'A plain text file placed at the root of a website (/robots.txt) that instructs search engine spiders and AI crawlers which paths they are allowed or forbidden to crawl.',
    whyItMatters:
      'Protects sensitive admin portals, prevents crawl budget waste, and controls whether AI scrapers (e.g. GPTBot, ClaudeBot, Google-Extended) may ingest content.',
    benchmark:
      'Valid syntax, properly declaring the XML Sitemap URL, without accidentally blocking critical CSS/JS assets or main indexable sections.',
    actionableTip:
      'Never disallow /wp-content/uploads/, /assets/, or stylesheets, as Googlebot requires full visual CSS/JS rendering to accurately evaluate mobile responsiveness and CWV.',
    aliases: ['robots.txt', 'robots', 'crawler directives', 'disallow'],
    referenceUrl: 'https://developers.google.com/search/docs/crawling-indexing/robots/intro',
  },

  sitemap: {
    id: 'sitemap',
    shortName: 'XML Sitemap',
    term: 'XML Sitemap Protocol',
    category: 'Technical & Crawlability',
    definition:
      'A structured XML index listing all canonical, indexable URLs on a website alongside freshness metadata (<lastmod>, <changefreq>, <priority>).',
    whyItMatters:
      'Acts as an automated roadmap ensuring search engine crawlers discover deep orphaned pages, new blog updates, and e-commerce additions quickly.',
    benchmark:
      'Clean XML file under 50MB and 50,000 URLs containing only HTTP 200 OK indexable canonical pages (no 301 redirects, 404s, or noindex URLs).',
    actionableTip:
      'Auto-generate sitemaps from your CMS, reference the sitemap in your robots.txt, and submit the sitemap URL directly into Google Search Console.',
    aliases: ['sitemap', 'xml sitemap', 'sitemap.xml', 'sitemaps'],
    referenceUrl: 'https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview',
  },

  geo: {
    id: 'geo',
    shortName: 'GEO / AEO',
    term: 'Generative Engine Optimization & Answer Engine Optimization',
    category: 'AI & Generative Search',
    definition:
      'The modern discipline of optimizing content and entity relationships so conversational AI models (Google AI Overviews, Perplexity, ChatGPT, Gemini, Microsoft Copilot) accurately cite and summarize your brand.',
    whyItMatters:
      'AI search answers now sit above traditional organic SERP links. Brands optimized for citation synthesis capture high-intent users before traditional clicks occur.',
    benchmark:
      'Direct answer summary paragraphs (40-60 words), verified Wikidata/entity linkage, tables with clean comparative data, and unrestricted AI crawler access.',
    actionableTip:
      'Structure informational pages with question-based H2/H3 headers followed immediately by concise, declarative answer blocks and authoritative data tables.',
    aliases: ['geo', 'aeo', 'ai readiness', 'generative engine optimization', 'answer engine optimization', 'ai overviews', 'perplexity optimization'],
    referenceUrl: 'https://developers.google.com/search/docs/fundamentals/creating-helpful-content',
  },

  csr: {
    id: 'csr',
    shortName: 'CSR vs SSR',
    term: 'Client-Side Rendering (CSR) vs Server-Side Rendering (SSR)',
    category: 'Technical & Crawlability',
    definition:
      'Distinguishes whether initial HTML is assembled on the web server before delivery (SSR) or dynamically compiled inside the browser using JavaScript frameworks like React, Vue, or Angular (CSR).',
    whyItMatters:
      'Pure client-side rendering forces search engine bots into a two-wave crawling process (delayed rendering queue), risking missing metadata, delayed indexing, and high INP/LCP latencies.',
    benchmark:
      'All primary text, H1 tags, metadata, and navigational links rendered in server-delivered initial HTML (<noscript> or SSR/SSG parity).',
    actionableTip:
      'Adopt static site generation (SSG) or hybrid server-side rendering (SSR via Next.js or Astro) so crawlers receive rich pre-rendered HTML on the first request.',
    aliases: ['csr', 'ssr', 'client-side rendering', 'server-side rendering', 'javascript seo', 'hydration'],
  },

  opengraph: {
    id: 'opengraph',
    shortName: 'Open Graph (OG)',
    term: 'Open Graph Protocol & Social Meta Tags',
    category: 'Structured Data & Schema',
    definition:
      'HTML meta tags (og:title, og:description, og:image, og:url) that define how a page appears when shared across social channels like LinkedIn, Facebook, Slack, and X (Twitter).',
    whyItMatters:
      'Professional rich preview cards double click-through rates from social shares and direct messaging apps, amplifying referral traffic and backlink discovery.',
    benchmark:
      'High-resolution 1200x630px og:image, punchy title under 60 chars, and descriptive summary under 160 chars on every indexable page.',
    actionableTip:
      'Verify images are hosted over HTTPS, use 1.91:1 ratio (1200x630px), and validate using social card preview tools.',
    aliases: ['opengraph', 'open graph', 'og tags', 'og:image', 'social cards', 'twitter cards'],
    referenceUrl: 'https://ogp.me/',
  },

  hreflang: {
    id: 'hreflang',
    shortName: 'Hreflang',
    term: 'International Hreflang Attributes',
    category: 'Technical & Crawlability',
    definition:
      'HTML annotations specifying the language and geographic targeting of a webpage to serve the appropriate regional version to users (e.g. en-US vs en-GB vs fr-CA).',
    whyItMatters:
      'Eliminates duplicate content penalties across regional language domains and ensures visitors land on the version with local currency, language, and compliance.',
    benchmark:
      'Reciprocal hreflang tags linking both pages to each other, including an x-default fallback for unspecified locales.',
    actionableTip:
      'Ensure every hreflang annotation has a matching bidirectional link on the target page and matches ISO language (e.g. en) and country (e.g. US) codes.',
    aliases: ['hreflang', 'international seo', 'language targeting', 'multilingual seo'],
    referenceUrl: 'https://developers.google.com/search/docs/specialty/international/localized-versions',
  },

  headings: {
    id: 'headings',
    shortName: 'Heading Hierarchy',
    term: 'Heading Architecture (H1 – H6)',
    category: 'Content & Authority (EEAT)',
    definition:
      'The semantic structural outline of a webpage using HTML heading elements from the main topic (H1) down to sub-topics (H2) and fine details (H3-H4).',
    whyItMatters:
      'Search engines and screen readers use heading trees to understand topical relationships, content depth, and answer boundaries for featured snippets.',
    benchmark:
      'Exactly one distinct H1 tag per page representing the core subject, with no skipped heading levels (e.g. never jump from H1 directly to H3).',
    actionableTip:
      'Include primary search keywords naturally in the H1 and secondary long-tail questions in H2 headings to capture featured snippets.',
    aliases: ['heading structure', 'heading hierarchy', 'h1', 'h2', 'h1 tag', 'semantic headings'],
  },

  crawlBudget: {
    id: 'crawlBudget',
    shortName: 'Crawl Budget',
    term: 'Search Engine Crawl Budget',
    category: 'Technical & Crawlability',
    definition:
      'The allocated number of requests and time Googlebot and other web crawlers are willing to spend crawling a specific domain before moving on.',
    whyItMatters:
      'On websites with hundreds or thousands of pages, a squandered crawl budget leaves new high-value pages undiscovered and old pages stale in search results.',
    benchmark:
      'Zero redirect chains, minimal 404/500 errors, fast server response (<300ms), and clean internal link topology.',
    actionableTip:
      'Disallow infinite facet filter URLs in robots.txt, eliminate internal redirect chains, and upgrade server infrastructure to handle rapid crawler concurrency.',
    aliases: ['crawl budget', 'crawl capacity', 'crawl rate', 'googlebot crawl'],
  },

  aeo: {
    id: 'aeo',
    shortName: 'AEO',
    term: 'Answer Engine Optimization',
    category: 'AI & Generative Search',
    definition:
      'The practice of crafting direct, highly synthesized factual answers that generative AI engines (Google AI Overviews, ChatGPT Search, Perplexity) can immediately extract as definitive truth.',
    whyItMatters:
      'AI answer engines deliver direct answers without requiring users to scroll through traditional blue links. AEO ensures your content is cited as the source authority.',
    benchmark:
      'Direct summary statements within 40–60 words directly beneath each heading, accompanied by schema Q&A or FAQPage markup.',
    actionableTip:
      'Target high-intent question keywords ("How to...", "What is the best..."), answer immediately in the first sentence, and substantiate with quantitative bullet points.',
    aliases: ['aeo', 'answer engine optimization', 'answerability', 'ai overviews answer'],
    referenceUrl: 'https://developers.google.com/search/docs/appearance/structured-data/faqpage',
  },

  wcag: {
    id: 'wcag',
    shortName: 'WCAG',
    term: 'Web Content Accessibility Guidelines (WCAG 2.1 AA)',
    category: 'Technical & Crawlability',
    definition:
      'International standards ensuring digital content is perceivable, operable, understandable, and robust for people with disabilities.',
    whyItMatters:
      'Accessibility strongly correlates with search engine machine-readability. Google favors sites that maintain semantic markup, accessible tap targets, and high contrast.',
    benchmark:
      'WCAG 2.1 Level AA compliance: minimum 4.5:1 text contrast, explicit aria-labels on icon buttons, form input label associations, and unrestricted user zoom.',
    actionableTip:
      'Ensure every <button> without visible text has an aria-label, connect all <label for=""> attributes, and remove maximum-scale=1.0 from viewport meta tags.',
    aliases: ['wcag', 'accessibility', 'a11y', 'screen reader', 'aria labels'],
    referenceUrl: 'https://www.w3.org/WAI/standards-guidelines/wcag/',
  },

  hsts: {
    id: 'hsts',
    shortName: 'HSTS',
    term: 'HTTP Strict Transport Security (HSTS)',
    category: 'Technical & Crawlability',
    definition:
      'A server response header (Strict-Transport-Security) that forces web browsers to communicate strictly over encrypted HTTPS connections, prohibiting plaintext HTTP.',
    whyItMatters:
      'Prevents man-in-the-middle attacks, SSL stripping, and cookie hijacking. Google uses HTTPS and transport security as a foundational trust signal.',
    benchmark:
      'Header present: max-age=31536000; includeSubDomains; preload.',
    actionableTip:
      'Configure your web server (Nginx, Cloudflare, Apache) with a 1-year max-age HSTS policy and submit your domain to the Chrome HSTS Preload list.',
    aliases: ['hsts', 'strict transport security', 'https preload', 'ssl security'],
    referenceUrl: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security',
  },

  eeatExperience: {
    id: 'eeatExperience',
    shortName: 'EEAT: Experience',
    term: 'Firsthand Experience (E-E-A-T Pillar 1)',
    category: 'Content & Authority (EEAT)',
    definition:
      'Evaluating whether the author demonstrates authentic, hands-on, firsthand experience with the topic, product, or service being evaluated.',
    whyItMatters:
      'Separates genuine human reviews from regurgitated AI copy. Google prioritizes accounts from creators who have physically tested or used the subject matter.',
    benchmark:
      'Original photos, benchmark testing results, personal anecdotes, purchase receipts, or case study data proving real-world engagement.',
    actionableTip:
      'Incorporate original photography, quote real customer stories, and explain personal lessons learned from hands-on testing.',
    aliases: ['experience', 'eeat experience', 'firsthand proof', 'practical proof'],
    referenceUrl: 'https://developers.google.com/search/docs/fundamentals/creating-helpful-content',
  },

  eeatExpertise: {
    id: 'eeatExpertise',
    shortName: 'EEAT: Expertise',
    term: 'Formal & Field Expertise (E-E-A-T Pillar 2)',
    category: 'Content & Authority (EEAT)',
    definition:
      'The formal knowledge, professional certifications, or specialized skill sets possessed by the content author.',
    whyItMatters:
      'Critical for YMYL (Your Money Your Life) content like medicine, law, and investing where inaccurate advice can cause real physical or financial harm.',
    benchmark:
      'Verifiable author bylines linked to detailed author bio pages with degrees, licensures, awards, and industry credentials.',
    actionableTip:
      'Attach clear author bylines to every article with links to an author bio detailing career history, verified degrees, and social profiles.',
    aliases: ['expertise', 'eeat expertise', 'author credentials', 'byline'],
    referenceUrl: 'https://developers.google.com/search/docs/fundamentals/creating-helpful-content',
  },

  eeatAuthority: {
    id: 'eeatAuthority',
    shortName: 'EEAT: Authoritativeness',
    term: 'Industry Authoritativeness (E-E-A-T Pillar 3)',
    category: 'Content & Authority (EEAT)',
    definition:
      'The extent to which other reputable organizations, news outlets, and domain experts recognize the site or author as a go-to authority in their niche.',
    whyItMatters:
      'Established industry authorities earn citations in Google AI Overviews and top organic placements with greater resilience against core algorithm updates.',
    benchmark:
      'Inbound editorial backlinks from major news publications, Wikipedia entity citations, and mentions in academic or industry research papers.',
    actionableTip:
      'Conduct proprietary industry surveys and publish original data studies that naturally attract inbound press coverage and editorial citations.',
    aliases: ['authoritativeness', 'eeat authority', 'authority', 'domain citations'],
    referenceUrl: 'https://developers.google.com/search/docs/fundamentals/creating-helpful-content',
  },

  eeatTrust: {
    id: 'eeatTrust',
    shortName: 'EEAT: Trustworthiness',
    term: 'Trustworthiness & Transparency (E-E-A-T Central Pillar)',
    category: 'Content & Authority (EEAT)',
    definition:
      'The foundational core of E-E-A-T. Measures how honest, transparent, accurate, and safe the website is for visitors.',
    whyItMatters:
      'Google states that Trust is the most important member of the E-E-A-T family because untrustworthy pages are dangerous regardless of alleged experience or expertise.',
    benchmark:
      'Transparent contact info, physical address, clear return policies, HTTPS encryption, editorial correction logs, and explicit affiliate disclosure.',
    actionableTip:
      'Include a dedicated Contact page with phone number, physical address, privacy policy, terms of service, and visible editorial disclosures.',
    aliases: ['trustworthiness', 'eeat trust', 'trust', 'transparency', 'security and transparency'],
    referenceUrl: 'https://developers.google.com/search/docs/fundamentals/creating-helpful-content',
  },
};

/**
 * Find a glossary entry using exact ID, shortName, term, or any alias.
 */
export function getGlossaryTerm(termOrQuery?: string): GlossaryEntry | undefined {
  if (!termOrQuery) return undefined;
  const normalized = termOrQuery.toLowerCase().trim().replace(/[^a-z0-9]/g, '');

  // 1. Direct ID check
  if (SEO_GLOSSARY_DATABASE[termOrQuery.toLowerCase().trim()]) {
    return SEO_GLOSSARY_DATABASE[termOrQuery.toLowerCase().trim()];
  }

  // 2. Search through all entries by normalized keys and aliases
  for (const entry of Object.values(SEO_GLOSSARY_DATABASE)) {
    const normId = entry.id.toLowerCase().replace(/[^a-z0-9]/g, '');
    const normShort = entry.shortName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const normTerm = entry.term.toLowerCase().replace(/[^a-z0-9]/g, '');

    if (normId === normalized || normShort === normalized || normTerm.includes(normalized) || normalized.includes(normShort)) {
      return entry;
    }

    for (const alias of entry.aliases) {
      const normAlias = alias.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (normAlias === normalized || normAlias.includes(normalized) || normalized.includes(normAlias)) {
        return entry;
      }
    }
  }

  return undefined;
}

/**
 * Returns all glossary items sorted by category and term.
 */
export function getAllGlossaryTerms(): GlossaryEntry[] {
  return Object.values(SEO_GLOSSARY_DATABASE);
}

/**
 * Search glossary by query across terms, definition, and tips.
 */
export function searchGlossary(query: string): GlossaryEntry[] {
  const q = query.toLowerCase().trim();
  if (!q) return getAllGlossaryTerms();

  return getAllGlossaryTerms().filter((entry) => {
    return (
      entry.shortName.toLowerCase().includes(q) ||
      entry.term.toLowerCase().includes(q) ||
      entry.category.toLowerCase().includes(q) ||
      entry.definition.toLowerCase().includes(q) ||
      entry.whyItMatters.toLowerCase().includes(q) ||
      entry.aliases.some((a) => a.toLowerCase().includes(q))
    );
  });
}
