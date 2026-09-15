import React from 'react';
import {
  FileText,
  Link2,
  ExternalLink,
  BookOpen,
  Clock,
  AlertTriangle,
  CheckCircle2,
  AlertOctagon,
  TrendingUp,
} from 'lucide-react';
import { AuditReport } from '../types';

interface ContentTabProps {
  report: AuditReport;
}

export const ContentTab: React.FC<ContentTabProps> = ({ report }) => {
  const content = report.content;
  const linking = report.linking;

  const totalLinks = linking.totalLinks || 1;
  const internalPercent = Math.round((linking.internalCount / totalLinks) * 100);
  const externalPercent = 100 - internalPercent;

  return (
    <div className="space-y-6">
      
      {/* 1. Content Depth & Readability */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Content Depth &amp; Readability</h2>
              <p className="text-xs text-slate-400">Total word volume, Flesch reading ease formula, and user comprehension grade.</p>
            </div>
          </div>
          <span
            className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
              content.wordCount >= 400
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            }`}
          >
            {content.wordCount >= 400 ? 'Comprehensive Volume' : 'Thin Content Risk'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Word Count</div>
            <div className="text-2xl font-extrabold text-white mt-1">
              {content.wordCount.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              ~{content.characterCount.toLocaleString()} characters
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Est. Reading Time</div>
            <div className="text-2xl font-extrabold text-cyan-400 mt-1 flex items-center gap-1.5">
              <Clock className="w-5 h-5 text-cyan-500" />
              <span>{content.readingTimeMinutes} min</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Standard 200 WPM pace</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Flesch Reading Ease</div>
            <div className="text-2xl font-extrabold text-indigo-400 mt-1">
              {content.fleschScore} <span className="text-xs text-slate-500 font-normal">/ 100</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Higher = More accessible</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Comprehension Level</div>
            <div className="text-sm font-bold text-slate-200 mt-2 truncate" title={content.readabilityGrade}>
              {content.readabilityGrade}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Target: 8th - 10th grade</div>
          </div>

        </div>

        {/* Readability bar info */}
        <div className="mt-4 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-300 flex items-center justify-between">
          <span>{content.message}</span>
          <span className="text-slate-500 hidden sm:inline">Calculated from syllable-to-sentence ratio</span>
        </div>
      </div>

      {/* 2. Link Equity & Distribution */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Link2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Linking Equity (Internal vs. External)</h2>
              <p className="text-xs text-slate-400">Navigation hierarchy, outbound authority citations, and crawl risks.</p>
            </div>
          </div>
          <span
            className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
              linking.brokenLinkRisks === 0
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            }`}
          >
            {linking.brokenLinkRisks === 0 ? 'Zero Broken Anchor Risks' : `${linking.brokenLinkRisks} Potential Link Risks`}
          </span>
        </div>

        {/* Distribution Progress Bar */}
        <div className="space-y-2 mb-5">
          <div className="flex justify-between text-xs text-slate-300 font-semibold">
            <span className="flex items-center gap-1.5 text-cyan-400">
              Internal Links ({linking.internalCount} &bull; {internalPercent}%)
            </span>
            <span className="flex items-center gap-1.5 text-indigo-400">
              External Outbound ({linking.externalCount} &bull; {externalPercent}%)
            </span>
          </div>

          <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden flex shadow-inner">
            <div className="bg-gradient-to-r from-cyan-600 to-cyan-400 h-full" style={{ width: `${internalPercent}%` }} />
            <div className="bg-gradient-to-r from-indigo-500 to-indigo-400 h-full" style={{ width: `${externalPercent}%` }} />
          </div>
        </div>

        {/* Link Warnings and Risk Checks */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="text-[11px] text-slate-400 font-semibold uppercase">Total Discovered Links</div>
            <div className="text-xl font-bold text-white mt-1">{linking.totalLinks}</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="text-[11px] text-slate-400 font-semibold uppercase">Empty Anchor Text</div>
            <div className={`text-xl font-bold mt-1 ${linking.emptyAnchorCount > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {linking.emptyAnchorCount}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="text-[11px] text-slate-400 font-semibold uppercase">Dead / Placeholder Anchors</div>
            <div className={`text-xl font-bold mt-1 ${linking.brokenLinkRisks > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {linking.brokenLinkRisks}
            </div>
          </div>
        </div>

        {/* Sample Links Table */}
        {linking.sampleLinks && linking.sampleLinks.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-800/80">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
              Sample Links Inspector:
            </div>
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold">Anchor Text</th>
                    <th className="py-2.5 px-3 font-semibold">Destination URL</th>
                    <th className="py-2.5 px-3 font-semibold">Type</th>
                    <th className="py-2.5 px-3 font-semibold">Attributes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                  {linking.sampleLinks.map((link, i) => (
                    <tr key={i} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2 px-3 font-medium text-slate-200 truncate max-w-[150px]">
                        {link.text || <span className="text-amber-400 italic">(Empty)</span>}
                      </td>
                      <td className="py-2 px-3 font-mono text-slate-400 truncate max-w-[280px]">
                        {link.href}
                      </td>
                      <td className="py-2 px-3">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            link.isInternal
                              ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                              : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                          }`}
                        >
                          {link.isInternal ? 'Internal' : 'External'}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-slate-400">
                        {link.hasNoFollow && <span className="mr-1 text-slate-400">nofollow</span>}
                        {link.hasSecureTarget && <span className="text-emerald-400">noopener</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
