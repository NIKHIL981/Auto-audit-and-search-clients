import { AuditReport, AuditCheckItem } from '../types';

const STORAGE_KEY = 'audit_suite_reports_v2';
const CURRENT_ACTIVE_KEY = 'audit_suite_active_id_v2';

let cachedSample: AuditReport | null = null;
function getSampleReport(): AuditReport {
  if (!cachedSample) {
    cachedSample = createSampleAuditReport();
  }
  return cachedSample;
}

export function sanitizeReport(raw: any): AuditReport {
  const sample = getSampleReport();
  if (!raw || typeof raw !== 'object') {
    return sample;
  }

  const rawIssues = Array.isArray(raw.issues) ? raw.issues : sample.issues;
  const issues = rawIssues.map((i: any) => {
    let p: 'High' | 'Medium' | 'Low' = 'Medium';
    if (i?.priority === 'High' || i?.priority === 'high') p = 'High';
    else if (i?.priority === 'Low' || i?.priority === 'low') p = 'Low';
    else if (i?.priority === 'Medium' || i?.priority === 'medium') p = 'Medium';
    else if (i?.severity === 'critical') p = 'High';
    else if (i?.severity === 'warning') p = 'Medium';
    else p = 'Low';

    const defaultScore = p === 'High' ? 90 : p === 'Medium' ? 60 : 30;

    return {
      ...i,
      priority: p,
      impactScore: typeof i?.impactScore === 'number' ? i.impactScore : defaultScore,
      isCompleted: Boolean(i?.isCompleted),
      completedAt: i?.completedAt ? Number(i.completedAt) : undefined,
      completionNotes: typeof i?.completionNotes === 'string' ? i.completionNotes : undefined,
    };
  });
  const completedTasksCount = issues.filter((i: any) => i.isCompleted).length;
  const criticalCount = issues.filter((i: any) => i?.severity === 'critical').length;
  const warningCount = issues.filter((i: any) => i?.severity === 'warning').length;
  const passedCount = issues.filter((i: any) => i?.severity === 'passed').length + 15;

  const cwvScore = Number(raw.statCounts?.cwvScore ?? raw.performance?.score ?? sample.statCounts?.cwvScore ?? 85);
  const cwvRating = ['good', 'needs-improvement', 'poor'].includes(raw.statCounts?.cwvRating)
    ? raw.statCounts.cwvRating
    : cwvScore >= 80
    ? 'good'
    : cwvScore >= 60
    ? 'needs-improvement'
    : 'poor';

  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id : `audit_${Date.now()}`,
    url: typeof raw.url === 'string' && raw.url ? raw.url : sample.url,
    domain: typeof raw.domain === 'string' && raw.domain ? raw.domain : sample.domain,
    timestamp: typeof raw.timestamp === 'number' ? raw.timestamp : Date.now(),
    status: raw.status || 'completed',
    fetchMethod: raw.fetchMethod || 'live_html',
    screenshotUrl: raw.screenshotUrl || sample.screenshotUrl,
    scores: {
      overall: Number(raw.scores?.overall ?? sample.scores.overall),
      technical: Number(raw.scores?.technical ?? sample.scores.technical),
      performance: Number(raw.scores?.performance ?? sample.scores.performance),
      content: Number(raw.scores?.content ?? sample.scores.content),
      aiReadiness: Number(raw.scores?.aiReadiness ?? sample.scores.aiReadiness),
    },
    statCounts: {
      errors: Number(raw.statCounts?.errors ?? criticalCount),
      warnings: Number(raw.statCounts?.warnings ?? warningCount),
      passed: Number(raw.statCounts?.passed ?? passedCount),
      cwvScore,
      cwvRating,
    },
    allChecks: Array.isArray(raw.allChecks) && raw.allChecks.length > 0 ? raw.allChecks : sample.allChecks,
    metaTags: raw.metaTags || sample.metaTags,
    headings: {
      h1Count: Number(raw.headings?.h1Count ?? 1),
      h2Count: Number(raw.headings?.h2Count ?? 0),
      h3Count: Number(raw.headings?.h3Count ?? 0),
      h4Count: Number(raw.headings?.h4Count ?? 0),
      h5Count: Number(raw.headings?.h5Count ?? 0),
      h6Count: Number(raw.headings?.h6Count ?? 0),
      headings: Array.isArray(raw.headings?.headings) ? raw.headings.headings : (sample.headings?.headings || []),
      status: raw.headings?.status || 'passed',
      message: raw.headings?.message || '',
      hierarchyValid: Boolean(raw.headings?.hierarchyValid ?? true),
      skippedLevels: Array.isArray(raw.headings?.skippedLevels) ? raw.headings.skippedLevels : [],
    },
    structuredData: {
      hasJsonLd: Boolean(raw.structuredData?.hasJsonLd ?? false),
      hasMicrodata: Boolean(raw.structuredData?.hasMicrodata ?? false),
      schemas: Array.isArray(raw.structuredData?.schemas) ? raw.structuredData.schemas : (sample.structuredData?.schemas || []),
      detectedTypes: Array.isArray(raw.structuredData?.detectedTypes) ? raw.structuredData.detectedTypes : (sample.structuredData?.detectedTypes || []),
      status: raw.structuredData?.status || 'passed',
      message: raw.structuredData?.message || '',
    },
    performance: {
      lcpEstimate: Number(raw.performance?.lcpEstimate ?? 1.8),
      lcpRating: raw.performance?.lcpRating || 'good',
      inpEstimate: Number(raw.performance?.inpEstimate ?? 110),
      inpRating: raw.performance?.inpRating || 'good',
      clsEstimate: Number(raw.performance?.clsEstimate ?? 0.03),
      clsRating: raw.performance?.clsRating || 'good',
      score: cwvScore,
    },
    images: {
      totalImages: Number(raw.images?.totalImages ?? 0),
      missingAltCount: Number(raw.images?.missingAltCount ?? 0),
      missingAltSamples: Array.isArray(raw.images?.missingAltSamples) ? raw.images.missingAltSamples : [],
      modernFormatCount: Number(raw.images?.modernFormatCount ?? 0),
      legacyFormatCount: Number(raw.images?.legacyFormatCount ?? 0),
      missingDimensionsCount: Number(raw.images?.missingDimensionsCount ?? 0),
      status: raw.images?.status || 'passed',
      message: raw.images?.message || '',
    },
    security: {
      isHttps: Boolean(raw.security?.isHttps ?? true),
      mixedContentCount: Number(raw.security?.mixedContentCount ?? 0),
      mixedContentSamples: Array.isArray(raw.security?.mixedContentSamples) ? raw.security.mixedContentSamples : [],
      hasHsts: Boolean(raw.security?.hasHsts ?? true),
      status: raw.security?.status || 'passed',
      message: raw.security?.message || '',
    },
    linking: {
      totalLinks: Number(raw.linking?.totalLinks ?? 0),
      internalCount: Number(raw.linking?.internalCount ?? 0),
      externalCount: Number(raw.linking?.externalCount ?? 0),
      brokenLinkRisks: Number(raw.linking?.brokenLinkRisks ?? 0),
      emptyAnchorCount: Number(raw.linking?.emptyAnchorCount ?? 0),
      genericAnchorCount: Number(raw.linking?.genericAnchorCount ?? 0),
      sampleLinks: Array.isArray(raw.linking?.sampleLinks) ? raw.linking.sampleLinks : [],
      status: raw.linking?.status || 'passed',
      message: raw.linking?.message || '',
    },
    content: {
      wordCount: Number(raw.content?.wordCount ?? 0),
      characterCount: Number(raw.content?.characterCount ?? 0),
      readingTimeMinutes: Number(raw.content?.readingTimeMinutes ?? 1),
      fleschScore: Number(raw.content?.fleschScore ?? 68),
      readabilityGrade: raw.content?.readabilityGrade || 'Standard',
      textToHtmlRatio: Number(raw.content?.textToHtmlRatio ?? 15),
      status: raw.content?.status || 'passed',
      message: raw.content?.message || '',
    },
    aiReadiness: {
      overallAiScore: Number(raw.aiReadiness?.overallAiScore ?? sample.aiReadiness?.overallAiScore ?? 85),
      robotsTxtPresent: Boolean(raw.aiReadiness?.robotsTxtPresent ?? false),
      robotsTxtUrl: raw.aiReadiness?.robotsTxtUrl || null,
      botGovernance: Array.isArray(raw.aiReadiness?.botGovernance) ? raw.aiReadiness.botGovernance : (sample.aiReadiness?.botGovernance || []),
      isBlockedFromAiTraining: Boolean(raw.aiReadiness?.isBlockedFromAiTraining ?? false),
      isBlockedFromAiSearch: Boolean(raw.aiReadiness?.isBlockedFromAiSearch ?? false),
      structuredAnswerabilityScore: Number(raw.aiReadiness?.structuredAnswerabilityScore ?? 85),
      structuredAnswerabilityNotes: raw.aiReadiness?.structuredAnswerabilityNotes || 'Clear semantic structure.',
      hasFaqStructure: Boolean(raw.aiReadiness?.hasFaqStructure ?? false),
      hasTablesOrLists: Boolean(raw.aiReadiness?.hasTablesOrLists ?? false),
      hasDirectAnswers: Boolean(raw.aiReadiness?.hasDirectAnswers ?? true),
      eeatScore: Number(raw.aiReadiness?.eeatScore ?? 80),
      experienceScore: Number(raw.aiReadiness?.experienceScore ?? 80),
      expertiseScore: Number(raw.aiReadiness?.expertiseScore ?? 80),
      authoritativenessScore: Number(raw.aiReadiness?.authoritativenessScore ?? 80),
      trustworthinessScore: Number(raw.aiReadiness?.trustworthinessScore ?? 80),
      eeatBreakdown: raw.aiReadiness?.eeatBreakdown || sample.aiReadiness?.eeatBreakdown || {
        authorSignals: true,
        publisherIdentified: true,
        contactAvailable: true,
        policyPagesPresent: true,
        sourceCitationsFound: true,
      },
      originalityScore: Number(raw.aiReadiness?.originalityScore ?? 85),
      humanizationRating: raw.aiReadiness?.humanizationRating || 'High Human Craft',
      aiPatternFlags: Array.isArray(raw.aiReadiness?.aiPatternFlags) ? raw.aiReadiness.aiPatternFlags : [],
      semanticSummary: raw.aiReadiness?.semanticSummary || sample.aiReadiness?.semanticSummary || '',
    },
    keywords: Array.isArray(raw.keywords) ? raw.keywords : [],
    sitemaps: Array.isArray(raw.sitemaps) ? raw.sitemaps : [],
    ecomValidation: raw.ecomValidation || sample.ecomValidation,
    breadcrumbValidation: raw.breadcrumbValidation || sample.breadcrumbValidation,
    accessibility: raw.accessibility || sample.accessibility,
    mobileParity: raw.mobileParity || sample.mobileParity,
    csrRendering: raw.csrRendering || sample.csrRendering,
    crawlSettings: raw.crawlSettings || sample.crawlSettings,
    crawledPages: Array.isArray(raw.crawledPages) && raw.crawledPages.length > 0 ? raw.crawledPages : sample.crawledPages,
    totalPagesCrawled: Number(raw.totalPagesCrawled ?? (Array.isArray(raw.crawledPages) ? raw.crawledPages.length : sample.totalPagesCrawled ?? 50)),
    crawlSummary: raw.crawlSummary || sample.crawlSummary,
    issues,
    completedTasksCount,
    checklistSummary: raw.checklistSummary || {
      total: issues.length,
      completed: completedTasksCount,
      percent: issues.length > 0 ? Math.round((completedTasksCount / issues.length) * 100) : 0,
      lastUpdated: Date.now(),
    },
    contentSentiment: raw.contentSentiment || sample.contentSentiment,
    executiveSummary: raw.executiveSummary || sample.executiveSummary,
    quickWins: Array.isArray(raw.quickWins) && raw.quickWins.length > 0 ? raw.quickWins : sample.quickWins,
  };
}

export function getInitialSampleSnapshots(): AuditReport[] {
  const base = getSampleReport();
  const baseTimestamp = base.timestamp || Date.now();

  const snap1: AuditReport = {
    ...base,
    id: 'audit_snap_synthetix_01',
    timestamp: baseTimestamp - 28 * 86400000,
    scores: {
      overall: 73,
      technical: 75,
      performance: 64,
      content: 79,
      aiReadiness: 71,
    },
    performance: {
      lcpEstimate: 3.5,
      lcpRating: 'poor',
      inpEstimate: 210,
      inpRating: 'needs-improvement',
      clsEstimate: 0.12,
      clsRating: 'needs-improvement',
      score: 64,
    },
    statCounts: {
      errors: 7,
      warnings: 12,
      passed: 25,
      cwvScore: 64,
      cwvRating: 'needs-improvement',
    },
    executiveSummary: 'Initial baseline audit snapshot. Heavy unoptimized media assets and synchronous scripts causing slow LCP (3.5s) resulting in an initial 64% Performance Score.',
  };

  const snap2: AuditReport = {
    ...base,
    id: 'audit_snap_synthetix_02',
    timestamp: baseTimestamp - 17 * 86400000,
    scores: {
      overall: 80,
      technical: 83,
      performance: 72,
      content: 83,
      aiReadiness: 79,
    },
    performance: {
      lcpEstimate: 2.7,
      lcpRating: 'needs-improvement',
      inpEstimate: 160,
      inpRating: 'good',
      clsEstimate: 0.07,
      clsRating: 'good',
      score: 72,
    },
    statCounts: {
      errors: 4,
      warnings: 8,
      passed: 39,
      cwvScore: 72,
      cwvRating: 'needs-improvement',
    },
    executiveSummary: 'Sprint 2 optimization snapshot. Converted PNG/JPG graphics to modern WebP format and added explicit dimensions to eliminate layout shifts. Performance score improved +8 pts to 72%.',
  };

  const snap3: AuditReport = {
    ...base,
    id: 'audit_snap_synthetix_03',
    timestamp: baseTimestamp - 6 * 86400000,
    scores: {
      overall: 85,
      technical: 88,
      performance: 78,
      content: 87,
      aiReadiness: 84,
    },
    performance: {
      lcpEstimate: 2.1,
      lcpRating: 'good',
      inpEstimate: 130,
      inpRating: 'good',
      clsEstimate: 0.04,
      clsRating: 'good',
      score: 78,
    },
    statCounts: {
      errors: 3,
      warnings: 5,
      passed: 52,
      cwvScore: 78,
      cwvRating: 'good',
    },
    executiveSummary: 'Edge CDN deployment snapshot. Enabled global CDN edge caching rules and font preloading. LCP dropped to 2.1s; Performance Score reached 78%.',
  };

  const snap4: AuditReport = {
    ...base,
    id: 'audit_snap_synthetix_04',
    timestamp: baseTimestamp,
    scores: {
      overall: 89,
      technical: 92,
      performance: 82,
      content: 90,
      aiReadiness: 88,
    },
    performance: {
      lcpEstimate: 1.8,
      lcpRating: 'good',
      inpEstimate: 110,
      inpRating: 'good',
      clsEstimate: 0.03,
      clsRating: 'good',
      score: 82,
    },
    statCounts: {
      errors: 2,
      warnings: 4,
      passed: 68,
      cwvScore: 82,
      cwvRating: 'good',
    },
    executiveSummary: 'Latest multi-page crawl. Code splitting and deferred non-critical CSS deployed. Performance Score achieved 82% with green CWV metrics.',
  };

  return [snap4, snap3, snap2, snap1];
}

export function getSavedReports(): AuditReport[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = getInitialSampleSnapshots();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      const initial = getInitialSampleSnapshots();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    const sanitized = parsed.map((item) => sanitizeReport(item)).filter(Boolean);
    // If only 1 report exists for the default sample domain, enrich it with historical snapshots
    if (sanitized.length <= 1 && sanitized[0]?.domain === 'synthetix-cloud.dev') {
      const initial = getInitialSampleSnapshots();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    return sanitized;
  } catch (e) {
    console.error('Failed to load reports from localStorage', e);
    return [];
  }
}

export function saveReport(report: AuditReport): AuditReport[] {
  try {
    const sanitized = sanitizeReport(report);
    const reports = getSavedReports();
    const filtered = reports.filter((r) => r.id !== sanitized.id);
    const updated = [sanitized, ...filtered].slice(0, 30);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    localStorage.setItem(CURRENT_ACTIVE_KEY, sanitized.id);
    return updated;
  } catch (e) {
    console.error('Failed to save report to localStorage', e);
    return getSavedReports();
  }
}

export const loadAuditHistory = getSavedReports;
export const saveAuditReport = saveReport;
export const deleteAuditReport = deleteReport;
export const clearAuditHistory = clearAllReports;

export function deleteReport(id: string): AuditReport[] {
  try {
    const reports = getSavedReports().filter((r) => r.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
    return reports;
  } catch (e) {
    console.error('Failed to delete report', e);
    return getSavedReports();
  }
}

export function clearAllReports(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(CURRENT_ACTIVE_KEY);
  } catch (e) {
    console.error('Failed to clear reports', e);
  }
}

export function getActiveReportId(): string | null {
  return localStorage.getItem(CURRENT_ACTIVE_KEY);
}

export function setActiveReportId(id: string): void {
  localStorage.setItem(CURRENT_ACTIVE_KEY, id);
}

function encodeSvgDataUri(svg: string): string {
  try {
    // Unicode-safe base64 encoding
    return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
  } catch {
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }
}

function generateSampleScreenshot(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ffffff"/>
        <stop offset="100%" stop-color="#f8fafc"/>
      </linearGradient>
      <linearGradient id="heroAccent" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#0284c7"/>
        <stop offset="100%" stop-color="#2563eb"/>
      </linearGradient>
    </defs>
    <rect width="800" height="500" rx="10" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5"/>
    <rect x="0" y="0" width="800" height="40" rx="10" fill="#f1f5f9"/>
    <circle cx="20" cy="20" r="5.5" fill="#ef4444"/>
    <circle cx="38" cy="20" r="5.5" fill="#f59e0b"/>
    <circle cx="56" cy="20" r="5.5" fill="#10b981"/>
    <rect x="80" y="8" width="580" height="24" rx="5" fill="#ffffff" stroke="#cbd5e1" stroke-width="1"/>
    <path d="M96 17 a3 3 0 0 1 6 0 v3 h-6 z m-1 3 h8 v6 h-8 z" fill="#10b981"/>
    <text x="110" y="24" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" fill="#475569">
      https://synthetix-cloud.dev/
    </text>
    <g transform="translate(0, 40)">
      <rect width="800" height="460" fill="url(#bgGrad)"/>
      <rect width="800" height="54" fill="#ffffff" opacity="0.95" stroke="#e2e8f0" stroke-width="1"/>
      <rect x="36" y="17" width="130" height="20" rx="4" fill="#0f172a"/>
      <text x="44" y="31" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700" fill="#ffffff">SYNTHETIX</text>
      <rect x="420" y="21" width="55" height="12" rx="3" fill="#64748b"/>
      <rect x="495" y="21" width="55" height="12" rx="3" fill="#64748b"/>
      <rect x="570" y="21" width="55" height="12" rx="3" fill="#64748b"/>
      <rect x="660" y="14" width="105" height="26" rx="5" fill="url(#heroAccent)"/>
      <text x="686" y="31" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="600" fill="#ffffff">Get Started</text>
      <rect x="36" y="86" width="165" height="24" rx="12" fill="#eff6ff" stroke="#bfdbfe" stroke-width="1"/>
      <circle cx="50" cy="98" r="4" fill="#2563eb"/>
      <text x="60" y="102" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="600" fill="#2563eb">Live Verified Crawl</text>
      <text x="36" y="152" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="28" font-weight="800" fill="#0f172a">
        Next-Generation Autonomous Cloud
      </text>
      <text x="36" y="184" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13.5" fill="#475569">
        Deploy resilient AI workloads with automated model orchestration and edge caching.
      </text>
      <rect x="36" y="214" width="140" height="38" rx="7" fill="#0f172a"/>
      <text x="64" y="238" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="600" fill="#ffffff">Explore Product</text>
      <rect x="190" y="214" width="125" height="38" rx="7" fill="#ffffff" stroke="#cbd5e1" stroke-width="1"/>
      <text x="220" y="238" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="600" fill="#334155">Documentation</text>
      <rect x="36" y="280" width="225" height="145" rx="8" fill="#ffffff" stroke="#e2e8f0" stroke-width="1"/>
      <rect x="281" y="280" width="225" height="145" rx="8" fill="#ffffff" stroke="#e2e8f0" stroke-width="1"/>
      <rect x="526" y="280" width="238" height="145" rx="8" fill="#ffffff" stroke="#e2e8f0" stroke-width="1"/>
    </g>
  </svg>`;
  return encodeSvgDataUri(svg);
}

function createSampleCrawledPages(): { pages: any[]; issues: any[]; summary: any } {
  const routes = [
    { path: '/', title: 'Synthetix Cloud - Next-Gen Autonomous AI Infrastructure', desc: 'Deploy resilient AI workloads with automated model orchestration, edge caching, and fine-grained LLM crawler governance for enterprise applications.', words: 1240, h1: 'Next-Generation Autonomous AI Infrastructure', score: 94 },
    { path: '/pricing', title: 'Pricing & Plans | Transparent Scalable Tiers - Synthetix', desc: 'Explore transparent, usage-based compute pricing and reserved enterprise clusters with 99.99% uptime SLAs.', words: 950, h1: 'Simple, Predictable Cloud Pricing', score: 92 },
    { path: '/features', title: 'Enterprise Features & Architectural Overview - Synthetix', desc: 'Discover high-throughput model inference, distributed KV storage, and zero-trust VPC isolation.', words: 1100, h1: 'Engineered for Real-Time AI Workloads', score: 88 },
    { path: '/features/autonomous-agents', title: 'Autonomous Agent Orchestration - Synthetix Cloud', desc: 'Scale multi-agent swarms with persistent execution states, dynamic task delegation, and sub-10ms response latency.', words: 880, h1: 'Agent Swarms at Global Scale', score: 91 },
    { path: '/features/edge-caching', title: 'Global Edge Semantic Cache & Vector Acceleration', desc: '', words: 760, h1: 'Instantaneous Token Retrieval with Edge Caching', score: 79 },
    { path: '/docs', title: 'Developer Documentation & Architecture Manual - Synthetix', desc: 'Comprehensive technical guides, tutorials, and configuration references for deploying AI clusters.', words: 1650, h1: 'Synthetix Developer Documentation', score: 96 },
    { path: '/docs/quickstart', title: 'Quickstart: Deploy Your First Model Swarm in 5 Minutes', desc: 'Step-by-step guide to installing the Synthetix CLI, provisioning an API key, and streaming inference.', words: 1320, h1: 'Getting Started with Synthetix Cloud', score: 95 },
    { path: '/docs/api-reference', title: 'Synthetix REST & Streaming WebSocket API Reference', desc: 'Full endpoint specifications, JSON payload schemas, rate limits, and error code references.', words: 2450, h1: 'Core Platform API Reference', score: 97 },
    { path: '/docs/authentication', title: 'Authentication, Secret Vaults & OAuth2 Security Guide', desc: 'Configure scoped service accounts, bearer token rotation, and hardware-backed secret encryption.', words: 1180, h1: 'Managing Cluster Authentication & Secrets', score: 90 },
    { path: '/docs/webhooks', title: 'Webhooks & Asynchronous Event Streaming Architecture', desc: 'Listen to workload events, node provisioning status, and alert triggers with cryptographic signatures.', words: 890, h1: 'Configuring Real-Time Event Webhooks', score: 86 },
    { path: '/docs/sdks/node', title: 'Official Node.js & TypeScript SDK Documentation', desc: 'Native TypeScript client featuring automatic retries, streaming responses, and telemetry hooks.', words: 1420, h1: 'Node.js & TypeScript SDK Guide', score: 95 },
    { path: '/docs/sdks/python', title: 'Official Python SDK for PyTorch and LangChain', desc: 'Asynchronous Python client with async/await support, Pydantic validation, and streaming generator support.', words: 1510, h1: 'Python SDK & Framework Integrations', score: 94 },
    { path: '/blog', title: 'Synthetix Engineering Blog | Distributed Systems & AI', desc: 'Technical deep-dives, architectural post-mortems, and performance benchmarks from our engineering team.', words: 980, h1: 'Synthetix Engineering Blog', score: 90 },
    { path: '/blog/scaling-infrastructure', title: 'Scaling Autonomous Agent Workloads to 10M Requests/Day', desc: 'How we tuned Linux kernel network stacks and eBPF tracing to sustain sub-5ms tail latency.', words: 2100, h1: 'Engineering Benchmarks: 10M Daily Swarm Requests', score: 98 },
    { path: '/blog/next-gen-ai-search', title: 'Preparing Web Properties for Generative Engine Optimization', desc: 'Why AI search models prioritize answerability, structured JSON-LD, and verified citation standards.', words: 1840, h1: 'The Definitive Guide to Generative Engine Optimization (GEO)', score: 96 },
    { path: '/blog/zero-trust-cloud', title: 'Building Zero-Trust Multi-Tenant Enclaves with Firecracker', desc: 'Isolating untrusted user LLM execution in microVMs with cryptographic attestation.', words: 1750, h1: 'Zero-Trust Enclaves with MicroVMs', score: 93 },
    { path: '/blog/benchmark-results', title: 'H100 vs B200 Cluster Throughput Benchmarks 2026', desc: 'Comparative FLOPs, thermal throttling, and cost per million tokens across contemporary accelerators.', words: 1950, h1: 'Hardware Accelerator Benchmarks 2026', score: 95 },
    { path: '/about', title: 'About Us | Pioneering Autonomous Infrastructure', desc: 'Meet the team behind Synthetix. We are distributed systems engineers and researchers building open cloud tooling.', words: 840, h1: 'Our Mission: Decentralized AI Infrastructure', score: 91 },
    { path: '/team', title: 'Leadership & Research Team Directory - Synthetix', desc: 'Meet the executive leadership, engineering fellows, and advisory board building the Synthetix platform.', words: 620, h1: 'The Team Behind the Platform', score: 88 },
    { path: '/careers', title: 'Careers at Synthetix | Open Engineering Positions', desc: 'Join our fully distributed team. We are hiring Rust systems engineers, distributed database architects, and SREs.', words: 1120, h1: 'Build the Future of Compute with Us', score: 94 },
    { path: '/contact', title: 'Contact Enterprise Sales & Architecture Support', desc: 'Schedule a tailored architecture consultation with our principal solutions engineers.', words: 450, h1: 'Connect with Our Engineering Solutions Team', score: 89 },
    { path: '/support', title: 'Customer Support Portal, Knowledgebase & SLAs', desc: 'Access 24/7/365 tier-1 engineering support, raise priority incident tickets, and read knowledge base guides.', words: 790, h1: 'Synthetix Support Center', score: 91 },
    { path: '/status', title: 'Synthetix Cloud System Status & Real-Time Uptime', desc: 'Live operational status across global compute regions, API edge proxies, and storage clusters.', words: 380, h1: 'All Systems Operational - 99.99% Uptime', score: 93 },
    { path: '/security', title: 'Enterprise Security, SOC 2 Type II & Compliance', desc: 'Review our cryptographic audit reports, HIPAA compliance frameworks, and vulnerability disclosure policies.', words: 1450, h1: 'Enterprise Security Architecture & Compliance', score: 97 },
    { path: '/compliance', title: 'Regulatory Compliance Frameworks & Certifications', desc: 'Certified adherence to ISO 27001, SOC 2 Type II, GDPR, CCPA, and FedRAMP readiness standards.', words: 1250, h1: 'Global Regulatory Certifications', score: 95 },
    { path: '/privacy', title: 'Global Privacy Policy & Data Processing Agreement', desc: 'Learn how Synthetix secures customer telemetry and guarantees zero retention for private model weights.', words: 2800, h1: 'Synthetix Global Privacy Policy', score: 98 },
    { path: '/terms', title: 'Enterprise Terms of Service & Master Services Agreement', desc: 'Standard terms governing cluster provisioning, compute resource consumption, and uptime warranties.', words: 3100, h1: 'Terms of Service', score: 98 },
    { path: '/cookie-policy', title: 'Cookie Policy & Consent Management Preferences', desc: 'Detailed disclosure of essential session tokens and analytics tracking mechanisms.', words: 910, h1: 'Cookie Policy & Tracker Disclosure', score: 92 },
    { path: '/integrations', title: 'Cloud Integrations Directory & Marketplace', desc: 'Connect Synthetix with AWS, Google Cloud, Azure, Datadog, Slack, and HashiCorp Terraform.', words: 1350, h1: 'Ecosystem Integrations & Connectors', score: 94 },
    { path: '/integrations/github', title: 'GitHub Actions Continuous Integration Runner', desc: 'Automatically deploy model endpoints and evaluate regressions directly from your pull requests.', words: 920, h1: 'GitHub Actions Workflow Integration', score: 93 },
    { path: '/integrations/slack', title: 'Slack Real-Time Cluster Alerts & PagerDuty Bridge', desc: 'Receive automated notifications for cluster scaling events, anomaly spikes, and quota exhaustion.', words: 710, h1: 'Real-Time Slack Event Dispatcher', score: 89 },
    { path: '/integrations/datadog', title: 'Datadog APM Telemetry & Metrics Streaming Bridge', desc: 'Stream OpenTelemetry metrics, Prometheus counters, and distributed traces to your Datadog dashboards.', words: 1050, h1: 'Full-Stack Datadog APM Integration', score: 95 },
    { path: '/integrations/aws', title: 'AWS Direct Connect & PrivateLink VPC Peering', desc: 'Link your existing AWS S3 buckets, RDS instances, and IAM roles to Synthetix edge compute.', words: 1210, h1: 'Amazon Web Services PrivateLink Setup', score: 94 },
    { path: '/integrations/gcp', title: 'Google Cloud Platform Vertex AI & BigQuery Connectors', desc: 'Export inference vector embeddings directly to BigQuery and query Vertex AI foundation models.', words: 1140, h1: 'Google Cloud Platform Interconnect', score: 93 },
    { path: '/case-studies', title: 'Enterprise Customer Case Studies & Production Benchmarks', desc: 'Read how Fortune 500 engineering teams migrated compute workloads to Synthetix to cut inference costs by 45%.', words: 1400, h1: 'Proven Enterprise Performance at Scale', score: 95 },
    { path: '/case-studies/fintech', title: 'Global Neobank Secures Sub-10ms Fraud Prevention Inferences', desc: 'Processing 45,000 transactions per second with deterministic microVM hardware acceleration.', words: 1620, h1: 'Scaling Fraud Detection with Zero Downtime', score: 96 },
    { path: '/case-studies/health', title: 'HIPAA-Compliant Diagnostic Imaging Pipeline at Scale', desc: 'Anonymizing medical imaging data and processing multi-gigapixel scans in HIPAA-certified VPCs.', words: 1540, h1: 'Healthcare AI Diagnostics in Isolated Enclaves', score: 95 },
    { path: '/solutions/enterprise', title: 'Dedicated Private Cloud Solutions for Large Enterprises', desc: 'Custom bare-metal GPU clusters, dedicated optical cross-connects, and 24/7 dedicated SRE coverage.', words: 1380, h1: 'Enterprise Private Cloud Architecture', score: 94 },
    { path: '/solutions/startups', title: 'Synthetix for Startups: $100K in Compute Credits', desc: 'Accelerate your prototype with free compute credits, founder mentorship, and technical onboarding.', words: 820, h1: 'Launch and Scale Your AI Startup', score: 91 },
    { path: '/solutions/developers', title: 'Developer-First Tooling, Serverless APIs and CLI', desc: 'Deploy with git push, test in local dockerized runners, and inspect traces with instant zero-config logs.', words: 990, h1: 'Built for Developers Who Ship Daily', score: 92 },
    { path: '/partners', title: 'Global Technology Partner Network & SI Program', desc: 'Collaborate with verified system integrators and consultancy partners to deploy enterprise AI.', words: 780, h1: 'Synthetix Partner Ecosystem', score: 89 },
    { path: '/community', title: 'Developer Community, Discord Server & Discussion Forums', desc: 'Join 15,000+ distributed systems engineers on Discord, attend virtual hackathons, and contribute.', words: 680, h1: 'Join Our Global Engineering Community', score: 90 },
    { path: '/changelog', title: 'Product Updates, Kernel Patches & Platform Changelog', desc: 'Weekly release notes detailing performance improvements, new SDK methods, and security patches.', words: 1850, h1: 'Synthetix Platform Changelog', score: 97 },
    { path: '/roadmap', title: 'Public Product Roadmap & Upcoming Regional Expansions', desc: 'Transparent engineering roadmap detailing upcoming edge regions, custom ASIC support, and features.', words: 910, h1: '2026 Public Engineering Roadmap', score: 92 },
    { path: '/faq', title: 'Frequently Asked Technical & Commercial Questions', desc: 'Answers to common questions regarding data isolation, billing granularity, SLAs, and data egress.', words: 1650, h1: 'Frequently Asked Questions', score: 96 },
    { path: '/pricing/calculator', title: 'Interactive Compute Cost & TCO Estimation Calculator', desc: 'Estimate monthly cloud expenditure based on vCPU, GPU hours, memory allocation, and egress.', words: 540, h1: 'Interactive Cloud TCO Calculator', score: 87 },
    { path: '/docs/tutorials', title: 'Step-by-Step Production Deployment Tutorials', desc: 'End-to-end guides covering vector database integration, token rate-limiting, and canary rollouts.', words: 1480, h1: 'Hands-On Architecture Tutorials', score: 94 },
    { path: '/blog/llm-crawlers', title: 'How LLM Web Crawlers Scan and Index Modern Websites', desc: 'Anatomy of GPTBot, ClaudeBot, and Google-Extended crawlers and how to calibrate robots.txt.', words: 1720, h1: 'Under the Hood of LLM Web Crawlers', score: 96 },
    { path: '/security/soc2', title: 'SOC 2 Type II Compliance Report & Audit Overview', desc: 'Download our executive summary report prepared by independent third-party cybersecurity auditors.', words: 960, h1: 'SOC 2 Type II Security Verification', score: 93 },
    { path: '/legal/gdpr', title: 'GDPR Compliance Statement & Data Subject Rights', desc: 'Comprehensive compliance declaration for customers processing data under European Union privacy law.', words: 1420, h1: 'EU General Data Protection Regulation (GDPR) Notice', score: 95 },
  ];

  const domain = 'synthetix-cloud.dev';
  const allIssues: any[] = [];
  const pages = routes.map((r, idx) => {
    const pageUrl = `https://${domain}${r.path === '/' ? '' : r.path}`;
    const pageIssues: any[] = [];

    if (r.path === '/features/edge-caching') {
      pageIssues.push({
        id: 'iss-desc-features-edge-caching',
        category: 'technical',
        severity: 'critical',
        title: 'Missing Meta Description',
        description: 'Page lacks a <meta name="description"> tag in the HTML head.',
        impact: 'Search engines generate arbitrary snippets, reducing organic CTR in search results.',
        recommendation: 'Add a high-intent, 130-155 character meta description defining the page value proposition.',
        pageUrl,
        pagePath: r.path,
        pageTitle: r.title,
        pageLocation: '<head> > <meta name="description"> tag',
        affectedElement: '<head> (No description declared)',
        whatToDo: '1. Open the template or route file for /features/edge-caching.\n2. In the <head> container, add a <meta name="description"> tag.\n3. Write a concise 135-character description with target keywords.\n4. Deploy and verify with SERP preview simulator.',
        codeSnippet: '<meta name="description" content="Accelerate AI inference with Synthetix global semantic edge caching. Reduce latency by up to 80% with instant distributed token retrieval.">',
      });
    }

    if (r.path === '/features') {
      pageIssues.push({
        id: 'iss-alt-features',
        category: 'performance',
        severity: 'warning',
        title: 'Images Missing Descriptive Alt Text',
        description: '2 architectural topology graphics lack alt attributes.',
        impact: 'Degrades screen-reader accessibility and prevents ranking in Google Multimodal Search.',
        recommendation: 'Add clear contextual alt text describing the cloud topology diagram.',
        pageUrl,
        pagePath: r.path,
        pageTitle: r.title,
        pageLocation: '<body> > <main> > .media-gallery > img[src="/assets/arch-topology.png"]',
        affectedElement: '<img src="/assets/arch-topology.png" width="800" height="450">',
        whatToDo: '1. Locate the media gallery component inside /features.\n2. Add alt="High-throughput distributed compute topology diagram" to the <img> tag.\n3. Verify in browser devtools or screen reader that alt text is recognized.',
        codeSnippet: '<img src="/assets/arch-topology.png" alt="High-throughput distributed compute topology diagram" width="800" height="450" />',
      });
    }

    if (r.path === '/pricing/calculator') {
      pageIssues.push({
        id: 'iss-content-pricing-calc',
        category: 'content',
        severity: 'warning',
        title: 'Thin Editorial Content (540 words)',
        description: 'Calculator view contains sparse explanatory copy above interactive sliders.',
        impact: 'Search engines may treat utility calculator pages as low editorial quality without descriptive guidance.',
        recommendation: 'Add explanatory FAQ copy and computational formula breakdowns beneath the calculator widget.',
        pageUrl,
        pagePath: r.path,
        pageTitle: r.title,
        pageLocation: '<body> > <main> > section.calculator-explainer',
        affectedElement: '<section class="calculator-explainer">',
        whatToDo: '1. Open /pricing/calculator template.\n2. Add a 300-word section detailing how compute costs are calculated per minute.\n3. Include a short FAQ schema explaining committed use discounts.',
        codeSnippet: '<h2>How Compute Pricing is Calculated</h2>\n<p>Compute clusters are billed per millisecond with zero minimum commitment...</p>',
      });
    }

    if (r.path === '/') {
      pageIssues.push({
        id: 'iss-alt-home',
        category: 'performance',
        severity: 'warning',
        title: 'Decorative SVG Missing Aria-Hidden',
        description: 'Two secondary chevron icons in the hero navigation lack aria-hidden attributes.',
        impact: 'Assistive devices may announce empty elements needlessly.',
        recommendation: 'Mark decorative SVGs with aria-hidden="true".',
        pageUrl,
        pagePath: r.path,
        pageTitle: r.title,
        pageLocation: '<header> > nav > svg.icon-chevron',
        affectedElement: '<svg class="icon-chevron" width="16" height="16">',
        whatToDo: '1. Open the Navbar component.\n2. Add aria-hidden="true" to decorative icons that carry no textual meaning.',
        codeSnippet: '<svg class="icon-chevron" aria-hidden="true" width="16" height="16">...</svg>',
      });
    }

    allIssues.push(...pageIssues);

    const isDescMissing = !r.desc;
    const titleLength = r.title.length;
    const descLength = r.desc.length;

    return {
      id: `page_${idx + 1}`,
      url: pageUrl,
      path: r.path,
      statusCode: 200,
      responseTimeMs: Math.round(95 + ((idx * 7) % 110)),
      contentType: 'text/html; charset=UTF-8',
      metaTitle: r.title,
      metaTitleLength: titleLength,
      metaTitleStatus: titleLength > 60 ? 'warning' : 'passed',
      metaDescription: r.desc || null,
      metaDescriptionLength: descLength,
      metaDescriptionStatus: isDescMissing ? 'critical' : descLength < 120 ? 'warning' : 'passed',
      canonicalUrl: pageUrl,
      canonicalStatus: 'passed',
      h1Text: r.h1,
      h1Count: 1,
      h1Status: 'passed',
      headingsCount: { h1: 1, h2: 3 + (idx % 3), h3: 4 + (idx % 4), h4: 1, h5: 0, h6: 0 },
      robotsDirectives: 'index, follow, max-snippet:-1',
      isIndexable: true,
      wordCount: r.words,
      readingTimeMinutes: Math.max(1, Math.round(r.words / 200)),
      internalLinksCount: 18 + (idx % 12),
      externalLinksCount: 2 + (idx % 4),
      imagesCount: 4 + (idx % 6),
      missingAltCount: r.path === '/features' ? 2 : 0,
      schemasDetected: ['WebPage', 'BreadcrumbList', 'Organization'],
      score: r.score,
      errorCount: pageIssues.filter((i) => i.severity === 'critical').length,
      warningCount: pageIssues.filter((i) => i.severity === 'warning').length,
      passedCount: 18,
      issues: pageIssues,
      metaTags: {
        title: r.title,
        titleLength: r.title.length,
        titlePixelWidthEst: Math.round(r.title.length * 9.6),
        titleStatus: 'passed',
        titleMessage: 'Title tag length is well-calibrated.',
        description: r.desc || '',
        descriptionLength: r.desc.length,
        descriptionStatus: isDescMissing ? 'critical' : 'passed',
        descriptionMessage: isDescMissing ? 'Missing meta description tag.' : 'Meta description is present.',
        canonical: pageUrl,
        canonicalStatus: 'passed',
        canonicalMessage: 'Valid canonical link tag declared.',
        robotsMeta: 'index, follow',
        isIndexable: true,
        isFollowable: true,
        viewport: 'width=device-width, initial-scale=1.0',
        charset: 'UTF-8',
        openGraph: { title: r.title, description: r.desc },
        twitterCard: { card: 'summary_large_image' },
      },
      headings: {
        h1Count: 1,
        h2Count: 4,
        h3Count: 6,
        h4Count: 0,
        h5Count: 0,
        h6Count: 0,
        headings: [
          { level: 1, text: r.h1, order: 0 },
          { level: 2, text: 'Architectural Overview', order: 1 },
          { level: 2, text: 'Core Capabilities', order: 2 },
          { level: 3, text: 'Latency & Throughput Verification', order: 3 },
        ],
        status: 'passed',
        message: 'Clean single H1 with sequential subheadings.',
        hierarchyValid: true,
        skippedLevels: [],
      },
      imagesAudit: {
        totalImages: 4 + (idx % 5),
        missingAltCount: r.path === '/features' ? 2 : 0,
        missingAltSamples: r.path === '/features' ? ['/assets/arch-topology.png', '/assets/cluster-view.png'] : [],
        modernFormatCount: 3,
        legacyFormatCount: 1,
        missingDimensionsCount: 0,
        status: r.path === '/features' ? 'warning' : 'passed',
        message: r.path === '/features' ? '2 images lack alt text.' : 'All media assets have valid alt text.',
      },
      contentAudit: {
        wordCount: r.words,
        characterCount: r.words * 6,
        readingTimeMinutes: Math.max(1, Math.round(r.words / 200)),
        fleschScore: 68,
        readabilityGrade: 'Standard',
        textToHtmlRatio: 18.5,
        status: 'passed',
        message: 'Content depth meets enterprise search quality guidelines.',
      },
      structuredData: {
        hasJsonLd: true,
        hasMicrodata: false,
        schemas: [{ type: 'WebPage', context: 'https://schema.org' }],
        detectedTypes: ['WebPage', 'BreadcrumbList'],
        status: 'passed',
        message: 'Schema.org JSON-LD detected.',
      },
    };
  });

  const summary = {
    totalCrawled: pages.length,
    indexableCount: pages.length,
    nonIndexableCount: 0,
    pagesWithErrors: pages.filter((p) => p.errorCount > 0).length,
    avgResponseTimeMs: Math.round(pages.reduce((acc, p) => acc + p.responseTimeMs, 0) / pages.length),
    brokenLinksCount: 0,
    missingMetaTitlesCount: 0,
    missingMetaDescCount: pages.filter((p) => !p.metaDescription).length,
    missingAltCount: pages.reduce((acc, p) => acc + p.missingAltCount, 0),
  };

  return { pages, issues: allIssues, summary };
}

export function createSampleAuditReport(): AuditReport {
  const sampleChecks: AuditCheckItem[] = [
    {
      id: 'check-meta-title',
      category: 'on-page',
      title: 'Meta Title Tag',
      status: 'passed',
      summary: 'Title is within optimal length (54 characters / 518px).',
      whatWeFound: '"Synthetix Cloud - Next-Gen Autonomous AI Infrastructure" (54 chars)',
      whyItMatters: 'Title tags are the primary search headline determining click-through rates and topical relevance.',
      howToFix: 'No changes required. Title is properly branded and focused on target keywords.',
      codeSnippet: '<title>Synthetix Cloud - Next-Gen Autonomous AI Infrastructure</title>',
    },
    {
      id: 'check-meta-description',
      category: 'on-page',
      title: 'Meta Description Tag',
      status: 'passed',
      summary: 'Description is 148 characters with a clear call-to-action.',
      whatWeFound: '"Deploy resilient AI workloads with automated model orchestration, edge caching, and fine-grained LLM crawler governance for enterprise applications."',
      whyItMatters: 'Provides snippet copy in search results, driving organic click-through and CTR.',
      howToFix: 'Keep description updated with your core product features.',
    },
    {
      id: 'check-heading-hierarchy',
      category: 'on-page',
      title: 'Headings Hierarchy (H1-H6)',
      status: 'passed',
      summary: 'Single H1 and sequential subheading descent without skipped levels.',
      whatWeFound: {
        h1Count: 1,
        h1Text: 'Next-Generation Autonomous Cloud Architecture',
        totalHeadings: 14,
        skippedLevelGaps: [],
      },
      whyItMatters: 'Allows search crawlers and screen readers to understand document structure.',
      howToFix: 'Maintain sequential heading tags across all content updates.',
    },
    {
      id: 'check-content-health',
      category: 'on-page',
      title: 'Content Depth & Word Count',
      status: 'passed',
      summary: '1,420 words with 18.2% text-to-HTML ratio and balanced keyword density.',
      whatWeFound: {
        wordCount: 1420,
        textToHtmlRatio: '18.2%',
        topKeywords: [
          { phrase: 'infrastructure', count: 14, densityPercent: 2.1, isStuffed: false },
          { phrase: 'autonomous', count: 11, densityPercent: 1.6, isStuffed: false },
          { phrase: 'orchestration', count: 9, densityPercent: 1.3, isStuffed: false },
        ],
      },
      whyItMatters: 'Substantive body volume protects against low-information penalty algorithms.',
      howToFix: 'Continue providing detailed technical guides and architecture blueprints.',
    },
    {
      id: 'check-canonicalization',
      category: 'indexability',
      title: 'Canonical Tag Integrity',
      status: 'passed',
      summary: 'Self-referencing absolute canonical URL matches page location.',
      whatWeFound: 'href="https://synthetix-cloud.dev"',
      whyItMatters: 'Consolidates ranking signals and prevents duplicate content penalties.',
      howToFix: 'No action needed.',
      codeSnippet: '<link rel="canonical" href="https://synthetix-cloud.dev" />',
    },
    {
      id: 'check-robots-directives',
      category: 'indexability',
      title: 'Robots Directives & Headers',
      status: 'passed',
      summary: 'Index and follow directives aligned across HTML and HTTP headers.',
      whatWeFound: {
        metaRobots: 'index, follow, max-snippet:-1',
        xRobotsTag: '(None specified)',
        conflictsDetected: false,
      },
      whyItMatters: 'Guarantees unobstructed search engine indexing without accidental blocking.',
      howToFix: 'No changes required.',
    },
    {
      id: 'check-ai-crawler-visibility',
      category: 'indexability',
      title: 'AI Bot Crawler Governance',
      status: 'passed',
      summary: 'GPTBot, PerplexityBot, and ClaudeBot allowed for AI search citations.',
      whatWeFound: {
        robotsTxtFound: true,
        disallowedAiBots: ['Google-Extended'],
      },
      whyItMatters: 'Permits AI search engines to synthesize and cite your content in real-time answers.',
      howToFix: 'Governance rules are active; update robots.txt if foundational model policy changes.',
      codeSnippet: 'User-agent: GPTBot\nAllow: /\n\nUser-agent: PerplexityBot\nAllow: /',
    },
    {
      id: 'check-xml-sitemaps',
      category: 'indexability',
      title: 'XML Sitemaps Discovery',
      status: 'passed',
      summary: 'Declared in robots.txt: https://synthetix-cloud.dev/sitemap.xml',
      whatWeFound: ['https://synthetix-cloud.dev/sitemap.xml'],
      whyItMatters: 'Ensures immediate discovery of newly added routes and documentation updates.',
      howToFix: 'Keep sitemap automatically regenerated via CI/CD build pipelines.',
    },
    {
      id: 'check-internal-links',
      category: 'links-media',
      title: 'Internal Links & Anchor Text',
      status: 'warning',
      summary: '36 internal links found, but 1 link uses placeholder "#" anchor.',
      whatWeFound: {
        internalCount: 36,
        brokenLinkRisks: 1,
        emptyAnchorCount: 0,
        genericAnchorCount: 1,
      },
      whyItMatters: 'Internal links distribute PageRank equity; placeholder links waste crawler budget.',
      howToFix: 'Replace href="#" with a valid URL or an accessible <button> element.',
    },
    {
      id: 'check-external-links',
      category: 'links-media',
      title: 'External Outbound Links',
      status: 'passed',
      summary: '6 outbound links with secure target and noopener attributes.',
      whatWeFound: '6 external links to verified GitHub, Cloud Native, and IETF specifications.',
      whyItMatters: 'Citing reputable external research improves topical authority.',
      howToFix: 'Verify all outbound links regularly to ensure destinations remain online.',
    },
    {
      id: 'check-mobile-nav-parity',
      category: 'links-media',
      title: 'Mobile Navigation Parity',
      status: 'passed',
      summary: 'All primary desktop navigation links mirrored in responsive mobile drawer.',
      whatWeFound: { desktopNavFound: true, mobileNavElementsDetected: true },
      whyItMatters: 'Google mobile-first indexing evaluates rankings based strictly on mobile DOM.',
      howToFix: 'Keep desktop and mobile navigation hierarchies synchronized.',
    },
    {
      id: 'check-image-optimization',
      category: 'links-media',
      title: 'Image Alt & Dimension Optimization',
      status: 'warning',
      summary: '2 decorative icons lack alt text; 12 of 14 images use modern WebP format.',
      whatWeFound: {
        totalImages: 14,
        missingAltCount: 2,
        missingDimensionsCount: 0,
        modernFormatCount: 12,
        legacyFormatCount: 2,
      },
      whyItMatters: 'Alt attributes ensure accessibility compliance and image search ranking.',
      howToFix: 'Add descriptive alt text to all informational assets or mark decorative icons as aria-hidden.',
    },
    {
      id: 'check-video-assets',
      category: 'links-media',
      title: 'Video & Embed Accessibility',
      status: 'passed',
      summary: 'All media iframes include accessible title attributes.',
      whatWeFound: { totalIframes: 1, iframesMissingTitle: 0, hasVideoObjectSchema: true },
      whyItMatters: 'Required by WCAG 2.1 so screen reader users can identify embedded players.',
      howToFix: 'No action needed.',
    },
    {
      id: 'check-json-ld-schema',
      category: 'schema',
      title: 'JSON-LD Structured Data Syntax',
      status: 'passed',
      summary: 'Valid Organization, WebSite, and FAQPage schemas detected with 0 syntax errors.',
      whatWeFound: { schemasCount: 3, detectedTypes: ['Organization', 'FAQPage', 'WebSite'], invalidJsonLdCount: 0 },
      whyItMatters: 'Powers rich snippet displays and builds your Knowledge Graph entity profile.',
      howToFix: 'Continue testing schemas with the Schema Markup Validator.',
    },
    {
      id: 'check-ecom-product-schema',
      category: 'schema',
      title: 'E-Commerce Product Schema',
      status: 'passed',
      summary: 'Non-e-commerce page (SaaS platform); no missing merchant fields flagged.',
      whatWeFound: 'No retail product catalog on this landing page.',
      whyItMatters: 'Relevant for e-commerce check compliance.',
      howToFix: 'If launching a self-serve checkout, implement Product schema with Price, Currency, and Availability.',
    },
    {
      id: 'check-breadcrumbs-schema',
      category: 'schema',
      title: 'BreadcrumbList Schema Validation',
      status: 'passed',
      summary: 'Root homepage — no nested breadcrumbs required.',
      whatWeFound: { hasVisualBreadcrumbs: false, hasBreadcrumbListSchema: false },
      whyItMatters: 'Breadcrumbs render clean category hierarchies in Google search snippets.',
      howToFix: 'Implement BreadcrumbList schema on sub-pages and documentation topics.',
    },
    {
      id: 'check-security-https',
      category: 'performance',
      title: 'SSL/TLS Encryption & HSTS',
      status: 'passed',
      summary: 'Valid TLS certificate with Strict-Transport-Security enabled.',
      whatWeFound: { isHttps: true, hasHsts: true, mixedContentCount: 0 },
      whyItMatters: 'Protects user data in transit and satisfies Google secure connection ranking requirements.',
      howToFix: 'Maintain automated SSL renewal and HSTS preload status.',
    },
    {
      id: 'check-accessibility-wcag',
      category: 'performance',
      title: 'WCAG Accessibility (Forms & Buttons)',
      status: 'passed',
      summary: 'Form inputs have associated labels and interactive buttons have aria-labels.',
      whatWeFound: { inputsMissingLabels: 0, buttonsMissingAria: 0, userScalableDisabled: false },
      whyItMatters: 'Ensures equal access for users with assistive devices and satisfies legal accessibility standards.',
      howToFix: 'Continue verifying accessible focus states and color contrast ratios.',
    },
    {
      id: 'check-csr-rendering-risk',
      category: 'performance',
      title: 'Client-Side Rendering (CSR) Risk',
      status: 'passed',
      summary: 'Primary H1 and editorial paragraphs are fully present in initial server HTML.',
      whatWeFound: { rawHasH1: true, renderedHasH1: true, isCsrVulnerable: false },
      whyItMatters: 'Ensures search bots with zero or delayed JavaScript rendering index all critical copy.',
      howToFix: 'No action needed. Server-side rendering (SSR) is operating correctly.',
    },
    {
      id: 'check-core-web-vitals',
      category: 'performance',
      title: 'Core Web Vitals Assessment',
      status: 'passed',
      summary: 'Performance Score: 82/100. LCP: 1.8s (Good), CLS: 0.03 (Good).',
      whatWeFound: { lcpEstimate: '1.8s', clsEstimate: 0.03, inpEstimate: '110ms', score: 82 },
      whyItMatters: 'Core Web Vitals directly affect search ranking and mobile user retention.',
      howToFix: 'Keep images compressed and leverage edge CDN caching.',
    },
  ];

  const { pages: sampleCrawledPages, issues: sampleIssues, summary: sampleSummary } = createSampleCrawledPages();

  return {
    id: 'audit_sample_default',
    url: 'https://synthetix-cloud.dev',
    domain: 'synthetix-cloud.dev',
    timestamp: Date.now() - 3600000 * 2,
    status: 'completed',
    fetchMethod: 'live_html',
    screenshotUrl: generateSampleScreenshot(),
    scores: {
      overall: 89,
      technical: 92,
      performance: 82,
      content: 90,
      aiReadiness: 88,
    },
    statCounts: {
      errors: sampleIssues.filter((i: any) => i.severity === 'critical').length,
      warnings: sampleIssues.filter((i: any) => i.severity === 'warning').length,
      passed: 18 + sampleCrawledPages.length * 12,
      cwvScore: 82,
      cwvRating: 'good',
    },
    crawlSettings: {
      maxPages: 50,
      crawlScope: 'multi',
    },
    crawledPages: sampleCrawledPages,
    totalPagesCrawled: sampleCrawledPages.length,
    crawlSummary: sampleSummary,
    allChecks: sampleChecks,
    metaTags: {
      title: 'Synthetix Cloud - Next-Gen Autonomous AI Infrastructure',
      titleLength: 54,
      titlePixelWidthEst: 518,
      titleStatus: 'passed',
      titleMessage: 'Title tag is optimized and under standard pixel cut-off (518px < 600px).',
      description: 'Deploy resilient AI workloads with automated model orchestration, edge caching, and fine-grained LLM crawler governance for enterprise applications.',
      descriptionLength: 148,
      descriptionStatus: 'passed',
      descriptionMessage: 'Meta description is ideal length (148 characters) with compelling value proposition.',
      canonical: 'https://synthetix-cloud.dev',
      canonicalStatus: 'passed',
      canonicalMessage: 'Canonical URL is self-referential and properly declared.',
      robotsMeta: 'index, follow, max-snippet:-1, max-image-preview:large',
      isIndexable: true,
      isFollowable: true,
      viewport: 'width=device-width, initial-scale=1.0',
      charset: 'UTF-8',
      openGraph: {
        title: 'Synthetix Cloud - AI Infrastructure Engine',
        description: 'Automated model orchestration and edge caching for modern AI workloads.',
        image: 'https://synthetix-cloud.dev/og-social.webp',
        type: 'website',
      },
      twitterCard: {
        card: 'summary_large_image',
      },
    },
    headings: {
      h1Count: 1,
      h2Count: 4,
      h3Count: 8,
      h4Count: 0,
      h5Count: 0,
      h6Count: 0,
      headings: [
        { level: 1, text: 'Next-Generation Autonomous Cloud Architecture', order: 0 },
        { level: 2, text: 'High-Throughput Model Serving at the Edge', order: 1 },
        { level: 2, text: 'Enterprise Crawler Governance & AI Protection', order: 2 },
        { level: 2, text: 'Frequently Asked Questions About Synthetix', order: 3 },
        { level: 3, text: 'How does latency compare to standard regional gateways?', order: 4 },
        { level: 3, text: 'Which AI search bots are supported in the default governance rule?', order: 5 },
      ],
      status: 'passed',
      message: 'Clean heading hierarchy with exactly one primary H1 heading and sequential subheadings.',
      hierarchyValid: true,
      skippedLevels: [],
    },
    structuredData: {
      hasJsonLd: true,
      hasMicrodata: false,
      schemas: [
        {
          type: 'Organization',
          context: 'https://schema.org',
          rawJson: '{\n  "@context": "https://schema.org",\n  "@type": "Organization",\n  "name": "Synthetix Cloud",\n  "url": "https://synthetix-cloud.dev"\n}',
        },
        {
          type: 'FAQPage',
          context: 'https://schema.org',
          rawJson: '{\n  "@context": "https://schema.org",\n  "@type": "FAQPage",\n  "mainEntity": [\n    {\n      "@type": "Question",\n      "name": "What is Synthetix?",\n      "acceptedAnswer": {\n        "@type": "Answer",\n        "text": "An autonomous AI cloud engine."\n      }\n    }\n  ]\n}',
        },
      ],
      detectedTypes: ['Organization', 'FAQPage', 'WebSite'],
      status: 'passed',
      message: 'Detected 3 valid Schema.org entities (Organization, FAQPage, WebSite).',
    },
    performance: {
      lcpEstimate: 1.8,
      lcpRating: 'good',
      inpEstimate: 110,
      inpRating: 'good',
      clsEstimate: 0.03,
      clsRating: 'good',
      score: 82,
    },
    images: {
      totalImages: 14,
      missingAltCount: 2,
      missingAltSamples: ['/assets/icons/chevron-down.svg', '/assets/mesh-background.webp'],
      modernFormatCount: 12,
      legacyFormatCount: 2,
      missingDimensionsCount: 0,
      status: 'warning',
      message: '12 of 14 images use modern WebP/AVIF formats, but 2 images lack descriptive alt text.',
    },
    security: {
      isHttps: true,
      mixedContentCount: 0,
      mixedContentSamples: [],
      hasHsts: true,
      status: 'passed',
      message: 'Valid HTTPS certificate with HSTS enabled and zero insecure mixed content.',
    },
    linking: {
      totalLinks: 42,
      internalCount: 36,
      externalCount: 6,
      brokenLinkRisks: 1,
      emptyAnchorCount: 0,
      genericAnchorCount: 1,
      sampleLinks: [
        { href: '/documentation', text: 'Documentation', isInternal: true, hasNoFollow: false, hasSecureTarget: true },
        { href: '/pricing', text: 'Enterprise Pricing', isInternal: true, hasNoFollow: false, hasSecureTarget: true },
        { href: 'https://github.com/synthetix', text: 'Open Source SDK', isInternal: false, hasNoFollow: false, hasSecureTarget: true },
      ],
      status: 'warning',
      message: 'Strong internal link equity (36 internal links), with 1 placeholder link requiring verification.',
    },
    content: {
      wordCount: 1420,
      characterCount: 9280,
      readingTimeMinutes: 7,
      fleschScore: 68,
      readabilityGrade: 'Standard (8th-9th Grade)',
      textToHtmlRatio: 18.2,
      status: 'passed',
      message: 'Substantial content length (1,420 words) with balanced Flesch reading score (68/100).',
    },
    aiReadiness: {
      overallAiScore: 88,
      robotsTxtPresent: true,
      robotsTxtUrl: 'https://synthetix-cloud.dev/robots.txt',
      botGovernance: [
        { botName: 'GPTBot', userAgent: 'GPTBot', status: 'allowed', details: 'OpenAI search & retrieval permitted for real-time citations', purpose: 'training' },
        { botName: 'ClaudeBot', userAgent: 'ClaudeBot', status: 'allowed', details: 'Anthropic AI crawler permitted', purpose: 'training' },
        { botName: 'PerplexityBot', userAgent: 'PerplexityBot', status: 'allowed', details: 'Perplexity Search real-time indexer active', purpose: 'search' },
        { botName: 'Google-Extended', userAgent: 'Google-Extended', status: 'disallowed', details: 'Disallow: / (Restricts Gemini foundational training while allowing Google Search)', purpose: 'training' },
        { botName: 'Applebot-Extended', userAgent: 'Applebot-Extended', status: 'allowed', details: 'Apple Intelligence indexing allowed', purpose: 'training' },
        { botName: 'Bytespider', userAgent: 'Bytespider', status: 'disallowed', details: 'Blocked high-frequency scraper', purpose: 'training' },
      ],
      isBlockedFromAiTraining: false,
      isBlockedFromAiSearch: false,
      structuredAnswerabilityScore: 88,
      structuredAnswerabilityNotes: 'Content features structured definition paragraphs, comparative benchmark tables, and FAQ schemas that AI Overviews and Perplexity cite directly.',
      hasFaqStructure: true,
      hasTablesOrLists: true,
      hasDirectAnswers: true,
      eeatScore: 85,
      experienceScore: 86,
      expertiseScore: 88,
      authoritativenessScore: 82,
      trustworthinessScore: 84,
      eeatBreakdown: {
        authorSignals: true,
        citationsPresent: true,
        aboutPageFound: true,
        contactTransparency: true,
        editorialStandard: 'Transparent engineering attribution with verified documentation & changelog links.',
      },
      originalityScore: 89,
      humanizationRating: 'High Human Craft',
      aiPatternFlags: ['Proprietary engineering benchmarks present', 'Specific technical case studies and code samples'],
      semanticSummary: 'Synthetix demonstrates top-tier AI Search and Generative Engine Optimization (GEO). The presence of FAQ schema, precise technical terminology, and proactive robots.txt crawler governance ensures high citation rates in AI Overviews and conversational search.',
    },
    keywords: [
      { phrase: 'infrastructure', count: 14, densityPercent: 2.1, isStuffed: false },
      { phrase: 'autonomous', count: 11, densityPercent: 1.6, isStuffed: false },
      { phrase: 'orchestration', count: 9, densityPercent: 1.3, isStuffed: false },
      { phrase: 'latency', count: 8, densityPercent: 1.2, isStuffed: false },
      { phrase: 'workloads', count: 7, densityPercent: 1.1, isStuffed: false },
    ],
    sitemaps: ['https://synthetix-cloud.dev/sitemap.xml'],
    ecomValidation: {
      hasProductSchema: false,
      missingGtin: false,
      missingPrice: false,
      missingAvailability: false,
      missingAggregateRating: false,
      status: 'passed',
    },
    breadcrumbValidation: {
      hasVisualBreadcrumbs: false,
      hasBreadcrumbListSchema: false,
      status: 'passed',
    },
    accessibility: {
      inputsMissingLabels: 0,
      buttonsMissingAria: 0,
      userScalableDisabled: false,
      linksCloserThan8px: false,
      status: 'passed',
    },
    mobileParity: {
      desktopNavCount: 4,
      mobileNavCount: 1,
      parityPassed: true,
      message: 'Mobile navigation parity verified across primary links.',
    },
    csrRendering: {
      rawHasH1: true,
      renderedHasH1: true,
      isCsrVulnerable: false,
      rawHtmlLength: 8500,
      renderedHtmlLength: 8900,
      status: 'passed',
    },
    issues: sampleIssues,
    contentSentiment: {
      overallConsistencyScore: 89,
      rating: 'Harmonious & Unified',
      primaryArchetype: 'The Authoritative Engineering Architect',
      secondaryArchetype: 'The Developer Advocate',
      targetArchetypeGoal: 'Auto-Detect Core Brand Archetype',
      toneSummary: 'Synthetix demonstrates a high-density, authoritative engineering voice with consistent empirical validation across core documentation and architecture pages. Minor tone drift is observed on commercial pricing pages where copy briefly drops consultative warmth.',
      coreVoiceDescriptors: ['Technically Rigorous', 'Authoritative', 'Pragmatic', 'Developer-Centric', 'Decisive'],
      dimensions: [
        {
          dimension: 'Formality & Professionalism',
          score: 82,
          benchmark: 'B2B Tech Benchmark: 75-88',
          verdict: 'Balanced & Respectful',
          description: 'Reflects enterprise engineering reliability without archaic stiffness.',
        },
        {
          dimension: 'Sentiment Polarity',
          score: 74,
          benchmark: 'Optimal: 68-80 (Positive)',
          verdict: 'Constructive & Solution-Oriented',
          description: 'Focuses on architectural empowerment and latency elimination.',
        },
        {
          dimension: 'Reading Density & Complexity',
          score: 68,
          benchmark: 'Developer Target: 60-75',
          verdict: 'High-Competency Accessible',
          description: 'Syntactically clean with precise distributed systems terminology.',
        },
        {
          dimension: 'Assertiveness & Market Authority',
          score: 88,
          benchmark: 'Leader Target: 80-92',
          verdict: 'Decisive Thought Leadership',
          description: 'Employs active voice verbs and substantiated performance metrics.',
        },
        {
          dimension: 'Emotional Warmth & Empathy',
          score: 65,
          benchmark: 'Advisory: 60-75',
          verdict: 'Consultative & Helpful',
          description: 'Reassuring developer onboarding and transparent error telemetry.',
        },
      ],
      outlierCount: 1,
      driftCount: 4,
      harmonizedCount: 45,
      evaluatedPagesCount: 50,
      pageEvaluations: [
        {
          pageId: 'p-home',
          path: '/',
          title: 'Next-Generation Autonomous Cloud | Synthetix Cloud',
          detectedTone: 'High-Vision Authoritative Pitch',
          sentiment: 'inspirational',
          sentimentScore: 88,
          toneConsistencyScore: 98,
          status: 'harmonized',
          formalityLevel: 'professional',
          readingComplexity: 'accessible',
          diagnosticExcerpt: 'Sets the benchmark tone for the entire domain with confident value propositions and clear positioning.',
          recommendedAdjustment: 'Maintain this baseline standard as the editorial reference for all sub-landing pages.',
        },
        {
          pageId: 'p-pricing',
          path: '/pricing',
          title: 'Predictable Cloud Compute Pricing Tiers | Synthetix',
          detectedTone: 'Direct Commercial & Transactional',
          sentiment: 'objective',
          sentimentScore: 68,
          toneConsistencyScore: 78,
          status: 'minor-drift',
          formalityLevel: 'professional',
          readingComplexity: 'accessible',
          diagnosticExcerpt: 'Pricing copy shifts abruptly into sparse feature matrices, omitting the consultative tone present on the homepage.',
          recommendedAdjustment: 'Introduce a consultative advisory paragraph explaining tier ROI to re-anchor brand warmth.',
        },
        {
          pageId: 'p-docs',
          path: '/docs',
          title: 'Developer Quickstart & Architecture Overview | Synthetix Docs',
          detectedTone: 'Rigorous Technical Specification',
          sentiment: 'objective',
          sentimentScore: 62,
          toneConsistencyScore: 92,
          status: 'harmonized',
          formalityLevel: 'formal',
          readingComplexity: 'technical',
          diagnosticExcerpt: 'High-density architectural guidance adhering to developer-first clarity and functional precision.',
          recommendedAdjustment: 'Preserve current cadence; ensure code comments match the conversational clarity.',
        },
        {
          pageId: 'p-pricing-calc',
          path: '/pricing/calculator',
          title: 'Enterprise Bandwidth & Resource Calculator | Synthetix',
          detectedTone: 'Dry Procedural Utility',
          sentiment: 'neutral',
          sentimentScore: 52,
          toneConsistencyScore: 66,
          status: 'outlier',
          formalityLevel: 'formal',
          readingComplexity: 'moderate',
          diagnosticExcerpt: 'Sparse interactive inputs with zero brand context or explanatory commentary create tonal disconnect with main site.',
          recommendedAdjustment: 'Add contextual cost-optimization tips and humanized sizing recommendations alongside form fields.',
        },
        {
          pageId: 'p-blog-scale',
          path: '/blog/scaling-infrastructure',
          title: 'Scaling Autonomous Workloads to 10M Requests | Synthetix Blog',
          detectedTone: 'Thought Leadership & Technical Analysis',
          sentiment: 'inspirational',
          sentimentScore: 84,
          toneConsistencyScore: 94,
          status: 'harmonized',
          formalityLevel: 'conversational',
          readingComplexity: 'moderate',
          diagnosticExcerpt: 'Compelling synergy between deep subject-matter expertise and accessible architectural storytelling.',
          recommendedAdjustment: 'Exemplary execution of the master brand voice.',
        },
      ],
      editorialDirectives: [
        {
          id: 'dir-1',
          title: 'Harmonize Commercial vs. Documentation Vocabulary',
          guideline: 'Ensure terms introduced in marketing copy map 1:1 into technical guides without stylistic jargon clashes.',
          priority: 'high',
          affectedPages: ['/pricing', '/docs'],
          exampleCorrection: {
            current: 'Our magical autonomous engine makes compute latency vanish.',
            suggested: 'Our deterministic routing architecture reduces P99 latency below 15ms.',
          },
        },
        {
          id: 'dir-2',
          title: 'Enrich Interactive Calculators with Consultative Commentary',
          guideline: 'Integrate brief explanatory insights within utilities like pricing calculators so visitors experience consultative advisory rather than bare forms.',
          priority: 'medium',
          affectedPages: ['/pricing/calculator'],
        },
        {
          id: 'dir-3',
          title: 'Humanize Compliance & Privacy Statements with Plain-English Summaries',
          guideline: 'Prepend legal documents and privacy disclosures with a two-sentence plain-English summary to sustain brand transparency.',
          priority: 'low',
          affectedPages: ['/privacy', '/terms'],
        },
      ],
      generatedAt: '2026-03-24T12:00:00Z',
      isAiGenerated: true,
      modelUsed: 'gemini-3.8-flash',
    },
    executiveSummary: `Multi-page crawl of synthetix-cloud.dev completed across 50 pages. Detected ${sampleIssues.filter((i: any) => i.severity === 'critical').length} critical errors and ${sampleIssues.filter((i: any) => i.severity === 'warning').length} warnings, with 50/50 indexable pages and an average response time of 134ms.`,
    quickWins: [
      'Add missing meta description to /features/edge-caching',
      'Add descriptive alt text to the 2 flagged iconography assets on /features',
      'Expand thin editorial copy on /pricing/calculator',
      'Inspect granular per-page error locations in the Crawled Pages directory',
    ],
  };
}
