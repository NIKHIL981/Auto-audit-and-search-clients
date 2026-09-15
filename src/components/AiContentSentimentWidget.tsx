import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  Brain,
  Smile,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Search,
  Copy,
  Check,
  RefreshCw,
  Layers,
  FileText,
  Lightbulb,
  Compass,
  ArrowRight,
  ExternalLink,
  Info,
} from 'lucide-react';
import {
  AuditReport,
  BrandToneConsistencyAudit,
  PageToneEvaluation,
  ToneSentimentPolarity,
} from '../types';
import { copyTextToClipboard } from '../utils/clipboard';

interface AiContentSentimentWidgetProps {
  report: AuditReport;
  onUpdateReportSentiment?: (sentiment: BrandToneConsistencyAudit) => void;
}

const ARCHETYPE_OPTIONS = [
  { id: 'auto', label: 'Auto-Detect Core Brand Archetype' },
  { id: 'The Authoritative Innovator', label: 'The Authoritative Innovator (High Technical Rigor & Pragmatism)' },
  { id: 'The Consultative Enterprise Advisor', label: 'The Consultative Advisor (Decisive Leadership & Empathy)' },
  { id: 'The Accessible Product Educator', label: 'The Accessible Educator (High Clarity & Engaging Walkthroughs)' },
  { id: 'The Customer-Centric Solution Partner', label: 'The Solution Partner (Empathetic & Value-Focused)' },
  { id: 'The Modern Minimalist SaaS', label: 'The Modern SaaS (Punchy, Direct & Transparent)' },
];

export const AiContentSentimentWidget: React.FC<AiContentSentimentWidgetProps> = ({
  report,
  onUpdateReportSentiment,
}) => {
  const [sentimentData, setSentimentData] = useState<BrandToneConsistencyAudit | null>(
    report.contentSentiment || null
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<string>('auto');
  const [statusFilter, setStatusFilter] = useState<'all' | 'outlier' | 'minor-drift' | 'harmonized'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedPageId, setExpandedPageId] = useState<string | null>(null);
  const [copiedBrief, setCopiedBrief] = useState<boolean>(false);

  // Sync with report if updated externally
  useEffect(() => {
    if (report.contentSentiment && report.contentSentiment !== sentimentData) {
      setSentimentData(report.contentSentiment);
    }
  }, [report.contentSentiment]);

  // Handle running or refreshing the AI evaluation
  const handleRunEvaluation = async (archetypeGoal: string = selectedGoal) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/audit/content-sentiment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          report,
          targetArchetypeGoal: archetypeGoal,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.sentiment) {
        setSentimentData(data.sentiment);
        if (onUpdateReportSentiment) {
          onUpdateReportSentiment(data.sentiment);
        }
      } else {
        throw new Error('Incomplete sentiment data returned from server.');
      }
    } catch (err: any) {
      console.error('Failed to run AI Content Sentiment evaluation:', err);
      setError(err?.message || 'Unable to complete AI evaluation. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter page evaluations based on search query and status pill
  const filteredPages = useMemo(() => {
    if (!sentimentData?.pageEvaluations) return [];
    return sentimentData.pageEvaluations.filter((p) => {
      if (statusFilter !== 'all' && p.status !== statusFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesPath = p.path.toLowerCase().includes(query);
        const matchesTitle = p.title.toLowerCase().includes(query);
        const matchesTone = p.detectedTone.toLowerCase().includes(query);
        const matchesExcerpt = p.diagnosticExcerpt.toLowerCase().includes(query);
        if (!matchesPath && !matchesTitle && !matchesTone && !matchesExcerpt) {
          return false;
        }
      }
      return true;
    });
  }, [sentimentData, statusFilter, searchQuery]);

  const handleCopyDossier = async () => {
    if (!sentimentData) return;
    const text = `# AI Brand Tone & Content Sentiment Evaluation
Domain: ${report.domain}
Overall Tone Consistency: ${sentimentData.overallConsistencyScore}% (${sentimentData.rating})
Primary Brand Archetype: ${sentimentData.primaryArchetype}
Core Voice Attributes: ${sentimentData.coreVoiceDescriptors.join(', ')}

## Executive Summary
${sentimentData.toneSummary}

## Dimension Vectors
${sentimentData.dimensions.map((d) => `- ${d.dimension}: ${d.score}/100 (${d.verdict}) - ${d.description}`).join('\n')}

## Page Breakdown (${sentimentData.pageEvaluations.length} evaluated)
- Harmonized Pages: ${sentimentData.harmonizedCount}
- Minor Tone Drift: ${sentimentData.driftCount}
- Tone Outliers: ${sentimentData.outlierCount}

## Actionable Editorial Directives
${sentimentData.editorialDirectives.map((d, i) => `${i + 1}. [${d.priority.toUpperCase()}] ${d.title}\n   ${d.guideline}`).join('\n\n')}

Generated via AuditPulse AI Content Sentiment Engine (Gemini)`;

    const success = await copyTextToClipboard(text);
    if (success) {
      setCopiedBrief(true);
      setTimeout(() => setCopiedBrief(false), 2000);
    }
  };

  // Helper for sentiment badge color
  const getSentimentBadge = (sentiment: ToneSentimentPolarity) => {
    switch (sentiment) {
      case 'inspirational':
      case 'positive':
        return {
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          label: sentiment === 'inspirational' ? 'Inspirational / High-Vision' : 'Positive & Empowering',
        };
      case 'objective':
        return {
          bg: 'bg-blue-50 text-blue-700 border-blue-200',
          label: 'Objective / Fact-Driven',
        };
      case 'neutral':
        return {
          bg: 'bg-slate-100 text-slate-700 border-slate-200',
          label: 'Neutral & Informational',
        };
      case 'urgent':
        return {
          bg: 'bg-amber-50 text-amber-800 border-amber-200',
          label: 'Urgent / Action-Prompting',
        };
      case 'critical':
        return {
          bg: 'bg-rose-50 text-rose-700 border-rose-200',
          label: 'Critical / Problem-Centric',
        };
      default:
        return {
          bg: 'bg-slate-100 text-slate-700 border-slate-200',
          label: sentiment,
        };
    }
  };

  return (
    <div id="ai-content-sentiment-widget" className="rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden">
      {/* Top Banner & Control Bar */}
      <div className="p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-indigo-500/30 to-purple-500/30 border border-indigo-400/40 text-[11px] font-extrabold text-indigo-200 uppercase tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Gemini 3.8 Flash Tone Intelligence</span>
            </span>
            <span className="text-xs text-slate-400 font-medium">
              E-E-A-T &amp; Brand Consistency Evaluator
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Brain className="w-5 h-5 text-indigo-400 shrink-0" />
            <span>AI Content Sentiment &amp; Brand Tone Consistency</span>
          </h3>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Evaluates voice cohesion, emotional polarity, and stylistic dissonance across crawled pages. Inconsistent tone across technical, commercial, and editorial pages confuses visitors and dilutes Google search authority.
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <div className="flex items-center gap-2">
            <label htmlFor="tone-archetype-goal" className="sr-only">Target Archetype</label>
            <select
              id="tone-archetype-goal"
              value={selectedGoal}
              onChange={(e) => {
                const newGoal = e.target.value;
                setSelectedGoal(newGoal);
                if (sentimentData) {
                  handleRunEvaluation(newGoal);
                }
              }}
              disabled={isLoading}
              className="px-3 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer disabled:opacity-50"
            >
              {ARCHETYPE_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            id="run-tone-evaluation-button"
            onClick={() => handleRunEvaluation(selectedGoal)}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 via-blue-600 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white text-xs font-extrabold flex items-center gap-2 transition-all shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-indigo-200 group-hover:rotate-180 transition-transform ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Evaluating with Gemini...' : sentimentData ? 'Re-evaluate Tone' : 'Evaluate Brand Tone'}</span>
          </button>

          {sentimentData && (
            <button
              type="button"
              id="copy-tone-brief-button"
              onClick={handleCopyDossier}
              className="px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Copy executive brand tone evaluation briefing to clipboard"
            >
              {copiedBrief ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-300">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span className="hidden sm:inline">Copy Brief</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="p-10 text-center space-y-4 bg-slate-50 border-b border-slate-200 animate-pulse">
          <div className="w-12 h-12 rounded-2xl bg-indigo-100 border border-indigo-200 flex items-center justify-center mx-auto text-indigo-600">
            <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-slate-900">
              Gemini is Analyzing Brand Tone Consistency Across Crawled Pages...
            </h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Extracting vocabulary patterns, sentiment polarity, and reading complexity across {report.crawledPages?.length || 1} crawled HTML documents.
            </p>
          </div>
          <div className="flex justify-center items-center gap-4 text-[11px] font-semibold text-slate-400">
            <span className="flex items-center gap-1 text-indigo-600">
              <CheckCircle2 className="w-3.5 h-3.5" /> Tone Vector Extraction
            </span>
            <span className="flex items-center gap-1 text-indigo-600">
              <CheckCircle2 className="w-3.5 h-3.5" /> Sentiment Polarity
            </span>
            <span className="flex items-center gap-1 text-indigo-600">
              <CheckCircle2 className="w-3.5 h-3.5" /> Dissonance Detection
            </span>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && !isLoading && (
        <div className="p-4 bg-rose-50 border-b border-rose-200 text-rose-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => handleRunEvaluation(selectedGoal)}
            className="px-2.5 py-1 rounded-lg bg-rose-600 text-white font-bold hover:bg-rose-700 cursor-pointer transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty State when not yet evaluated */}
      {!sentimentData && !isLoading && (
        <div className="p-8 sm:p-12 text-center bg-slate-50/50 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto text-indigo-600 shadow-2xs">
            <Compass className="w-7 h-7" />
          </div>
          <div className="space-y-1.5 max-w-lg mx-auto">
            <h4 className="text-base font-bold text-slate-900">
              Evaluate Brand Voice &amp; Tone Across {report.crawledPages?.length || 1} Crawled Pages
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Google&apos;s Search Quality Raters and modern search AI penalize websites with conflicting voices or sudden shifts from trustworthy technical authority into aggressive sales pitch language. Run our Gemini-powered tone audit to detect outliers and unify your editorial footprint.
            </p>
          </div>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => handleRunEvaluation(selectedGoal)}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold inline-flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Run Brand Tone Evaluation with Gemini</span>
            </button>
          </div>
        </div>
      )}

      {/* Evaluated Dashboard View */}
      {sentimentData && !isLoading && (
        <div className="p-5 sm:p-6 space-y-6">
          {/* Executive Score & Persona Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            {/* Overall Consistency Meter */}
            <div className="lg:col-span-4 p-5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Consistency Score
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                      sentimentData.overallConsistencyScore >= 85
                        ? 'bg-emerald-100 text-emerald-800'
                        : sentimentData.overallConsistencyScore >= 75
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {sentimentData.rating}
                  </span>
                </div>

                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
                    {sentimentData.overallConsistencyScore}%
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    across {sentimentData.evaluatedPagesCount} pages
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-200 rounded-full h-2 mt-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      sentimentData.overallConsistencyScore >= 85
                        ? 'bg-emerald-500'
                        : sentimentData.overallConsistencyScore >= 75
                        ? 'bg-indigo-600'
                        : 'bg-amber-500'
                    }`}
                    style={{ width: `${sentimentData.overallConsistencyScore}%` }}
                  />
                </div>
              </div>

              {/* Tonal Page Count Triad */}
              <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-200/80 text-center">
                <div className="p-2 rounded-xl bg-white border border-slate-200">
                  <div className="text-[10px] font-medium text-slate-500">Harmonized</div>
                  <div className="text-base font-extrabold text-emerald-600 mt-0.5">
                    {sentimentData.harmonizedCount}
                  </div>
                </div>
                <div className="p-2 rounded-xl bg-white border border-slate-200">
                  <div className="text-[10px] font-medium text-slate-500">Minor Drift</div>
                  <div className="text-base font-extrabold text-amber-600 mt-0.5">
                    {sentimentData.driftCount}
                  </div>
                </div>
                <div className="p-2 rounded-xl bg-white border border-slate-200">
                  <div className="text-[10px] font-medium text-slate-500">Outliers</div>
                  <div className="text-base font-extrabold text-rose-600 mt-0.5">
                    {sentimentData.outlierCount}
                  </div>
                </div>
              </div>
            </div>

            {/* Brand Archetype & Summary */}
            <div className="lg:col-span-8 p-5 rounded-2xl bg-white border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-extrabold uppercase tracking-wide">
                      Detected Persona
                    </span>
                    <h4 className="text-base sm:text-lg font-extrabold text-slate-900">
                      {sentimentData.primaryArchetype}
                    </h4>
                  </div>
                  {sentimentData.modelUsed && (
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-mono font-medium">
                      Engine: {sentimentData.modelUsed}
                    </span>
                  )}
                </div>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mt-2">
                  {sentimentData.toneSummary}
                </p>

                {/* Core Voice Descriptors */}
                <div className="flex flex-wrap items-center gap-1.5 mt-3">
                  <span className="text-[11px] font-bold text-slate-500 mr-1">Core Voice DNA:</span>
                  {sentimentData.coreVoiceDescriptors.map((desc) => (
                    <span
                      key={desc}
                      className="px-2 py-0.5 rounded-lg bg-indigo-50/70 border border-indigo-100 text-indigo-900 text-xs font-semibold"
                    >
                      {desc}
                    </span>
                  ))}
                </div>
              </div>

              {sentimentData.secondaryArchetype && (
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500">
                  <Info className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span>
                    Secondary tone nuance: <strong className="text-slate-800">{sentimentData.secondaryArchetype}</strong>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* 5 Tone Dimension Vectors */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                <h4 className="text-sm font-bold text-slate-900">
                  Cross-Domain Tone Dimension Vectors
                </h4>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">
                Normalized 0-100 Scaled Tone Analysis
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3.5">
              {sentimentData.dimensions.map((dim) => (
                <div
                  key={dim.dimension}
                  className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                      <span className="truncate" title={dim.dimension}>{dim.dimension}</span>
                      <span className="font-mono text-indigo-700">{dim.score}%</span>
                    </div>

                    <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2 mb-2 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-indigo-600 transition-all duration-300"
                        style={{ width: `${dim.score}%` }}
                      />
                    </div>

                    <div className="text-[10px] font-bold text-slate-700">
                      {dim.verdict}
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-500 mt-2 pt-2 border-t border-slate-200/60 leading-tight">
                    {dim.description}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Page-by-Page Brand Tone Consistency Explorer */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>Page-by-Page Brand Tone Consistency Audit</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Click any page row to inspect detailed diagnostic excerpts and recommended editorial alignment adjustments.
                </p>
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0 self-start sm:self-auto text-xs">
                <button
                  type="button"
                  onClick={() => setStatusFilter('all')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                    statusFilter === 'all'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All ({sentimentData.pageEvaluations.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('outlier')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                    statusFilter === 'outlier'
                      ? 'bg-rose-500 text-white shadow-2xs'
                      : 'text-rose-700 hover:bg-rose-100'
                  }`}
                >
                  Outliers ({sentimentData.outlierCount})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('minor-drift')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                    statusFilter === 'minor-drift'
                      ? 'bg-amber-500 text-white shadow-2xs'
                      : 'text-amber-700 hover:bg-amber-100'
                  }`}
                >
                  Drift ({sentimentData.driftCount})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('harmonized')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                    statusFilter === 'harmonized'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'text-emerald-700 hover:bg-emerald-100'
                  }`}
                >
                  Harmonized ({sentimentData.harmonizedCount})
                </button>
              </div>
            </div>

            {/* Search filter bar */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search crawled pages by path, title, or detected tone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <th className="py-2.5 px-3">Page &amp; Path</th>
                    <th className="py-2.5 px-3">Detected Tone Tag</th>
                    <th className="py-2.5 px-3">Sentiment Polarity</th>
                    <th className="py-2.5 px-3">Complexity &amp; Style</th>
                    <th className="py-2.5 px-3">Tone Alignment</th>
                    <th className="py-2.5 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPages.map((page) => {
                    const isExpanded = expandedPageId === page.pageId;
                    const sentimentBadge = getSentimentBadge(page.sentiment);

                    return (
                      <React.Fragment key={page.pageId}>
                        <tr
                          onClick={() => setExpandedPageId(isExpanded ? null : page.pageId)}
                          className={`hover:bg-indigo-50/40 transition-colors cursor-pointer ${
                            isExpanded ? 'bg-indigo-50/30' : ''
                          }`}
                        >
                          <td className="py-3 px-3 font-medium text-slate-900 max-w-[240px]">
                            <div className="flex items-center gap-1.5">
                              {isExpanded ? (
                                <ChevronUp className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              )}
                              <div className="truncate">
                                <div className="font-mono text-xs text-indigo-950 font-bold truncate">
                                  {page.path}
                                </div>
                                <div className="text-[11px] text-slate-500 truncate">
                                  {page.title}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-medium text-[11px] border border-slate-200 inline-block">
                              {page.detectedTone}
                            </span>
                          </td>

                          <td className="py-3 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold border inline-block ${sentimentBadge.bg}`}
                            >
                              {sentimentBadge.label}
                            </span>
                          </td>

                          <td className="py-3 px-3">
                            <div className="flex items-center gap-1 flex-wrap">
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 capitalize">
                                {page.formalityLevel}
                              </span>
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 capitalize">
                                {page.readingComplexity}
                              </span>
                            </div>
                          </td>

                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 w-8 text-right">
                                {page.toneConsistencyScore}%
                              </span>
                              <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    page.status === 'harmonized'
                                      ? 'bg-emerald-500'
                                      : page.status === 'minor-drift'
                                      ? 'bg-amber-500'
                                      : 'bg-rose-500'
                                  }`}
                                  style={{ width: `${page.toneConsistencyScore}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-3 text-right">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                page.status === 'harmonized'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : page.status === 'minor-drift'
                                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}
                            >
                              {page.status === 'harmonized' && <CheckCircle2 className="w-3 h-3" />}
                              {page.status === 'minor-drift' && <AlertTriangle className="w-3 h-3" />}
                              {page.status === 'outlier' && <AlertOctagon className="w-3 h-3" />}
                              <span>{page.status === 'minor-drift' ? 'Drift' : page.status}</span>
                            </span>
                          </td>
                        </tr>

                        {/* Expanded Diagnostic Row */}
                        {isExpanded && (
                          <tr className="bg-indigo-50/30">
                            <td colSpan={6} className="p-4 border-t border-indigo-100">
                              <div className="space-y-2.5 max-w-4xl bg-white p-4 rounded-xl border border-indigo-100 shadow-2xs">
                                <div>
                                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                    Diagnostic Assessment:
                                  </span>
                                  <p className="text-xs text-slate-700 mt-0.5 leading-relaxed">
                                    {page.diagnosticExcerpt}
                                  </p>
                                </div>

                                {page.recommendedAdjustment && (
                                  <div className="pt-2 border-t border-slate-100 flex items-start gap-2">
                                    <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                    <div>
                                      <span className="text-[11px] font-bold text-slate-900">
                                        Recommended Editorial Adjustment:
                                      </span>
                                      <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                                        {page.recommendedAdjustment}
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}

                  {filteredPages.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                        No pages matched your status filter or search query.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Actionable Editorial Directives */}
          {sentimentData.editorialDirectives && sentimentData.editorialDirectives.length > 0 && (
            <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-indigo-50/30 border border-slate-200 space-y-3.5">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-indigo-600" />
                <h4 className="text-sm font-bold text-slate-900">
                  Actionable Editorial Directives (Brand Unification Playbook)
                </h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {sentimentData.editorialDirectives.map((dir, idx) => (
                  <div
                    key={dir.id || idx}
                    className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-extrabold flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <span>{dir.title}</span>
                        </span>
                        <span
                          className={`px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase ${
                            dir.priority === 'high'
                              ? 'bg-rose-100 text-rose-800'
                              : dir.priority === 'medium'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {dir.priority} Priority
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed mt-1">
                        {dir.guideline}
                      </p>
                    </div>

                    {dir.exampleCorrection && (
                      <div className="mt-2 pt-2 border-t border-slate-100 text-[11px] space-y-1 bg-slate-50 p-2 rounded-lg">
                        <div className="text-rose-700 line-through">
                          ❌ &ldquo;{dir.exampleCorrection.current}&rdquo;
                        </div>
                        <div className="text-emerald-700 font-medium">
                          ✅ &ldquo;{dir.exampleCorrection.suggested}&rdquo;
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
