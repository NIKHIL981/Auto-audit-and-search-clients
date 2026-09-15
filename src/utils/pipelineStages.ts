import { PipelineStage, ClientProspect } from '../types';

export interface PipelineStageConfig {
  id: PipelineStage;
  label: string;
  shortLabel: string;
  stepNumber: number;
  description: string;
  badgeBg: string;
  activePillBg: string;
  dotColor: string;
  borderAccent: string;
  lightBg: string;
  textColor: string;
}

export const PIPELINE_STAGES: PipelineStageConfig[] = [
  {
    id: 'prospecting',
    label: 'Prospecting',
    shortLabel: 'Prospecting',
    stepNumber: 1,
    description: 'Lead discovered; website intelligence & audit preparation',
    badgeBg: 'bg-sky-50 text-sky-800 border-sky-300/80',
    activePillBg: 'bg-sky-600 text-white shadow-xs',
    dotColor: 'bg-sky-500',
    borderAccent: 'border-sky-400',
    lightBg: 'bg-sky-50/70',
    textColor: 'text-sky-700',
  },
  {
    id: 'contacted',
    label: 'Contacted',
    shortLabel: 'Contacted',
    stepNumber: 2,
    description: 'Initial cold email, phone hook, or LinkedIn outreach sent',
    badgeBg: 'bg-blue-50 text-blue-800 border-blue-300/80',
    activePillBg: 'bg-blue-600 text-white shadow-xs',
    dotColor: 'bg-blue-500',
    borderAccent: 'border-blue-400',
    lightBg: 'bg-blue-50/70',
    textColor: 'text-blue-700',
  },
  {
    id: 'audit_sent',
    label: 'Audit Sent',
    shortLabel: 'Audit Sent',
    stepNumber: 3,
    description: 'Client audit presentation & SEO proposal report delivered',
    badgeBg: 'bg-purple-50 text-purple-800 border-purple-300/80',
    activePillBg: 'bg-purple-600 text-white shadow-xs',
    dotColor: 'bg-purple-500',
    borderAccent: 'border-purple-400',
    lightBg: 'bg-purple-50/70',
    textColor: 'text-purple-700',
  },
  {
    id: 'qualified',
    label: 'Qualified',
    shortLabel: 'Qualified',
    stepNumber: 4,
    description: 'Decision maker engaged; pitch meeting or review call scheduled',
    badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-300/80',
    activePillBg: 'bg-emerald-600 text-white shadow-xs',
    dotColor: 'bg-emerald-500',
    borderAccent: 'border-emerald-400',
    lightBg: 'bg-emerald-50/70',
    textColor: 'text-emerald-700',
  },
  {
    id: 'closed_won',
    label: 'Closed Won',
    shortLabel: 'Won',
    stepNumber: 5,
    description: 'Client signed monthly retainer contract',
    badgeBg: 'bg-amber-50 text-amber-900 border-amber-300/80',
    activePillBg: 'bg-amber-600 text-white shadow-xs',
    dotColor: 'bg-amber-500',
    borderAccent: 'border-amber-400',
    lightBg: 'bg-amber-50/70',
    textColor: 'text-amber-800',
  },
];

export const PIPELINE_STAGE_MAP: Record<PipelineStage, PipelineStageConfig> = PIPELINE_STAGES.reduce(
  (acc, stage) => {
    acc[stage.id] = stage;
    return acc;
  },
  {} as Record<PipelineStage, PipelineStageConfig>
);

export function getPipelineStageConfig(stage?: PipelineStage | string): PipelineStageConfig {
  if (stage && stage in PIPELINE_STAGE_MAP) {
    return PIPELINE_STAGE_MAP[stage as PipelineStage];
  }
  return PIPELINE_STAGE_MAP.prospecting;
}

export function resolveProspectStage(prospect: ClientProspect): PipelineStage {
  if (prospect.pipelineStage && prospect.pipelineStage in PIPELINE_STAGE_MAP) {
    return prospect.pipelineStage;
  }
  // Fallback inferences for legacy prospects
  if (prospect.status === 'won') return 'closed_won';
  if (prospect.status === 'contacted') return 'contacted';
  if (prospect.status === 'in_discussion') return 'qualified';
  if (prospect.clientAuditReport) return 'audit_sent';
  return 'prospecting';
}

export function getNextPipelineStage(current: PipelineStage): PipelineStage | null {
  const sequence: PipelineStage[] = ['prospecting', 'contacted', 'audit_sent', 'qualified', 'closed_won'];
  const currentIndex = sequence.indexOf(current);
  if (currentIndex >= 0 && currentIndex < sequence.length - 1) {
    return sequence[currentIndex + 1];
  }
  return null;
}

export function getPrevPipelineStage(current: PipelineStage): PipelineStage | null {
  const sequence: PipelineStage[] = ['prospecting', 'contacted', 'audit_sent', 'qualified', 'closed_won'];
  const currentIndex = sequence.indexOf(current);
  if (currentIndex > 0) {
    return sequence[currentIndex - 1];
  }
  return null;
}

export interface PipelineFunnelCounts {
  all: number;
  prospecting: number;
  contacted: number;
  audit_sent: number;
  qualified: number;
  closed_won: number;
  outreachProgressPercentage: number;
}

export function calculatePipelineFunnelCounts(prospects: ClientProspect[]): PipelineFunnelCounts {
  const counts = {
    all: prospects.length,
    prospecting: 0,
    contacted: 0,
    audit_sent: 0,
    qualified: 0,
    closed_won: 0,
    outreachProgressPercentage: 0,
  };

  prospects.forEach((p) => {
    const stage = resolveProspectStage(p);
    if (stage in counts) {
      counts[stage]++;
    } else {
      counts.prospecting++;
    }
  });

  const advancedCount = counts.contacted + counts.audit_sent + counts.qualified + counts.closed_won;
  counts.outreachProgressPercentage = counts.all > 0 ? Math.round((advancedCount / counts.all) * 100) : 0;

  return counts;
}
