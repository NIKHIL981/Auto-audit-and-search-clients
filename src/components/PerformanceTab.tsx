import React from 'react';
import {
  Gauge,
  Image,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  AlertOctagon,
  Clock,
  Layout,
  MousePointerClick,
  Sparkles,
} from 'lucide-react';
import { AuditReport } from '../types';

interface PerformanceTabProps {
  report: AuditReport;
}

export const PerformanceTab: React.FC<PerformanceTabProps> = ({ report }) => {
  const perf = report.performance;
  const images = report.images;
  const security = report.security;

  const getRatingBadge = (rating: 'good' | 'needs-improvement' | 'poor') => {
    if (rating === 'good') {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
          Good
        </span>
      );
    }
    if (rating === 'needs-improvement') {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/30">
          Needs Improvement
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-500/10 text-rose-400 border border-rose-500/30">
        Poor
      </span>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Core Web Vitals Breakdown */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Gauge className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Core Web Vitals (CWV) &amp; Speed</h2>
              <p className="text-xs text-slate-400">User experience thresholds based on Google CrUX &amp; Lighthouse metrics.</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-300 font-semibold px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700">
            <span>Score:</span>
            <span className="text-emerald-400 font-bold">{perf.score}/100</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* LCP Card */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">LCP</span>
              </div>
              {getRatingBadge(perf.lcpRating)}
            </div>

            <div>
              <div className="text-2xl font-extrabold text-white tracking-tight">
                {perf.lcpEstimate}s
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Largest Contentful Paint</div>
            </div>

            {/* Threshold Bar */}
            <div className="space-y-1">
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden flex">
                <div className="bg-emerald-500 h-full w-[45%]" title="Good (<= 2.5s)" />
                <div className="bg-amber-500 h-full w-[35%]" title="Needs Improvement (2.5s - 4.0s)" />
                <div className="bg-rose-500 h-full w-[20%]" title="Poor (> 4.0s)" />
              </div>
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>0s</span>
                <span>2.5s</span>
                <span>4.0s+</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Measures perceived load speed when the largest visual text/image block renders on screen.
            </p>
          </div>

          {/* INP / FID Card */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MousePointerClick className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">INP / FID</span>
              </div>
              {getRatingBadge(perf.inpRating)}
            </div>

            <div>
              <div className="text-2xl font-extrabold text-white tracking-tight">
                {perf.inpEstimate}ms
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Interaction to Next Paint</div>
            </div>

            {/* Threshold Bar */}
            <div className="space-y-1">
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden flex">
                <div className="bg-emerald-500 h-full w-[40%]" title="Good (<= 200ms)" />
                <div className="bg-amber-500 h-full w-[40%]" title="Needs Improvement (200ms - 500ms)" />
                <div className="bg-rose-500 h-full w-[20%]" title="Poor (> 500ms)" />
              </div>
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>0ms</span>
                <span>200ms</span>
                <span>500ms+</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Assesses responsiveness to user clicks, taps, and keypresses on the page.
            </p>
          </div>

          {/* CLS Card */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layout className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">CLS</span>
              </div>
              {getRatingBadge(perf.clsRating)}
            </div>

            <div>
              <div className="text-2xl font-extrabold text-white tracking-tight">
                {perf.clsEstimate}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Cumulative Layout Shift</div>
            </div>

            {/* Threshold Bar */}
            <div className="space-y-1">
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden flex">
                <div className="bg-emerald-500 h-full w-[40%]" title="Good (<= 0.1)" />
                <div className="bg-amber-500 h-full w-[35%]" title="Needs Improvement (0.1 - 0.25)" />
                <div className="bg-rose-500 h-full w-[25%]" title="Poor (> 0.25)" />
              </div>
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>0</span>
                <span>0.1</span>
                <span>0.25+</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Measures visual stability and unexpected jumps while assets and banners load.
            </p>
          </div>

        </div>
      </div>

      {/* 2. Image Optimization Check */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Image className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Image Optimization &amp; Alt Tags</h2>
              <p className="text-xs text-slate-400">Accessibility compliance, modern compression formats, and payload size.</p>
            </div>
          </div>
          <span
            className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
              images.missingAltCount === 0
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            }`}
          >
            {images.missingAltCount === 0 ? 'All Alt Tags Present' : `${images.missingAltCount} Missing Alt Tags`}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="text-[11px] text-slate-400 uppercase font-semibold">Total Discovered Images</div>
            <div className="text-xl font-bold text-white mt-1">{images.totalImages}</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="text-[11px] text-slate-400 uppercase font-semibold">Next-Gen Formats (WebP/AVIF)</div>
            <div className="text-xl font-bold text-emerald-400 mt-1">{images.modernFormatCount}</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="text-[11px] text-slate-400 uppercase font-semibold">Legacy Formats (JPG/PNG)</div>
            <div className="text-xl font-bold text-amber-400 mt-1">{images.legacyFormatCount}</div>
          </div>
        </div>

        {/* Affected Image Samples */}
        {images.missingAltSamples && images.missingAltSamples.length > 0 && (
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
            <div className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Sample Images Missing Descriptive Alt Attributes:</span>
            </div>
            <div className="space-y-1 text-xs font-mono text-slate-300">
              {images.missingAltSamples.map((src, i) => (
                <div key={i} className="truncate p-1.5 rounded bg-slate-900 border border-slate-800/80">
                  {src}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 3. HTTPS / SSL & Security Status */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${security.isHttps ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'} border`}>
              {security.isHttps ? <ShieldCheck className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-white">HTTPS &amp; Transport Security</h2>
              <p className="text-xs text-slate-400">SSL/TLS encryption certificate, mixed content risk, and HSTS headers.</p>
            </div>
          </div>
          <span
            className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
              security.isHttps && security.mixedContentCount === 0
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
            }`}
          >
            {security.isHttps ? 'SSL Active' : 'Insecure Connection'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>SSL Encryption Handshake</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Traffic is securely encrypted using TLS protocols to protect user session data.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
              {security.mixedContentCount === 0 ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertOctagon className="w-4 h-4 text-rose-400" />
              )}
              <span>Mixed Content Verification</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {security.mixedContentCount === 0
                ? 'Zero unencrypted HTTP asset requests detected on the page.'
                : `Detected ${security.mixedContentCount} unencrypted HTTP assets.`}
            </p>
          </div>
        </div>

      </div>

    </div>
  );
};
