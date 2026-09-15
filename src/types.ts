export type Severity = 'critical' | 'warning' | 'passed' | 'info';
export type CheckStatus = 'error' | 'warning' | 'passed';

export type Category = 'technical' | 'performance' | 'content' | 'ai_readiness';
export type TabCategory =
  | 'overview'
  | 'on-page'
  | 'indexability'
  | 'links-media'
  | 'schema'
  | 'performance';

export type IssuePriority = 'High' | 'Medium' | 'Low';

export interface AuditIssue {
  id: string;
  category: Category;
  severity: Severity;
  priority?: IssuePriority; // Priority level: High, Medium, Low for triage and workflow management
  impactScore?: number; // 0-100 algorithmic penalty/impact weight
  title: string;
  description: string;
  impact: string;
  recommendation: string;
  codeSnippet?: string;
  affectedElement?: string;
  domSelector?: string; // Specific CSS/DOM selector path e.g. "head > meta[name='description']" or "body > main > section.hero > img"
  pageUrl?: string;
  pagePath?: string;
  pageTitle?: string;
  pageLocation?: string; // Exact part of page (e.g. "<head> Meta Tag", "Hero Banner <img>", "Desktop Nav <header>")
  whatToDo?: string; // Step-by-step fix guide
  howToFix?: string; // Granular fix instructions tailored to specific context
  isCompleted?: boolean; // Interactive Audit Checklist completion flag
  completedAt?: number; // Timestamp when task was marked completed
  completionNotes?: string; // Optional developer or SEO specialist resolution notes
}

export interface AuditCheckItem {
  id: string;
  category: 'on-page' | 'indexability' | 'links-media' | 'schema' | 'performance';
  title: string;
  status: CheckStatus;
  summary: string;
  whatWeFound: string | Record<string, any> | Array<any>;
  whyItMatters: string;
  howToFix: string;
  codeSnippet?: string;
  metadata?: Record<string, any>;
}

export interface MetaTagsAudit {
  title: string | null;
  titleLength: number;
  titlePixelWidthEst: number;
  titleStatus: Severity;
  titleMessage: string;
  description: string | null;
  descriptionLength: number;
  descriptionStatus: Severity;
  descriptionMessage: string;
  canonical: string | null;
  canonicalStatus: Severity;
  canonicalMessage: string;
  robotsMeta: string | null;
  isIndexable: boolean;
  isFollowable: boolean;
  viewport: string | null;
  charset: string | null;
  htmlLang?: string | null;
  themeColor?: string | null;
  author?: string | null;
  keywords?: string | null;
  favicon?: string | null;
  openGraph: {
    title?: string;
    description?: string;
    image?: string;
    type?: string;
    siteName?: string;
    url?: string;
  };
  twitterCard: {
    card?: string;
    title?: string;
    description?: string;
    image?: string;
    site?: string;
    creator?: string;
  };
}

export interface HeadingItem {
  level: number;
  text: string;
  order?: number;
}

export interface SkippedHeading {
  from: number;
  to: number;
  text: string;
}

export interface HeadingAudit {
  h1Count: number;
  h2Count: number;
  h3Count: number;
  h4Count: number;
  h5Count: number;
  h6Count: number;
  headings: HeadingItem[];
  status: Severity;
  message: string;
  hierarchyValid: boolean;
  skippedLevels?: SkippedHeading[];
}

export interface KeywordMetric {
  phrase: string;
  count: number;
  densityPercent: number;
  isStuffed: boolean;
}

export interface SchemaItem {
  type: string;
  context: string;
  rawJson?: string;
}

export interface StructuredDataAudit {
  hasJsonLd: boolean;
  hasMicrodata: boolean;
  schemas: SchemaItem[];
  detectedTypes: string[];
  status: Severity;
  message: string;
}

export interface CoreWebVitalsAudit {
  lcpEstimate: number; // in seconds (e.g. 1.8s)
  lcpRating: 'good' | 'needs-improvement' | 'poor';
  inpEstimate: number; // in ms (e.g. 120ms)
  inpRating: 'good' | 'needs-improvement' | 'poor';
  clsEstimate: number; // e.g. 0.04
  clsRating: 'good' | 'needs-improvement' | 'poor';
  score: number; // 0 - 100
}

export interface ImageOptimizationAudit {
  totalImages: number;
  missingAltCount: number;
  missingAltSamples: string[];
  modernFormatCount: number; // WebP, AVIF
  legacyFormatCount: number; // PNG, JPG, GIF
  missingDimensionsCount?: number;
  massiveImagesCount?: number;
  lazyLoadedCount?: number;
  lazyCount?: number;
  sampleImages?: Array<{
    src: string;
    alt: string;
    format: string;
    hasDimensions?: boolean;
    isLazy: boolean;
    width?: string;
    height?: string;
  }>;
  status: Severity;
  message: string;
}

export interface SecurityAudit {
  isHttps: boolean;
  mixedContentCount: number;
  mixedContentSamples: string[];
  hasHsts: boolean;
  hstsValue?: string | null;
  hasCsp?: boolean;
  cspValue?: string | null;
  contentSecurityPolicy?: string | null;
  hasXFrameOptions?: boolean;
  xFrameOptions?: string | null;
  xFrameOptionsValue?: string | null;
  hasXContentTypeOptions?: boolean;
  xContentTypeOptions?: string | null;
  serverHeader?: string | null;
  cacheControl?: string | null;
  cacheControlHeader?: string | null;
  status: Severity;
  message: string;
}

export interface LinkItem {
  href: string;
  text: string;
  isInternal: boolean;
  hasNoFollow?: boolean;
  isNoFollow?: boolean;
  hasSecureTarget?: boolean;
  isTargetBlank?: boolean;
  isSecureTargetBlank?: boolean;
  statusCode?: number;
  isGenericAnchor?: boolean;
}

export interface LinkingAudit {
  totalLinks: number;
  internalCount: number;
  externalCount: number;
  brokenLinkRisks: number;
  emptyAnchorCount: number;
  genericAnchorCount?: number;
  secureTargetBlankCount?: number;
  noFollowCount?: number;
  sampleLinks: LinkItem[];
  status: Severity;
  message: string;
}

export interface ContentAudit {
  wordCount: number;
  characterCount: number;
  readingTimeMinutes: number;
  fleschScore: number;
  readabilityGrade: string;
  textToHtmlRatio?: number;
  status: Severity;
  message: string;
}

export interface AIBotRule {
  botName: string;
  userAgent: string;
  status: 'allowed' | 'disallowed' | 'partially-blocked' | 'not-specified';
  details: string;
  purpose: 'training' | 'search' | 'retrieval';
}

export interface AIReadinessAudit {
  overallAiScore: number; // 0 - 100
  robotsTxtPresent: boolean;
  robotsTxtUrl: string | null;
  botGovernance: AIBotRule[];
  isBlockedFromAiTraining: boolean;
  isBlockedFromAiSearch: boolean;
  
  // GEO / AEO
  structuredAnswerabilityScore: number; // 0 - 100
  structuredAnswerabilityNotes: string;
  hasFaqStructure: boolean;
  hasTablesOrLists: boolean;
  hasDirectAnswers: boolean;

  // EEAT
  eeatScore: number; // 0 - 100
  experienceScore: number; // 0 - 100
  expertiseScore: number; // 0 - 100
  authoritativenessScore: number; // 0 - 100
  trustworthinessScore: number; // 0 - 100
  eeatBreakdown: {
    authorSignals: boolean;
    citationsPresent: boolean;
    aboutPageFound: boolean;
    contactTransparency: boolean;
    editorialStandard: string;
  };

  // AI Content Footprint
  originalityScore: number; // 0 - 100
  humanizationRating: 'High Human Craft' | 'Balanced Human-AI' | 'High AI Footprint' | 'Repetitive / Low Info Gain';
  aiPatternFlags: string[];
  semanticSummary: string;
}

export interface AuditScores {
  overall: number;
  technical: number;
  performance: number;
  content: number;
  aiReadiness: number;
}

export interface StatCounts {
  errors: number;
  warnings: number;
  passed: number;
  cwvScore: number;
  cwvRating: 'good' | 'needs-improvement' | 'poor';
}

export interface EcomValidation {
  hasProductSchema: boolean;
  missingGtin: boolean;
  missingPrice: boolean;
  missingAvailability: boolean;
  missingAggregateRating: boolean;
  status: CheckStatus;
}

export interface BreadcrumbValidation {
  hasVisualBreadcrumbs: boolean;
  hasBreadcrumbListSchema: boolean;
  status: CheckStatus;
}

export interface AccessibilityAudit {
  inputsMissingLabels: number;
  buttonsMissingAria: number;
  userScalableDisabled: boolean;
  linksCloserThan8px: boolean;
  status: CheckStatus;
}

export interface MobileParityAudit {
  desktopNavCount: number;
  mobileNavCount: number;
  parityPassed: boolean;
  message: string;
}

export interface CSRRenderingAudit {
  rawHasH1: boolean;
  renderedHasH1: boolean;
  isCsrVulnerable: boolean;
  rawHtmlLength: number;
  renderedHtmlLength: number;
  status: CheckStatus;
}

export interface CrawledPageAudit {
  id: string;
  url: string;
  path: string;
  statusCode: number;
  responseTimeMs: number;
  contentType: string;

  // Key On-page Parameters
  metaTitle: string | null;
  metaTitleLength: number;
  metaTitleStatus: Severity;

  metaDescription: string | null;
  metaDescriptionLength: number;
  metaDescriptionStatus: Severity;

  canonicalUrl: string | null;
  canonicalStatus: Severity;

  h1Text: string | null;
  h1Count: number;
  h1Status: Severity;
  headingsCount: { h1: number; h2: number; h3: number; h4: number; h5: number; h6: number };

  robotsDirectives: string | null;
  isIndexable: boolean;

  wordCount: number;
  readingTimeMinutes: number;

  internalLinksCount: number;
  externalLinksCount: number;

  imagesCount: number;
  missingAltCount: number;

  schemasDetected: string[];

  score: number; // 0 - 100 individual health
  errorCount: number;
  warningCount: number;
  passedCount: number;

  // Batch management & review status
  isExcluded?: boolean;
  isFlaggedForReview?: boolean;
  flaggedReason?: string;

  issues: AuditIssue[];

  // Full page snapshot data for deep inspection and page switching
  metaTags?: MetaTagsAudit;
  headings?: HeadingAudit;
  imagesAudit?: ImageOptimizationAudit;
  images?: ImageOptimizationAudit;
  contentAudit?: ContentAudit;
  content?: ContentAudit;
  security?: SecurityAudit;
  linking?: LinkingAudit;
  structuredData?: StructuredDataAudit;
  performance?: CoreWebVitalsAudit;
}

export interface CrawlSettings {
  maxPages: number; // 1, 50, 100, 200, 500, or 1000 (whole website)
  crawlScope: 'single' | 'multi' | 'whole';
}

export interface CrawlSummary {
  totalCrawled: number;
  indexableCount: number;
  nonIndexableCount: number;
  pagesWithErrors: number;
  avgResponseTimeMs: number;
  brokenLinksCount: number;
  missingMetaTitlesCount: number;
  missingMetaDescCount: number;
  missingAltCount: number;
}

export interface AuditReport {
  id: string;
  url: string;
  domain: string;
  timestamp: number;
  status: 'completed' | 'failed';
  fetchMethod: 'live_html' | 'proxy' | 'gemini_synthesized';
  title?: string;
  overallScore?: number;
  aiReadinessScore?: number;
  scores: AuditScores;
  statCounts: StatCounts;
  screenshotUrl: string;

  // Crawl Settings and Multi-Page Crawl Results
  crawlSettings?: CrawlSettings;
  crawledPages?: CrawledPageAudit[];
  totalPagesCrawled?: number;
  crawlSummary?: CrawlSummary;

  // Granular check accordions
  allChecks: AuditCheckItem[];

  // Deep Modules
  metaTags: MetaTagsAudit;
  headings: HeadingAudit;
  structuredData: StructuredDataAudit;
  performance: CoreWebVitalsAudit;
  images: ImageOptimizationAudit;
  security: SecurityAudit;
  linking: LinkingAudit;
  content: ContentAudit;
  aiReadiness: AIReadinessAudit;

  // Specific Deep Technical Validations
  keywords: KeywordMetric[];
  sitemaps: string[];
  ecomValidation: EcomValidation;
  breadcrumbValidation: BreadcrumbValidation;
  accessibility: AccessibilityAudit;
  mobileParity: MobileParityAudit;
  csrRendering: CSRRenderingAudit;

  // Issues, Recommendations & Interactive Audit Checklist
  issues: AuditIssue[];
  completedTasksCount?: number;
  checklistSummary?: {
    total: number;
    completed: number;
    percent: number;
    lastUpdated?: number;
  };
  executiveSummary: string;
  quickWins: string[];
  aiInsights?: AiAuditInsights;
  contentSentiment?: BrandToneConsistencyAudit;
}

export type AiPriority = 'P0 - Critical' | 'P1 - High' | 'P2 - Medium' | 'P3 - Low';
export type AiRecommendationCategory = 'Core Web Vitals' | 'Technical & Crawl' | 'On-Page & Content' | 'AI & AEO' | 'Authority & Schema';

export interface AiInsightRecommendation {
  id: string;
  priority: AiPriority;
  category: AiRecommendationCategory;
  title: string;
  impact: string;
  effort: 'Low' | 'Medium' | 'High';
  timeToImpact: string;
  diagnosis: string;
  recommendation: string;
  actionSteps: string[];
  affectedComponent?: string;
}

export interface AiSearchReadinessInsight {
  verdict: string;
  citationPotential: string;
  actionItem: string;
}

export interface AiAuditInsights {
  domain?: string;
  strategicVerdict: string;
  overallHealthSummary: string;
  estimatedScoreGain: number;
  competitiveEdge: string;
  aiSearchReadiness: AiSearchReadinessInsight;
  recommendations: AiInsightRecommendation[];
  modelUsed: string;
  generatedAt: number;
  isAiGenerated: boolean;
  demandPeakNotice?: string;
}

export type LeadStatus = 'new' | 'audit_ready' | 'contacted' | 'in_discussion' | 'won' | 'passed';

export type PipelineStage = 'prospecting' | 'contacted' | 'audit_sent' | 'qualified' | 'closed_won';

export type OpportunityLevel = 'high' | 'medium' | 'low';

export interface ClientContactDetails {
  phone?: string;
  formattedAddress?: string;
  email?: string;
  contactPageUrl?: string;
  socialLinks?: {
    linkedin?: string;
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
}

export interface ProspectAuditSummary {
  titleTag: string | null;
  metaDescription: string | null;
  hasH1: boolean;
  missingAltImagesCount: number;
  hasSchema: boolean;
  hasSsl: boolean;
  hasRobotsTxt: boolean;
  hasSitemap: boolean;
  isMobileResponsive: boolean;
  responseTimeMs: number;
}

export interface ClientMarketingEvidence {
  hasGoogleAnalytics: boolean;
  hasMetaPixel: boolean;
  hasGoogleAdsTag: boolean;
  detectedCms?: string; // WordPress, Shopify, Squarespace, Wix, Webflow, Custom
}

export interface ClientProspect {
  id: string;
  cname: string; // Company / Business Name
  websiteUrl: string;
  domain: string;
  industry: string;
  location: string;

  // Google Places Metadata
  placeId?: string;
  rating?: number;
  userRatingCount?: number;
  googleMapsUri?: string;
  lat?: number;
  lng?: number;

  // Contact Details
  contact: ClientContactDetails;

  // SEO Health & Client Qualification
  seoHealthScore: number;
  grade: 'A+' | 'A' | 'B' | 'C' | 'D';
  opportunityLevel: OpportunityLevel;
  opportunitySummary: string;

  // AI Readiness & Core Performance Scores
  aiReadinessScore: number; // 0 - 100 (LLM answerability, schema, bot directives)
  performanceScore: number; // 0 - 100 (Mobile speed, LCP, asset optimization)

  // SEO Client Viability & Propensity to Buy
  viabilityScore: number; // 0 - 100: Propensity to be a paying SEO client
  viabilityTier: 'high_ticket' | 'standard_commercial' | 'local_retail';
  clientBudgetEstimate: string; // e.g. "$1,800 - $3,500 / mo"
  customerLifetimeValue: string; // e.g. "$5,000 - $15,000 / client"
  estimatedLostMonthlyLeads: number; // e.g. 15
  estMonthlyRevenueGap: string; // e.g. "$25,000 - $60,000 / mo"
  rankBracket: 'Page 2 Underdog (#11-20)' | 'Page 3-5 (#21-50)' | 'Unranked Local' | 'Page 1 Contender';
  webDiscoverySource: 'Google Search (Live Web)' | 'Yelp & Directory Aggregators' | 'Google Places (Maps)' | 'Direct Site Crawl';
  buyingSignals: string[]; // Specific triggers why this business needs and will pay for SEO
  outrankingCompetitor?: string; // Leading local competitor taking their organic traffic
  marketingEvidence?: ClientMarketingEvidence;
  quickWinFixes: string[]; // 3 quick wins the agency can deliver in week 1
  coldCallScript: string; // 30-sec conversational phone opener for sales
  linkedInPitch?: string;

  // Specific Flaws for Cold Pitch
  topDeficiencies: string[];
  coldPitchHook: string;
  emailPitchDraft: string;

  // Rapid Audit Reference
  auditSummary?: ProspectAuditSummary;

  // Generated Client Audit & Improvement Proposal Report
  clientAuditReport?: ClientAuditReport;
  reportStatus?: 'idle' | 'queued' | 'generating' | 'ready' | 'error';
  lastReportGeneratedAt?: number;
  potentialRoiScore?: number; // Combined Potential ROI score based on AI readiness & technical severity

  // CRM Sync Status
  crmSynced?: boolean;
  crmSyncedAt?: number;
  crmPlatform?: string;
  crmRecordId?: string;

  // Pipeline Status & Outreach Progress
  status: LeadStatus;
  pipelineStage?: PipelineStage; // 'prospecting' | 'contacted' | 'audit_sent' | 'qualified' | 'closed_won'
  outreachNotes?: string;
  lastContactedAt?: number;
  notes?: string;
  contactPersonName?: string;
  contactPersonRole?: string;
  customDraftSubject?: string;
  customDraftBody?: string;
  customDraftTemplate?: string;
  customDraftTone?: string;
  customDraftRecipientEmail?: string;
  customDraftRecipientName?: string;
  customDraftLastSaved?: number;
  linkedAuditId?: string;
  linkedAuditUrl?: string;
  createdAt: number;
  lastUpdated: number;
}

export interface ReportWrongItem {
  id: string;
  category: 'Performance & Speed' | 'Mobile & UX' | 'Technical SEO & Tags' | 'Local Authority & Schema' | 'Content & Indexing';
  severity: 'critical' | 'warning';
  title: string;
  finding: string;
  businessImpact: string; // Plain English impact on customers/revenue
  howToFix: string; // Actionable fix
}

export interface ReportImprovementPhase {
  phase: 'Week 1: Quick Wins' | 'Month 1: Foundation Fixes' | 'Month 2-3: Market Domination';
  title: string;
  estimatedTimeline: string;
  actions: string[];
  expectedOutcome: string;
}

export interface ClientAuditReport {
  id: string;
  prospectId: string;
  cname: string;
  websiteUrl: string;
  domain: string;
  generatedAt: number;
  overallScore: number;
  grade: 'A+' | 'A' | 'B' | 'C' | 'D';
  executiveSummary: string;

  // Key Category Scores (0-100)
  categoryScores: {
    speedMobile: number;
    onPageSeo: number;
    localPresence: number;
    technicalHealth: number;
    aiReadiness?: number;
    performance?: number;
  };

  // AI Readiness & Speed Performance Highlights
  aiReadinessScore?: number;
  performanceScore?: number;

  // What is working well (Strengths)
  strengths: Array<{
    title: string;
    description: string;
    badge: string;
  }>;

  // Things that are wrong (Critical Issues)
  thingsWrong: ReportWrongItem[];

  // Things that can be improved (Prioritized Roadmap)
  improvementRoadmap: ReportImprovementPhase[];

  // Financial & Revenue Impact
  financialAnalysis: {
    estimatedLostCallsMonthly: number;
    estimatedMonthlyRevenueLoss: string;
    potentialAnnualRecovery: string;
    roiSummary: string;
    suggestedRetainer: string;
  };

  // Client Email Summary (Ready to send)
  clientEmailSummary: string;

  // Executive Advisory & Agency Consultation (Non-AI, Senior Agency Format)
  agencyBranding?: ReportBrandingHeader;
  advisoryNote?: {
    title: string;
    content: string;
    auditorName: string;
    auditorTitle: string;
    agencyName: string;
    certifiedStamp?: string;
  };

  // Visual Google Search Appearance Comparison (Current vs High-CTR Optimized)
  serpComparison?: {
    current: {
      title: string;
      url: string;
      snippet: string;
      rating?: number;
      reviewCount?: number;
      hasPhoneExtension?: boolean;
    };
    optimized: {
      title: string;
      url: string;
      snippet: string;
      rating: number;
      reviewCount: number;
      phoneExtension: string;
      sitelinks: string[];
    };
    ctrLiftEstimate: string;
  };

  // Local Competitor Head-to-Head Steal Analysis
  competitorComparison?: {
    competitorName: string;
    competitorScore: number;
    comparisonPoints: Array<{
      parameter: string;
      clientStatus: string;
      competitorStatus: string;
      winner: 'competitor' | 'client' | 'tied';
      impact: string;
    }>;
    takeaway: string;
  };

  // Commercial Retainer & Sprint Proposal Options
  commercialTiers?: Array<{
    name: string;
    tagline: string;
    price: string;
    deliverables: string[];
    timeline: string;
    isRecommended?: boolean;
  }>;
}

export type CrmPlatform = 'hubspot' | 'gohighlevel' | 'salesforce' | 'pipedrive' | 'webhook';

export interface CrmSyncRecord {
  id: string;
  platform: CrmPlatform;
  targetCount: number;
  syncedAt: number;
  leadIds: string[];
  status: 'success' | 'partial' | 'failed';
  log: string[];
}

export type ProspectStrategy =
  | 'autonomous_pipeline'
  | 'ai_grounded'
  | 'interactive_map'
  | 'direct_urls'
  | 'high_ticket_underdogs';

export interface ProspectScanRequest {
  niche: string;
  location: string;
  targetCount: number; // 10, 20, 30, 40, 50, 100, 250, 500, 1000
  apiKey?: string;
  strategy?: ProspectStrategy;
  urls?: string[];
  sources?: Array<'web_search' | 'yelp_directories' | 'google_maps' | 'page2_underdogs'>;
  highTicketOnly?: boolean;
  minViabilityScore?: number;
  requireContact?: boolean;
}

export interface ReportSectionsSelection {
  executiveSummary: boolean;
  scorecards: boolean;
  strengths: boolean;
  criticalDeficiencies: boolean;
  aiReadiness: boolean;
  performanceCoreVitals: boolean;
  financialRevenueGap: boolean;
  roadmap90Day: boolean;
  customAdvisoryNote: boolean;
  nextStepsCta: boolean;
}

export interface ReportBrandingHeader {
  agencyName: string;
  agencyTagline?: string;
  agencyLogoUrl?: string;
  consultantName: string;
  consultantTitle: string;
  consultantEmail: string;
  consultantPhone?: string;
  accentColor: 'blue' | 'indigo' | 'emerald' | 'purple' | 'slate';
  customNoteTitle: string;
  customNoteContent: string;
}

export interface ReportCustomizerConfig {
  sections: ReportSectionsSelection;
  branding: ReportBrandingHeader;
}

export type OutreachAngle =
  | 'value_audit'
  | 'competitor_stealing_traffic'
  | 'ai_search_risk'
  | 'revenue_leak'
  | 'video_breakdown_offer'
  | 'mobile_bounce';

export interface OutreachTemplateConfig {
  angle: OutreachAngle;
  tone: 'consultative' | 'direct' | 'casual';
  length: 'short' | 'standard' | 'in_depth';
  senderName: string;
  senderTitle: string;
  senderAgency: string;
  bookingUrl: string;
  includeSpecificIssue: boolean;
  includeRevenueMath: boolean;
  includeCompetitorName: boolean;
}

export interface BatchQueueItem {
  prospectId: string;
  cname: string;
  domain: string;
  status: 'pending' | 'auditing' | 'completed' | 'error';
  error?: string;
  report?: ClientAuditReport;
  startedAt?: number;
  completedAt?: number;
}

export type BrandedPdfTheme = 'executive_navy' | 'tech_minimal' | 'growth_emerald' | 'sunset_crimson';

export interface BrandedAuditPdfSections {
  coverPage: boolean;
  executiveSummary: boolean;
  scorecardsAndMath: boolean;
  categoryPillars: boolean;
  aiInsightsRoadmap: boolean;
  coreWebVitals: boolean;
  crawlArchitecture: boolean;
  aiBotGovernance: boolean;
  prioritizedIssues: boolean;
  crawledPagesSample: boolean;
  advisoryMemorandum: boolean;
  nextStepsCta: boolean;
}

export interface BrandedAuditPdfConfig {
  agencyName: string;
  agencyTagline: string;
  agencyLogoUrl?: string;
  consultantName: string;
  consultantTitle: string;
  consultantEmail: string;
  consultantPhone?: string;
  agencyWebsite?: string;
  clientName: string;
  documentTitle: string;
  documentRefNumber: string;
  theme: BrandedPdfTheme;
  accentColor: 'indigo' | 'blue' | 'emerald' | 'purple' | 'rose' | 'amber' | 'slate';
  watermark: 'none' | 'confidential' | 'draft' | 'proprietary';
  coverPageStyle: 'full_cover' | 'compact_header';
  customMemorandumTitle: string;
  customMemorandumText: string;
  sections: BrandedAuditPdfSections;
}

// AI Content Sentiment & Brand Tone Consistency Types
export type ToneSentimentPolarity = 'positive' | 'neutral' | 'inspirational' | 'urgent' | 'objective' | 'critical';
export type ToneFormalityLevel = 'informal' | 'conversational' | 'professional' | 'formal';
export type ToneReadingComplexity = 'accessible' | 'moderate' | 'technical' | 'academic';
export type TonePageStatus = 'harmonized' | 'minor-drift' | 'outlier';

export interface PageToneEvaluation {
  pageId: string;
  path: string;
  title: string;
  detectedTone: string; // e.g. "Authoritative & Technical", "Casual Conversational", "High-Urgency Sales"
  sentiment: ToneSentimentPolarity;
  sentimentScore: number; // 0 - 100 (higher = more positive/inspiring, 50 = neutral)
  toneConsistencyScore: number; // 0 - 100 (alignment with primary brand voice)
  status: TonePageStatus;
  formalityLevel: ToneFormalityLevel;
  readingComplexity: ToneReadingComplexity;
  diagnosticExcerpt: string; // concise explanation of alignment or drift
  recommendedAdjustment?: string;
}

export interface BrandToneDimension {
  dimension: string; // Formality, Sentiment Polarity, Complexity, Assertiveness, Warmth
  score: number; // 0 - 100
  benchmark: string; // e.g. "Optimal B2B: 70-85"
  verdict: string; // short summary, e.g. "Balanced & Professional"
  description: string;
}

export interface ToneEditorialDirective {
  id: string;
  title: string;
  guideline: string;
  priority: 'high' | 'medium' | 'low';
  affectedPages?: string[];
  exampleCorrection?: {
    current: string;
    suggested: string;
  };
}

export interface BrandToneConsistencyAudit {
  overallConsistencyScore: number; // 0 - 100
  rating: 'Harmonious & Unified' | 'Moderate Cohesion' | 'Notable Variance' | 'Fragmented Voice';
  primaryArchetype: string; // e.g. "The Expert & Industry Architect"
  secondaryArchetype?: string;
  targetArchetypeGoal?: string;
  toneSummary: string;
  coreVoiceDescriptors: string[]; // e.g. ["Empathetic", "Data-Grounded", "Authoritative"]
  dimensions: BrandToneDimension[];
  outlierCount: number;
  driftCount: number;
  harmonizedCount: number;
  pageEvaluations: PageToneEvaluation[];
  editorialDirectives: ToneEditorialDirective[];
  evaluatedPagesCount: number;
  generatedAt: string;
  isAiGenerated: boolean;
  modelUsed?: string;
}
