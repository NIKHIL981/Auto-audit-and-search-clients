import React from 'react';
import {
  Layers,
  Search,
  Mail,
  FileText,
  CheckCircle2,
  Trophy,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { PipelineStage, ClientProspect } from '../types';
import {
  PIPELINE_STAGES,
  calculatePipelineFunnelCounts,
} from '../utils/pipelineStages';

interface PipelineFunnelTrackerBarProps {
  prospects: ClientProspect[];
  activeStageFilter: string; // 'all' or PipelineStage
  onSelectStageFilter: (stage: string) => void;
}

export const PipelineFunnelTrackerBar: React.FC<PipelineFunnelTrackerBarProps> = ({
  prospects,
  activeStageFilter,
  onSelectStageFilter,
}) => {
  const counts = calculatePipelineFunnelCounts(prospects);

  const getStageIcon = (stageId: PipelineStage) => {
    switch (stageId) {
      case 'prospecting':
        return <Search className="w-3.5 h-3.5" />;
      case 'contacted':
        return <Mail className="w-3.5 h-3.5" />;
      case 'audit_sent':
        return <FileText className="w-3.5 h-3.5" />;
      case 'qualified':
        return <CheckCircle2 className="w-3.5 h-3.5" />;
      case 'closed_won':
        return <Trophy className="w-3.5 h-3.5" />;
      default:
        return <Search className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-3 shadow-xs space-y-2.5">
      {/* Top Header: Pipeline Progress Meta */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200/60">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-slate-900 tracking-tight">
                Outreach Pipeline Progress
              </span>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                {counts.all} Total Leads
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Track prospects across discovery, cold pitches, delivered audit presentations, and qualified deals.
            </p>
          </div>
        </div>

        {/* Funnel Progress Rate */}
        {counts.all > 0 && (
          <div className="flex items-center gap-2 shrink-0">
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-wider font-black text-slate-400">
                Outreach Active
              </div>
              <div className="text-xs font-black text-indigo-900 flex items-center justify-end gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
                <span>{counts.outreachProgressPercentage}% Engaged</span>
              </div>
            </div>
            <div className="w-16 bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
              <div
                className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${counts.outreachProgressPercentage}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Stage Filter Buttons Funnel */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5 pt-1">
        {/* All Leads Tab */}
        <button
          type="button"
          onClick={() => onSelectStageFilter('all')}
          className={`px-3 py-2 rounded-xl text-xs font-black flex items-center justify-between gap-2 border transition-all cursor-pointer ${
            activeStageFilter === 'all'
              ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
              : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
          }`}
        >
          <span className="truncate">All Leads</span>
          <span
            className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
              activeStageFilter === 'all' ? 'bg-white/20 text-white' : 'bg-white text-slate-700 border border-slate-200'
            }`}
          >
            {counts.all}
          </span>
        </button>

        {/* Individual Pipeline Stages */}
        {PIPELINE_STAGES.map((stage, idx) => {
          const isSelected = activeStageFilter === stage.id;
          const stageCount = (counts as any)[stage.id] ?? 0;

          return (
            <button
              key={stage.id}
              type="button"
              onClick={() => onSelectStageFilter(stage.id)}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between gap-1.5 border transition-all cursor-pointer text-left ${
                isSelected
                  ? `${stage.activePillBg} border-transparent ring-2 ring-indigo-300 shadow-xs`
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
              }`}
              title={`${stage.label}: ${stage.description}`}
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <span className={`shrink-0 ${isSelected ? 'text-white' : stage.textColor}`}>
                  {getStageIcon(stage.id)}
                </span>
                <span className="truncate font-bold">{stage.label}</span>
              </div>
              <span
                className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold shrink-0 ${
                  isSelected
                    ? 'bg-white/25 text-white'
                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                {stageCount}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
