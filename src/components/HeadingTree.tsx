import React from 'react';
import { ListTree, AlertOctagon, CheckCircle2, CornerDownRight, Layers } from 'lucide-react';
import { HeadingAudit } from '../types';

interface HeadingTreeProps {
  headingAudit: HeadingAudit;
}

export const HeadingTree: React.FC<HeadingTreeProps> = ({ headingAudit }) => {
  const headings = headingAudit?.headings || [];
  const skippedLevels = headingAudit?.skippedLevels || [];

  const getLevelBadge = (level: number) => {
    switch (level) {
      case 1:
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 2:
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 3:
        return 'bg-cyan-50 text-cyan-700 border-cyan-200';
      case 4:
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 5:
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  // Check if a specific heading caused a skipped level
  const isSkippedLevel = (index: number) => {
    if (index <= 0 || !headings[index] || !headings[index - 1]) return false;
    const curr = headings[index];
    const prev = headings[index - 1];
    return curr.level > prev.level + 1;
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
            <ListTree className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Heading Tree Visualizer</h3>
            <p className="text-xs text-slate-500">Structural hierarchy outline (H1 through H6) with skipped level detection</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {skippedLevels.length > 0 ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
              <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />
              {skippedLevels.length} Skipped Level(s) Detected
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Clean Heading Hierarchy
            </span>
          )}
        </div>
      </div>

      {/* Heading counts summary pills */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        <div className={`p-2.5 rounded-xl border text-center ${headingAudit.h1Count === 1 ? 'bg-emerald-50/50 border-emerald-200' : 'bg-rose-50/50 border-rose-200'}`}>
          <div className="text-[10px] font-bold uppercase text-slate-500">H1 Tag</div>
          <div className="text-lg font-black text-slate-900">{headingAudit.h1Count}</div>
          <div className="text-[10px] text-slate-500">{headingAudit.h1Count === 1 ? 'Optimal' : headingAudit.h1Count === 0 ? 'Missing' : 'Multiple'}</div>
        </div>
        <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-center">
          <div className="text-[10px] font-bold uppercase text-slate-500">H2 Tags</div>
          <div className="text-lg font-black text-slate-900">{headingAudit.h2Count}</div>
          <div className="text-[10px] text-slate-500">Sections</div>
        </div>
        <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-center">
          <div className="text-[10px] font-bold uppercase text-slate-500">H3 Tags</div>
          <div className="text-lg font-black text-slate-900">{headingAudit.h3Count}</div>
          <div className="text-[10px] text-slate-500">Sub-points</div>
        </div>
        <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-center">
          <div className="text-[10px] font-bold uppercase text-slate-500">H4 Tags</div>
          <div className="text-lg font-black text-slate-900">{headingAudit.h4Count}</div>
          <div className="text-[10px] text-slate-500">Details</div>
        </div>
        <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-center">
          <div className="text-[10px] font-bold uppercase text-slate-500">H5 Tags</div>
          <div className="text-lg font-black text-slate-900">{headingAudit.h5Count}</div>
          <div className="text-[10px] text-slate-500">Minor</div>
        </div>
        <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-center">
          <div className="text-[10px] font-bold uppercase text-slate-500">H6 Tags</div>
          <div className="text-lg font-black text-slate-900">{headingAudit.h6Count}</div>
          <div className="text-[10px] text-slate-500">Footnotes</div>
        </div>
      </div>

      {/* Visual Tree */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 max-h-96 overflow-y-auto space-y-2">
        {headings.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-xs italic">
            No heading tags (H1-H6) found in document.
          </div>
        ) : (
          headings.map((h, idx) => {
            const indentLevel = Math.max(0, h.level - 1);
            const isSkipped = isSkippedLevel(idx);
            const prevHeading = idx > 0 ? headings[idx - 1] : null;

            return (
              <div
                key={idx}
                className={`relative flex items-center gap-2 p-2 rounded-lg transition-colors ${
                  isSkipped ? 'bg-rose-50 border border-rose-300' : 'hover:bg-white/80'
                }`}
                style={{ marginLeft: `${indentLevel * 18}px` }}
              >
                {/* Indent Guide Icon */}
                {indentLevel > 0 && (
                  <CornerDownRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                )}

                {/* Level Badge */}
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-black border uppercase tracking-wider shrink-0 ${getLevelBadge(
                    h.level
                  )}`}
                >
                  H{h.level}
                </span>

                {/* Text Content */}
                <span className="text-xs font-medium text-slate-800 break-words flex-1">
                  {h.text || <span className="text-rose-500 italic font-normal">[Empty Heading Text]</span>}
                </span>

                {/* Warning on Skipped Level */}
                {isSkipped && prevHeading && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-rose-600 text-white shrink-0">
                    <AlertOctagon className="w-3 h-3" /> Skipped H{prevHeading.level} → H{h.level}
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
