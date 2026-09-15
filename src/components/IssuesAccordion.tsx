import React, { useState, useMemo, useEffect } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Info,
  ChevronDown,
  Copy,
  Check,
  Search,
  Code2,
  Globe,
  MapPin,
  HelpCircle,
  ExternalLink,
  SlidersHorizontal,
  Compass,
  ArrowUpRight,
  Flame,
  Zap,
  CheckSquare,
  Square,
  ListChecks,
  FileText,
  Download,
  Edit3,
  RotateCcw,
  Sparkles,
  X,
  FileSpreadsheet,
  CheckCheck,
  Calendar,
  Clock,
  ArrowUpDown,
  ArrowDown,
  ArrowUp,
  ArrowDownAZ,
  Layers,
} from 'lucide-react';
import { AuditIssue, Severity, Category, AuditReport, IssuePriority } from '../types';
import { copyTextToClipboard } from '../utils/clipboard';
import { downloadCsvReport } from '../utils/export';

export interface IssuesAccordionProps {
  issues: AuditIssue[];
  report?: AuditReport;
  onUpdateReport?: (updatedReport: AuditReport) => void;
  onUpdateIssues?: (updatedIssues: AuditIssue[]) => void;
}

export type PriorityLevel = IssuePriority;
export type ChecklistStatusFilter = 'all' | 'pending' | 'completed';
export type ViewMode = 'checklist' | 'accordion';

export type SortOption =
  | 'priority_high_to_low'
  | 'priority_low_to_high'
  | 'severity_crit_first'
  | 'impact_score_desc'
  | 'status_pending_first'
  | 'status_completed_first'
  | 'alphabetical_asc'
  | 'page_asc'
  | 'default';

export const getIssuePriority = (
  issue: AuditIssue
): { level: PriorityLevel; score: number; label: string; desc: string } => {
  // If explicitly assigned priority on the issue object
  if (issue.priority === 'High') {
    const score = typeof issue.impactScore === 'number' ? issue.impactScore : 90;
    return {
      level: 'High',
      score,
      label: 'High Priority',
      desc: 'Critical blocker directly hurting crawl indexing, CWV rank, or bot access.',
    };
  }
  if (issue.priority === 'Medium') {
    const score = typeof issue.impactScore === 'number' ? issue.impactScore : 60;
    return {
      level: 'Medium',
      score,
      label: 'Medium Priority',
      desc: 'Noticeable deficiency hindering organic visibility or search performance.',
    };
  }
  if (issue.priority === 'Low') {
    const score = typeof issue.impactScore === 'number' ? issue.impactScore : 30;
    return {
      level: 'Low',
      score,
      label: 'Low Priority',
      desc: 'Minor optimization or good housekeeping recommendation.',
    };
  }

  const anyIssue = issue as any;
  if (typeof anyIssue.impactScore === 'number') {
    const s = Math.round(anyIssue.impactScore);
    if (s >= 70) {
      return {
        level: 'High',
        score: s,
        label: 'High Priority',
        desc: 'Critical blocker directly hurting crawl indexing, CWV rank, or bot access.',
      };
    }
    if (s >= 40) {
      return {
        level: 'Medium',
        score: s,
        label: 'Medium Priority',
        desc: 'Noticeable deficiency hindering organic visibility or search performance.',
      };
    }
    return {
      level: 'Low',
      score: s,
      label: 'Low Priority',
      desc: 'Minor optimization or good housekeeping recommendation.',
    };
  }

  // Calculate based on severity and category
  if (issue.severity === 'critical') {
    const score = issue.category === 'technical' ? 95 : issue.category === 'performance' ? 90 : 85;
    return {
      level: 'High',
      score,
      label: 'High Priority',
      desc: 'Urgent resolution required: directly blocks crawler discovery or search indexing.',
    };
  }
  if (issue.severity === 'warning') {
    const score = issue.category === 'technical' ? 65 : issue.category === 'performance' ? 60 : 55;
    return {
      level: 'Medium',
      score,
      label: 'Medium Priority',
      desc: 'Moderate search impact: degrades user experience or topical authority.',
    };
  }
  return {
    level: 'Low',
    score: 30,
    label: 'Low Priority',
    desc: 'Low impact polish: minor semantic optimization.',
  };
};

export const IssuesAccordion: React.FC<IssuesAccordionProps> = ({
  issues,
  report,
  onUpdateReport,
  onUpdateIssues,
}) => {
  // Local synchronized issues state
  const [issuesState, setIssuesState] = useState<AuditIssue[]>(() =>
    Array.isArray(issues) ? issues : []
  );

  // Sync state if incoming issues prop updates externally
  useEffect(() => {
    if (Array.isArray(issues)) {
      setIssuesState(issues);
    }
  }, [issues]);

  const [viewMode, setViewMode] = useState<ViewMode>('checklist');
  const [statusFilter, setStatusFilter] = useState<ChecklistStatusFilter>('all');
  const [severityFilter, setSeverityFilter] = useState<Severity | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<PriorityLevel | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<Category | 'all'>('all');
  const [pageFilter, setPageFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('priority_high_to_low');
  const [expandedIssues, setExpandedIssues] = useState<Record<string, boolean>>({});

  // Note editing state
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState<string>('');

  // Toast feedback state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [copiedSelectorId, setCopiedSelectorId] = useState<string | null>(null);
  const [copiedPageUrlId, setCopiedPageUrlId] = useState<string | null>(null);

  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3200);
  };

  // Helper to persist updated issues array into report object & storage
  const commitUpdatedIssues = (updatedIssues: AuditIssue[], toastMsg?: string) => {
    setIssuesState(updatedIssues);
    if (toastMsg) {
      showToast(toastMsg, 'success');
    }

    if (onUpdateIssues) {
      onUpdateIssues(updatedIssues);
    }

    if (report && onUpdateReport) {
      const completedTasksCount = updatedIssues.filter((i) => i.isCompleted).length;
      const total = updatedIssues.length;
      const percent = total > 0 ? Math.round((completedTasksCount / total) * 100) : 0;

      // Also sync matching crawled page issues if crawledPages are present
      const updatedCrawledPages = report.crawledPages?.map((page) => {
        if (!page.issues || page.issues.length === 0) return page;
        const updatedPageIssues = page.issues.map((pi) => {
          const match = updatedIssues.find(
            (ui) =>
              ui.id === pi.id ||
              (ui.title === pi.title && (ui.pagePath === pi.pagePath || ui.pageUrl === pi.pageUrl))
          );
          if (match) {
            return {
              ...pi,
              isCompleted: match.isCompleted,
              completedAt: match.completedAt,
              completionNotes: match.completionNotes,
              priority: match.priority,
              impactScore: match.impactScore,
            };
          }
          return pi;
        });
        return {
          ...page,
          issues: updatedPageIssues,
        };
      });

      const updatedReport: AuditReport = {
        ...report,
        issues: updatedIssues,
        completedTasksCount,
        checklistSummary: {
          total,
          completed: completedTasksCount,
          percent,
          lastUpdated: Date.now(),
        },
        crawledPages: updatedCrawledPages,
      };

      onUpdateReport(updatedReport);
    }
  };

  // Reassign issue priority level (High, Medium, Low) for workflow management
  const handleSetPriority = (
    issueId: string,
    newPriority: PriorityLevel,
    e?: React.MouseEvent | React.ChangeEvent
  ) => {
    if (e) {
      e.stopPropagation();
    }

    const updated = issuesState.map((iss) => {
      if (iss.id === issueId) {
        const defaultScore = newPriority === 'High' ? 95 : newPriority === 'Medium' ? 65 : 30;
        return {
          ...iss,
          priority: newPriority,
          impactScore: defaultScore,
        };
      }
      return iss;
    });

    const targetIssue = updated.find((i) => i.id === issueId);
    commitUpdatedIssues(
      updated,
      `Priority updated to ${newPriority} for "${targetIssue?.title || 'task'}"`
    );
  };

  // Toggle individual task completion state
  const handleToggleComplete = (issueId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }

    const updated = issuesState.map((iss) => {
      if (iss.id === issueId) {
        const nextState = !iss.isCompleted;
        return {
          ...iss,
          isCompleted: nextState,
          completedAt: nextState ? Date.now() : undefined,
        };
      }
      return iss;
    });

    const targetIssue = updated.find((i) => i.id === issueId);
    const msg = targetIssue?.isCompleted
      ? `Task completed: "${targetIssue.title}"`
      : `Task marked as pending: "${targetIssue?.title}"`;

    commitUpdatedIssues(updated, msg);
  };

  // Batch mark all filtered items
  const handleBatchMarkCompleted = (markAsCompleted: boolean) => {
    const targetIds = new Set(filtered.map((i) => i.id));
    if (targetIds.size === 0) return;

    const updated = issuesState.map((iss) => {
      if (targetIds.has(iss.id)) {
        return {
          ...iss,
          isCompleted: markAsCompleted,
          completedAt: markAsCompleted ? (iss.completedAt || Date.now()) : undefined,
        };
      }
      return iss;
    });

    const msg = markAsCompleted
      ? `Marked ${targetIds.size} task${targetIds.size === 1 ? '' : 's'} as completed`
      : `Reset ${targetIds.size} task${targetIds.size === 1 ? '' : 's'} to pending`;

    commitUpdatedIssues(updated, msg);
  };

  // Save resolution note for a task
  const handleSaveResolutionNote = (issueId: string) => {
    const trimmed = noteText.trim();
    const updated = issuesState.map((iss) => {
      if (iss.id === issueId) {
        return {
          ...iss,
          completionNotes: trimmed.length > 0 ? trimmed : undefined,
        };
      }
      return iss;
    });

    commitUpdatedIssues(updated, 'Resolution note saved to audit report');
    setEditingNoteId(null);
    setNoteText('');
  };

  const handleStartEditingNote = (issue: AuditIssue, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingNoteId(issue.id);
    setNoteText(issue.completionNotes || '');
  };

  // Export checklist as Markdown file
  const handleExportMarkdownChecklist = () => {
    const domain = report?.domain || 'Website';
    const completedCount = issuesState.filter((i) => i.isCompleted).length;
    const totalCount = issuesState.length;
    const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    let md = `# SEO & Technical Audit Remediation Checklist\n\n`;
    md += `- **Target Domain:** ${domain}\n`;
    md += `- **Audit Date:** ${new Date(report?.timestamp || Date.now()).toLocaleDateString()}\n`;
    md += `- **Checklist Progress:** ${completedCount} / ${totalCount} Tasks Completed (${pct}%)\n`;
    md += `- **Generated:** ${new Date().toLocaleString()}\n\n`;
    md += `---\n\n`;
    md += `## Action Items & Fixes\n\n`;

    issuesState.forEach((iss, idx) => {
      const checkbox = iss.isCompleted ? '[x]' : '[ ]';
      const { level, score } = getIssuePriority(iss);
      const statusLabel = iss.isCompleted ? 'COMPLETED' : 'PENDING';
      md += `### ${idx + 1}. ${checkbox} ${iss.title} (${statusLabel})\n\n`;
      md += `- **Priority:** ${level} (Impact Score: ${score}/100) | **Severity:** ${iss.severity.toUpperCase()} | **Category:** ${iss.category}\n`;
      if (iss.pagePath || iss.pageUrl) {
        md += `- **Affected Page:** \`${iss.pagePath || iss.pageUrl}\`\n`;
      }
      if (iss.pageLocation) {
        md += `- **Page Location:** ${iss.pageLocation}\n`;
      }
      if (iss.domSelector) {
        md += `- **DOM Selector:** \`${iss.domSelector}\`\n`;
      }
      md += `- **Diagnostic:** ${iss.description}\n`;
      md += `- **Impact:** ${iss.impact}\n`;
      md += `- **Recommended Fix:** ${iss.recommendation}\n`;
      if (iss.codeSnippet) {
        md += `\n\`\`\`html\n${iss.codeSnippet}\n\`\`\`\n`;
      }
      if (iss.completionNotes) {
        md += `- **Resolution Notes:** ${iss.completionNotes}\n`;
      }
      if (iss.completedAt) {
        md += `- **Completed On:** ${new Date(iss.completedAt).toLocaleString()}\n`;
      }
      md += `\n---\n\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-checklist-${domain.replace(/[^a-zA-Z0-9.-]/g, '_')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Downloaded Markdown checklist', 'info');
  };

  // Distinct crawled pages
  const distinctPages = useMemo(() => {
    const pageSet = new Set<string>();
    issuesState.forEach((issue) => {
      if (issue.pagePath) pageSet.add(issue.pagePath);
      else if (issue.pageUrl) pageSet.add(issue.pageUrl);
    });
    return Array.from(pageSet).sort();
  }, [issuesState]);

  const toggleExpand = (id: string) => {
    setExpandedIssues((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const copyCode = async (code: string, id: string) => {
    const success = await copyTextToClipboard(code);
    if (success) {
      setCopiedCodeId(id);
      setTimeout(() => setCopiedCodeId(null), 2000);
    }
  };

  const copySelector = async (selector: string, id: string) => {
    const success = await copyTextToClipboard(selector);
    if (success) {
      setCopiedSelectorId(id);
      setTimeout(() => setCopiedSelectorId(null), 2000);
    }
  };

  const copyPageUrl = async (url: string, id: string) => {
    const success = await copyTextToClipboard(url);
    if (success) {
      setCopiedPageUrlId(id);
      setTimeout(() => setCopiedPageUrlId(null), 2000);
    }
  };

  const getDomSelectorPath = (issue: AuditIssue): string => {
    if (issue.domSelector) return issue.domSelector;
    const lowerTitle = issue.title.toLowerCase();
    const lowerLoc = (issue.pageLocation || '').toLowerCase();
    if (lowerLoc.includes('>') || lowerLoc.includes(':')) return issue.pageLocation!;
    if (lowerTitle.includes('description')) return 'html > head > meta[name="description"]';
    if (lowerTitle.includes('title')) return 'html > head > title';
    if (lowerTitle.includes('canonical')) return 'html > head > link[rel="canonical"]';
    if (lowerTitle.includes('h1')) return 'html > body > main > h1:first-of-type';
    if (lowerTitle.includes('alt') || lowerTitle.includes('image'))
      return 'html > body > main > section.media-gallery > img:first-of-type';
    if (
      lowerTitle.includes('schema') ||
      lowerTitle.includes('structured') ||
      lowerTitle.includes('json-ld')
    )
      return 'html > head > script[type="application/ld+json"]';
    if (lowerTitle.includes('aria') || lowerTitle.includes('svg'))
      return 'html > body > header > nav > svg:first-of-type';
    if (lowerTitle.includes('robots')) return 'html > head > meta[name="robots"]';
    if (lowerTitle.includes('content') || lowerTitle.includes('thin'))
      return 'html > body > main > section.editorial-content';
    return 'html > body > main';
  };

  const getGranularHowToFix = (issue: AuditIssue): string => {
    if (issue.howToFix) return issue.howToFix;
    if (issue.whatToDo) return issue.whatToDo;

    const selector = getDomSelectorPath(issue);
    const targetPage = issue.pagePath || issue.pageUrl || 'the affected template';
    return `1. Open the source code or template file responsible for ${targetPage}.\n2. Locate the element matching the DOM selector: \`${selector}\`.\n3. Modify the markup according to the recommendation below.\n4. Deploy changes and mark this task as completed in your checklist.`;
  };

  // Metrics computation
  const totalTasks = issuesState.length;
  const completedTasks = issuesState.filter((i) => i.isCompleted).length;
  const pendingTasks = totalTasks - completedTasks;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const criticalPendingCount = issuesState.filter(
    (i) => !i.isCompleted && i.severity === 'critical'
  ).length;
  const warningPendingCount = issuesState.filter(
    (i) => !i.isCompleted && i.severity === 'warning'
  ).length;
  const highPriorityPendingCount = issuesState.filter(
    (i) => !i.isCompleted && getIssuePriority(i).level === 'High'
  ).length;
  const mediumPriorityPendingCount = issuesState.filter(
    (i) => !i.isCompleted && getIssuePriority(i).level === 'Medium'
  ).length;
  const lowPriorityPendingCount = issuesState.filter(
    (i) => !i.isCompleted && getIssuePriority(i).level === 'Low'
  ).length;

  // Filtered and Sorted issues list
  const filtered = useMemo(() => {
    const list = issuesState.filter((issue) => {
      // Checklist Status Filter
      if (statusFilter === 'pending' && issue.isCompleted) return false;
      if (statusFilter === 'completed' && !issue.isCompleted) return false;

      // Severity Filter
      if (severityFilter !== 'all' && issue.severity !== severityFilter) return false;

      // Priority Filter
      if (priorityFilter !== 'all') {
        const { level } = getIssuePriority(issue);
        if (level !== priorityFilter) return false;
      }

      // Category Filter
      if (categoryFilter !== 'all' && issue.category !== categoryFilter) return false;

      // Page Filter
      if (pageFilter !== 'all') {
        const p = issue.pagePath || issue.pageUrl || '/';
        if (p !== pageFilter) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const sev = issue.severity.toLowerCase();

        const matchSeverity =
          sev.includes(q) ||
          (q === 'crit' && sev === 'critical') ||
          (q === 'critical' && sev === 'critical') ||
          (q === 'error' && sev === 'critical') ||
          (q === 'warn' && sev === 'warning') ||
          (q === 'warning' && sev === 'warning') ||
          (q === 'pass' && sev === 'passed');

        const { level } = getIssuePriority(issue);
        const matchPriority =
          level.toLowerCase().includes(q) || `${level.toLowerCase()} priority`.includes(q);

        const matchStatus =
          (issue.isCompleted && (q.includes('done') || q.includes('comp') || q.includes('fix'))) ||
          (!issue.isCompleted && (q.includes('pend') || q.includes('open') || q.includes('todo')));

        const matchTitle = issue.title.toLowerCase().includes(q);
        const matchDesc = issue.description.toLowerCase().includes(q);
        const matchRec = (issue.recommendation || '').toLowerCase().includes(q);
        const matchLoc = (issue.pageLocation || '').toLowerCase().includes(q);
        const matchPage = (issue.pagePath || issue.pageUrl || '').toLowerCase().includes(q);
        const matchSel = getDomSelectorPath(issue).toLowerCase().includes(q);
        const matchCat = issue.category.toLowerCase().includes(q);
        const matchNotes = (issue.completionNotes || '').toLowerCase().includes(q);

        return (
          matchTitle ||
          matchSeverity ||
          matchPriority ||
          matchStatus ||
          matchDesc ||
          matchRec ||
          matchLoc ||
          matchPage ||
          matchSel ||
          matchCat ||
          matchNotes
        );
      }
      return true;
    });

    const prioWeight: Record<PriorityLevel, number> = {
      High: 3,
      Medium: 2,
      Low: 1,
    };

    return [...list].sort((a, b) => {
      const prioA = getIssuePriority(a);
      const prioB = getIssuePriority(b);

      if (sortBy === 'priority_high_to_low') {
        const diff = prioWeight[prioB.level] - prioWeight[prioA.level];
        if (diff !== 0) return diff;
        // Secondary tie-breaker: pending tasks before completed
        if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
        // Tertiary tie-breaker: score descending
        if (prioB.score !== prioA.score) return prioB.score - prioA.score;
        return a.title.localeCompare(b.title);
      }

      if (sortBy === 'priority_low_to_high') {
        const diff = prioWeight[prioA.level] - prioWeight[prioB.level];
        if (diff !== 0) return diff;
        if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
        if (prioA.score !== prioB.score) return prioA.score - prioB.score;
        return a.title.localeCompare(b.title);
      }

      if (sortBy === 'severity_crit_first') {
        const sevWeight = { critical: 3, warning: 2, info: 1, passed: 0 };
        const diff = (sevWeight[b.severity] || 0) - (sevWeight[a.severity] || 0);
        if (diff !== 0) return diff;
        const pDiff = prioWeight[prioB.level] - prioWeight[prioA.level];
        if (pDiff !== 0) return pDiff;
        if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
        return prioB.score - prioA.score;
      }

      if (sortBy === 'impact_score_desc') {
        if (prioB.score !== prioA.score) return prioB.score - prioA.score;
        const pDiff = prioWeight[prioB.level] - prioWeight[prioA.level];
        if (pDiff !== 0) return pDiff;
        if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
        return a.title.localeCompare(b.title);
      }

      if (sortBy === 'status_pending_first') {
        if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
        const pDiff = prioWeight[prioB.level] - prioWeight[prioA.level];
        if (pDiff !== 0) return pDiff;
        return prioB.score - prioA.score;
      }

      if (sortBy === 'status_completed_first') {
        if (a.isCompleted !== b.isCompleted) return a.isCompleted ? -1 : 1;
        const pDiff = prioWeight[prioB.level] - prioWeight[prioA.level];
        if (pDiff !== 0) return pDiff;
        return prioB.score - prioA.score;
      }

      if (sortBy === 'alphabetical_asc') {
        return a.title.localeCompare(b.title);
      }

      if (sortBy === 'page_asc') {
        const pA = a.pagePath || a.pageUrl || '';
        const pB = b.pagePath || b.pageUrl || '';
        return pA.localeCompare(pB);
      }

      return 0;
    });
  }, [
    issuesState,
    statusFilter,
    severityFilter,
    priorityFilter,
    categoryFilter,
    pageFilter,
    searchQuery,
    sortBy,
  ]);

  const getPriorityBadge = (issue: AuditIssue, allowEdit = true) => {
    const { level, score } = getIssuePriority(issue);
    return (
      <div
        className="inline-flex items-center gap-1.5 shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        {level === 'High' && (
          <span
            title={`High Priority Triage (Impact Score: ${score}/100)`}
            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-600 text-white shadow-xs"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            <Flame className="w-3.5 h-3.5" />
            <span>High Priority</span>
            <span className="text-[10px] bg-rose-700/90 text-rose-100 px-1.5 py-0.2 rounded font-mono font-bold">
              Impact {score}
            </span>
          </span>
        )}
        {level === 'Medium' && (
          <span
            title={`Medium Priority Triage (Impact Score: ${score}/100)`}
            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <Zap className="w-3.5 h-3.5 text-amber-600" />
            <span>Medium Priority</span>
            <span className="text-[10px] bg-amber-200/90 text-amber-800 px-1.5 py-0.2 rounded font-mono font-bold">
              Impact {score}
            </span>
          </span>
        )}
        {level === 'Low' && (
          <span
            title={`Low Priority Triage (Impact Score: ${score}/100)`}
            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300 shadow-2xs"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            <span>Low Priority</span>
            <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.2 rounded font-mono font-bold">
              Impact {score}
            </span>
          </span>
        )}

        {allowEdit && (
          <select
            aria-label={`Change priority for ${issue.title}`}
            value={level}
            onChange={(e) => handleSetPriority(issue.id, e.target.value as PriorityLevel, e)}
            className="text-[10px] font-semibold bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-400 rounded-md px-1.5 py-0.5 shadow-2xs focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer transition-colors"
            title="Reassign issue priority level (High, Medium, Low) for workflow management"
          >
            <option value="High">⚡ High</option>
            <option value="Medium">⚡ Medium</option>
            <option value="Low">⚡ Low</option>
          </select>
        )}
      </div>
    );
  };

  const getSeverityBadge = (sev: Severity) => {
    switch (sev) {
      case 'critical':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 shrink-0">
            <AlertOctagon className="w-3.5 h-3.5 text-rose-600" /> Critical
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Warning
          </span>
        );
      case 'passed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Passed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
            <Info className="w-3.5 h-3.5 text-blue-600" /> Info
          </span>
        );
    }
  };

  const getCategoryBadge = (cat: Category) => {
    const labels: Record<Category, string> = {
      technical: 'Technical SEO',
      performance: 'Performance & CWV',
      content: 'Content & Linking',
      ai_readiness: 'AI Readiness / GEO',
    };
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
        {labels[cat] || cat}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-slate-900 text-white text-xs shadow-xl border border-slate-700 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-medium">{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="ml-2 text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 1. INTERACTIVE AUDIT CHECKLIST HERO DASHBOARD & PROGRESS */}
      <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-xs space-y-5">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-50 border border-blue-100 text-blue-600">
                <ListChecks className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900">
                    Interactive Audit Checklist &amp; Remediation Plan
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    Auto-Persisted in Audit Report
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Track fixes, check off completed remediation tasks, and record notes. Progress stays saved across sessions.
                </p>
              </div>
            </div>
          </div>

          {/* Action Tools: Export Markdown, CSV, Batch Complete, Reset */}
          <div className="flex items-center gap-2 flex-wrap self-stretch sm:self-auto">
            <button
              type="button"
              id="export-checklist-md-btn"
              onClick={handleExportMarkdownChecklist}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs transition-all cursor-pointer"
              title="Download remediation checklist as Markdown document"
            >
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span>Export .MD Checklist</span>
            </button>

            {report && (
              <button
                type="button"
                id="export-checklist-csv-btn"
                onClick={() => downloadCsvReport(report)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs transition-all cursor-pointer"
                title="Download issues & tasks as CSV spreadsheet"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Export CSV</span>
              </button>
            )}

            {/* View Mode Toggle: Checklist Mode vs Technical Accordion */}
            <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold">
              <button
                type="button"
                id="view-mode-checklist"
                onClick={() => setViewMode('checklist')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'checklist'
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <CheckSquare className="w-3.5 h-3.5 text-blue-600" />
                <span>Checklist View</span>
              </button>
              <button
                type="button"
                id="view-mode-accordion"
                onClick={() => setViewMode('accordion')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'accordion'
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
                <span>Diagnostics View</span>
              </button>
            </div>
          </div>
        </div>

        {/* Progress Metrics & Real-time Task Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-3 border-t border-slate-100">
          {/* Progress Bar Card */}
          <div className="md:col-span-6 p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Remediation Progress
              </span>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  progressPercent === 100
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : progressPercent > 0
                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {progressPercent}% Completed
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 tracking-tight">
                {completedTasks}
              </span>
              <span className="text-xs font-semibold text-slate-500">
                of {totalTasks} Tasks Resolved
              </span>
              {completedTasks === totalTasks && totalTasks > 0 && (
                <span className="ml-auto text-xs font-bold text-emerald-700 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> All Audit Tasks Resolved!
                </span>
              )}
            </div>

            {/* Smooth Progress Track */}
            <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  progressPercent === 100
                    ? 'bg-emerald-500'
                    : progressPercent >= 50
                    ? 'bg-blue-600'
                    : 'bg-indigo-600'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Pending Tasks by Priority Breakdown */}
          <div className="md:col-span-6 grid grid-cols-3 gap-2">
            <button
              type="button"
              id="summary-card-high-priority"
              onClick={() => {
                setPriorityFilter(priorityFilter === 'High' ? 'all' : 'High');
                setSortBy('priority_high_to_low');
              }}
              title="Click to filter by High Priority tasks (sorted urgent first)"
              className={`p-3 rounded-xl border flex flex-col justify-between text-left transition-all cursor-pointer ${
                priorityFilter === 'High'
                  ? 'bg-rose-100/90 border-rose-300 ring-2 ring-rose-500 shadow-xs'
                  : 'bg-rose-50/70 border-rose-100 hover:border-rose-300 hover:shadow-2xs'
              }`}
            >
              <div className="flex items-center justify-between gap-1 text-[11px] font-bold text-rose-800 uppercase">
                <span className="flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-rose-600" />
                  <span>High Priority</span>
                </span>
                {priorityFilter === 'High' && (
                  <span className="text-[9px] bg-rose-600 text-white px-1.5 py-0.2 rounded font-mono font-bold">
                    Active
                  </span>
                )}
              </div>
              <div className="mt-1">
                <span className="text-xl font-black text-rose-900">{highPriorityPendingCount}</span>
                <span className="text-[10px] text-rose-600 block font-medium">Pending Fixes</span>
              </div>
            </button>

            <button
              type="button"
              id="summary-card-medium-priority"
              onClick={() => {
                setPriorityFilter(priorityFilter === 'Medium' ? 'all' : 'Medium');
              }}
              title="Click to filter by Medium Priority tasks"
              className={`p-3 rounded-xl border flex flex-col justify-between text-left transition-all cursor-pointer ${
                priorityFilter === 'Medium'
                  ? 'bg-amber-100/90 border-amber-300 ring-2 ring-amber-500 shadow-xs'
                  : 'bg-amber-50/70 border-amber-100 hover:border-amber-300 hover:shadow-2xs'
              }`}
            >
              <div className="flex items-center justify-between gap-1 text-[11px] font-bold text-amber-800 uppercase">
                <span className="flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Medium</span>
                </span>
                {priorityFilter === 'Medium' && (
                  <span className="text-[9px] bg-amber-600 text-white px-1.5 py-0.2 rounded font-mono font-bold">
                    Active
                  </span>
                )}
              </div>
              <div className="mt-1">
                <span className="text-xl font-black text-amber-900">{mediumPriorityPendingCount}</span>
                <span className="text-[10px] text-amber-600 block font-medium">Pending Fixes</span>
              </div>
            </button>

            <button
              type="button"
              id="summary-card-resolved"
              onClick={() => {
                setStatusFilter(statusFilter === 'completed' ? 'all' : 'completed');
              }}
              title="Click to filter by Resolved/Completed tasks"
              className={`p-3 rounded-xl border flex flex-col justify-between text-left transition-all cursor-pointer ${
                statusFilter === 'completed'
                  ? 'bg-emerald-100/90 border-emerald-300 ring-2 ring-emerald-500 shadow-xs'
                  : 'bg-emerald-50/70 border-emerald-100 hover:border-emerald-300 hover:shadow-2xs'
              }`}
            >
              <div className="flex items-center justify-between gap-1 text-[11px] font-bold text-emerald-800 uppercase">
                <span className="flex items-center gap-1">
                  <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Resolved</span>
                </span>
                {statusFilter === 'completed' && (
                  <span className="text-[9px] bg-emerald-600 text-white px-1.5 py-0.2 rounded font-mono font-bold">
                    Active
                  </span>
                )}
              </div>
              <div className="mt-1">
                <span className="text-xl font-black text-emerald-900">{completedTasks}</span>
                <span className="text-[10px] text-emerald-600 block font-medium">Tasks Checked</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* 2. CONTROLS BAR: STATUS FILTER, TRIAGE PRIORITY, SEARCH, AND BATCH ACTIONS */}
      <div className="rounded-2xl bg-white border border-slate-200 p-4 space-y-3.5 shadow-xs">
        {/* Status Filter & Batch Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Task Status:
            </span>
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                id="filter-status-all"
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Tasks ({totalTasks})
              </button>
              <button
                type="button"
                id="filter-status-pending"
                onClick={() => setStatusFilter('pending')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  statusFilter === 'pending'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-amber-800 hover:bg-amber-100/50'
                }`}
              >
                <span>Pending ({pendingTasks})</span>
              </button>
              <button
                type="button"
                id="filter-status-completed"
                onClick={() => setStatusFilter('completed')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  statusFilter === 'completed'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-emerald-700 hover:bg-emerald-100/50'
                }`}
              >
                <Check className="w-3 h-3" />
                <span>Completed ({completedTasks})</span>
              </button>
            </div>
          </div>

          {/* Quick Batch Actions for Filtered Tasks */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              id="batch-mark-all-completed"
              onClick={() => handleBatchMarkCompleted(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
              title="Mark all currently visible tasks as Completed"
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Mark Filtered Completed</span>
            </button>
            <button
              type="button"
              id="batch-reset-all-pending"
              onClick={() => handleBatchMarkCompleted(false)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors cursor-pointer"
              title="Reset all currently visible tasks to Pending"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to Pending</span>
            </button>
          </div>
        </div>

        {/* Priority Triage Selector */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-md bg-rose-50 text-rose-600">
              <Flame className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Triage by Priority:
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              id="triage-priority-all"
              onClick={() => setPriorityFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                priorityFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Priorities ({issuesState.length})
            </button>
            <button
              type="button"
              id="triage-priority-high"
              onClick={() => setPriorityFilter('High')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                priorityFilter === 'High'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-rose-700 hover:bg-rose-50'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
              <span>High Priority ({issuesState.filter((i) => getIssuePriority(i).level === 'High').length})</span>
            </button>
            <button
              type="button"
              id="triage-priority-medium"
              onClick={() => setPriorityFilter('Medium')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                priorityFilter === 'Medium'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-amber-800 hover:bg-amber-50'
              }`}
            >
              <span>Medium Priority ({issuesState.filter((i) => getIssuePriority(i).level === 'Medium').length})</span>
            </button>
            <button
              type="button"
              id="triage-priority-low"
              onClick={() => setPriorityFilter('Low')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                priorityFilter === 'Low'
                  ? 'bg-slate-700 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>Low Priority ({issuesState.filter((i) => getIssuePriority(i).level === 'Low').length})</span>
            </button>
          </div>
        </div>

        {/* Real-time Search Input Field */}
        <div className="space-y-1.5">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="issues-search-input"
              type="text"
              placeholder="Search checklist tasks by title, page, severity, notes, or DOM element..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-20 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 bg-slate-50/80 hover:bg-white focus:bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 px-2 py-1 text-xs text-slate-400 hover:text-slate-700 bg-slate-200/70 hover:bg-slate-200 rounded-md font-medium transition-colors cursor-pointer"
                title="Clear search"
              >
                Clear ✕
              </button>
            )}
          </div>
          {searchQuery && (
            <div className="flex items-center justify-between text-xs px-1 text-slate-500">
              <span>
                Showing <strong className="text-slate-800">{filtered.length}</strong> matching task
                {filtered.length === 1 ? '' : 's'} for &ldquo;
                <span className="text-blue-600 font-semibold">{searchQuery}</span>&rdquo;
              </span>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-blue-600 hover:underline cursor-pointer font-medium"
              >
                Reset search
              </button>
            </div>
          )}
        </div>

        {/* Severity and Secondary Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
          {/* Severity Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-slate-500 font-medium text-[11px]">Severity:</span>
            <button
              onClick={() => setSeverityFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                severityFilter === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSeverityFilter('critical')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                severityFilter === 'critical'
                  ? 'bg-rose-50 text-rose-700 border border-rose-300'
                  : 'bg-slate-100 text-slate-600 hover:text-rose-600'
              }`}
            >
              <AlertOctagon className="w-3 h-3 text-rose-600" />
              <span>Critical</span>
            </button>
            <button
              onClick={() => setSeverityFilter('warning')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                severityFilter === 'warning'
                  ? 'bg-amber-50 text-amber-700 border border-amber-300'
                  : 'bg-slate-100 text-slate-600 hover:text-amber-600'
              }`}
            >
              <AlertTriangle className="w-3 h-3 text-amber-600" />
              <span>Warning</span>
            </button>
            <button
              onClick={() => setSeverityFilter('passed')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                severityFilter === 'passed'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                  : 'bg-slate-100 text-slate-600 hover:text-emerald-600'
              }`}
            >
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>Passed</span>
            </button>
          </div>

          {/* Page Filter & Category Selector */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium flex items-center gap-1 text-[11px]">
                <Globe className="w-3 h-3 text-slate-400" /> Page:
              </span>
              <select
                id="issues-page-filter"
                value={pageFilter}
                onChange={(e) => setPageFilter(e.target.value)}
                className="px-2 py-1 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 max-w-[200px] truncate"
              >
                <option value="all">All Pages ({distinctPages.length})</option>
                {distinctPages.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            {/* Category Selectors */}
            <div className="flex items-center gap-1 overflow-x-auto">
              {(['all', 'technical', 'performance', 'content', 'ai_readiness'] as const).map(
                (cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold cursor-pointer whitespace-nowrap transition-colors ${
                      categoryFilter === cat
                        ? 'bg-slate-200 text-slate-900 font-bold'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {cat === 'all'
                      ? 'All'
                      : cat === 'technical'
                      ? 'Tech'
                      : cat === 'performance'
                      ? 'CWV'
                      : cat === 'content'
                      ? 'Content'
                      : 'AI'}
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. SORTING & WORKFLOW MANAGEMENT BAR */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2.5 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Left: Quick Priority Sort Toggles */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider">
              <ArrowUpDown className="w-4 h-4 text-blue-600" />
              <span>Sort Tasks:</span>
            </div>

            {/* Quick-Sort: Priority High -> Low Toggle */}
            <button
              type="button"
              id="sort-priority-high-first"
              onClick={() => {
                setSortBy((prev) =>
                  prev === 'priority_high_to_low' ? 'priority_low_to_high' : 'priority_high_to_low'
                );
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                sortBy === 'priority_high_to_low'
                  ? 'bg-rose-600 text-white shadow-xs ring-2 ring-rose-600/30'
                  : sortBy === 'priority_low_to_high'
                  ? 'bg-slate-800 text-white shadow-xs ring-2 ring-slate-800/30'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
              title="Click to toggle between High Priority first (Urgent fixes) and Low Priority first (Quick wins)"
            >
              <Flame className="w-3.5 h-3.5" />
              <span>
                {sortBy === 'priority_high_to_low'
                  ? 'Priority: High → Low (Urgent)'
                  : sortBy === 'priority_low_to_high'
                  ? 'Priority: Low → High (Quick Wins)'
                  : 'Sort by Priority'}
              </span>
              {sortBy === 'priority_high_to_low' ? (
                <ArrowDown className="w-3.5 h-3.5 ml-0.5 text-rose-200" />
              ) : sortBy === 'priority_low_to_high' ? (
                <ArrowUp className="w-3.5 h-3.5 ml-0.5 text-slate-300" />
              ) : null}
            </button>

            {/* Quick-Sort: Critical Severity */}
            <button
              type="button"
              id="sort-severity-critical"
              onClick={() => setSortBy('severity_crit_first')}
              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                sortBy === 'severity_crit_first'
                  ? 'bg-slate-900 text-white font-bold shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <AlertOctagon className="w-3 h-3 text-rose-500" />
              <span>Critical Severity First</span>
            </button>

            {/* Quick-Sort: Pending Tasks */}
            <button
              type="button"
              id="sort-pending-first"
              onClick={() => setSortBy('status_pending_first')}
              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                sortBy === 'status_pending_first'
                  ? 'bg-amber-500 text-white font-bold shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Clock className="w-3 h-3" />
              <span>Pending Tasks First</span>
            </button>
          </div>

          {/* Right: Dropdown with All Sort Modes */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            <span className="text-xs font-medium text-slate-500 hidden sm:inline">Sort Mode:</span>
            <select
              id="issues-sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-2xs cursor-pointer"
            >
              <option value="priority_high_to_low">⚡ Priority: High → Medium → Low (Urgent Fixes)</option>
              <option value="priority_low_to_high">⚡ Priority: Low → Medium → High (Quick Wins First)</option>
              <option value="severity_crit_first">🚨 Severity: Critical → Warning → Passed</option>
              <option value="impact_score_desc">📊 Impact Score: Highest to Lowest (100 → 0)</option>
              <option value="status_pending_first">⏳ Status: Pending Tasks First</option>
              <option value="status_completed_first">✅ Status: Completed Tasks First</option>
              <option value="alphabetical_asc">🔤 Title: Alphabetical (A to Z)</option>
              <option value="page_asc">🌐 Page: Target Path (A to Z)</option>
              <option value="default">📋 Default Crawl Order</option>
            </select>
          </div>
        </div>

        {/* Informative Sorting Status Bar & Visible Priority Distribution */}
        <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200/80 text-slate-600 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">
              Showing {filtered.length} task{filtered.length === 1 ? '' : 's'}
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-600 font-medium">
              Sorted by:{' '}
              <strong className="text-blue-700">
                {sortBy === 'priority_high_to_low' && 'Priority: High → Medium → Low'}
                {sortBy === 'priority_low_to_high' && 'Priority: Low → Medium → High'}
                {sortBy === 'severity_crit_first' && 'Severity: Critical First'}
                {sortBy === 'impact_score_desc' && 'Impact Score (Highest to Lowest)'}
                {sortBy === 'status_pending_first' && 'Pending Tasks First'}
                {sortBy === 'status_completed_first' && 'Completed Tasks First'}
                {sortBy === 'alphabetical_asc' && 'Title (A → Z)'}
                {sortBy === 'page_asc' && 'Page URL Path'}
                {sortBy === 'default' && 'Default Order'}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-1.5 font-mono text-[11px]">
            <span
              className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold border border-rose-200"
              title="Visible High Priority tasks"
            >
              {filtered.filter((i) => getIssuePriority(i).level === 'High').length} High
            </span>
            <span
              className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold border border-amber-200"
              title="Visible Medium Priority tasks"
            >
              {filtered.filter((i) => getIssuePriority(i).level === 'Medium').length} Med
            </span>
            <span
              className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-bold border border-slate-300"
              title="Visible Low Priority tasks"
            >
              {filtered.filter((i) => getIssuePriority(i).level === 'Low').length} Low
            </span>
          </div>
        </div>
      </div>

      {/* 4. TASK LIST VIEW: CHECKLIST MODE vs ACCORDION MODE */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="p-10 text-center bg-white border border-slate-200 rounded-2xl text-slate-400 text-xs space-y-2">
            <ListChecks className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="font-semibold text-slate-700 text-sm">No tasks match your selected filters.</p>
            <p className="text-slate-500 max-w-sm mx-auto">
              Try switching your status filter to &ldquo;All Tasks&rdquo; or clearing your search query.
            </p>
            <button
              type="button"
              onClick={() => {
                setStatusFilter('all');
                setPriorityFilter('all');
                setSeverityFilter('all');
                setCategoryFilter('all');
                setPageFilter('all');
                setSearchQuery('');
              }}
              className="mt-2 px-3 py-1.5 rounded-lg text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 cursor-pointer"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          filtered.map((issue, idx) => {
            const isExp = expandedIssues[issue.id];
            const { level, score, desc } = getIssuePriority(issue);
            const isCompleted = Boolean(issue.isCompleted);

            return (
              <div
                key={issue.id}
                id={`audit-task-${issue.id}`}
                className={`transition-all rounded-xl border overflow-hidden ${
                  isCompleted
                    ? 'bg-emerald-50/25 border-emerald-200 hover:border-emerald-300 shadow-2xs'
                    : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                }`}
              >
                {/* Task Card Header / Interactive Row */}
                <div className="p-4 sm:p-5 flex items-start sm:items-center justify-between gap-3.5">
                  {/* Interactive Checkbox Control */}
                  <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                    <button
                      type="button"
                      id={`toggle-task-${issue.id}`}
                      onClick={(e) => handleToggleComplete(issue.id, e)}
                      aria-label={isCompleted ? 'Mark task as pending' : 'Mark task as completed'}
                      title={isCompleted ? 'Click to mark pending' : 'Click to mark completed'}
                      className={`mt-0.5 sm:mt-0 p-1 rounded-lg transition-all cursor-pointer shrink-0 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                        isCompleted
                          ? 'bg-emerald-600 text-white ring-2 ring-emerald-600/30 hover:bg-emerald-700'
                          : 'bg-slate-100 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 border border-slate-300 hover:border-emerald-500'
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="w-5 h-5 stroke-[2.5]" />
                      ) : (
                        <Square className="w-5 h-5" />
                      )}
                    </button>

                    {/* Task Identity and Metadata */}
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Completion Badge */}
                        {isCompleted ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-600 text-white shrink-0 shadow-2xs">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Completed</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
                            <span>Pending Fix</span>
                          </span>
                        )}

                        {/* Priority Badge */}
                        {getPriorityBadge(issue)}

                        {/* Severity Badge */}
                        {getSeverityBadge(issue.severity)}

                        {/* Category */}
                        {getCategoryBadge(issue.category)}

                        {/* Page Location Badge */}
                        {(issue.pagePath || issue.pageUrl) && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-50 text-blue-800 border border-blue-200 flex items-center gap-1 shrink-0">
                            <MapPin className="w-3 h-3 text-blue-600" />
                            <span className="max-w-[180px] truncate">{issue.pagePath || issue.pageUrl}</span>
                          </span>
                        )}
                      </div>

                      {/* Title & Completed Strikethrough Effect */}
                      <div className="flex items-baseline gap-2">
                        <h4
                          onClick={() => toggleExpand(issue.id)}
                          className={`text-sm sm:text-base font-bold cursor-pointer transition-colors ${
                            isCompleted
                              ? 'line-through text-slate-500 hover:text-slate-700'
                              : 'text-slate-900 hover:text-blue-700'
                          }`}
                        >
                          {issue.title}
                        </h4>
                      </div>

                      {/* Completed At Timestamp & Preview Notes */}
                      {isCompleted && issue.completedAt && (
                        <div className="flex items-center gap-2 text-[11px] text-emerald-800 font-medium">
                          <Clock className="w-3 h-3 text-emerald-600" />
                          <span>
                            Resolved on{' '}
                            {new Date(issue.completedAt).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}{' '}
                            at{' '}
                            {new Date(issue.completedAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      )}

                      {/* Attached Resolution Note Preview */}
                      {issue.completionNotes && (
                        <div className="mt-1 p-2 rounded-lg bg-emerald-100/60 border border-emerald-200 text-xs text-emerald-900 flex items-start gap-1.5 font-sans">
                          <Edit3 className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <span className="font-bold text-[10px] uppercase tracking-wider block text-emerald-800">
                              Resolution Note:
                            </span>
                            <span className="italic">{issue.completionNotes}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Expand / Collapse Details Button */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => toggleExpand(issue.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                      title={isExp ? 'Collapse remediation details' : 'Expand remediation details'}
                    >
                      <ChevronDown
                        className={`w-5 h-5 transition-transform duration-200 ${
                          isExp ? 'transform rotate-180 text-slate-800' : ''
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Expanded Actionable Remediation Guidance */}
                {isExp && (
                  <div className="px-5 pb-5 pt-2 border-t border-slate-100 space-y-4 text-xs text-slate-700 bg-white/70">
                    {/* Priority & Impact Context */}
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`p-1.5 rounded-lg ${
                            level === 'High'
                              ? 'bg-rose-100 text-rose-700'
                              : level === 'Medium'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          <Zap className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-xs text-slate-900">
                              Triage Rating: {level} Priority
                            </span>
                            <span className="text-[10px] font-mono font-bold bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-700">
                              Impact Score: {score}/100
                            </span>
                            {/* 1-Click Priority Reassign Buttons */}
                            <div className="inline-flex items-center gap-1 ml-1 bg-white p-0.5 rounded-lg border border-slate-200">
                              <span className="text-[10px] text-slate-400 px-1 font-medium">Set:</span>
                              <button
                                type="button"
                                onClick={() => handleSetPriority(issue.id, 'High')}
                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                                  level === 'High'
                                    ? 'bg-rose-600 text-white shadow-2xs'
                                    : 'text-slate-600 hover:text-rose-600 hover:bg-rose-50'
                                }`}
                                title="Set to High Priority"
                              >
                                High
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSetPriority(issue.id, 'Medium')}
                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                                  level === 'Medium'
                                    ? 'bg-amber-600 text-white shadow-2xs'
                                    : 'text-slate-600 hover:text-amber-600 hover:bg-amber-50'
                                }`}
                                title="Set to Medium Priority"
                              >
                                Medium
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSetPriority(issue.id, 'Low')}
                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                                  level === 'Low'
                                    ? 'bg-slate-700 text-white shadow-2xs'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                                }`}
                                title="Set to Low Priority"
                              >
                                Low
                              </button>
                            </div>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">{desc}</p>
                        </div>
                      </div>

                      {/* Visual Impact Score Bar */}
                      <div className="sm:w-40 shrink-0">
                        <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                          <span>Algorithmic Weight</span>
                          <span className="font-bold">{score}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              score >= 70
                                ? 'bg-rose-600'
                                : score >= 40
                                ? 'bg-amber-500'
                                : 'bg-slate-500'
                            }`}
                            style={{ width: `${score}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Target Page URL & Location */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                      <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-600">
                        <span className="flex items-center gap-1.5 text-blue-700">
                          <Globe className="w-3.5 h-3.5" />
                          <span>Detected Location in Page Scope</span>
                        </span>
                        {issue.pageUrl && (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => copyPageUrl(issue.pageUrl!, issue.id)}
                              className="text-slate-500 hover:text-slate-800 font-semibold flex items-center gap-1 text-[11px] cursor-pointer"
                            >
                              {copiedPageUrlId === issue.id ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  <span className="text-emerald-600">Copied URL</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Copy URL</span>
                                </>
                              )}
                            </button>
                            <a
                              href={issue.pageUrl}
                              target="_blank"
                              rel="noreferrer noopener"
                              className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 text-[11px]"
                            >
                              <span>Open URL</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">
                            Target Page URL:
                          </span>
                          <span className="font-mono text-slate-800 font-semibold break-all text-[11px]">
                            {issue.pageUrl || issue.pagePath || 'Global Site Scope'}
                          </span>
                        </div>
                        <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">
                            Relative Path &amp; Section:
                          </span>
                          <span className="font-mono text-blue-800 font-semibold break-all text-[11px]">
                            {issue.pagePath || '/'} • {issue.pageLocation || 'HTML Document'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* DOM Selector Path */}
                    <div className="p-4 rounded-xl bg-slate-900 text-slate-100 space-y-2 font-mono">
                      <div className="flex items-center justify-between text-[11px] uppercase font-sans font-bold">
                        <span className="flex items-center gap-1.5 text-cyan-400">
                          <Compass className="w-4 h-4 text-cyan-400" />
                          <span>DOM Selector Path (Exact Target Element)</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => copySelector(getDomSelectorPath(issue), issue.id)}
                          className="text-slate-300 hover:text-white flex items-center gap-1 text-xs cursor-pointer font-sans normal-case transition-colors"
                        >
                          {copiedSelectorId === issue.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400">Copied Selector</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy Selector</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-cyan-300 text-xs break-all">
                        <code>{getDomSelectorPath(issue)}</code>
                      </div>

                      {issue.affectedElement && (
                        <div className="pt-1 text-[11px] text-slate-400 font-sans">
                          <span className="text-slate-400 text-[10px] uppercase font-bold block mb-0.5">
                            Affected Markup / Code:
                          </span>
                          <code className="text-slate-300 font-mono text-[11px] break-all">
                            {issue.affectedElement}
                          </code>
                        </div>
                      )}
                    </div>

                    {/* Diagnostic Finding & Impact */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                        <div className="font-bold text-[11px] uppercase tracking-wider text-slate-500 mb-1">
                          Finding &amp; Diagnostic
                        </div>
                        <p className="leading-relaxed">{issue.description}</p>
                      </div>

                      <div className="p-3 rounded-lg bg-blue-50/50 border border-blue-100">
                        <div className="font-bold text-[11px] uppercase tracking-wider text-blue-700 mb-1">
                          Search &amp; AI Discovery Impact
                        </div>
                        <p className="leading-relaxed">{issue.impact}</p>
                      </div>
                    </div>

                    {/* Granular Step-by-Step Fix Instructions */}
                    <div className="p-4 rounded-xl bg-indigo-50/80 border border-indigo-200 text-indigo-950 space-y-2">
                      <div className="font-bold text-xs text-indigo-900 flex items-center gap-1.5 uppercase tracking-wider">
                        <HelpCircle className="w-4 h-4 text-indigo-600" />
                        <span>Step-by-Step Fix Instructions:</span>
                      </div>
                      <div className="text-xs leading-relaxed whitespace-pre-line pl-1 font-medium text-indigo-900">
                        {getGranularHowToFix(issue)}
                      </div>
                    </div>

                    {/* Recommended Code Markup */}
                    <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-100 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[11px] uppercase tracking-wider text-emerald-800">
                          Recommended Code Markup &amp; Implementation
                        </span>
                        {issue.codeSnippet && (
                          <button
                            type="button"
                            onClick={() => copyCode(issue.codeSnippet!, issue.id)}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 cursor-pointer"
                          >
                            {copiedCodeId === issue.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                            <span>{copiedCodeId === issue.id ? 'Copied' : 'Copy Snippet'}</span>
                          </button>
                        )}
                      </div>
                      <p>{issue.recommendation}</p>

                      {issue.codeSnippet && (
                        <div className="mt-2 p-3 rounded-lg bg-slate-900 text-emerald-400 font-mono text-[11px] overflow-x-auto">
                          <pre>{issue.codeSnippet}</pre>
                        </div>
                      )}
                    </div>

                    {/* Resolution Notes Input / Persistence Section */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
                          <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                          <span>Task Resolution Notes (Saved to Audit Object)</span>
                        </span>
                        {editingNoteId !== issue.id && (
                          <button
                            type="button"
                            onClick={(e) => handleStartEditingNote(issue, e)}
                            className="text-xs font-semibold text-blue-600 hover:text-blue-800 cursor-pointer"
                          >
                            {issue.completionNotes ? 'Edit Note' : '+ Add Note'}
                          </button>
                        )}
                      </div>

                      {editingNoteId === issue.id ? (
                        <div className="space-y-2">
                          <textarea
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                            placeholder="Add notes on how this was resolved (e.g., 'Added meta description in Next.js layout.tsx', 'Compress hero banner via Cloudinary')..."
                            className="w-full p-2.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-2xs"
                            rows={3}
                          />
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingNoteId(null);
                                setNoteText('');
                              }}
                              className="px-3 py-1 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200 cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveResolutionNote(issue.id)}
                              className="px-3 py-1 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-2xs cursor-pointer"
                            >
                              Save Note
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          {issue.completionNotes ? (
                            <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-700 italic">
                              &ldquo;{issue.completionNotes}&rdquo;
                            </div>
                          ) : (
                            <p className="text-[11px] text-slate-400">
                              No notes logged yet. Click &ldquo;+ Add Note&rdquo; to attach implementation details or team comments.
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Quick Mark Complete / Reopen CTA Bar */}
                    <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                      <span className="text-[11px] text-slate-500">
                        Status:{' '}
                        <strong className={isCompleted ? 'text-emerald-700' : 'text-amber-700'}>
                          {isCompleted ? 'Completed & Resolved' : 'Pending Action'}
                        </strong>
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleToggleComplete(issue.id, e)}
                        className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                          isCompleted
                            ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                            : 'bg-emerald-600 text-white hover:bg-emerald-700'
                        }`}
                      >
                        {isCompleted ? (
                          <>
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Mark Back as Pending</span>
                          </>
                        ) : (
                          <>
                            <CheckSquare className="w-3.5 h-3.5" />
                            <span>Mark Task as Completed</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
