import React from 'react';
import { Link2, Image, ExternalLink, Smartphone, AlertTriangle, CheckCircle2, ShieldCheck, Film } from 'lucide-react';
import { AuditReport } from '../types';
import { CheckAccordion } from './CheckAccordion';

interface LinksMediaTabProps {
  report: AuditReport;
  subCategory?: 'links' | 'media' | 'all';
}

export const LinksMediaTab: React.FC<LinksMediaTabProps> = ({ report, subCategory = 'all' }) => {
  const allChecks = report.allChecks?.filter((c) => c.category === 'links-media') || [];
  const linkChecks = allChecks.filter((c) => c.id.includes('link') || c.id.includes('mobile'));
  const mediaChecks = allChecks.filter((c) => c.id.includes('image') || c.id.includes('video'));

  const displayedChecks = subCategory === 'links' ? linkChecks : subCategory === 'media' ? mediaChecks : allChecks;

  const linking = report.linking;
  const images = report.images;
  const mobileParity = report.mobileParity;

  return (
    <div className="space-y-6">
      {/* Category Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
            {subCategory === 'media' ? <Image className="w-5 h-5" /> : <Link2 className="w-5 h-5" />}
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {subCategory === 'media' ? 'Media & Assets' : subCategory === 'links' ? 'Links & Navigation' : 'Links, Navigation & Media'}
            </h2>
            <p className="text-xs text-slate-500">
              Internal PageRank flow, outbound references, image optimization, and mobile navigation parity
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono text-slate-700">
            {linking?.totalLinks || 0} Links ({linking?.internalCount || 0} Internal)
          </span>
          <span className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono text-slate-700">
            {images?.totalImages || 0} Images
          </span>
        </div>
      </div>

      {/* Metrics Row: Links & Images Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Link Architecture Summary */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Link2 className="w-4 h-4 text-blue-600" />
              Link Distribution &amp; Equity
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              {linking?.totalLinks || 0} Total
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-[10px] uppercase font-bold text-slate-500">Internal</div>
              <div className="text-base font-black text-slate-900">{linking?.internalCount || 0}</div>
            </div>
            <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-[10px] uppercase font-bold text-slate-500">External</div>
              <div className="text-base font-black text-slate-900">{linking?.externalCount || 0}</div>
            </div>
            <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-[10px] uppercase font-bold text-slate-500">Nofollow</div>
              <div className="text-base font-black text-slate-900">{linking?.noFollowCount || 0}</div>
            </div>
            <div className={`p-2 rounded-xl border ${linking?.brokenLinkRisks ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-slate-50 border-slate-200'}`}>
              <div className="text-[10px] uppercase font-bold text-slate-500">Broken</div>
              <div className="text-base font-black">{linking?.brokenLinkRisks || 0}</div>
            </div>
          </div>

          {/* Link Attribute Quality Indicators */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
              <span className="text-slate-600">Secure Target Blank:</span>
              <span className="font-bold text-emerald-600 font-mono">
                {linking?.secureTargetBlankCount || 0} Valid
              </span>
            </div>
            <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
              <span className="text-slate-600">Generic Anchors:</span>
              <span className={`font-bold font-mono ${linking?.genericAnchorCount ? 'text-amber-600' : 'text-slate-700'}`}>
                {linking?.genericAnchorCount || 0} Flagged
              </span>
            </div>
          </div>

          {/* Sample links list */}
          {linking?.sampleLinks && linking.sampleLinks.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Sample Anchors &amp; Targets</div>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {linking.sampleLinks.map((l, i) => (
                  <div key={i} className="p-2 rounded-lg bg-slate-50 text-xs flex items-center justify-between gap-2 border border-slate-100">
                    <span className="truncate text-slate-800 font-medium max-w-[150px]">{l.text || '(Empty Anchor)'}</span>
                    <span className="text-[10px] font-mono text-slate-400 truncate max-w-[140px]">{l.href}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${l.isInternal ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>
                        {l.isInternal ? 'Internal' : 'Outbound'}
                      </span>
                      {l.isNoFollow && (
                        <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                          rel=nofollow
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Media & Images Summary */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Image className="w-4 h-4 text-emerald-600" />
              Image Assets &amp; Optimization
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              {images?.totalImages || 0} Assets
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="p-2 rounded-xl bg-emerald-50/50 border border-emerald-200">
              <div className="text-[10px] uppercase font-bold text-emerald-700">Modern</div>
              <div className="text-base font-black text-emerald-900">{images?.modernFormatCount || 0}</div>
              <div className="text-[8px] text-emerald-600 font-mono">WebP/AVIF</div>
            </div>
            <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-[10px] uppercase font-bold text-slate-500">Legacy</div>
              <div className="text-base font-black text-slate-900">{images?.legacyFormatCount || 0}</div>
              <div className="text-[8px] text-slate-500 font-mono">JPG/PNG</div>
            </div>
            <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-[10px] uppercase font-bold text-slate-500">Lazy Load</div>
              <div className="text-base font-black text-slate-900">{images?.lazyCount || 0}</div>
              <div className="text-[8px] text-slate-500 font-mono">loading="lazy"</div>
            </div>
            <div className={`p-2 rounded-xl border ${images?.missingAltCount ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-slate-50 border-slate-200'}`}>
              <div className="text-[10px] uppercase font-bold text-slate-500">No Alt</div>
              <div className="text-base font-black">{images?.missingAltCount || 0}</div>
              <div className="text-[8px] font-mono">A11y</div>
            </div>
          </div>

          {/* Detailed Image Samples */}
          {images?.sampleImages && images.sampleImages.length > 0 ? (
            <div className="space-y-1.5 pt-1">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Asset Inventory Sample ({images.sampleImages.length})
              </div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {images.sampleImages.map((img, i) => (
                  <div key={i} className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 truncate">
                      <div className="w-8 h-8 rounded bg-slate-200 shrink-0 overflow-hidden flex items-center justify-center">
                        <img
                          src={img.src}
                          alt={img.alt || 'Asset'}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      </div>
                      <div className="truncate">
                        <div className="font-mono text-[10px] text-slate-700 truncate max-w-[150px]">{img.src}</div>
                        <div className="text-[10px] text-slate-500 italic truncate">
                          {img.alt ? `Alt: "${img.alt}"` : <span className="text-rose-600 font-bold">Missing Alt</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[9px] font-bold font-mono px-1.5 py-0.5 rounded bg-slate-200 text-slate-800">
                        {img.format.toUpperCase()}
                      </span>
                      {img.isLazy && (
                        <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                          lazy
                        </span>
                      )}
                      {img.width && img.height && (
                        <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-slate-100 text-slate-600">
                          {img.width}x{img.height}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : images?.missingAltSamples && images.missingAltSamples.length > 0 ? (
            <div className="p-3 rounded-xl bg-rose-50/60 border border-rose-200 text-xs text-rose-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                Images lacking alt attributes:
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] font-mono text-rose-800 break-all">
                {images.missingAltSamples.map((src, i) => (
                  <li key={i}>{src}</li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>All images carry descriptive alt attributes for accessibility and visual search.</span>
            </div>
          )}
        </div>

      </div>

      {/* Accordion Checks */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Checks &amp; Validations ({displayedChecks.length})
          </h3>
          <span className="text-xs text-slate-400">Click any check to inspect findings &amp; fixes</span>
        </div>

        <div className="space-y-2.5">
          {displayedChecks.map((check, idx) => (
            <CheckAccordion key={check.id} check={check} defaultExpanded={idx === 0 || check.status === 'error'} />
          ))}
        </div>
      </div>
    </div>
  );
};
