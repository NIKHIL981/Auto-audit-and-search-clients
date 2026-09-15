import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  Zap,
  Smartphone,
  Tag,
  FileText,
  Heading,
  Code,
  Bot,
  Map,
  Image,
  Layers,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { ClientProspect, ClientAuditReport } from '../types';
import {
  ClientIndividualAuditCheck,
  getClientIndividualAuditChecks,
} from '../utils/clientAuditChecks';

interface ClientIndividualAuditsViewProps {
  prospect: ClientProspect;
  report?: ClientAuditReport | null;
  compact?: boolean;
  defaultExpanded?: boolean;
}

export const ClientIndividualAuditsView: React.FC<ClientIndividualAuditsViewProps> = ({
  prospect,
  report,
  compact = false,
  defaultExpanded = false,
}) => {
  const [filter, setFilter] = useState<'all' | 'passed' | 'failed' | 'warning'>('all');
  const [expandedCheckId, setExpandedCheckId] = useState<string | null>(null);

  const checks: ClientIndividualAuditCheck[] = useMemo(() => {
    return getClientIndividualAuditChecks(prospect, report);
  }, [prospect, report]);

  const passedCount = checks.filter((c) => c.status === 'passed').length;
  const warningCount = checks.filter((c) => c.status === 'warning').length;
  const failedCount = checks.filter((c) => c.status === 'failed').length;

  const filteredChecks = useMemo(() => {
    if (filter === 'all') return checks;
    return checks.filter((c) => c.status === filter);
  }, [checks, filter]);

  const getCategoryIcon = (category: ClientIndividualAuditCheck['category']) => {
    switch (category) {
      case 'Security & Protocol':
        return <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />;
      case 'Speed & Core Vitals':
        return <Zap className="w-3.5 h-3.5 text-amber-600" />;
      case 'Mobile & Viewport':
        return <Smartphone className="w-3.5 h-3.5 text-blue-600" />;
      case 'On-Page SEO':
        return <Tag className="w-3.5 h-3.5 text-purple-600" />;
      case 'Local Authority':
        return <MapPin className="w-3.5 h-3.5 text-rose-600" />;
      case 'Indexation & Crawl':
        return <Bot className="w-3.5 h-3.5 text-indigo-600" />;
      case 'Tech Stack & Tracking':
        return <Layers className="w-3.5 h-3.5 text-cyan-600" />;
      default:
        return <HelpCircle className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  const getStatusBadge = (status: ClientIndividualAuditCheck['status']) => {
    switch (status) {
      case 'passed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Passed</span>
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            <span>Warning</span>
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <AlertCircle className="w-3 h-3 text-rose-600" />
            <span>Action Required</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-3">
      {/* Header & Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
            <span>All Individual Technical Audits</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
              {checks.length} Checks Run
            </span>
          </span>
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1 text-[11px] font-bold">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-2 py-0.5 rounded-lg transition-colors cursor-pointer ${
              filter === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All ({checks.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('passed')}
            className={`px-2 py-0.5 rounded-lg transition-colors cursor-pointer ${
              filter === 'passed'
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            Passed ({passedCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter('failed')}
            className={`px-2 py-0.5 rounded-lg transition-colors cursor-pointer ${
              filter === 'failed'
                ? 'bg-rose-600 text-white'
                : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
            }`}
          >
            Failed ({failedCount})
          </button>
          {warningCount > 0 && (
            <button
              type="button"
              onClick={() => setFilter('warning')}
              className={`px-2 py-0.5 rounded-lg transition-colors cursor-pointer ${
                filter === 'warning'
                  ? 'bg-amber-600 text-white'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
              }`}
            >
              Warnings ({warningCount})
            </button>
          )}
        </div>
      </div>

      {/* Checks Grid / List */}
      <div className="space-y-2">
        {filteredChecks.map((check) => {
          const isExpanded = defaultExpanded || expandedCheckId === check.id;

          return (
            <div
              key={check.id}
              className={`p-3 rounded-xl border transition-all ${
                check.status === 'failed'
                  ? 'bg-rose-50/40 border-rose-200'
                  : check.status === 'warning'
                  ? 'bg-amber-50/40 border-amber-200'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div
                className="flex items-center justify-between gap-2 cursor-pointer select-none"
                onClick={() => setExpandedCheckId(isExpanded ? null : check.id)}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="p-1 rounded-lg bg-white border border-slate-200 shrink-0">
                    {getCategoryIcon(check.category)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {check.name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        &bull; {check.category}
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-600 truncate mt-0.5">
                      {check.metricValue}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {getStatusBadge(check.status)}
                  <button
                    type="button"
                    className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    {isExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Collapsible Details Drawer */}
              {isExpanded && (
                <div className="mt-2.5 pt-2.5 border-t border-slate-200/80 space-y-1.5 text-xs">
                  <div className="text-slate-700 leading-relaxed">
                    <strong className="text-slate-900">Technical Finding:</strong>{' '}
                    {check.technicalFinding}
                  </div>

                  <div
                    className={`p-2 rounded-lg text-[11px] font-medium leading-relaxed ${
                      check.status === 'failed'
                        ? 'bg-rose-100/70 text-rose-950 border border-rose-200'
                        : check.status === 'warning'
                        ? 'bg-amber-100/70 text-amber-950 border border-amber-200'
                        : 'bg-emerald-100/70 text-emerald-950 border border-emerald-200'
                    }`}
                  >
                    <strong>Business &amp; Revenue Impact:</strong> {check.businessImpact}
                  </div>

                  <div className="p-2 rounded-lg bg-slate-100 text-[11px] text-slate-800 leading-relaxed border border-slate-200">
                    <strong className="text-slate-900">Recommended Resolution:</strong>{' '}
                    {check.recommendation}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
