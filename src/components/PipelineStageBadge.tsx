import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Mail,
  FileText,
  CheckCircle2,
  Trophy,
  ChevronDown,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { PipelineStage, ClientProspect } from '../types';
import {
  PIPELINE_STAGES,
  getPipelineStageConfig,
  resolveProspectStage,
  getNextPipelineStage,
} from '../utils/pipelineStages';

interface PipelineStageBadgeProps {
  prospect: ClientProspect;
  onUpdateStage: (prospectId: string, newStage: PipelineStage) => void;
  size?: 'sm' | 'md' | 'lg';
  showDropdown?: boolean;
  showQuickAdvance?: boolean;
  showStepper?: boolean;
}

export const PipelineStageBadge: React.FC<PipelineStageBadgeProps> = ({
  prospect,
  onUpdateStage,
  size = 'md',
  showDropdown = true,
  showQuickAdvance = true,
  showStepper = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const currentStage = resolveProspectStage(prospect);
  const config = getPipelineStageConfig(currentStage);
  const nextStage = getNextPipelineStage(currentStage);
  const nextStageConfig = nextStage ? getPipelineStageConfig(nextStage) : null;

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const renderIcon = (stageId: PipelineStage, className = 'w-3 h-3') => {
    switch (stageId) {
      case 'prospecting':
        return <Search className={className} />;
      case 'contacted':
        return <Mail className={className} />;
      case 'audit_sent':
        return <FileText className={className} />;
      case 'qualified':
        return <CheckCircle2 className={className} />;
      case 'closed_won':
        return <Trophy className={className} />;
      default:
        return <Search className={className} />;
    }
  };

  return (
    <div className="inline-flex items-center gap-1.5 flex-wrap relative" ref={dropdownRef}>
      {/* Main Stage Badge with Dropdown Trigger */}
      <div className="relative inline-flex items-center">
        <button
          type="button"
          onClick={() => showDropdown && setIsOpen(!isOpen)}
          className={`font-black rounded-lg border flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
            config.badgeBg
          } ${
            size === 'sm'
              ? 'px-2 py-0.5 text-[10px]'
              : size === 'lg'
              ? 'px-3 py-1.5 text-xs'
              : 'px-2.5 py-1 text-[11px]'
          } ${showDropdown ? 'hover:brightness-95 active:scale-98' : ''}`}
          title={`Current Outreach Stage: ${config.label}. Click to update stage.`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${config.dotColor} shrink-0 animate-pulse`} />
          <span className="shrink-0">{renderIcon(currentStage, size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3')}</span>
          <span className="whitespace-nowrap font-bold tracking-tight">{config.label}</span>
          {showDropdown && (
            <ChevronDown
              className={`w-3 h-3 opacity-60 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}
            />
          )}
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute left-0 top-full mt-1.5 z-40 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 animate-in fade-in zoom-in-95 duration-150 overflow-hidden text-left">
            <div className="px-3 py-1.5 border-b border-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-400">
              Update Pipeline Stage
            </div>
            <div className="p-1 space-y-0.5">
              {PIPELINE_STAGES.map((stage) => {
                const isSelected = stage.id === currentStage;
                return (
                  <button
                    key={stage.id}
                    type="button"
                    onClick={() => {
                      onUpdateStage(prospect.id, stage.id);
                      setIsOpen(false);
                    }}
                    className={`w-full px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center justify-between gap-2 transition-colors text-left cursor-pointer ${
                      isSelected
                        ? `${stage.lightBg} ${stage.textColor} font-black`
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`w-1.5 h-1.5 rounded-full ${stage.dotColor} shrink-0`} />
                      <span className="shrink-0">{renderIcon(stage.id, 'w-3.5 h-3.5')}</span>
                      <span className="truncate">{stage.label}</span>
                    </div>
                    {isSelected ? (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white border border-slate-200 font-mono text-slate-600 shrink-0">
                        Current
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-mono shrink-0">
                        Step {stage.stepNumber}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Quick Advance Button to Next Stage */}
      {showQuickAdvance && nextStageConfig && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onUpdateStage(prospect.id, nextStageConfig.id);
          }}
          className={`px-1.5 py-0.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-2xs ${
            size === 'sm' ? 'text-[9px] py-0.5 px-1' : ''
          }`}
          title={`Advance outreach progress to ${nextStageConfig.label}`}
        >
          <span>Advance to {nextStageConfig.shortLabel}</span>
          <ArrowRight className="w-2.5 h-2.5 text-slate-400" />
        </button>
      )}

      {/* Visual Mini Stepper (4 steps) */}
      {showStepper && (
        <div
          className="flex items-center gap-1 px-1.5 py-1 rounded-md bg-slate-100/80 border border-slate-200/60"
          title={`Stage ${config.stepNumber} of 5: ${config.label}`}
        >
          {PIPELINE_STAGES.map((s) => {
            const isCompleted = s.stepNumber < config.stepNumber;
            const isCurrent = s.id === currentStage;
            return (
              <div
                key={s.id}
                className={`h-1.5 rounded-full transition-all ${
                  isCurrent
                    ? `w-4 ${s.dotColor}`
                    : isCompleted
                    ? 'w-2 bg-slate-400'
                    : 'w-1.5 bg-slate-200'
                }`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};
