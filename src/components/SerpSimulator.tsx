import React, { useState } from 'react';
import { Search, RotateCcw, AlertTriangle, CheckCircle2, Globe, Sliders } from 'lucide-react';

interface SerpSimulatorProps {
  initialTitle: string;
  initialDescription: string;
  url: string;
  domain: string;
}

export const SerpSimulator: React.FC<SerpSimulatorProps> = ({
  initialTitle,
  initialDescription,
  url,
  domain,
}) => {
  const [title, setTitle] = useState(initialTitle || domain);
  const [description, setDescription] = useState(initialDescription || 'No description provided.');
  const [isSandboxOpen, setIsSandboxOpen] = useState(false);

  React.useEffect(() => {
    setTitle(initialTitle || domain);
    setDescription(initialDescription || 'No description provided.');
  }, [initialTitle, initialDescription, domain]);

  // Estimate Google SERP pixel width for title (standard ~600px cutoff)
  const titlePixelWidth = Math.round(title.length * 9.5);
  const isTitleTruncated = titlePixelWidth > 580 || title.length > 60;
  const isDescTruncated = description.length > 155;

  const handleReset = () => {
    setTitle(initialTitle || domain);
    setDescription(initialDescription || 'No description provided.');
  };

  const getCleanDomainBreadcrumb = () => {
    try {
      const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
      return `${parsed.protocol}//${parsed.hostname}${parsed.pathname === '/' ? '' : ' › ' + parsed.pathname.slice(1)}`;
    } catch {
      return `https://${domain}`;
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
            <Search className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">SERP Simulator (Google Search Preview)</h3>
            <p className="text-xs text-slate-500">Live preview of how your page appears on Google organic search results</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsSandboxOpen(!isSandboxOpen)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
        >
          <Sliders className="w-3.5 h-3.5 text-slate-500" />
          {isSandboxOpen ? 'Hide Sandbox' : 'Test Changes'}
        </button>
      </div>

      {/* Realistic Google Search Card */}
      <div className="p-4 sm:p-5 rounded-xl bg-slate-50/50 border border-slate-200/80 max-w-2xl font-sans space-y-1.5">
        {/* Favicon & Breadcrumb */}
        <div className="flex items-center gap-2 text-[13px] text-slate-600">
          <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 shrink-0">
            <Globe className="w-3 h-3 text-slate-500" />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-1.5 leading-tight">
            <span className="font-medium text-slate-800 text-xs">{domain}</span>
            <span className="hidden sm:inline text-slate-400">•</span>
            <span className="text-[12px] text-slate-500 truncate max-w-sm">
              {getCleanDomainBreadcrumb()}
            </span>
          </div>
        </div>

        {/* Title Link (Blue) */}
        <div>
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="text-[18px] sm:text-[20px] leading-snug font-medium text-[#1a0dab] hover:underline cursor-pointer block break-words"
          >
            {isTitleTruncated ? `${title.slice(0, 58)}...` : title}
          </a>
        </div>

        {/* Description Snippet */}
        <p className="text-[14px] leading-normal text-[#4d5156] break-words">
          {isDescTruncated ? `${description.slice(0, 155)}...` : description}
        </p>

        {/* Truncation warning indicator */}
        <div className="pt-2 flex flex-wrap items-center gap-3 text-[11px]">
          <span className={`inline-flex items-center gap-1 font-semibold ${isTitleTruncated ? 'text-amber-600' : 'text-emerald-600'}`}>
            {isTitleTruncated ? <AlertTriangle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
            Title: {title.length} chars (~{titlePixelWidth}px / max 600px)
          </span>
          <span className="text-slate-300">•</span>
          <span className={`inline-flex items-center gap-1 font-semibold ${isDescTruncated ? 'text-amber-600' : 'text-emerald-600'}`}>
            {isDescTruncated ? <AlertTriangle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
            Description: {description.length} chars (opt: 120-155)
          </span>
        </div>
      </div>

      {/* Interactive "Test changes" Sandbox */}
      {isSandboxOpen && (
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Interactive Title &amp; Description Sandbox
            </span>
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 font-medium cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" /> Reset to Original
            </button>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="sandbox-title" className="font-semibold text-slate-700">Meta Title</label>
              <span className={`font-mono ${title.length > 60 ? 'text-rose-600 font-bold' : 'text-slate-500'}`}>
                {title.length}/60 chars
              </span>
            </div>
            <input
              id="sandbox-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              placeholder="Enter page title..."
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="sandbox-desc" className="font-semibold text-slate-700">Meta Description</label>
              <span className={`font-mono ${description.length > 155 ? 'text-rose-600 font-bold' : 'text-slate-500'}`}>
                {description.length}/155 chars
              </span>
            </div>
            <textarea
              id="sandbox-desc"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              placeholder="Enter meta description..."
            />
          </div>
        </div>
      )}
    </div>
  );
};
