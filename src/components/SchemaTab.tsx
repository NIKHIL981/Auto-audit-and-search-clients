import React, { useState } from 'react';
import { Database, ShoppingBag, Layers, Code2, Copy, Check, CheckCircle2, AlertOctagon, AlertTriangle } from 'lucide-react';
import { AuditReport } from '../types';
import { CheckAccordion } from './CheckAccordion';
import { copyTextToClipboard } from '../utils/clipboard';

interface SchemaTabProps {
  report: AuditReport;
}

export const SchemaTab: React.FC<SchemaTabProps> = ({ report }) => {
  const checks = report.allChecks?.filter((c) => c.category === 'schema') || [];
  const structured = report.structuredData;
  const ecom = report.ecomValidation;
  const breadcrumb = report.breadcrumbValidation;

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyCode = async (text: string, id: string) => {
    const success = await copyTextToClipboard(text);
    if (success) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Category Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Schema &amp; Structured Data (JSON-LD)</h2>
            <p className="text-xs text-slate-500">
              Entity validation for Rich Results, Google Shopping Merchant eligibility, and BreadcrumbList markup
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono text-slate-700">
            {structured?.schemas?.length || 0} Schema Entities Detected
          </span>
        </div>
      </div>

      {/* Schema Entities Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Detected Schemas */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-600" />
              Detected Schema.org Types
            </h3>
            <span className="text-xs text-slate-500 font-mono">
              {structured?.detectedTypes?.length || 0} Types
            </span>
          </div>

          {structured?.detectedTypes && structured.detectedTypes.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {structured.detectedTypes.map((type, i) => (
                <span key={i} className="px-3 py-1.5 rounded-lg bg-purple-50 border border-purple-200 text-purple-800 text-xs font-semibold">
                  @{type}
                </span>
              ))}
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
              No Schema.org types found. Consider adding Organization or WebSite JSON-LD to confirm entity ownership.
            </div>
          )}

          {structured?.schemas && structured.schemas.length > 0 && (
            <div className="pt-2 space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Raw JSON-LD Snippet Preview</div>
              {structured.schemas.slice(0, 2).map((s, idx) => (
                <div key={idx} className="relative rounded-lg bg-slate-900 text-slate-100 p-3 text-xs font-mono">
                  <div className="flex items-center justify-between pb-1 mb-1 border-b border-slate-800 text-[10px] text-slate-400">
                    <span>@{s.type}</span>
                    <button
                      type="button"
                      onClick={() => copyCode(s.rawJson || '', `schema-${idx}`)}
                      className="inline-flex items-center gap-1 hover:text-white cursor-pointer"
                    >
                      {copiedId === `schema-${idx}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedId === `schema-${idx}` ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <pre className="text-emerald-400 max-h-32 overflow-y-auto">{s.rawJson}</pre>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* E-Commerce & Merchant Compliance Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-emerald-600" />
              E-Commerce &amp; Merchant Validation
            </h3>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
              ecom?.status === 'error' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}>
              {ecom?.hasProductSchema ? 'Product Schema Present' : 'Non-Retail / Standard'}
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-700 font-medium">GTIN / SKU Identifier</span>
              <span className={`font-semibold ${ecom?.missingGtin ? 'text-rose-600' : 'text-emerald-600'}`}>
                {ecom?.hasProductSchema ? (ecom.missingGtin ? 'Missing' : 'Valid') : 'N/A'}
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-700 font-medium">offers.price &amp; priceCurrency</span>
              <span className={`font-semibold ${ecom?.missingPrice ? 'text-rose-600' : 'text-emerald-600'}`}>
                {ecom?.hasProductSchema ? (ecom.missingPrice ? 'Missing' : 'Valid') : 'N/A'}
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-700 font-medium">offers.availability (InStock / OutOfStock)</span>
              <span className={`font-semibold ${ecom?.missingAvailability ? 'text-rose-600' : 'text-emerald-600'}`}>
                {ecom?.hasProductSchema ? (ecom.missingAvailability ? 'Missing' : 'Valid') : 'N/A'}
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-700 font-medium">aggregateRating (Rich Stars in SERP)</span>
              <span className={`font-semibold ${ecom?.missingAggregateRating ? 'text-amber-600' : 'text-emerald-600'}`}>
                {ecom?.hasProductSchema ? (ecom.missingAggregateRating ? 'Optional Missing' : 'Active') : 'N/A'}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Accordion Checks */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Structured Data Checks ({checks.length})
          </h3>
          <span className="text-xs text-slate-400">Click any check to inspect findings &amp; fixes</span>
        </div>

        <div className="space-y-2.5">
          {checks.map((check, idx) => (
            <CheckAccordion key={check.id} check={check} defaultExpanded={idx === 0 || check.status === 'error'} />
          ))}
        </div>
      </div>
    </div>
  );
};
