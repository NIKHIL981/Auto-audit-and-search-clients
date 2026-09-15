import { GoogleGenAI, Type } from '@google/genai';
import { AuditReport, AiAuditInsights, AiInsightRecommendation } from '../types';

/**
 * Generates prioritized AI recommendations and strategic diagnostics for an audit report
 * using the Gemini API (gemini-3.8-flash).
 */
export async function generateAiAuditInsights(report: AuditReport): Promise<AiAuditInsights> {
  const apiKey = process.env.GEMINI_API_KEY;

  // If API key is available, call Gemini API
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

      // Prepare a concise, high-signal audit digest
      const auditSummaryPayload = {
        domain: report.domain,
        url: report.url,
        totalPagesCrawled: report.crawledPages?.length || 1,
        scores: {
          overall: report.scores?.overall,
          technical: report.scores?.technical,
          performance: report.scores?.performance,
          content: report.scores?.content,
          aiReadiness: report.scores?.aiReadiness,
        },
        coreWebVitals: {
          lcpEstimate: report.performance?.lcpEstimate,
          clsEstimate: report.performance?.clsEstimate,
          inpEstimate: report.performance?.inpEstimate,
          cwvRating: report.statCounts?.cwvRating,
        },
        keyIssues: (report.issues || []).slice(0, 10).map((issue) => ({
          title: issue.title,
          severity: issue.severity,
          category: issue.category,
          impact: issue.impact,
          affectedElement: issue.affectedElement || issue.domSelector || issue.pageLocation,
        })),
        aiReadinessDetails: {
          overallScore: report.aiReadiness?.overallAiScore,
          isBlockedFromAiSearch: report.aiReadiness?.isBlockedFromAiSearch,
          isBlockedFromAiTraining: report.aiReadiness?.isBlockedFromAiTraining,
          structuredAnswerabilityScore: report.aiReadiness?.structuredAnswerabilityScore,
          hasFaqStructure: report.aiReadiness?.hasFaqStructure,
          eeatScore: report.aiReadiness?.eeatScore,
        },
        metaAndContent: {
          title: report.metaTags?.title,
          titleStatus: report.metaTags?.titleStatus,
          description: report.metaTags?.description,
          descriptionStatus: report.metaTags?.descriptionStatus,
          wordCount: report.content?.wordCount,
          fleschScore: report.content?.fleschScore,
        },
        structuredData: {
          detectedTypes: report.structuredData?.detectedTypes || [],
        },
        security: {
          isHttps: report.security?.isHttps,
          hasHsts: report.security?.hasHsts,
        },
        media: {
          missingAltCount: report.images?.missingAltCount,
          totalImages: report.images?.totalImages,
        },
      };

      const systemInstruction = `You are a Principal Technical SEO & Web Performance Architect.
Analyze the provided website audit report and deliver deep, prioritized, and highly actionable recommendations.
Classify recommendations into concrete priority tiers:
- 'P0 - Critical': Blocking organic indexing, severe search penalties, or critical Core Web Vitals failure.
- 'P1 - High': High organic ranking or conversion impact (e.g. meta tags, AI search blocking, major LCP bottleneck).
- 'P2 - Medium': Noticeable performance or discoverability gains (e.g. Schema JSON-LD, image alt tags, E-E-A-T signals).
- 'P3 - Low': Polish, secondary optimizations, or long-term authoritative architecture.

Provide specific developer and SEO instructions. Avoid generic fluff. Be technical, direct, and authoritative.`;

      const prompt = `Here is the comprehensive audit data for website: "${report.domain}" (${report.url}).
Analyze this website's performance, indexing architecture, content structure, and Generative Engine Optimization (GEO) status.
Provide a strategic verdict, estimated score improvement potential, AI search readiness analysis (Google AI Overviews & ChatGPT Search), and 5-8 prioritized, granular recommendations with step-by-step developer actions.

Audit Data:
${JSON.stringify(auditSummaryPayload, null, 2)}`;

      const CANDIDATE_MODELS = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
      let lastErrorMessage = '';
      let isHighDemand = false;

      for (const modelName of CANDIDATE_MODELS) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
              systemInstruction,
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  strategicVerdict: {
                    type: Type.STRING,
                    description: 'Executive diagnostic verdict and strategic SEO posture for this website.',
                  },
                  overallHealthSummary: {
                    type: Type.STRING,
                    description: 'Detailed synthesis of current crawl health, technical barriers, and organic ranking blockers.',
                  },
                  estimatedScoreGain: {
                    type: Type.INTEGER,
                    description: 'Realistic potential overall health score increase (points between 8 and 35) upon implementing these fixes.',
                  },
                  competitiveEdge: {
                    type: Type.STRING,
                    description: 'Key differentiator or competitive vulnerability relative to search competitors.',
                  },
                  aiSearchReadiness: {
                    type: Type.OBJECT,
                    properties: {
                      verdict: {
                        type: Type.STRING,
                        description: 'Assessment of readiness for Google AI Overviews, Perplexity, and ChatGPT Search.',
                      },
                      citationPotential: {
                        type: Type.STRING,
                        description: 'Evaluation of content citability, factual density, and structured data answers.',
                      },
                      actionItem: {
                        type: Type.STRING,
                        description: 'Top priority action to become a primary AI cited source.',
                      },
                    },
                    required: ['verdict', 'citationPotential', 'actionItem'],
                  },
                  recommendations: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.STRING },
                        priority: {
                          type: Type.STRING,
                          description: "Must be one of: 'P0 - Critical', 'P1 - High', 'P2 - Medium', 'P3 - Low'",
                        },
                        category: {
                          type: Type.STRING,
                          description: "Must be one of: 'Core Web Vitals', 'Technical & Crawl', 'On-Page & Content', 'AI & AEO', 'Authority & Schema'",
                        },
                        title: { type: Type.STRING, description: 'Crisp, actionable recommendation title.' },
                        impact: { type: Type.STRING, description: 'Expected SEO ranking, speed, or indexing impact.' },
                        effort: { type: Type.STRING, description: "Must be: 'Low', 'Medium', or 'High'" },
                        timeToImpact: { type: Type.STRING, description: "e.g. '1-3 Days', '1-2 Weeks', '1 Month'" },
                        diagnosis: { type: Type.STRING, description: 'Specific diagnostic finding from audit data.' },
                        recommendation: { type: Type.STRING, description: 'Prescriptive strategy to resolve the issue.' },
                        actionSteps: {
                          type: Type.ARRAY,
                          items: { type: Type.STRING },
                          description: '3 to 5 precise, sequential implementation steps for developers or marketers.',
                        },
                        affectedComponent: {
                          type: Type.STRING,
                          description: 'Specific template, tag, or page asset affected.',
                        },
                      },
                      required: [
                        'id',
                        'priority',
                        'category',
                        'title',
                        'impact',
                        'effort',
                        'timeToImpact',
                        'diagnosis',
                        'recommendation',
                        'actionSteps',
                      ],
                    },
                  },
                },
                required: [
                  'strategicVerdict',
                  'overallHealthSummary',
                  'estimatedScoreGain',
                  'competitiveEdge',
                  'aiSearchReadiness',
                  'recommendations',
                ],
              },
            },
          });

          const rawText = response.text?.trim() || '';
          if (rawText) {
            const parsed = JSON.parse(rawText);
            return {
              domain: report.domain,
              strategicVerdict: parsed.strategicVerdict || 'Website demonstrates solid baseline fundamentals with distinct optimization opportunities in technical rendering and AI readiness.',
              overallHealthSummary: parsed.overallHealthSummary || 'Comprehensive audit reveals actionable enhancements across Core Web Vitals, metadata, and structured data.',
              estimatedScoreGain: Number(parsed.estimatedScoreGain) || 16,
              competitiveEdge: parsed.competitiveEdge || 'Accelerating page speed and implementing rich schema will establish a strong competitive advantage in SERPs.',
              aiSearchReadiness: {
                verdict: parsed.aiSearchReadiness?.verdict || 'Moderately Prepared for Generative AI Search.',
                citationPotential: parsed.aiSearchReadiness?.citationPotential || 'Content contains informative sections but requires tighter Q&A formatting and Schema markup.',
                actionItem: parsed.aiSearchReadiness?.actionItem || 'Adopt FAQPage and Organization schema markup while ensuring crawler access for AI search agents.',
              },
              recommendations: (parsed.recommendations || []).map((rec: any, idx: number) => ({
                id: rec.id || `rec_gemini_${idx + 1}`,
                priority: rec.priority || 'P1 - High',
                category: rec.category || 'Technical & Crawl',
                title: rec.title || `Optimization Recommendation #${idx + 1}`,
                impact: rec.impact || 'Improves indexation and user retention.',
                effort: rec.effort || 'Medium',
                timeToImpact: rec.timeToImpact || '1-2 Weeks',
                diagnosis: rec.diagnosis || 'Audited metrics revealed sub-optimal configuration.',
                recommendation: rec.recommendation || 'Remediate detected issues following industry best practices.',
                actionSteps: Array.isArray(rec.actionSteps) && rec.actionSteps.length > 0 ? rec.actionSteps : ['Audit codebase', 'Implement proposed changes', 'Verify with search crawler'],
                affectedComponent: rec.affectedComponent || 'Global Template',
              })),
              modelUsed: modelName,
              generatedAt: Date.now(),
              isAiGenerated: true,
            };
          }
        } catch (err: any) {
          const errStr = err?.message || String(err || '');
          lastErrorMessage = errStr;
          if (
            errStr.includes('503') ||
            errStr.includes('high demand') ||
            errStr.includes('UNAVAILABLE') ||
            errStr.includes('429') ||
            errStr.includes('resource_exhausted') ||
            errStr.includes('quota') ||
            errStr.includes('RESOURCE_EXHAUSTED') ||
            errStr.includes('overloaded')
          ) {
            isHighDemand = true;
          }
          // Short delay before trying alternative model
          await new Promise((res) => setTimeout(res, 300));
        }
      }

      if (isHighDemand || lastErrorMessage) {
        const isQuota = lastErrorMessage.includes('quota') || lastErrorMessage.includes('resource_exhausted');
        const reason = isQuota
          ? 'Gemini API free tier rate quota reached. High-precision heuristic diagnostics and recommendations generated automatically.'
          : 'Gemini API is currently experiencing peak demand. Intelligent heuristic analysis has been generated; click Regenerate to retry live AI.';
        return generateHeuristicAiInsights(report, reason);
      }
    } catch {
      // Graceful fallback to heuristic synthesis
    }
  }

  // Fallback heuristic synthesis when API key is not yet set or during offline fallback
  return generateHeuristicAiInsights(report);
}

/**
 * Intelligent algorithmic fallback when GEMINI_API_KEY is not configured
 */
export function generateHeuristicAiInsights(report: AuditReport, demandNotice?: string): AiAuditInsights {
  const recommendations: AiInsightRecommendation[] = [];
  const domain = report.domain || 'this website';
  const overallScore = report.scores?.overall ?? 75;
  const perfScore = report.scores?.performance ?? 70;
  const aiScore = report.scores?.aiReadiness ?? 68;
  const lcp = report.performance?.lcpEstimate ?? 2.8;
  const cls = report.performance?.clsEstimate ?? 0.05;

  let scoreGain = 0;

  // 1. Critical Performance / CWV Issue
  if (lcp > 2.5 || perfScore < 75) {
    scoreGain += 8;
    recommendations.push({
      id: 'rec_cwv_lcp',
      priority: lcp > 4.0 ? 'P0 - Critical' : 'P1 - High',
      category: 'Core Web Vitals',
      title: `Optimize Largest Contentful Paint (Current: ${lcp.toFixed(1)}s, Target: < 2.5s)`,
      impact: 'Significantly improves mobile page bounce rate and satisfies Google Page Experience ranking signals.',
      effort: 'Medium',
      timeToImpact: '1-2 Weeks',
      diagnosis: `LCP measured at ~${lcp.toFixed(1)}s which exceeds Google's recommended 2.5s good threshold. Hero elements, uncompressed imagery, or render-blocking scripts delay primary content paint.`,
      recommendation: 'Preload the primary hero element, utilize modern AVIF/WebP formats with explicit width/height dimensions, and defer non-critical JavaScript execution.',
      actionSteps: [
        'Add <link rel="preload" as="image" href="..." fetchpriority="high"> for the above-the-fold hero asset.',
        'Implement responsive <picture> or next-gen WebP/AVIF image compression with explicit dimension attributes.',
        'Audit third-party tracking tags and move non-essential scripts behind requestIdleCallback() or defer.',
      ],
      affectedComponent: 'Hero section & <head> asset loading',
    });
  }

  // 2. Cumulative Layout Shift
  if (cls > 0.1) {
    scoreGain += 5;
    recommendations.push({
      id: 'rec_cwv_cls',
      priority: cls > 0.25 ? 'P0 - Critical' : 'P1 - High',
      category: 'Core Web Vitals',
      title: `Eliminate Cumulative Layout Shift (Current: ${cls.toFixed(2)}, Target: < 0.10)`,
      impact: 'Prevents content jumping during load, improving Google UX ranking and conversion rates.',
      effort: 'Low',
      timeToImpact: '3-5 Days',
      diagnosis: `Layout instability of ${cls.toFixed(2)} detected. Elements shifting during asset load degrade user experience.`,
      recommendation: 'Specify explicit aspect-ratio or width/height attributes on all images, embed containers, and dynamic banner slots.',
      actionSteps: [
        'Ensure all <img> and <iframe> tags have width and height attributes in HTML.',
        'Reserve CSS min-height on dynamic ad slots and cookie consent banners.',
        'Use font-display: swap with font metric overrides to prevent FOIT/FOUT shift.',
      ],
      affectedComponent: 'Global CSS & Dynamic Banners',
    });
  }

  // 3. AI Readiness & Bot Governance
  const isBlocked = report.aiReadiness?.isBlockedFromAiSearch;
  if (isBlocked || aiScore < 75) {
    scoreGain += 6;
    recommendations.push({
      id: 'rec_ai_search',
      priority: isBlocked ? 'P0 - Critical' : 'P1 - High',
      category: 'AI & AEO',
      title: isBlocked
        ? 'Unblock AI Search Crawlers in robots.txt (OAI-SearchBot, PerplexityBot, Applebot)'
        : 'Optimize for Answer Engine Optimization (AEO) & Google AI Overviews',
      impact: 'Ensures brand visibility, authoritative citations, and zero-click answer placement in next-gen AI search engines.',
      effort: 'Low',
      timeToImpact: 'Immediate (1-3 Days)',
      diagnosis: isBlocked
        ? 'Disallow directives in robots.txt prevent AI retrieval crawlers from indexing and citing domain content.'
        : 'Lack of direct Q&A synthesis and structured answer sections limits citation frequency in Google AI Overviews.',
      recommendation: 'Permit search-focused AI user-agents in robots.txt and structure high-intent pages with 40–60 word direct factual answer summaries.',
      actionSteps: [
        'Update robots.txt to explicitly allow User-agent: OAI-SearchBot and PerplexityBot.',
        'Structure informational headings with concise answer summaries directly below the H2/H3.',
        'Integrate FAQPage and Speakable Schema.org markup for conversational query extraction.',
      ],
      affectedComponent: '/robots.txt & Informational Templates',
    });
  }

  // 4. Meta Tags & Content Optimization
  const missingTitle = report.metaTags?.titleStatus === 'critical';
  const missingDesc = report.metaTags?.descriptionStatus !== 'passed';
  if (missingTitle || missingDesc) {
    scoreGain += 5;
    recommendations.push({
      id: 'rec_meta_optimization',
      priority: missingTitle ? 'P0 - Critical' : 'P2 - Medium',
      category: 'On-Page & Content',
      title: 'Remediate Title & Meta Description Snippets for Search CTR',
      impact: 'Directly boosts organic click-through rates (CTR) from Google search result snippets.',
      effort: 'Low',
      timeToImpact: '3-7 Days',
      diagnosis: missingTitle
        ? 'Page title tag is missing or exceeds pixel display limits in SERPs.'
        : 'Meta description tag is missing or lacks compelling call-to-action triggers.',
      recommendation: 'Craft unique 50–60 character title tags with primary keywords and brand suffix, paired with 140–160 character benefit-driven meta descriptions.',
      actionSteps: [
        'Define unique <title> tags formatted as [Primary Keyword] – [Secondary Value Prop] | [Brand].',
        'Write concise, 150-character meta descriptions containing an explicit call-to-action.',
        'Ensure OpenGraph (og:title, og:image) tags mirror optimized meta tags for social sharing.',
      ],
      affectedComponent: '<head> Document Metadata',
    });
  }

  // 5. Structured Data & Schema.org
  const detectedSchemas = report.structuredData?.detectedTypes || [];
  if (detectedSchemas.length === 0 || !detectedSchemas.includes('Organization')) {
    scoreGain += 4;
    recommendations.push({
      id: 'rec_schema_jsonld',
      priority: 'P2 - Medium',
      category: 'Authority & Schema',
      title: 'Implement Rich JSON-LD Entity Markup (Organization, WebSite, BreadcrumbList)',
      impact: 'Enables rich Google search snippets, Knowledge Graph entity disambiguation, and enhanced brand authority.',
      effort: 'Low',
      timeToImpact: '1 Week',
      diagnosis: 'Detected limited or missing Schema.org structured data. Search engines must rely on raw HTML text to infer entity relationships.',
      recommendation: 'Deploy clean JSON-LD scripts defining Organization with official logo, sameAs social links, and BreadcrumbList navigation.',
      actionSteps: [
        'Inject @type: "Organization" JSON-LD with official name, logo URL, and sameAs profiles.',
        'Add BreadcrumbList schema on hierarchical directory paths.',
        'Validate markup using Google Rich Results Test to confirm zero syntax warnings.',
      ],
      affectedComponent: 'Global HTML Layout / Footer',
    });
  }

  // 6. Image Optimization
  const missingAlt = report.images?.missingAltCount || 0;
  if (missingAlt > 0) {
    scoreGain += 3;
    recommendations.push({
      id: 'rec_image_alts',
      priority: 'P2 - Medium',
      category: 'On-Page & Content',
      title: `Add Descriptive Alt Text to ${missingAlt} Unlabeled Images`,
      impact: 'Enhances image search indexing, context relevance, and WCAG 2.1 accessibility compliance.',
      effort: 'Low',
      timeToImpact: '2-4 Days',
      diagnosis: `${missingAlt} image elements lack descriptive alt attributes, preventing screen readers and Googlebot from parsing image context.`,
      recommendation: 'Audit image assets and append concise, context-rich alt descriptions omitting repetitive filler phrases like "image of".',
      actionSteps: [
        'Inspect all <img> tags identified in the Media Assets tab.',
        'Add contextual alt text describing the specific product, diagram, or scene.',
        'Use alt="" only for purely decorative divider or background icons.',
      ],
      affectedComponent: 'Image & Media Components',
    });
  }

  // 7. Security / HSTS
  if (!report.security?.hasHsts) {
    scoreGain += 2;
    recommendations.push({
      id: 'rec_security_hsts',
      priority: 'P3 - Low',
      category: 'Technical & Crawl',
      title: 'Enforce HTTP Strict Transport Security (HSTS) Server Header',
      impact: 'Eliminates SSL stripping vulnerabilities and satisfies Google HTTPS security evaluation.',
      effort: 'Low',
      timeToImpact: '1 Day',
      diagnosis: 'Strict-Transport-Security header is absent in server response headers.',
      recommendation: 'Configure your web server or CDN to serve Strict-Transport-Security: max-age=31536000; includeSubDomains; preload.',
      actionSteps: [
        'Add the HSTS response header in Nginx, Cloudflare, or Apache configuration.',
        'Verify HTTPS enforcement across all subdomains.',
        'Submit domain to Chrome HSTS Preload list for permanent browser pre-encryption.',
      ],
      affectedComponent: 'Server Response Headers (CDN / Nginx)',
    });
  }

  return {
    domain: report.domain,
    strategicVerdict: overallScore >= 85
      ? `${domain} demonstrates strong technical and SEO authority. Targeted Core Web Vitals and AEO optimizations will protect top rankings and capture high-intent AI Overviews traffic.`
      : overallScore >= 70
      ? `${domain} possesses solid foundations but experiences performance and metadata friction that suppresses potential organic rankings. Addressing Core Web Vitals and structured data will yield rapid improvements.`
      : `${domain} exhibits multiple architectural and crawlability barriers that restrict organic indexation. Immediate remediation of critical tags and speed bottlenecks is advised.`,
    overallHealthSummary: `Comprehensive evaluation of ${report.crawledPages?.length || 1} page(s) identified ${report.statCounts?.errors || 0} critical errors and ${report.statCounts?.warnings || 0} warnings. The primary recovery lever lies in Core Web Vitals optimization and Answer Engine readiness.`,
    estimatedScoreGain: Math.min(30, Math.max(12, scoreGain)),
    competitiveEdge: 'Implementing structured answerability and eliminating Largest Contentful Paint delays will allow this site to outrank competitors currently relying on legacy text content.',
    aiSearchReadiness: {
      verdict: aiScore >= 80 ? 'Well positioned for Generative AI search citations.' : 'Requires structured answer formatting for Google AI Overviews.',
      citationPotential: 'High potential once key entity facts and FAQ answer blocks are paired with verified Schema.org markup.',
      actionItem: 'Ensure robots.txt allows OAI-SearchBot/PerplexityBot and format primary content with immediate factual answers beneath each heading.',
    },
    recommendations: recommendations.slice(0, 6),
    modelUsed: 'heuristic_synthesis_engine',
    generatedAt: Date.now(),
    isAiGenerated: false,
    demandPeakNotice: demandNotice,
  };
}
