import React, { useState } from 'react';
import {
  GitCompare,
  X,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { AuditReport } from '../types';

interface CompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  reports: AuditReport[];
}

export const CompareModal: React.FC<CompareModalProps> = ({
  isOpen,
  onClose,
  reports,
}) => {
  if (!isOpen) return null;

  const [idA, setIdA] = useState<string>(reports[0]?.id || '');
  const [idB, setIdB] = useState<string>(reports[1]?.id || reports[0]?.id || '');

  const reportA = reports.find((r) => r.id === idA) || reports[0];
  const reportB = reports.find((r) => r.id === idB) || reports[1] || reports[0];

  const renderDelta = (valA: number, valB: number, inverse?: boolean) => {
    const diff = valB - valA;
    if (diff === 0) {
      return (
        <span className="text-slate-400 flex items-center gap-0.5 text-xs font-semibold justify-end">
          <Minus className="w-3.5 h-3.5" /> 0
        </span>
      );
    }
    const isGood = inverse ? diff < 0 : diff > 0;
    if (isGood) {
      return (
        <span className="text-emerald-600 flex items-center gap-0.5 text-xs font-bold justify-end">
          <TrendingUp className="w-3.5 h-3.5" /> {diff > 0 ? `+${diff}` : `${diff}`}
        </span>
      );
    }
    return (
      <span className="text-rose-600 flex items-center gap-0.5 text-xs font-bold justify-end">
        <TrendingDown className="w-3.5 h-3.5" /> {diff > 0 ? `+${diff}` : `${diff}`}
      </span>
    );
  };

  const metrics = [
    { label: 'Overall Health Score', a: reportA?.scores?.overall || 0, b: reportB?.scores?.overall || 0 },
    { label: 'Technical SEO Score', a: reportA?.scores?.technical || 0, b: reportB?.scores?.technical || 0 },
    { label: 'Content Depth Score', a: reportA?.scores?.content || 0, b: reportB?.scores?.content || 0 },
    { label: 'Performance / CWV Score', a: reportA?.performance?.score || 0, b: reportB?.performance?.score || 0 },
    { label: 'AI Search Readiness Score', a: reportA?.scores?.aiReadiness || 0, b: reportB?.scores?.aiReadiness || 0 },
    { label: 'Critical Errors (Fewer is better)', a: reportA?.statCounts?.errors || 0, b: reportB?.statCounts?.errors || 0, inverse: true },
    { label: 'Word Count', a: reportA?.content?.wordCount || 0, b: reportB?.content?.wordCount || 0 },
    { label: 'Total Links Crawled', a: reportA?.linking?.totalLinks || 0, b: reportB?.linking?.totalLinks || 0 },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-4xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
              <GitCompare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Comparative Website Benchmark</h2>
              <p className="text-xs text-slate-500">
                Compare SEO metrics, schema health, and performance scores side-by-side
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Target Selectors */}
        <div className="p-5 border-b border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/50">
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Site A (Benchmark Target)
            </label>
            <select
              value={idA}
              onChange={(e) => setIdA(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {reports.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.domain} ({new Date(r.timestamp).toLocaleDateString()}) - {r.scores?.overall}/100
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Site B (Comparison Target)
            </label>
            <select
              value={idB}
              onChange={(e) => setIdB(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {reports.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.domain} ({new Date(r.timestamp).toLocaleDateString()}) - {r.scores?.overall}/100
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Metric Comparison Table */}
        <div className="p-5 overflow-y-auto flex-1">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase font-bold text-[10px]">
                <th className="py-2.5 px-3">Audit Metric</th>
                <th className="py-2.5 px-3 text-right">{reportA?.domain || 'Site A'}</th>
                <th className="py-2.5 px-3 text-right">{reportB?.domain || 'Site B'}</th>
                <th className="py-2.5 px-3 text-right">Variance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {metrics.map((m, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80">
                  <td className="py-3 px-3 font-medium text-slate-800">{m.label}</td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">{m.a}</td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">{m.b}</td>
                  <td className="py-3 px-3 text-right">
                    {renderDelta(m.a, m.b, m.inverse)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
};
