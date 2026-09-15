import React, { useState } from 'react';
import {
  FileText,
  Tag,
  Hash,
  AlignLeft,
  Sparkles,
  Share2,
  Globe,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  SlidersHorizontal,
  ExternalLink,
} from 'lucide-react';
import { AuditReport } from '../types';
import { SerpSimulator } from './SerpSimulator';
import { HeadingTree } from './HeadingTree';
import { CheckAccordion } from './CheckAccordion';

interface OnPageTabProps {
  report: AuditReport;
}

export const OnPageTab: React.FC<OnPageTabProps> = ({ report }) => {
  const [socialPlatform, setSocialPlatform] = useState<'facebook' | 'twitter'>('facebook');
  const onPageChecks = report.allChecks?.filter((c) => c.category === 'on-page') || [];
  const meta = report.metaTags;
  const content = report.content;
  const keywords = report.keywords || [];

  const og = meta?.openGraph;
  const tw = meta?.twitterCard;

  const socialTitle = (socialPlatform === 'twitter' ? tw?.title : og?.title) || meta?.title || report.domain;
  const socialDesc = (socialPlatform === 'twitter' ? tw?.description : og?.description) || meta?.description || '';
  const socialImage = (socialPlatform === 'twitter' ? tw?.image : og?.image) || null;

  return (
    <div className="space-y-6">
      {/* Category Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
            <Tag className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">On-Page Meta, Content &amp; Social</h2>
            <p className="text-xs text-slate-500">
              Analysis of meta titles, descriptions, Open Graph &amp; Twitter cards, heading hierarchies, readability, and keywords
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 text-xs">
          <div className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 font-mono text-slate-700">
            {content?.wordCount || 0} words
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 font-mono text-slate-700">
            {content?.fleschScore ? `${content.fleschScore}/100 Readability` : `${content?.textToHtmlRatio || 15}% text-to-code`}
          </div>
        </div>
      </div>

      {/* 1. SERP Simulator Sandbox */}
      <SerpSimulator
        initialTitle={meta?.title || ''}
        initialDescription={meta?.description || ''}
        url={report.url}
        domain={report.domain}
      />

      {/* 2. Social Share Previews (Open Graph & Twitter Cards) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Social Media Share Preview &amp; Protocol</h3>
              <p className="text-xs text-slate-500">
                Live preview for Facebook, LinkedIn, iMessage, and X/Twitter social snippets
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setSocialPlatform('facebook')}
              className={`px-3 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                socialPlatform === 'facebook' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
              }`}
            >
              Open Graph (FB / LinkedIn)
            </button>
            <button
              type="button"
              onClick={() => setSocialPlatform('twitter')}
              className={`px-3 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                socialPlatform === 'twitter' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
              }`}
            >
              X / Twitter Card
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Visual Card Preview */}
          <div className="lg:col-span-7">
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 shadow-2xs max-w-lg mx-auto">
              {socialImage ? (
                <div className="aspect-[1.91/1] w-full bg-slate-200 overflow-hidden relative">
                  <img
                    src={socialImage}
                    alt="Social preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>
              ) : (
                <div className="aspect-[1.91/1] w-full bg-gradient-to-br from-slate-100 to-slate-200 flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                  <Share2 className="w-8 h-8 mb-2 opacity-50 text-indigo-500" />
                  <span className="text-xs font-medium text-slate-600">No og:image or twitter:image detected</span>
                  <span className="text-[11px] text-slate-400 mt-0.5">Recommended 1200 x 630px image</span>
                </div>
              )}

              <div className="p-4 bg-white border-t border-slate-100 space-y-1">
                <div className="text-[11px] uppercase tracking-wider font-mono text-slate-400">
                  {report.domain}
                </div>
                <h4 className="text-sm font-bold text-slate-900 line-clamp-1 leading-snug">
                  {socialTitle}
                </h4>
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {socialDesc || 'No social description provided. Platforms will crawl page copy.'}
                </p>
              </div>
            </div>
          </div>

          {/* Social Tags Inspector */}
          <div className="lg:col-span-5 space-y-3">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Detected Social Protocol Tags
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex items-center justify-between text-slate-500 font-mono text-[11px]">
                  <span>og:title</span>
                  {og?.title ? (
                    <span className="text-emerald-600 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Configured
                    </span>
                  ) : (
                    <span className="text-amber-600 font-bold flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Falling back
                    </span>
                  )}
                </div>
                <div className="font-mono text-slate-800 break-words">{og?.title || meta?.title || 'None'}</div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex items-center justify-between text-slate-500 font-mono text-[11px]">
                  <span>og:image</span>
                  {og?.image ? (
                    <span className="text-emerald-600 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Present
                    </span>
                  ) : (
                    <span className="text-rose-600 font-bold flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Missing
                    </span>
                  )}
                </div>
                <div className="font-mono text-slate-800 truncate">{og?.image || 'None detected'}</div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex items-center justify-between text-slate-500 font-mono text-[11px]">
                  <span>twitter:card</span>
                  <span className="font-bold text-slate-700">{tw?.card || 'summary_large_image'}</span>
                </div>
                <div className="text-slate-600 text-[11px]">
                  {tw?.site ? `Handle: ${tw.site}` : 'Site handle: Not specified'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Document Head & Readability Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Document Technical Meta */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-600" />
              Document Technical Head
            </h3>
            <span className="text-xs text-slate-400 font-mono">HTML Directives</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-600">HTML Language (&lt;html lang&gt;):</span>
              <span className="font-mono font-bold text-slate-900">{meta?.htmlLang || 'en (default)'}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-600">Document Charset:</span>
              <span className="font-mono font-bold text-slate-900">{meta?.charset || 'UTF-8'}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-600">Viewport Meta Tag:</span>
              <span className="font-mono font-bold text-emerald-600">{meta?.viewport ? 'Responsive' : 'Missing'}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-600">Favicon Shortcut:</span>
              <span className="font-mono font-bold text-slate-900 truncate max-w-[180px]">
                {meta?.favicon || 'Default / None'}
              </span>
            </div>
            {meta?.author && (
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-600">Author Attribution:</span>
                <span className="font-semibold text-slate-900">{meta.author}</span>
              </div>
            )}
            {meta?.themeColor && (
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-600">Browser Theme Color:</span>
                <span className="font-mono font-bold text-slate-900">{meta.themeColor}</span>
              </div>
            )}
          </div>
        </div>

        {/* Readability & Content Comprehension */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-600" />
              Content Readability &amp; Depth
            </h3>
            <span className="text-xs text-slate-400 font-mono">Flesch Formula</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200">
              <div className="text-[10px] uppercase font-bold text-emerald-700">Reading Ease Score</div>
              <div className="text-2xl font-black text-emerald-900">{content?.fleschScore || 68}/100</div>
              <div className="text-[10px] font-semibold text-emerald-700 mt-0.5">
                {content?.readabilityGrade || 'Standard Readability'}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-[10px] uppercase font-bold text-slate-500">Est. Reading Time</div>
              <div className="text-2xl font-black text-slate-900">{content?.readingTimeMinutes || 2} min</div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                {content?.characterCount ? `${content.characterCount.toLocaleString()} characters` : 'Optimal pace'}
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed pt-1">
            Scores between 60 and 70 represent plain English accessible to 8th-9th grade readers, maximizing retention and reducing bounce rates.
          </p>
        </div>
      </div>

      {/* 4. Heading Tree Visualizer */}
      <HeadingTree headingAudit={report.headings} />

      {/* 5. Keyword Density & Topical Depth */}
      {keywords.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
                <Hash className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Topical Keywords &amp; Density</h3>
                <p className="text-xs text-slate-500">Prominent keyword phrases and stuffing check (&gt;5.0% threshold)</p>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-slate-500">
              Evaluated on {content?.wordCount || 0} body words
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {keywords.map((kw, i) => (
              <div
                key={i}
                className={`p-3 rounded-xl border flex flex-col justify-between ${
                  kw.isStuffed
                    ? 'bg-rose-50/50 border-rose-200'
                    : 'bg-slate-50/50 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="font-mono text-xs font-bold text-slate-900 truncate">
                    {kw.phrase}
                  </span>
                  {kw.isStuffed && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-600 text-white shrink-0">
                      Stuffed
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>Count: {kw.count}</span>
                  <span className="font-semibold text-slate-700">{kw.densityPercent}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. The Core Accordion Checks */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            On-Page Audit Checks ({onPageChecks.length})
          </h3>
          <span className="text-xs text-slate-400">Click any check to inspect findings &amp; fixes</span>
        </div>

        <div className="space-y-2.5">
          {onPageChecks.map((check, idx) => (
            <CheckAccordion key={check.id} check={check} defaultExpanded={idx === 0 || check.status === 'error'} />
          ))}
        </div>
      </div>
    </div>
  );
};
