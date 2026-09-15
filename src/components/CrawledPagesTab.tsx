import React, { useState, useMemo, useEffect } from 'react';
import {
  FileText,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Clock,
  ExternalLink,
  ChevronRight,
  Code2,
  Tag,
  Hash,
  Image as ImageIcon,
  Copy,
  Check,
  Globe,
  Layers,
  ArrowUpDown,
  ShieldAlert,
  HelpCircle,
  Eye,
  SlidersHorizontal,
  LayoutGrid,
  ArrowRight,
  Sparkles,
  Download,
  FileSpreadsheet,
  Bot,
  Ban,
  Flag,
  FlagOff,
  Undo2,
  X,
} from 'lucide-react';
import { CrawledPageAudit, AuditReport, AuditIssue } from '../types';
import { PageDetailView } from './PageDetailView';

// Helper function to evaluate the AI-readiness score and health status for each crawled page
export function getPageAiReadiness(
  page: CrawledPageAudit,
  siteAiScore: number = 85
): {
  score: number;
  status: 'green' | 'yellow' | 'red';
  dotColor: string;
  badgeClass: string;
  label: string;
  tooltip: string;
} {
  // If broken or 400+, critical crawl failure for AI bots
  if (page.statusCode >= 400 || page.statusCode === 0) {
    return {
      score: 25,
      status: 'red',
      dotColor: 'bg-rose-500 shadow-[0_0_0_2px_rgba(244,63,94,0.35)]',
      badgeClass: 'bg-rose-50 text-rose-800 border-rose-200',
      label: 'Critical / Inaccessible',
      tooltip: `HTTP ${page.statusCode}: Completely inaccessible to AI search crawlers`,
    };
  }

  // If blocked or noindex
  if (
    !page.isIndexable ||
    (page.robotsDirectives && page.robotsDirectives.toLowerCase().includes('noindex'))
  ) {
    return {
      score: 35,
      status: 'red',
      dotColor: 'bg-rose-500 shadow-[0_0_0_2px_rgba(244,63,94,0.35)]',
      badgeClass: 'bg-rose-50 text-rose-800 border-rose-200',
      label: 'Blocked from AI Index',
      tooltip: 'Robots or meta tags exclude this page from search indexing & AI training',
    };
  }

  // Base AI Readiness calculation
  let score = siteAiScore || 85;

  // Title tag readiness (crucial for LLM retrieval grounding)
  if (!page.metaTitle || page.metaTitle.trim().length === 0) {
    score -= 15;
  } else if (page.metaTitleLength < 15 || page.metaTitleLength > 70) {
    score -= 5;
  }

  // Description readiness (used for AI citation context)
  if (!page.metaDescription || page.metaDescription.trim().length === 0) {
    score -= 12;
  } else if (page.metaDescriptionLength < 40) {
    score -= 5;
  }

  // Semantic hierarchy
  if (page.h1Count === 0) {
    score -= 14;
  } else if (page.h1Count > 1) {
    score -= 6;
  }

  // Informational density & length for LLM answer synthesis
  if (page.wordCount < 80) {
    score -= 16;
  } else if (page.wordCount < 200) {
    score -= 8;
  } else if (page.wordCount >= 400) {
    score += 6;
  }

  // Multimodal alt tags
  if (page.missingAltCount > 0) {
    score -= Math.min(10, page.missingAltCount * 3);
  }

  // Schema presence gives significant boost for machine readability
  if (page.schemasDetected && page.schemasDetected.length > 0) {
    score += 8;
  }

  // Error count penalties
  if (page.errorCount > 0) {
    score -= page.errorCount * 6;
  }

  // Clamp between 15 and 99
  const finalScore = Math.max(15, Math.min(99, Math.round(score)));

  if (finalScore >= 80) {
    return {
      score: finalScore,
      status: 'green',
      dotColor: 'bg-emerald-500 shadow-[0_0_0_2px_rgba(16,185,129,0.35)]',
      badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      label: 'Optimal AI-Readiness',
      tooltip: `AI Score: ${finalScore}/100. Strong semantic structure, metadata, and crawlability for AI Overviews.`,
    };
  } else if (finalScore >= 60) {
    return {
      score: finalScore,
      status: 'yellow',
      dotColor: 'bg-amber-400 shadow-[0_0_0_2px_rgba(245,158,11,0.35)]',
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
      label: 'Moderate AI-Readiness',
      tooltip: `AI Score: ${finalScore}/100. Partially optimized; address missing meta tags or thin content.`,
    };
  } else {
    return {
      score: finalScore,
      status: 'red',
      dotColor: 'bg-rose-500 shadow-[0_0_0_2px_rgba(244,63,94,0.35)]',
      badgeClass: 'bg-rose-50 text-rose-800 border-rose-200',
      label: 'Low AI-Readiness',
      tooltip: `AI Score: ${finalScore}/100. Low content density, structural flaws, or missing indexing signals.`,
    };
  }
}

interface CrawledPagesTabProps {
  report: AuditReport;
  onSelectIssue?: (issue: AuditIssue) => void;
  onUpdatePages?: (updatedPages: CrawledPageAudit[]) => void;
}

export const CrawledPagesTab: React.FC<CrawledPagesTabProps> = ({ report, onSelectIssue, onUpdatePages }) => {
  const [pagesState, setPagesState] = useState<CrawledPageAudit[]>(report.crawledPages || []);
  const [viewMode, setViewMode] = useState<'directory' | 'detail'>('directory');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'internal' | 'external' | 'broken'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'clean' | 'warnings' | 'errors'>('all');
  const [indexFilter, setIndexFilter] = useState<'all' | 'indexable' | 'non-indexable'>('all');
  const [missingFilter, setMissingFilter] = useState<'all' | 'title' | 'description' | 'alt'>('all');
  const [reviewFilter, setReviewFilter] = useState<'all' | 'active' | 'flagged' | 'excluded'>('all');
  const [sortBy, setSortBy] = useState<'score-asc' | 'score-desc' | 'issues-desc' | 'time-desc' | 'path-asc' | 'ai-desc' | 'ai-asc' | 'flagged-first'>('issues-desc');
  const [selectedPage, setSelectedPage] = useState<CrawledPageAudit | null>(report.crawledPages?.[0] || null);
  const [copiedSnippetId, setCopiedSnippetId] = useState<string | null>(null);
  const [isExportingCsv, setIsExportingCsv] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  // Batch selection state
  const [selectedPageIds, setSelectedPageIds] = useState<Set<string>>(new Set());
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' } | null>(null);

  // Sync pagesState if report updates externally
  useEffect(() => {
    if (report.crawledPages) {
      setPagesState(report.crawledPages);
      if (!selectedPage && report.crawledPages.length > 0) {
        setSelectedPage(report.crawledPages[0]);
      }
    }
  }, [report.crawledPages]);

  const showToast = (text: string, type: 'success' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const getPageKey = (p: { id?: string; url: string }) => p.id || p.url;

  // Toggle selection for a single page
  const toggleSelectPage = (pageKey: string) => {
    setSelectedPageIds((prev) => {
      const next = new Set(prev);
      if (next.has(pageKey)) {
        next.delete(pageKey);
      } else {
        next.add(pageKey);
      }
      return next;
    });
  };

  // Clear all selections
  const clearSelection = () => {
    setSelectedPageIds(new Set());
  };

  // Derive augmented inventory including crawled pages plus outbound external and broken links
  const augmentedPages: (CrawledPageAudit & { categoryType: 'internal' | 'external' | 'broken' })[] = useMemo(() => {
    const domain = (report.domain || '').toLowerCase().trim();
    const result: (CrawledPageAudit & { categoryType: 'internal' | 'external' | 'broken' })[] = [];
    const seen = new Set<string>();

    // Add all crawled pages from current active state
    pagesState.forEach((page) => {
      seen.add(page.url.toLowerCase());
      const isBroken = page.statusCode >= 400 || page.statusCode === 0 ||
        page.issues.some((i) => i.title.toLowerCase().includes('broken') || i.title.toLowerCase().includes('404'));
      const isExternal = Boolean(page.url && !page.url.toLowerCase().includes(domain));

      let cat: 'internal' | 'external' | 'broken' = 'internal';
      if (isBroken) cat = 'broken';
      else if (isExternal) cat = 'external';

      result.push({
        ...page,
        categoryType: cat,
      });
    });

    // Add discovered external and broken links from sampleLinks if not already present
    if (report.linking?.sampleLinks) {
      report.linking.sampleLinks.forEach((link, idx) => {
        if (!link.href) return;
        const normalizedHref = link.href.toLowerCase();
        if (seen.has(normalizedHref)) return;
        seen.add(normalizedHref);

        const isBroken = link.statusCode === 404 || (link.statusCode && link.statusCode >= 400);
        const isExternal = !link.isInternal;

        let cat: 'internal' | 'external' | 'broken' = isExternal ? 'external' : 'internal';
        if (isBroken) cat = 'broken';

        let path = link.href;
        try {
          const u = new URL(link.href);
          path = isExternal ? `${u.hostname}${u.pathname}` : u.pathname;
        } catch {
          path = link.href;
        }

        const issues: AuditIssue[] = [];
        if (isBroken) {
          issues.push({
            id: `broken_link_${idx}`,
            category: 'technical',
            severity: 'critical',
            title: `Broken Link: HTTP ${link.statusCode || 404} Not Found`,
            description: `Hyperlink target '${link.href}' returned a dead HTTP error code.`,
            impact: 'Broken links harm user experience, waste crawl budget, and dissipate link equity.',
            recommendation: 'Update the link to point to a 200 OK URL or remove the anchor tag.',
            affectedElement: `<a href="${link.href}">${link.text || 'Link'}</a>`,
            domSelector: `a[href="${link.href}"]`,
            pageLocation: `Anchor text: "${link.text || 'link'}"`,
            whatToDo: 'Repair or remove the broken target URL to protect link equity and user experience.',
            howToFix: 'Identify the anchor element within the page template and update href to an active destination.',
            codeSnippet: `<!-- Replace dead link with working destination -->\n<a href="/active-page">${link.text || 'Link'}</a>`,
          });
        }

        result.push({
          id: `discovered_${idx}`,
          url: link.href,
          path,
          statusCode: link.statusCode || (isBroken ? 404 : 200),
          responseTimeMs: isExternal ? 180 : 90,
          contentType: 'text/html',
          isIndexable: !isBroken && !isExternal,
          score: isBroken ? 40 : 88,
          errorCount: isBroken ? 1 : 0,
          warningCount: isExternal && !link.hasSecureTarget ? 1 : 0,
          passedCount: 8,
          metaTitle: isExternal ? `External Outbound: ${path}` : `Page: ${path}`,
          metaTitleLength: path.length,
          metaTitleStatus: 'passed',
          metaDescription: null,
          metaDescriptionLength: 0,
          metaDescriptionStatus: 'warning',
          canonicalUrl: link.href,
          canonicalStatus: 'passed',
          h1Text: link.text || path,
          h1Count: 1,
          h1Status: 'passed',
          headingsCount: { h1: 1, h2: 0, h3: 0, h4: 0, h5: 0, h6: 0 },
          robotsDirectives: isExternal ? 'nofollow' : null,
          wordCount: 0,
          readingTimeMinutes: 1,
          internalLinksCount: 0,
          externalLinksCount: isExternal ? 1 : 0,
          imagesCount: 0,
          missingAltCount: 0,
          schemasDetected: [],
          issues,
          categoryType: cat,
        });
      });
    }

    return result;
  }, [pagesState, report]);

  // Batch actions: Exclude / Include in Audit
  const handleBatchExclude = (exclude: boolean) => {
    if (selectedPageIds.size === 0) return;
    const count = selectedPageIds.size;

    const updated = pagesState.map((p) => {
      const key = getPageKey(p);
      if (selectedPageIds.has(key)) {
        return { ...p, isExcluded: exclude };
      }
      return p;
    });

    setPagesState(updated);
    onUpdatePages?.(updated);

    if (selectedPage && selectedPageIds.has(getPageKey(selectedPage))) {
      setSelectedPage({ ...selectedPage, isExcluded: exclude });
    }

    showToast(
      exclude
        ? `Excluded ${count} page${count > 1 ? 's' : ''} from audit`
        : `Restored ${count} page${count > 1 ? 's' : ''} to active audit`
    );
  };

  // Batch actions: Flag / Unflag for Review
  const handleBatchFlag = (flag: boolean) => {
    if (selectedPageIds.size === 0) return;
    const count = selectedPageIds.size;

    const updated = pagesState.map((p) => {
      const key = getPageKey(p);
      if (selectedPageIds.has(key)) {
        return { ...p, isFlaggedForReview: flag };
      }
      return p;
    });

    setPagesState(updated);
    onUpdatePages?.(updated);

    if (selectedPage && selectedPageIds.has(getPageKey(selectedPage))) {
      setSelectedPage({ ...selectedPage, isFlaggedForReview: flag });
    }

    showToast(
      flag
        ? `Flagged ${count} page${count > 1 ? 's' : ''} for review`
        : `Removed review flag from ${count} page${count > 1 ? 's' : ''}`
    );
  };

  // Single page toggle for Exclude
  const handleToggleSingleExclude = (page: CrawledPageAudit) => {
    const key = getPageKey(page);
    const nextExclude = !page.isExcluded;
    const updated = pagesState.map((p) => (getPageKey(p) === key ? { ...p, isExcluded: nextExclude } : p));
    setPagesState(updated);
    setSelectedPage({ ...page, isExcluded: nextExclude });
    onUpdatePages?.(updated);
    showToast(nextExclude ? 'Page excluded from audit' : 'Page restored to active audit');
  };

  // Single page toggle for Flag
  const handleToggleSingleFlag = (page: CrawledPageAudit) => {
    const key = getPageKey(page);
    const nextFlag = !page.isFlaggedForReview;
    const updated = pagesState.map((p) => (getPageKey(p) === key ? { ...p, isFlaggedForReview: nextFlag } : p));
    setPagesState(updated);
    setSelectedPage({ ...page, isFlaggedForReview: nextFlag });
    onUpdatePages?.(updated);
    showToast(nextFlag ? 'Page flagged for review' : 'Review flag removed');
  };

  // Category counts
  const categoryCounts = useMemo(() => {
    return {
      all: augmentedPages.length,
      internal: augmentedPages.filter((p) => p.categoryType === 'internal').length,
      external: augmentedPages.filter((p) => p.categoryType === 'external').length,
      broken: augmentedPages.filter((p) => p.categoryType === 'broken').length,
    };
  }, [augmentedPages]);

  // Quick summary counts
  const totalPages = augmentedPages.length;
  const indexableCount = augmentedPages.filter((p) => p.isIndexable).length;
  const errorPagesCount = augmentedPages.filter((p) => p.errorCount > 0).length;
  const warningPagesCount = augmentedPages.filter((p) => p.warningCount > 0 && p.errorCount === 0).length;
  const cleanPagesCount = augmentedPages.filter((p) => p.errorCount === 0 && p.warningCount === 0).length;
  const missingTitlesCount = augmentedPages.filter((p) => !p.metaTitle || p.metaTitleLength === 0).length;
  const missingDescCount = augmentedPages.filter((p) => !p.metaDescription || p.metaDescriptionLength === 0).length;
  const missingAltCount = augmentedPages.reduce((acc, p) => acc + p.missingAltCount, 0);
  const flaggedPagesCount = augmentedPages.filter((p) => p.isFlaggedForReview).length;
  const excludedPagesCount = augmentedPages.filter((p) => p.isExcluded).length;
  const activePagesCount = augmentedPages.filter((p) => !p.isExcluded).length;

  // Filter and sort pages
  const filteredPages = useMemo(() => {
    return augmentedPages
      .filter((page) => {
        // Category filter (Internal, External, Broken)
        if (categoryFilter !== 'all' && page.categoryType !== categoryFilter) {
          return false;
        }

        // Review & Exclusion filter
        if (reviewFilter === 'active' && page.isExcluded) return false;
        if (reviewFilter === 'flagged' && !page.isFlaggedForReview) return false;
        if (reviewFilter === 'excluded' && !page.isExcluded) return false;

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchPath = page.path.toLowerCase().includes(q);
          const matchUrl = page.url.toLowerCase().includes(q);
          const matchTitle = (page.metaTitle || '').toLowerCase().includes(q);
          const matchH1 = (page.h1Text || '').toLowerCase().includes(q);
          const matchStatus = String(page.statusCode).includes(q);
          const matchIssues = page.issues?.some((i) => i.title.toLowerCase().includes(q) || i.description.toLowerCase().includes(q));
          if (!matchPath && !matchUrl && !matchTitle && !matchH1 && !matchStatus && !matchIssues) return false;
        }

        // Status filter
        if (statusFilter === 'clean' && (page.errorCount > 0 || page.warningCount > 0)) return false;
        if (statusFilter === 'warnings' && page.warningCount === 0) return false;
        if (statusFilter === 'errors' && page.errorCount === 0) return false;

        // Indexability filter
        if (indexFilter === 'indexable' && !page.isIndexable) return false;
        if (indexFilter === 'non-indexable' && page.isIndexable) return false;

        // Missing tags filter
        if (missingFilter === 'title' && (page.metaTitle && page.metaTitleLength > 0)) return false;
        if (missingFilter === 'description' && (page.metaDescription && page.metaDescriptionLength > 0)) return false;
        if (missingFilter === 'alt' && page.missingAltCount === 0) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'flagged-first') {
          const aFlag = a.isFlaggedForReview ? 1 : 0;
          const bFlag = b.isFlaggedForReview ? 1 : 0;
          if (aFlag !== bFlag) return bFlag - aFlag;
          return (b.errorCount * 2 + b.warningCount) - (a.errorCount * 2 + a.warningCount);
        }
        if (sortBy === 'score-asc') return a.score - b.score;
        if (sortBy === 'score-desc') return b.score - a.score;
        if (sortBy === 'issues-desc') return (b.errorCount * 2 + b.warningCount) - (a.errorCount * 2 + a.warningCount);
        if (sortBy === 'time-desc') return b.responseTimeMs - a.responseTimeMs;
        if (sortBy === 'path-asc') return a.path.localeCompare(b.path);
        if (sortBy === 'ai-desc') {
          const aiA = getPageAiReadiness(a, report.scores?.aiReadiness).score;
          const aiB = getPageAiReadiness(b, report.scores?.aiReadiness).score;
          return aiB - aiA;
        }
        if (sortBy === 'ai-asc') {
          const aiA = getPageAiReadiness(a, report.scores?.aiReadiness).score;
          const aiB = getPageAiReadiness(b, report.scores?.aiReadiness).score;
          return aiA - aiB;
        }
        return 0;
      });
  }, [augmentedPages, categoryFilter, reviewFilter, searchQuery, statusFilter, indexFilter, missingFilter, sortBy, report.scores?.aiReadiness]);

  // Master checkbox states for current filtered view
  const visibleKeys = useMemo(() => filteredPages.map(getPageKey), [filteredPages]);
  const allVisibleSelected = visibleKeys.length > 0 && visibleKeys.every((k) => selectedPageIds.has(k));
  const someVisibleSelected = visibleKeys.some((k) => selectedPageIds.has(k)) && !allVisibleSelected;

  const toggleSelectAllVisible = () => {
    setSelectedPageIds((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        visibleKeys.forEach((k) => next.delete(k));
      } else {
        visibleKeys.forEach((k) => next.add(k));
      }
      return next;
    });
  };

  // Reusable CSV Exporter
  const exportPagesToCsv = (pagesToExport: (CrawledPageAudit & { categoryType?: 'internal' | 'external' | 'broken' })[], filePrefix: string) => {
    if (!pagesToExport || pagesToExport.length === 0) return;

    setIsExportingCsv(true);

    try {
      const headers = [
        'URL',
        'Path',
        'Category',
        'HTTP Status Code',
        'Response Time (ms)',
        'Page Health Score',
        'AI Readiness Score',
        'AI Health Indicator',
        'Indexability',
        'Excluded from Audit',
        'Flagged for Review',
        'Meta Title',
        'Meta Title Length',
        'Meta Description',
        'Meta Description Length',
        'Canonical URL',
        'Primary H1 Heading',
        'H1 Tag Count',
        'Word Count',
        'Estimated Reading Time (min)',
        'Images Count',
        'Images Missing Alt',
        'Internal Links Count',
        'External Links Count',
        'Critical Errors Count',
        'Warnings Count',
        'Passed Checks Count',
        'Detected Schemas',
        'Detected Issues Summary',
      ];

      const escapeCsv = (val: any): string => {
        if (val === null || val === undefined) return '""';
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      };

      const siteAiScore = report.scores?.aiReadiness ?? 85;

      const rows = pagesToExport.map((page) => {
        const aiInfo = getPageAiReadiness(page, siteAiScore);
        const issuesSummary = (page.issues || []).map((i) => `[${i.severity.toUpperCase()}] ${i.title}`).join('; ');
        const schemasStr = (page.schemasDetected || []).join('; ');

        return [
          escapeCsv(page.url),
          escapeCsv(page.path),
          escapeCsv(page.categoryType || 'internal'),
          escapeCsv(page.statusCode),
          escapeCsv(page.responseTimeMs),
          escapeCsv(page.score),
          escapeCsv(aiInfo.score),
          escapeCsv(aiInfo.status.toUpperCase()),
          escapeCsv(page.isIndexable ? 'Indexable' : 'NoIndex'),
          escapeCsv(page.isExcluded ? 'Yes' : 'No'),
          escapeCsv(page.isFlaggedForReview ? 'Yes' : 'No'),
          escapeCsv(page.metaTitle || ''),
          escapeCsv(page.metaTitleLength || 0),
          escapeCsv(page.metaDescription || ''),
          escapeCsv(page.metaDescriptionLength || 0),
          escapeCsv(page.canonicalUrl || ''),
          escapeCsv(page.h1Text || ''),
          escapeCsv(page.h1Count || 0),
          escapeCsv(page.wordCount || 0),
          escapeCsv(page.readingTimeMinutes || 1),
          escapeCsv(page.imagesCount || 0),
          escapeCsv(page.missingAltCount || 0),
          escapeCsv(page.internalLinksCount || 0),
          escapeCsv(page.externalLinksCount || 0),
          escapeCsv(page.errorCount || 0),
          escapeCsv(page.warningCount || 0),
          escapeCsv(page.passedCount || 0),
          escapeCsv(schemasStr),
          escapeCsv(issuesSummary),
        ].join(',');
      });

      // Include UTF-8 BOM for full Microsoft Excel / Google Sheets compatibility
      const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const safeDomain = (report.domain || 'website').replace(/[^a-z0-9]/gi, '_');
      const timestamp = new Date().toISOString().slice(0, 10);
      link.setAttribute('href', url);
      link.setAttribute('download', `${safeDomain}_${filePrefix}_${timestamp}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportSuccess(true);
      setTimeout(() => {
        setExportSuccess(false);
        setIsExportingCsv(false);
      }, 2500);
    } catch (err) {
      console.error('Failed to export CSV:', err);
      setIsExportingCsv(false);
    }
  };

  // Bulk CSV Export Handler for Filtered Pages
  const handleBulkCsvExport = () => {
    exportPagesToCsv(filteredPages, 'crawled_pages');
  };

  // CSV Export Handler for Selected Pages
  const handleExportSelectedCsv = () => {
    const selectedList = augmentedPages.filter((p) => selectedPageIds.has(getPageKey(p)));
    if (selectedList.length === 0) return;
    exportPagesToCsv(selectedList, `selected_${selectedList.length}_pages`);
  };

  const handleCopyCode = (id: string, snippet: string) => {
    navigator.clipboard.writeText(snippet);
    setCopiedSnippetId(id);
    setTimeout(() => setCopiedSnippetId(null), 2000);
  };

  // If Detail View is active, render the comprehensive PageDetailView component
  if (viewMode === 'detail' && selectedPage) {
    return (
      <PageDetailView
        page={selectedPage}
        allPages={pagesState}
        onBack={() => setViewMode('directory')}
        onSelectPage={(page) => setSelectedPage(page)}
        onSelectIssue={onSelectIssue}
      />
    );
  }

  return (
    <div className="space-y-6 relative">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl border border-slate-700 flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header Banner & Crawler Metadata */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold uppercase tracking-wider">
              Site Crawl Index
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Target Scope: {report.crawlSettings?.maxPages || totalPages} Pages ({report.crawlSettings?.crawlScope === 'whole' ? 'Whole Website' : 'Multi-Page'})
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Crawled Pages &amp; Metadata Directory
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Inspect meta tags, headings, indexing directives, and granular per-element errors discovered on every page.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Bulk CSV Export Button */}
          <button
            id="bulk-csv-export-header-btn"
            type="button"
            onClick={handleBulkCsvExport}
            disabled={isExportingCsv || filteredPages.length === 0}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-xs flex items-center gap-2 transition-all shadow-xs cursor-pointer shrink-0"
            title="Download filtered crawled pages with status codes and performance metrics as CSV"
          >
            {exportSuccess ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Exported {filteredPages.length} Pages</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4 text-slate-300" />
                <span>Bulk CSV Export ({filteredPages.length})</span>
              </>
            )}
          </button>

          {/* View Mode Switcher */}
          {selectedPage && (
            <button
              onClick={() => setViewMode('detail')}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer shrink-0"
            >
              <Eye className="w-4 h-4" />
              <span>Inspect Page Details</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-center">
            <div className="text-lg font-black text-slate-900">{totalPages}</div>
            <div className="text-[10px] uppercase font-bold text-slate-500">Pages Crawled</div>
          </div>
          <div className="px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
            <div className="text-lg font-black text-emerald-700">{indexableCount}</div>
            <div className="text-[10px] uppercase font-bold text-emerald-600">Indexable</div>
          </div>
          <div className="px-3 py-2 rounded-xl bg-rose-50 border border-rose-200 text-center">
            <div className="text-lg font-black text-rose-700">{errorPagesCount}</div>
            <div className="text-[10px] uppercase font-bold text-rose-600">With Errors</div>
          </div>
        </div>
      </div>

      {/* KPI Metric Summary Grid (8 Metrics) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
        <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-[11px] text-slate-500 font-medium">Clean Pages</div>
          <div className="text-lg font-bold text-emerald-600 mt-0.5 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            <span>{cleanPagesCount}</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-[11px] text-slate-500 font-medium">Pages w/ Warnings</div>
          <div className="text-lg font-bold text-amber-600 mt-0.5 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4" />
            <span>{warningPagesCount}</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-[11px] text-slate-500 font-medium">Missing Titles</div>
          <div className={`text-lg font-bold mt-0.5 flex items-center gap-1.5 ${missingTitlesCount > 0 ? 'text-rose-600' : 'text-slate-700'}`}>
            <Tag className="w-4 h-4" />
            <span>{missingTitlesCount}</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-[11px] text-slate-500 font-medium">Missing Meta Desc</div>
          <div className={`text-lg font-bold mt-0.5 flex items-center gap-1.5 ${missingDescCount > 0 ? 'text-amber-600' : 'text-slate-700'}`}>
            <FileText className="w-4 h-4" />
            <span>{missingDescCount}</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-[11px] text-slate-500 font-medium">Missing Alt Tags</div>
          <div className={`text-lg font-bold mt-0.5 flex items-center gap-1.5 ${missingAltCount > 0 ? 'text-amber-600' : 'text-slate-700'}`}>
            <ImageIcon className="w-4 h-4" />
            <span>{missingAltCount}</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-[11px] text-slate-500 font-medium">Avg Response</div>
          <div className="text-lg font-bold text-slate-800 mt-0.5 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-slate-400" />
            <span>{report.crawlSummary?.avgResponseTimeMs || 140}ms</span>
          </div>
        </div>

        {/* Flagged for Review Metric */}
        <button
          type="button"
          onClick={() => setReviewFilter((prev) => (prev === 'flagged' ? 'all' : 'flagged'))}
          className={`p-3 rounded-xl text-left border transition-all cursor-pointer ${
            reviewFilter === 'flagged'
              ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-400/30'
              : 'bg-white border-slate-200 hover:border-amber-300 shadow-2xs'
          }`}
          title="Filter to pages flagged for review"
        >
          <div className="text-[11px] text-amber-800 font-medium flex items-center justify-between">
            <span>Flagged Review</span>
            <Flag className="w-3 h-3 text-amber-500 fill-amber-500" />
          </div>
          <div className="text-lg font-bold text-amber-700 mt-0.5">
            {flaggedPagesCount}
          </div>
        </button>

        {/* Excluded from Audit Metric */}
        <button
          type="button"
          onClick={() => setReviewFilter((prev) => (prev === 'excluded' ? 'all' : 'excluded'))}
          className={`p-3 rounded-xl text-left border transition-all cursor-pointer ${
            reviewFilter === 'excluded'
              ? 'bg-slate-100 border-slate-400 ring-2 ring-slate-400/30'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
          }`}
          title="Filter to excluded pages"
        >
          <div className="text-[11px] text-slate-600 font-medium flex items-center justify-between">
            <span>Excluded</span>
            <Ban className="w-3 h-3 text-slate-400" />
          </div>
          <div className="text-lg font-bold text-slate-700 mt-0.5">
            {excludedPagesCount}
          </div>
        </button>
      </div>

      {/* Category Filter Pills (All, Internal, External, Broken) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-2 rounded-2xl bg-white border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            id="cat-filter-all"
            onClick={() => setCategoryFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              categoryFilter === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>All Pages</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${categoryFilter === 'all' ? 'bg-slate-100 text-slate-900' : 'bg-slate-200 text-slate-600'}`}>
              {categoryCounts.all}
            </span>
          </button>

          <button
            type="button"
            id="cat-filter-internal"
            onClick={() => setCategoryFilter('internal')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              categoryFilter === 'internal'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-blue-600" />
            <span>Internal</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${categoryFilter === 'internal' ? 'bg-blue-100 text-blue-800' : 'bg-slate-200 text-slate-600'}`}>
              {categoryCounts.internal}
            </span>
          </button>

          <button
            type="button"
            id="cat-filter-external"
            onClick={() => setCategoryFilter('external')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              categoryFilter === 'external'
                ? 'bg-white text-purple-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ExternalLink className="w-3.5 h-3.5 text-purple-600" />
            <span>External</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${categoryFilter === 'external' ? 'bg-purple-100 text-purple-800' : 'bg-slate-200 text-slate-600'}`}>
              {categoryCounts.external}
            </span>
          </button>

          <button
            type="button"
            id="cat-filter-broken"
            onClick={() => setCategoryFilter('broken')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              categoryFilter === 'broken'
                ? 'bg-white text-rose-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
            <span>Broken</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${categoryFilter === 'broken' ? 'bg-rose-100 text-rose-800' : 'bg-slate-200 text-slate-600'}`}>
              {categoryCounts.broken}
            </span>
          </button>
        </div>

        <div className="text-xs text-slate-500 font-medium px-2 flex items-center gap-1.5">
          <span>Viewing:</span>
          <span className="font-bold text-slate-800 uppercase tracking-wide text-[11px]">
            {categoryFilter} ({filteredPages.length})
          </span>
        </div>
      </div>

      {/* Search, Filters, and Sorting Controls */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              id="crawled-pages-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by URL path, meta title, H1 heading, or status (e.g., 404, /about)..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            {/* Review & Exclusion Filter */}
            <select
              id="review-filter-select"
              value={reviewFilter}
              onChange={(e) => setReviewFilter(e.target.value as any)}
              className="px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="all">All Audit Statuses</option>
              <option value="active">Active Only ({activePagesCount})</option>
              <option value="flagged">Flagged for Review ({flaggedPagesCount})</option>
              <option value="excluded">Excluded from Audit ({excludedPagesCount})</option>
            </select>

            {/* Status Filter */}
            <select
              id="status-filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="all">All Statuses ({totalPages})</option>
              <option value="errors">Critical Errors ({errorPagesCount})</option>
              <option value="warnings">Warnings ({warningPagesCount})</option>
              <option value="clean">Clean / Passed ({cleanPagesCount})</option>
            </select>

            {/* Indexability Filter */}
            <select
              id="index-filter-select"
              value={indexFilter}
              onChange={(e) => setIndexFilter(e.target.value as any)}
              className="px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="all">All Indexability</option>
              <option value="indexable">Indexable Only ({indexableCount})</option>
              <option value="non-indexable">Non-Indexable ({totalPages - indexableCount})</option>
            </select>

            {/* Missing Elements Filter */}
            <select
              id="missing-filter-select"
              value={missingFilter}
              onChange={(e) => setMissingFilter(e.target.value as any)}
              className="px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="all">All Meta Elements</option>
              <option value="title">Missing Meta Title ({missingTitlesCount})</option>
              <option value="description">Missing Meta Desc ({missingDescCount})</option>
              <option value="alt">Missing Image Alt ({augmentedPages.filter((p) => p.missingAltCount > 0).length})</option>
            </select>

            {/* Sort Filter */}
            <select
              id="sort-filter-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="issues-desc">Sort: Most Issues First</option>
              <option value="flagged-first">Sort: Flagged for Review First</option>
              <option value="score-asc">Sort: Lowest Score First</option>
              <option value="score-desc">Sort: Highest Score First</option>
              <option value="ai-desc">Sort: Highest AI-Readiness</option>
              <option value="ai-asc">Sort: Lowest AI-Readiness</option>
              <option value="time-desc">Sort: Slowest Response Time</option>
              <option value="path-asc">Sort: URL Path (A-Z)</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span>
              Showing <strong className="text-slate-800">{filteredPages.length}</strong> of{' '}
              <strong className="text-slate-800">{totalPages}</strong> items
            </span>
            {(searchQuery || categoryFilter !== 'all' || statusFilter !== 'all' || indexFilter !== 'all' || missingFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setCategoryFilter('all');
                  setStatusFilter('all');
                  setIndexFilter('all');
                  setMissingFilter('all');
                }}
                className="text-blue-600 hover:text-blue-700 font-semibold cursor-pointer ml-1"
              >
                Reset Filters
              </button>
            )}
          </div>

          {/* Quick Filtered CSV Export Button */}
          <button
            id="bulk-csv-export-filter-btn"
            type="button"
            onClick={handleBulkCsvExport}
            disabled={isExportingCsv || filteredPages.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 disabled:text-slate-400 text-slate-700 font-semibold text-xs cursor-pointer transition-colors"
            title="Download currently filtered pages with status codes and performance metrics as CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-slate-600" />
            <span>Export Filtered ({filteredPages.length}) CSV</span>
          </button>
        </div>
      </div>

      {/* AI-Readiness Health Legend */}
      <div className="flex items-center justify-between gap-3 text-[11px] text-slate-600 bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-2xs flex-wrap">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span className="font-bold text-slate-800">Page AI-Readiness Health:</span>
          <span className="text-slate-500 hidden sm:inline">
            (Evaluated for LLM search indexing, semantic hierarchy &amp; Answer Engine optimization)
          </span>
        </div>
        <div className="flex items-center gap-3.5 font-medium">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_0_2px_rgba(16,185,129,0.35)]" />
            <span className="text-emerald-800 font-semibold">Green: Optimal (&ge;80%)</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_0_2px_rgba(245,158,11,0.35)]" />
            <span className="text-amber-800 font-semibold">Yellow: Moderate (60-79%)</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_0_2px_rgba(244,63,94,0.35)]" />
            <span className="text-rose-800 font-semibold">Red: Low (&lt;60%)</span>
          </span>
        </div>
      </div>

      {/* Main Split View: Left Pages List Table & Right Page Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Pages Table (7 Cols on desktop) */}
        <div className="lg:col-span-7 space-y-3">
          {/* Batch Actions Toolbar */}
          {selectedPageIds.size > 0 && (
            <div className="p-3 bg-slate-900 text-white rounded-xl shadow-lg border border-slate-800 flex flex-wrap items-center justify-between gap-2.5 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] font-black shadow-xs">
                  {selectedPageIds.size}
                </span>
                <span className="text-xs font-bold text-slate-200">
                  {selectedPageIds.size} {selectedPageIds.size === 1 ? 'page' : 'pages'} selected
                </span>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                {/* Exclude from Audit button */}
                <button
                  type="button"
                  id="batch-exclude-btn"
                  onClick={() => handleBatchExclude(true)}
                  className="px-2.5 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 hover:text-rose-200 border border-rose-500/40 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Exclude selected pages from audit calculations and crawl report"
                >
                  <Ban className="w-3.5 h-3.5 text-rose-400" />
                  <span>Exclude from Audit</span>
                </button>

                {/* Include in Audit button */}
                <button
                  type="button"
                  id="batch-include-btn"
                  onClick={() => handleBatchExclude(false)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Restore selected pages to active audit"
                >
                  <Undo2 className="w-3.5 h-3.5 text-slate-300" />
                  <span>Include in Audit</span>
                </button>

                {/* Flag for Review button */}
                <button
                  type="button"
                  id="batch-flag-btn"
                  onClick={() => handleBatchFlag(true)}
                  className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 hover:text-amber-200 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Flag selected pages for team review"
                >
                  <Flag className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span>Flag for Review</span>
                </button>

                {/* Remove Flag button */}
                <button
                  type="button"
                  id="batch-unflag-btn"
                  onClick={() => handleBatchFlag(false)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Remove review flag from selected pages"
                >
                  <FlagOff className="w-3.5 h-3.5 text-slate-400" />
                  <span>Remove Flag</span>
                </button>

                {/* Export Selected CSV */}
                <button
                  type="button"
                  id="batch-export-selected-btn"
                  onClick={handleExportSelectedCsv}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Download only selected pages as CSV"
                >
                  <Download className="w-3.5 h-3.5 text-slate-400" />
                  <span>Export ({selectedPageIds.size})</span>
                </button>

                {/* Clear Selection */}
                <button
                  type="button"
                  id="batch-clear-selection-btn"
                  onClick={clearSelection}
                  className="px-2 py-1.5 rounded-lg text-slate-400 hover:text-white text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors"
                  title="Clear current selection"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              </div>
            </div>
          )}

          <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
            {/* Table Header with Master Checkbox */}
            <div className="px-3.5 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3 text-xs font-bold text-slate-600 select-none">
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  id="master-select-all-btn"
                  onClick={toggleSelectAllVisible}
                  className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all cursor-pointer ${
                    allVisibleSelected
                      ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                      : someVisibleSelected
                      ? 'bg-blue-100 border-blue-400 text-blue-700'
                      : 'border-slate-300 hover:border-slate-400 bg-white'
                  }`}
                  title={allVisibleSelected ? 'Deselect all visible pages' : 'Select all visible pages'}
                >
                  {allVisibleSelected ? (
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  ) : someVisibleSelected ? (
                    <span className="w-2.5 h-0.5 bg-blue-700 rounded-full" />
                  ) : null}
                </button>
                <span className="text-slate-700 text-xs">
                  {selectedPageIds.size > 0 ? (
                    <span className="text-blue-700 font-semibold">
                      {selectedPageIds.size} selected ({allVisibleSelected ? 'All visible' : 'Partial'})
                    </span>
                  ) : (
                    <span>Select All Visible ({filteredPages.length})</span>
                  )}
                </span>
              </div>

              <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium">
                <span className="hidden sm:inline">Health &amp; Status</span>
                <span>Score / Issues</span>
              </div>
            </div>

            <div className="divide-y divide-slate-100 max-h-[750px] overflow-y-auto">
              {filteredPages.length === 0 ? (
                <div className="p-12 text-center text-slate-500">
                  <Globe className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <p className="font-semibold text-sm">No items match your category and filter</p>
                  <p className="text-xs text-slate-400 mt-1">Try relaxing the search or selecting 'All Pages'.</p>
                </div>
              ) : (
                filteredPages.map((page, index) => {
                  const pageKey = getPageKey(page);
                  const isPageSelected = selectedPageIds.has(pageKey);
                  const isSelected = selectedPage ? getPageKey(selectedPage) === pageKey : false;
                  const hasErrors = page.errorCount > 0;
                  const hasWarnings = page.warningCount > 0;
                  const aiInfo = getPageAiReadiness(page, report.scores?.aiReadiness);
                  const isExcluded = page.isExcluded;
                  const isFlagged = page.isFlaggedForReview;

                  return (
                    <div
                      key={pageKey}
                      onClick={() => setSelectedPage(page)}
                      className={`p-3.5 transition-all cursor-pointer border-l-4 flex items-start gap-3 ${
                        isPageSelected
                          ? 'bg-blue-50/70 border-l-blue-600 ring-1 ring-blue-300/40'
                          : isSelected
                          ? 'bg-blue-50/40 border-l-blue-600'
                          : hasErrors
                          ? 'border-l-rose-500 hover:bg-slate-50/80'
                          : hasWarnings
                          ? 'border-l-amber-400 hover:bg-slate-50/80'
                          : 'border-l-transparent hover:bg-slate-50/80'
                      } ${isExcluded ? 'opacity-70 bg-slate-50/60' : ''}`}
                    >
                      {/* Checkbox Column */}
                      <div
                        className="pt-0.5 shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          id={`select-page-${index}`}
                          onClick={() => toggleSelectPage(pageKey)}
                          className={`w-5 h-5 rounded border flex items-center justify-center transition-all cursor-pointer ${
                            isPageSelected
                              ? 'bg-blue-600 border-blue-600 text-white shadow-2xs'
                              : 'border-slate-300 hover:border-blue-500 bg-white'
                          }`}
                          title={isPageSelected ? 'Deselect this page' : 'Select this page for batch actions'}
                        >
                          {isPageSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </button>
                      </div>

                      <div className="min-w-0 flex-1">
                        {/* Category Badge, Path, HTTP Status & Visual Health Status Indicator */}
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          {/* Visual Health Status Indicator (Colored Dot: Green/Yellow/Red) */}
                          <div
                            id={`page-ai-health-${page.id || index}`}
                            title={`AI-Readiness Health: ${aiInfo.score}/100 (${aiInfo.label})\n${aiInfo.tooltip}`}
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 transition-colors ${aiInfo.badgeClass}`}
                          >
                            <span
                              className={`w-2 h-2 rounded-full shrink-0 ${aiInfo.dotColor}`}
                            />
                            <span>AI: {aiInfo.score}%</span>
                          </div>

                          {/* Flagged Badge */}
                          {isFlagged && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1 shrink-0">
                              <Flag className="w-2.5 h-2.5 text-amber-600 fill-amber-500" />
                              <span>Flagged</span>
                            </span>
                          )}

                          {/* Excluded Badge */}
                          {isExcluded && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700 border border-slate-300 flex items-center gap-1 shrink-0">
                              <Ban className="w-2.5 h-2.5 text-slate-500" />
                              <span>Excluded</span>
                            </span>
                          )}

                          {page.categoryType === 'internal' && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                              <Globe className="w-2.5 h-2.5" />
                              Internal
                            </span>
                          )}
                          {page.categoryType === 'external' && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
                              <ExternalLink className="w-2.5 h-2.5" />
                              External
                            </span>
                          )}
                          {page.categoryType === 'broken' && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                              <ShieldAlert className="w-2.5 h-2.5" />
                              Broken
                            </span>
                          )}

                          <span className="font-mono text-xs font-bold text-slate-900 truncate max-w-xs">
                            {page.path}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              page.statusCode >= 400
                                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}
                          >
                            {page.statusCode}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {page.responseTimeMs}ms
                          </span>
                          {page.isIndexable ? (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Indexable
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                              NoIndex
                            </span>
                          )}
                        </div>

                        {/* Meta Title */}
                        <p className="text-xs font-medium text-slate-800 line-clamp-1">
                          {page.metaTitle ? (
                            page.metaTitle
                          ) : (
                            <span className="text-rose-600 font-bold italic">Missing &lt;title&gt; tag</span>
                          )}
                        </p>

                        {/* Meta Description */}
                        <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                          {page.metaDescription ? (
                            page.metaDescription
                          ) : (
                            <span className="text-amber-600 font-medium italic">Missing meta description tag</span>
                          )}
                        </p>

                        {/* Quick Parameters Row & Inspect Action */}
                        <div className="flex items-center justify-between gap-2 mt-2 pt-1 border-t border-slate-100 flex-wrap">
                          <div className="flex items-center gap-3 text-[10px] text-slate-400 font-mono">
                            <span>Words: <strong className="text-slate-600">{page.wordCount}</strong></span>
                            <span>Images: <strong className="text-slate-600">{page.imagesCount}</strong></span>
                            {page.missingAltCount > 0 && (
                              <span className="text-amber-600 font-bold">
                                {page.missingAltCount} missing alt
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Quick Flag Toggle */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleSingleFlag(page);
                              }}
                              className={`p-1 rounded hover:bg-slate-200/80 transition-colors text-[10px] font-medium flex items-center gap-1 ${
                                isFlagged ? 'text-amber-700 font-bold' : 'text-slate-400 hover:text-slate-600'
                              }`}
                              title={isFlagged ? 'Remove review flag' : 'Flag this page for review'}
                            >
                              <Flag className={`w-3 h-3 ${isFlagged ? 'fill-amber-500 text-amber-600' : ''}`} />
                              <span className="hidden sm:inline">{isFlagged ? 'Flagged' : 'Flag'}</span>
                            </button>

                            {/* Quick Exclude Toggle */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleSingleExclude(page);
                              }}
                              className={`p-1 rounded hover:bg-slate-200/80 transition-colors text-[10px] font-medium flex items-center gap-1 ${
                                isExcluded ? 'text-slate-700 font-bold' : 'text-slate-400 hover:text-rose-600'
                              }`}
                              title={isExcluded ? 'Include this page in audit' : 'Exclude this page from audit'}
                            >
                              {isExcluded ? <Undo2 className="w-3 h-3 text-slate-600" /> : <Ban className="w-3 h-3 text-slate-400" />}
                              <span className="hidden sm:inline">{isExcluded ? 'Include' : 'Exclude'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedPage(page);
                                setViewMode('detail');
                              }}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer ml-1"
                            >
                              <span>Inspect</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Right: Score & Error Badges */}
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                            page.score >= 90
                              ? 'bg-emerald-100 text-emerald-800'
                              : page.score >= 75
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {page.score}
                        </div>

                        {hasErrors ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                            {page.errorCount} {page.errorCount === 1 ? 'Error' : 'Errors'}
                          </span>
                        ) : hasWarnings ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                            {page.warningCount} {page.warningCount === 1 ? 'Warn' : 'Warns'}
                          </span>
                        ) : (
                          <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                            <Check className="w-3 h-3" /> Clean
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Deep Page Inspector & Fix Guidance (5 Cols on desktop) */}
        <div className="lg:col-span-5 sticky top-20">
          {selectedPage ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-5 max-h-[800px] overflow-y-auto">
              
              {/* Top Page Header */}
              <div className="border-b border-slate-100 pb-4">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-mono font-bold">
                    HTTP {selectedPage.statusCode}
                  </span>
                  <a
                    href={selectedPage.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                  >
                    <span>Visit Page</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <h3 className="font-mono text-sm font-bold text-slate-900 break-all">
                  {selectedPage.path}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 break-all">
                  {selectedPage.url}
                </p>

                <button
                  type="button"
                  onClick={() => setViewMode('detail')}
                  className="w-full mt-3 py-2 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Open Full SEO Breakdown (Meta, H1, Schema, CWV)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                {/* AI-Readiness Health Inspector Card */}
                {(() => {
                  const selectedAi = getPageAiReadiness(selectedPage, report.scores?.aiReadiness);
                  return (
                    <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200/90 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2.5 h-2.5 rounded-full shrink-0 ${selectedAi.dotColor}`}
                          />
                          <span className="font-bold text-xs text-slate-900">
                            AI-Readiness: {selectedAi.label}
                          </span>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-bold border ${selectedAi.badgeClass}`}
                        >
                          {selectedAi.score}/100
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-snug">
                        {selectedAi.tooltip}
                      </p>
                    </div>
                  );
                })()}

                {/* Review & Audit Management Controls for Selected Page */}
                <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                    <span>Page Status &amp; Actions</span>
                    <div className="flex items-center gap-1.5">
                      {selectedPage.isFlaggedForReview && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                          <Flag className="w-3 h-3 text-amber-600 fill-amber-500" /> Flagged
                        </span>
                      )}
                      {selectedPage.isExcluded && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700 border border-slate-300 flex items-center gap-1">
                          <Ban className="w-3 h-3 text-slate-500" /> Excluded
                        </span>
                      )}
                      {!selectedPage.isFlaggedForReview && !selectedPage.isExcluded && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          Active in Audit
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleToggleSingleFlag(selectedPage)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                        selectedPage.isFlaggedForReview
                          ? 'bg-amber-100 border-amber-300 text-amber-900 hover:bg-amber-200'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <Flag className={`w-3.5 h-3.5 ${selectedPage.isFlaggedForReview ? 'text-amber-600 fill-amber-500' : 'text-slate-400'}`} />
                      <span>{selectedPage.isFlaggedForReview ? 'Unflag Page' : 'Flag for Review'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleSingleExclude(selectedPage)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                        selectedPage.isExcluded
                          ? 'bg-slate-200 border-slate-300 text-slate-800 hover:bg-slate-300'
                          : 'bg-white border-rose-200 text-rose-700 hover:bg-rose-50'
                      }`}
                    >
                      {selectedPage.isExcluded ? (
                        <>
                          <Undo2 className="w-3.5 h-3.5 text-slate-600" />
                          <span>Include in Audit</span>
                        </>
                      ) : (
                        <>
                          <Ban className="w-3.5 h-3.5 text-rose-500" />
                          <span>Exclude Page</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Specific Issues Discovered on THIS Page with Step-by-Step Fixes */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                    <span>Issues on This Page ({selectedPage.issues.length})</span>
                  </h4>
                  {selectedPage.issues.length === 0 && (
                    <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> No critical issues
                    </span>
                  )}
                </div>

                {selectedPage.issues.length === 0 ? (
                  <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>All SEO parameters, meta headers, and images passed verification on this page!</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedPage.issues.map((issue) => (
                      <div
                        key={issue.id}
                        className={`p-4 rounded-xl border space-y-3 ${
                          issue.severity === 'critical'
                            ? 'bg-rose-50/50 border-rose-200'
                            : 'bg-amber-50/50 border-amber-200'
                        }`}
                      >
                        {/* Issue Header */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            {issue.severity === 'critical' ? (
                              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                            ) : (
                              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                            )}
                            <span className="text-xs font-bold text-slate-900">
                              {issue.title}
                            </span>
                          </div>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              issue.severity === 'critical'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {issue.severity}
                          </span>
                        </div>

                        {/* Error Description & Impact */}
                        <p className="text-xs text-slate-700">
                          {issue.description}
                        </p>

                        {/* Exact Location on Page */}
                        {issue.pageLocation && (
                          <div className="p-2.5 rounded-lg bg-white/80 border border-slate-200/80 text-[11px] space-y-1">
                            <div className="text-[10px] uppercase font-bold text-slate-500">
                              Exact Location on Page:
                            </div>
                            <div className="font-mono text-slate-800 bg-slate-100 px-2 py-1 rounded text-[11px] break-all">
                              {issue.pageLocation}
                            </div>
                            {issue.affectedElement && (
                              <div className="font-mono text-[10px] text-slate-600 truncate mt-1">
                                Tag: <span className="text-blue-700">{issue.affectedElement}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Actionable What To Do Section */}
                        {issue.whatToDo && (
                          <div className="p-3 rounded-lg bg-blue-50/80 border border-blue-200/80 text-xs space-y-1.5">
                            <div className="font-bold text-blue-900 flex items-center gap-1.5">
                              <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
                              <span>What To Do:</span>
                            </div>
                            <div className="text-blue-950 whitespace-pre-line text-[11px] leading-relaxed pl-1">
                              {issue.whatToDo}
                            </div>
                          </div>
                        )}

                        {/* Code Snippet with Copy */}
                        {issue.codeSnippet && (
                          <div className="relative group">
                            <div className="flex items-center justify-between px-3 py-1 bg-slate-900 text-slate-400 text-[10px] font-mono rounded-t-lg">
                              <span>Recommended Code Fix</span>
                              <button
                                onClick={() => handleCopyCode(issue.id, issue.codeSnippet || '')}
                                className="flex items-center gap-1 text-slate-300 hover:text-white cursor-pointer"
                              >
                                {copiedSnippetId === issue.id ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-400" />
                                    <span className="text-emerald-400">Copied</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    <span>Copy</span>
                                  </>
                                )}
                              </button>
                            </div>
                            <pre className="p-3 bg-slate-950 text-emerald-400 font-mono text-[11px] rounded-b-lg overflow-x-auto whitespace-pre-wrap">
                              {issue.codeSnippet}
                            </pre>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Complete Page Parameters Breakdown */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Page Audit Parameters
                </h4>

                {/* Meta Title */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                  <div className="flex items-center justify-between text-slate-500 text-[10px] font-bold uppercase">
                    <span>Meta Title</span>
                    <span>{selectedPage.metaTitleLength} chars (Optimal: 50-60)</span>
                  </div>
                  <p className="font-semibold text-slate-900 break-words">
                    {selectedPage.metaTitle || <span className="text-rose-600 italic">None</span>}
                  </p>
                </div>

                {/* Meta Description */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                  <div className="flex items-center justify-between text-slate-500 text-[10px] font-bold uppercase">
                    <span>Meta Description</span>
                    <span>{selectedPage.metaDescriptionLength} chars (Optimal: 120-155)</span>
                  </div>
                  <p className="text-slate-800 break-words">
                    {selectedPage.metaDescription || (
                      <span className="text-amber-600 italic">None declared in &lt;head&gt;</span>
                    )}
                  </p>
                </div>

                {/* Canonical URL */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                  <div className="text-slate-500 text-[10px] font-bold uppercase">Canonical URL</div>
                  <p className="font-mono text-slate-800 break-all text-[11px]">
                    {selectedPage.canonicalUrl || 'Self-referencing default'}
                  </p>
                </div>

                {/* Primary H1 Heading */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                  <div className="flex items-center justify-between text-slate-500 text-[10px] font-bold uppercase">
                    <span>H1 Tag</span>
                    <span>{selectedPage.h1Count} declared</span>
                  </div>
                  <p className="font-medium text-slate-900">
                    {selectedPage.h1Text || <span className="text-rose-600 italic">No H1 tag detected</span>}
                  </p>
                </div>

                {/* Headings Distribution & Word Counts */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="text-[10px] text-slate-500 uppercase font-bold">Headings Counts</div>
                    <div className="font-mono text-slate-800 mt-1 space-x-2">
                      <span>H1: <strong>{selectedPage.headingsCount?.h1 || 0}</strong></span>
                      <span>H2: <strong>{selectedPage.headingsCount?.h2 || 0}</strong></span>
                      <span>H3: <strong>{selectedPage.headingsCount?.h3 || 0}</strong></span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="text-[10px] text-slate-500 uppercase font-bold">Content &amp; Reading</div>
                    <div className="font-mono text-slate-800 mt-1">
                      <strong>{selectedPage.wordCount}</strong> words (~{selectedPage.readingTimeMinutes} min)
                    </div>
                  </div>
                </div>

                {/* Indexing Directives & Schemas */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="text-[10px] text-slate-500 uppercase font-bold">Robots Directives</div>
                    <div className="font-mono text-slate-800 mt-1 text-[11px] truncate">
                      {selectedPage.robotsDirectives || 'index, follow'}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="text-[10px] text-slate-500 uppercase font-bold">Schemas Detected</div>
                    <div className="text-slate-800 mt-1 text-[11px] truncate">
                      {selectedPage.schemasDetected?.join(', ') || 'WebPage'}
                    </div>
                  </div>
                </div>

                {/* Images & Missing Alt summary */}
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-slate-500" />
                    <span>Images on Page: <strong>{selectedPage.imagesCount}</strong></span>
                  </div>
                  {selectedPage.missingAltCount > 0 ? (
                    <span className="text-amber-600 font-bold">
                      {selectedPage.missingAltCount} missing alt text
                    </span>
                  ) : (
                    <span className="text-emerald-600 font-bold">All images have alt</span>
                  )}
                </div>

              </div>

            </div>
          ) : (
            <div className="p-8 bg-white border border-slate-200 rounded-2xl text-center text-slate-400">
              <Eye className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-semibold text-slate-600">Select a page to inspect</p>
              <p className="text-xs text-slate-400 mt-0.5">Click any row in the table to see full meta tags and error locations.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
