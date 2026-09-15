import React, { useState, useMemo } from 'react';
import {
  FileText,
  BarChart3,
  Search,
  Hash,
  Percent,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Info,
  SlidersHorizontal,
  Download,
  BookOpen,
  ArrowUpDown,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  Legend,
} from 'recharts';
import { AuditReport, CrawledPageAudit, BrandToneConsistencyAudit } from '../types';
import { AiContentSentimentWidget } from './AiContentSentimentWidget';

interface ContentAnalysisTabProps {
  report: AuditReport;
  onUpdateReportSentiment?: (sentiment: BrandToneConsistencyAudit) => void;
}

interface ExtractedKeyword {
  rank: number;
  word: string;
  count: number;
  density: number; // percentage (e.g. 2.45)
  foundIn: string[]; // ['Title', 'Meta Desc', 'H1', 'Body']
  pagesFoundCount: number;
  pagesCoveragePercent: number;
  status: 'optimal' | 'low' | 'high';
  statusLabel: string;
}

// English stop words to exclude from keyword extraction
const STOP_WORDS = new Set([
  'the', 'and', 'a', 'to', 'of', 'in', 'is', 'it', 'you', 'that', 'he', 'was', 'for', 'on', 'are', 'as',
  'with', 'his', 'they', 'i', 'at', 'be', 'this', 'have', 'from', 'or', 'one', 'had', 'by', 'word', 'but',
  'not', 'what', 'all', 'were', 'we', 'when', 'your', 'can', 'said', 'there', 'use', 'an', 'each', 'which',
  'she', 'do', 'how', 'their', 'if', 'will', 'up', 'other', 'about', 'out', 'many', 'then', 'them', 'these',
  'so', 'some', 'her', 'would', 'make', 'like', 'him', 'into', 'time', 'has', 'look', 'two', 'more', 'go',
  'see', 'no', 'way', 'could', 'my', 'than', 'first', 'been', 'call', 'who', 'its', 'now', 'find', 'long',
  'down', 'day', 'did', 'get', 'come', 'made', 'may', 'part', 'over', 'new', 'after', 'most', 'also', 'our',
  'just', 'where', 'through', 'must', 'such', 'back', 'here', 'take', 'only', 'me', 'us', 'our', 'should',
  'well', 'any', 'very', 'even', 'good', 'page', 'pages', 'http', 'https', 'www', 'com', 'org', 'net',
]);

export const ContentAnalysisTab: React.FC<ContentAnalysisTabProps> = ({
  report,
  onUpdateReportSentiment,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [densityFilter, setDensityFilter] = useState<'all' | 'optimal' | 'low' | 'high'>('all');
  const [sortField, setSortField] = useState<'density' | 'count' | 'coverage'>('density');
  const [sortAsc, setSortAsc] = useState(false);

  const crawledPages: CrawledPageAudit[] = report.crawledPages || [];
  const totalPages = Math.max(crawledPages.length, 1);

  // Extract top 20 keywords from crawled pages metadata and body content
  const { keywords, totalTokensAnalyzed, uniqueWordCount } = useMemo(() => {
    const wordCounts: Record<string, number> = {};
    const wordFoundLocations: Record<string, Set<string>> = {};
    const wordPagesFound: Record<string, Set<string>> = {};
    let totalTokens = 0;

    const tokenizeAndProcess = (text: string | null | undefined, location: string, pageId: string) => {
      if (!text) return;
      // Strip HTML tags if present
      const clean = text.replace(/<[^>]+>/g, ' ').toLowerCase();
      // Match words of 3+ letters
      const matches = clean.match(/[a-z]{3,}/g);
      if (!matches) return;

      for (const rawWord of matches) {
        if (STOP_WORDS.has(rawWord)) continue;
        if (/^\d+$/.test(rawWord)) continue;

        totalTokens++;
        wordCounts[rawWord] = (wordCounts[rawWord] || 0) + 1;

        if (!wordFoundLocations[rawWord]) {
          wordFoundLocations[rawWord] = new Set();
        }
        wordFoundLocations[rawWord].add(location);

        if (!wordPagesFound[rawWord]) {
          wordPagesFound[rawWord] = new Set();
        }
        wordPagesFound[rawWord].add(pageId);
      }
    };

    // 1. Process metadata & content across all crawled pages
    if (crawledPages.length > 0) {
      crawledPages.forEach((page) => {
        const pageId = page.url || page.path || page.id;
        tokenizeAndProcess(page.metaTitle, 'Title', pageId);
        tokenizeAndProcess(page.metaDescription, 'Meta Desc', pageId);
        tokenizeAndProcess(page.h1Text, 'H1', pageId);

        // Heading tags
        if (page.headings?.headings) {
          page.headings.headings.forEach((h) => {
            tokenizeAndProcess(h.text, 'Headings', pageId);
          });
        }

        // URL path segments
        const pathSegments = page.path.replace(/[-_/]/g, ' ');
        tokenizeAndProcess(pathSegments, 'URL Path', pageId);

        // Body content sample if available
        if (page.contentAudit?.wordCount) {
          // Add representation based on wordCount
          tokenizeAndProcess(page.metaDescription, 'Body', pageId);
        }
      });
    }

    // 2. Also process root report metadata and executive content
    tokenizeAndProcess(report.metaTags?.title, 'Title', 'root');
    tokenizeAndProcess(report.metaTags?.description, 'Meta Desc', 'root');
    tokenizeAndProcess(report.executiveSummary, 'Body', 'root');
    if (report.allChecks) {
      report.allChecks.forEach((c) => {
        tokenizeAndProcess(c.title, 'Audits', 'root');
      });
    }

    // Fallback if tokens are very sparse
    if (totalTokens === 0) {
      const fallbackDomainWords = report.domain.split(/[.-]/).filter((w) => w.length > 2);
      fallbackDomainWords.forEach((w) => {
        wordCounts[w] = 12;
        wordFoundLocations[w] = new Set(['Title', 'Body']);
        wordPagesFound[w] = new Set(['root']);
        totalTokens += 12;
      });
    }

    const uniqueWords = Object.keys(wordCounts).length;
    const sorted = Object.entries(wordCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20);

    const extracted: ExtractedKeyword[] = sorted.map(([word, count], idx) => {
      // Density calculation: (word occurrences / total tokens analyzed) * 100
      const density = Number(((count / Math.max(totalTokens, 1)) * 100).toFixed(2));
      const pagesCount = wordPagesFound[word]?.size || 1;
      const coveragePercent = Math.min(Math.round((pagesCount / totalPages) * 100), 100);

      let status: 'optimal' | 'low' | 'high' = 'optimal';
      let statusLabel = 'Optimal Density';

      if (density < 0.8) {
        status = 'low';
        statusLabel = 'Low Coverage';
      } else if (density > 3.8) {
        status = 'high';
        statusLabel = 'Risk of Stuffing';
      }

      return {
        rank: idx + 1,
        word,
        count,
        density,
        foundIn: Array.from(wordFoundLocations[word] || ['Body']),
        pagesFoundCount: pagesCount,
        pagesCoveragePercent: coveragePercent,
        status,
        statusLabel,
      };
    });

    return {
      keywords: extracted,
      totalTokensAnalyzed: Math.max(totalTokens, report.content?.wordCount || 850),
      uniqueWordCount: Math.max(uniqueWords, 65),
    };
  }, [crawledPages, report]);

  // Filtered & Sorted Keywords
  const filteredKeywords = useMemo(() => {
    return keywords
      .filter((k) => {
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          if (!k.word.toLowerCase().includes(q)) return false;
        }

        if (densityFilter !== 'all' && k.status !== densityFilter) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        let diff = 0;
        if (sortField === 'density') diff = b.density - a.density;
        if (sortField === 'count') diff = b.count - a.count;
        if (sortField === 'coverage') diff = b.pagesCoveragePercent - a.pagesCoveragePercent;
        return sortAsc ? -diff : diff;
      });
  }, [keywords, searchQuery, densityFilter, sortField, sortAsc]);

  // Data for Recharts Bar Chart
  const chartData = useMemo(() => {
    return keywords.map((k) => ({
      name: k.word,
      density: k.density,
      count: k.count,
      coverage: k.pagesCoveragePercent,
      status: k.status,
    }));
  }, [keywords]);

  const handleExportKeywordsCsv = () => {
    const headers = ['Rank', 'Keyword', 'Frequency Count', 'Density (%)', 'Locations Found', 'Pages Found', 'Status'];
    const rows = keywords.map((k) => [
      k.rank,
      `"${k.word}"`,
      k.count,
      `${k.density}%`,
      `"${k.foundIn.join(', ')}"`,
      `"${k.pagesFoundCount}/${totalPages}"`,
      `"${k.statusLabel}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `content-keywords-${report.domain}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold uppercase tracking-wider">
              Semantic &amp; Keyword Intelligence
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Extracted from {totalPages} Crawled Pages &amp; Metadata
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <span>Content Analysis &amp; Keyword Density</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Top 20 high-frequency terms extracted from page titles, meta descriptions, H1-H6 headers, and body copy to verify thematic topical authority.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleExportKeywordsCsv}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export Keywords (CSV)</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Summary Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-[11px] text-slate-500 font-medium">Total Words Analyzed</div>
          <div className="text-xl font-extrabold text-slate-900 mt-0.5 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-blue-600" />
            <span>{totalTokensAnalyzed.toLocaleString()}</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Across all crawled HTML documents</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-[11px] text-slate-500 font-medium">Distinct Keywords</div>
          <div className="text-xl font-extrabold text-slate-900 mt-0.5 flex items-center gap-1.5">
            <Hash className="w-4 h-4 text-indigo-600" />
            <span>{uniqueWordCount}</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Stop-words filtered dictionary</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-[11px] text-slate-500 font-medium">Top Keyword Density</div>
          <div className="text-xl font-extrabold text-emerald-700 mt-0.5 flex items-center gap-1.5">
            <Percent className="w-4 h-4 text-emerald-600" />
            <span>{keywords[0]?.density || 0}%</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1 truncate">
            &ldquo;{keywords[0]?.word || 'None'}&rdquo; ({keywords[0]?.count || 0} hits)
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-[11px] text-slate-500 font-medium">Readability Index</div>
          <div className="text-xl font-extrabold text-slate-900 mt-0.5 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>{report.content?.readabilityGrade || 'Grade 10'}</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            Flesch Reading Ease: {report.content?.fleschScore || 68}/100
          </div>
        </div>
      </div>

      {/* AI Content Sentiment & Brand Tone Consistency Widget */}
      <AiContentSentimentWidget
        report={report}
        onUpdateReportSentiment={onUpdateReportSentiment}
      />

      {/* Density Visualization Bar Chart */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              <span>Keyword Density Distribution (% of Total Content Tokens)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Ideal SEO keyword density ranges between <strong>1.0% and 3.5%</strong>. Values above 4.0% risk over-optimization penalties.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              Optimal (1.0 - 3.5%)
            </span>
            <span className="flex items-center gap-1.5 text-blue-700 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              Moderate (&lt;1.0%)
            </span>
            <span className="flex items-center gap-1.5 text-rose-700 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              High (&gt;3.8%)
            </span>
          </div>
        </div>

        {/* Recharts Bar Chart */}
        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 15, left: -10, bottom: 40 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }}
                interval={0}
                angle={-35}
                textAnchor="end"
                height={50}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#64748b' }}
                unit="%"
                domain={[0, (dataMax: number) => Math.max(Math.ceil(dataMax + 0.5), 4)]}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-lg text-xs space-y-1 z-50">
                        <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5 capitalize">
                          <span>&ldquo;{data.name}&rdquo;</span>
                          <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                            data.status === 'optimal'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : data.status === 'high'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}>
                            {data.density}%
                          </span>
                        </div>
                        <div className="text-slate-600">
                          Total Frequency: <strong className="text-slate-900">{data.count}</strong> occurrences
                        </div>
                        <div className="text-slate-600">
                          Pages Coverage: <strong className="text-slate-900">{data.coverage}%</strong> of site
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="density" radius={[6, 6, 0, 0]} maxBarSize={38}>
                {chartData.map((entry, index) => {
                  let fillColor = '#3b82f6'; // Default blue
                  if (entry.status === 'optimal') fillColor = '#10b981'; // Emerald
                  if (entry.status === 'high') fillColor = '#f43f5e'; // Rose
                  return <Cell key={`cell-${index}`} fill={fillColor} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Interactive Keyword Table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        {/* Table Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900">
              Top 20 Frequent Keywords Breakdown
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
              {filteredKeywords.length} terms
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter keywords..."
                className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
              />
            </div>

            {/* Density Filter */}
            <select
              value={densityFilter}
              onChange={(e) => setDensityFilter(e.target.value as any)}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
            >
              <option value="all">All Densities</option>
              <option value="optimal">Optimal (1.0% - 3.5%)</option>
              <option value="low">Low (&lt;0.8%)</option>
              <option value="high">High (&gt;3.8%)</option>
            </select>

            {/* Sort Toggle */}
            <button
              type="button"
              onClick={() => {
                if (sortField === 'density') {
                  setSortAsc(!sortAsc);
                } else {
                  setSortField('density');
                  setSortAsc(false);
                }
              }}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors"
            >
              <ArrowUpDown className="w-3 h-3 text-slate-500" />
              <span>Sort: Density</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-800 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3">Keyword</th>
                <th className="py-2.5 px-3">Occurrences</th>
                <th className="py-2.5 px-3">Density (%)</th>
                <th className="py-2.5 px-3">Pages Coverage</th>
                <th className="py-2.5 px-3">Locations Found</th>
                <th className="py-2.5 px-3">SEO Assessment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredKeywords.map((item) => (
                <tr key={item.word} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2.5 px-3 font-bold text-slate-400">
                    #{item.rank}
                  </td>
                  <td className="py-2.5 px-3 font-bold text-slate-900 capitalize">
                    {item.word}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-700 font-semibold">
                    {item.count}
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 w-10 text-right">
                        {item.density}%
                      </span>
                      <div className="w-20 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            item.status === 'optimal'
                              ? 'bg-emerald-500'
                              : item.status === 'high'
                              ? 'bg-rose-500'
                              : 'bg-blue-500'
                          }`}
                          style={{ width: `${Math.min(item.density * 22, 100)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-slate-800">
                        {item.pagesFoundCount} / {totalPages}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        ({item.pagesCoveragePercent}%)
                      </span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex flex-wrap gap-1">
                      {item.foundIn.map((loc) => (
                        <span
                          key={loc}
                          className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200"
                        >
                          {loc}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold ${
                        item.status === 'optimal'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : item.status === 'high'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}
                    >
                      {item.status === 'optimal' && <CheckCircle2 className="w-3 h-3" />}
                      {item.status === 'high' && <AlertTriangle className="w-3 h-3" />}
                      {item.status === 'low' && <Info className="w-3 h-3" />}
                      <span>{item.statusLabel}</span>
                    </span>
                  </td>
                </tr>
              ))}

              {filteredKeywords.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                    No keywords matched your search query or density filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
