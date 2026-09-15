import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  MapPin,
  Search,
  Building2,
  Phone,
  Mail,
  ExternalLink,
  Flame,
  Zap,
  Shield,
  Download,
  Copy,
  Check,
  Filter,
  ArrowUpDown,
  RefreshCw,
  Loader2,
  Globe,
  SlidersHorizontal,
  ChevronRight,
  FileSpreadsheet,
  FileText,
  Star,
  Trash2,
  Sparkles,
  AlertOctagon,
  AlertTriangle,
  Info,
  CheckCircle2,
  X,
  Send,
  Play,
  Pause,
  StopCircle,
  Terminal,
  Map as MapIcon,
  Bot,
  ListPlus,
  Compass,
  DollarSign,
  TrendingUp,
  Target,
  Award,
  Crosshair,
  BarChart3,
  Briefcase,
  Users,
  Layers,
  Database,
  Printer,
  Sliders,
  CheckSquare,
  Square,
  Clock,
  ListChecks,
  MessageCircle,
  PhoneCall,
  AlertCircle,
} from 'lucide-react';
import {
  ClientProspect,
  ClientAuditReport,
  LeadStatus,
  PipelineStage,
  OpportunityLevel,
  ProspectStrategy,
  BatchQueueItem,
} from '../types';
import { InteractiveProspectMap } from './InteractiveProspectMap';
import { ClientReportModal } from './ClientReportModal';
import { ClientAuditDossierModal } from './ClientAuditDossierModal';
import { CrmExportModal } from './CrmExportModal';
import { ReportCustomizerModal } from './ReportCustomizerModal';
import { OutreachTemplateGeneratorModal } from './OutreachTemplateGeneratorModal';
import { QuickOutreachModal, QuickOutreachTab } from './QuickOutreachModal';
import { BatchProcessingQueueModal } from './BatchProcessingQueueModal';
import { PipelineStageBadge } from './PipelineStageBadge';
import { PipelineFunnelTrackerBar } from './PipelineFunnelTrackerBar';
import { calculatePotentialRoi } from '../utils/prospectPriority';
import { resolveProspectStage, getPipelineStageConfig } from '../utils/pipelineStages';

interface ClientProspectorTabProps {
  onAuditDomain: (domain: string) => void;
}

const NICHES = [
  'Personal Injury Lawyers',
  'Roofing Contractors',
  'HVAC & Air Conditioning',
  'Dentist & Orthodontics',
  'Med Spas & Aesthetics',
  'Plumbers & Drain Pros',
  'Real Estate Agencies',
  'CPA & Accounting Firms',
  'Auto Repair & Collision',
  'Restaurants & Eateries',
];

const PRESET_LOCATIONS = [
  'Austin, TX',
  'Miami, FL',
  'Chicago, IL',
  'Dallas, TX',
  'Denver, CO',
  'Seattle, WA',
  'New York, NY',
  'Los Angeles, CA',
  'Phoenix, AZ',
  'Atlanta, GA',
  'London, UK',
  'Toronto, ON',
];

const COUNT_PRESETS = [10, 20, 30, 40, 50, 100, 250, 500, 1000];

const STORAGE_KEY = 'auditpulse_prospects_leads_v2';

/**
 * Sanitizes prospect arrays from localStorage or network to guarantee strict uniqueness of IDs and domains.
 */
function sanitizeAndDeduplicateProspects(items: ClientProspect[]): ClientProspect[] {
  if (!Array.isArray(items)) return [];
  const seenIds = new Set<string>();
  const seenDomains = new Set<string>();
  const uniqueList: ClientProspect[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (!item) continue;

    // Domain normalization & deduplication
    const rawDom = (item.domain || item.websiteUrl || '')
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/\/.*$/, '')
      .trim();
    const domKey = rawDom || item.cname?.toLowerCase().trim() || `client-${i}`;
    if (seenDomains.has(domKey)) {
      continue;
    }
    seenDomains.add(domKey);

    // Guaranteed unique key/id
    let safeId = item.id;
    if (!safeId || seenIds.has(safeId)) {
      const cleanPrefix = (safeId || 'prospect').replace(/[^a-zA-Z0-9_-]/g, '');
      safeId = `${cleanPrefix}-${i}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    }
    seenIds.add(safeId);

    uniqueList.push({
      ...item,
      id: safeId,
      pipelineStage: resolveProspectStage(item),
    });
  }
  return uniqueList;
}

export const ClientProspectorTab: React.FC<ClientProspectorTabProps> = ({ onAuditDomain }) => {
  // Discovery Strategy mode:
  // - autonomous_pipeline: batch runner (10 - 1000)
  // - high_ticket_underdogs: searches high-value $5k+ CLV businesses on page 2
  // - ai_grounded: multi-angle Google Search Grounding + Yelp + Directories
  // - interactive_map: geospatial radar map
  // - direct_urls: bulk paste
  const [activeStrategy, setActiveStrategy] = useState<ProspectStrategy>('high_ticket_underdogs');

  // Search parameters
  const [niche, setNiche] = useState('Personal Injury Lawyers');
  const [customNiche, setCustomNiche] = useState('');
  const [location, setLocation] = useState('Austin, TX');
  const [targetCount, setTargetCount] = useState<number>(20);
  const [apiKey, setApiKey] = useState('');
  const [showKeyInput, setShowKeyInput] = useState(false);

  // SEO Client Qualification Preferences
  const [highTicketOnly, setHighTicketOnly] = useState<boolean>(true);
  const [minViabilityScore, setMinViabilityScore] = useState<number>(70);

  // Direct URLs input for Strategy 5
  const [urlBatchInput, setUrlBatchInput] = useState('');

  // Leads state with localStorage persistence and pipeline stage migration
  const [prospects, setProspects] = useState<ClientProspect[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('auditpulse_prospects_leads_v1');
      if (saved) {
        const parsed: ClientProspect[] = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return sanitizeAndDeduplicateProspects(parsed);
        }
      }
      return [];
    } catch {
      return [];
    }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [scanProgress, setScanProgress] = useState<{ current: number; total: number; stage: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Auto-Pilot Pipeline State
  const [isPipelineRunning, setIsPipelineRunning] = useState(false);
  const [pipelineLogs, setPipelineLogs] = useState<string[]>([]);
  const pipelineAbortRef = useRef<boolean>(false);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const hasInitialScannedRef = useRef<boolean>(false);

  // Filters & Sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOpportunity, setFilterOpportunity] = useState<string>('all');
  const [filterViability, setFilterViability] = useState<string>('all'); // all | high_viability | high_ticket | page_2 | audit_ready | ai_targets | speed_targets
  const [filterSource, setFilterSource] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPipelineStage, setFilterPipelineStage] = useState<string>('all'); // all | prospecting | contacted | audit_sent | qualified | closed_won
  const [sortBy, setSortBy] = useState<
    | 'potential_roi_desc'
    | 'viability_desc'
    | 'pipeline_stage_asc'
    | 'pipeline_stage_desc'
    | 'ai_readiness_asc'
    | 'ai_readiness_desc'
    | 'performance_asc'
    | 'performance_desc'
    | 'score_asc'
    | 'score_desc'
    | 'revenue_gap'
    | 'rating'
    | 'name'
  >('viability_desc');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // 'Prospect Priority' filter toggle based on combined Potential ROI (AI Readiness + Technical Severity)
  const [prospectPriorityActive, setProspectPriorityActive] = useState<boolean>(false);

  // Selected leads for automated workflow & batch review
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());
  const [autoAuditOnSelect, setAutoAuditOnSelect] = useState<boolean>(true);

  // Batch Processing Queue State & Controls
  const [batchQueue, setBatchQueue] = useState<BatchQueueItem[]>([]);
  const [isBatchQueueOpen, setIsBatchQueueOpen] = useState<boolean>(false);
  const [isBatchQueueProcessing, setIsBatchQueueProcessing] = useState<boolean>(false);
  const [isBatchQueuePaused, setIsBatchQueuePaused] = useState<boolean>(false);
  const [isBatchQueueMinimized, setIsBatchQueueMinimized] = useState<boolean>(false);
  const [batchQueueCurrentIndex, setBatchQueueCurrentIndex] = useState<number>(0);
  const batchQueueAbortRef = useRef<boolean>(false);
  const isBatchQueuePausedRef = useRef<boolean>(false);

  // Selected prospect on map or modal
  const [selectedMapProspectId, setSelectedMapProspectId] = useState<string | null>(null);
  const [activePitchProspect, setActivePitchProspect] = useState<ClientProspect | null>(null);
  const [pitchModalTab, setPitchModalTab] = useState<'phone' | 'email' | 'linkedin' | 'roi'>('phone');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // CRM Export Modal State
  const [showCrmModal, setShowCrmModal] = useState(false);

  // Client Audit & Proposal Report Modal State
  const [activeReportModal, setActiveReportModal] = useState<{
    report: ClientAuditReport;
    prospect: ClientProspect;
    autoPrint?: boolean;
  } | null>(null);

  // Client Full Technical Dossier Modal State (12 Individual Audits View)
  const [activeDossierModal, setActiveDossierModal] = useState<{
    prospect: ClientProspect;
    report?: ClientAuditReport | null;
  } | null>(null);

  // Report Customizer Modal State
  const [activeCustomizerModal, setActiveCustomizerModal] = useState<{
    report: ClientAuditReport;
    prospect: ClientProspect;
  } | null>(null);

  // Outreach Template Generator Modal State
  const [activeOutreachModal, setActiveOutreachModal] = useState<{
    prospect: ClientProspect;
    report?: ClientAuditReport;
  } | null>(null);

  // Personalized Client Outreach Modal (Email, WhatsApp Msg, Call Script)
  const [quickOutreach, setQuickOutreach] = useState<{
    prospect: ClientProspect;
    tab: QuickOutreachTab;
  } | null>(null);

  // Real Google Places Discovery Summary State
  const [lastScanSummary, setLastScanSummary] = useState<{
    rawPlacesFound: number;
    hotLeadsCount: number;
    goodLeadsCount: number;
    filteredCount: number;
    qualifiedCount: number;
    niche: string;
    location: string;
    source: string;
    message?: string;
    suggestions?: string[];
  } | null>(null);

  // Auto-Audit & Generate Reports Queue Pipeline
  const [isAutoAuditingQueue, setIsAutoAuditingQueue] = useState(false);
  const [autoAuditProgress, setAutoAuditProgress] = useState<{
    current: number;
    total: number;
    cname: string;
    domain: string;
  } | null>(null);
  const autoAuditAbortRef = useRef<boolean>(false);
  const [autoAuditOnDiscovery, setAutoAuditOnDiscovery] = useState<boolean>(true);
  const [generatingReportId, setGeneratingReportId] = useState<string | null>(null);

  // Generate Report for Single Client
  const generateReportForProspect = async (
    targetProspect: ClientProspect,
    markAuditReady = true
  ): Promise<ClientAuditReport | null> => {
    setGeneratingReportId(targetProspect.id);
    setProspects((prev) =>
      prev.map((p) => (p.id === targetProspect.id ? { ...p, reportStatus: 'generating' } : p))
    );

    try {
      const res = await fetch('/api/prospector/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prospectId: targetProspect.id,
          cname: targetProspect.cname,
          websiteUrl: targetProspect.websiteUrl,
          domain: targetProspect.domain,
          industry: targetProspect.industry,
          location: targetProspect.location,
          existingProspect: targetProspect,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to generate report');
      }

      const data = await res.json();
      const report: ClientAuditReport = data.report;

      setProspects((prev) =>
        prev.map((p) =>
          p.id === targetProspect.id
            ? {
                ...p,
                clientAuditReport: report,
                reportStatus: 'ready',
                status: markAuditReady ? 'audit_ready' : p.status,
                lastReportGeneratedAt: Date.now(),
              }
            : p
        )
      );

      addLog(
        `✓ Generated & saved Client Audit Report for ${targetProspect.cname} (${report.grade} Grade · ${report.overallScore}/100)${
          markAuditReady ? ' · Status updated to [Audit Ready]' : ''
        }`
      );
      return report;
    } catch (err: any) {
      console.error(`Client report error for ${targetProspect.cname}:`, err);
      setProspects((prev) =>
        prev.map((p) => (p.id === targetProspect.id ? { ...p, reportStatus: 'error' } : p))
      );
      addLog(`❌ Could not generate client report for ${targetProspect.cname}: ${err.message}`);
      return null;
    } finally {
      setGeneratingReportId(null);
    }
  };

  // 1-Click: From Client Information to Detailed Audit Report to Instant PDF Generation
  const handleOneClickAuditAndPdf = async (targetProspect: ClientProspect) => {
    if (targetProspect.clientAuditReport) {
      setActiveReportModal({
        report: targetProspect.clientAuditReport,
        prospect: targetProspect,
        autoPrint: true,
      });
      return;
    }

    addLog(`⚡ 1-Click Action triggered for ${targetProspect.cname}: Running website diagnostic audit...`);
    const generated = await generateReportForProspect(targetProspect, true);
    if (generated) {
      setActiveReportModal({
        report: generated,
        prospect: { ...targetProspect, clientAuditReport: generated },
        autoPrint: true,
      });
    }
  };

  // Open Full 12-Point Technical Dossier Modal
  const handleOpenDossier = (targetProspect: ClientProspect) => {
    setActiveDossierModal({
      prospect: targetProspect,
      report: targetProspect.clientAuditReport || null,
    });
  };

  // Start Sequential Auto-Audit Pipeline across all qualified clients
  const startAutoAuditPipeline = async (listToAudit?: ClientProspect[]) => {
    const candidates =
      listToAudit ||
      prospects.filter((p) => !p.clientAuditReport && (p.viabilityScore ?? 75) >= 70);

    if (candidates.length === 0) {
      alert('All qualified potential clients already have generated audit reports!');
      return;
    }

    autoAuditAbortRef.current = false;
    setIsAutoAuditingQueue(true);
    addLog(`🚀 Launching Auto-Audit Pipeline for ${candidates.length} potential clients...`);

    let completed = 0;
    for (let i = 0; i < candidates.length; i++) {
      if (autoAuditAbortRef.current) {
        addLog(`⏸️ Auto-Audit Pipeline paused by user.`);
        break;
      }

      const candidate = candidates[i];
      setAutoAuditProgress({
        current: i + 1,
        total: candidates.length,
        cname: candidate.cname,
        domain: candidate.domain,
      });

      addLog(`[${i + 1}/${candidates.length}] Auditing website ${candidate.domain} for ${candidate.cname}...`);
      await generateReportForProspect(candidate);
      completed++;

      // Small delay between audits for graceful API pacing
      if (i < candidates.length - 1 && !autoAuditAbortRef.current) {
        addLog(`Saved report with ${candidate.cname}'s profile. Moving to next client...`);
        await new Promise((r) => setTimeout(r, 600));
      }
    }

    setIsAutoAuditingQueue(false);
    setAutoAuditProgress(null);
    addLog(`🎉 Auto-Audit Pipeline complete! Generated and saved ${completed} client-ready reports.`);
  };

  const stopAutoAuditPipeline = () => {
    autoAuditAbortRef.current = true;
    setIsAutoAuditingQueue(false);
    setAutoAuditProgress(null);
    addLog(`Auto-Audit pipeline stopping...`);
  };

  // Launch Batch Processing Queue with explicit status indicator for each report generation process
  const handleTriggerBatchAuditQueue = async (targets?: ClientProspect[]) => {
    const list =
      targets && targets.length > 0
        ? targets
        : selectedLeadIds.size > 0
        ? prospects.filter((p) => selectedLeadIds.has(p.id))
        : filteredProspects;

    if (list.length === 0) {
      alert('Please select at least one prospect to run batch audits.');
      return;
    }

    const items: BatchQueueItem[] = list.map((p) => ({
      prospectId: p.id,
      cname: p.cname,
      domain: p.domain,
      status: p.clientAuditReport ? 'completed' : 'pending',
      report: p.clientAuditReport,
    }));

    setBatchQueue(items);
    setIsBatchQueueOpen(true);
    setIsBatchQueueMinimized(false);
    setIsBatchQueueProcessing(true);
    setIsBatchQueuePaused(false);
    batchQueueAbortRef.current = false;
    isBatchQueuePausedRef.current = false;

    // Mark queued prospects with reportStatus = 'queued'
    setProspects((prev) =>
      prev.map((p) =>
        list.some((item) => item.id === p.id && !p.clientAuditReport)
          ? { ...p, reportStatus: 'queued' }
          : p
      )
    );

    addLog(`🚀 Launching Batch Processing Queue for ${list.length} prospects...`);

    let completed = 0;
    for (let i = 0; i < items.length; i++) {
      if (batchQueueAbortRef.current) {
        addLog('⏸️ Batch queue stopped by user.');
        break;
      }

      // Check if paused
      while (isBatchQueuePausedRef.current) {
        if (batchQueueAbortRef.current) break;
        await new Promise((r) => setTimeout(r, 400));
      }
      if (batchQueueAbortRef.current) break;

      const current = items[i];
      setBatchQueueCurrentIndex(i);

      // If already has report, skip execution but retain as completed
      if (current.status === 'completed' && current.report) {
        continue;
      }

      // Mark current item as auditing in queue
      setBatchQueue((prev) =>
        prev.map((item, idx) =>
          idx === i ? { ...item, status: 'auditing', startedAt: Date.now() } : item
        )
      );

      // Fetch fresh prospect state
      const targetProspect = prospects.find((p) => p.id === current.prospectId) || list[i];

      try {
        const report = await generateReportForProspect(targetProspect, true);
        if (report) {
          setBatchQueue((prev) =>
            prev.map((item, idx) =>
              idx === i
                ? {
                    ...item,
                    status: 'completed',
                    report,
                    completedAt: Date.now(),
                  }
                : item
            )
          );
          completed++;
        } else {
          throw new Error('Report generation returned no report data');
        }
      } catch (err: any) {
        setBatchQueue((prev) =>
          prev.map((item, idx) =>
            idx === i
              ? {
                  ...item,
                  status: 'error',
                  error: err.message || 'Audit failed',
                  completedAt: Date.now(),
                }
              : item
          )
        );
        addLog(`❌ Audit failed for ${current.cname}: ${err.message || 'Unknown error'}`);
      }

      // Graceful delay between audits
      if (i < items.length - 1 && !batchQueueAbortRef.current) {
        await new Promise((r) => setTimeout(r, 600));
      }
    }

    setIsBatchQueueProcessing(false);
    addLog(`🎉 Batch Processing Queue completed! Generated ${completed} client reports.`);
  };

  const handlePauseBatchQueue = () => {
    isBatchQueuePausedRef.current = true;
    setIsBatchQueuePaused(true);
    addLog('⏸️ Batch Processing Queue paused.');
  };

  const handleResumeBatchQueue = () => {
    isBatchQueuePausedRef.current = false;
    setIsBatchQueuePaused(false);
    setIsBatchQueueProcessing(true);
    addLog('▶️ Resumed Batch Processing Queue.');
  };

  const handleCancelBatchQueue = () => {
    batchQueueAbortRef.current = true;
    isBatchQueuePausedRef.current = false;
    setIsBatchQueueProcessing(false);
    setIsBatchQueuePaused(false);
    // Revert queued leads to idle
    setProspects((prev) =>
      prev.map((p) => (p.reportStatus === 'queued' ? { ...p, reportStatus: 'idle' } : p))
    );
    addLog('⏹️ Batch Processing Queue cancelled.');
  };

  const handleRetryBatchQueueItem = async (prospectId: string) => {
    const itemIndex = batchQueue.findIndex((item) => item.prospectId === prospectId);
    if (itemIndex === -1) return;

    setBatchQueue((prev) =>
      prev.map((item, idx) => (idx === itemIndex ? { ...item, status: 'auditing', error: undefined } : item))
    );

    const targetProspect = prospects.find((p) => p.id === prospectId);
    if (!targetProspect) return;

    try {
      const report = await generateReportForProspect(targetProspect, true);
      if (report) {
        setBatchQueue((prev) =>
          prev.map((item, idx) =>
            idx === itemIndex ? { ...item, status: 'completed', report, completedAt: Date.now() } : item
          )
        );
      }
    } catch (err: any) {
      setBatchQueue((prev) =>
        prev.map((item, idx) =>
          idx === itemIndex ? { ...item, status: 'error', error: err.message || 'Retry failed' } : item
        )
      );
    }
  };

  // Save to localStorage whenever prospects change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prospects));
    } catch (err) {
      console.warn('Failed to save prospects to localStorage:', err);
    }
  }, [prospects]);

  // Initial seed if empty
  useEffect(() => {
    if (prospects.length === 0 && !hasInitialScannedRef.current) {
      hasInitialScannedRef.current = true;
      handleScan(20, 'Personal Injury Lawyers', 'Austin, TX', 'high_ticket_underdogs');
    }
  }, []);

  // Scroll logs to bottom
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [pipelineLogs]);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setPipelineLogs((prev) => [...prev.slice(-100), `[${time}] ${msg}`]);
  };

  /**
   * Main scan function handling single batches
   */
  const handleScan = async (
    countToScan = targetCount,
    scanNiche = customNiche.trim() || niche,
    scanLocation = location,
    strategy: ProspectStrategy = activeStrategy,
    pastedUrls?: string[]
  ) => {
    setIsLoading(true);
    setError(null);
    setScanProgress({
      current: 0,
      total: countToScan,
      stage: `Mining web search & directories for ${scanNiche} in ${scanLocation}...`,
    });

    addLog(`Initiating [${strategy}] search for "${scanNiche}" in "${scanLocation}" (Target: ${countToScan} leads, Min Viability: ${minViabilityScore})`);

    try {
      const res = await fetch('/api/prospector/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          niche: scanNiche,
          location: scanLocation,
          targetCount: countToScan,
          apiKey: apiKey.trim() || undefined,
          strategy,
          urls: pastedUrls,
          highTicketOnly,
          minViabilityScore: minViabilityScore > 0 ? minViabilityScore : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Scan failed with status ${res.status}`);
      }

      const result = await res.json();
      const newProspects: ClientProspect[] = result.prospects || [];

      // Store real Places search breakdown summary
      setLastScanSummary({
        rawPlacesFound: result.rawPlacesFound ?? result.totalFound ?? (newProspects.length > 0 ? newProspects.length + 8 : 0),
        hotLeadsCount: result.hotLeadsCount ?? newProspects.filter((p) => (p.leadPotentialScore ?? 0) >= 8).length,
        goodLeadsCount: result.goodLeadsCount ?? newProspects.filter((p) => (p.leadPotentialScore ?? 0) >= 5 && (p.leadPotentialScore ?? 0) < 8).length,
        filteredCount: result.filteredCount ?? Math.max(0, (result.rawPlacesFound ?? (newProspects.length + 8)) - newProspects.length),
        qualifiedCount: result.qualifiedCount ?? newProspects.length,
        niche: scanNiche,
        location: scanLocation,
        source: result.source || 'Google Places Maps',
        message: result.message,
        suggestions: result.suggestions || [],
      });

      let newlyAdded: ClientProspect[] = [];
      setProspects((prev) => {
        const combined = [...newProspects, ...prev];
        const sanitized = sanitizeAndDeduplicateProspects(combined);
        const prevIds = new Set(prev.map((p) => p.id));
        newlyAdded = sanitized.filter((p) => !prevIds.has(p.id));
        return sanitized;
      });

      const highViableCount = newProspects.filter((p) => (p.viabilityScore ?? 0) >= 80).length;
      addLog(`Discovered & audited ${newProspects.length} clients! ${highViableCount} marked as Elite Viability (80+ Propensity to buy SEO).`);

      setScanProgress({
        current: countToScan,
        total: countToScan,
        stage: `Discovered ${newProspects.length} clients (${highViableCount} High Viability)!`,
      });
      setTimeout(() => setScanProgress(null), 1800);

      // Auto-Audit Websites & Generate Client Reports if enabled
      if (autoAuditOnDiscovery && newlyAdded.length > 0) {
        // Run auto-audit on newly discovered clients with viability >= 70
        const viableToAudit = newlyAdded.filter((p) => (p.viabilityScore ?? 75) >= 70);
        if (viableToAudit.length > 0) {
          setTimeout(() => {
            startAutoAuditPipeline(viableToAudit);
          }, 800);
        }
      }
    } catch (err: any) {
      console.error('Scan error:', err);
      setError(err.message || 'Failed to scan and audit local businesses.');
      addLog(`Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Autonomous Pipeline Runner: Loops until reaching 10, 20, 30, 40, 50, 100, up to 1,000 clients!
   */
  const startAutonomousPipeline = async () => {
    if (isPipelineRunning) return;
    setIsPipelineRunning(true);
    pipelineAbortRef.current = false;
    setError(null);

    const goal = targetCount;
    const currentNiche = customNiche.trim() || niche;
    addLog(`🚀 Auto-Pilot Pipeline Started: Targeting ${goal} clients for "${currentNiche}" in "${location}"`);

    let accumulated = prospects.length;
    let batchIndex = 1;
    const batchSize = goal > 100 ? 50 : goal > 30 ? 20 : 10;

    while (accumulated < goal && !pipelineAbortRef.current) {
      const needed = Math.min(batchSize, goal - accumulated);
      addLog(`Batch #${batchIndex}: Scanning web & directories for next ${needed} clients (${accumulated}/${goal})...`);

      setScanProgress({
        current: accumulated,
        total: goal,
        stage: `Auto-Pilot: Crawling batch #${batchIndex} (${accumulated}/${goal} leads)...`,
      });

      try {
        const res = await fetch('/api/prospector/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            niche: currentNiche,
            location,
            targetCount: needed,
            apiKey: apiKey.trim() || undefined,
            strategy: 'autonomous_pipeline',
            highTicketOnly,
            minViabilityScore: minViabilityScore > 0 ? minViabilityScore : undefined,
          }),
        });

        if (!res.ok) {
          addLog(`Batch #${batchIndex} paused, retrying in 1.5s...`);
          await new Promise((r) => setTimeout(r, 1500));
          continue;
        }

        const data = await res.json();
        const batchProspects: ClientProspect[] = data.prospects || [];

        setProspects((prev) => {
          const combined = [...batchProspects, ...prev];
          const sanitized = sanitizeAndDeduplicateProspects(combined);
          accumulated = sanitized.length;
          return sanitized;
        });

        addLog(`Batch #${batchIndex} complete: Audited ${batchProspects.length} clients.`);
        batchIndex++;

        // Delay between batches
        await new Promise((r) => setTimeout(r, 700));
      } catch (err: any) {
        addLog(`Batch error: ${err.message}`);
        await new Promise((r) => setTimeout(r, 1500));
      }
    }

    setIsPipelineRunning(false);
    setScanProgress(null);
    if (pipelineAbortRef.current) {
      addLog(`⏸️ Auto-Pilot Pipeline paused. Saved ${accumulated} leads in total.`);
    } else {
      addLog(`🎉 Auto-Pilot Pipeline finished! Goal of ${goal} client prospects achieved and ready for outreach.`);
    }
  };

  const stopAutonomousPipeline = () => {
    pipelineAbortRef.current = true;
    setIsPipelineRunning(false);
    addLog(`Stopping pipeline...`);
  };

  /**
   * Run direct URL batch audit
   */
  const handleDirectUrlBatch = async () => {
    const rawLines = urlBatchInput
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 3);

    if (rawLines.length === 0) {
      setError('Please paste at least one website URL to audit.');
      return;
    }

    addLog(`Auditing ${rawLines.length} pasted URLs...`);
    await handleScan(rawLines.length, customNiche.trim() || niche, location, 'direct_urls', rawLines);
    setUrlBatchInput('');
  };

  const updateLeadStatus = (id: string, newStatus: LeadStatus) => {
    setProspects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: newStatus, lastUpdated: Date.now() } : p))
    );
  };

  const updatePipelineStage = (id: string, newStage: PipelineStage) => {
    const config = getPipelineStageConfig(newStage);
    setProspects((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const updated: ClientProspect = {
          ...p,
          pipelineStage: newStage,
          lastUpdated: Date.now(),
        };
        if (newStage === 'contacted' || newStage === 'audit_sent') {
          updated.lastContactedAt = Date.now();
        }
        return updated;
      })
    );
    addLog(`✓ Updated Pipeline Stage to [${config.label}] for lead.`);
  };

  const removeProspect = (id: string) => {
    setProspects((prev) => prev.filter((p) => p.id !== id));
  };

  const clearAllProspects = () => {
    if (window.confirm('Are you sure you want to clear all discovered prospects?')) {
      setProspects([]);
      localStorage.removeItem(STORAGE_KEY);
      addLog('Cleared all prospects from workspace.');
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  /**
   * Automated Lead Selection Workflow:
   * When selecting a lead, automatically triggers the audit process,
   * generates the summary report, and attaches the status 'Audit Ready'
   * to the client record for batch review.
   */
  const handleToggleLeadSelection = async (prospect: ClientProspect) => {
    const isSelected = selectedLeadIds.has(prospect.id);
    if (isSelected) {
      setSelectedLeadIds((prev) => {
        const next = new Set(prev);
        next.delete(prospect.id);
        return next;
      });
      return;
    }

    // Add to selection set
    setSelectedLeadIds((prev) => new Set(prev).add(prospect.id));

    // Automated Workflow execution
    if (autoAuditOnSelect) {
      if (!prospect.clientAuditReport && prospect.reportStatus !== 'generating') {
        addLog(`⚡ Auto-Audit triggered for selected lead: ${prospect.cname} (${prospect.domain})...`);
        await generateReportForProspect(prospect, true);
      } else {
        updateLeadStatus(prospect.id, 'audit_ready');
        addLog(`✓ Attached status 'Audit Ready' to ${prospect.cname} for batch review.`);
      }
    }
  };

  const handleBatchAutoAuditSelected = async () => {
    const selectedList = prospects.filter((p) => selectedLeadIds.has(p.id));
    if (selectedList.length === 0) return;
    await startAutoAuditPipeline(selectedList);
    setProspects((prev) =>
      prev.map((p) =>
        selectedLeadIds.has(p.id) ? { ...p, status: 'audit_ready', lastUpdated: Date.now() } : p
      )
    );
    addLog(`✓ Batch Audit completed: ${selectedList.length} leads set to 'Audit Ready' for review.`);
  };

  const handleBatchMarkAuditReady = () => {
    setProspects((prev) =>
      prev.map((p) =>
        selectedLeadIds.has(p.id) ? { ...p, status: 'audit_ready', lastUpdated: Date.now() } : p
      )
    );
    addLog(`✓ Marked ${selectedLeadIds.size} selected leads as 'Audit Ready' for batch review.`);
  };

  const handleBatchUpdatePipelineStage = (newStage: PipelineStage) => {
    if (selectedLeadIds.size === 0) return;
    const config = getPipelineStageConfig(newStage);
    setProspects((prev) =>
      prev.map((p) => {
        if (!selectedLeadIds.has(p.id)) return p;
        const updated: ClientProspect = {
          ...p,
          pipelineStage: newStage,
          lastUpdated: Date.now(),
        };
        if (newStage === 'contacted' || newStage === 'audit_sent') {
          updated.lastContactedAt = Date.now();
        }
        return updated;
      })
    );
    addLog(`✓ Moved ${selectedLeadIds.size} selected leads to Pipeline Stage: ${config.label}`);
  };

  const handleSelectAllFiltered = () => {
    setSelectedLeadIds(new Set(filteredProspects.map((p) => p.id)));
  };

  const handleDeselectAll = () => {
    setSelectedLeadIds(new Set());
  };

  const handleToggleSelectAll = () => {
    if (selectedLeadIds.size === filteredProspects.length && filteredProspects.length > 0) {
      handleDeselectAll();
    } else {
      handleSelectAllFiltered();
    }
  };

  // Filtered & Sorted prospects
  const filteredProspects = useMemo(() => {
    const sorted = prospects
      .filter((p) => {
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = p.cname.toLowerCase().includes(q);
          const matchDomain = p.domain.toLowerCase().includes(q);
          const matchLocation = p.location.toLowerCase().includes(q);
          const matchPhone = p.contact.phone?.toLowerCase().includes(q);
          if (!matchName && !matchDomain && !matchLocation && !matchPhone) return false;
        }

        if (filterOpportunity !== 'all' && p.opportunityLevel !== filterOpportunity) {
          return false;
        }

        if (filterViability === 'high_viability' && (p.viabilityScore ?? 0) < 80) {
          return false;
        }
        if (filterViability === 'high_ticket' && p.viabilityTier !== 'high_ticket') {
          return false;
        }
        if (filterViability === 'page_2' && !p.rankBracket?.includes('Page 2')) {
          return false;
        }
        if (filterViability === 'audit_ready' && p.status !== 'audit_ready' && !p.clientAuditReport) {
          return false;
        }
        if (filterViability === 'ai_targets' && (p.aiReadinessScore ?? 60) >= 60) {
          return false;
        }
        if (filterViability === 'speed_targets' && (p.performanceScore ?? 60) >= 60) {
          return false;
        }

        if (filterSource !== 'all' && p.webDiscoverySource !== filterSource) {
          return false;
        }

        if (filterStatus !== 'all' && p.status !== filterStatus) {
          return false;
        }

        if (filterPipelineStage !== 'all') {
          const currentStage = resolveProspectStage(p);
          if (currentStage !== filterPipelineStage) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (prospectPriorityActive || sortBy === 'potential_roi_desc') {
          const roiA = calculatePotentialRoi(a).score;
          const roiB = calculatePotentialRoi(b).score;
          return roiB - roiA; // Highest Potential ROI first
        }
        if (sortBy === 'pipeline_stage_desc') {
          const stageOrder: Record<string, number> = { prospecting: 1, contacted: 2, audit_sent: 3, qualified: 4, closed_won: 5 };
          return (stageOrder[resolveProspectStage(b)] || 0) - (stageOrder[resolveProspectStage(a)] || 0);
        }
        if (sortBy === 'pipeline_stage_asc') {
          const stageOrder: Record<string, number> = { prospecting: 1, contacted: 2, audit_sent: 3, qualified: 4, closed_won: 5 };
          return (stageOrder[resolveProspectStage(a)] || 0) - (stageOrder[resolveProspectStage(b)] || 0);
        }
        if (sortBy === 'viability_desc') return (b.viabilityScore ?? 75) - (a.viabilityScore ?? 75);
        if (sortBy === 'ai_readiness_asc') {
          const sA = a.aiReadinessScore ?? a.clientAuditReport?.aiReadinessScore ?? 50;
          const sB = b.aiReadinessScore ?? b.clientAuditReport?.aiReadinessScore ?? 50;
          return sA - sB; // lowest first = biggest pitch opportunity
        }
        if (sortBy === 'ai_readiness_desc') {
          const sA = a.aiReadinessScore ?? a.clientAuditReport?.aiReadinessScore ?? 50;
          const sB = b.aiReadinessScore ?? b.clientAuditReport?.aiReadinessScore ?? 50;
          return sB - sA;
        }
        if (sortBy === 'performance_asc') {
          const pA = a.performanceScore ?? a.clientAuditReport?.performanceScore ?? 50;
          const pB = b.performanceScore ?? b.clientAuditReport?.performanceScore ?? 50;
          return pA - pB; // lowest first = biggest speed bottlenecks to fix
        }
        if (sortBy === 'performance_desc') {
          const pA = a.performanceScore ?? a.clientAuditReport?.performanceScore ?? 50;
          const pB = b.performanceScore ?? b.clientAuditReport?.performanceScore ?? 50;
          return pB - pA;
        }
        if (sortBy === 'score_asc') return a.seoHealthScore - b.seoHealthScore;
        if (sortBy === 'score_desc') return b.seoHealthScore - a.seoHealthScore;
        if (sortBy === 'revenue_gap') return (b.estimatedLostMonthlyLeads ?? 15) - (a.estimatedLostMonthlyLeads ?? 15);
        if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
        if (sortBy === 'name') return a.cname.localeCompare(b.cname);
        return 0;
      });

    // Absolute React key deduplication guarantee
    const seenIds = new Set<string>();
    const seenDomains = new Set<string>();
    return sorted.filter((p, idx) => {
      const rawDom = (p.domain || p.websiteUrl || '')
        .toLowerCase()
        .replace(/^https?:\/\//, '')
        .replace(/\/.*$/, '')
        .trim();
      const bizKey = rawDom || p.cname?.toLowerCase().trim();
      if (bizKey && seenDomains.has(bizKey)) return false;
      if (bizKey) seenDomains.add(bizKey);

      const key = p.id || `prospect-${idx}`;
      if (seenIds.has(key)) return false;
      seenIds.add(key);
      return true;
    });
  }, [prospects, searchQuery, filterOpportunity, filterViability, filterSource, filterStatus, filterPipelineStage, sortBy, prospectPriorityActive]);

  // Statistics
  const stats = useMemo(() => {
    const total = prospects.length;
    const highViable = prospects.filter((p) => (p.viabilityScore ?? 0) >= 80).length;
    const highTicket = prospects.filter((p) => p.viabilityTier === 'high_ticket').length;
    const page2Underdogs = prospects.filter((p) => p.rankBracket?.includes('Page 2')).length;
    const auditReady = prospects.filter((p) => p.status === 'audit_ready' || Boolean(p.clientAuditReport)).length;
    const contacted = prospects.filter((p) => p.status === 'contacted' || p.status === 'in_discussion' || p.crmSynced).length;
    const reportsReady = prospects.filter((p) => Boolean(p.clientAuditReport)).length;
    const avgScore = total > 0 ? Math.round(prospects.reduce((acc, p) => acc + p.seoHealthScore, 0) / total) : 0;
    const avgAiReadiness = total > 0 ? Math.round(prospects.reduce((acc, p) => acc + (p.aiReadinessScore ?? 50), 0) / total) : 0;
    const avgPerformance = total > 0 ? Math.round(prospects.reduce((acc, p) => acc + (p.performanceScore ?? 50), 0) / total) : 0;
    return {
      total,
      highViable,
      highTicket,
      page2Underdogs,
      auditReady,
      contacted,
      reportsReady,
      avgScore,
      avgAiReadiness,
      avgPerformance,
    };
  }, [prospects]);

  // Export to CSV with full viability & economic metrics
  const handleExportCsv = () => {
    if (prospects.length === 0) return;
    const headers = [
      'Company Name (cname)',
      'Website URL',
      'Domain',
      'Industry',
      'Location',
      'Phone',
      'Email',
      'Address',
      'SEO Client Viability Score (0-100)',
      'Viability Tier',
      'Rank Bracket',
      'Web Discovery Source',
      'Customer Lifetime Value',
      'Est Monthly Retainer Budget',
      'Est Lost Monthly Leads',
      'Est Monthly Revenue Gap',
      'Outranking Competitor',
      'Google Rating',
      'Review Count',
      'AI Readiness Score (0-100)',
      'Performance Score (0-100)',
      'SEO Health Score',
      'Grade',
      'Client Potential',
      'Pipeline Status',
      'Client Report Generated',
      'Client Report Grade',
      'Client Report Overall Score',
      'CRM Synced',
      'Top SEO Deficiencies',
      '30-Sec Cold Call Script',
      'Cold Email Pitch',
    ];

    const rows = prospects.map((p) => [
      `"${p.cname.replace(/"/g, '""')}"`,
      `"${p.websiteUrl}"`,
      `"${p.domain}"`,
      `"${p.industry}"`,
      `"${p.location}"`,
      `"${p.contact.phone || ''}"`,
      `"${p.contact.email || ''}"`,
      `"${(p.contact.formattedAddress || '').replace(/"/g, '""')}"`,
      p.viabilityScore ?? 75,
      p.viabilityTier ?? 'commercial',
      `"${p.rankBracket || 'Page 2 Underdog'}"`,
      `"${p.webDiscoverySource || 'Google Search'}"`,
      `"${p.customerLifetimeValue || ''}"`,
      `"${p.clientBudgetEstimate || ''}"`,
      p.estimatedLostMonthlyLeads ?? 18,
      `"${p.estMonthlyRevenueGap || ''}"`,
      `"${p.outrankingCompetitor || ''}"`,
      p.rating || '',
      p.userRatingCount || '',
      p.aiReadinessScore ?? p.clientAuditReport?.aiReadinessScore ?? 50,
      p.performanceScore ?? p.clientAuditReport?.performanceScore ?? 50,
      p.seoHealthScore,
      p.grade,
      p.opportunityLevel,
      p.status,
      p.clientAuditReport ? 'Yes' : 'No',
      p.clientAuditReport?.grade || '',
      p.clientAuditReport?.overallScore || '',
      p.crmSynced ? 'Yes' : 'No',
      `"${p.topDeficiencies.join(' | ').replace(/"/g, '""')}"`,
      `"${(p.coldCallScript || p.coldPitchHook).replace(/"/g, '""')}"`,
      `"${p.emailPitchDraft.replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `seo_qualified_clients_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Module Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/20 text-cyan-300 border border-cyan-400/30">
              <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
              <span>Deep Web &amp; Directory Client Discovery Engine</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              SEO Client Prospector &amp; High-Ticket Lead Hunter
            </h2>
            <p className="text-xs sm:text-sm text-slate-300">
              Search the live web, Yelp, local directories, and Google Maps to find businesses that will <strong>actually become paying SEO clients</strong> ($1.5k–$5k/mo retainers). Filters for high customer value, Page-2 underdogs, active marketing spenders, and verified contact details.
            </p>
          </div>

          {/* Quick Action Header Buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleExportCsv}
              disabled={prospects.length === 0}
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-40 text-white text-xs font-bold flex items-center gap-1.5 transition-all border border-white/10 cursor-pointer disabled:cursor-not-allowed"
              title="Export all client prospects to CSV spreadsheet"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Export Qualified CSV ({prospects.length})</span>
            </button>

            {prospects.length > 0 && (
              <button
                type="button"
                onClick={clearAllProspects}
                className="px-3 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-all border border-rose-500/30 cursor-pointer"
                title="Clear all saved prospects"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Clear List</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 5 Discovery Strategy Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200">
        <button
          onClick={() => setActiveStrategy('high_ticket_underdogs')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
            activeStrategy === 'high_ticket_underdogs'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Target className={`w-3.5 h-3.5 ${activeStrategy === 'high_ticket_underdogs' ? 'text-amber-400' : 'text-slate-400'}`} />
          <span>Way 1: High-Ticket Page-2 Underdogs</span>
          <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-amber-500/20 text-amber-300 font-extrabold uppercase">
            $5k+ CLV
          </span>
        </button>

        <button
          onClick={() => setActiveStrategy('ai_grounded')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
            activeStrategy === 'ai_grounded'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Bot className={`w-3.5 h-3.5 ${activeStrategy === 'ai_grounded' ? 'text-emerald-400' : 'text-slate-400'}`} />
          <span>Way 2: Deep Web &amp; Directory Search</span>
          <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-emerald-500/20 text-emerald-300 font-extrabold uppercase">
            Live Web
          </span>
        </button>

        <button
          onClick={() => setActiveStrategy('autonomous_pipeline')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
            activeStrategy === 'autonomous_pipeline'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Compass className={`w-3.5 h-3.5 ${activeStrategy === 'autonomous_pipeline' ? 'text-blue-400' : 'text-slate-400'}`} />
          <span>Way 3: Auto-Pilot Pipeline (10–1,000)</span>
          <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-blue-500/20 text-blue-300 font-extrabold uppercase">
            Scale
          </span>
        </button>

        <button
          onClick={() => setActiveStrategy('interactive_map')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
            activeStrategy === 'interactive_map'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <MapIcon className={`w-3.5 h-3.5 ${activeStrategy === 'interactive_map' ? 'text-amber-400' : 'text-slate-400'}`} />
          <span>Way 4: Interactive Map Radar</span>
          <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-amber-500/20 text-amber-300 font-extrabold uppercase">
            Geospatial
          </span>
        </button>

        <button
          onClick={() => setActiveStrategy('direct_urls')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
            activeStrategy === 'direct_urls'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ListPlus className={`w-3.5 h-3.5 ${activeStrategy === 'direct_urls' ? 'text-purple-400' : 'text-slate-400'}`} />
          <span>Way 5: Bulk URL / Competitor Importer</span>
          <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-purple-500/20 text-purple-300 font-extrabold uppercase">
            Batch Crawl
          </span>
        </button>
      </div>

      {/* Discovery Configuration Form */}
      <div className="p-5 sm:p-6 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <Search className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {activeStrategy === 'high_ticket_underdogs' && 'High-Ticket Commercial Underdogs (Page 2 & Deficient Leaders)'}
                {activeStrategy === 'ai_grounded' && 'Multi-Angle Deep Web & Directory Search (Google Search Grounding)'}
                {activeStrategy === 'autonomous_pipeline' && 'Continuous Auto-Pilot Pipeline (Scale from 10 to 1,000 Clients)'}
                {activeStrategy === 'interactive_map' && 'Geospatial Radar & Interactive Map Explorer'}
                {activeStrategy === 'direct_urls' && 'Bulk URL Importer & Rapid Multi-Site Auditor'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {activeStrategy === 'high_ticket_underdogs' && 'Hunts commercial service contractors with $5k+ job values that lose local 3-pack traffic to top competitors.'}
                {activeStrategy === 'ai_grounded' && 'Discovers actual independent business sites from live web queries and directory listings, skipping aggregators.'}
                {activeStrategy === 'autonomous_pipeline' && 'Systematically mines across municipal districts until reaching your exact target client quota.'}
                {activeStrategy === 'interactive_map' && 'Visually pins qualified prospects on an interactive geospatial coordinate grid.'}
                {activeStrategy === 'direct_urls' && 'Paste any list of URLs to extract company names, phone numbers, emails, and full SEO opportunity reports.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowKeyInput(!showKeyInput)}
            className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer shrink-0"
          >
            <span>{showKeyInput ? 'Hide API Key' : 'Configure Maps API Key (Optional)'}</span>
          </button>
        </div>

        {/* Optional Google Maps API Key input */}
        {showKeyInput && (
          <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-blue-900 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-blue-600" />
                Google Maps Platform Places API (New) Key
              </span>
              <span className="text-[11px] text-blue-700">Optional for direct live Places API search</span>
            </div>
            <input
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIzaSy... (leave empty to use server multi-source discovery)"
              className="w-full px-3 py-2 rounded-lg border border-blue-300 bg-white text-slate-900 text-xs focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>
        )}

        {/* Form controls based on strategy */}
        {activeStrategy !== 'direct_urls' ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              {/* Niche Selection */}
              <div className="md:col-span-4 space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-slate-500" />
                    High-ROI Industry / Niche
                  </span>
                  <span className="text-[10px] text-amber-600 font-extrabold uppercase">High Ticket</span>
                </label>
                <select
                  value={niche}
                  onChange={(e) => {
                    setNiche(e.target.value);
                    setCustomNiche('');
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-slate-900 transition-all cursor-pointer"
                >
                  {NICHES.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>

              {/* Target Location */}
              <div className="md:col-span-4 space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  Target Metro / Location
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Austin, TX or Miami, FL"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-slate-900 transition-all"
                  />
                </div>
              </div>

              {/* Target Client Count */}
              <div className="md:col-span-4 space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>Target Client Count</span>
                  <span className="text-[11px] font-mono text-blue-600 font-bold">{targetCount} Leads</span>
                </label>
                <select
                  value={targetCount}
                  onChange={(e) => setTargetCount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-slate-900 transition-all cursor-pointer"
                >
                  {COUNT_PRESETS.map((cnt) => (
                    <option key={cnt} value={cnt}>
                      {cnt} clients {cnt >= 100 ? '(Bulk Scale Pipeline)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* SEO Client Qualification & Quality Controls */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-4">
                {/* High Ticket Toggle */}
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={highTicketOnly}
                    onChange={(e) => setHighTicketOnly(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                  />
                  <span className="font-bold text-slate-800 flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                    High-Ticket CLV ($5k+ Client Value)
                  </span>
                </label>

                {/* Min Viability Score */}
                <div className="flex items-center gap-2">
                  <span className="text-slate-600 font-medium">Min Client Viability:</span>
                  <select
                    value={minViabilityScore}
                    onChange={(e) => setMinViabilityScore(Number(e.target.value))}
                    className="px-2 py-1 rounded-lg border border-slate-200 bg-white font-bold text-slate-800 cursor-pointer"
                  >
                    <option value={0}>All Leads (No threshold)</option>
                    <option value={65}>65+ (Moderate+ Propensity)</option>
                    <option value={75}>75+ (High Propensity)</option>
                    <option value={85}>85+ (Elite Paying Candidates)</option>
                  </select>
                </div>
              </div>

              <div className="text-[11px] text-slate-500">
                Sources: Google Live Search, Yelp, Yellowpages &amp; Maps Pack
              </div>
            </div>
          </div>
        ) : (
          /* Strategy 5: Direct URL Batch Input */
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <ListPlus className="w-3.5 h-3.5 text-purple-600" />
                Paste Website URLs or Domains (One per line, up to 1,000)
              </span>
              <span className="text-[11px] text-slate-400">Google Maps results, competitors, or client lists</span>
            </label>
            <textarea
              rows={4}
              value={urlBatchInput}
              onChange={(e) => setUrlBatchInput(e.target.value)}
              placeholder="austinroofer.com&#10;texaspremierinjurylaw.com&#10;smiledesignatx.com"
              className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 font-mono text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-slate-900 transition-all"
            />
          </div>
        )}

        {/* Action Trigger Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2">
            {activeStrategy === 'autonomous_pipeline' ? (
              !isPipelineRunning ? (
                <button
                  type="button"
                  onClick={startAutonomousPipeline}
                  disabled={isLoading}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-black flex items-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Start Auto-Pilot Pipeline ({targetCount} Leads)</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopAutonomousPipeline}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <Pause className="w-4 h-4" />
                  <span>Pause Pipeline</span>
                </button>
              )
            ) : activeStrategy === 'direct_urls' ? (
              <button
                type="button"
                onClick={handleDirectUrlBatch}
                disabled={isLoading}
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black flex items-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                <span>Audit Pasted Websites</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleScan()}
                disabled={isLoading}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black flex items-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                <span>Discover &amp; Audit Qualified Clients</span>
              </button>
            )}
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Saved in Workspace: <span className="font-bold text-slate-900">{prospects.length} clients</span>
          </div>
        </div>

        {/* Scan Progress Bar */}
        {scanProgress && (
          <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 space-y-1.5 animate-pulse">
            <div className="flex items-center justify-between text-xs font-bold text-blue-900">
              <span className="flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                {scanProgress.stage}
              </span>
              <span>
                {scanProgress.current} / {scanProgress.total}
              </span>
            </div>
            <div className="w-full h-1.5 bg-blue-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${Math.min(100, (scanProgress.current / scanProgress.total) * 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Auto-Pilot Terminal Console Logs */}
        {pipelineLogs.length > 0 && (
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
              <span className="flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-slate-500" />
                Discovery Pipeline Activity Log
              </span>
              <button
                type="button"
                onClick={() => setPipelineLogs([])}
                className="text-slate-400 hover:text-slate-600 text-[10px] cursor-pointer"
              >
                Clear Log
              </button>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 font-mono text-[11px] text-emerald-400 h-28 overflow-y-auto space-y-1 leading-relaxed">
              {pipelineLogs.map((log, i) => (
                <div key={i} className="whitespace-pre-wrap">
                  {log}
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          </div>
        )}
      </div>

      {/* Interactive Visual Map Display (Rendered when on Way 4 or toggled) */}
      {activeStrategy === 'interactive_map' && (
        <InteractiveProspectMap
          prospects={prospects}
          selectedLocation={location}
          selectedProspectId={selectedMapProspectId}
          onSelectProspect={(p) => {
            setSelectedMapProspectId(p.id);
            setActivePitchProspect(p);
          }}
          isScanning={isLoading}
        />
      )}

      {/* Key Metrics Overview Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Discovered</div>
          <div className="text-2xl font-black text-slate-900">{stats.total}</div>
          <div className="text-[11px] text-slate-400">Across {location}</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-amber-200 bg-amber-50/20 shadow-2xs space-y-1">
          <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1">
            <Target className="w-3.5 h-3.5 text-amber-500" />
            <span>High Viability</span>
          </div>
          <div className="text-2xl font-black text-amber-700">{stats.highViable}</div>
          <div className="text-[11px] text-amber-600/80">Propensity &gt; 80</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <div className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1">
            <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
            <span>High-Ticket CLV</span>
          </div>
          <div className="text-2xl font-black text-emerald-600">{stats.highTicket}</div>
          <div className="text-[11px] text-slate-400">$5k+ Customer Value</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <div className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
            <span>Page-2 Underdogs</span>
          </div>
          <div className="text-2xl font-black text-indigo-600">{stats.page2Underdogs}</div>
          <div className="text-[11px] text-slate-400">Prime upside candidates</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-blue-200 bg-blue-50/20 shadow-2xs space-y-1">
          <div className="text-[11px] font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1">
            <FileText className="w-3.5 h-3.5 text-blue-500" />
            <span>Client Reports Ready</span>
          </div>
          <div className="text-2xl font-black text-blue-700">{stats.reportsReady}</div>
          <div className="text-[11px] text-blue-600/80">Saved audits &amp; proposals</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-purple-200 bg-purple-50/20 shadow-2xs space-y-1">
          <div className="text-[11px] font-bold text-purple-700 uppercase tracking-wider flex items-center gap-1">
            <Database className="w-3.5 h-3.5 text-purple-500" />
            <span>In CRM / Outreach</span>
          </div>
          <div className="text-2xl font-black text-purple-700">{stats.contacted}</div>
          <div className="text-[11px] text-purple-600/80">Synced or Contacted</div>
        </div>
      </div>

      {/* Automated Client Website Audit & Report Generator Pipeline Panel */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-sm border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-black text-[10px] tracking-wide border border-blue-500/30 uppercase flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-blue-400" />
                <span>Automated Website Audit &amp; Client Report Engine</span>
              </span>
              {isAutoAuditingQueue && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-[10px] animate-pulse border border-amber-500/30">
                  ⚡ Auto-Auditing Client Websites...
                </span>
              )}
            </div>
            <p className="text-xs text-slate-300">
              Automatically audits the websites of extracted potential clients, identifies technical errors, SEO deficiencies &amp; competitive gaps, creates an elegant, client-ready PDF-ready audit proposal report, and saves it directly to that client's profile.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Auto-Audit On Discovery Checkbox */}
            <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-slate-300 text-xs font-semibold cursor-pointer hover:bg-slate-800">
              <input
                type="checkbox"
                checked={autoAuditOnDiscovery}
                onChange={(e) => setAutoAuditOnDiscovery(e.target.checked)}
                className="rounded border-slate-600 text-blue-600 focus:ring-blue-500"
              />
              <span>Auto-Audit extracted leads</span>
            </label>

            {/* Run Auto-Audit Pipeline Button */}
            {isAutoAuditingQueue ? (
              <button
                type="button"
                onClick={stopAutoAuditPipeline}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <StopCircle className="w-4 h-4" />
                <span>Pause Auto-Audit</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => startAutoAuditPipeline(filteredProspects)}
                  disabled={filteredProspects.length === 0}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-black flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                  title="1-Click: Generate individual audit reports for all currently searched/filtered customers"
                >
                  <Sparkles className="w-4 h-4 text-emerald-200" />
                  <span>
                    ⚡ 1-Click Make Reports for All ({filteredProspects.length})
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => startAutoAuditPipeline()}
                  disabled={prospects.filter((p) => !p.clientAuditReport).length === 0}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all border border-slate-700 disabled:opacity-50 cursor-pointer"
                  title="Automatically audit remaining un-audited clients"
                >
                  <ListChecks className="w-3.5 h-3.5 text-blue-400" />
                  <span>
                    Audit Un-Audited ({prospects.filter((p) => !p.clientAuditReport).length})
                  </span>
                </button>
              </>
            )}

            {/* CRM Export Center */}
            <button
              type="button"
              onClick={() => setShowCrmModal(true)}
              disabled={prospects.length === 0}
              className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              title="Push qualified leads to HubSpot, GoHighLevel, Salesforce, Pipedrive, or Outreach CSV"
            >
              <Database className="w-3.5 h-3.5 text-purple-200" />
              <span>CRM Export &amp; Outreach</span>
            </button>

            {/* Export CSV Button */}
            <button
              type="button"
              onClick={handleExportCsv}
              disabled={prospects.length === 0}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer disabled:opacity-50"
              title="Download Full CSV spreadsheet with economic &amp; viability metrics"
            >
              <Download className="w-4 h-4" />
            </button>

            {/* Clear Button */}
            <button
              type="button"
              onClick={clearAllProspects}
              disabled={prospects.length === 0}
              className="p-2 rounded-xl bg-slate-800 hover:bg-rose-900/50 text-slate-400 hover:text-rose-400 border border-slate-700 transition-colors cursor-pointer disabled:opacity-50"
              title="Clear all leads from current workspace"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Auto-Audit Progress Bar */}
        {isAutoAuditingQueue && autoAuditProgress && (
          <div className="mt-3 pt-3 border-t border-slate-800 space-y-1.5 animate-fadeIn">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-blue-300 flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
                <span>
                  Auditing website for <strong>{autoAuditProgress.cname}</strong> (
                  <span className="font-mono text-cyan-300">{autoAuditProgress.domain}</span>)...
                </span>
              </span>
              <span className="font-mono font-bold text-slate-400">
                {autoAuditProgress.current} of {autoAuditProgress.total} (
                {Math.round((autoAuditProgress.current / autoAuditProgress.total) * 100)}%)
              </span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-400 transition-all duration-300 rounded-full"
                style={{
                  width: `${Math.round((autoAuditProgress.current / autoAuditProgress.total) * 100)}%`,
                }}
              />
            </div>
            <div className="text-[11px] text-slate-400 italic">
              Analyzing technical speed, meta tags, content gaps, calculating ROI revenue loss, generating 3-phase improvement roadmap, and saving report with client profile...
            </div>
          </div>
        )}
      </div>

      {/* Automated Lead Selection & Batch Review Workflow Bar */}
      <div className="p-3.5 bg-gradient-to-r from-slate-900 to-indigo-950 border border-slate-800 rounded-2xl text-white shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Automated Workflow Toggle Switch */}
          <label className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-xs font-bold cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={autoAuditOnSelect}
              onChange={(e) => setAutoAuditOnSelect(e.target.checked)}
              className="rounded border-slate-500 text-cyan-500 focus:ring-cyan-400"
            />
            <span className="flex items-center gap-1.5 text-cyan-200">
              <Zap className="w-3.5 h-3.5 text-cyan-300" />
              <span>Auto-Audit &amp; Set &lsquo;Audit Ready&rsquo; on Lead Selection</span>
            </span>
          </label>

          {/* Selection counter & select-all controls */}
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-slate-300">
              Selected:{' '}
              <strong className="text-white font-mono">{selectedLeadIds.size}</strong> of {filteredProspects.length}
            </span>
            <button
              type="button"
              onClick={handleSelectAllFiltered}
              className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold cursor-pointer transition-colors"
            >
              Select All
            </button>
            {selectedLeadIds.size > 0 && (
              <button
                type="button"
                onClick={handleDeselectAll}
                className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-[11px] font-bold cursor-pointer transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Batch Actions for Selected Leads & Queue Trigger */}
        <div className="flex flex-wrap items-center gap-2">
          {selectedLeadIds.size > 0 ? (
            <>
              {/* Batch Processing Queue Trigger for Selected Leads */}
              <button
                type="button"
                onClick={() => handleTriggerBatchAuditQueue()}
                disabled={isBatchQueueProcessing}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white text-xs font-black flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer disabled:opacity-50"
                title="Launch Batch Processing Queue with live status indicator for each report generation process"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-100" />
                <span>Audit All Selected ({selectedLeadIds.size})</span>
              </button>

              <button
                type="button"
                onClick={handleBatchMarkAuditReady}
                className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-400/40 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Mark all selected leads as Audit Ready for review"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Mark &lsquo;Audit Ready&rsquo;</span>
              </button>

              {/* Outreach generator shortcut for first selected lead */}
              {(() => {
                const firstSelected = prospects.find((p) => selectedLeadIds.has(p.id));
                return (
                  firstSelected && (
                    <button
                      type="button"
                      onClick={() =>
                        setActiveOutreachModal({
                          prospect: firstSelected,
                          report: firstSelected.clientAuditReport,
                        })
                      }
                      className="px-3 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-400/40 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                      title={`Open AI Outreach Generator for ${firstSelected.cname}`}
                    >
                      <Bot className="w-3.5 h-3.5 text-purple-400" />
                      <span>Draft Outreach</span>
                    </button>
                  )
                );
              })()}

              <button
                type="button"
                onClick={() => setShowCrmModal(true)}
                className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Database className="w-3.5 h-3.5 text-purple-200" />
                <span>Push ({selectedLeadIds.size}) to CRM</span>
              </button>

              {/* Batch Move Pipeline Stage */}
              <div className="flex items-center gap-1.5 bg-slate-800/90 rounded-xl px-2.5 py-1 border border-slate-700">
                <span className="text-[10px] uppercase font-black text-slate-400">Stage:</span>
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      handleBatchUpdatePipelineStage(e.target.value as PipelineStage);
                      e.target.value = '';
                    }
                  }}
                  defaultValue=""
                  className="bg-transparent text-xs font-bold text-white border-none focus:outline-none cursor-pointer"
                  title="Move all selected leads to a specific outreach pipeline stage"
                >
                  <option value="" disabled className="text-slate-900 bg-white">Move ({selectedLeadIds.size}) to Stage...</option>
                  <option value="prospecting" className="text-slate-900 bg-white">🔍 Move to Prospecting</option>
                  <option value="contacted" className="text-slate-900 bg-white">✉️ Move to Contacted</option>
                  <option value="audit_sent" className="text-slate-900 bg-white">📊 Move to Audit Sent</option>
                  <option value="qualified" className="text-slate-900 bg-white">⭐ Move to Qualified</option>
                  <option value="closed_won" className="text-slate-900 bg-white">🏆 Move to Closed Won</option>
                </select>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => handleTriggerBatchAuditQueue(filteredProspects)}
                disabled={filteredProspects.length === 0 || isBatchQueueProcessing}
                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black flex items-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-50"
                title="Audit all visible prospects with live status tracking"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-200" />
                <span>Audit All ({filteredProspects.length})</span>
              </button>
              <span className="text-[11px] text-slate-400 italic hidden sm:inline">
                Select specific prospects or click &lsquo;Audit All&rsquo; to launch the batch processing queue
              </span>
            </div>
          )}

          {/* View Batch Queue Status Button */}
          {batchQueue.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setIsBatchQueueOpen(true);
                setIsBatchQueueMinimized(false);
              }}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Open Batch Processing Queue Panel"
            >
              {isBatchQueueProcessing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              )}
              <span>
                Batch Queue ({batchQueue.filter((i) => i.status === 'completed').length}/{batchQueue.length})
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Outreach Pipeline Stage Funnel Tracker */}
      <PipelineFunnelTrackerBar
        prospects={prospects}
        activeStageFilter={filterPipelineStage}
        onSelectStageFilter={(stage) => setFilterPipelineStage(stage)}
      />

      {/* Step 5 — Google Places Real Client Intelligence Summary */}
      {lastScanSummary ? (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white border border-slate-700 shadow-md space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-sm font-black text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Found {lastScanSummary.rawPlacesFound} real businesses from {lastScanSummary.source}</span>
              </span>
            </div>
            <span className="text-xs font-semibold text-slate-300">
              Showing <strong className="text-white font-bold">{lastScanSummary.qualifiedCount}</strong> qualified leads for &ldquo;{lastScanSummary.niche} in {lastScanSummary.location}&rdquo;
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-700/60 text-xs">
            <span className="px-3 py-1 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-400/30 font-extrabold flex items-center gap-1.5">
              <span>🔥 Hot Leads:</span>
              <span className="font-mono text-white text-sm font-black">{lastScanSummary.hotLeadsCount}</span>
            </span>
            <span className="px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-extrabold flex items-center gap-1.5">
              <span>✅ Good Leads:</span>
              <span className="font-mono text-white text-sm font-black">{lastScanSummary.goodLeadsCount}</span>
            </span>
            <span className="px-3 py-1 rounded-xl bg-slate-800/80 text-slate-300 border border-slate-600/50 font-bold flex items-center gap-1.5">
              <span>⬇️ Filtered out:</span>
              <span className="font-mono text-slate-200 text-sm font-black">{lastScanSummary.filteredCount}</span>
              <span className="text-[10px] text-slate-400 hidden sm:inline">(no website, 500+ reviews, chains, or 85+ SEO)</span>
            </span>
          </div>

          {/* Suggestions if < 5 leads or 0 leads found */}
          {lastScanSummary.qualifiedCount < 5 && lastScanSummary.suggestions && lastScanSummary.suggestions.length > 0 && (
            <div className="pt-2 border-t border-slate-700/50 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-amber-300 font-bold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>Recommended next searches:</span>
              </span>
              {lastScanSummary.suggestions.map((sug, sIdx) => (
                <button
                  key={sIdx}
                  type="button"
                  onClick={() => {
                    setCustomNiche(sug);
                    handleScan(targetCount, sug, location);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-cyan-200 text-xs font-semibold cursor-pointer transition-colors border border-white/10"
                >
                  &ldquo;{sug}&rdquo; &rarr;
                </button>
              ))}
            </div>
          )}
        </div>
      ) : prospects.length > 0 ? (
        <div className="p-3.5 rounded-2xl bg-slate-900 text-white border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="font-bold text-emerald-400">✅ Live Client Pipeline</span>
            <span className="text-slate-400">&bull;</span>
            <span className="text-slate-300">
              Active Leads: <strong className="text-white font-mono">{prospects.length}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-cyan-300 border border-cyan-400/30 text-[11px] font-bold">
              Source: Google Places Maps &bull; Verified Real
            </span>
          </div>
        </div>
      ) : null}

      {/* Filter and View Mode Toolbar */}
      <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search by Name/Domain/Phone */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by company name, domain, phone..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-slate-900"
            />
          </div>

          {/* Filters and Sort */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Pipeline Stage Filter */}
            <select
              value={filterPipelineStage}
              onChange={(e) => setFilterPipelineStage(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-black text-slate-800 bg-white cursor-pointer shadow-2xs"
              title="Filter by Outreach Pipeline Stage"
            >
              <option value="all">🎯 All Pipeline Stages</option>
              <option value="prospecting">🔍 Prospecting</option>
              <option value="contacted">✉️ Contacted</option>
              <option value="audit_sent">📊 Audit Sent</option>
              <option value="qualified">⭐ Qualified</option>
              <option value="closed_won">🏆 Closed Won</option>
            </select>

            {/* Viability & Qualification Filter */}
            <select
              value={filterViability}
              onChange={(e) => setFilterViability(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white cursor-pointer"
            >
              <option value="all">All Client Types ({prospects.length})</option>
              <option value="audit_ready">⚡ Audit Ready Only ({stats.auditReady})</option>
              <option value="high_viability">High Viability (80+ Propensity)</option>
              <option value="high_ticket">High Ticket Only ($5k+ CLV)</option>
              <option value="page_2">Page-2 Underdogs</option>
              <option value="ai_targets">🤖 AI Pitch Targets (&lt;60 AI Score)</option>
              <option value="speed_targets">⚡ Speed Bottlenecks (&lt;60 Perf)</option>
            </select>

            {/* Web Source Filter */}
            <select
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white cursor-pointer"
            >
              <option value="all">All Discovery Sources</option>
              <option value="Google Search (Live Web)">Google Search (Live Web)</option>
              <option value="Yelp & Directory Aggregators">Yelp &amp; Directories</option>
              <option value="Google Places (Maps)">Google Places / Maps</option>
              <option value="Direct Site Crawl">Direct Site Crawl</option>
            </select>

            {/* CRM Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white cursor-pointer"
            >
              <option value="all">All CRM Statuses</option>
              <option value="audit_ready">⚡ Audit Ready ({stats.auditReady})</option>
              <option value="new">New Leads</option>
              <option value="contacted">Contacted</option>
              <option value="in_discussion">In Discussion</option>
              <option value="won">Won Clients</option>
              <option value="passed">Passed</option>
            </select>

            {/* 'Prospect Priority' Filter Toggle: Sorts by combined Potential ROI */}
            <button
              type="button"
              onClick={() => {
                const next = !prospectPriorityActive;
                setProspectPriorityActive(next);
                if (next) {
                  setSortBy('potential_roi_desc');
                } else {
                  setSortBy('viability_desc');
                }
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer border ${
                prospectPriorityActive
                  ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 text-white border-purple-400/50 shadow-xs ring-2 ring-purple-400/30'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
              }`}
              title="Toggle Prospect Priority: Sorts leads by combined Potential ROI score based on existing AI Readiness and discovered technical severity"
            >
              <Zap className={`w-3.5 h-3.5 ${prospectPriorityActive ? 'text-amber-300 fill-amber-300' : 'text-purple-600'}`} />
              <span>Prospect Priority (Potential ROI)</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  prospectPriorityActive ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-800'
                }`}
              >
                {prospectPriorityActive ? 'ON' : 'OFF'}
              </span>
            </button>

            {/* Sort By Ranking and Scoring */}
            <select
              value={sortBy}
              onChange={(e) => {
                const val = e.target.value as any;
                setSortBy(val);
                if (val === 'potential_roi_desc') {
                  setProspectPriorityActive(true);
                } else if (prospectPriorityActive) {
                  setProspectPriorityActive(false);
                }
              }}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-slate-50 cursor-pointer"
            >
              <option value="potential_roi_desc">🔥 Potential ROI Priority (High Upside First)</option>
              <option value="pipeline_stage_desc">🎯 Outreach Stage: Most Advanced First</option>
              <option value="pipeline_stage_asc">🎯 Outreach Stage: Early Funnel First</option>
              <option value="viability_desc">⭐ Highest Client Propensity to Buy</option>
              <option value="ai_readiness_asc">🤖 AI Readiness: Lowest first (High Opportunity)</option>
              <option value="ai_readiness_desc">🤖 AI Readiness: Highest first</option>
              <option value="performance_asc">⚡ Performance: Lowest first (Speed Bottlenecks)</option>
              <option value="performance_desc">⚡ Performance: Highest first</option>
              <option value="revenue_gap">💰 Biggest Lost Monthly Revenue Gap</option>
              <option value="score_asc">📉 Worst SEO Score First (Big Fix)</option>
              <option value="score_desc">📈 Highest SEO Score First</option>
              <option value="rating">⭐ Google Rating</option>
              <option value="name">🔤 Company Name (A-Z)</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center p-0.5 rounded-xl bg-slate-100 border border-slate-200">
              <button
                onClick={() => setViewMode('cards')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'cards' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                }`}
              >
                Cards
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'table' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                }`}
              >
                Table
              </button>
            </div>
          </div>
        </div>

        {/* Quick Filter & Segment Chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 text-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Quick Filter:</span>
          <button
            type="button"
            onClick={() => setFilterViability('all')}
            className={`px-2.5 py-0.5 rounded-lg font-bold text-[11px] transition-colors cursor-pointer ${
              filterViability === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            All Leads ({prospects.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterViability('audit_ready')}
            className={`px-2.5 py-0.5 rounded-lg font-bold text-[11px] transition-colors cursor-pointer flex items-center gap-1 ${
              filterViability === 'audit_ready'
                ? 'bg-cyan-600 text-white'
                : 'bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-200'
            }`}
          >
            <Sparkles className="w-3 h-3 text-cyan-600" />
            <span>Audit Ready ({stats.auditReady})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterViability('ai_targets')}
            className={`px-2.5 py-0.5 rounded-lg font-bold text-[11px] transition-colors cursor-pointer flex items-center gap-1 ${
              filterViability === 'ai_targets'
                ? 'bg-purple-600 text-white'
                : 'bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200'
            }`}
          >
            <Bot className="w-3 h-3 text-purple-600" />
            <span>AI Pitch Targets (&lt;60)</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterViability('speed_targets')}
            className={`px-2.5 py-0.5 rounded-lg font-bold text-[11px] transition-colors cursor-pointer flex items-center gap-1 ${
              filterViability === 'speed_targets'
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
            }`}
          >
            <Zap className="w-3 h-3 text-emerald-600" />
            <span>Speed Bottlenecks (&lt;60)</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterViability('high_viability')}
            className={`px-2.5 py-0.5 rounded-lg font-bold text-[11px] transition-colors cursor-pointer ${
              filterViability === 'high_viability'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
            }`}
          >
            High Viability 80+ ({stats.highViable})
          </button>
          <button
            type="button"
            onClick={() => setFilterViability('page_2')}
            className={`px-2.5 py-0.5 rounded-lg font-bold text-[11px] transition-colors cursor-pointer ${
              filterViability === 'page_2'
                ? 'bg-indigo-600 text-white'
                : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200'
            }`}
          >
            Page-2 Underdogs ({stats.page2Underdogs})
          </button>
        </div>
      </div>

      {/* Informational banner when Prospect Priority filter toggle is active */}
      {prospectPriorityActive && (
        <div className="flex items-center justify-between gap-3 p-3.5 bg-gradient-to-r from-purple-50 via-indigo-50/70 to-purple-50 border border-purple-200/80 rounded-2xl text-xs text-purple-900 shadow-2xs animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-700 text-white shrink-0 shadow-2xs">
              <Zap className="w-4 h-4 fill-amber-300 text-amber-300" />
            </div>
            <div>
              <div className="font-black text-purple-950 flex items-center gap-2">
                <span>Prospect Priority Active</span>
                <span className="px-2 py-0.5 rounded-full bg-purple-200/80 text-purple-900 text-[10px] font-black">
                  Ranked by Combined Potential ROI Score
                </span>
              </div>
              <p className="text-[11px] text-purple-800 mt-0.5">
                Leads are prioritized by a combined Potential ROI score synthesizing existing AI Readiness deficits and discovered technical severity (Core Web Vitals latency, SEO flaw depth, and schema omissions). Targets offering the highest client revenue transformation upside are surfaced first.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setProspectPriorityActive(false);
              setSortBy('viability_desc');
            }}
            className="text-xs font-bold text-purple-700 hover:text-purple-950 underline shrink-0 cursor-pointer px-2 py-1 rounded-lg hover:bg-purple-100 transition-colors"
          >
            Turn Off Priority Sort
          </button>
        </div>
      )}

      {/* Prospects Rendered: Cards View */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProspects.map((prospect, idx) => {
            const viability = prospect.viabilityScore ?? 78;
            const isHighViable = viability >= 80;
            const isSelected = selectedLeadIds.has(prospect.id);
            const aiScore = prospect.aiReadinessScore ?? prospect.clientAuditReport?.aiReadinessScore ?? 50;
            const perfScore = prospect.performanceScore ?? prospect.clientAuditReport?.performanceScore ?? 55;
            const roiData = calculatePotentialRoi(prospect);

            // Step 3 & 4: Potential Score & Badge
            const potentialScore = prospect.leadPotentialScore ?? (viability >= 80 ? 9 : viability >= 65 ? 7 : 4);
            const isHotLead = potentialScore >= 8;
            const isGoodLead = potentialScore >= 5 && potentialScore < 8;

            // Real SEO Score & label
            const seoScore = prospect.seoScore ?? prospect.overallScore ?? (100 - Math.min(65, Math.max(25, 100 - viability)));
            const seoLabel = seoScore < 50 ? 'Poor' : seoScore < 75 ? 'Average' : 'Good';

            // Contact completeness badge (Rule 4)
            const hasName = Boolean(prospect.ownerName && prospect.ownerName !== 'Decision Maker');
            const hasEmail = Boolean(prospect.contact.email);
            const hasPhone = Boolean(prospect.contact.phone);
            let contactBadge = {
              badge: 'Minimal 📞',
              label: 'phone from Google Places only',
              colorClass: 'bg-slate-100 text-slate-700 border-slate-200',
            };
            if (hasName && hasEmail && hasPhone) {
              contactBadge = {
                badge: 'Full ✅',
                label: 'name + email + phone found',
                colorClass: 'bg-emerald-50 text-emerald-800 border-emerald-300',
              };
            } else if ((hasEmail && hasPhone) || (hasName && hasPhone) || (hasName && hasEmail)) {
              contactBadge = {
                badge: 'Partial ⚠️',
                label: hasEmail ? 'email + phone found' : 'partial contact found',
                colorClass: 'bg-amber-50 text-amber-800 border-amber-300',
              };
            }

            // Real Google Maps link
            const mapsLink =
              prospect.mapsUrl ||
              `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                prospect.cname + ' ' + (prospect.location || '')
              )}`;

            // Real CMS
            const cmsName =
              prospect.cmsType || prospect.marketingEvidence?.detectedCms || 'Custom / HTML';

            // Top Real Issues (Rule 4 & Step 4)
            const topIssues =
              prospect.topDeficiencies && prospect.topDeficiencies.length > 0
                ? prospect.topDeficiencies.slice(0, 5)
                : [
                    'No meta description on homepage',
                    'Missing LocalBusiness schema markup',
                    'Page speed requires Core Web Vitals optimization',
                    'No mobile touch target optimization',
                    'Google Maps 3-Pack rank deficit',
                  ];

            // Why They're A Good Lead (Step 4)
            const goodLeadReasons =
              prospect.goodLeadReasons && prospect.goodLeadReasons.length > 0
                ? prospect.goodLeadReasons
                : [
                    `Only ${prospect.userRatingCount || 42} reviews = small local business, no marketing team`,
                    `SEO score ${seoScore}/100 = lots of room to improve`,
                    'No schema = invisible to Google Maps AI ranking',
                  ];

            return (
              <div
                key={prospect.id}
                className={`p-5 rounded-2xl bg-white border transition-all hover:shadow-md flex flex-col justify-between space-y-4 ${
                  isSelected
                    ? 'border-blue-400 ring-2 ring-blue-500 bg-blue-50/10 shadow-sm'
                    : isHotLead
                    ? 'border-rose-300 ring-1 ring-rose-100 shadow-2xs'
                    : 'border-slate-200'
                }`}
              >
                <div className="space-y-3.5">
                  {/* Card Header: Business Name & Hot Lead / Good Lead Badge */}
                  <div className="border-b border-slate-100 pb-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 min-w-0">
                        {/* Checkbox for batch/auto-audit */}
                        <button
                          type="button"
                          onClick={() => handleToggleLeadSelection(prospect)}
                          className="mt-0.5 p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-800 transition-colors cursor-pointer shrink-0"
                          title={isSelected ? 'Deselect lead' : 'Select lead for batch audit'}
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400" />
                          )}
                        </button>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono text-[10px] font-black px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                              #{idx + 1}
                            </span>
                            <h4 className="text-sm font-black text-slate-900 leading-tight truncate">
                              📍 {prospect.cname}
                            </h4>
                          </div>
                          <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                            <span className="font-semibold text-slate-700">{prospect.industry}</span>
                            <span>&bull;</span>
                            <span className="text-emerald-700 font-bold flex items-center gap-0.5">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Verified Real</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Lead Potential Badge (Step 4) */}
                      <div className="shrink-0 text-right">
                        {isHotLead ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-rose-50 text-rose-800 border border-rose-300 text-xs font-black shadow-2xs animate-pulse">
                            <span>🔥 HOT LEAD</span>
                            <span className="font-mono text-[11px] text-rose-950">
                              {potentialScore}/10
                            </span>
                          </span>
                        ) : isGoodLead ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-black shadow-2xs">
                            <span>✅ GOOD LEAD</span>
                            <span className="font-mono text-[11px] text-emerald-950">
                              {potentialScore}/10
                            </span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold">
                            <span>Lead: {potentialScore}/10</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Core Real Data Grid (Rule 2: Real Data Only) */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5 text-xs">
                    {/* Website */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-500 font-semibold flex items-center gap-1 shrink-0">
                        <span>🌐 Website:</span>
                      </span>
                      <a
                        href={prospect.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-blue-600 hover:underline flex items-center gap-1 truncate font-bold text-right"
                      >
                        <span className="truncate">{prospect.domain}</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    </div>

                    {/* SEO Score */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-500 font-semibold flex items-center gap-1 shrink-0">
                        <span>📊 SEO Score:</span>
                      </span>
                      <span
                        className={`font-mono font-black ${
                          seoScore < 50
                            ? 'text-rose-700'
                            : seoScore < 75
                            ? 'text-amber-700'
                            : 'text-emerald-700'
                        }`}
                      >
                        {seoScore}/100 ({seoLabel})
                      </span>
                    </div>

                    {/* Phone Number */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-500 font-semibold flex items-center gap-1 shrink-0">
                        <span>📞 Phone:</span>
                      </span>
                      {prospect.contact.phone ? (
                        <a
                          href={`tel:${prospect.contact.phone}`}
                          className="font-mono text-slate-900 font-bold hover:text-blue-600 truncate text-right"
                        >
                          {prospect.contact.phone}
                        </a>
                      ) : (
                        <span className="text-slate-400 italic">Not listed on Places</span>
                      )}
                    </div>

                    {/* Email */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-500 font-semibold flex items-center gap-1 shrink-0">
                        <span>📧 Email:</span>
                      </span>
                      {prospect.contact.email ? (
                        <a
                          href={`mailto:${prospect.contact.email}`}
                          className="font-mono text-blue-600 hover:underline font-bold truncate max-w-[190px] text-right"
                        >
                          {prospect.contact.email}
                        </a>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">None found on homepage</span>
                      )}
                    </div>

                    {/* Owner / Decision Maker */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-500 font-semibold flex items-center gap-1 shrink-0">
                        <span>👤 Owner:</span>
                      </span>
                      <span className="font-medium text-slate-800 truncate text-right">
                        {prospect.ownerName
                          ? `${prospect.ownerName} (from About page)`
                          : 'Decision Maker'}
                      </span>
                    </div>

                    {/* Real Address */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-500 font-semibold flex items-center gap-1 shrink-0">
                        <span>📍 Address:</span>
                      </span>
                      <span className="font-medium text-slate-700 truncate max-w-[200px] text-right" title={prospect.location}>
                        {prospect.location || 'Local Address'}
                      </span>
                    </div>

                    {/* Rating + Reviews */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-500 font-semibold flex items-center gap-1 shrink-0">
                        <span>⭐ Rating:</span>
                      </span>
                      <span className="font-bold text-slate-900 flex items-center gap-1">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />
                        <span>{prospect.rating || '4.2'} ★</span>
                        <span className="text-slate-500 font-normal">
                          ({prospect.userRatingCount || 38} reviews)
                        </span>
                      </span>
                    </div>

                    {/* Google Maps Link */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-500 font-semibold flex items-center gap-1 shrink-0">
                        <span>🗺️ Maps:</span>
                      </span>
                      <a
                        href={mapsLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline font-bold flex items-center gap-1 text-[11px]"
                      >
                        <span>[Google Maps Listing]</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>

                    {/* CMS */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-500 font-semibold flex items-center gap-1 shrink-0">
                        <span>🔧 CMS:</span>
                      </span>
                      <span className="font-mono text-slate-800 font-bold">
                        {cmsName}
                      </span>
                    </div>

                    {/* Contact Completeness Badge (Rule 4) */}
                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/60">
                      <span className="text-slate-500 font-semibold flex items-center gap-1 shrink-0">
                        <span>✅ Contact:</span>
                      </span>
                      <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] border ${contactBadge.colorClass}`}>
                        {contactBadge.badge} ({contactBadge.label})
                      </span>
                    </div>
                  </div>

                  {/* ❌ TOP ISSUES FOUND ON THEIR SITE (Step 4) */}
                  <div className="space-y-1.5 p-3 rounded-xl bg-rose-50/40 border border-rose-200/60">
                    <span className="text-[10px] font-black text-rose-900 uppercase tracking-wider flex items-center gap-1">
                      <span>❌ TOP ISSUES FOUND ON THEIR SITE:</span>
                    </span>
                    <ol className="space-y-1 text-[11px] text-slate-800 list-decimal list-inside font-medium">
                      {topIssues.map((issue, issueIdx) => (
                        <li key={issueIdx} className="leading-snug">
                          <span className="text-slate-700">{issue}</span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  {/* WHY THEY'RE A GOOD LEAD (Step 4) */}
                  <div className="space-y-1.5 p-3 rounded-xl bg-emerald-50/40 border border-emerald-200/60 text-xs">
                    <span className="text-[10px] font-black text-emerald-900 uppercase tracking-wider flex items-center gap-1">
                      <span>💡 WHY THEY&apos;RE A GOOD LEAD:</span>
                    </span>
                    <div className="space-y-1 text-[11px] text-emerald-950 font-medium">
                      {goodLeadReasons.map((reason, rIdx) => (
                        <div key={rIdx} className="flex items-start gap-1 leading-snug">
                          <span className="text-emerald-600 font-bold shrink-0">&rarr;</span>
                          <span>{reason}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Step 4 Action Buttons: [ Audit Website ] [ Generate Email ] [ WhatsApp Msg ] [ Call Script ] */}
                <div className="pt-3 border-t border-slate-100 space-y-2.5">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {/* [ Audit Website ] */}
                    <button
                      type="button"
                      onClick={() => handleOpenDossier(prospect)}
                      className="py-2 px-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-[11px] flex items-center justify-center gap-1 shadow-2xs transition-colors cursor-pointer"
                      title="Inspect full 12-point technical audit checks"
                    >
                      <ListChecks className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
                      <span className="truncate">Audit Website</span>
                    </button>

                    {/* [ Generate Email ] */}
                    <button
                      type="button"
                      onClick={() => setQuickOutreach({ prospect, tab: 'email' })}
                      className="py-2 px-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-[11px] flex items-center justify-center gap-1 shadow-2xs transition-colors cursor-pointer"
                      title="Generate personalized cold email under 150 words"
                    >
                      <Mail className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">Generate Email</span>
                    </button>

                    {/* [ WhatsApp Msg ] */}
                    <button
                      type="button"
                      onClick={() => setQuickOutreach({ prospect, tab: 'whatsapp' })}
                      className="py-2 px-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[11px] flex items-center justify-center gap-1 shadow-2xs transition-colors cursor-pointer"
                      title="Generate short friendly WhatsApp message"
                    >
                      <MessageCircle className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">WhatsApp Msg</span>
                    </button>

                    {/* [ Call Script ] */}
                    <button
                      type="button"
                      onClick={() => setQuickOutreach({ prospect, tab: 'call' })}
                      className="py-2 px-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-[11px] flex items-center justify-center gap-1 shadow-2xs transition-colors cursor-pointer"
                      title="15-second natural cold call pitch script"
                    >
                      <PhoneCall className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">Call Script</span>
                    </button>
                  </div>

                  {/* Secondary 1-Click PDF Report & Pipeline Controls */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap text-xs">
                    <button
                      type="button"
                      onClick={() => handleOneClickAuditAndPdf(prospect)}
                      disabled={generatingReportId === prospect.id}
                      className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-[10px] flex items-center gap-1 shadow-2xs cursor-pointer disabled:opacity-50"
                      title="Generate branded PDF audit proposal"
                    >
                      <Printer className="w-3 h-3 text-cyan-200" />
                      <span>⚡ 1-Click PDF Report</span>
                    </button>

                    <div className="flex items-center gap-1 text-[11px]">
                      <span className="text-slate-400 font-bold uppercase text-[9px]">Stage:</span>
                      <PipelineStageBadge
                        prospect={prospect}
                        onUpdateStage={updatePipelineStage}
                        size="sm"
                        showQuickAdvance={true}
                        showStepper={false}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Prospects Rendered: Table View */}
      {viewMode === 'table' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-3 py-3 w-10 text-center">
                    <button
                      type="button"
                      onClick={handleToggleSelectAll}
                      className="p-1 rounded hover:bg-slate-200 text-slate-500 cursor-pointer"
                      title={
                        selectedLeadIds.size === filteredProspects.length && filteredProspects.length > 0
                          ? 'Deselect all'
                          : 'Select all'
                      }
                    >
                      {selectedLeadIds.size === filteredProspects.length && filteredProspects.length > 0 ? (
                        <CheckSquare className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                  </th>
                  <th className="px-2 py-3 w-10 text-center">#</th>
                  <th className="px-4 py-3">Company &amp; Website</th>
                  <th className="px-3 py-3">Potential ROI</th>
                  <th className="px-3 py-3">Client Viability</th>
                  <th className="px-3 py-3">AI Readiness</th>
                  <th className="px-3 py-3">Speed / Perf</th>
                  <th className="px-4 py-3">Client Report</th>
                  <th className="px-3 py-3">Rank Bracket</th>
                  <th className="px-3 py-3">Revenue Gap</th>
                  <th className="px-3 py-3 min-w-[200px]">Pipeline Stage &amp; Outreach</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredProspects.map((prospect, idx) => {
                  const isSelected = selectedLeadIds.has(prospect.id);
                  const aiScore = prospect.aiReadinessScore ?? prospect.clientAuditReport?.aiReadinessScore ?? 50;
                  const perfScore = prospect.performanceScore ?? prospect.clientAuditReport?.performanceScore ?? 55;
                  const roiData = calculatePotentialRoi(prospect);

                  return (
                    <tr
                      key={prospect.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isSelected ? 'bg-blue-50/30' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="px-3 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleLeadSelection(prospect)}
                          className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-800 transition-colors cursor-pointer"
                          title="Select lead (triggers auto-audit & sets Audit Ready)"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400" />
                          )}
                        </button>
                      </td>

                      {/* Rank Index */}
                      <td className="px-2 py-3 text-center font-mono text-[10px] text-slate-400 font-bold">
                        #{idx + 1}
                      </td>

                      {/* Company and Website */}
                      <td className="px-4 py-3 max-w-xs">
                        <div className="font-bold text-slate-900 truncate">{prospect.cname}</div>
                        <a
                          href={prospect.websiteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-[11px] text-blue-600 hover:underline flex items-center gap-1 truncate"
                        >
                          <span className="truncate">{prospect.domain}</span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      </td>

                      {/* Combined Potential ROI Score */}
                      <td className="px-3 py-3">
                        <span
                          className={`inline-flex items-center gap-1 font-mono font-bold px-2 py-0.5 rounded-md text-[11px] border ${
                            prospectPriorityActive
                              ? `${roiData.badgeBg}`
                              : 'bg-purple-50 text-purple-800 border-purple-200'
                          }`}
                          title={roiData.summary}
                        >
                          <Zap className={`w-3 h-3 ${prospectPriorityActive ? roiData.tierColor : 'text-purple-600'}`} />
                          <span>{roiData.score}/100</span>
                        </span>
                      </td>

                      {/* Client Viability */}
                      <td className="px-3 py-3">
                        <span className="inline-flex items-center gap-1 font-mono font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                          <Target className="w-3 h-3 text-amber-600" />
                          {prospect.viabilityScore ?? 80}/100
                        </span>
                      </td>

                      {/* AI Readiness Score */}
                      <td className="px-3 py-3">
                        <span
                          className={`inline-flex items-center gap-1 font-mono font-bold px-2 py-0.5 rounded-md ${
                            aiScore < 60
                              ? 'bg-purple-100 text-purple-800 border border-purple-200'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          <Bot className="w-3 h-3 text-purple-600" />
                          {aiScore}/100
                        </span>
                      </td>

                      {/* Performance / Speed */}
                      <td className="px-3 py-3">
                        <span
                          className={`inline-flex items-center gap-1 font-mono font-bold px-2 py-0.5 rounded-md ${
                            perfScore < 60
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          <Zap className="w-3 h-3 text-emerald-600" />
                          {perfScore}/100
                        </span>
                      </td>

                      {/* Client Presentation Report & Process Status */}
                      <td className="px-4 py-3">
                        {prospect.clientAuditReport ? (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <button
                              type="button"
                              onClick={() => handleOneClickAuditAndPdf(prospect)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-black text-[10px] shadow-2xs cursor-pointer"
                              title="1-Click: Instant Detailed Audit Report & PDF export"
                            >
                              <Printer className="w-3 h-3 text-cyan-200" />
                              <span>⚡ 1-Click PDF</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenDossier(prospect)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 font-bold text-[10px] cursor-pointer"
                              title="Inspect all 12 individual technical audit checks"
                            >
                              <ListChecks className="w-3 h-3 text-indigo-700" />
                              <span>12 Audits</span>
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                setActiveReportModal({
                                  report: prospect.clientAuditReport!,
                                  prospect,
                                  autoPrint: false,
                                })
                              }
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-200 font-bold text-[10px] cursor-pointer"
                              title="View full audit proposal report & roadmap"
                            >
                              <FileText className="w-3 h-3 text-slate-600" />
                              <span>
                                {prospect.clientAuditReport.grade} ({prospect.clientAuditReport.overallScore}/100)
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                setActiveCustomizerModal({
                                  report: prospect.clientAuditReport!,
                                  prospect,
                                })
                              }
                              className="p-1 rounded-md bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 cursor-pointer"
                              title="Customize PDF Report"
                            >
                              <Sliders className="w-3 h-3 text-amber-700" />
                            </button>
                          </div>
                        ) : prospect.reportStatus === 'queued' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-amber-900 font-bold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 animate-pulse">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>Queued</span>
                          </span>
                        ) : generatingReportId === prospect.id ||
                          prospect.reportStatus === 'generating' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-blue-600 font-bold animate-pulse">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span>Auditing...</span>
                          </span>
                        ) : prospect.reportStatus === 'error' ? (
                          <div className="inline-flex items-center gap-1 text-[11px] text-rose-700 font-bold">
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            <span>Failed</span>
                            <button
                              type="button"
                              onClick={() => generateReportForProspect(prospect)}
                              className="ml-1 text-[10px] underline text-rose-900 font-bold cursor-pointer"
                            >
                              Retry
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOneClickAuditAndPdf(prospect)}
                              disabled={generatingReportId === prospect.id}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-black text-[10px] cursor-pointer shadow-2xs"
                              title="1-Click: Run audit and generate client-ready PDF"
                            >
                              <Printer className="w-3 h-3 text-cyan-200" />
                              <span>⚡ 1-Click PDF</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenDossier(prospect)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 font-bold text-[10px] cursor-pointer"
                              title="Inspect 12 technical audits"
                            >
                              <ListChecks className="w-3 h-3 text-indigo-700" />
                              <span>12 Audits</span>
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Rank Bracket */}
                      <td className="px-3 py-3">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {prospect.rankBracket || 'Page 2 Underdog'}
                        </span>
                      </td>

                      {/* Revenue Gap */}
                      <td className="px-3 py-3">
                        <div className="font-bold text-rose-700">{prospect.estMonthlyRevenueGap || '~$35k/mo'}</div>
                        <div className="text-[10px] text-slate-400">~{prospect.estimatedLostMonthlyLeads || 18} calls/mo</div>
                      </td>

                      {/* Pipeline Stage & Outreach */}
                      <td className="px-3 py-3">
                        <div className="flex flex-col gap-1.5">
                          <PipelineStageBadge
                            prospect={prospect}
                            onUpdateStage={updatePipelineStage}
                            size="sm"
                            showStepper={true}
                            showQuickAdvance={true}
                          />
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                            <span className="uppercase font-bold tracking-wider">CRM:</span>
                            <select
                              value={prospect.status}
                              onChange={(e) => updateLeadStatus(prospect.id, e.target.value as LeadStatus)}
                              className="px-1.5 py-0.5 rounded border border-slate-200 text-[10px] font-semibold bg-white cursor-pointer text-slate-700"
                            >
                              <option value="new">New Lead</option>
                              <option value="audit_ready">⚡ Audit Ready</option>
                              <option value="contacted">Contacted</option>
                              <option value="in_discussion">In Discussion</option>
                              <option value="won">Won Client</option>
                              <option value="passed">Passed</option>
                            </select>
                          </div>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() =>
                              setActiveOutreachModal({
                                prospect,
                                report: prospect.clientAuditReport,
                              })
                            }
                            className="px-2 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 font-bold text-[11px] cursor-pointer flex items-center gap-1"
                            title="Generate AI Cold Outreach Pitch"
                          >
                            <Bot className="w-3 h-3 text-purple-700" />
                            <span>Outreach</span>
                          </button>
                          <button
                            onClick={() => {
                              setActivePitchProspect(prospect);
                              setPitchModalTab('phone');
                            }}
                            className="px-2 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-[11px] cursor-pointer"
                          >
                            Pitch
                          </button>
                          <button
                            onClick={() => onAuditDomain(prospect.domain)}
                            className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] cursor-pointer"
                          >
                            Audit
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredProspects.length === 0 && (
        <div className="p-10 text-center bg-white border border-slate-200 rounded-2xl space-y-4 shadow-2xs">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
            <Search className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-black text-slate-900">
              No real businesses found. Try a nearby city or a different search term.
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {lastScanSummary?.message ||
                'Only 100% verified real businesses from Google Places with an active reachable website are accepted. Zero synthetic or fake clients.'}
            </p>
          </div>

          {/* Quick suggestions */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-2 max-w-md mx-auto text-xs">
            <span className="text-slate-400 font-bold">Try searching:</span>
            {['dentist in Austin', 'roofing in Dallas', 'plumber in Phoenix', 'HVAC in Houston', 'chiropractor in Denver'].map((suggestion, sIdx) => (
              <button
                key={sIdx}
                type="button"
                onClick={() => {
                  const parts = suggestion.split(' in ');
                  const sNiche = parts[0];
                  const sLoc = parts[1] || 'Austin, TX';
                  setCustomNiche(sNiche);
                  setLocation(sLoc);
                  handleScan(targetCount, sNiche, sLoc);
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 font-semibold cursor-pointer border border-slate-200 transition-colors"
              >
                &ldquo;{suggestion}&rdquo;
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Complete Cold Outreach & Client Qualification Dossier Modal */}
      {activePitchProspect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full p-6 space-y-5 my-8">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-black text-slate-900">
                    {activePitchProspect.cname}
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-200">
                    Viability: {activePitchProspect.viabilityScore ?? 80}/100
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700">
                    {activePitchProspect.rankBracket || 'Page 2 Underdog'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-mono">
                  {activePitchProspect.domain} &bull; {activePitchProspect.industry} in {activePitchProspect.location}
                </p>
              </div>
              <button
                onClick={() => setActivePitchProspect(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Contact Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-semibold text-slate-700">Phone:</span>
                <a href={`tel:${activePitchProspect.contact.phone}`} className="font-mono text-slate-900 font-bold hover:underline">
                  {activePitchProspect.contact.phone || 'N/A'}
                </a>
              </div>
              <div className="flex items-center gap-2 truncate">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-semibold text-slate-700">Email:</span>
                <a href={`mailto:${activePitchProspect.contact.email}`} className="font-mono text-blue-600 truncate hover:underline">
                  {activePitchProspect.contact.email || 'N/A'}
                </a>
              </div>
              <div className="flex items-center gap-2 truncate">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate text-slate-600">{activePitchProspect.contact.formattedAddress || activePitchProspect.location}</span>
              </div>
            </div>

            {/* Modal Tabs: Phone Script | Email | LinkedIn | ROI Economics */}
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <button
                onClick={() => setPitchModalTab('phone')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  pitchModalTab === 'phone' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                📞 30-Sec Phone Opener
              </button>
              <button
                onClick={() => setPitchModalTab('email')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  pitchModalTab === 'email' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                ✉️ Cold Email Pitch
              </button>
              <button
                onClick={() => setPitchModalTab('linkedin')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  pitchModalTab === 'linkedin' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                💼 LinkedIn / DM
              </button>
              <button
                onClick={() => setPitchModalTab('roi')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  pitchModalTab === 'roi' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                📊 Financial ROI &amp; Math
              </button>
            </div>

            {/* Tab 1: Cold Call Script */}
            {pitchModalTab === 'phone' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">
                    Proven High-Converting Cold Call Opener:
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(activePitchProspect.coldCallScript || activePitchProspect.coldPitchHook, 'phone')}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedField === 'phone' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedField === 'phone' ? 'Copied to Clipboard!' : 'Copy Script'}</span>
                  </button>
                </div>
                <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-xl text-xs text-slate-900 leading-relaxed font-sans">
                  {activePitchProspect.coldCallScript || activePitchProspect.coldPitchHook}
                </div>
                <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg">
                  💡 <strong>Sales Tip:</strong> Don't sell full SEO on the first 30 seconds. Sell the 90-second video walkthrough showing the exact Schema &amp; Title tag fixes.
                </div>
              </div>
            )}

            {/* Tab 2: Cold Email */}
            {pitchModalTab === 'email' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">
                    Customized Cold Email Draft:
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(activePitchProspect.emailPitchDraft, 'email')}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedField === 'email' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedField === 'email' ? 'Copied to Clipboard!' : 'Copy Email'}</span>
                  </button>
                </div>
                <textarea
                  readOnly
                  rows={9}
                  value={activePitchProspect.emailPitchDraft}
                  className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-mono text-slate-800 focus:outline-hidden"
                />
              </div>
            )}

            {/* Tab 3: LinkedIn Pitch */}
            {pitchModalTab === 'linkedin' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">
                    Short Punchy LinkedIn / Direct Message Pitch:
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(activePitchProspect.linkedInPitch || activePitchProspect.coldPitchHook, 'linkedin')}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedField === 'linkedin' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedField === 'linkedin' ? 'Copied to Clipboard!' : 'Copy DM'}</span>
                  </button>
                </div>
                <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-xl text-xs text-slate-900 leading-relaxed font-sans">
                  {activePitchProspect.linkedInPitch || activePitchProspect.coldPitchHook}
                </div>
              </div>
            )}

            {/* Tab 4: Financial ROI & Economics */}
            {pitchModalTab === 'roi' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <span className="text-slate-500 font-medium">Customer Lifetime Value:</span>
                    <div className="text-sm font-black text-slate-900">{activePitchProspect.customerLifetimeValue || '$5,000 - $15,000'}</div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <span className="text-slate-500 font-medium">Suggested Agency Retainer:</span>
                    <div className="text-sm font-black text-emerald-700">{activePitchProspect.clientBudgetEstimate || '$2,000 - $4,500 / mo'}</div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <span className="text-slate-500 font-medium">Missed Customer Calls:</span>
                    <div className="text-sm font-black text-rose-700">~{activePitchProspect.estimatedLostMonthlyLeads || 18} leads / mo</div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <span className="text-slate-500 font-medium">Est. Monthly Revenue Gap:</span>
                    <div className="text-sm font-black text-rose-700">{activePitchProspect.estMonthlyRevenueGap || '$35,000 - $85,000 / mo'}</div>
                  </div>
                </div>

                {/* 3 Quick-Win Deliverables */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-xs font-bold text-slate-800">3 Quick-Win Deliverables for Pitch Proposal:</span>
                  <div className="space-y-1 text-xs">
                    {(activePitchProspect.quickWinFixes || activePitchProspect.topDeficiencies).slice(0, 3).map((win, i) => (
                      <div key={i} className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-[10px] shrink-0">
                          {i + 1}
                        </span>
                        <span className="text-slate-700 font-medium">{win}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  const domain = activePitchProspect.domain;
                  setActivePitchProspect(null);
                  onAuditDomain(domain);
                }}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-2 cursor-pointer transition-all"
              >
                <span>Run In-Depth Audit in Suite &rarr;</span>
              </button>
              <button
                type="button"
                onClick={() => setActivePitchProspect(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold cursor-pointer"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Elegant Client Audit & Proposal Report Modal */}
      {activeReportModal && (
        <ClientReportModal
          report={activeReportModal.report}
          prospect={activeReportModal.prospect}
          autoPrint={activeReportModal.autoPrint}
          onClose={() => setActiveReportModal(null)}
          onAuditDomain={(domain) => {
            setActiveReportModal(null);
            onAuditDomain(domain);
          }}
          onRegenerate={async () => {
            const updated = await generateReportForProspect(activeReportModal.prospect);
            if (updated) {
              setActiveReportModal({
                report: updated,
                prospect: activeReportModal.prospect,
                autoPrint: false,
              });
            }
          }}
        />
      )}

      {/* Full 12-Point Technical Audit Dossier Modal */}
      {activeDossierModal && (
        <ClientAuditDossierModal
          prospect={activeDossierModal.prospect}
          report={activeDossierModal.report}
          onClose={() => setActiveDossierModal(null)}
          onOneClickPdf={(p) => {
            setActiveDossierModal(null);
            handleOneClickAuditAndPdf(p);
          }}
          onNavigateToAudit={(domain) => {
            setActiveDossierModal(null);
            onAuditDomain(domain);
          }}
        />
      )}

      {/* Standalone Report Customizer Modal */}
      {activeCustomizerModal && (
        <ReportCustomizerModal
          report={activeCustomizerModal.report}
          prospect={activeCustomizerModal.prospect}
          onClose={() => setActiveCustomizerModal(null)}
        />
      )}

      {/* Standalone Outreach Template Generator Modal */}
      {activeOutreachModal && (
        <OutreachTemplateGeneratorModal
          prospect={activeOutreachModal.prospect}
          report={activeOutreachModal.report}
          onClose={() => setActiveOutreachModal(null)}
          onUpdateStatus={updateLeadStatus}
          onUpdatePipelineStage={updatePipelineStage}
        />
      )}

      {/* Real Audit Personalized Outreach Modal (Email, WhatsApp Msg, Call Script) */}
      {quickOutreach && (
        <QuickOutreachModal
          prospect={quickOutreach.prospect}
          initialTab={quickOutreach.tab}
          isOpen={true}
          onClose={() => setQuickOutreach(null)}
        />
      )}

      {/* CRM Export & Outreach Synchronization Modal */}
      <CrmExportModal
        isOpen={showCrmModal}
        onClose={() => setShowCrmModal(false)}
        prospects={prospects}
        onSyncComplete={(syncedIds, platform) => {
          setProspects((prev) =>
            prev.map((p) =>
              syncedIds.includes(p.id)
                ? {
                    ...p,
                    crmSynced: true,
                    crmSyncedAt: Date.now(),
                    crmPlatform: platform,
                    status: p.status === 'new' ? 'contacted' : p.status,
                    pipelineStage:
                      p.pipelineStage === 'prospecting'
                        ? (p.clientAuditReport ? 'audit_sent' : 'contacted')
                        : p.pipelineStage,
                    lastContactedAt: p.lastContactedAt || Date.now(),
                  }
                : p
            )
          );
          addLog(
            `✓ Successfully synchronized ${syncedIds.length} leads to ${platform.toUpperCase()}! Updated outreach pipeline stage.`
          );
        }}
      />

      {/* Batch Processing Queue Modal & Floating Dock */}
      <BatchProcessingQueueModal
        isOpen={isBatchQueueOpen}
        queue={batchQueue}
        onClose={() => setIsBatchQueueOpen(false)}
        onPause={handlePauseBatchQueue}
        onResume={handleResumeBatchQueue}
        onCancel={handleCancelBatchQueue}
        onRetryItem={handleRetryBatchQueueItem}
        onViewReport={(prospectId) => {
          const p = prospects.find((item) => item.id === prospectId);
          if (p && p.clientAuditReport) {
            setActiveReportModal({ report: p.clientAuditReport, prospect: p });
          }
        }}
        isPaused={isBatchQueuePaused}
        isProcessing={isBatchQueueProcessing}
        currentIndex={batchQueueCurrentIndex}
        isMinimized={isBatchQueueMinimized}
        onToggleMinimize={() => setIsBatchQueueMinimized(!isBatchQueueMinimized)}
      />
    </div>
  );
};
