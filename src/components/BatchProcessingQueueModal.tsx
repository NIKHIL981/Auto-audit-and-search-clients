import React from 'react';
import {
  X,
  Play,
  Pause,
  Square,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Clock,
  Sparkles,
  Bot,
  Zap,
  ChevronDown,
  ChevronUp,
  FileText,
  RefreshCw,
  ExternalLink,
  Minimize2,
  Maximize2,
} from 'lucide-react';
import { BatchQueueItem } from '../types';

interface BatchProcessingQueueModalProps {
  isOpen: boolean;
  queue: BatchQueueItem[];
  onClose: () => void;
  onPause: () => void;
  onResume: () => void;
  onCancel: () => void;
  onRetryItem: (prospectId: string) => void;
  onViewReport: (prospectId: string) => void;
  isPaused: boolean;
  isProcessing: boolean;
  currentIndex: number;
  isMinimized: boolean;
  onToggleMinimize: () => void;
}

export const BatchProcessingQueueModal: React.FC<BatchProcessingQueueModalProps> = ({
  isOpen,
  queue,
  onClose,
  onPause,
  onResume,
  onCancel,
  onRetryItem,
  onViewReport,
  isPaused,
  isProcessing,
  currentIndex,
  isMinimized,
  onToggleMinimize,
}) => {
  if (!isOpen || queue.length === 0) return null;

  const completedCount = queue.filter((item) => item.status === 'completed').length;
  const errorCount = queue.filter((item) => item.status === 'error').length;
  const pendingCount = queue.filter((item) => item.status === 'pending').length;
  const totalCount = queue.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const currentItem = queue.find((item) => item.status === 'auditing') || queue[currentIndex];

  // If minimized, display a persistent, sleek floating dock widget in bottom-right corner
  if (isMinimized) {
    return (
      <div className="fixed bottom-5 right-5 z-50 bg-slate-900/95 backdrop-blur-md text-white border border-slate-700 shadow-2xl rounded-2xl p-3.5 w-80 animate-slideUp">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            {isProcessing && !isPaused ? (
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
              </span>
            ) : isPaused ? (
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            )}
            <span className="text-xs font-black text-white">
              {isPaused ? 'Batch Queue Paused' : isProcessing ? 'Auditing Batch...' : 'Batch Completed'}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onToggleMinimize}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Expand Queue Details"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Close Queue"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>
              {completedCount} of {totalCount} done ({progressPercent}%)
            </span>
            {currentItem && isProcessing && (
              <span className="text-cyan-300 font-medium truncate max-w-[120px]">
                {currentItem.cname}
              </span>
            )}
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-300 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Mini Controls */}
        <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-slate-800 text-xs">
          <span className="text-[10px] text-slate-400">
            {pendingCount} remaining · {errorCount} errors
          </span>
          <div className="flex items-center gap-1.5">
            {isProcessing && (
              <button
                type="button"
                onClick={isPaused ? onResume : onPause}
                className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
              >
                {isPaused ? <Play className="w-3 h-3 text-emerald-400" /> : <Pause className="w-3 h-3 text-amber-400" />}
                <span>{isPaused ? 'Resume' : 'Pause'}</span>
              </button>
            )}
            <button
              type="button"
              onClick={onToggleMinimize}
              className="px-2 py-0.5 rounded-md bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-[11px] font-bold cursor-pointer"
            >
              View Queue
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-3xl w-full my-auto overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/20 text-cyan-300 border border-cyan-400/30">
              <Sparkles className="w-5 h-5 text-cyan-300" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                <span>Batch Processing Queue</span>
                <span className="px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px]">
                  {totalCount} Prospects
                </span>
              </div>
              <h2 className="text-lg font-black text-white">
                Automated Client Auditing &amp; Proposal Engine
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onToggleMinimize}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Minimize to floating widget"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close Queue Modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress & Overall Status Card */}
        <div className="p-5 bg-gradient-to-br from-slate-50 to-blue-50/40 border-b border-slate-200 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Overall Progress</span>
                {isProcessing && !isPaused && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Processing active
                  </span>
                )}
                {isPaused && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    <Pause className="w-3 h-3" />
                    Paused
                  </span>
                )}
                {!isProcessing && completedCount === totalCount && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3" />
                    All Audits Complete
                  </span>
                )}
              </div>
              <div className="text-2xl font-black text-slate-900 mt-0.5">
                {completedCount}{' '}
                <span className="text-sm font-semibold text-slate-500">of {totalCount} Audits Complete</span>
              </div>
            </div>

            {/* Batch Controls */}
            <div className="flex items-center gap-2">
              {isProcessing && (
                <>
                  <button
                    type="button"
                    onClick={isPaused ? onResume : onPause}
                    className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                  >
                    {isPaused ? (
                      <>
                        <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
                        <span>Resume Queue</span>
                      </>
                    ) : (
                      <>
                        <Pause className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        <span>Pause Queue</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={onCancel}
                    className="px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Square className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                    <span>Stop</span>
                  </button>
                </>
              )}
              {!isProcessing && pendingCount > 0 && (
                <button
                  type="button"
                  onClick={onResume}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-black flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Start Audit Queue ({pendingCount} pending)</span>
                </button>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1.5">
            <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden p-0.5">
              <div
                className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400 transition-all duration-300 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>{progressPercent}% completed</span>
              <span>
                {pendingCount} remaining · {errorCount > 0 ? `${errorCount} errors · ` : ''}
                Status: {isPaused ? 'Paused' : isProcessing ? 'Auditing websites & generating proposals' : 'Idle'}
              </span>
            </div>
          </div>
        </div>

        {/* Queue Items List with Granular Status Indicators */}
        <div className="flex-1 overflow-y-auto p-5 divide-y divide-slate-100">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider pb-2 flex items-center justify-between">
            <span>Prospects in Queue ({queue.length})</span>
            <span className="text-[11px] normal-case text-slate-500">Live Status per Report Generation Process</span>
          </div>

          {queue.map((item, index) => {
            const isAuditing = item.status === 'auditing';
            const isDone = item.status === 'completed';
            const isErr = item.status === 'error';
            const isPending = item.status === 'pending';

            return (
              <div
                key={item.prospectId}
                className={`py-3.5 px-3 rounded-2xl transition-colors flex items-center justify-between gap-3 ${
                  isAuditing
                    ? 'bg-blue-50/80 border border-blue-200/80 shadow-2xs'
                    : isDone
                    ? 'hover:bg-slate-50'
                    : 'hover:bg-slate-50 opacity-90'
                }`}
              >
                {/* Left: Queue Position & Prospect Details */}
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                      isDone
                        ? 'bg-emerald-100 text-emerald-800'
                        : isAuditing
                        ? 'bg-blue-600 text-white shadow-xs'
                        : isErr
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    ) : isAuditing ? (
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                    ) : (
                      index + 1
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-900 truncate">{item.cname}</h4>
                      <span className="text-[11px] font-mono text-slate-500 truncate hidden sm:inline">
                        {item.domain}
                      </span>
                    </div>

                    {/* Status details line */}
                    <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                      {isAuditing && (
                        <span className="text-blue-700 font-semibold flex items-center gap-1">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>Crawling DOM, evaluating Core Web Vitals &amp; generating proposal...</span>
                        </span>
                      )}
                      {isDone && item.report && (
                        <span className="text-emerald-700 font-medium flex items-center gap-1.5">
                          <span>Grade: <strong>{item.report.grade}</strong> ({item.report.overallScore}/100)</span>
                          <span>·</span>
                          <span>AI Readiness: <strong>{item.report.aiReadinessScore}%</strong></span>
                          <span>·</span>
                          <span className="text-slate-500">Status set to [Audit Ready]</span>
                        </span>
                      )}
                      {isErr && (
                        <span className="text-rose-600 font-semibold flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Audit failed: {item.error || 'Connection or timeout issue'}</span>
                        </span>
                      )}
                      {isPending && (
                        <span className="text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>Queued · Position #{index + 1}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Status Pill Indicator & Quick Action */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* Status Indicator Badge */}
                  {isAuditing && (
                    <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 border border-blue-300 text-[11px] font-bold flex items-center gap-1 animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping"></span>
                      <span>Auditing...</span>
                    </span>
                  )}

                  {isDone && (
                    <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 text-[11px] font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Audit Ready</span>
                    </span>
                  )}

                  {isErr && (
                    <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-800 border border-rose-300 text-[11px] font-bold flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                      <span>Error</span>
                    </span>
                  )}

                  {isPending && (
                    <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[11px] font-semibold flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>In Queue</span>
                    </span>
                  )}

                  {/* Actions */}
                  {isDone && (
                    <button
                      type="button"
                      onClick={() => onViewReport(item.prospectId)}
                      className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer border border-blue-200"
                    >
                      <FileText className="w-3.5 h-3.5 text-blue-600" />
                      <span>View Report</span>
                    </button>
                  )}

                  {isErr && (
                    <button
                      type="button"
                      onClick={() => onRetryItem(item.prospectId)}
                      className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer border border-rose-200"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Retry</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500">
            {completedCount > 0 && (
              <span className="text-emerald-700 font-bold">
                ✓ {completedCount} reports successfully saved with prospects and tagged as &lsquo;Audit Ready&rsquo;.
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onToggleMinimize}
              className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Minimize2 className="w-3.5 h-3.5" />
              <span>Minimize Queue</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all cursor-pointer"
            >
              Close Window
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
