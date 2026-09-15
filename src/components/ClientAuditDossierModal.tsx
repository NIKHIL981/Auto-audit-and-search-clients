import React, { useMemo } from 'react';
import {
  X,
  Printer,
  Sparkles,
  Download,
  ExternalLink,
  Building2,
  Globe,
  MapPin,
  Phone,
  Mail,
  Star,
  FileText,
  DollarSign,
  TrendingUp,
  Bot,
  Zap,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { ClientProspect, ClientAuditReport } from '../types';
import { ClientIndividualAuditsView } from './ClientIndividualAuditsView';
import {
  getClientIndividualAuditChecks,
  downloadClientReportHtml,
} from '../utils/clientAuditChecks';

interface ClientAuditDossierModalProps {
  prospect: ClientProspect;
  report?: ClientAuditReport | null;
  onClose: () => void;
  onOneClickPdf: (prospect: ClientProspect) => void;
  onNavigateToAudit?: (domain: string) => void;
}

export const ClientAuditDossierModal: React.FC<ClientAuditDossierModalProps> = ({
  prospect,
  report,
  onClose,
  onOneClickPdf,
  onNavigateToAudit,
}) => {
  const checks = useMemo(() => {
    return getClientIndividualAuditChecks(prospect, report);
  }, [prospect, report]);

  const passedCount = checks.filter((c) => c.status === 'passed').length;
  const warningCount = checks.filter((c) => c.status === 'warning').length;
  const failedCount = checks.filter((c) => c.status === 'failed').length;

  const handleDownloadStandalone = () => {
    if (report) {
      downloadClientReportHtml(report, prospect, checks);
    } else {
      // Trigger report generation & PDF
      onOneClickPdf(prospect);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-4xl w-full my-auto overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Bar */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/20 text-cyan-300 border border-cyan-400/30">
              <ShieldCheck className="w-4 h-4 text-cyan-300" />
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-wider text-cyan-300">
                Technical Audit Dossier &amp; Client Diagnostics
              </div>
              <h2 className="text-base font-black truncate max-w-md">{prospect.cname}</h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onOneClickPdf(prospect)}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-xs font-black flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
              title="1-Click Generate/View Client Report & Export PDF"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>⚡ 1-Click Client Audit PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-800">
          {/* Header Banner: Business Details & Vitals */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xl font-black text-slate-900">{prospect.cname}</h3>
                <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                  {prospect.industry}
                </span>
                {prospect.viabilityTier === 'high_ticket' && (
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    High-Ticket Client
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium">
                <a
                  href={prospect.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-blue-600 hover:underline flex items-center gap-1"
                >
                  <Globe className="w-3.5 h-3.5 text-slate-400" />
                  <span>{prospect.domain}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <span>&bull;</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {prospect.location}
                </span>
                {prospect.contact?.phone && (
                  <>
                    <span>&bull;</span>
                    <a
                      href={`tel:${prospect.contact.phone}`}
                      className="font-mono text-slate-700 hover:text-blue-600 flex items-center gap-1 font-bold"
                    >
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      {prospect.contact.phone}
                    </a>
                  </>
                )}
                {prospect.contact?.email && (
                  <>
                    <span>&bull;</span>
                    <a
                      href={`mailto:${prospect.contact.email}`}
                      className="font-mono text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      {prospect.contact.email}
                    </a>
                  </>
                )}
              </div>
            </div>

            {/* Score Pill */}
            <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shrink-0">
              <div className="text-center px-2">
                <div className="text-[10px] font-extrabold uppercase text-slate-400">SEO Health</div>
                <div className="text-2xl font-black text-slate-900">
                  {prospect.seoHealthScore || 50}/100
                </div>
              </div>
              <div className="w-px h-8 bg-slate-200" />
              <div className="text-center px-2">
                <div className="text-[10px] font-extrabold uppercase text-slate-400">Potential ROI</div>
                <div className="text-2xl font-black text-purple-700">
                  {prospect.potentialRoiScore ?? 85}/100
                </div>
              </div>
            </div>
          </div>

          {/* Individual Checks Summary Bar */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50/60 border border-blue-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800">Diagnostic Verdict:</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-black">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                {passedCount} Passed
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-black">
                <AlertTriangle className="w-3 h-3 text-amber-600" />
                {warningCount} Warnings
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 font-black">
                <AlertTriangle className="w-3 h-3 text-rose-600" />
                {failedCount} Action Required
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadStandalone}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-blue-300 text-blue-800 font-bold text-[11px] hover:bg-blue-50 transition-colors cursor-pointer"
                title="Download standalone interactive client HTML audit"
              >
                <Download className="w-3 h-3 text-blue-600" />
                <span>Download Report HTML/PDF</span>
              </button>
            </div>
          </div>

          {/* 12 Individual Technical Audits List */}
          <div className="space-y-3">
            <ClientIndividualAuditsView
              prospect={prospect}
              report={report}
              defaultExpanded={false}
            />
          </div>

          {/* Revenue Loss Breakdown */}
          <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span>Financial Impact &amp; Opportunity Loss Math</span>
              </h4>
              <span className="text-xs font-bold text-amber-800">
                Losing calls to: {prospect.outrankingCompetitor || 'Local Page 1 Leaders'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center text-xs">
              <div className="p-3 bg-white rounded-xl border border-amber-200">
                <div className="text-[10px] font-bold text-slate-500 uppercase">Estimated Monthly Loss</div>
                <div className="text-lg font-black text-rose-600 mt-0.5">
                  {prospect.estMonthlyRevenueGap || '$25,000 - $60,000 / mo'}
                </div>
                <div className="text-[10px] text-slate-400">Deflected to competitors</div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-amber-200">
                <div className="text-[10px] font-bold text-slate-500 uppercase">Missed Customer Inquiries</div>
                <div className="text-lg font-black text-rose-600 mt-0.5">
                  ~{prospect.estimatedLostMonthlyLeads || 15} calls / month
                </div>
                <div className="text-[10px] text-slate-400">High-intent searchers</div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-amber-200">
                <div className="text-[10px] font-bold text-slate-500 uppercase">Recommended Retainer</div>
                <div className="text-lg font-black text-emerald-700 mt-0.5">
                  {prospect.clientBudgetEstimate || '$2,000 - $4,500 / mo'}
                </div>
                <div className="text-[10px] text-slate-400">Agency growth program</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          {onNavigateToAudit && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onNavigateToAudit(prospect.domain);
              }}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <span>Launch Deep Multi-Page Crawler in Suite &rarr;</span>
            </button>
          )}

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => onOneClickPdf(prospect)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-xs font-black flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Open 1-Click Client Audit PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
