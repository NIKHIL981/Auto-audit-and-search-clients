import { GoogleGenAI } from '@google/genai';
import { AuditReport } from '../types';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AssistantChatResponse {
  success: boolean;
  reply: string;
  suggestedFollowUps?: string[];
}

/**
 * Builds a structured, high-density audit digest for Gemini context injection.
 */
function buildAuditContextDigest(report: AuditReport): string {
  const issues = report.issues || [];
  const criticals = issues.filter((i) => i.severity === 'critical');
  const warnings = issues.filter((i) => i.severity === 'warning');
  const passedCount = report.statCounts?.passed ?? issues.filter((i) => i.severity === 'passed').length;

  const crawledSummary = (report.crawledPages || []).slice(0, 15).map((p) => {
    return `- ${p.url} (Status: ${p.statusCode}, Load Time: ${p.responseTimeMs || 120}ms, Words: ${p.wordCount || 0}, Missing Alt: ${p.missingAltCount || 0})`;
  }).join('\n');

  const criticalsSummary = criticals.slice(0, 8).map((c) => {
    return `- [${c.category.toUpperCase()}] ${c.title}: ${c.description} (Impact: ${c.impact || 'High'}, Fix: ${c.recommendation || 'See audit checklist'})`;
  }).join('\n');

  const warningsSummary = warnings.slice(0, 8).map((w) => {
    return `- [${w.category.toUpperCase()}] ${w.title}: ${w.description} (Fix: ${w.recommendation || 'See audit checklist'})`;
  }).join('\n');

  const botRules = (report.aiReadiness?.botGovernance || []).map((b) => {
    return `- ${b.botName} (${b.userAgent}): ${b.status} - ${b.details}`;
  }).join('\n');

  return `
TARGET AUDIT PROFILE:
- Domain: ${report.domain}
- Primary URL: ${report.url}
- Total Pages Crawled: ${report.crawledPages?.length || report.totalPagesCrawled || 1}
- Audit Timestamp: ${new Date(report.timestamp).toISOString()}
- Overall Health Score: ${report.scores?.overall ?? 85}/100
- Technical SEO Score: ${report.scores?.technical ?? 85}/100
- Performance (CWV) Score: ${report.scores?.performance ?? report.performance?.score ?? 80}/100
- Content Quality Score: ${report.scores?.content ?? 85}/100
- AI Readiness (GEO) Score: ${report.scores?.aiReadiness ?? 80}/100

CORE WEB VITALS BENCHMARKS:
- Largest Contentful Paint (LCP): ${report.performance?.lcpEstimate ?? 1.8}s (Status: ${report.performance?.lcpRating ?? 'good'}) [Target: ≤ 2.5s]
- Cumulative Layout Shift (CLS): ${report.performance?.clsEstimate ?? 0.03} (Status: ${report.performance?.clsRating ?? 'good'}) [Target: ≤ 0.10]
- Interaction to Next Paint (INP): ${report.performance?.inpEstimate ?? 110}ms (Status: ${report.performance?.inpRating ?? 'good'}) [Target: ≤ 200ms]
- Overall CWV Status: ${report.statCounts?.cwvRating ?? 'good'} (${report.statCounts?.cwvScore ?? 82}/100)

META TAGS & ON-PAGE SIGNALS:
- Title Tag: "${report.metaTags?.title || 'None declared'}" (Length: ${report.metaTags?.titleLength || 0} chars, Status: ${report.metaTags?.titleStatus || 'unknown'})
- Meta Description: "${report.metaTags?.description || 'None declared'}" (Length: ${report.metaTags?.descriptionLength || 0} chars, Status: ${report.metaTags?.descriptionStatus || 'unknown'})
- Canonical: ${report.metaTags?.canonical || 'Self-referential'}
- Robots Meta: ${report.metaTags?.robotsMeta || 'index, follow'}
- H1 Count: ${report.headings?.h1Count ?? 1}, H2 Count: ${report.headings?.h2Count ?? 0}
- Total Images: ${report.images?.totalImages ?? 0} (Missing Alt: ${report.images?.missingAltCount ?? 0}, Modern WebP/AVIF: ${report.images?.modernFormatCount ?? 0}, Legacy: ${report.images?.legacyFormatCount ?? 0})
- Links: ${report.linking?.totalLinks ?? 0} total (${report.linking?.internalCount ?? 0} internal, ${report.linking?.externalCount ?? 0} external, ${report.linking?.brokenLinkRisks ?? 0} broken risks)

AI READINESS & ROBOTS GOVERNANCE:
- AI Readiness Score: ${report.aiReadiness?.overallAiScore ?? 85}%
- Robots.txt URL: ${report.aiReadiness?.robotsTxtUrl || 'Default'}
- Blocked from AI Training: ${report.aiReadiness?.isBlockedFromAiTraining ? 'YES' : 'NO'}
- Blocked from AI Search: ${report.aiReadiness?.isBlockedFromAiSearch ? 'YES' : 'NO'}
- Structured Answerability Score: ${report.aiReadiness?.structuredAnswerabilityScore ?? 85}%
- FAQ Structure: ${report.aiReadiness?.hasFaqStructure ? 'Present' : 'Missing'}
- EEAT Score: ${report.aiReadiness?.eeatScore ?? 82}%
${botRules ? `Bot Rules:\n${botRules}` : ''}

CRITICAL ISSUES (${criticals.length}):
${criticalsSummary || 'None detected'}

WARNINGS (${warnings.length}):
${warningsSummary || 'None detected'}

SAMPLE CRAWLED PAGES:
${crawledSummary || 'Homepage only'}
`.trim();
}

/**
 * Generates an intelligent, deterministic fallback answer based on current audit metrics
 * when Gemini API key is missing or service is offline.
 */
function generateDeterministicAssistantReply(
  userQuery: string,
  report: AuditReport
): AssistantChatResponse {
  const query = userQuery.toLowerCase().trim();
  const perf = report.performance;
  const lcp = perf?.lcpEstimate ?? 1.8;
  const cls = perf?.clsEstimate ?? 0.03;
  const inp = perf?.inpEstimate ?? 110;
  const perfScore = report.scores?.performance ?? perf?.score ?? 82;
  const domain = report.domain;

  // Question about LCP (Largest Contentful Paint)
  if (query.includes('lcp') || query.includes('largest contentful') || query.includes('load time') || query.includes('speed')) {
    const isGood = lcp <= 2.5;
    const lcpStatus = isGood ? 'passing (Good)' : lcp <= 4.0 ? 'needs improvement' : 'failing (Poor)';

    const missingAltCount = report.images?.missingAltCount ?? 0;
    const legacyImgCount = report.images?.legacyFormatCount ?? 0;

    return {
      success: true,
      reply: `### How to Optimize LCP for **${domain}**

Your current Largest Contentful Paint (LCP) estimate is **${lcp}s**, which is rated **${lcpStatus}** against Google's Core Web Vitals threshold (target: **≤ 2.5s**). Overall Performance Score is **${perfScore}%**.

#### Root Causes Identified on ${domain}:
1. **Hero Asset Delivery**: The largest visible element (typically the top hero banner or heading block) takes time to download. ${legacyImgCount > 0 ? `We detected **${legacyImgCount} legacy format images (PNG/JPG)** that should be converted to modern formats.` : 'Ensure your hero asset is preloaded.'}
2. **Resource Load Delay**: If your primary hero image is lazy-loaded or loaded via CSS \`background-image\`, the browser discovers it late.
3. **Render-Blocking Resources**: Third-party scripts or synchronous CSS in \`<head>\` delay initial rendering by up to 200–400ms.

#### Step-by-Step Action Plan:
- **Priority 1 (Quick Win)**: Add a high-priority preload tag in the \`<head>\` for your hero image:
\`\`\`html
<link rel="preload" fetchpriority="high" as="image" href="/path/to/hero.webp" type="image/webp">
\`\`\`
- **Priority 2**: Convert all raster images to **WebP or AVIF** with responsive \`srcset\` attributes and explicit \`width\` and \`height\` dimensions.
- **Priority 3**: Ensure your hero element never has \`loading="lazy"\` attached (lazy-loading is strictly for below-the-fold assets).
- **Priority 4**: Implement edge caching via a CDN with \`Cache-Control: public, max-age=31536000, immutable\` for static bundles, and enable Brotli/Gzip compression.

Would you like me to inspect your specific crawled pages to see which individual URLs have the slowest response times?`,
      suggestedFollowUps: [
        'Which crawled pages have the slowest response times?',
        'How can I optimize CLS and INP on this domain?',
        'What are the most critical errors in this audit?',
      ],
    };
  }

  // Question about CLS / INP / CWV
  if (query.includes('cls') || query.includes('layout shift') || query.includes('inp') || query.includes('core web vitals') || query.includes('cwv')) {
    return {
      success: true,
      reply: `### Core Web Vitals Diagnostic for **${domain}**

Here is your current live Core Web Vitals telemetry:
- **LCP (Largest Contentful Paint)**: **${lcp}s** (${lcp <= 2.5 ? 'Passing' : 'Needs Work'})
- **CLS (Cumulative Layout Shift)**: **${cls}** (${cls <= 0.1 ? 'Passing (Good)' : 'Failing'})
- **INP (Interaction to Next Paint)**: **${inp}ms** (${inp <= 200 ? 'Passing (Good)' : 'Needs Work'})

#### Key Recommendations for Stability & Responsiveness:
1. **Prevent Layout Shifts (CLS)**:
   - Always specify explicit \`width\` and \`height\` or CSS \`aspect-ratio\` on all image and video containers to reserve layout slots before assets load.
   - Ensure web fonts use \`font-display: swap\` or \`font-display: optional\` with fallback font metrics matching the primary typeface.
2. **Optimize Interaction to Next Paint (INP)**:
   - Break up long JavaScript tasks (> 50ms) using \`scheduler.yield()\` or \`requestAnimationFrame()\`.
   - Avoid executing heavy DOM mutations inside high-frequency event handlers (\`scroll\`, \`resize\`, \`input\`).`,
      suggestedFollowUps: [
        'How can I improve the LCP score of this page?',
        'What are the critical issues on this domain?',
        'How is my AI Readiness score evaluated?',
      ],
    };
  }

  // Question about Critical Issues or Errors
  if (query.includes('critical') || query.includes('error') || query.includes('issue') || query.includes('fix first') || query.includes('priority')) {
    const issues = report.issues || [];
    const criticals = issues.filter((i) => i.severity === 'critical');
    const warnings = issues.filter((i) => i.severity === 'warning');

    if (criticals.length === 0) {
      return {
        success: true,
        reply: `### Issues Overview for **${domain}**

Great news! **No critical errors** were detected during this audit run.

However, there are **${warnings.length} warning(s)** you should address to maximize search performance:
${warnings.slice(0, 4).map((w, idx) => `${idx + 1}. **${w.title}** (${w.category}): ${w.description}\n   *Recommendation*: ${w.recommendation || 'Inspect in the Issues tab.'}`).join('\n\n')}

Addressing these warnings will help lift your Technical Score from **${report.scores?.technical ?? 85}%** to near 100%.`,
        suggestedFollowUps: [
          'How can I improve the LCP score of this page?',
          'How can I improve AI search readiness for ChatGPT?',
          'Show me content quality recommendations.',
        ],
      };
    }

    return {
      success: true,
      reply: `### Top Critical Issues to Fix on **${domain}**

We detected **${criticals.length} critical issue(s)** requiring immediate technical attention:

${criticals.slice(0, 5).map((c, idx) => `#### ${idx + 1}. ${c.title}
- **Category**: \`${c.category}\` | **Impact**: ${c.impact || 'High'}
- **Problem**: ${c.description}
- **Remediation**: ${c.recommendation || 'Implement fixes specified in the Technical & On-Page tabs.'}
${c.affectedElement ? `- **Target**: \`${c.affectedElement}\`` : ''}`).join('\n\n')}

Fixing these ${criticals.length} items will provide the highest immediate gain in your overall SEO Health score (currently **${report.scores?.overall ?? 85}%**).`,
      suggestedFollowUps: [
        'How can I improve the LCP score of this page?',
        'What warnings should I fix next?',
        'How do I test my structured data schema?',
      ],
    };
  }

  // Question about AI Readiness, GEO, ChatGPT, Perplexity, Robots.txt
  if (query.includes('ai') || query.includes('geo') || query.includes('chatgpt') || query.includes('perplexity') || query.includes('crawler') || query.includes('robot')) {
    const aiScore = report.scores?.aiReadiness ?? report.aiReadiness?.overallAiScore ?? 85;
    const isBlockedSearch = report.aiReadiness?.isBlockedFromAiSearch;
    const isBlockedTrain = report.aiReadiness?.isBlockedFromAiTraining;

    return {
      success: true,
      reply: `### Generative Engine Optimization (GEO) & AI Readiness for **${domain}**

Your **AI Search Readiness score is ${aiScore}%**.

#### Crawler Governance Status:
- **Search Retrieval (GPTBot, PerplexityBot, ClaudeBot)**: ${isBlockedSearch ? '❌ Blocked in robots.txt' : '✅ Allowed for live citation & indexing'}
- **Model Training Data Harvesting**: ${isBlockedTrain ? '🛡️ Restricted' : 'ℹ️ Permitted'}
- **Structured Answerability**: **${report.aiReadiness?.structuredAnswerabilityScore ?? 85}%**
- **FAQ Schema Structure**: ${report.aiReadiness?.hasFaqStructure ? '✅ Configured' : '⚠️ Missing on key pages'}
- **EEAT Authority Score**: **${report.aiReadiness?.eeatScore ?? 82}%**

#### Strategic Recommendations for Generative Search Citations:
1. **Direct-Answer Formatting**: Place concise, 40–60 word factual definitions directly below \`<h2>\` headers. AI answer engines (ChatGPT Search, Google AI Overviews, Perplexity) prioritize these snippet structures.
2. **Schema Markup (JSON-LD)**: Deploy structured \`FAQPage\`, \`Article\`, and \`Organization\` schema with explicit \`author\` credentials to reinforce algorithmic trust.
3. **Information Gain**: Add unique proprietary statistics, original case studies, or comparison tables that LLMs cannot synthesize from generic public training data.`,
      suggestedFollowUps: [
        'How do I configure robots.txt for AI bots without losing search visibility?',
        'How can I improve the LCP score of this page?',
        'What is my current EEAT score breakdown?',
      ],
    };
  }

  // Question about Titles, Meta Descriptions, or On-Page
  if (query.includes('meta') || query.includes('title') || query.includes('description') || query.includes('on-page') || query.includes('heading')) {
    const title = report.metaTags?.title || 'None';
    const titleLen = report.metaTags?.titleLength || 0;
    const desc = report.metaTags?.description || 'None';
    const descLen = report.metaTags?.descriptionLength || 0;

    return {
      success: true,
      reply: `### On-Page Metadata Assessment for **${domain}**

#### Current Tags:
- **Title**: "${title}" (${titleLen} characters)
  *Status*: ${titleLen >= 30 && titleLen <= 60 ? 'Optimal (30–60 chars)' : 'Needs adjustment'}
- **Meta Description**: "${desc}" (${descLen} characters)
  *Status*: ${descLen >= 120 && descLen <= 160 ? 'Optimal (120–160 chars)' : 'Needs adjustment'}
- **Headings**: ${report.headings?.h1Count ?? 1} H1 tag(s), ${report.headings?.h2Count ?? 0} H2 tag(s)

#### Best Practices:
1. Ensure your primary high-intent keyword is placed in the first 3 words of the Title tag.
2. Include a compelling call-to-action (CTA) in your Meta Description to increase Organic Click-Through Rate (CTR).
3. Confirm each crawled page has strictly **one unique H1** tag matching user search intent.`,
      suggestedFollowUps: [
        'How can I improve the LCP score of this page?',
        'What are the critical issues on this domain?',
        'Check my image alt attributes.',
      ],
    };
  }

  // Default response synthesizing the current audit
  return {
    success: true,
    reply: `### SEO Assistant Diagnostic for **${domain}**

I have analyzed the current audit snapshot for **${report.url}** (${report.crawledPages?.length || report.totalPagesCrawled || 1} pages crawled).

#### Current Health Scorecard:
- **Overall SEO Health**: **${report.scores?.overall ?? 85}%**
- **Core Web Vitals (Performance)**: **${perfScore}%** (LCP: ${lcp}s, CLS: ${cls}, INP: ${inp}ms)
- **Technical Architecture**: **${report.scores?.technical ?? 85}%**
- **Content Quality**: **${report.scores?.content ?? 85}%**
- **AI Readiness (GEO)**: **${report.scores?.aiReadiness ?? 80}%**

You can ask me specific questions such as:
- *"How can I improve the LCP score of this page?"*
- *"What are the critical issues I need to fix first?"*
- *"How can I optimize this website for AI search engines like ChatGPT and Perplexity?"*
- *"Which crawled pages have the slowest load times?"*

What would you like to focus on optimizing?`,
    suggestedFollowUps: [
      'How can I improve the LCP score of this page?',
      'What are the most critical issues to fix first?',
      'How is my AI Readiness for search engines like ChatGPT & Perplexity?',
    ],
  };
}

/**
 * Handles incoming chat messages with the Gemini API (model: gemini-3.8-flash)
 * using the full context of the active audit report.
 */
export async function handleAssistantChat(
  messages: ChatMessage[],
  report: AuditReport
): Promise<AssistantChatResponse> {
  const latestMessage = messages[messages.length - 1]?.content || '';
  const apiKey = process.env.GEMINI_API_KEY;

  // If valid Gemini API key is available, call Gemini
  if (apiKey && apiKey.trim() !== '' && apiKey !== 'MY_GEMINI_API_KEY') {
    try {
      const ai = new GoogleGenAI({
        apiKey: apiKey.trim(),
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const auditDigest = buildAuditContextDigest(report);

      const systemInstruction = `You are an elite Senior Technical SEO Architect and Web Performance Performance Engineer acting as an embedded "SEO Assistant" inside the AuditPulse SEO suite.
You are assisting a developer or digital marketer who is currently auditing the website "${report.domain}" (${report.url}).

You have real-time access to the complete audit results, Core Web Vitals telemetry, crawled pages dataset, flagged issues, and AI readiness governance.

Here is the active audit data:
${auditDigest}

Instructions for your responses:
1. Always be specific, actionable, and grounded in the actual audit metrics provided above (e.g. refer to the actual LCP estimate of ${report.performance?.lcpEstimate ?? 1.8}s, specific issues flagged, actual scores, etc.).
2. When answering performance questions (e.g. "How can I improve the LCP score of this page?"), explain the metric, pinpoint the specific issues found on this domain, and provide concrete, prioritized steps (with code snippets or tag examples if helpful).
3. Use clean markdown: bold key metrics, use lists, bullet points, and code blocks.
4. Keep answers focused, technically authoritative, and easy to skim.
5. End with 1-2 suggested follow-up questions relevant to the topic discussed.`;

      // Convert conversation history to Gemini contents format
      // Map 'assistant' role to 'model'
      const formattedContents = messages.map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: formattedContents,
        config: {
          systemInstruction,
          temperature: 0.6,
          maxOutputTokens: 1200,
        },
      });

      const replyText = response.text || '';
      if (replyText.trim()) {
        return {
          success: true,
          reply: replyText.trim(),
        };
      }
    } catch (err: any) {
      console.warn('Gemini Assistant chat call failed, falling back to deterministic engine:', err?.message || err);
      // Fall through to deterministic generator
    }
  }

  // Deterministic context-aware fallback
  return generateDeterministicAssistantReply(latestMessage, report);
}
