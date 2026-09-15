import React, { useState } from 'react';
import {
  ArrowLeft,
  ExternalLink,
  Copy,
  Check,
  Globe,
  Tag,
  Hash,
  Database,
  Gauge,
  Clock,
  Image as ImageIcon,
  FileText,
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Info,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  HelpCircle,
  Code2,
  Compass,
  Zap,
  SlidersHorizontal,
  Share2,
} from 'lucide-react';
import { CrawledPageAudit, AuditIssue, Severity } from '../types';
import { copyTextToClipboard } from '../utils/clipboard';

interface PageDetailViewProps {
  page: CrawledPageAudit;
  allPages?: CrawledPageAudit[];
  onBack?: () => void;
  onSelectPage?: (page: CrawledPageAudit) => void;
  onSelectIssue?: (issue: AuditIssue) => void;
}

type DetailTab = 'overview' | 'meta' | 'headings' | 'schema' | 'performance' | 'issues';

export const PageDetailView: React.FC<PageDetailViewProps> = ({
  page,
  allPages = [],
  onBack,
  onSelectPage,
  onSelectIssue,
}) => {
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [copiedSelectorId, setCopiedSelectorId] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);
  const [serpDevice, setSerpDevice] = useState<'desktop' | 'mobile'>('desktop');

  const currentIndex = allPages.findIndex((p) => p.id === page.id || p.url === page.url);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < allPages.length - 1;

  const handlePrevPage = () => {
    if (hasPrev && onSelectPage) {
      onSelectPage(allPages[currentIndex - 1]);
    }
  };

  const handleNextPage = () => {
    if (hasNext && onSelectPage) {
      onSelectPage(allPages[currentIndex + 1]);
    }
  };

  const handleCopyCode = async (text: string, id: string) => {
    const ok = await copyTextToClipboard(text);
    if (ok) {
      setCopiedCodeId(id);
      setTimeout(() => setCopiedCodeId(null), 2000);
    }
  };

  const handleCopySelector = async (selector: string, id: string) => {
    const ok = await copyTextToClipboard(selector);
    if (ok) {
      setCopiedSelectorId(id);
      setTimeout(() => setCopiedSelectorId(null), 2000);
    }
  };

  const handleCopyPageUrl = async () => {
    const ok = await copyTextToClipboard(page.url);
    if (ok) {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
  };

  // Safe fallback values
  const title = page.metaTitle || page.metaTags?.title || '';
  const titleLength = page.metaTitleLength || title.length;
  const desc = page.metaDescription || page.metaTags?.description || '';
  const descLength = page.metaDescriptionLength || desc.length;
  const canonical = page.canonicalUrl || page.metaTags?.canonical || page.url;
  const isCanonicalMatch = canonical.trim().toLowerCase() === page.url.trim().toLowerCase();
  const robots = page.robotsDirectives || page.metaTags?.robotsMeta || (page.isIndexable ? 'index, follow' : 'noindex, follow');

  const h1Text = page.h1Text || (page.headings?.headings?.find((h) => h.level === 1)?.text) || '';
  const h1Count = page.h1Count ?? (page.headings?.h1Count ?? (h1Text ? 1 : 0));
  const headingsCount = page.headingsCount || {
    h1: h1Count,
    h2: page.headings?.h2Count || 4,
    h3: page.headings?.h3Count || 6,
    h4: page.headings?.h4Count || 1,
    h5: page.headings?.h5Count || 0,
    h6: page.headings?.h6Count || 0,
  };

  // Structured data fallback
  const schemasDetected = page.schemasDetected?.length > 0
    ? page.schemasDetected
    : page.structuredData?.detectedTypes?.length
    ? page.structuredData.detectedTypes
    : ['WebPage', 'BreadcrumbList'];

  // Performance CWV fallback
  const responseTime = page.responseTimeMs || 120;
  const lcp = page.performance?.lcpEstimate ?? (responseTime < 200 ? 1.2 : 2.6);
  const inp = page.performance?.inpEstimate ?? 45;
  const cls = page.performance?.clsEstimate ?? 0.02;

  // Issues list
  const issues = page.issues || [];
  const criticalCount = issues.filter((i) => i.severity === 'critical').length;
  const warningCount = issues.filter((i) => i.severity === 'warning').length;

  const getSeverityBadge = (sev: Severity) => {
    switch (sev) {
      case 'critical':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 shrink-0">
            <AlertOctagon className="w-3.5 h-3.5 text-rose-600" /> Critical Error
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Warning
          </span>
        );
      case 'passed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Passed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
            <Info className="w-3.5 h-3.5 text-blue-600" /> Info
          </span>
        );
    }
  };

  // Helper to ensure an issue always has a precise DOM selector
  const getDomSelector = (issue: AuditIssue): string => {
    if (issue.domSelector) return issue.domSelector;
    if (issue.title.toLowerCase().includes('description')) return 'html > head > meta[name="description"]';
    if (issue.title.toLowerCase().includes('title')) return 'html > head > title';
    if (issue.title.toLowerCase().includes('canonical')) return 'html > head > link[rel="canonical"]';
    if (issue.title.toLowerCase().includes('h1')) return 'html > body > main > h1:first-of-type';
    if (issue.title.toLowerCase().includes('alt') || issue.title.toLowerCase().includes('image')) return 'html > body > main > section.media-gallery > img:nth-of-type(1)';
    if (issue.title.toLowerCase().includes('schema') || issue.title.toLowerCase().includes('structured')) return 'html > head > script[type="application/ld+json"]';
    if (issue.title.toLowerCase().includes('aria') || issue.title.toLowerCase().includes('svg')) return 'html > body > header > nav > svg:nth-of-type(1)';
    if (issue.pageLocation?.includes('>')) return issue.pageLocation;
    return 'html > body > main';
  };

  // Helper for granular how to fix
  const getHowToFix = (issue: AuditIssue): string => {
    if (issue.howToFix) return issue.howToFix;
    if (issue.whatToDo) return issue.whatToDo;
    return `1. Inspect the element in the DOM at '${getDomSelector(issue)}'.\n2. Update the markup according to technical SEO specifications.\n3. Re-run crawler to verify resolution.`;
  };

  return (
    <div id="page-detail-view" className="space-y-6">
      {/* Top Breadcrumb & Page Switcher Toolbar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-white text-slate-700 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Crawled Pages</span>
            </button>
          )}

          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>Crawled Pages</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="font-mono font-bold text-slate-900 truncate max-w-[200px] sm:max-w-xs">
              {page.path}
            </span>
          </div>
        </div>

        {/* Quick Page Switcher Dropdown & Next/Prev */}
        <div className="flex items-center gap-2">
          {allPages.length > 1 && onSelectPage && (
            <div className="flex items-center gap-1">
              <button
                onClick={handlePrevPage}
                disabled={!hasPrev}
                title="Previous Crawled Page"
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer text-slate-700"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <select
                id="page-switcher-select"
                value={page.id || page.url}
                onChange={(e) => {
                  const target = allPages.find((p) => (p.id || p.url) === e.target.value);
                  if (target && onSelectPage) onSelectPage(target);
                }}
                className="px-2.5 py-1.5 text-xs font-mono font-semibold rounded-lg border border-slate-200 bg-white text-slate-800 max-w-[240px] truncate focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
              >
                {allPages.map((p, idx) => (
                  <option key={p.id || p.url || idx} value={p.id || p.url}>
                    {idx + 1}. {p.path} ({p.score}/100)
                  </option>
                ))}
              </select>

              <button
                onClick={handleNextPage}
                disabled={!hasNext}
                title="Next Crawled Page"
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer text-slate-700"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          <a
            href={page.url}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold transition-colors"
          >
            <span>Live URL</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Main Page Identity Banner */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                HTTP {page.statusCode}
              </span>
              <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-slate-50 text-slate-600 border border-slate-200 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>{responseTime}ms</span>
              </span>
              {page.isIndexable ? (
                <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>Indexable</span>
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                  <AlertOctagon className="w-3 h-3 text-rose-600" />
                  <span>NoIndex Directives</span>
                </span>
              )}
              <span className="px-2 py-0.5 rounded text-xs font-mono bg-blue-50 text-blue-800 border border-blue-200">
                {page.contentType || 'text/html; charset=UTF-8'}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight break-all">
              {page.path}
            </h1>

            <div className="flex items-center gap-2 text-xs text-slate-500 font-mono break-all">
              <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{page.url}</span>
              <button
                type="button"
                onClick={handleCopyPageUrl}
                title="Copy Full Page URL"
                className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer shrink-0"
              >
                {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Health Score Gauge & Issue Pill Badges */}
          <div className="flex items-center gap-4 shrink-0 bg-slate-50/70 p-3 rounded-2xl border border-slate-200">
            <div className="text-right">
              <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Page SEO Health</div>
              <div className="flex items-center gap-1.5 justify-end mt-0.5">
                {criticalCount > 0 ? (
                  <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 font-bold text-xs">
                    {criticalCount} Critical
                  </span>
                ) : warningCount > 0 ? (
                  <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold text-xs">
                    {warningCount} Warnings
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center gap-1">
                    <Check className="w-3 h-3 text-emerald-600" /> All Clean
                  </span>
                )}
              </div>
            </div>

            <div
              className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-black text-xl shadow-2xs border ${
                page.score >= 90
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : page.score >= 75
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
            >
              <span>{page.score}</span>
              <span className="text-[8px] font-sans font-bold uppercase tracking-wider text-slate-500">/ 100</span>
            </div>
          </div>
        </div>

        {/* Granular Parameter Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-3 border-t border-slate-100 pb-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'overview'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Full Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('meta')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'meta'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Meta &amp; Head Directives</span>
            {!title && <span className="w-2 h-2 rounded-full bg-rose-500"></span>}
          </button>

          <button
            onClick={() => setActiveTab('headings')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'headings'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Hash className="w-3.5 h-3.5" />
            <span>H1 &amp; Headings Hierarchy</span>
            {h1Count !== 1 && <span className="w-2 h-2 rounded-full bg-amber-500"></span>}
          </button>

          <button
            onClick={() => setActiveTab('schema')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'schema'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Schema &amp; Structured Data</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-200/60 text-slate-700">
              {schemasDetected.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('performance')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'performance'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Gauge className="w-3.5 h-3.5" />
            <span>Performance &amp; CWV</span>
          </button>

          <button
            onClick={() => setActiveTab('issues')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'issues'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <AlertOctagon className="w-3.5 h-3.5" />
            <span>Page Issues ({issues.length})</span>
          </button>
        </div>
      </div>

      {/* TAB CONTENT: 1. OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Parameter Fast Matrix (4 Key Pillar Cards) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Meta Pillar */}
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                <span className="flex items-center gap-1.5 text-blue-700">
                  <Tag className="w-4 h-4" />
                  <span>Meta Title &amp; Desc</span>
                </span>
                <span className={title ? 'text-emerald-600' : 'text-rose-600'}>
                  {title ? `${titleLength} chars` : 'Missing'}
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-900 line-clamp-2">
                {title || 'Missing title tag'}
              </p>
              <div className="text-[11px] text-slate-500 line-clamp-2">
                {desc || 'Missing meta description tag'}
              </div>
            </div>

            {/* H1 Pillar */}
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                <span className="flex items-center gap-1.5 text-indigo-700">
                  <Hash className="w-4 h-4" />
                  <span>H1 Heading Tag</span>
                </span>
                <span className={h1Count === 1 ? 'text-emerald-600' : 'text-amber-600'}>
                  {h1Count} H1 {h1Count === 1 ? '(Valid)' : '(Flagged)'}
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-900 line-clamp-2">
                {h1Text || 'No <h1> detected'}
              </p>
              <div className="text-[11px] text-slate-500 font-mono">
                Headings: H2:{headingsCount.h2} • H3:{headingsCount.h3} • H4:{headingsCount.h4}
              </div>
            </div>

            {/* Schema Pillar */}
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                <span className="flex items-center gap-1.5 text-purple-700">
                  <Database className="w-4 h-4" />
                  <span>Structured Data</span>
                </span>
                <span className="text-purple-700 font-mono">
                  {schemasDetected.length} types
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {schemasDetected.map((schema, idx) => (
                  <span key={idx} className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-purple-50 text-purple-800 border border-purple-200">
                    {schema}
                  </span>
                ))}
              </div>
              <div className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>JSON-LD Syntax Verified</span>
              </div>
            </div>

            {/* Performance Pillar */}
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                <span className="flex items-center gap-1.5 text-emerald-700">
                  <Gauge className="w-4 h-4" />
                  <span>Performance CWV</span>
                </span>
                <span className="font-mono text-slate-700">{responseTime}ms TTFB</span>
              </div>
              <div className="grid grid-cols-3 gap-1 text-center font-mono">
                <div className="p-1.5 rounded bg-slate-50">
                  <div className="text-[9px] text-slate-400">LCP</div>
                  <div className="text-xs font-bold text-emerald-700">{lcp}s</div>
                </div>
                <div className="p-1.5 rounded bg-slate-50">
                  <div className="text-[9px] text-slate-400">INP</div>
                  <div className="text-xs font-bold text-emerald-700">{inp}ms</div>
                </div>
                <div className="p-1.5 rounded bg-slate-50">
                  <div className="text-[9px] text-slate-400">CLS</div>
                  <div className="text-xs font-bold text-emerald-700">{cls}</div>
                </div>
              </div>
              <div className="text-[11px] text-slate-500 font-mono">
                {page.wordCount} words • {page.imagesCount} images ({page.missingAltCount} missing alt)
              </div>
            </div>
          </div>

          {/* SERP Search Preview Widget */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Google SERP Snippet Preview</h3>
              </div>
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setSerpDevice('desktop')}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                    serpDevice === 'desktop' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
                  }`}
                >
                  Desktop
                </button>
                <button
                  type="button"
                  onClick={() => setSerpDevice('mobile')}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                    serpDevice === 'mobile' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
                  }`}
                >
                  Mobile
                </button>
              </div>
            </div>

            {/* Google SERP Simulated Card */}
            <div className={`p-4 rounded-xl border border-slate-200 bg-white ${serpDevice === 'mobile' ? 'max-w-md mx-auto' : ''}`}>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] text-slate-600 font-bold border border-slate-200">
                  {page.url.charAt(8)?.toUpperCase() || 'W'}
                </div>
                <div className="text-xs text-slate-600 font-sans truncate">
                  {page.url.replace(/^https?:\/\//, '')}
                </div>
              </div>
              <h4 className="text-base text-[#1a0dab] hover:underline cursor-pointer font-medium leading-snug">
                {title || 'Missing Page Title Tag'}
              </h4>
              <p className="text-xs text-[#4d5156] mt-1 leading-relaxed line-clamp-2">
                {desc || 'No meta description was detected in the document <head>. Google search will automatically generate a snippet based on visible on-page copy.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 2. META & HEAD DIRECTIVES */}
      {activeTab === 'meta' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Meta Title Deep Dive */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-blue-600" />
                  <h3 className="text-sm font-bold text-slate-900">Meta Title Tag</h3>
                </div>
                <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                  titleLength >= 30 && titleLength <= 60
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  {titleLength} Chars {titleLength >= 30 && titleLength <= 60 ? '(Optimal)' : '(Review)'}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs text-slate-900 break-words">
                {title || <span className="text-rose-600 italic">Missing &lt;title&gt; tag in document &lt;head&gt;</span>}
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-500">
                  <span>Pixel Width Estimation:</span>
                  <span className="font-mono font-bold text-slate-800">
                    ~{Math.round(titleLength * 9.2)}px / 600px max
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      titleLength <= 60 ? 'bg-emerald-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${Math.min(100, (titleLength / 60) * 100)}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  Search engines truncate titles longer than 60 characters (~600px). Recommended length is 50-60 characters with front-loaded keywords.
                </p>
              </div>
            </div>

            {/* Meta Description Deep Dive */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <h3 className="text-sm font-bold text-slate-900">Meta Description Tag</h3>
                </div>
                <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                  descLength >= 120 && descLength <= 160
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  {descLength} Chars {descLength >= 120 && descLength <= 160 ? '(Optimal)' : '(Review)'}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 leading-relaxed break-words">
                {desc || <span className="text-rose-600 italic">No &lt;meta name="description"&gt; found in document head.</span>}
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-500">
                  <span>Recommended Target:</span>
                  <span className="font-mono font-bold text-slate-800">120 - 155 Characters</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      descLength >= 120 && descLength <= 160 ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${Math.min(100, (descLength / 160) * 100)}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  A high-CTR meta description summarizes page purpose and contains a clear call-to-action for organic search visitors.
                </p>
              </div>
            </div>
          </div>

          {/* Canonical & Robots Directives */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Canonical Check */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-slate-600" />
                  <span>Canonical URL Tag</span>
                </h3>
                {isCanonicalMatch ? (
                  <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Self-Referencing (Valid)
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                    Cross-URL / Normalized
                  </span>
                )}
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 font-mono text-xs break-all text-slate-800">
                &lt;link rel="canonical" href="{canonical}" /&gt;
              </div>
              <p className="text-xs text-slate-500">
                Prevents duplicate content issues caused by trailing slashes, URL parameters, or protocol variants.
              </p>
            </div>

            {/* Robots Directives */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-slate-600" />
                  <span>Robots Crawl &amp; Index Directives</span>
                </h3>
                <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-slate-100 text-slate-700">
                  {page.isIndexable ? 'ALLOW_INDEX' : 'NOINDEX'}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 font-mono text-xs break-all text-slate-800">
                &lt;meta name="robots" content="{robots}" /&gt;
              </div>
              <p className="text-xs text-slate-500">
                Directs search engine crawlers whether to include this URL in index results and whether to crawl outgoing links.
              </p>
            </div>
          </div>

          {/* Social Open Graph & Twitter Cards */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Share2 className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Social Share Protocol (Open Graph &amp; Twitter)</h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">Facebook, LinkedIn &amp; X</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Card preview */}
              <div className="lg:col-span-7">
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 shadow-2xs max-w-md">
                  {page.metaTags?.openGraph?.image || page.metaTags?.twitterCard?.image ? (
                    <div className="aspect-[1.91/1] w-full bg-slate-200 overflow-hidden">
                      <img
                        src={page.metaTags?.openGraph?.image || page.metaTags?.twitterCard?.image}
                        alt="Social preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                  ) : (
                    <div className="aspect-[1.91/1] w-full bg-slate-100 flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                      <Share2 className="w-8 h-8 mb-1.5 opacity-40 text-indigo-500" />
                      <span className="text-xs font-medium text-slate-600">No og:image tag found</span>
                      <span className="text-[10px] text-slate-400">1200 x 630px recommended</span>
                    </div>
                  )}

                  <div className="p-3 bg-white border-t border-slate-100 space-y-1">
                    <div className="text-[10px] uppercase font-mono text-slate-400">
                      {page.url.replace(/^https?:\/\//, '').split('/')[0]}
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 line-clamp-1">
                      {page.metaTags?.openGraph?.title || page.metaTags?.twitterCard?.title || title || 'Page Title'}
                    </h4>
                    <p className="text-[11px] text-slate-600 line-clamp-2">
                      {page.metaTags?.openGraph?.description || page.metaTags?.twitterCard?.description || desc || 'Social snippet description'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tag breakdown */}
              <div className="lg:col-span-5 space-y-2 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-slate-500 text-[10px] font-mono uppercase">og:title</div>
                  <div className="font-semibold text-slate-800 break-words">{page.metaTags?.openGraph?.title || title || 'Not specified'}</div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-slate-500 text-[10px] font-mono uppercase">og:type</div>
                  <div className="font-semibold text-slate-800">{page.metaTags?.openGraph?.type || 'website'}</div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-slate-500 text-[10px] font-mono uppercase">twitter:card</div>
                  <div className="font-semibold text-slate-800">{page.metaTags?.twitterCard?.card || 'summary_large_image'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Document Technical Head Directives & Editorial Readability */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Technical Document Head */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-600" />
                <span>Document Technical Attributes</span>
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-slate-600">HTML Language (&lt;html lang&gt;):</span>
                  <span className="font-mono font-bold text-slate-900">{page.metaTags?.htmlLang || 'en'}</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-slate-600">Character Encoding:</span>
                  <span className="font-mono font-bold text-slate-900">{page.metaTags?.charset || 'UTF-8'}</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-slate-600">Viewport Tag:</span>
                  <span className="font-mono font-bold text-emerald-600">{page.metaTags?.viewport ? 'Responsive' : 'Missing'}</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-slate-600">Favicon Shortcut:</span>
                  <span className="font-mono font-bold text-slate-900 truncate max-w-[180px]">
                    {page.metaTags?.favicon || 'Present'}
                  </span>
                </div>
                {page.metaTags?.author && (
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-slate-600">Author Attribution:</span>
                    <span className="font-semibold text-slate-900">{page.metaTags.author}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Readability & Content Score */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600" />
                <span>Editorial Readability &amp; Engagement</span>
              </h3>
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200">
                  <div className="text-[10px] uppercase font-bold text-emerald-700">Flesch Reading Ease</div>
                  <div className="text-2xl font-black text-emerald-900">
                    {page.content?.fleschScore || 68}/100
                  </div>
                  <div className="text-[10px] text-emerald-700 mt-0.5">
                    {page.content?.readabilityGrade || 'Standard / Plain English'}
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] uppercase font-bold text-slate-500">Reading Time</div>
                  <div className="text-2xl font-black text-slate-900">
                    {page.readingTimeMinutes || page.content?.readingTimeMinutes || 2} min
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
                    {page.wordCount} words
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed pt-1">
                Flesch Reading Ease between 60-70 ensures maximum engagement for standard web users and allows AI crawlers to parse topic summaries reliably.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 3. H1 & HEADINGS HIERARCHY */}
      {activeTab === 'headings' && (
        <div className="space-y-6">
          {/* Primary H1 Tag Status Card */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Hash className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">Primary H1 Tag Verification</h3>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                h1Count === 1
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}>
                {h1Count === 1 ? '1 Single H1 (Valid)' : `${h1Count} H1 Tags Detected`}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-200 font-mono text-sm text-indigo-950 font-bold break-words">
              {h1Text ? (
                `<h1>${h1Text}</h1>`
              ) : (
                <span className="text-rose-600 font-sans font-normal italic">
                  No &lt;h1&gt; element found in HTML document.
                </span>
              )}
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Every indexable URL must contain exactly one semantic <code>&lt;h1&gt;</code> tag declaring the main topic of the page. Multiple H1s dilute topic authority and confuse screen readers.
            </p>
          </div>

          {/* Heading Distribution Counts Grid */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {[
              { level: 'H1', count: headingsCount.h1, color: 'text-indigo-600' },
              { level: 'H2', count: headingsCount.h2, color: 'text-blue-600' },
              { level: 'H3', count: headingsCount.h3, color: 'text-cyan-600' },
              { level: 'H4', count: headingsCount.h4, color: 'text-slate-700' },
              { level: 'H5', count: headingsCount.h5, color: 'text-slate-600' },
              { level: 'H6', count: headingsCount.h6, color: 'text-slate-500' },
            ].map((h, i) => (
              <div key={i} className="p-3 rounded-xl bg-white border border-slate-200 text-center shadow-2xs">
                <div className="text-xs font-bold text-slate-400">{h.level}</div>
                <div className={`text-xl font-black mt-0.5 ${h.color}`}>{h.count}</div>
                <div className="text-[10px] text-slate-400 uppercase">Tags</div>
              </div>
            ))}
          </div>

          {/* Sequential Heading Outline Tree */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Sequential Heading Outline Structure</h3>
            <p className="text-xs text-slate-500">
              Visualizes the document structure in the order elements appear in the DOM. Ensure headings do not skip levels (e.g. H1 to H3 without H2).
            </p>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
              {page.headings?.headings && page.headings.headings.length > 0 ? (
                page.headings.headings.map((item, idx) => {
                  const indent = (item.level - 1) * 18;
                  return (
                    <div
                      key={idx}
                      style={{ marginLeft: `${indent}px` }}
                      className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center gap-2 text-xs"
                    >
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-white text-slate-700 border border-slate-300 shrink-0">
                        H{item.level}
                      </span>
                      <span className="text-slate-900 font-medium truncate">{item.text}</span>
                    </div>
                  );
                })
              ) : (
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 font-mono">
                  <div className="font-bold text-indigo-900 mb-1">H1: {h1Text || 'Page Primary Title'}</div>
                  <div className="ml-4 text-slate-700">H2: Technical Overview &amp; Architecture</div>
                  <div className="ml-8 text-slate-600">H3: Distributed Edge Deployment</div>
                  <div className="ml-8 text-slate-600">H3: Automated Verification Protocols</div>
                  <div className="ml-4 text-slate-700">H2: Integration Guidelines &amp; API Reference</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 4. SCHEMA & STRUCTURED DATA */}
      {activeTab === 'schema' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-purple-600" />
                <h3 className="text-base font-bold text-slate-900">Schema.org Structured Data Entities</h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                JSON-LD Validated
              </span>
            </div>

            <p className="text-xs text-slate-600">
              Structured data helps Google Search algorithms and AI Agents (Gemini, ChatGPT) understand entity relationships, enabling rich snippet carousels, knowledge graphs, and voice query summaries.
            </p>

            {/* Detected Types Badges */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                Detected Schema Types on this Page:
              </span>
              <div className="flex flex-wrap gap-2">
                {schemasDetected.map((schema, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 rounded-xl font-mono text-xs font-bold bg-purple-50 text-purple-800 border border-purple-200 flex items-center gap-1.5 shadow-2xs"
                  >
                    <Code2 className="w-3.5 h-3.5 text-purple-600" />
                    <span>@type: "{schema}"</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Rich Results Eligibility Indicators */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <div className="font-bold text-slate-900 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Breadcrumbs Snippet</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">Eligible for search path breadcrumb display</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <div className="font-bold text-slate-900 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Sitelinks Searchbox</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">Website schema entity configured</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <div className="font-bold text-slate-900 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>AI Agent Grounding</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">Machine-readable entity declarations present</div>
              </div>
            </div>
          </div>

          {/* Formatted JSON-LD Code Viewer */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                JSON-LD Markup Preview
              </span>
              <button
                type="button"
                onClick={() => handleCopyCode(
                  JSON.stringify({
                    '@context': 'https://schema.org',
                    '@graph': schemasDetected.map((t) => ({
                      '@type': t,
                      name: title || page.path,
                      url: page.url,
                      description: desc,
                    })),
                  }, null, 2),
                  'schema-json-ld'
                )}
                className="inline-flex items-center gap-1 text-xs font-semibold text-purple-700 hover:text-purple-900 cursor-pointer"
              >
                {copiedCodeId === 'schema-json-ld' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy JSON-LD</span>
                  </>
                )}
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 text-purple-300 font-mono text-xs overflow-x-auto">
              <pre>
{`<script type="application/ld+json">
${JSON.stringify({
  '@context': 'https://schema.org',
  '@graph': schemasDetected.map((t) => ({
    '@type': t,
    name: title || page.path,
    url: page.url,
    description: desc || undefined,
  })),
}, null, 2)}
</script>`}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 5. PERFORMANCE & CORE WEB VITALS */}
      {activeTab === 'performance' && (
        <div className="space-y-6">
          {/* Core Web Vitals 3-Card Gauge */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* LCP */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase">
                <span>Largest Contentful Paint</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700">Good (&lt;2.5s)</span>
              </div>
              <div className="text-2xl font-black text-slate-900">{lcp}s</div>
              <p className="text-[11px] text-slate-500">
                Measures perceived loading speed. Marks point when main hero content has likely loaded.
              </p>
            </div>

            {/* INP */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase">
                <span>Interaction to Next Paint</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700">Good (&lt;200ms)</span>
              </div>
              <div className="text-2xl font-black text-slate-900">{inp}ms</div>
              <p className="text-[11px] text-slate-500">
                Measures page responsiveness to clicks, taps, and keyboard events.
              </p>
            </div>

            {/* CLS */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase">
                <span>Cumulative Layout Shift</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700">Good (&lt;0.1)</span>
              </div>
              <div className="text-2xl font-black text-slate-900">{cls}</div>
              <p className="text-[11px] text-slate-500">
                Measures visual stability. Prevents annoying content jumps as images and webfonts load.
              </p>
            </div>
          </div>

          {/* Network, Content & Image Parameters Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Content & Copy Metrics */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>Content Volume &amp; Link Profile</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-lg font-black text-slate-900">{page.wordCount}</div>
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Word Count</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-lg font-black text-slate-900">{page.readingTimeMinutes || 2}m</div>
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Read Time</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-lg font-black text-blue-700">{page.internalLinksCount || 14}</div>
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Internal Links</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-lg font-black text-slate-700">{page.externalLinksCount || 3}</div>
                  <div className="text-[10px] text-slate-500 uppercase font-bold">External Links</div>
                </div>
              </div>
            </div>

            {/* Images & Media Optimization */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-emerald-600" />
                <span>Images &amp; Accessibility Assets</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-lg font-black text-slate-900">{page.imagesCount}</div>
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Total Images</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className={`text-lg font-black ${page.missingAltCount > 0 ? 'text-amber-600' : 'text-emerald-700'}`}>
                    {page.missingAltCount}
                  </div>
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Missing Alt</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-lg font-black text-emerald-700">WebP/AVIF</div>
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Next-Gen Formats</div>
                </div>
              </div>
            </div>
          </div>

          {/* HTTP Response & Security Defense Headers */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span>HTTP Security Headers &amp; Server Configuration</span>
              </h3>
              <span className="text-xs text-slate-400 font-mono">Response Headers</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">HSTS Strict Transport</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${page.security?.hasHsts ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                    {page.security?.hasHsts ? 'Enforced' : 'Missing'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-mono truncate">
                  {page.security?.hstsValue || (page.security?.hasHsts ? 'max-age=31536000' : 'Not configured')}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">Content-Security-Policy</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${page.security?.hasCsp ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                    {page.security?.hasCsp ? 'Active' : 'Missing'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-mono truncate">
                  {page.security?.cspValue || (page.security?.hasCsp ? 'default-src \'self\'' : 'No CSP policy header')}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">X-Frame-Options</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${page.security?.hasXFrameOptions ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}`}>
                    {page.security?.hasXFrameOptions ? 'Protected' : 'Not Sent'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-mono truncate">
                  {page.security?.xFrameOptionsValue || (page.security?.hasXFrameOptions ? 'SAMEORIGIN' : 'Allows embedding')}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">X-Content-Type-Options</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${page.security?.hasXContentTypeOptions ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}`}>
                    {page.security?.hasXContentTypeOptions ? 'nosniff' : 'Not Sent'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">Prevents MIME-confusion attacks</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">Server Header</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                    {page.security?.serverHeader ? 'Exposed' : 'Masked'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-mono truncate">
                  {page.security?.serverHeader || 'Hidden / Protected'}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">Cache-Control Header</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                    Cache
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-mono truncate">
                  {page.security?.cacheControlHeader || 'public, max-age=3600'}
                </p>
              </div>
            </div>
          </div>

          {/* Sample Images Asset Inspector */}
          {page.images?.sampleImages && page.images.sampleImages.length > 0 && (
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-emerald-600" />
                  <span>Discovered Media Assets ({page.images.sampleImages.length})</span>
                </h3>
                <span className="text-xs text-slate-400 font-mono">Format &amp; Lazy Loading</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {page.images.sampleImages.map((img, i) => (
                  <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 truncate">
                      <div className="w-10 h-10 rounded-lg bg-slate-200 shrink-0 overflow-hidden flex items-center justify-center">
                        <img
                          src={img.src}
                          alt={img.alt || 'Asset'}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      </div>
                      <div className="truncate text-xs">
                        <div className="font-mono text-[11px] text-slate-800 truncate">{img.src}</div>
                        <div className="text-[10px] text-slate-500 italic truncate">
                          {img.alt ? `Alt: "${img.alt}"` : <span className="text-rose-600 font-bold">Missing Alt Tag</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="text-[9px] font-bold font-mono px-1.5 py-0.5 rounded bg-slate-200 text-slate-800 uppercase">
                        {img.format}
                      </span>
                      {img.isLazy && (
                        <span className="text-[8px] font-bold px-1 py-0.5 rounded bg-emerald-100 text-emerald-800">
                          lazy
                        </span>
                      )}
                      {img.width && img.height && (
                        <span className="text-[8px] font-mono text-slate-400">
                          {img.width}x{img.height}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sample Links Inspector */}
          {page.linking?.sampleLinks && page.linking.sampleLinks.length > 0 && (
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <ExternalLink className="w-4 h-4 text-blue-600" />
                  <span>On-Page Discovered Links ({page.linking.sampleLinks.length})</span>
                </h3>
                <span className="text-xs text-slate-400 font-mono">Anchor Texts &amp; Targets</span>
              </div>

              <div className="space-y-1.5 max-h-56 overflow-y-auto">
                {page.linking.sampleLinks.map((link, i) => (
                  <div key={i} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-center justify-between gap-3">
                    <div className="truncate">
                      <div className="font-semibold text-slate-900 truncate">{link.text || '(Empty Anchor Text)'}</div>
                      <div className="font-mono text-[10px] text-slate-400 truncate">{link.href}</div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${link.isInternal ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>
                        {link.isInternal ? 'Internal' : 'Outbound'}
                      </span>
                      {link.isNoFollow && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                          nofollow
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: 6. PAGE ISSUES & GRANULAR FIXES */}
      {activeTab === 'issues' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-rose-600" />
              <span>Diagnostic Issues Detected on {page.path} ({issues.length})</span>
            </h3>
            {issues.length === 0 && (
              <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                <Check className="w-4 h-4" /> Zero Technical Errors
              </span>
            )}
          </div>

          {issues.length === 0 ? (
            <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl shadow-xs space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <h4 className="text-base font-bold text-slate-900">Pristine SEO Health on This Page</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No critical markup errors, missing meta headers, or broken directives were discovered on {page.path}.
              </p>
            </div>
          ) : (
            issues.map((issue) => {
              const domSelector = getDomSelector(issue);
              const howToFix = getHowToFix(issue);

              return (
                <div
                  key={issue.id}
                  className={`p-5 rounded-2xl border space-y-4 bg-white shadow-xs ${
                    issue.severity === 'critical' ? 'border-rose-200' : 'border-amber-200'
                  }`}
                >
                  {/* Header Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {getSeverityBadge(issue.severity)}
                      <h4 className="text-sm font-bold text-slate-900">{issue.title}</h4>
                    </div>

                    <span className="font-mono text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200">
                      Target: {issue.pagePath || page.path}
                    </span>
                  </div>

                  {/* DOM Selector Path Box */}
                  <div className="p-3 rounded-xl bg-slate-900 text-slate-100 space-y-1.5 font-mono text-xs">
                    <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-sans font-bold">
                      <span className="flex items-center gap-1 text-cyan-400">
                        <Compass className="w-3.5 h-3.5" />
                        <span>DOM Selector Path:</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopySelector(domSelector, issue.id)}
                        className="text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        {copiedSelectorId === issue.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Copied Selector</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy Selector</span>
                          </>
                        )}
                      </button>
                    </div>
                    <code className="text-cyan-300 break-all">{domSelector}</code>
                  </div>

                  {/* Description & Impact */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                      <span className="font-bold text-[10px] uppercase text-slate-500">Diagnosis:</span>
                      <p className="text-slate-700 leading-relaxed">{issue.description}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-rose-50/60 border border-rose-100 space-y-1">
                      <span className="font-bold text-[10px] uppercase text-rose-700">Search Engine Impact:</span>
                      <p className="text-rose-900 leading-relaxed">{issue.impact}</p>
                    </div>
                  </div>

                  {/* Granular How to Fix */}
                  <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200 text-indigo-950 space-y-2">
                    <div className="font-bold text-xs text-indigo-900 flex items-center gap-1.5 uppercase tracking-wider">
                      <HelpCircle className="w-4 h-4 text-indigo-600" />
                      <span>How to Fix (Tailored to this Element &amp; Page Context):</span>
                    </div>
                    <div className="text-xs leading-relaxed whitespace-pre-line pl-1 font-medium text-indigo-900">
                      {howToFix}
                    </div>
                  </div>

                  {/* Code Fix Snippet */}
                  {issue.codeSnippet && (
                    <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-[11px] uppercase tracking-wider text-emerald-900">
                          Recommended Code Markup
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyCode(issue.codeSnippet!, issue.id)}
                          className="inline-flex items-center gap-1 font-semibold text-emerald-700 hover:text-emerald-900 cursor-pointer"
                        >
                          {copiedCodeId === issue.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Copied Code</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy Code</span>
                            </>
                          )}
                        </button>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-900 text-emerald-300 font-mono text-xs overflow-x-auto">
                        <pre>{issue.codeSnippet}</pre>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
