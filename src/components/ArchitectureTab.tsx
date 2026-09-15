import React from 'react';
import { Network, Bot, Shield, FileText, CheckCircle2, AlertTriangle, AlertOctagon } from 'lucide-react';
import { AuditReport } from '../types';
import { CheckAccordion } from './CheckAccordion';
import { SitemapValidatorCheck } from './SitemapValidatorCheck';
import { CrawlHierarchyTree } from './CrawlHierarchyTree';

interface ArchitectureTabProps {
  report: AuditReport;
}

export const ArchitectureTab: React.FC<ArchitectureTabProps> = ({ report }) => {
  const checks = report.allChecks?.filter((c) => c.category === 'indexability') || [];
  const ai = report.aiReadiness;
  const sitemaps = report.sitemaps || [];

  return (
    <div className="space-y-6">
      {/* Category Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-cyan-50 text-cyan-600">
            <Network className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Architecture &amp; Indexability</h2>
            <p className="text-xs text-slate-500">
              Canonical tags, HTTP headers, robots.txt directives, XML sitemaps, and AI crawler permissions
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
            report.metaTags?.isIndexable ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
          }`}>
            {report.metaTags?.isIndexable ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />}
            {report.metaTags?.isIndexable ? 'Open Organic Indexing' : 'Blocked / Noindex Detected'}
          </span>
        </div>
      </div>

      {/* Visual Crawl Depth & Link Hierarchy Tree (D3 Interactive Map) */}
      <CrawlHierarchyTree report={report} />

      {/* SITEMAP VALIDATOR CHECK */}
      <SitemapValidatorCheck report={report} />

      {/* AI Bot Crawler Governance Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">AI Crawler &amp; LLM Governance (robots.txt)</h3>
              <p className="text-xs text-slate-500">Explicit rules configured for AI search engines and model training scrapers</p>
            </div>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {ai?.robotsTxtPresent ? 'robots.txt Detected' : 'No robots.txt found'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {ai?.botGovernance?.map((bot, i) => {
            const isAllowed = bot.status === 'allowed' || bot.status === 'not-specified';
            const isBlocked = bot.status === 'disallowed';
            return (
              <div
                key={i}
                className={`p-3.5 rounded-xl border flex flex-col justify-between ${
                  isBlocked
                    ? 'bg-rose-50/50 border-rose-200'
                    : 'bg-slate-50/50 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="font-bold text-xs text-slate-900">{bot.botName}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        isBlocked
                          ? 'bg-rose-100 text-rose-800 border-rose-200'
                          : isAllowed
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {bot.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2">{bot.details}</p>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-100/80 flex items-center justify-between text-[10px] text-slate-400">
                  <span className="font-mono">User-agent: {bot.userAgent}</span>
                  <span className="capitalize">{bot.purpose}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sitemaps Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-teal-50 text-teal-600">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">XML Sitemaps Discovery</h3>
              <p className="text-xs text-slate-500">Registered sitemaps for accelerated search indexing</p>
            </div>
          </div>
          <span className="text-xs font-mono font-semibold text-slate-600">
            {sitemaps.length} Location(s)
          </span>
        </div>

        {sitemaps.length > 0 ? (
          <div className="space-y-2">
            {sitemaps.map((sm, i) => (
              <div key={i} className="p-3 rounded-lg bg-slate-50 border border-slate-200 font-mono text-xs text-slate-700 flex items-center justify-between">
                <span className="truncate">{sm}</span>
                <span className="text-[11px] text-emerald-600 font-semibold shrink-0 ml-2">Declared in robots.txt</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>No XML sitemap directive declared in robots.txt. Add "Sitemap: https://{report.domain}/sitemap.xml" to accelerate crawler discovery.</span>
          </div>
        )}
      </div>

      {/* Accordion Checks */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Architecture &amp; Indexability Checks ({checks.length})
          </h3>
          <span className="text-xs text-slate-400">Click any check to inspect findings &amp; fixes</span>
        </div>

        <div className="space-y-2.5">
          {checks.map((check, idx) => (
            <CheckAccordion key={check.id} check={check} defaultExpanded={idx === 0 || check.status === 'error'} />
          ))}
        </div>
      </div>
    </div>
  );
};
