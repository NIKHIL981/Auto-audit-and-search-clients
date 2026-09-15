import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  ChevronDown,
  Copy,
  Check,
  Code2,
  ExternalLink,
  HelpCircle,
  Lightbulb,
} from 'lucide-react';
import { AuditCheckItem, CheckStatus } from '../types';
import { copyTextToClipboard } from '../utils/clipboard';

interface CheckAccordionProps {
  check: AuditCheckItem;
  defaultExpanded?: boolean;
}

export const CheckAccordion: React.FC<CheckAccordionProps> = ({
  check,
  defaultExpanded = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [hasCopied, setHasCopied] = useState(false);

  const copyCode = async (code: string) => {
    const success = await copyTextToClipboard(code);
    if (success) {
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 2000);
    }
  };

  const getStatusBadge = (status: CheckStatus) => {
    switch (status) {
      case 'passed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Passed
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            Warning
          </span>
        );
      case 'error':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />
            Error
          </span>
        );
    }
  };

  const renderFoundContent = (data: any) => {
    if (data === null || data === undefined) {
      return <span className="text-slate-400 italic">None found</span>;
    }
    if (typeof data === 'string') {
      return <p className="text-sm font-mono text-slate-800 break-words">{data}</p>;
    }
    if (Array.isArray(data)) {
      if (data.length === 0) {
        return <span className="text-slate-400 italic">Empty array / No entries</span>;
      }
      return (
        <ul className="list-disc list-inside space-y-1 text-xs text-slate-700 font-mono">
          {data.map((item, idx) => (
            <li key={idx} className="break-all">
              {typeof item === 'object' ? JSON.stringify(item) : String(item)}
            </li>
          ))}
        </ul>
      );
    }
    if (typeof data === 'object') {
      return (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs font-mono text-slate-700 overflow-x-auto">
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
      );
    }
    return <span className="text-sm text-slate-800">{String(data)}</span>;
  };

  return (
    <div
      id={check.id}
      className={`border rounded-xl transition-all duration-200 bg-white ${
        isExpanded
          ? 'border-slate-300 shadow-sm'
          : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      {/* Collapsed Header / Trigger */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 cursor-pointer select-none"
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 min-w-0 flex-1">
          <div className="flex items-center gap-3">
            {getStatusBadge(check.status)}
            <h4 className="text-sm font-bold text-slate-900 truncate">
              {check.title}
            </h4>
          </div>
          <p className="text-xs text-slate-500 line-clamp-1 flex-1 sm:pl-2 sm:border-l sm:border-slate-200">
            {check.summary}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
              isExpanded ? 'transform rotate-180 text-slate-700' : ''
            }`}
          />
        </div>
      </button>

      {/* Expanded Details: 3 Mandated Sections */}
      {isExpanded && (
        <div className="px-5 pb-5 pt-1 border-t border-slate-100 space-y-4 text-slate-700">
          
          {/* 1. What we found */}
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-2 mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              1. What we found
            </div>
            <div className="text-xs text-slate-800">
              {renderFoundContent(check.whatWeFound)}
            </div>
          </div>

          {/* 2. Why it matters */}
          <div className="p-3.5 rounded-lg bg-blue-50/60 border border-blue-100">
            <div className="flex items-center gap-2 mb-1.5 text-xs font-bold uppercase tracking-wider text-blue-700">
              <Lightbulb className="w-3.5 h-3.5 text-blue-600" />
              2. Why it matters
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">
              {check.whyItMatters}
            </p>
          </div>

          {/* 3. How to fix it */}
          <div className="p-3.5 rounded-lg bg-emerald-50/50 border border-emerald-100">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                3. How to fix it
              </div>
              {check.codeSnippet && (
                <button
                  type="button"
                  onClick={() => copyCode(check.codeSnippet!)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-white hover:bg-slate-50 border border-slate-200 text-[11px] font-semibold text-slate-700 transition-colors shadow-2xs cursor-pointer"
                >
                  {hasCopied ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span className="text-emerald-700">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 text-slate-500" />
                      <span>Copy Snippet</span>
                    </>
                  )}
                </button>
              )}
            </div>
            <p className="text-xs text-slate-700 leading-relaxed mb-2">
              {check.howToFix}
            </p>

            {check.codeSnippet && (
              <div className="relative mt-2 rounded-md bg-slate-900 text-slate-100 p-3 text-xs font-mono overflow-x-auto shadow-inner">
                <div className="flex items-center justify-between text-[10px] text-slate-400 pb-1.5 mb-1.5 border-b border-slate-800">
                  <span className="flex items-center gap-1">
                    <Code2 className="w-3 h-3 text-cyan-400" /> Recommended Implementation
                  </span>
                </div>
                <pre className="text-emerald-400 leading-normal">{check.codeSnippet}</pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
