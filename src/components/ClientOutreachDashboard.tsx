import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  Mail,
  Phone,
  Globe,
  ExternalLink,
  Sparkles,
  Copy,
  Check,
  Send,
  Download,
  Flame,
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  DollarSign,
  Briefcase,
  Layers,
  MapPin,
  Calendar,
  Clock,
  Edit3,
  Trash2,
  Plus,
  RefreshCw,
  FileText,
  FileSpreadsheet,
  Building2,
  Eye,
  Bot,
  Gauge,
  ArrowUpRight,
  Target,
  Zap,
  ChevronRight,
  X,
  Share2,
} from 'lucide-react';
import { ClientProspect, AuditReport, PipelineStage } from '../types';
import {
  loadClients,
  saveClient,
  saveAllClients,
  deleteClient,
  convertAuditToClient,
  generateMessageDraft,
  DRAFT_TEMPLATES,
  MessageDraftOptions,
} from '../utils/clientStorage';
import { calculatePotentialRoi } from '../utils/prospectPriority';
import { PIPELINE_STAGES, getPipelineStageConfig, resolveProspectStage } from '../utils/pipelineStages';
import { copyTextToClipboard } from '../utils/clipboard';

interface ClientOutreachDashboardProps {
  activeReport: AuditReport | null;
  auditHistory: AuditReport[];
  onNavigateToAudit: (urlOrDomain?: string) => void;
  onAuditDomain: (domain: string) => void;
}

export const ClientOutreachDashboard: React.FC<ClientOutreachDashboardProps> = ({
  activeReport,
  auditHistory,
  onNavigateToAudit,
  onAuditDomain,
}) => {
  // Clients state loaded from unified localStorage
  const [clients, setClients] = useState<ClientProspect[]>(() => loadClients());

  // Currently selected client for dossier & message draft
  const [selectedClientId, setSelectedClientId] = useState<string>(() => {
    const all = loadClients();
    return all.length > 0 ? all[0].id : '';
  });

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<
    | 'score_asc'
    | 'score_desc'
    | 'revenue_gap'
    | 'potential_roi'
    | 'name'
    | 'date_recent'
    | 'ai_gap'
  >('score_asc');
  const [viewLayout, setViewLayout] = useState<'split' | 'table'>('split');

  // Draft Generator Controls
  const [selectedTemplate, setSelectedTemplate] = useState<MessageDraftOptions['templateId']>('executive_cold');
  const [selectedTone, setSelectedTone] = useState<MessageDraftOptions['tone']>('consultative');
  const [senderName, setSenderName] = useState('Alex Chen');
  const [senderTitle, setSenderTitle] = useState('Principal SEO Strategist');
  const [agencyName, setAgencyName] = useState('AuditPulse SEO & AI');
  const [meetingLink, setMeetingLink] = useState('https://calendly.com/your-team/15min-review');

  // Active Draft Text (editable)
  const [draftSubject, setDraftSubject] = useState('');
  const [draftBody, setDraftBody] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientName, setRecipientName] = useState('');

  // UI Modals & Feedback
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [showImportHistoryModal, setShowImportHistoryModal] = useState(false);
  const [copiedDraft, setCopiedDraft] = useState(false);
  const [copiedSubject, setCopiedSubject] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' } | null>(null);

  // New Client Manual Form
  const [newDomain, setNewDomain] = useState('');
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newIndustry, setNewIndustry] = useState('Roofing Contractors');
  const [newLocation, setNewLocation] = useState('Austin, TX');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newContactName, setNewContactName] = useState('');

  const showToast = (text: string, type: 'success' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Selected client object
  const selectedClient = useMemo(() => {
    return clients.find((c) => c.id === selectedClientId) || clients[0] || null;
  }, [clients, selectedClientId]);

  // Sync / regenerate draft when selected client, template, tone, or sender changes
  useEffect(() => {
    if (!selectedClient) return;

    // Check if client has a custom saved draft matching this template
    if (
      selectedClient.customDraftBody &&
      selectedClient.customDraftTemplate === selectedTemplate
    ) {
      setDraftSubject(selectedClient.customDraftSubject || '');
      setDraftBody(selectedClient.customDraftBody || '');
      setRecipientEmail(selectedClient.customDraftRecipientEmail || selectedClient.contact?.email || '');
      setRecipientName(selectedClient.customDraftRecipientName || selectedClient.contactPersonName || '');
      return;
    }

    const { subject, body } = generateMessageDraft(selectedClient, {
      templateId: selectedTemplate,
      tone: selectedTone,
      senderName,
      senderTitle,
      agencyName,
      meetingLink,
    });

    setDraftSubject(subject);
    setDraftBody(body);
    setRecipientEmail(selectedClient.contact?.email || '');
    setRecipientName(selectedClient.contactPersonName || '');
  }, [selectedClient, selectedTemplate, selectedTone, senderName, senderTitle, agencyName, meetingLink]);

  // Save changes to client
  const handleSaveClientRecord = (updatedClient: ClientProspect, msg?: string) => {
    const updated = saveClient(updatedClient);
    setClients(updated);
    if (msg) showToast(msg, 'success');
  };

  // Delete a client
  const handleDeleteClient = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = deleteClient(id);
    setClients(updated);
    if (selectedClientId === id) {
      setSelectedClientId(updated.length > 0 ? updated[0].id : '');
    }
    showToast('Client removed from pipeline', 'info');
  };

  // Convert currently active audit into client
  const handleAddActiveAudit = () => {
    if (!activeReport) {
      showToast('No active audit loaded. Enter a URL in the top bar to run an audit first.', 'info');
      return;
    }

    const newClient = convertAuditToClient(activeReport);
    const updated = saveClient(newClient);
    setClients(updated);
    setSelectedClientId(newClient.id);
    showToast(`Added "${newClient.cname}" to client pipeline with live audit metrics!`, 'success');
  };

  // Import a past audit from history
  const handleImportAuditFromHistory = (report: AuditReport) => {
    const newClient = convertAuditToClient(report);
    const updated = saveClient(newClient);
    setClients(updated);
    setSelectedClientId(newClient.id);
    setShowImportHistoryModal(false);
    showToast(`Imported "${newClient.cname}" from audit history!`, 'success');
  };

  // Create manual client
  const handleCreateManualClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomain.trim()) return;

    const cleanDomain = newDomain.trim().replace(/^https?:\/\//i, '').replace(/\/.*$/, '');
    const cname = newCompanyName.trim() || cleanDomain;

    const client: ClientProspect = {
      id: `client_manual_${Date.now()}`,
      cname,
      domain: cleanDomain,
      websiteUrl: `https://${cleanDomain}`,
      industry: newIndustry,
      location: newLocation,
      contactPersonName: newContactName || 'Decision Maker',
      contact: {
        email: newEmail,
        phone: newPhone,
      },
      seoHealthScore: 55,
      grade: 'C',
      opportunityLevel: 'high',
      opportunitySummary: 'Prospective lead added to outreach pipeline.',
      aiReadinessScore: 40,
      performanceScore: 50,
      viabilityScore: 85,
      viabilityTier: 'high_ticket',
      clientBudgetEstimate: '$2,000 - $3,500 / mo',
      customerLifetimeValue: '$10,000 / client',
      estimatedLostMonthlyLeads: 14,
      estMonthlyRevenueGap: '$30,000 / mo',
      rankBracket: 'Page 2 Underdog (#11-20)',
      webDiscoverySource: 'Direct Site Crawl',
      buyingSignals: ['New prospect added for technical audit analysis and pitch preparation'],
      quickWinFixes: [
        'Deploy LocalBusiness and Services schema',
        'Compress mobile hero assets to speed up LCP',
        'Correct missing meta descriptions and canonical tags',
      ],
      topDeficiencies: [
        'Mobile LCP latency exceeding 3.8s',
        'Incomplete schema structured data',
        'Truncated title and meta descriptions on service pages',
      ],
      coldPitchHook: `Noticed ${cleanDomain} is losing high-intent local search inquiries to competitors.`,
      coldCallScript: `Hi, I was reviewing ${cleanDomain}'s search visibility and noticed a few quick fixes that could bring 10-15 extra customer inquiries a month.`,
      linkedInPitch: `Hi ${newContactName || 'there'}, noticed ${cleanDomain}'s search footprint has strong authority but missing schema and speed optimizations are keeping it from outranking competitors. Mind if I send a quick 2-minute video tear-down?`,
      emailPitchDraft: '',
      status: 'new',
      pipelineStage: 'prospecting',
      createdAt: Date.now(),
      lastUpdated: Date.now(),
    };

    const updated = saveClient(client);
    setClients(updated);
    setSelectedClientId(client.id);
    setShowAddClientModal(false);

    // Reset inputs
    setNewDomain('');
    setNewCompanyName('');
    setNewEmail('');
    setNewPhone('');
    setNewContactName('');

    showToast(`Created client record for ${cname}`, 'success');
  };

  // Copy draft to clipboard
  const handleCopyDraft = async () => {
    const fullText = `Subject: ${draftSubject}\n\n${draftBody}`;
    const ok = await copyTextToClipboard(fullText);
    if (ok) {
      setCopiedDraft(true);
      setTimeout(() => setCopiedDraft(false), 2200);
      showToast('Copied message draft to clipboard!', 'success');
    }
  };

  // Copy subject line only
  const handleCopySubject = async () => {
    const ok = await copyTextToClipboard(draftSubject);
    if (ok) {
      setCopiedSubject(true);
      setTimeout(() => setCopiedSubject(false), 2000);
      showToast('Copied subject line to clipboard!', 'info');
    }
  };

  // Save current edited draft into client record
  const handleSaveDraftToClient = () => {
    if (!selectedClient) return;
    const updated: ClientProspect = {
      ...selectedClient,
      customDraftSubject: draftSubject,
      customDraftBody: draftBody,
      customDraftTemplate: selectedTemplate,
      customDraftTone: selectedTone,
      customDraftRecipientEmail: recipientEmail,
      customDraftRecipientName: recipientName,
      customDraftLastSaved: Date.now(),
      contactPersonName: recipientName || selectedClient.contactPersonName,
      contact: {
        ...selectedClient.contact,
        email: recipientEmail || selectedClient.contact?.email,
      },
      status: selectedClient.status === 'new' ? 'audit_ready' : selectedClient.status,
    };
    handleSaveClientRecord(updated, 'Saved customized message draft to client profile');
  };

  // Open in default mail client via mailto
  const handleOpenMailto = () => {
    const to = recipientEmail.trim();
    const encodedSubject = encodeURIComponent(draftSubject);
    const encodedBody = encodeURIComponent(draftBody);
    const mailtoUrl = `mailto:${to}?subject=${encodedSubject}&body=${encodedBody}`;
    window.open(mailtoUrl, '_blank');

    // Automatically suggest advancing pipeline stage to 'contacted'
    if (selectedClient && selectedClient.pipelineStage === 'prospecting') {
      const updated: ClientProspect = {
        ...selectedClient,
        pipelineStage: 'contacted',
        status: 'contacted',
        lastContactedAt: Date.now(),
        outreachNotes: `Sent "${DRAFT_TEMPLATES.find((t) => t.id === selectedTemplate)?.name}" on ${new Date().toLocaleDateString()}`,
      };
      handleSaveClientRecord(updated, 'Advanced pipeline stage to "Contacted"');
    }
  };

  // Download draft as text file
  const handleDownloadDraft = () => {
    if (!selectedClient) return;
    const content = `# Outreach Pitch Draft for ${selectedClient.cname}\n\n**To:** ${recipientEmail || 'Client'}\n**Subject:** ${draftSubject}\n**Template:** ${DRAFT_TEMPLATES.find((t) => t.id === selectedTemplate)?.name}\n**Generated:** ${new Date().toLocaleString()}\n\n---\n\n${draftBody}`;
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `outreach-draft-${selectedClient.domain.replace(/[^a-zA-Z0-9.-]/g, '_')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Downloaded draft document', 'info');
  };

  // Filtered & Sorted Clients
  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      // Pipeline stage filter
      if (stageFilter !== 'all') {
        const stage = resolveProspectStage(client);
        if (stage !== stageFilter) return false;
      }

      // Priority filter
      if (priorityFilter !== 'all') {
        if (priorityFilter === 'high_ticket' && client.viabilityTier !== 'high_ticket') return false;
        if (priorityFilter === 'low_score' && (client.seoHealthScore || 0) >= 60) return false;
        if (priorityFilter === 'ai_blind' && (client.aiReadinessScore || 0) >= 50) return false;
        if (priorityFilter === 'page_2' && !client.rankBracket?.includes('Page 2')) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = client.cname.toLowerCase().includes(q);
        const matchDomain = client.domain.toLowerCase().includes(q);
        const matchIndustry = (client.industry || '').toLowerCase().includes(q);
        const matchLocation = (client.location || '').toLowerCase().includes(q);
        const matchContact = (client.contactPersonName || '').toLowerCase().includes(q);
        const matchEmail = (client.contact?.email || '').toLowerCase().includes(q);
        const matchNotes = (client.notes || '').toLowerCase().includes(q);
        const matchFlaws = (client.topDeficiencies || []).some((f) => f.toLowerCase().includes(q));

        return (
          matchName ||
          matchDomain ||
          matchIndustry ||
          matchLocation ||
          matchContact ||
          matchEmail ||
          matchNotes ||
          matchFlaws
        );
      }

      return true;
    });
  }, [clients, stageFilter, priorityFilter, searchQuery]);

  const sortedClients = useMemo(() => {
    return [...filteredClients].sort((a, b) => {
      switch (sortBy) {
        case 'score_asc':
          return (a.seoHealthScore || 0) - (b.seoHealthScore || 0); // Lowest score = biggest opportunity
        case 'score_desc':
          return (b.seoHealthScore || 0) - (a.seoHealthScore || 0);
        case 'potential_roi':
          return calculatePotentialRoi(b).score - calculatePotentialRoi(a).score;
        case 'revenue_gap':
          return (b.estimatedLostMonthlyLeads || 0) - (a.estimatedLostMonthlyLeads || 0);
        case 'name':
          return a.cname.localeCompare(b.cname);
        case 'date_recent':
          return (b.lastUpdated || b.createdAt || 0) - (a.lastUpdated || a.createdAt || 0);
        case 'ai_gap':
          return (a.aiReadinessScore || 0) - (b.aiReadinessScore || 0);
        default:
          return (a.seoHealthScore || 0) - (b.seoHealthScore || 0);
      }
    });
  }, [filteredClients, sortBy]);

  // Aggregate stats
  const totalCount = clients.length;
  const contactedCount = clients.filter((c) => resolveProspectStage(c) !== 'prospecting').length;
  const avgScore = totalCount > 0 ? Math.round(clients.reduce((acc, c) => acc + (c.seoHealthScore || 50), 0) / totalCount) : 0;
  const totalLostLeads = clients.reduce((acc, c) => acc + (c.estimatedLostMonthlyLeads || 10), 0);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-slate-900 text-white text-xs shadow-xl border border-slate-700 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-medium">{toastMessage.text}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="ml-2 text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 1. TOP HEADER & METRICS BAR */}
      <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-slate-900 tracking-tight">
                  Client Intelligence &amp; Outreach CRM
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  Audit-Connected
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Manage client accounts, search and triage by SEO opportunity, and instantly assemble all audit intelligence into personalized message drafts.
              </p>
            </div>
          </div>

          {/* Action Buttons: Add Current Audit, Import History, New Client */}
          <div className="flex items-center gap-2 flex-wrap self-stretch sm:self-auto">
            {activeReport && (
              <button
                type="button"
                id="add-current-audit-client-btn"
                onClick={handleAddActiveAudit}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all cursor-pointer"
                title="Convert the active website audit into a client record"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Current Audit as Client</span>
                <span className="text-[10px] bg-blue-500 text-white px-1.5 py-0.2 rounded font-mono">
                  {activeReport.domain} ({Math.round(activeReport.scores?.overall ?? activeReport.overallScore ?? 0)})
                </span>
              </button>
            )}

            {auditHistory.length > 0 && (
              <button
                type="button"
                id="import-audit-history-btn"
                onClick={() => setShowImportHistoryModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs transition-all cursor-pointer"
              >
                <Clock className="w-3.5 h-3.5 text-purple-600" />
                <span>Import Past Audits ({auditHistory.length})</span>
              </button>
            )}

            <button
              type="button"
              id="new-manual-client-btn"
              onClick={() => setShowAddClientModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Custom Client</span>
            </button>
          </div>
        </div>

        {/* Aggregate KPI Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Total Clients
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-black text-slate-900">{totalCount}</span>
              <span className="text-xs text-slate-500">in pipeline</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-100">
            <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block">
              Outreach Progress
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-black text-blue-900">{contactedCount}</span>
              <span className="text-xs text-blue-700">of {totalCount} contacted</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-100">
            <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">
              Avg SEO Health
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-black text-amber-900">{avgScore}/100</span>
              <span className="text-xs text-amber-700 font-semibold">
                {avgScore < 60 ? 'High Opportunity' : 'Moderate'}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-100">
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">
              Monthly Organic Upside
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-black text-emerald-900">~{totalLostLeads} Leads</span>
              <span className="text-xs text-emerald-700">recoverable</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. SEARCH, SORTING & FILTER BAR */}
      <div className="rounded-2xl bg-white border border-slate-200 p-4 space-y-3 shadow-xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Real-time Full-text Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="client-search-input"
              type="text"
              placeholder="Search clients by name, domain, industry, email, phone, location, or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-20 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 bg-slate-50/80 hover:bg-white focus:bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 px-2 py-1 text-xs text-slate-400 hover:text-slate-700 bg-slate-200/70 rounded-md font-medium"
              >
                Clear ✕
              </button>
            )}
          </div>

          {/* Sorting Dropdown */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold shrink-0">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-slate-500 text-[11px]">Sort By:</span>
              <select
                id="client-sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="score_asc">SEO Score: Lowest First (High Opportunity)</option>
                <option value="score_desc">SEO Score: Highest First</option>
                <option value="potential_roi">Potential ROI Score</option>
                <option value="revenue_gap">Monthly Lost Leads / Revenue</option>
                <option value="ai_gap">AI Readiness Gap (Lowest AI First)</option>
                <option value="name">Company Name (A-Z)</option>
                <option value="date_recent">Recently Added / Updated</option>
              </select>
            </div>
          </div>
        </div>

        {/* Pipeline Stage Chips & Opportunity Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
          {/* Stage Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider shrink-0">
              Stage:
            </span>
            <button
              onClick={() => setStageFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer shrink-0 ${
                stageFilter === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All ({clients.length})
            </button>
            {PIPELINE_STAGES.map((s) => {
              const count = clients.filter((c) => resolveProspectStage(c) === s.id).length;
              const isActive = stageFilter === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setStageFilter(s.id)}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                    isActive
                      ? s.activePillBg
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${s.dotColor}`} />
                  <span>{s.shortLabel}</span>
                  <span className="text-[10px] opacity-80">({count})</span>
                </button>
              );
            })}
          </div>

          {/* Quick Opportunity Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider shrink-0">
              Opportunity:
            </span>
            <button
              onClick={() => setPriorityFilter('all')}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold cursor-pointer ${
                priorityFilter === 'all' ? 'bg-slate-200 text-slate-900 font-bold' : 'text-slate-500'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setPriorityFilter('high_ticket')}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold cursor-pointer flex items-center gap-1 ${
                priorityFilter === 'high_ticket'
                  ? 'bg-emerald-100 text-emerald-800 font-bold'
                  : 'text-slate-600 hover:text-emerald-700'
              }`}
            >
              <DollarSign className="w-3 h-3 text-emerald-600" />
              <span>High-Ticket ($5k+)</span>
            </button>
            <button
              onClick={() => setPriorityFilter('low_score')}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold cursor-pointer flex items-center gap-1 ${
                priorityFilter === 'low_score'
                  ? 'bg-rose-100 text-rose-800 font-bold'
                  : 'text-slate-600 hover:text-rose-700'
              }`}
            >
              <Flame className="w-3 h-3 text-rose-600" />
              <span>Score &lt;60</span>
            </button>
            <button
              onClick={() => setPriorityFilter('ai_blind')}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold cursor-pointer flex items-center gap-1 ${
                priorityFilter === 'ai_blind'
                  ? 'bg-purple-100 text-purple-800 font-bold'
                  : 'text-slate-600 hover:text-purple-700'
              }`}
            >
              <Bot className="w-3 h-3 text-purple-600" />
              <span>AI Blindspot</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. MAIN WORKSPACE: SPLIT VIEW (CLIENTS LIST / CARDS ON LEFT + COMPLETE DOSSIER & MESSAGE DRAFT ON RIGHT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Sorted Client List (5 cols on lg) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-700">
              Showing {sortedClients.length} of {clients.length} Clients
            </span>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-xs text-blue-600 hover:underline font-semibold cursor-pointer"
              >
                Reset Search
              </button>
            )}
          </div>

          {sortedClients.length === 0 ? (
            <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center space-y-3">
              <Users className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-700">No clients match your filter criteria.</p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setStageFilter('all');
                  setPriorityFilter('all');
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200 cursor-pointer"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            sortedClients.map((client) => {
              const isSelected = selectedClient?.id === client.id;
              const stageConfig = getPipelineStageConfig(client.pipelineStage);
              const { score: roiScore } = calculatePotentialRoi(client);
              const score = client.seoHealthScore || 50;

              return (
                <div
                  key={client.id}
                  id={`client-card-${client.id}`}
                  onClick={() => setSelectedClientId(client.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer relative group ${
                    isSelected
                      ? 'bg-blue-50/40 border-blue-500 shadow-xs ring-1 ring-blue-500/20'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 shadow-2xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* Pipeline Stage Badge */}
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${stageConfig.badgeBg}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${stageConfig.dotColor}`} />
                          <span>{stageConfig.shortLabel}</span>
                        </span>

                        {/* Viability Tier */}
                        {client.viabilityTier === 'high_ticket' && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-0.5">
                            <DollarSign className="w-2.5 h-2.5 text-emerald-600" />
                            <span>High-Ticket</span>
                          </span>
                        )}

                        {client.customDraftLastSaved && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                            Draft Saved
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                        {client.cname}
                      </h3>

                      <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                        <span className="flex items-center gap-1 truncate font-mono text-[11px]">
                          <Globe className="w-3 h-3 text-slate-400 shrink-0" />
                          {client.domain}
                        </span>
                        {client.location && (
                          <span className="flex items-center gap-1 truncate text-[11px]">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            {client.location}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* SEO Health Score Ring / Pill */}
                    <div className="flex flex-col items-end shrink-0">
                      <div
                        className={`px-2.5 py-1 rounded-xl text-center font-black text-xs ${
                          score < 50
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : score < 75
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        }`}
                        title="Audit SEO Health Score (Lower = Bigger Pitch Opportunity)"
                      >
                        <span className="text-[10px] block font-semibold opacity-70">SEO</span>
                        <span>{score}/100</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-semibold mt-1">
                        ROI: {roiScore}
                      </span>
                    </div>
                  </div>

                  {/* Primary Flaw & Lost Revenue Preview */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100/80 flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-1.5 text-rose-700 font-medium truncate max-w-[240px]">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span className="truncate text-[11px]">
                        {client.topDeficiencies?.[0] || 'Unoptimized SEO & mobile latency'}
                      </span>
                    </div>

                    <span className="text-[11px] font-bold text-slate-700 shrink-0">
                      ~{client.estimatedLostMonthlyLeads || 12} lost leads/mo
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Complete Client Intelligence Dossier & Instant Message Draft (7 cols on lg) */}
        <div className="lg:col-span-7 space-y-6">
          {selectedClient ? (
            <div className="space-y-6">
              {/* Dossier Card: Client Overview & Connected Audit Intelligence */}
              <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-xs space-y-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-black text-slate-900 tracking-tight">
                        {selectedClient.cname}
                      </h2>
                      <a
                        href={selectedClient.websiteUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-slate-400 hover:text-blue-600 transition-colors p-1"
                        title="Visit client website"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                    <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                      <span>{selectedClient.industry || 'Commercial Services'}</span>
                      <span>•</span>
                      <span>{selectedClient.location || 'United States'}</span>
                    </p>
                  </div>

                  {/* Quick Audit Action: Inspect Live Audit / Re-crawl */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onNavigateToAudit(selectedClient.domain)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-all cursor-pointer"
                      title="Open full diagnostic crawl and issues in Website Audit tab"
                    >
                      <Gauge className="w-3.5 h-3.5 text-blue-600" />
                      <span>Inspect Live Audit</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleDeleteClient(selectedClient.id, e)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Remove client"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Audit Health Vitals Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">
                      Overall Health
                    </span>
                    <span className="text-xl font-black text-slate-900 block mt-0.5">
                      {selectedClient.seoHealthScore || 50}/100
                    </span>
                    <span className="text-[10px] font-bold text-rose-600">Grade {selectedClient.grade || 'C'}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-100 text-center">
                    <span className="text-[10px] font-bold text-purple-700 uppercase block">
                      AI Search (GEO)
                    </span>
                    <span className="text-xl font-black text-purple-900 block mt-0.5">
                      {selectedClient.aiReadinessScore || 40}/100
                    </span>
                    <span className="text-[10px] text-purple-600 font-medium">Perplexity/ChatGPT</span>
                  </div>

                  <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-100 text-center">
                    <span className="text-[10px] font-bold text-amber-700 uppercase block">
                      Mobile Speed
                    </span>
                    <span className="text-xl font-black text-amber-900 block mt-0.5">
                      {selectedClient.performanceScore || 48}/100
                    </span>
                    <span className="text-[10px] text-amber-700 font-medium">Core Web Vitals</span>
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-100 text-center">
                    <span className="text-[10px] font-bold text-emerald-700 uppercase block">
                      Revenue Gap
                    </span>
                    <span className="text-xl font-black text-emerald-900 block mt-0.5">
                      {selectedClient.estMonthlyRevenueGap || '$30k/mo'}
                    </span>
                    <span className="text-[10px] text-emerald-700 font-medium">~{selectedClient.estimatedLostMonthlyLeads || 15} leads</span>
                  </div>
                </div>

                {/* Contact & Decision Maker Details */}
                <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-white border border-slate-200 text-slate-700">
                      <Briefcase className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 block">
                        {selectedClient.contactPersonName || 'Decision Maker'}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {selectedClient.contactPersonRole || 'Managing Director / Owner'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-slate-600 font-medium">
                    {selectedClient.contact?.email && (
                      <span className="flex items-center gap-1 font-mono text-[11px]">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        {selectedClient.contact.email}
                      </span>
                    )}
                    {selectedClient.contact?.phone && (
                      <span className="flex items-center gap-1 font-mono text-[11px]">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        {selectedClient.contact.phone}
                      </span>
                    )}
                  </div>
                </div>

                {/* Audit Deficiencies & Quick Wins Summary */}
                <div className="space-y-2.5">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                    Key Audit Diagnostic Evidence (Pre-Loaded into Message Draft):
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                    <div className="p-3 rounded-xl bg-rose-50/50 border border-rose-100 space-y-1">
                      <span className="font-bold text-rose-900 flex items-center gap-1 text-[11px]">
                        <AlertOctagon className="w-3.5 h-3.5 text-rose-600" /> Top Flaws Uncovered:
                      </span>
                      <ul className="space-y-1 text-slate-700 text-[11px] pl-2">
                        {(selectedClient.topDeficiencies || []).slice(0, 3).map((def, i) => (
                          <li key={i} className="list-disc list-inside truncate">
                            {def}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100 space-y-1">
                      <span className="font-bold text-emerald-900 flex items-center gap-1 text-[11px]">
                        <Zap className="w-3.5 h-3.5 text-emerald-600" /> 30-Day Quick Wins:
                      </span>
                      <ul className="space-y-1 text-slate-700 text-[11px] pl-2">
                        {(selectedClient.quickWinFixes || []).slice(0, 3).map((win, i) => (
                          <li key={i} className="list-disc list-inside truncate">
                            {win}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Pipeline Stage Bar */}
                <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-600">Current Pipeline Stage:</span>
                    <select
                      value={selectedClient.pipelineStage || 'prospecting'}
                      onChange={(e) => {
                        const newStage = e.target.value as PipelineStage;
                        handleSaveClientRecord({
                          ...selectedClient,
                          pipelineStage: newStage,
                          status: newStage === 'closed_won' ? 'won' : newStage === 'prospecting' ? 'audit_ready' : 'contacted',
                        }, `Updated pipeline stage to "${getPipelineStageConfig(newStage).label}"`);
                      }}
                      className="text-xs font-bold px-2.5 py-1 rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                    >
                      {PIPELINE_STAGES.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.stepNumber}. {s.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <span className="text-[11px] text-slate-400">
                    Last updated: {new Date(selectedClient.lastUpdated || Date.now()).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* OUTREACH MESSAGE DRAFTER ("making all things ready till msg draft") */}
              <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-purple-50 border border-purple-100 text-purple-600">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        Tailored Outreach Message Draft
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Pre-populated with {selectedClient.cname}&apos;s real audit flaws, lost leads estimate, and tailored pitch hook.
                      </p>
                    </div>
                  </div>

                  {/* Actions: Copy Draft, Mailto, Save to Client */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      id="save-draft-btn"
                      onClick={handleSaveDraftToClient}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-all cursor-pointer flex items-center gap-1"
                      title="Save customized edits to this client's profile"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                      <span>Save Draft</span>
                    </button>

                    <button
                      type="button"
                      id="copy-draft-btn"
                      onClick={handleCopyDraft}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-800 bg-white hover:bg-slate-50 border border-slate-300 shadow-2xs transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      {copiedDraft ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                          <span className="text-emerald-700">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-600" />
                          <span>Copy Message</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      id="mailto-client-btn"
                      onClick={handleOpenMailto}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                      title="Open in your default email client (Outlook, Apple Mail, Gmail)"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Send Email (Mailto)</span>
                    </button>
                  </div>
                </div>

                {/* Template Selection Tabs */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Outreach Angle &amp; Goal:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {DRAFT_TEMPLATES.map((tmpl) => {
                      const isSelected = selectedTemplate === tmpl.id;
                      return (
                        <button
                          key={tmpl.id}
                          type="button"
                          onClick={() => setSelectedTemplate(tmpl.id)}
                          className={`p-2 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between ${
                            isSelected
                              ? 'bg-blue-50/80 border-blue-500 text-blue-950 shadow-2xs font-bold'
                              : 'bg-slate-50/70 border-slate-200 text-slate-700 hover:bg-slate-100/80'
                          }`}
                        >
                          <span className="text-xs truncate block font-bold">{tmpl.name}</span>
                          <span className="text-[10px] text-slate-500 block truncate mt-0.5">
                            {tmpl.badge}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Customizer Controls Bar: Tone, Sender, Meeting Link, Recipient */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                      Recipient Email
                    </label>
                    <input
                      type="email"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      placeholder="client@company.com"
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                      Recipient Contact Name
                    </label>
                    <input
                      type="text"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      placeholder="e.g. Marcus Vance"
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                      Tone
                    </label>
                    <select
                      value={selectedTone}
                      onChange={(e) => setSelectedTone(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                    >
                      <option value="consultative">Consultative &amp; Diagnostic</option>
                      <option value="executive">Executive &amp; High-Level</option>
                      <option value="friendly">Warm &amp; Collaborative</option>
                      <option value="urgent">Urgent &amp; Revenue-Focused</option>
                    </select>
                  </div>
                </div>

                {/* Subject Line Field */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">Email Subject Line:</label>
                    <button
                      type="button"
                      onClick={handleCopySubject}
                      className="text-[11px] font-semibold text-blue-600 hover:underline cursor-pointer flex items-center gap-1"
                    >
                      {copiedSubject ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedSubject ? 'Subject Copied' : 'Copy Subject'}</span>
                    </button>
                  </div>
                  <input
                    id="draft-subject-input"
                    type="text"
                    value={draftSubject}
                    onChange={(e) => setDraftSubject(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>

                {/* Full Draft Body Area (Editable) */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">Message Body (Editable):</label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleDownloadDraft}
                        className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 cursor-pointer flex items-center gap-1"
                      >
                        <Download className="w-3 h-3" />
                        <span>Download .MD</span>
                      </button>
                    </div>
                  </div>
                  <textarea
                    id="draft-body-textarea"
                    rows={12}
                    value={draftBody}
                    onChange={(e) => setDraftBody(e.target.value)}
                    className="w-full p-4 text-xs sm:text-sm font-mono leading-relaxed rounded-xl border border-slate-300 bg-slate-50/50 hover:bg-white focus:bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all resize-y"
                  />
                </div>

                {/* Secondary Agency Signature Config */}
                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <span>Sender:</span>
                    <input
                      type="text"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      placeholder="Your Name"
                      className="px-2 py-0.5 text-xs rounded border border-slate-200 bg-white w-28 text-slate-700 font-medium"
                    />
                    <span>Agency:</span>
                    <input
                      type="text"
                      value={agencyName}
                      onChange={(e) => setAgencyName(e.target.value)}
                      placeholder="Agency Name"
                      className="px-2 py-0.5 text-xs rounded border border-slate-200 bg-white w-36 text-slate-700 font-medium"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <span>Calendar:</span>
                    <input
                      type="text"
                      value={meetingLink}
                      onChange={(e) => setMeetingLink(e.target.value)}
                      placeholder="Booking Link"
                      className="px-2 py-0.5 text-xs rounded border border-slate-200 bg-white w-44 text-slate-700 font-mono text-[11px]"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 rounded-2xl bg-white border border-slate-200 text-center space-y-3">
              <Users className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">Select a Client</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Pick any client on the left or click &ldquo;+ Add Current Audit as Client&rdquo; to load their complete intelligence profile and message draft.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: ADD MANUAL CLIENT */}
      {showAddClientModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Add New Prospect to Client CRM</h3>
              <button
                type="button"
                onClick={() => setShowAddClientModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateManualClient} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Website Domain / URL *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. acmeplumbingaustin.com"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Company / Business Name</label>
                <input
                  type="text"
                  placeholder="e.g. Acme Plumbing & Drain Pros"
                  value={newCompanyName}
                  onChange={(e) => setNewCompanyName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Industry / Niche</label>
                  <input
                    type="text"
                    value={newIndustry}
                    onChange={(e) => setNewIndustry(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">City / Location</label>
                  <input
                    type="text"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Decision Maker Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Dave Miller"
                    value={newContactName}
                    onChange={(e) => setNewContactName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Contact Email</label>
                  <input
                    type="email"
                    placeholder="dave@acme.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddClientModal(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xs cursor-pointer"
                >
                  Create Client Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: IMPORT PAST AUDIT FROM HISTORY */}
      {showImportHistoryModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-purple-600" />
                <h3 className="text-base font-bold text-slate-900">Import from Audit History</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowImportHistoryModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Select any previously crawled domain to automatically create a qualified client record with its exact SEO score, CWV stats, and critical issues.
            </p>

            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {auditHistory.map((hist) => (
                <div
                  key={hist.id}
                  onClick={() => handleImportAuditFromHistory(hist)}
                  className="p-3 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 transition-all cursor-pointer flex items-center justify-between gap-3 group"
                >
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-slate-900 group-hover:text-blue-600 block truncate">
                      {hist.domain || hist.url}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Audited on {new Date(hist.timestamp).toLocaleDateString()} • {hist.crawledPages?.length || 1} pages crawled
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-black px-2 py-0.5 rounded-lg bg-slate-100 text-slate-800">
                      Score: {Math.round(hist.scores?.overall ?? hist.overallScore ?? 0)}
                    </span>
                    <span className="text-xs font-bold text-blue-600 flex items-center gap-0.5">
                      Import <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowImportHistoryModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
