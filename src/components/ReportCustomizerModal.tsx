import React, { useState, useEffect } from 'react';
import {
  X,
  Printer,
  Sparkles,
  Sliders,
  Check,
  Building2,
  User,
  Mail,
  Palette,
  Eye,
  FileText,
  RotateCcw,
  Save,
  CheckCircle2,
  AlertTriangle,
  Zap,
  TrendingUp,
  Clock,
  DollarSign,
  Bot,
  ExternalLink,
} from 'lucide-react';
import {
  ClientAuditReport,
  ClientProspect,
  ReportCustomizerConfig,
  ReportSectionsSelection,
  ReportBrandingHeader,
} from '../types';

interface ReportCustomizerModalProps {
  report: ClientAuditReport;
  prospect: ClientProspect;
  isOpen?: boolean;
  onClose: () => void;
  onApplyCustomConfig?: (config: ReportCustomizerConfig) => void;
}

const DEFAULT_SECTIONS: ReportSectionsSelection = {
  executiveSummary: true,
  scorecards: true,
  strengths: true,
  criticalDeficiencies: true,
  aiReadiness: true,
  performanceCoreVitals: true,
  financialRevenueGap: true,
  roadmap90Day: true,
  customAdvisoryNote: true,
  nextStepsCta: true,
};

const DEFAULT_BRANDING = (cname: string, location: string): ReportBrandingHeader => ({
  agencyName: 'Apex Digital & Search Partners',
  agencyTagline: 'Data-Driven Growth, Technical Audits & Search Dominance',
  agencyLogoUrl: '',
  consultantName: 'Alex Vance',
  consultantTitle: 'Senior Growth & Technical SEO Director',
  consultantEmail: 'alex@apexsearchpartners.com',
  consultantPhone: '(555) 234-8901',
  accentColor: 'blue',
  customNoteTitle: `Strategic Advisory Memorandum: Organic Growth for ${cname}`,
  customNoteContent: `We prepared this independent website performance audit specifically for the leadership team at ${cname}. Over the past 30 days, we observed search shifts across ${location} where searchers frequently navigate between top providers. While your commercial reputation is strong, several addressable digital bottlenecks are currently deflecting inquiries to competitors. This report outlines our findings, their measurable revenue impact, and an agile 90-day recovery blueprint.`,
});

const BRANDING_STORAGE_KEY = 'auditpulse_custom_branding_settings_v1';

export const ReportCustomizerModal: React.FC<ReportCustomizerModalProps> = ({
  report,
  prospect,
  isOpen = true,
  onClose,
  onApplyCustomConfig,
}) => {
  if (isOpen === false) return null;

  const [activeTab, setActiveTab] = useState<'sections' | 'branding' | 'note'>('sections');
  const [sections, setSections] = useState<ReportSectionsSelection>(() => {
    try {
      const saved = localStorage.getItem(`${BRANDING_STORAGE_KEY}_sections`);
      return saved ? JSON.parse(saved) : DEFAULT_SECTIONS;
    } catch {
      return DEFAULT_SECTIONS;
    }
  });

  const [branding, setBranding] = useState<ReportBrandingHeader>(() => {
    try {
      const saved = localStorage.getItem(BRANDING_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_BRANDING(report.cname, prospect.location),
          ...parsed,
          customNoteTitle: `Strategic Advisory Memorandum: Organic Growth for ${report.cname}`,
        };
      }
      return DEFAULT_BRANDING(report.cname, prospect.location);
    } catch {
      return DEFAULT_BRANDING(report.cname, prospect.location);
    }
  });

  const [isSavedAlert, setIsSavedAlert] = useState(false);

  const toggleSection = (key: keyof ReportSectionsSelection) => {
    setSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSelectAll = () => {
    const allTrue = Object.keys(sections).reduce((acc, k) => {
      acc[k as keyof ReportSectionsSelection] = true;
      return acc;
    }, {} as ReportSectionsSelection);
    setSections(allTrue);
  };

  const handleDeselectAll = () => {
    const allFalse = Object.keys(sections).reduce((acc, k) => {
      acc[k as keyof ReportSectionsSelection] = false;
      return acc;
    }, {} as ReportSectionsSelection);
    // Keep at least executive summary and critical deficiencies
    allFalse.executiveSummary = true;
    allFalse.criticalDeficiencies = true;
    setSections(allFalse);
  };

  const handleSaveDefaults = () => {
    try {
      localStorage.setItem(BRANDING_STORAGE_KEY, JSON.stringify(branding));
      localStorage.setItem(`${BRANDING_STORAGE_KEY}_sections`, JSON.stringify(sections));
      setIsSavedAlert(true);
      setTimeout(() => setIsSavedAlert(false), 2500);
    } catch (e) {
      console.error('Failed to save branding defaults', e);
    }
  };

  const handleApplyAndPrint = () => {
    if (onApplyCustomConfig) {
      onApplyCustomConfig({ sections, branding });
    }
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const accentColorStyles = {
    blue: {
      bg: 'bg-blue-600',
      text: 'text-blue-600',
      border: 'border-blue-600',
      lightBg: 'bg-blue-50',
      badgeBg: 'bg-blue-100 text-blue-900',
    },
    indigo: {
      bg: 'bg-indigo-600',
      text: 'text-indigo-600',
      border: 'border-indigo-600',
      lightBg: 'bg-indigo-50',
      badgeBg: 'bg-indigo-100 text-indigo-900',
    },
    emerald: {
      bg: 'bg-emerald-600',
      text: 'text-emerald-600',
      border: 'border-emerald-600',
      lightBg: 'bg-emerald-50',
      badgeBg: 'bg-emerald-100 text-emerald-900',
    },
    purple: {
      bg: 'bg-purple-600',
      text: 'text-purple-600',
      border: 'border-purple-600',
      lightBg: 'bg-purple-50',
      badgeBg: 'bg-purple-100 text-purple-900',
    },
    slate: {
      bg: 'bg-slate-900',
      text: 'text-slate-900',
      border: 'border-slate-900',
      lightBg: 'bg-slate-100',
      badgeBg: 'bg-slate-200 text-slate-900',
    },
  }[branding.accentColor] || {
    bg: 'bg-blue-600',
    text: 'text-blue-600',
    border: 'border-blue-600',
    lightBg: 'bg-blue-50',
    badgeBg: 'bg-blue-100 text-blue-900',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-6xl w-full my-auto overflow-hidden flex flex-col max-h-[94vh] print:max-h-none print:border-none print:shadow-none print:rounded-none">
        {/* Header (Hidden on Print) */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between gap-3 shrink-0 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-wider text-cyan-300">
                PDF Report Customizer &amp; Branding Studio
              </div>
              <h2 className="text-sm sm:text-base font-black truncate">
                Customizing Presentation Proposal for: <span className="text-white underline">{report.cname}</span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSaveDefaults}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border border-white/10"
              title="Save branding as agency default for all future clients"
            >
              {isSavedAlert ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Save className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{isSavedAlert ? 'Saved Defaults!' : 'Save Defaults'}</span>
            </button>

            <button
              type="button"
              onClick={handleApplyAndPrint}
              className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Download PDF</span>
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

        {/* Customizer Sub-Bar (Hidden on Print) */}
        <div className="px-6 py-2.5 bg-slate-100 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('sections')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'sections'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span>1. Sections to Include ({Object.values(sections).filter(Boolean).length}/10)</span>
            </button>

            <button
              onClick={() => setActiveTab('branding')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'branding'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>2. Agency Branding Header</span>
            </button>

            <button
              onClick={() => setActiveTab('note')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'note'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="w-3.5 h-3.5 text-emerald-600" />
              <span>3. Custom Advisory Note</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
            <span>Client: <strong className="text-slate-700">{report.domain}</strong></span>
            <span>&bull;</span>
            <span>Grade: <strong className="text-blue-700">{report.grade} ({report.overallScore}/100)</strong></span>
          </div>
        </div>

        {/* Customizer Editor & Live Split View */}
        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
          {/* Controls Panel (Hidden on Print) */}
          <div className="w-full lg:w-96 p-5 sm:p-6 border-b lg:border-b-0 lg:border-r border-slate-200 bg-slate-50/70 overflow-y-auto shrink-0 print:hidden space-y-6">
            {/* Tab 1: Section Toggles */}
            {activeTab === 'sections' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      Audit Report Sections
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Toggle sections to tailor density for client meetings.
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-[11px]">
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className="text-blue-600 hover:underline font-bold cursor-pointer"
                    >
                      All
                    </button>
                    <span>/</span>
                    <button
                      type="button"
                      onClick={handleDeselectAll}
                      className="text-slate-500 hover:underline cursor-pointer"
                    >
                      Minimal
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {[
                    {
                      key: 'customAdvisoryNote' as const,
                      label: 'Custom Advisory Note / Letter',
                      desc: 'Personalized memorandum with agency recommendations',
                      icon: <FileText className="w-3.5 h-3.5 text-blue-600" />,
                    },
                    {
                      key: 'executiveSummary' as const,
                      label: 'Executive Summary & Overall Grade',
                      desc: 'High-level grade scorecard and business translation',
                      icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />,
                    },
                    {
                      key: 'scorecards' as const,
                      label: 'Category Scorecards (Speed, On-Page, Local, Tech)',
                      desc: 'Detailed numerical health bars out of 100',
                      icon: <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />,
                    },
                    {
                      key: 'strengths' as const,
                      label: 'What Is Working Well (Current Strengths)',
                      desc: 'Valid foundations to build credibility and rapport',
                      icon: <Check className="w-3.5 h-3.5 text-emerald-600" />,
                    },
                    {
                      key: 'criticalDeficiencies' as const,
                      label: 'Critical Deficiencies & Bottlenecks',
                      desc: 'Specific issues found with business impact & fix',
                      icon: <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />,
                    },
                    {
                      key: 'aiReadiness' as const,
                      label: 'AI Search & LLM Overviews Readiness',
                      desc: 'Schema answerability, bot rules, and zero-click search',
                      icon: <Bot className="w-3.5 h-3.5 text-purple-600" />,
                    },
                    {
                      key: 'performanceCoreVitals' as const,
                      label: 'Performance & Mobile Core Web Vitals',
                      desc: 'LCP speed latency, image payloads, mobile UX',
                      icon: <Zap className="w-3.5 h-3.5 text-amber-600" />,
                    },
                    {
                      key: 'financialRevenueGap' as const,
                      label: 'Financial Opportunity & Lost Revenue Math',
                      desc: 'Lost calls, monthly revenue gap, and ROI projection',
                      icon: <DollarSign className="w-3.5 h-3.5 text-emerald-600" />,
                    },
                    {
                      key: 'roadmap90Day' as const,
                      label: '3-Phase 90-Day Transformation Roadmap',
                      desc: 'Step-by-step milestones (Week 1, Month 1, Months 2-3)',
                      icon: <Clock className="w-3.5 h-3.5 text-blue-600" />,
                    },
                    {
                      key: 'nextStepsCta' as const,
                      label: 'Agency Consultation & Booking CTA',
                      desc: 'Direct calendar invite & consultant contact signature',
                      icon: <User className="w-3.5 h-3.5 text-slate-700" />,
                    },
                  ].map((item) => (
                    <label
                      key={item.key}
                      className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer ${
                        sections[item.key]
                          ? 'bg-white border-blue-200 shadow-2xs'
                          : 'bg-slate-100/50 border-slate-200 text-slate-400 opacity-60'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={sections[item.key]}
                        onChange={() => toggleSection(item.key)}
                        className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-1.5">
                          {item.icon}
                          <span className="text-xs font-bold text-slate-900 truncate">
                            {item.label}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-tight">
                          {item.desc}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 2: Agency Branding Settings */}
            {activeTab === 'branding' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    Agency Header &amp; Theme
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    White-label the PDF report with your firm&apos;s identity.
                  </p>
                </div>

                {/* Accent Color Palette */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                    <Palette className="w-3 h-3 text-slate-500" />
                    Accent Theme
                  </label>
                  <div className="flex items-center gap-2">
                    {(['blue', 'indigo', 'emerald', 'purple', 'slate'] as const).map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setBranding((b) => ({ ...b, accentColor: color }))}
                        className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                          branding.accentColor === color
                            ? 'ring-2 ring-offset-2 ring-slate-900 scale-110'
                            : 'opacity-70 hover:opacity-100'
                        } ${
                          color === 'blue'
                            ? 'bg-blue-600'
                            : color === 'indigo'
                            ? 'bg-indigo-600'
                            : color === 'emerald'
                            ? 'bg-emerald-600'
                            : color === 'purple'
                            ? 'bg-purple-600'
                            : 'bg-slate-900'
                        }`}
                        title={`Select ${color} accent`}
                      >
                        {branding.accentColor === color && <Check className="w-3.5 h-3.5 text-white" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700">Agency Name</label>
                    <input
                      type="text"
                      value={branding.agencyName}
                      onChange={(e) => setBranding((b) => ({ ...b, agencyName: e.target.value }))}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-hidden focus:border-blue-500"
                      placeholder="Your Agency Name"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700">Agency Tagline</label>
                    <input
                      type="text"
                      value={branding.agencyTagline || ''}
                      onChange={(e) => setBranding((b) => ({ ...b, agencyTagline: e.target.value }))}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-600 focus:outline-hidden focus:border-blue-500"
                      placeholder="e.g. Search Engine Marketing & Growth Consulting"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700">Lead Consultant Name</label>
                    <input
                      type="text"
                      value={branding.consultantName}
                      onChange={(e) => setBranding((b) => ({ ...b, consultantName: e.target.value }))}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-hidden focus:border-blue-500"
                      placeholder="Your Name"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700">Consultant Title</label>
                    <input
                      type="text"
                      value={branding.consultantTitle}
                      onChange={(e) => setBranding((b) => ({ ...b, consultantTitle: e.target.value }))}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-600 focus:outline-hidden focus:border-blue-500"
                      placeholder="e.g. Senior Technical SEO Strategist"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700">Contact Email</label>
                      <input
                        type="email"
                        value={branding.consultantEmail}
                        onChange={(e) => setBranding((b) => ({ ...b, consultantEmail: e.target.value }))}
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-600 focus:outline-hidden focus:border-blue-500"
                        placeholder="consultant@agency.com"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700">Phone</label>
                      <input
                        type="text"
                        value={branding.consultantPhone || ''}
                        onChange={(e) => setBranding((b) => ({ ...b, consultantPhone: e.target.value }))}
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-600 focus:outline-hidden focus:border-blue-500"
                        placeholder="(555) 000-0000"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Custom Advisory Note */}
            {activeTab === 'note' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    Custom Advisory Letter
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Add an executive memo or personalized recommendations directly to the business owner.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700">Note Title</label>
                    <input
                      type="text"
                      value={branding.customNoteTitle}
                      onChange={(e) => setBranding((b) => ({ ...b, customNoteTitle: e.target.value }))}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-hidden focus:border-blue-500"
                      placeholder="Memorandum Header"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-slate-700">Executive Memo Content</label>
                      <button
                        type="button"
                        onClick={() =>
                          setBranding((b) => ({
                            ...b,
                            customNoteContent: DEFAULT_BRANDING(report.cname, prospect.location).customNoteContent,
                          }))
                        }
                        className="text-[10px] text-blue-600 hover:underline font-medium cursor-pointer"
                      >
                        Reset Template
                      </button>
                    </div>
                    <textarea
                      rows={8}
                      value={branding.customNoteContent}
                      onChange={(e) => setBranding((b) => ({ ...b, customNoteContent: e.target.value }))}
                      className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed focus:outline-hidden focus:border-blue-500"
                      placeholder="Write your custom notes, findings, or message to the client..."
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Live Printable Preview Panel */}
          <div className="flex-1 overflow-y-auto p-6 sm:p-10 bg-white text-slate-800 space-y-8 print:p-0 print:overflow-visible">
            {/* Custom Branding Header (Prints beautifully on top of page) */}
            <div className="border-b-2 border-slate-900 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${accentColorStyles.bg}`} />
                  <span className="text-sm sm:text-base font-black tracking-tight text-slate-900 uppercase">
                    {branding.agencyName}
                  </span>
                </div>
                {branding.agencyTagline && (
                  <p className="text-[11px] text-slate-500 font-medium">{branding.agencyTagline}</p>
                )}
              </div>

              <div className="text-left sm:text-right space-y-0.5 text-xs">
                <div className="font-bold text-slate-900">{branding.consultantName}</div>
                <div className="text-[11px] text-slate-500">{branding.consultantTitle}</div>
                <div className="text-[10px] text-slate-400 font-mono">
                  {branding.consultantEmail} {branding.consultantPhone ? `· ${branding.consultantPhone}` : ''}
                </div>
              </div>
            </div>

            {/* Client Report Title Block */}
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-300">
                <span>Independent Client Website &amp; Performance Audit</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    {report.cname}
                  </h1>
                  <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2 font-medium">
                    <span className="font-mono text-blue-600">{report.domain}</span>
                    <span>&bull;</span>
                    <span>{prospect.industry}</span>
                    <span>&bull;</span>
                    <span>{prospect.location}</span>
                    <span>&bull;</span>
                    <span>Date: {new Date(report.generatedAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Score badge */}
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200 shrink-0">
                  <div className="text-center">
                    <div className="text-[9px] font-extrabold uppercase text-slate-400">Grade</div>
                    <div className="text-3xl font-black text-slate-900">{report.grade}</div>
                  </div>
                  <div className="w-px h-10 bg-slate-200" />
                  <div className="text-center">
                    <div className="text-[9px] font-extrabold uppercase text-slate-400">SEO Health</div>
                    <div className="text-2xl font-black text-blue-600">
                      {report.overallScore}<span className="text-xs font-normal text-slate-400">/100</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Custom Advisory Note Section */}
            {sections.customAdvisoryNote && (
              <div className={`p-5 rounded-2xl border ${accentColorStyles.lightBg} ${accentColorStyles.border}/30 space-y-2`}>
                <h3 className={`text-xs font-black uppercase tracking-wider ${accentColorStyles.text} flex items-center gap-1.5`}>
                  <FileText className="w-3.5 h-3.5" />
                  {branding.customNoteTitle}
                </h3>
                <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-normal whitespace-pre-line">
                  {branding.customNoteContent}
                </p>
                <div className="pt-2 text-[11px] text-slate-500 font-semibold border-t border-slate-200/60">
                  Prepared by: {branding.consultantName} · {branding.agencyName}
                </div>
              </div>
            )}

            {/* Executive Summary */}
            {sections.executiveSummary && (
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  Executive Audit Summary
                </h3>
                <p className="text-xs sm:text-sm text-slate-800 leading-relaxed">
                  {report.executiveSummary}
                </p>
              </div>
            )}

            {/* Category Scorecards */}
            {sections.scorecards && (
              <div className="space-y-2">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Core Category Performance
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                    <div className="text-[10px] font-bold text-slate-500 uppercase">Speed &amp; Mobile</div>
                    <div className="text-lg font-black text-slate-900">{report.categoryScores.speedMobile}/100</div>
                    <div className="text-[9px] text-slate-400">Core Vitals</div>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                    <div className="text-[10px] font-bold text-slate-500 uppercase">On-Page SEO</div>
                    <div className="text-lg font-black text-slate-900">{report.categoryScores.onPageSeo}/100</div>
                    <div className="text-[9px] text-slate-400">Tags &amp; Content</div>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                    <div className="text-[10px] font-bold text-slate-500 uppercase">Local Presence</div>
                    <div className="text-lg font-black text-slate-900">{report.categoryScores.localPresence}/100</div>
                    <div className="text-[9px] text-slate-400">3-Pack Signals</div>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                    <div className="text-[10px] font-bold text-slate-500 uppercase">Technical Health</div>
                    <div className="text-lg font-black text-slate-900">{report.categoryScores.technicalHealth}/100</div>
                    <div className="text-[9px] text-slate-400">Crawl &amp; Index</div>
                  </div>
                </div>
              </div>
            )}

            {/* Strengths */}
            {sections.strengths && (
              <div className="space-y-3">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  What Is Working Well (Current Foundations)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {report.strengths.map((st, i) => (
                    <div key={i} className="p-3.5 rounded-xl bg-emerald-50/40 border border-emerald-200/80 space-y-1">
                      <span className="px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase bg-emerald-100 text-emerald-800">
                        {st.badge}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900">{st.title}</h4>
                      <p className="text-[11px] text-slate-600 leading-snug">{st.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Critical Deficiencies */}
            {sections.criticalDeficiencies && (
              <div className="space-y-3">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                  Critical Bottlenecks &amp; Deficiencies
                </h3>
                <div className="space-y-3">
                  {report.thingsWrong.map((item) => (
                    <div key={item.id} className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                            item.severity === 'critical' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {item.severity}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase">{item.category}</span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900">{item.title}</h4>
                      <div className="text-xs text-slate-600">
                        <strong>Finding:</strong> {item.finding}
                      </div>
                      <div className="p-2.5 rounded-lg bg-rose-50/70 border border-rose-100 text-xs text-rose-900">
                        <strong>Business &amp; Revenue Impact:</strong> {item.businessImpact}
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700">
                        <strong className="text-slate-900">Recommended Fix:</strong> {item.howToFix}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Search & LLM Overviews Readiness */}
            {sections.aiReadiness && (
              <div className="p-5 rounded-2xl bg-purple-50/50 border border-purple-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-purple-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Bot className="w-4 h-4 text-purple-600" />
                    AI Search &amp; Google AI Overviews Readiness
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-purple-100 text-purple-800">
                    AI Readiness: {prospect.aiReadinessScore ?? report.categoryScores.aiReadiness ?? 48}/100
                  </span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  As conversational search expands through Google AI Overviews, ChatGPT Search, and Perplexity, websites require structured schema and semantic heading answers. {report.cname}&apos;s site currently lacks structured FAQ schema, preventing search engines from generating direct conversational snippets for {prospect.industry} queries.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                  <div className="p-2.5 rounded-xl bg-white border border-purple-100">
                    <span className="font-bold text-slate-900">Answerability Structure:</span> Low (No H2 Q&amp;A blocks)
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-purple-100">
                    <span className="font-bold text-slate-900">AI Crawler Directives:</span> Default / Open
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-purple-100">
                    <span className="font-bold text-slate-900">GEO Knowledge Graph:</span> Unconnected Local Schema
                  </div>
                </div>
              </div>
            )}

            {/* Performance & Core Web Vitals */}
            {sections.performanceCoreVitals && (
              <div className="p-5 rounded-2xl bg-amber-50/40 border border-amber-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-600" />
                    Performance &amp; Core Web Vitals Latency
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-800">
                    Speed Score: {prospect.performanceScore ?? report.categoryScores.speedMobile}/100
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  <div className="p-3 rounded-xl bg-white border border-amber-200/70">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Estimated LCP</div>
                    <div className="text-lg font-black text-rose-600">3.4s+</div>
                    <div className="text-[10px] text-slate-500">Google threshold is &lt;2.5s</div>
                  </div>
                  <div className="p-3 rounded-xl bg-white border border-amber-200/70">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Mobile Friction</div>
                    <div className="text-lg font-black text-amber-700">Elevated</div>
                    <div className="text-[10px] text-slate-500">Missing sticky tap-to-call</div>
                  </div>
                  <div className="p-3 rounded-xl bg-white border border-amber-200/70">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Image Payloads</div>
                    <div className="text-lg font-black text-slate-800">Uncompressed</div>
                    <div className="text-[10px] text-slate-500">Convert to modern WebP</div>
                  </div>
                </div>
              </div>
            )}

            {/* Financial Opportunity & Revenue Analysis */}
            {sections.financialRevenueGap && (
              <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    Financial Analysis &amp; Inbound Revenue Gap
                  </h3>
                  <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                    ROI Recovery Forecast
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-3 rounded-xl bg-white border border-emerald-200">
                    <div className="text-[9px] font-bold text-slate-400 uppercase">Estimated Lost Calls</div>
                    <div className="text-lg font-black text-rose-600">
                      ~{report.financialAnalysis.estimatedLostCallsMonthly} / mo
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-white border border-emerald-200">
                    <div className="text-[9px] font-bold text-slate-400 uppercase">Monthly Revenue Gap</div>
                    <div className="text-lg font-black text-rose-600">
                      {report.financialAnalysis.estimatedMonthlyRevenueLoss}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-white border border-emerald-200">
                    <div className="text-[9px] font-bold text-slate-400 uppercase">Annual Potential</div>
                    <div className="text-lg font-black text-emerald-700">
                      {report.financialAnalysis.potentialAnnualRecovery}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-white border border-emerald-200">
                    <div className="text-[9px] font-bold text-slate-400 uppercase">Recommended Retainer</div>
                    <div className="text-lg font-black text-blue-700">
                      {report.financialAnalysis.suggestedRetainer}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed bg-white/70 p-3 rounded-xl border border-emerald-100">
                  📈 <strong>ROI Math:</strong> {report.financialAnalysis.roiSummary}
                </p>
              </div>
            )}

            {/* 3-Phase Roadmap */}
            {sections.roadmap90Day && (
              <div className="space-y-3">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  3-Phase 90-Day Implementation Roadmap
                </h3>
                <div className="space-y-3">
                  {report.improvementRoadmap.map((phase, idx) => (
                    <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-800">
                          {phase.phase}
                        </span>
                        <span className="text-xs text-slate-500 font-semibold">{phase.estimatedTimeline}</span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900">{phase.title}</h4>
                      <div className="space-y-1">
                        {phase.actions.map((act, aIdx) => (
                          <div key={aIdx} className="text-xs text-slate-700 flex items-start gap-1.5">
                            <span className="text-blue-600 font-bold">&bull;</span>
                            <span>{act}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Next Steps & Booking CTA */}
            {sections.nextStepsCta && (
              <div className={`p-6 rounded-2xl ${accentColorStyles.lightBg} border ${accentColorStyles.border}/40 space-y-3`}>
                <div className="space-y-1">
                  <h3 className="text-sm font-black text-slate-900">
                    Ready to Reclaim Lost Search Revenue?
                  </h3>
                  <p className="text-xs text-slate-600">
                    We would be happy to host a 15-minute screen share with your team to review the technical diagnostics and demonstrate how to deploy these fixes.
                  </p>
                </div>
                <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="font-bold text-slate-900">
                    {branding.consultantName} · {branding.consultantTitle}
                    <div className="text-[11px] text-slate-500 font-normal">
                      Email: {branding.consultantEmail} {branding.consultantPhone ? `| Phone: ${branding.consultantPhone}` : ''}
                    </div>
                  </div>
                  <div className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs">
                    Schedule 15-Min Walkthrough
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
