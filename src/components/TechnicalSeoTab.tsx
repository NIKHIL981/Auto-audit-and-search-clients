import React, { useState } from 'react';
import {
  FileCode,
  Tag,
  ListTree,
  Code2,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Info,
  Copy,
  Check,
  Search,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { AuditReport, Severity } from '../types';
import { copyTextToClipboard as safeCopy } from '../utils/clipboard';

interface TechnicalSeoTabProps {
  report: AuditReport;
}

export const TechnicalSeoTab: React.FC<TechnicalSeoTabProps> = ({ report }) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [showRawSchema, setShowRawSchema] = useState(false);
  const [selectedSchemaType, setSelectedSchemaType] = useState<'Organization' | 'FAQPage' | 'WebSite'>('Organization');

  const meta = report.metaTags;
  const headings = report.headings;
  const structured = report.structuredData;

  const copyToClipboard = async (text: string, id: string) => {
    const success = await safeCopy(text);
    if (success) {
      setCopiedCode(id);
      setTimeout(() => setCopiedCode(null), 2000);
    }
  };

  const generatedSchemaSnippet = selectedSchemaType === 'Organization'
    ? `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "${report.domain.replace(/\.[a-z]+$/, '').toUpperCase()}",
  "url": "${report.url}",
  "logo": "${report.url}/logo.png",
  "sameAs": [
    "https://twitter.com/${report.domain.replace(/\.[a-z]+$/, '')}",
    "https://linkedin.com/company/${report.domain.replace(/\.[a-z]+$/, '')}"
  ]
}
</script>`
    : selectedSchemaType === 'FAQPage'
    ? `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What services does ${report.domain} provide?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "${report.domain} offers modern web, AI, and digital software infrastructure."
      }
    },
    {
      "@type": "Question",
      "name": "How can I get started?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Visit ${report.url} to explore our documentation or register for an account."
      }
    }
  ]
}
</script>`
    : `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "${report.domain}",
  "url": "${report.url}",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "${report.url}/search?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
}
</script>`;

  const getStatusBadge = (status: Severity | string) => {
    if (status === 'passed') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 className="w-3 h-3" /> Passed
        </span>
      );
    }
    if (status === 'warning') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <AlertTriangle className="w-3 h-3" /> Warning
        </span>
      );
    }
    if (status === 'info') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
          <Info className="w-3 h-3" /> Info
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
        <AlertOctagon className="w-3 h-3" /> Critical
      </span>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Meta Tags Analysis */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Meta Tags &amp; Search Snippets</h2>
              <p className="text-xs text-slate-400">Page title, meta description, pixel width, and canonical integrity.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Title Tag */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Page Title</span>
              {getStatusBadge(meta.titleStatus)}
            </div>

            <div className="font-mono text-sm text-slate-100 bg-slate-900 p-2.5 rounded-lg border border-slate-800/80 break-words">
              {meta.title || <span className="text-rose-400 italic">No &lt;title&gt; tag found!</span>}
            </div>

            {/* Pixel length meter */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Length: <strong className="text-slate-200">{meta.titleLength}</strong> characters</span>
                <span>Est. Width: <strong className="text-slate-200">{meta.titlePixelWidthEst}px</strong> / 600px</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    meta.titleLength >= 40 && meta.titleLength <= 60
                      ? 'bg-emerald-500'
                      : meta.titleLength > 60
                      ? 'bg-amber-500'
                      : 'bg-rose-500'
                  }`}
                  style={{ width: `${Math.min(100, (meta.titlePixelWidthEst / 600) * 100)}%` }}
                />
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">{meta.titleMessage}</p>
          </div>

          {/* Meta Description */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Meta Description</span>
              {getStatusBadge(meta.descriptionStatus)}
            </div>

            <div className="font-mono text-sm text-slate-100 bg-slate-900 p-2.5 rounded-lg border border-slate-800/80 break-words max-h-24 overflow-y-auto">
              {meta.description || <span className="text-rose-400 italic">No &lt;meta name="description"&gt; found!</span>}
            </div>

            {/* Description Length Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Length: <strong className="text-slate-200">{meta.descriptionLength}</strong> characters</span>
                <span>Optimal: <span className="text-slate-300">120 - 160 chars</span></span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    meta.descriptionLength >= 120 && meta.descriptionLength <= 160
                      ? 'bg-emerald-500'
                      : meta.descriptionLength > 160
                      ? 'bg-amber-500'
                      : 'bg-rose-500'
                  }`}
                  style={{ width: `${Math.min(100, (meta.descriptionLength / 160) * 100)}%` }}
                />
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">{meta.descriptionMessage}</p>
          </div>

        </div>

        {/* Indexability & Directives Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-800/80">
          
          <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800/80">
            <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Canonical Tag</div>
            <div className="text-xs font-mono text-slate-200 truncate mt-1" title={meta.canonical || 'None'}>
              {meta.canonical || 'Not Declared'}
            </div>
            <div className="mt-1">{getStatusBadge(meta.canonicalStatus)}</div>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800/80">
            <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Robots Directives</div>
            <div className="text-xs font-mono text-slate-200 truncate mt-1">
              {meta.robotsMeta || 'Default (index, follow)'}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{meta.isIndexable ? 'Indexable' : 'Noindex'} &bull; {meta.isFollowable ? 'Followable' : 'Nofollow'}</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800/80">
            <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Mobile Viewport</div>
            <div className="text-xs font-mono text-slate-200 truncate mt-1">
              {meta.viewport || 'Default Mobile Ready'}
            </div>
            <div className="mt-1 flex items-center gap-1 text-xs text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Responsive Viewport Configured</span>
            </div>
          </div>

        </div>

        {/* Live SERP Snippet Preview */}
        <div className="mt-6 pt-4 border-t border-slate-800/80">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-cyan-400" />
            <span>Google SERP &amp; Snippet Preview</span>
          </div>

          <div className="p-4 rounded-xl bg-white text-slate-900 border border-slate-200 shadow-sm max-w-2xl font-sans">
            <div className="flex items-center gap-2 text-xs text-slate-600 mb-1">
              <div className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center text-[9px] font-bold text-slate-700">
                G
              </div>
              <span className="truncate">{report.domain} &rsaquo; page</span>
            </div>
            <h3 className="text-base text-[#1a0dab] hover:underline font-normal cursor-pointer leading-snug line-clamp-1">
              {meta.title || `${report.domain} - Official Site`}
            </h3>
            <p className="text-xs text-[#4d5156] mt-1 leading-relaxed line-clamp-2">
              {meta.description || 'Discover more information about our services, products, and insights on the official website.'}
            </p>
          </div>
        </div>

      </div>

      {/* 2. Heading Hierarchy */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <ListTree className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Heading Hierarchy (H1 - H6)</h2>
              <p className="text-xs text-slate-400">Semantic document structure for accessibility and search extractors.</p>
            </div>
          </div>
          {getStatusBadge(headings.status)}
        </div>

        {/* Heading Count Badges */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-4">
          {[
            { level: 'H1', count: headings.h1Count, optimal: headings.h1Count === 1 },
            { level: 'H2', count: headings.h2Count, optimal: headings.h2Count >= 1 },
            { level: 'H3', count: headings.h3Count, optimal: true },
            { level: 'H4', count: headings.h4Count, optimal: true },
            { level: 'H5', count: headings.h5Count, optimal: true },
            { level: 'H6', count: headings.h6Count, optimal: true },
          ].map((h) => (
            <div
              key={h.level}
              className={`p-2.5 rounded-xl border text-center ${
                h.level === 'H1' && h.count !== 1
                  ? 'bg-rose-500/10 border-rose-500/30'
                  : 'bg-slate-950/60 border-slate-800'
              }`}
            >
              <div className="text-[11px] font-bold text-slate-400">{h.level}</div>
              <div className="text-lg font-extrabold text-slate-100">{h.count}</div>
            </div>
          ))}
        </div>

        {/* Warning if 0 or >1 H1s */}
        {headings.h1Count === 0 && (
          <div className="p-3.5 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
            <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0" />
            <span><strong>Critical:</strong> Missing primary &lt;h1&gt; heading. Add one prominent H1 representing the page topic.</span>
          </div>
        )}
        {headings.h1Count > 1 && (
          <div className="p-3.5 mb-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span><strong>Warning:</strong> Found {headings.h1Count} H1 headings. Demote secondary headers to H2 for clearer hierarchy.</span>
          </div>
        )}

        {/* Heading Outline Tree */}
        <div className="space-y-1.5 max-h-64 overflow-y-auto p-3 rounded-xl bg-slate-950/70 border border-slate-800/90 font-mono text-xs">
          {headings.headings && headings.headings.length > 0 ? (
            headings.headings.map((h, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 py-1 px-2 rounded hover:bg-slate-900 transition-colors text-slate-300"
                style={{ paddingLeft: `${(h.level - 1) * 16 + 8}px` }}
              >
                <span
                  className={`px-1.5 py-0.5 text-[10px] font-bold rounded shrink-0 ${
                    h.level === 1
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      : h.level === 2
                      ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  H{h.level}
                </span>
                <span className="truncate">{h.text}</span>
              </div>
            ))
          ) : (
            <div className="text-slate-500 italic py-3 text-center">No headings discovered in page body.</div>
          )}
        </div>
      </div>

      {/* 3. Schema & Structured Data */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Structured Data &amp; Schema.org</h2>
              <p className="text-xs text-slate-400">JSON-LD entities powering Rich Results and Knowledge Graph grounding.</p>
            </div>
          </div>
          {getStatusBadge(structured.status)}
        </div>

        {/* Detected Schemas Pills */}
        <div className="mb-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Detected Entities:</div>
          <div className="flex items-center gap-2 flex-wrap">
            {structured.detectedTypes && structured.detectedTypes.length > 0 ? (
              structured.detectedTypes.map((type, i) => (
                <span
                  key={i}
                  className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-medium flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {type}
                </span>
              ))
            ) : (
              <span className="text-xs text-amber-400 italic">No structured data found. Generate recommended schemas below.</span>
            )}
          </div>
        </div>

        {/* Schema Generator Helper */}
        <div className="mt-4 p-4 rounded-xl bg-slate-950/80 border border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div>
              <span className="text-xs font-bold text-slate-200">Schema Generator &amp; Boilerplate</span>
              <p className="text-[11px] text-slate-400">Tailored JSON-LD ready to embed directly in your &lt;head&gt;.</p>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-lg border border-slate-800">
              {(['Organization', 'FAQPage', 'WebSite'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedSchemaType(type)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                    selectedSchemaType === type
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <pre className="p-3.5 rounded-lg bg-slate-900 text-cyan-200 text-xs font-mono overflow-x-auto border border-slate-800 max-h-48 leading-relaxed">
              {generatedSchemaSnippet}
            </pre>
            <button
              onClick={() => copyToClipboard(generatedSchemaSnippet, 'schema-snippet')}
              className="absolute top-2.5 right-2.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold rounded flex items-center gap-1 border border-slate-700 transition-colors cursor-pointer"
            >
              {copiedCode === 'schema-snippet' ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
