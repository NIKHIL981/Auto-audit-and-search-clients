import React, { useState } from 'react';
import {
  History,
  X,
  Trash2,
  RefreshCw,
  Eye,
  Calendar,
  ExternalLink,
  ShieldCheck,
  BrainCircuit,
  ArrowRight,
  GitCompare,
  Copy,
  Check,
} from 'lucide-react';
import { AuditReport } from '../types';
import { copyTextToClipboard } from '../utils/clipboard';

interface AuditHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  reports: AuditReport[];
  activeReportId: string | null;
  onSelectReport: (report: AuditReport) => void;
  onDeleteReport: (id: string) => void;
  onClearAll: () => void;
  onRerunAudit: (url: string) => void;
  onOpenCompare: () => void;
}

export const AuditHistoryModal: React.FC<AuditHistoryModalProps> = ({
  isOpen,
  onClose,
  reports,
  activeReportId,
  onSelectReport,
  onDeleteReport,
  onClearAll,
  onRerunAudit,
  onOpenCompare,
}) => {
  const [copiedReportUrlId, setCopiedReportUrlId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopyUrl = async (url: string, id: string) => {
    const ok = await copyTextToClipboard(url);
    if (ok) {
      setCopiedReportUrlId(id);
      setTimeout(() => {
        setCopiedReportUrlId(null);
      }, 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-4xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Saved Audit History</h2>
              <p className="text-xs text-slate-500">
                All reports persist automatically in your browser across sessions.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {reports.length > 1 && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenCompare();
                }}
                className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <GitCompare className="w-3.5 h-3.5" />
                <span>Compare Sites</span>
              </button>
            )}

            {reports.length > 0 && (
              <button
                type="button"
                onClick={onClearAll}
                className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Reports list */}
        <div className="p-5 overflow-y-auto space-y-3 flex-1">
          {reports.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              <History className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              No saved audit reports yet. Enter a URL above to start auditing!
            </div>
          ) : (
            reports.map((report) => {
              const isActive = report.id === activeReportId;
              const overallScore = report.scores?.overall || 85;
              const dateStr = new Date(report.timestamp).toLocaleDateString();
              const timeStr = new Date(report.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={report.id}
                  className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    isActive
                      ? 'bg-blue-50/50 border-blue-300 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-11 h-11 rounded-xl bg-slate-900 text-white flex flex-col items-center justify-center shrink-0">
                      <span className="text-sm font-black leading-none">{overallScore}</span>
                      <span className="text-[9px] font-semibold text-slate-400">Score</span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900 truncate">
                          {report.domain}
                        </h4>
                        {isActive && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                            Currently Active
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <p className="text-xs text-slate-500 truncate max-w-md">{report.url}</p>
                        <button
                          type="button"
                          onClick={() => handleCopyUrl(report.url, report.id)}
                          className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer shrink-0"
                          title="Copy URL"
                        >
                          {copiedReportUrlId === report.id ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" /> {dateStr} at {timeStr}
                        </span>
                        <span>•</span>
                        <span className="text-slate-600 font-mono">
                          {report.statCounts?.errors || 0} errors, {report.statCounts?.warnings || 0} warnings
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Explicit 'Copy URL' button */}
                    <button
                      id={`copy-history-url-${report.id}`}
                      type="button"
                      onClick={() => handleCopyUrl(report.url, report.id)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                        copiedReportUrlId === report.id
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                          : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700'
                      }`}
                      title="Copy URL to clipboard"
                    >
                      {copiedReportUrlId === report.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-500" />
                          <span>Copy URL</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onSelectReport(report);
                        onClose();
                      }}
                      className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onRerunAudit(report.url);
                        onClose();
                      }}
                      className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                      title="Re-run live crawl"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeleteReport(report.id)}
                      className="p-2 rounded-lg border border-slate-200 hover:bg-rose-50 hover:border-rose-200 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                      title="Delete report"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
