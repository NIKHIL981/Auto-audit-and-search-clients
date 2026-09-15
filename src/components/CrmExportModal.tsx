import React, { useState } from 'react';
import {
  X,
  Database,
  Send,
  Download,
  Check,
  Loader2,
  FileSpreadsheet,
  Globe,
  Flame,
  CheckCircle2,
  AlertCircle,
  Terminal,
  ShieldCheck,
  Sparkles,
  Layers,
  Phone,
  Mail,
} from 'lucide-react';
import { ClientProspect, CrmPlatform } from '../types';

interface CrmExportModalProps {
  isOpen?: boolean;
  prospects: ClientProspect[];
  onClose: () => void;
  onSyncComplete: (syncedIds: string[], platform: string) => void;
}

const CRM_PLATFORMS: Array<{
  id: CrmPlatform;
  name: string;
  badge: string;
  description: string;
  color: string;
}> = [
  {
    id: 'hubspot',
    name: 'HubSpot CRM',
    badge: 'Popular',
    description: 'Syncs companies, contacts, SEO health scores, and custom deal pipeline stages.',
    color: 'border-amber-400 bg-amber-50/50 text-amber-900',
  },
  {
    id: 'gohighlevel',
    name: 'GoHighLevel (GHL)',
    badge: 'Agency Favorite',
    description: 'Pushes leads to sub-accounts, tags, custom opportunities, and SMS/Email outreach workflows.',
    color: 'border-blue-400 bg-blue-50/50 text-blue-900',
  },
  {
    id: 'salesforce',
    name: 'Salesforce Sales Cloud',
    badge: 'Enterprise',
    description: 'Maps accounts, leads, phone openers, and estimated monthly revenue gaps.',
    color: 'border-cyan-400 bg-cyan-50/50 text-cyan-900',
  },
  {
    id: 'pipedrive',
    name: 'Pipedrive',
    badge: 'Sales Pipeline',
    description: 'Creates deals with value set to recommended SEO retainer budget.',
    color: 'border-emerald-400 bg-emerald-50/50 text-emerald-900',
  },
  {
    id: 'webhook',
    name: 'Custom Webhook / Zapier',
    badge: 'Automation',
    description: 'Dispatches real-time JSON payload to Zapier, Make, or custom API endpoints.',
    color: 'border-purple-400 bg-purple-50/50 text-purple-900',
  },
];

export const CrmExportModal: React.FC<CrmExportModalProps> = ({
  isOpen = true,
  prospects,
  onClose,
  onSyncComplete,
}) => {
  if (!isOpen) return null;

  const [selectedPlatform, setSelectedPlatform] = useState<CrmPlatform>('hubspot');
  const [leadScope, setLeadScope] = useState<'all' | 'high_viability' | 'with_report'>('high_viability');
  const [dealStage, setDealStage] = useState('Cold Lead - Outreach Ready');
  const [webhookUrl, setWebhookUrl] = useState('https://hooks.zapier.com/hooks/catch/seo-leads');

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<{ current: number; total: number } | null>(null);
  const [syncLogs, setSyncLogs] = useState<string[]>([]);
  const [syncCompleted, setSyncCompleted] = useState(false);
  const [syncedCount, setSyncedCount] = useState(0);

  // Filter leads based on selected scope
  const targetLeads = React.useMemo(() => {
    if (leadScope === 'high_viability') {
      return prospects.filter((p) => (p.viabilityScore ?? 75) >= 80);
    }
    if (leadScope === 'with_report') {
      return prospects.filter((p) => Boolean(p.clientAuditReport));
    }
    return prospects;
  }, [prospects, leadScope]);

  // Handle live simulated push to CRM
  const handlePushToCrm = async () => {
    if (targetLeads.length === 0) return;

    setIsSyncing(true);
    setSyncCompleted(false);
    setSyncLogs([]);
    setSyncProgress({ current: 0, total: targetLeads.length });

    try {
      const res = await fetch('/api/crm/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: selectedPlatform,
          leads: targetLeads,
          webhookUrl: selectedPlatform === 'webhook' ? webhookUrl : undefined,
          customDealStage: dealStage,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to synchronize with CRM API');
      }

      const data = await res.json();
      setSyncLogs(data.log || []);
      setSyncedCount(data.totalSynced || targetLeads.length);
      setSyncCompleted(true);

      const syncedIds = targetLeads.map((l) => l.id);
      onSyncComplete(syncedIds, selectedPlatform);
    } catch (err: any) {
      setSyncLogs((prev) => [...prev, `[ERROR] CRM Sync Failed: ${err.message}`]);
    } finally {
      setIsSyncing(false);
      setSyncProgress(null);
    }
  };

  // Export Cold Email CSV (Instantly / Smartlead / Lemlist format)
  const handleDownloadOutreachCsv = () => {
    if (targetLeads.length === 0) return;

    const headers = [
      'first_name',
      'company_name',
      'website',
      'domain',
      'email',
      'phone',
      'location',
      'industry',
      'seo_health_score',
      'client_viability_score',
      'estimated_revenue_gap',
      'suggested_retainer',
      'outranking_competitor',
      'cold_call_script',
      'email_icebreaker',
      'has_client_report',
    ];

    const rows = targetLeads.map((p) => [
      `"${p.cname.split(' ')[0].replace(/"/g, '""')}"`,
      `"${p.cname.replace(/"/g, '""')}"`,
      `"${p.websiteUrl}"`,
      `"${p.domain}"`,
      `"${p.contact.email || ''}"`,
      `"${p.contact.phone || ''}"`,
      `"${p.location}"`,
      `"${p.industry}"`,
      p.seoHealthScore,
      p.viabilityScore ?? 75,
      `"${p.estMonthlyRevenueGap || ''}"`,
      `"${p.clientBudgetEstimate || ''}"`,
      `"${p.outrankingCompetitor || ''}"`,
      `"${(p.coldCallScript || p.coldPitchHook).replace(/"/g, '""')}"`,
      `"I noticed ${p.domain} is missing LocalBusiness schema, causing you to lose calls to ${p.outrankingCompetitor || 'competitors'}."`,
      p.clientAuditReport ? 'Yes' : 'No',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `cold_outreach_leads_${selectedPlatform}_${Date.now()}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-6 my-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                <Database className="w-4 h-4" />
              </div>
              <h3 className="text-base font-black text-slate-900">
                CRM Export &amp; Cold Outreach Push
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              Push qualified leads directly to your sales pipeline or download specialized CSVs for cold outreach (Instantly, Smartlead, Lemlist).
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lead Scope Selector */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700">Select Leads to Push:</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setLeadScope('high_viability')}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                leadScope === 'high_viability'
                  ? 'border-amber-400 bg-amber-50/70 shadow-2xs'
                  : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              <div className="text-xs font-bold text-slate-900 flex items-center gap-1">
                <Flame className="w-3 h-3 text-amber-600" />
                <span>High Viability Only</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5 font-medium">
                {prospects.filter((p) => (p.viabilityScore ?? 75) >= 80).length} Leads (80+ Score)
              </div>
            </button>

            <button
              type="button"
              onClick={() => setLeadScope('with_report')}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                leadScope === 'with_report'
                  ? 'border-blue-400 bg-blue-50/70 shadow-2xs'
                  : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              <div className="text-xs font-bold text-slate-900 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-blue-600" />
                <span>Audited Clients</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5 font-medium">
                {prospects.filter((p) => Boolean(p.clientAuditReport)).length} with Full Report
              </div>
            </button>

            <button
              type="button"
              onClick={() => setLeadScope('all')}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                leadScope === 'all'
                  ? 'border-slate-900 bg-slate-50 shadow-2xs'
                  : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              <div className="text-xs font-bold text-slate-900 flex items-center gap-1">
                <Layers className="w-3 h-3 text-slate-600" />
                <span>All Leads</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5 font-medium">
                {prospects.length} Total Leads
              </div>
            </button>
          </div>
        </div>

        {/* CRM Platform Selector */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700">Target CRM / Platform:</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {CRM_PLATFORMS.map((platform) => (
              <div
                key={platform.id}
                onClick={() => setSelectedPlatform(platform.id)}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  selectedPlatform === platform.id
                    ? `${platform.color} ring-2 ring-slate-900 shadow-2xs`
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">{platform.name}</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-extrabold uppercase bg-white/80 border border-slate-200 text-slate-700">
                    {platform.badge}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-tight">{platform.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Webhook URL Input if Webhook Selected */}
        {selectedPlatform === 'webhook' && (
          <div className="space-y-1.5 p-3 rounded-xl bg-purple-50/60 border border-purple-200 text-xs">
            <label className="font-bold text-purple-950">Webhook Endpoint URL (POST):</label>
            <input
              type="url"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://hooks.zapier.com/hooks/catch/..."
              className="w-full px-3 py-1.5 rounded-lg border border-purple-300 bg-white font-mono text-xs text-slate-900"
            />
          </div>
        )}

        {/* Pipeline Stage */}
        <div className="space-y-1.5 text-xs">
          <label className="font-bold text-slate-700">Destination Pipeline Stage:</label>
          <select
            value={dealStage}
            onChange={(e) => setDealStage(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-slate-900"
          >
            <option value="Cold Lead - Outreach Ready">Cold Lead - Outreach Ready</option>
            <option value="Audited Prospect - Ready to Pitch">Audited Prospect - Ready to Pitch</option>
            <option value="High-Ticket Opportunity - Priority Call">High-Ticket Opportunity - Priority Call</option>
            <option value="Inbound Pipeline - Meeting Requested">Inbound Pipeline - Meeting Requested</option>
          </select>
        </div>

        {/* Sync Logs Console */}
        {syncLogs.length > 0 && (
          <div className="space-y-1.5">
            <div className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5" />
              <span>CRM API Sync Response Log</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 text-emerald-400 font-mono text-[11px] space-y-1 max-h-32 overflow-y-auto">
              {syncLogs.map((log, i) => (
                <div key={i}>{log}</div>
              ))}
            </div>
          </div>
        )}

        {/* Success Banner */}
        {syncCompleted && (
          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <strong className="block font-bold">Successfully Synced {syncedCount} Leads!</strong>
              <span>
                Contacts and deals have been pushed to {selectedPlatform.toUpperCase()} with custom SEO metrics and revenue gap values.
              </span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleDownloadOutreachCsv}
            disabled={targetLeads.length === 0}
            className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            title="Download CSV formatted for cold email tools"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Download Cold Outreach CSV ({targetLeads.length})</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePushToCrm}
              disabled={isSyncing || targetLeads.length === 0}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSyncing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-cyan-300" />
                  <span>Syncing to {selectedPlatform.toUpperCase()}...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Push {targetLeads.length} Leads to CRM</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
