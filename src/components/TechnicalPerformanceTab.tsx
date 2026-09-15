import React from 'react';
import { Gauge, Shield, Eye, Cpu, CheckCircle2, AlertTriangle, AlertOctagon, Activity, HelpCircle, Sparkles } from 'lucide-react';
import { AuditReport } from '../types';
import { CheckAccordion } from './CheckAccordion';
import { SeoTooltip } from './SeoTooltip';

interface TechnicalPerformanceTabProps {
  report: AuditReport;
  onAskAssistant?: (query: string) => void;
}

export const TechnicalPerformanceTab: React.FC<TechnicalPerformanceTabProps> = ({ report, onAskAssistant }) => {
  const checks = report.allChecks?.filter((c) => c.category === 'performance') || [];
  const cwv = report.performance;
  const security = report.security;
  const accessibility = report.accessibility;
  const csr = report.csrRendering;

  return (
    <div className="space-y-6">
      {/* Category Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
            <Gauge className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Technical, Security &amp; Performance</h2>
            <p className="text-xs text-slate-500">
              Core Web Vitals metrics, SSL/HSTS encryption, WCAG accessibility, and client-side rendering (CSR) evaluation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono font-semibold text-slate-700">
            CWV Score: {cwv?.score || 85}/100
          </span>
        </div>
      </div>

      {/* Core Web Vitals Deep Dive Cards */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-600" />
            <SeoTooltip term="cwv" showIcon>
              Core Web Vitals Performance Breakdown
            </SeoTooltip>
          </h3>
          <span className="text-xs text-slate-500">Google Search Ranking Signals</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          
          {/* LCP Card */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1">
              <SeoTooltip term="lcp" showIcon className="text-xs font-bold uppercase text-slate-500">
                Largest Contentful Paint (LCP)
              </SeoTooltip>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                cwv?.lcpRating === 'good' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                {cwv?.lcpRating || 'good'}
              </span>
            </div>
            <div className="text-2xl font-black text-slate-900 my-1">{cwv?.lcpEstimate || 1.8}s</div>
            <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 mt-1">
              <p className="text-[11px] text-slate-500">Threshold: &le; 2.5s for Good</p>
              {onAskAssistant && (
                <button
                  type="button"
                  onClick={() => onAskAssistant('How can I improve the LCP score of this page?')}
                  className="text-[10px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer bg-emerald-50 hover:bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-200"
                  title="Ask SEO Assistant how to improve LCP score"
                >
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  <span>Ask AI</span>
                </button>
              )}
            </div>
          </div>

          {/* INP Card */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1">
              <SeoTooltip term="inp" showIcon className="text-xs font-bold uppercase text-slate-500">
                Interaction to Next Paint (INP)
              </SeoTooltip>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
                good
              </span>
            </div>
            <div className="text-2xl font-black text-slate-900 my-1">{cwv?.inpEstimate || 110}ms</div>
            <p className="text-[11px] text-slate-500">Threshold: &le; 200ms for Good score</p>
          </div>

          {/* CLS Card */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1">
              <SeoTooltip term="cls" showIcon className="text-xs font-bold uppercase text-slate-500">
                Cumulative Layout Shift (CLS)
              </SeoTooltip>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                cwv?.clsRating === 'good' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}>
                {cwv?.clsRating || 'good'}
              </span>
            </div>
            <div className="text-2xl font-black text-slate-900 my-1">{cwv?.clsEstimate || 0.03}</div>
            <p className="text-[11px] text-slate-500">Threshold: &le; 0.1 for Good score</p>
          </div>

        </div>
      </div>

      {/* Security & Accessibility & CSR Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Security Summary */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
            <Shield className="w-4 h-4 text-emerald-600" />
            Security &amp; Protocol
          </div>
          <div className="text-xs space-y-1.5 text-slate-600">
            <div className="flex items-center justify-between">
              <span>HTTPS Encrypted:</span>
              <span className="font-semibold text-emerald-600">{security?.isHttps ? 'Yes' : 'No'}</span>
            </div>
            <div className="flex items-center justify-between">
              <SeoTooltip term="hsts" showIcon className="text-slate-600">
                <span>HSTS Preload Header:</span>
              </SeoTooltip>
              <span className="font-semibold text-slate-800">{security?.hasHsts ? 'Active' : 'Disabled'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Mixed Content:</span>
              <span className={`font-semibold ${security?.mixedContentCount ? 'text-rose-600' : 'text-emerald-600'}`}>
                {security?.mixedContentCount ? `${security.mixedContentCount} Risks` : '0 Clean'}
              </span>
            </div>
          </div>
        </div>

        {/* Accessibility Summary */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
            <Eye className="w-4 h-4 text-blue-600" />
            <SeoTooltip term="wcag" showIcon>
              WCAG Accessibility
            </SeoTooltip>
          </div>
          <div className="text-xs space-y-1.5 text-slate-600">
            <div className="flex items-center justify-between">
              <span>Inputs Lacking Labels:</span>
              <span className="font-semibold text-slate-800">{accessibility?.inputsMissingLabels || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Buttons Lacking Aria:</span>
              <span className="font-semibold text-slate-800">{accessibility?.buttonsMissingAria || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Viewport Zoom Scaling:</span>
              <span className="font-semibold text-emerald-600">
                {accessibility?.userScalableDisabled ? 'Disabled (Risk)' : 'Allowed'}
              </span>
            </div>
          </div>
        </div>

        {/* Client-Side Rendering (CSR) Summary */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
            <Cpu className="w-4 h-4 text-purple-600" />
            <SeoTooltip term="csr" showIcon>
              CSR vs SSR Vulnerability
            </SeoTooltip>
          </div>
          <div className="text-xs space-y-1.5 text-slate-600">
            <div className="flex items-center justify-between">
              <span>Raw HTML has H1:</span>
              <span className="font-semibold text-emerald-600">{csr?.rawHasH1 ? 'Yes (Server-rendered)' : 'No'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>CSR Dependent Content:</span>
              <span className={`font-semibold ${csr?.isCsrVulnerable ? 'text-rose-600' : 'text-emerald-600'}`}>
                {csr?.isCsrVulnerable ? 'Critical Risk' : 'None / Hydrated'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Server-Sent HTML:</span>
              <span className="font-mono text-slate-700">{Math.round((csr?.rawHtmlLength || 5000) / 1024)} KB</span>
            </div>
          </div>
        </div>

      </div>

      {/* Deep-Dive HTTP Security Headers & Server Response */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-600" />
            HTTP Security Headers &amp; Server Hardening
          </h3>
          <span className="text-xs text-slate-400 font-mono">OWASP Defense Headers</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800">Strict-Transport-Security</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${security?.hasHsts ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                {security?.hasHsts ? 'Enforced' : 'Missing'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-mono truncate">
              {security?.hstsValue || (security?.hasHsts ? 'max-age=31536000; includeSubDomains' : 'Not configured')}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800">Content-Security-Policy</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${security?.hasCsp ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                {security?.hasCsp ? 'Active' : 'Optional / Missing'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-mono truncate">
              {security?.cspValue || (security?.hasCsp ? 'default-src \'self\'' : 'No CSP policy header')}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800">X-Frame-Options (Clickjack)</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${security?.hasXFrameOptions ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}`}>
                {security?.hasXFrameOptions ? 'Protected' : 'Not Sent'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-mono truncate">
              {security?.xFrameOptionsValue || (security?.hasXFrameOptions ? 'SAMEORIGIN' : 'Allows embedding')}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800">X-Content-Type-Options</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${security?.hasXContentTypeOptions ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}`}>
                {security?.hasXContentTypeOptions ? 'nosniff' : 'Not Sent'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-mono truncate">
              Prevents MIME sniffing attacks
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800">Server Banner Header</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                {security?.serverHeader ? 'Exposed' : 'Hidden'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-mono truncate">
              {security?.serverHeader || 'Masked / Protected'}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800">Cache-Control Header</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                Caching
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-mono truncate">
              {security?.cacheControlHeader || 'public, max-age=3600'}
            </p>
          </div>
        </div>
      </div>

      {/* Accordion Checks */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Technical &amp; Performance Checks ({checks.length})
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
