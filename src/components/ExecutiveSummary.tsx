import React from 'react';
import {
  Sparkles,
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Zap,
  ShieldCheck,
  Cpu,
  ArrowRight,
  FileCode,
  Tag,
  Network,
  Link2,
  Database,
  Gauge,
  BrainCircuit,
  Layers,
  Printer,
  Calendar,
  ListChecks,
  Users,
  Send,
} from 'lucide-react';
import { AuditReport } from '../types';
import { HeroSection } from './HeroSection';
import { AiInsightsSection } from './AiInsightsSection';
import { PerformanceHistoryChart } from './PerformanceHistoryChart';
import { triggerPrintReport } from '../utils/export';

interface ExecutiveSummaryProps {
  report: AuditReport;
  onNavigateToTab: (tabId: string) => void;
  history?: AuditReport[];
  onOpenBrandedPdfGenerator?: () => void;
  onSaveSnapshot?: () => void;
  onSelectReport?: (report: AuditReport) => void;
  onConvertToClient?: () => void;
}

export const ExecutiveSummary: React.FC<ExecutiveSummaryProps> = ({
  report,
  onNavigateToTab,
  history = [],
  onOpenBrandedPdfGenerator,
  onSaveSnapshot,
  onSelectReport,
  onConvertToClient,
}) => {
  const issues = Array.isArray(report.issues) ? report.issues : [];
  const quickWins = Array.isArray(report.quickWins) ? report.quickWins : [];
  const statCounts = report.statCounts;
  const criticalCount = statCounts?.errors ?? issues.filter((i) => i.severity === 'critical').length;
  const warningCount = statCounts?.warnings ?? issues.filter((i) => i.severity === 'warning').length;
  const passedCount = statCounts?.passed ?? issues.filter((i) => i.severity === 'passed').length;

  const categories = [
    {
      id: 'crawled_pages',
      title: 'Crawled Pages Directory',
      score: report.scores?.overall ?? 89,
      description: `Complete parameter inventory of ${report.crawledPages?.length || 50} pages: meta titles, descriptions, H1s, and per-page errors`,
      icon: Layers,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
    },
    {
      id: 'content_analysis',
      title: 'Content & Keyword Density',
      score: 91,
      description: `Top 20 frequent terms analysis, keyword density distribution bar chart, and topical coverage`,
      icon: Tag,
      color: 'text-amber-600 bg-amber-50 border-amber-200',
    },
    {
      id: 'on-page',
      title: 'On-Page Meta & Content',
      score: report.scores?.content ?? 85,
      description: `${report.content?.wordCount || 0} words, title & description tags, H1-H6 outline`,
      icon: Tag,
      color: 'text-blue-600 bg-blue-50 border-blue-200',
    },
    {
      id: 'architecture',
      title: 'Architecture & Indexability',
      score: report.scores?.technical ?? 85,
      description: 'Canonicalization, robots directives, XML sitemaps, AI bot governance',
      icon: Network,
      color: 'text-cyan-600 bg-cyan-50 border-cyan-200',
    },
    {
      id: 'links-nav',
      title: 'Links & Navigation',
      score: 92,
      description: `${report.linking?.totalLinks || 0} links, anchor distribution, mobile nav parity`,
      icon: Link2,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    },
    {
      id: 'media-assets',
      title: 'Media & Assets',
      score: report.images?.missingAltCount === 0 ? 95 : 82,
      description: `${report.images?.totalImages || 0} images, modern WebP/AVIF formats, alt attributes`,
      icon: ShieldCheck,
      color: 'text-amber-600 bg-amber-50 border-amber-200',
    },
    {
      id: 'schema',
      title: 'Schema & Structured Data',
      score: report.structuredData?.schemas?.length ? 96 : 70,
      description: `${report.structuredData?.detectedTypes?.length || 0} Schema.org entities, JSON-LD validation`,
      icon: Database,
      color: 'text-purple-600 bg-purple-50 border-purple-200',
    },
    {
      id: 'technical',
      title: 'Technical, Security & CWV',
      score: report.performance?.score || 85,
      description: `LCP ${report.performance?.lcpEstimate || 1.8}s, CLS ${report.performance?.clsEstimate || 0.03}, HTTPS & HSTS`,
      icon: Gauge,
      color: 'text-rose-600 bg-rose-50 border-rose-200',
    },
    {
      id: 'ai_readiness',
      title: 'AI Readiness & GEO Engine',
      score: report.scores?.aiReadiness ?? 85,
      description: `LLM crawler permissions, Answer Engine Optimization (AEO), and EEAT governance`,
      icon: BrainCircuit,
      color: 'text-purple-600 bg-purple-50 border-purple-200',
    },
    {
      id: 'issues',
      title: 'Remediation Checklist',
      score: issues.length > 0 ? Math.round((issues.filter((i) => i.isCompleted).length / issues.length) * 100) : 100,
      description: `${issues.filter((i) => i.isCompleted).length} of ${issues.length} remediation tasks resolved. Mark off completed fixes and track team progress.`,
      icon: ListChecks,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Action Bar with 'Download as PDF' button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold text-slate-800">
            Audit Verified for <span className="font-mono text-blue-700">{report.domain}</span>
          </span>
          <span className="text-slate-300 hidden sm:inline">&bull;</span>
          <span className="text-xs text-slate-500 hidden sm:inline">
            Scope: {report.crawledPages?.length || 1} pages crawled
          </span>
        </div>

        {/* Action Buttons: Jump to AI Insights, Pitch Client, & Branded PDF Generator */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            id="executive-pitch-client-btn"
            onClick={() => {
              if (onConvertToClient) {
                onConvertToClient();
              } else {
                onNavigateToTab('client_hub');
              }
            }}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer group shrink-0"
            title="Convert this live audit to a client record and open the tailored outreach message draft"
          >
            <Users className="w-3.5 h-3.5 text-white" />
            <span>Pitch Client &amp; Draft Message</span>
          </button>

          <button
            type="button"
            id="jump-to-ai-insights-btn"
            onClick={() => {
              const el = document.getElementById('ai-insights-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer group shrink-0"
            title="Scroll directly to Gemini AI Insights & Prioritized Recommendations"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-600 group-hover:scale-110 transition-transform" />
            <span>AI Insights Roadmap</span>
          </button>

          <button
            type="button"
            id="download-pdf-button"
            onClick={() => {
              if (onOpenBrandedPdfGenerator) {
                onOpenBrandedPdfGenerator();
              } else {
                triggerPrintReport();
              }
            }}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-extrabold flex items-center gap-2 transition-all shadow-xs cursor-pointer group shrink-0"
            title="Open the Branded PDF Template Generator for custom agency styling & export"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300 group-hover:rotate-12 transition-transform" />
            <span>Branded PDF Generator</span>
          </button>

          <button
            type="button"
            id="quick-print-button"
            onClick={() => triggerPrintReport()}
            className="px-3 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer shrink-0"
            title="Quick print without custom branding"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden md:inline">Quick Print</span>
          </button>
        </div>
      </div>

      {/* 1. Hero Section (Gauge, Proof Screenshot, 4 Stat Cards) */}
      <HeroSection report={report} />

      {/* 2. Recharts Line Graph: Performance Score History Over Time */}
      <PerformanceHistoryChart
        report={report}
        history={history}
        onSaveSnapshot={onSaveSnapshot}
        onSelectReport={onSelectReport}
      />

      {/* 3. Executive Summary & Quick Wins */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Executive Summary Narrative */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Executive Audit Synthesis</h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            {report.executiveSummary}
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
            <span className="font-semibold text-slate-500">Target URL:</span>
            <span className="font-mono text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[11px] truncate max-w-sm">
              {report.url}
            </span>
          </div>
        </div>

        {/* Actionable Quick Wins Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-3 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                <Zap className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">High-Impact Quick Wins</h3>
            </div>
            <ul className="space-y-2 text-xs text-slate-700">
              {quickWins.slice(0, 3).map((win, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span>{win}</span>
                </li>
              ))}
            </ul>
          </div>

          <button
            type="button"
            onClick={() => onNavigateToTab('on-page')}
            className="mt-3 w-full py-2 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>Review On-Page Recommendations</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

      {/* 4. Gemini AI Strategic Insights & Prioritized Action Roadmap */}
      <AiInsightsSection report={report} onNavigateToTab={onNavigateToTab} />

      {/* 5. Category Breakdown Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Audit Modules Breakdown
          </h3>
          <span className="text-xs text-slate-400">Click a module to inspect individual checks</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <div
                key={cat.id}
                onClick={() => onNavigateToTab(cat.id)}
                className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-5 shadow-xs transition-all hover:shadow-md cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-2 rounded-xl border ${cat.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {cat.title}
                      </h4>
                    </div>
                    <span className="text-sm font-black text-slate-800">
                      {cat.score}%
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 line-clamp-2 mb-4">
                    {cat.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs font-semibold text-slate-600 group-hover:text-blue-600">
                  <span>Explore Module</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Critical Errors Alert Banner (if any) */}
      {criticalCount > 0 && (
        <div className="bg-rose-50/60 border border-rose-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-100 text-rose-700 shrink-0">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-rose-900">
                {criticalCount} Critical Issue(s) Require Immediate Remediation
              </h4>
              <p className="text-xs text-rose-700 mt-0.5">
                These errors may actively hinder crawler indexing or cause ranking penalties in organic search results.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigateToTab('issues')}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs shrink-0 cursor-pointer transition-colors"
          >
            Jump to Critical Fixes
          </button>
        </div>
      )}

      {/* Floating 'Export PDF' Action Button */}
      <aside aria-label="Quick Actions" className="fixed bottom-6 right-6 z-40 no-print">
        <button
          type="button"
          id="floating-export-pdf-btn"
          onClick={() => triggerPrintReport()}
          title="Export audit report as print-ready PDF"
          className="group flex items-center gap-2.5 px-4 py-3 rounded-full bg-slate-900 hover:bg-blue-600 text-white shadow-xl hover:shadow-2xl hover:shadow-blue-500/25 border border-slate-700/50 hover:border-blue-400 transition-all duration-200 cursor-pointer transform hover:-translate-y-0.5"
        >
          <div className="p-1 rounded-full bg-white/10 group-hover:bg-white/20 transition-colors">
            <Printer className="w-4 h-4 text-white" />
          </div>
          <span className="text-xs font-bold tracking-wide">Export PDF</span>
          <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-semibold bg-white/15 rounded-md text-slate-200">
            Print-Ready
          </span>
        </button>
      </aside>
    </div>
  );
};

