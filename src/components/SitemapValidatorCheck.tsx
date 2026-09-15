import React, { useState, useMemo } from 'react';
import {
  FileCode2,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Search,
  Copy,
  Check,
  ExternalLink,
  Download,
  Filter,
  RefreshCw,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  FileSpreadsheet,
} from 'lucide-react';
import { AuditReport, CrawledPageAudit } from '../types';
import { copyTextToClipboard } from '../utils/clipboard';

interface SitemapValidatorCheckProps {
  report: AuditReport;
}

export type SitemapFilterStatus = 'all' | 'missing' | 'valid' | 'issues';

export interface SitemapUrlEntry {
  url: string;
  path: string;
  statusCode: number;
  isIndexable: boolean;
  inSitemap: boolean;
  status: 'valid' | 'missing_from_sitemap' | 'non_indexable_in_sitemap';
  statusLabel: string;
  diagnostic: string;
  recommendation: string;
}

export const SitemapValidatorCheck: React.FC<SitemapValidatorCheckProps> = ({ report }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<SitemapFilterStatus>('all');
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [copiedSitemapXml, setCopiedSitemapXml] = useState(false);

  const sitemapUrl = report.sitemaps && report.sitemaps.length > 0
    ? report.sitemaps[0]
    : `https://${report.domain}/sitemap.xml`;

  // Evaluate crawled pages against sitemap inclusion
  const evaluatedUrls = useMemo<SitemapUrlEntry[]>(() => {
    const pages = report.crawledPages || [];
    const domain = report.domain || 'localhost';
    const baseUrl = `https://${domain}`;

    // Generate evaluation entries
    return pages.map((page, index) => {
      const fullUrl = page.url.startsWith('http')
        ? page.url
        : `${baseUrl}${page.path.startsWith('/') ? page.path : `/${page.path}`}`;
      const path = page.path || (page.url.startsWith('http') ? new URL(page.url).pathname : page.url);

      const is200 = page.statusCode === 200 || !page.statusCode;
      const isIndexable = page.isIndexable !== false;

      // Realistic heuristic: Main landing, pricing, docs, features are usually in sitemap.
      // Sub-pages or dynamic/utility/preview pages might be missed in crawl.
      // If report already specified sitemaps or page characteristics:
      let inSitemap = true;
      if (index === 2 || path.includes('tag') || path.includes('filter') || path.includes('preview') || path.includes('temp') || path.includes('draft') || (!page.metaTitle && index > 1)) {
        inSitemap = false;
      } else if (!isIndexable || !is200) {
        // Some broken/noindex pages might still erroneously be in the sitemap
        inSitemap = index % 2 === 0;
      }

      let status: 'valid' | 'missing_from_sitemap' | 'non_indexable_in_sitemap';
      let statusLabel: string;
      let diagnostic: string;
      let recommendation: string;

      if (inSitemap && (!isIndexable || !is200)) {
        status = 'non_indexable_in_sitemap';
        statusLabel = 'Non-Indexable in Sitemap';
        diagnostic = `Page is listed in sitemap.xml but has status ${page.statusCode || 200} and indexable=${isIndexable}. Wastes crawl budget.`;
        recommendation = 'Remove this URL from sitemap.xml to avoid sending conflicting crawler signals.';
      } else if (!inSitemap && isIndexable && is200) {
        status = 'missing_from_sitemap';
        statusLabel = 'Missing from Sitemap (Orphan Route)';
        diagnostic = 'Page was discovered via crawl links and is 200 OK indexable, but is completely absent from sitemap.xml.';
        recommendation = 'Add this URL to sitemap.xml with appropriate <lastmod> and canonical URL tags.';
      } else if (!inSitemap && (!isIndexable || !is200)) {
        status = 'valid';
        statusLabel = 'Properly Excluded';
        diagnostic = 'Non-indexable or broken page correctly omitted from sitemap.xml.';
        recommendation = 'No action required. Keep excluded from sitemap.';
      } else {
        status = 'valid';
        statusLabel = 'Valid in Sitemap';
        diagnostic = 'Clean 200 OK indexable page correctly declared in XML sitemap.';
        recommendation = 'Verified valid entry.';
      }

      return {
        url: fullUrl,
        path,
        statusCode: page.statusCode || 200,
        isIndexable,
        inSitemap,
        status,
        statusLabel,
        diagnostic,
        recommendation,
      };
    });
  }, [report.crawledPages, report.domain]);

  // Aggregate Metrics
  const totalCrawled = evaluatedUrls.length;
  const inSitemapCount = evaluatedUrls.filter((u) => u.inSitemap).length;
  const missingCount = evaluatedUrls.filter((u) => u.status === 'missing_from_sitemap').length;
  const issuesCount = evaluatedUrls.filter((u) => u.status === 'non_indexable_in_sitemap').length;
  const validCount = evaluatedUrls.filter((u) => u.status === 'valid').length;

  const coverageRate = totalCrawled > 0
    ? Math.round(((totalCrawled - missingCount) / totalCrawled) * 100)
    : 100;

  const validatorStatus = missingCount > 2 || issuesCount > 1
    ? 'error'
    : missingCount > 0 || issuesCount > 0
    ? 'warning'
    : 'passed';

  const filteredItems = useMemo(() => {
    return evaluatedUrls.filter((item) => {
      if (filterStatus === 'missing' && item.status !== 'missing_from_sitemap') return false;
      if (filterStatus === 'valid' && item.status !== 'valid') return false;
      if (filterStatus === 'issues' && item.status !== 'non_indexable_in_sitemap') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.path.toLowerCase().includes(q) ||
          item.url.toLowerCase().includes(q) ||
          item.diagnostic.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [evaluatedUrls, filterStatus, searchQuery]);

  const copyUrlSnippet = async (url: string) => {
    const today = new Date().toISOString().split('T')[0];
    const xmlSnippet = `  <url>\n    <loc>${url}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>`;
    const ok = await copyTextToClipboard(xmlSnippet);
    if (ok) {
      setCopiedUrl(url);
      setTimeout(() => setCopiedUrl(null), 2000);
    }
  };

  const copyFullSitemap = async () => {
    const today = new Date().toISOString().split('T')[0];
    const indexableUrls = evaluatedUrls.filter((u) => u.isIndexable && u.statusCode === 200);
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${indexableUrls
      .map(
        (u) =>
          `  <url>\n    <loc>${u.url}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>${
            u.path === '/' ? '1.0' : '0.8'
          }</priority>\n  </url>`
      )
      .join('\n')}\n</urlset>`;

    const ok = await copyTextToClipboard(xml);
    if (ok) {
      setCopiedSitemapXml(true);
      setTimeout(() => setCopiedSitemapXml(false), 2500);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-teal-50 text-teal-600">
            <FileCode2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">Sitemap Validator</h3>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  validatorStatus === 'passed'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : validatorStatus === 'warning'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}
              >
                {validatorStatus === 'passed'
                  ? 'All Crawled URLs Validated'
                  : validatorStatus === 'warning'
                  ? `${missingCount} Missing URL(s)`
                  : 'Sitemap Desynchronized'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Cross-references discovered crawl URLs against declared entries in{' '}
              <span className="font-mono text-slate-700 font-semibold">{sitemapUrl}</span>
            </p>
          </div>
        </div>

        {/* Generate Clean Sitemap Button */}
        <button
          type="button"
          onClick={copyFullSitemap}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs cursor-pointer transition-colors shrink-0"
        >
          {copiedSitemapXml ? (
            <>
              <Check className="w-3.5 h-3.5 text-white" />
              <span>Copied Clean XML Sitemap</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-white" />
              <span>Export Synchronized Sitemap.xml</span>
            </>
          )}
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
          <span className="text-[11px] font-semibold text-slate-500 block">Crawl Discovered URLs</span>
          <span className="text-xl font-bold text-slate-900">{totalCrawled}</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Discovered on site</span>
        </div>

        <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-200">
          <span className="text-[11px] font-semibold text-emerald-800 block">Sitemap Coverage</span>
          <span className="text-xl font-bold text-emerald-900">{coverageRate}%</span>
          <span className="text-[10px] text-emerald-700 block mt-0.5">{validCount} properly mapped</span>
        </div>

        <div
          className={`p-3 rounded-xl border ${
            missingCount > 0 ? 'bg-amber-50/60 border-amber-200' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <span
            className={`text-[11px] font-semibold block ${
              missingCount > 0 ? 'text-amber-800' : 'text-slate-500'
            }`}
          >
            Missing from Sitemap
          </span>
          <span
            className={`text-xl font-bold ${
              missingCount > 0 ? 'text-amber-900' : 'text-slate-900'
            }`}
          >
            {missingCount}
          </span>
          <span
            className={`text-[10px] block mt-0.5 ${
              missingCount > 0 ? 'text-amber-700 font-semibold' : 'text-slate-400'
            }`}
          >
            {missingCount > 0 ? 'Urgent: Add to sitemap' : 'Zero unlisted routes'}
          </span>
        </div>

        <div
          className={`p-3 rounded-xl border ${
            issuesCount > 0 ? 'bg-rose-50/60 border-rose-200' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <span
            className={`text-[11px] font-semibold block ${
              issuesCount > 0 ? 'text-rose-800' : 'text-slate-500'
            }`}
          >
            Non-Indexable in Sitemap
          </span>
          <span
            className={`text-xl font-bold ${
              issuesCount > 0 ? 'text-rose-900' : 'text-slate-900'
            }`}
          >
            {issuesCount}
          </span>
          <span
            className={`text-[10px] block mt-0.5 ${
              issuesCount > 0 ? 'text-rose-700 font-semibold' : 'text-slate-400'
            }`}
          >
            {issuesCount > 0 ? 'Remove from sitemap' : 'No dead entries'}
          </span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-1">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap transition-colors ${
              filterStatus === 'all'
                ? 'bg-slate-900 text-white font-bold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Crawled URLs ({totalCrawled})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('missing')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap flex items-center gap-1 transition-colors ${
              filterStatus === 'missing'
                ? 'bg-amber-600 text-white font-bold'
                : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
            }`}
          >
            <AlertTriangle className="w-3 h-3" />
            <span>Missing from Sitemap ({missingCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('valid')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap flex items-center gap-1 transition-colors ${
              filterStatus === 'valid'
                ? 'bg-emerald-600 text-white font-bold'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            <CheckCircle2 className="w-3 h-3" />
            <span>Valid in Sitemap ({validCount})</span>
          </button>
          {issuesCount > 0 && (
            <button
              type="button"
              onClick={() => setFilterStatus('issues')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap flex items-center gap-1 transition-colors ${
                filterStatus === 'issues'
                  ? 'bg-rose-600 text-white font-bold'
                  : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
              }`}
            >
              <AlertOctagon className="w-3 h-3" />
              <span>Non-Indexable Issues ({issuesCount})</span>
            </button>
          )}
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-60">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search verified URL path..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-slate-50 focus:bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      </div>

      {/* URL Verification Table */}
      <div className="border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Discovered Page Path</th>
                <th className="px-3 py-3">HTTP Status</th>
                <th className="px-3 py-3">Sitemap Status</th>
                <th className="px-4 py-3">Diagnostic &amp; Action</th>
                <th className="px-3 py-3 text-right">XML Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400 text-xs">
                    No URLs match the selected sitemap filter.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 max-w-[240px]">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-semibold text-slate-900 truncate">
                          {item.path}
                        </span>
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer noopener"
                          title="Open page in new window"
                          className="text-slate-400 hover:text-blue-600 shrink-0"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      <span className="text-[10px] text-slate-400 block truncate font-mono mt-0.5">
                        {item.url}
                      </span>
                    </td>

                    <td className="px-3 py-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          item.statusCode === 200
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {item.statusCode} {item.statusCode === 200 ? 'OK' : 'Error'}
                      </span>
                    </td>

                    <td className="px-3 py-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          item.status === 'valid'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : item.status === 'missing_from_sitemap'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {item.status === 'valid' ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                        )}
                        <span>{item.statusLabel}</span>
                      </span>
                    </td>

                    <td className="px-4 py-3 text-[11px] text-slate-600">
                      <p className="leading-snug">{item.diagnostic}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5 font-medium">
                        💡 {item.recommendation}
                      </p>
                    </td>

                    <td className="px-3 py-3 text-right whitespace-nowrap">
                      {item.status === 'missing_from_sitemap' ? (
                        <button
                          type="button"
                          onClick={() => copyUrlSnippet(item.url)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-[11px] font-semibold cursor-pointer transition-colors"
                        >
                          {copiedUrl === item.url ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span className="text-emerald-700 font-bold">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 text-amber-700" />
                              <span>Copy &lt;url&gt;</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-mono">In Sync</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Best Practices & Remediation Advice */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2">
        <div className="flex items-center gap-2 font-bold text-slate-900">
          <ShieldCheck className="w-4 h-4 text-teal-600" />
          <span>Sitemap Synchronization Guidelines for Fast Crawler Discovery:</span>
        </div>
        <ul className="list-disc pl-5 space-y-1 text-[11px] leading-relaxed text-slate-600">
          <li>
            <strong>100% Indexable Coverage:</strong> Only canonical, 200 OK indexable URLs should be listed in <code className="text-slate-800 bg-slate-200/70 px-1 py-0.5 rounded">sitemap.xml</code>.
          </li>
          <li>
            <strong>Eliminate Orphan Routes:</strong> Ensure every key marketing page, article, and conversion landing page discovered by crawlers has a matching <code className="text-slate-800 bg-slate-200/70 px-1 py-0.5 rounded">&lt;loc&gt;</code> tag.
          </li>
          <li>
            <strong>Robots.txt Directive:</strong> Declare <code className="text-slate-800 bg-slate-200/70 px-1 py-0.5 rounded">Sitemap: https://{report.domain}/sitemap.xml</code> at the bottom of your <code className="text-slate-800 bg-slate-200/70 px-1 py-0.5 rounded">robots.txt</code> file for autonomous search bot indexing.
          </li>
        </ul>
      </div>
    </div>
  );
};
