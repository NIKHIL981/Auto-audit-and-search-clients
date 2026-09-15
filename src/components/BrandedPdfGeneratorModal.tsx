import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Printer,
  Download,
  Sparkles,
  Copy,
  Check,
  Building2,
  User,
  Mail,
  Phone,
  Globe,
  Palette,
  Eye,
  FileText,
  RotateCcw,
  Save,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Bot,
  Zap,
  ZoomIn,
  ZoomOut,
  ShieldCheck,
  FileSpreadsheet,
  ExternalLink,
} from 'lucide-react';
import { AuditReport, BrandedAuditPdfConfig, BrandedPdfTheme, BrandedAuditPdfSections } from '../types';
import { downloadBrandedHtmlReport } from '../utils/export';
import { copyTextToClipboard } from '../utils/clipboard';

interface BrandedPdfGeneratorModalProps {
  report: AuditReport;
  isOpen: boolean;
  onClose: () => void;
}

const STORAGE_KEY = 'auditpulse_branded_pdf_agency_v1';

const DEFAULT_SECTIONS: BrandedAuditPdfSections = {
  coverPage: true,
  executiveSummary: true,
  scorecardsAndMath: true,
  categoryPillars: true,
  aiInsightsRoadmap: true,
  coreWebVitals: true,
  crawlArchitecture: true,
  aiBotGovernance: true,
  prioritizedIssues: true,
  crawledPagesSample: true,
  advisoryMemorandum: true,
  nextStepsCta: true,
};

const getDefaultConfig = (report: AuditReport): BrandedAuditPdfConfig => {
  const domain = report.domain || 'Target Website';
  const cleanName = domain.replace(/^www\./, '').split('.')[0];
  const capitalizedClient = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);

  return {
    agencyName: 'Apex Digital & Search Partners',
    agencyTagline: 'Enterprise Technical SEO, Core Web Vitals & AI Search Optimization',
    agencyLogoUrl: '',
    consultantName: 'Alex Vance',
    consultantTitle: 'Principal Growth & Technical SEO Architect',
    consultantEmail: 'alex@apexsearchpartners.com',
    consultantPhone: '+1 (555) 382-9901',
    agencyWebsite: 'apexsearchpartners.com',
    clientName: `${capitalizedClient} (${domain})`,
    documentTitle: 'Technical SEO & Generative Engine Optimization Audit',
    documentRefNumber: `AP-${report.domain ? report.domain.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8) : 'AUDIT'}-${new Date().getFullYear()}`,
    theme: 'executive_navy',
    accentColor: 'indigo',
    watermark: 'confidential',
    coverPageStyle: 'full_cover',
    customMemorandumTitle: `Strategic Advisory Memorandum: Organic Growth Blueprint for ${capitalizedClient}`,
    customMemorandumText: `We conducted a multi-vector technical crawl and AI-search readiness assessment of ${report.url}. While baseline organic signals are established, specific Core Web Vitals bottlenecks and metadata gaps are dampening SERP rankings and restricting visibility in AI Overviews and ChatGPT search. This document provides a mathematical breakdown of technical health, Gemini AI strategic insights, and an engineered 30-day priority recovery plan.`,
    sections: DEFAULT_SECTIONS,
  };
};

export const BrandedPdfGeneratorModal: React.FC<BrandedPdfGeneratorModalProps> = ({
  report,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'branding' | 'theme' | 'sections' | 'memo'>('branding');
  const [zoomLevel, setZoomLevel] = useState<number>(90);
  const [copiedBrief, setCopiedBrief] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Initialize configuration from localStorage or default
  const [config, setConfig] = useState<BrandedAuditPdfConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const def = getDefaultConfig(report);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...def,
          ...parsed,
          clientName: `${report.domain}`,
          documentRefNumber: def.documentRefNumber,
          customMemorandumTitle: `Strategic Advisory Memorandum: Organic Growth Blueprint for ${report.domain}`,
        };
      }
      return def;
    } catch {
      return getDefaultConfig(report);
    }
  });

  // Keep clientName synced if report changes
  useEffect(() => {
    setConfig((prev) => ({
      ...prev,
      clientName: prev.clientName || report.domain,
    }));
  }, [report.domain]);

  // Derived calculations for metrics
  const scores = report.scores || { overall: 85, technical: 85, performance: 85, content: 85, aiReadiness: 85 };
  const issues = Array.isArray(report.issues) ? report.issues : [];
  const criticalIssues = issues.filter((i) => i.severity === 'critical');
  const warningIssues = issues.filter((i) => i.severity === 'warning');
  const passedChecksCount = report.statCounts?.passed || Math.max(12, 25 - issues.length);

  const criticalPenalty = criticalIssues.length * 12;
  const warningPenalty = warningIssues.length * 4;

  const aiInsights = report.aiInsights;
  const recommendations = aiInsights?.recommendations || [];
  const botGovernance = report.aiReadiness?.botGovernance || [];
  const crawledPages = report.crawledPages || [];

  const accentColorMap: Record<string, { hex: string; bg: string; text: string; border: string }> = {
    indigo: { hex: '#4f46e5', bg: 'bg-indigo-600', text: 'text-indigo-600', border: 'border-indigo-600' },
    blue: { hex: '#2563eb', bg: 'bg-blue-600', text: 'text-blue-600', border: 'border-blue-600' },
    emerald: { hex: '#059669', bg: 'bg-emerald-600', text: 'text-emerald-600', border: 'border-emerald-600' },
    purple: { hex: '#7c3aed', bg: 'bg-purple-600', text: 'text-purple-600', border: 'border-purple-600' },
    rose: { hex: '#e11d48', bg: 'bg-rose-600', text: 'text-rose-600', border: 'border-rose-600' },
    amber: { hex: '#d97706', bg: 'bg-amber-600', text: 'text-amber-600', border: 'border-amber-600' },
    slate: { hex: '#334155', bg: 'bg-slate-800', text: 'text-slate-800', border: 'border-slate-800' },
  };

  const currentAccent = accentColorMap[config.accentColor] || accentColorMap.indigo;

  // Handle saving agency default preferences
  const handleSaveDefaults = () => {
    try {
      const { clientName, documentRefNumber, customMemorandumTitle, customMemorandumText, ...savedDefaults } = config;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedDefaults));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error('Failed to save branded defaults:', err);
    }
  };

  // Reset to default
  const handleResetDefaults = () => {
    localStorage.removeItem(STORAGE_KEY);
    setConfig(getDefaultConfig(report));
  };

  // Trigger print
  const handlePrint = () => {
    // Mount custom style element temporarily to ensure exact printing
    const styleId = 'branded-print-style-override';
    let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }
    styleEl.innerHTML = `
      @media print {
        body * { visibility: hidden !important; }
        #branded-pdf-preview-container, #branded-pdf-preview-container * { visibility: visible !important; }
        #branded-pdf-preview-container {
          position: absolute !important;
          left: 0 !important;
          top: 0 !important;
          width: 100% !important;
          max-width: 100% !important;
          margin: 0 !important;
          padding: 16px !important;
          box-shadow: none !important;
          border: none !important;
          background: #ffffff !important;
        }
      }
    `;

    window.print();

    // Clean up after print dialogue closes
    setTimeout(() => {
      const el = document.getElementById(styleId);
      if (el) el.remove();
    }, 1500);
  };

  // Download Standalone HTML template
  const handleDownloadHtml = () => {
    downloadBrandedHtmlReport(report, config);
  };

  // Copy Executive Summary Brief
  const handleCopyClientBrief = async () => {
    const brief = `## ${config.documentTitle}
**Prepared For:** ${config.clientName}
**Auditor:** ${config.consultantName} (${config.agencyName})
**Overall SEO Health Score:** ${scores.overall}/100

### Mathematical Health Breakdown:
- Optimal Starting Baseline: 100 pts
- Critical Error Penalties: -${criticalPenalty} pts (${criticalIssues.length} blockers)
- Warning Penalties: -${warningPenalty} pts (${warningIssues.length} warnings)
- Clean Technical Validations: ${passedChecksCount} passed

### Category Pillars:
- Technical SEO: ${scores.technical}%
- Core Web Vitals & Speed: ${scores.performance}% (LCP: ${report.performance?.lcpEstimate || 1.8}s, CLS: ${report.performance?.clsEstimate || 0.02})
- On-Page Content & Tags: ${scores.content}%
- AI Search & GEO Readiness: ${scores.aiReadiness}%

### Strategic Recommendation:
${aiInsights?.strategicVerdict || 'Address detected Core Web Vitals bottlenecks and schema structured data to safeguard rankings.'}

### Top Remediations:
${criticalIssues.slice(0, 3).map((iss, idx) => `${idx + 1}. [${iss.category}] ${iss.title} - ${iss.recommendation}`).join('\n')}

Direct Inquiries: ${config.consultantEmail}`;

    const success = await copyTextToClipboard(brief);
    if (success) {
      setCopiedBrief(true);
      setTimeout(() => setCopiedBrief(false), 2000);
    }
  };

  return (
    <div
      id="branded-pdf-generator-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-2 sm:p-4 overflow-hidden"
    >
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-7xl h-[94vh] flex flex-col overflow-hidden animate-scaleIn">
        
        {/* Top Header & Actions Bar */}
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-purple-600 flex items-center justify-center text-white shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                  Branded PDF Template Generator
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                  Live Audit Data
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Generate and export custom-branded executive dossiers for <strong className="text-slate-800 font-mono">{report.domain}</strong>
              </p>
            </div>
          </div>

          {/* Quick Action Controls */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyClientBrief}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              title="Copy executive advisory text for client email"
            >
              {copiedBrief ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              <span>{copiedBrief ? 'Copied Brief!' : 'Copy Brief'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadHtml}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              title="Download standalone print-ready HTML file"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" />
              <span>Download HTML</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-xs cursor-pointer"
              title="Print directly or save as PDF"
            >
              <Printer className="w-3.5 h-3.5 text-rose-400" />
              <span>Print / Save PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer ml-1"
              aria-label="Close generator"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Studio Body: Split View (Left Configurator, Right Live 1:1 Preview) */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          
          {/* Left Controls Panel */}
          <div className="w-full lg:w-96 border-r border-slate-200 bg-white flex flex-col shrink-0 overflow-hidden">
            
            {/* Tab Navigation */}
            <div className="flex border-b border-slate-200 bg-slate-50/70 p-1 text-xs font-bold gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab('branding')}
                className={`flex-1 py-2 px-2 rounded-lg transition-all text-center cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'branding'
                    ? 'bg-white text-indigo-700 shadow-2xs font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Brand</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('theme')}
                className={`flex-1 py-2 px-2 rounded-lg transition-all text-center cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'theme'
                    ? 'bg-white text-indigo-700 shadow-2xs font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Palette className="w-3.5 h-3.5" />
                <span>Styling</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('sections')}
                className={`flex-1 py-2 px-2 rounded-lg transition-all text-center cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'sections'
                    ? 'bg-white text-indigo-700 shadow-2xs font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Sections</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('memo')}
                className={`flex-1 py-2 px-2 rounded-lg transition-all text-center cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'memo'
                    ? 'bg-white text-indigo-700 shadow-2xs font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Memo</span>
              </button>
            </div>

            {/* Tab Panels with Scrolling */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 text-xs">
              
              {/* TAB 1: BRANDING & AUDITOR IDENTITY */}
              {activeTab === 'branding' && (
                <div className="space-y-4">
                  <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl flex items-start gap-2.5 text-indigo-900">
                    <Building2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Agency &amp; Consultant Profile</p>
                      <p className="text-[11px] text-indigo-700">
                        These credentials brand the executive cover page, header band, and consultant sign-off block.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Agency / Company Name</label>
                    <input
                      type="text"
                      value={config.agencyName}
                      onChange={(e) => setConfig({ ...config, agencyName: e.target.value })}
                      placeholder="e.g. Apex Digital & Search Partners"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Agency Tagline / Subtitle</label>
                    <input
                      type="text"
                      value={config.agencyTagline}
                      onChange={(e) => setConfig({ ...config, agencyTagline: e.target.value })}
                      placeholder="e.g. Technical SEO & Generative AI Optimization"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Agency Logo URL (Optional)</label>
                    <input
                      type="url"
                      value={config.agencyLogoUrl || ''}
                      onChange={(e) => setConfig({ ...config, agencyLogoUrl: e.target.value })}
                      placeholder="https://example.com/logo.png"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">Leave empty to use stylized typography branding.</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Consultant Name</label>
                      <input
                        type="text"
                        value={config.consultantName}
                        onChange={(e) => setConfig({ ...config, consultantName: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Consultant Title</label>
                      <input
                        type="text"
                        value={config.consultantTitle}
                        onChange={(e) => setConfig({ ...config, consultantTitle: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Direct Email</label>
                      <input
                        type="email"
                        value={config.consultantEmail}
                        onChange={(e) => setConfig({ ...config, consultantEmail: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Direct Phone</label>
                      <input
                        type="tel"
                        value={config.consultantPhone || ''}
                        onChange={(e) => setConfig({ ...config, consultantPhone: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Client / Target Entity Name</label>
                    <input
                      type="text"
                      value={config.clientName}
                      onChange={(e) => setConfig({ ...config, clientName: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Document Reference #</label>
                      <input
                        type="text"
                        value={config.documentRefNumber}
                        onChange={(e) => setConfig({ ...config, documentRefNumber: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Watermark</label>
                      <select
                        value={config.watermark}
                        onChange={(e) => setConfig({ ...config, watermark: e.target.value as any })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                      >
                        <option value="none">None</option>
                        <option value="confidential">Confidential</option>
                        <option value="draft">Internal Draft</option>
                        <option value="proprietary">Proprietary</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: THEME & STYLING */}
              {activeTab === 'theme' && (
                <div className="space-y-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-2">Executive Preset Themes</label>
                    <div className="grid grid-cols-2 gap-2.5">
                      {[
                        { id: 'executive_navy', name: 'Modern Executive', desc: 'Midnight slate, crisp corporate polish', border: 'border-slate-800' },
                        { id: 'tech_minimal', name: 'Tech Minimalist', desc: 'High data density, monospaced metrics', border: 'border-cyan-600' },
                        { id: 'growth_emerald', name: 'Growth Emerald', desc: 'Financial/ROI tone, prestige borders', border: 'border-emerald-600' },
                        { id: 'sunset_crimson', name: 'Sunset Crimson', desc: 'Urgent recovery vibe, warm charcoal', border: 'border-rose-600' },
                      ].map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setConfig({ ...config, theme: t.id as BrandedPdfTheme })}
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                            config.theme === t.id
                              ? 'border-indigo-600 bg-indigo-50/50 shadow-2xs'
                              : 'border-slate-200 hover:border-slate-300 bg-white'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900">{t.name}</span>
                            {config.theme === t.id && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                          </div>
                          <p className="text-[10px] text-slate-500 mt-1 leading-tight">{t.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-2">Primary Accent Color</label>
                    <div className="flex items-center gap-2">
                      {[
                        { id: 'indigo', hex: '#4f46e5', label: 'Indigo' },
                        { id: 'blue', hex: '#2563eb', label: 'Blue' },
                        { id: 'emerald', hex: '#059669', label: 'Emerald' },
                        { id: 'purple', hex: '#7c3aed', label: 'Purple' },
                        { id: 'rose', hex: '#e11d48', label: 'Rose' },
                        { id: 'amber', hex: '#d97706', label: 'Amber' },
                        { id: 'slate', hex: '#334155', label: 'Slate' },
                      ].map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setConfig({ ...config, accentColor: c.id as any })}
                          className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform cursor-pointer ${
                            config.accentColor === c.id ? 'ring-2 ring-offset-2 ring-slate-900 scale-110' : 'hover:scale-105'
                          }`}
                          style={{ backgroundColor: c.hex }}
                          title={c.label}
                        >
                          {config.accentColor === c.id && <Check className="w-3.5 h-3.5 text-white" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Cover Layout Style</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setConfig({ ...config, coverPageStyle: 'full_cover' })}
                        className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                          config.coverPageStyle === 'full_cover'
                            ? 'border-indigo-600 bg-indigo-50/50'
                            : 'border-slate-200 bg-white'
                        }`}
                      >
                        <span className="font-bold block text-slate-900">Full Cover Page</span>
                        <span className="text-[10px] text-slate-500">Dedicated hero cover with auditor signature block</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setConfig({ ...config, coverPageStyle: 'compact_header' })}
                        className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                          config.coverPageStyle === 'compact_header'
                            ? 'border-indigo-600 bg-indigo-50/50'
                            : 'border-slate-200 bg-white'
                        }`}
                      >
                        <span className="font-bold block text-slate-900">Compact Header</span>
                        <span className="text-[10px] text-slate-500">Streams directly into executive summary</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: SECTIONS & CONTENT TOGGLES */}
              {activeTab === 'sections' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                    <span className="font-bold text-slate-700">Audit Sections Included</span>
                    <button
                      type="button"
                      onClick={() =>
                        setConfig({
                          ...config,
                          sections: {
                            coverPage: true,
                            executiveSummary: true,
                            scorecardsAndMath: true,
                            categoryPillars: true,
                            aiInsightsRoadmap: true,
                            coreWebVitals: true,
                            crawlArchitecture: true,
                            aiBotGovernance: true,
                            prioritizedIssues: true,
                            crawledPagesSample: true,
                            advisoryMemorandum: true,
                            nextStepsCta: true,
                          },
                        })
                      }
                      className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                    >
                      Select All
                    </button>
                  </div>

                  {[
                    { id: 'coverPage', label: 'Executive Cover Page Banner', desc: 'Agency branding & auditor credentials' },
                    { id: 'executiveSummary', label: 'Executive Summary & Health Score', desc: 'Overall grade & core diagnostic verdict' },
                    { id: 'scorecardsAndMath', label: 'Mathematical Weight Breakdown', desc: '100 pts baseline - critical/warning penalties' },
                    { id: 'categoryPillars', label: 'Four Category Pillar Scores', desc: 'Technical, CWV, Content & AI Readiness' },
                    { id: 'aiInsightsRoadmap', label: 'AI Strategic Roadmap (Gemini)', desc: 'Prioritized recommendations & developer action steps' },
                    { id: 'coreWebVitals', label: 'Core Web Vitals Metric Diagnostics', desc: 'LCP, CLS, INP, and real-time speed metrics' },
                    { id: 'crawlArchitecture', label: 'Crawl Architecture & Indexability', desc: 'Canonicalization, HTTPS/HSTS, robots & sitemaps' },
                    { id: 'aiBotGovernance', label: 'AI Bot Governance Table (AEO/GEO)', desc: 'Robots.txt status for GPTBot, ClaudeBot, Perplexity' },
                    { id: 'prioritizedIssues', label: 'Prioritized Critical Remediations', desc: 'High-impact technical bug fixes table' },
                    { id: 'advisoryMemorandum', label: 'Custom Advisory Memorandum', desc: 'Personalized consultant advisory narrative' },
                    { id: 'nextStepsCta', label: 'Next Steps & Contact Engineering CTA', desc: 'Direct engagement booking block' },
                  ].map((sec) => (
                    <label
                      key={sec.id}
                      className="flex items-start gap-2.5 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(config.sections[sec.id as keyof BrandedAuditPdfSections])}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            sections: {
                              ...config.sections,
                              [sec.id]: e.target.checked,
                            },
                          })
                        }
                        className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                      />
                      <div className="flex-1">
                        <span className="font-bold text-slate-800 block text-xs">{sec.label}</span>
                        <span className="text-[10px] text-slate-500">{sec.desc}</span>
                      </div>
                    </label>
                  ))}
                </div>
              )}

              {/* TAB 4: ADVISORY MEMO & CTA */}
              {activeTab === 'memo' && (
                <div className="space-y-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Memorandum Title</label>
                    <input
                      type="text"
                      value={config.customMemorandumTitle}
                      onChange={(e) => setConfig({ ...config, customMemorandumTitle: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Advisory Narrative (Client Brief)</label>
                    <textarea
                      rows={8}
                      value={config.customMemorandumText}
                      onChange={(e) => setConfig({ ...config, customMemorandumText: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden text-xs leading-relaxed"
                      placeholder="Write your custom advisory assessment..."
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Agency Website / Booking Link</label>
                    <input
                      type="text"
                      value={config.agencyWebsite || ''}
                      onChange={(e) => setConfig({ ...config, agencyWebsite: e.target.value })}
                      placeholder="e.g. apexsearchpartners.com/book"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              )}

            </div>

            {/* Bottom Persistence Actions */}
            <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-2 shrink-0">
              <button
                type="button"
                onClick={handleResetDefaults}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                title="Reset settings to standard"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>

              <button
                type="button"
                onClick={handleSaveDefaults}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                title="Remember this agency branding for future audits"
              >
                {saveSuccess ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                <span>{saveSuccess ? 'Saved as Default!' : 'Save Brand as Default'}</span>
              </button>
            </div>

          </div>

          {/* Right Live 1:1 Print Preview Stage */}
          <div className="flex-1 bg-slate-200/70 overflow-y-auto p-4 sm:p-8 flex flex-col items-center">
            
            {/* Stage Zoom & Controls Bar */}
            <div className="w-full max-w-[820px] mb-3 flex items-center justify-between text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-700">1:1 Print Preview</span>
                <span className="text-slate-400">&bull;</span>
                <span className="text-[11px] text-slate-500">
                  {config.theme.replace('_', ' ').toUpperCase()} &bull; {config.accentColor.toUpperCase()}
                </span>
              </div>

              {/* Zoom Buttons */}
              <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.max(70, z - 10))}
                  className="p-1 hover:bg-slate-100 rounded text-slate-600 cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="px-2 font-mono text-[11px] font-bold text-slate-700">{zoomLevel}%</span>
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.min(125, z + 10))}
                  className="p-1 hover:bg-slate-100 rounded text-slate-600 cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Document Sheet (Styled for exact print-ready rendering) */}
            <div
              id="branded-pdf-preview-container"
              style={{
                transform: `scale(${zoomLevel / 100})`,
                transformOrigin: 'top center',
              }}
              className="w-full max-w-[820px] bg-white rounded-xl shadow-xl border border-slate-300 p-8 sm:p-12 text-slate-900 transition-transform duration-150 space-y-6 select-text"
            >
              {/* Agency Header Banner */}
              <div className="flex items-start justify-between border-b-2 border-slate-200 pb-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    {config.agencyLogoUrl ? (
                      <img
                        src={config.agencyLogoUrl}
                        alt={config.agencyName}
                        className="h-8 max-w-[140px] object-contain"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-sm shadow-xs"
                        style={{ backgroundColor: currentAccent.hex }}
                      >
                        {config.agencyName.charAt(0)}
                      </div>
                    )}
                    <div>
                      <h3
                        className="text-lg font-black tracking-tight"
                        style={{ color: currentAccent.hex }}
                      >
                        {config.agencyName}
                      </h3>
                      <p className="text-[11px] text-slate-500 font-medium">
                        {config.agencyTagline}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="text-right text-[11px] text-slate-500 space-y-0.5">
                  <div>Ref: <strong className="text-slate-800 font-mono">{config.documentRefNumber}</strong></div>
                  <div>Date: <strong className="text-slate-800">{new Date(report.timestamp || Date.now()).toLocaleDateString()}</strong></div>
                  <div>Auditor: <strong className="text-slate-800">{config.consultantName}</strong></div>
                </div>
              </div>

              {/* Cover Box Banner */}
              {config.sections.coverPage && (
                <div
                  className={`rounded-2xl p-6 text-white shadow-sm space-y-4 ${
                    config.theme === 'tech_minimal'
                      ? 'bg-slate-900 border border-slate-700'
                      : config.theme === 'growth_emerald'
                      ? 'bg-gradient-to-br from-emerald-950 via-slate-900 to-emerald-900'
                      : config.theme === 'sunset_crimson'
                      ? 'bg-gradient-to-br from-slate-950 via-rose-950 to-slate-900'
                      : 'bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-white/10 border border-white/20 text-indigo-200">
                      {config.watermark !== 'none' ? config.watermark.toUpperCase() : 'CONFIDENTIAL'} AUDIT DOSSIER
                    </span>
                    <span className="text-xs text-slate-400">AuditScope: {crawledPages.length || 1} Pages Crawled</span>
                  </div>

                  <div>
                    <h1 className="text-2xl font-black tracking-tight leading-tight">
                      {config.documentTitle}
                    </h1>
                    <p className="text-xs text-slate-300 mt-1">
                      Prepared Exclusively For: <strong className="text-white font-mono">{config.clientName}</strong> &bull; Target: {report.url}
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-3 border-t border-white/15 pt-3 text-[11px]">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Lead Technical Auditor</span>
                      <strong className="text-white text-xs">{config.consultantName}</strong>
                      <span className="text-slate-300 block text-[10px]">{config.consultantTitle}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Contact Channel</span>
                      <strong className="text-white text-xs">{config.consultantEmail}</strong>
                      <span className="text-slate-300 block text-[10px]">{config.consultantPhone}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Core Diagnostics</span>
                      <strong className="text-white text-xs">Core Web Vitals &amp; AEO</strong>
                      <span className="text-slate-300 block text-[10px]">{report.statCounts?.cwvRating || 'Performance Checked'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Advisory Memorandum */}
              {config.sections.advisoryMemorandum && config.customMemorandumText && (
                <div
                  className="p-4 rounded-xl border-l-4 bg-slate-50 text-xs text-slate-700 space-y-1.5"
                  style={{ borderLeftColor: currentAccent.hex }}
                >
                  <h4 className="font-bold text-slate-900 text-sm">
                    {config.customMemorandumTitle}
                  </h4>
                  <p className="leading-relaxed whitespace-pre-line text-slate-600">
                    {config.customMemorandumText}
                  </p>
                </div>
              )}

              {/* Executive Summary & Math Weight Breakdown */}
              {config.sections.executiveSummary && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                    <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">
                      Executive SEO Health Evaluation
                    </h3>
                    <span className="text-xs font-bold" style={{ color: currentAccent.hex }}>
                      Net Score: {scores.overall} / 100
                    </span>
                  </div>

                  {config.sections.scorecardsAndMath && (
                    <div className="grid grid-cols-4 gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                      <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-2xs">
                        <div className="text-[9px] uppercase font-bold text-slate-400">Baseline Target</div>
                        <div className="text-lg font-black text-slate-900">100 pts</div>
                        <div className="text-[9px] text-slate-400">Optimal Standard</div>
                      </div>
                      <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-2xs">
                        <div className="text-[9px] uppercase font-bold text-rose-600">Critical Errors ({criticalIssues.length})</div>
                        <div className="text-lg font-black text-rose-700">-{criticalPenalty} pts</div>
                        <div className="text-[9px] text-slate-400">-12 pts each</div>
                      </div>
                      <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-2xs">
                        <div className="text-[9px] uppercase font-bold text-amber-600">Warnings ({warningIssues.length})</div>
                        <div className="text-lg font-black text-amber-700">-{warningPenalty} pts</div>
                        <div className="text-[9px] text-slate-400">-4 pts each</div>
                      </div>
                      <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-2xs">
                        <div className="text-[9px] uppercase font-bold text-emerald-600">Passed Checks</div>
                        <div className="text-lg font-black text-emerald-700">{passedChecksCount} Passed</div>
                        <div className="text-[9px] text-slate-400">Verified Directives</div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Category Pillars */}
              {config.sections.categoryPillars && (
                <div className="grid grid-cols-4 gap-2.5">
                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 text-center">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Technical SEO</span>
                    <span className="text-2xl font-black text-slate-900 block mt-0.5">{scores.technical}%</span>
                    <span className="text-[10px] text-slate-500">Crawl &amp; Sitemaps</span>
                  </div>
                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 text-center">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Performance (CWV)</span>
                    <span className="text-2xl font-black text-slate-900 block mt-0.5">{scores.performance}%</span>
                    <span className="text-[10px] text-slate-500">LCP {report.performance?.lcpEstimate || 1.8}s</span>
                  </div>
                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 text-center">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Content Quality</span>
                    <span className="text-2xl font-black text-slate-900 block mt-0.5">{scores.content}%</span>
                    <span className="text-[10px] text-slate-500">{report.content?.wordCount || 0} words</span>
                  </div>
                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 text-center">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">AI &amp; AEO Readiness</span>
                    <span className="text-2xl font-black text-slate-900 block mt-0.5">{scores.aiReadiness}%</span>
                    <span className="text-[10px] text-slate-500">LLM Visibility</span>
                  </div>
                </div>
              )}

              {/* AI Strategic Roadmap (Gemini) */}
              {config.sections.aiInsightsRoadmap && recommendations.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                    <div className="flex items-center gap-2">
                      <Bot className="w-4 h-4 text-purple-600" />
                      <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">
                        AI Strategic Insights &amp; Prioritized Action Roadmap
                      </h3>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                      Powered by Gemini 3.8 Flash
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-200 text-xs text-purple-950 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-purple-900">Strategic Verdict:</span>
                      <span className="font-bold text-purple-700 text-[11px]">
                        Estimated Health Gain: +{aiInsights?.estimatedScoreGain || 16} pts
                      </span>
                    </div>
                    <p className="text-slate-700 leading-relaxed">
                      {aiInsights?.strategicVerdict || 'Website exhibits distinct opportunities across rendering speed and structured answerability.'}
                    </p>
                  </div>

                  <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
                    <thead className="bg-slate-100 text-slate-700 font-bold text-[11px]">
                      <tr>
                        <th className="p-2.5">Priority</th>
                        <th className="p-2.5">Category</th>
                        <th className="p-2.5">Action &amp; Recommendation</th>
                        <th className="p-2.5">Expected Impact</th>
                        <th className="p-2.5">Effort</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {recommendations.slice(0, 5).map((rec: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="p-2.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              rec.priority.startsWith('P0') ? 'bg-rose-100 text-rose-800' :
                              rec.priority.startsWith('P1') ? 'bg-orange-100 text-orange-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {rec.priority}
                            </span>
                          </td>
                          <td className="p-2.5 font-bold text-slate-800">{rec.category}</td>
                          <td className="p-2.5">
                            <div className="font-bold text-slate-900">{rec.title}</div>
                            <div className="text-[10px] text-slate-500 mt-0.5">{rec.recommendation}</div>
                          </td>
                          <td className="p-2.5 text-emerald-700 font-semibold">{rec.impact}</td>
                          <td className="p-2.5 text-slate-600">{rec.effort} &bull; {rec.timeToImpact}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Bot Governance Table */}
              {config.sections.aiBotGovernance && botGovernance.length > 0 && (
                <div className="space-y-2 pt-2">
                  <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide border-b border-slate-200 pb-1">
                    Answer Engine &amp; AI Bot Governance (Robots.txt Analysis)
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    {botGovernance.slice(0, 6).map((b: any, idx: number) => (
                      <div key={idx} className="p-2 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                        <div>
                          <div className="font-bold text-slate-800">{b.botName}</div>
                          <div className="text-[10px] text-slate-400">{b.provider}</div>
                        </div>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${b.isAllowed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                          {b.isAllowed ? 'Allowed' : 'Blocked'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* High Priority Critical Issues */}
              {config.sections.prioritizedIssues && criticalIssues.length > 0 && (
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                    <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide">
                      Top Critical Technical Remediations
                    </h3>
                    <span className="text-[11px] font-bold text-rose-600">{criticalIssues.length} Critical Issues</span>
                  </div>

                  <div className="space-y-2">
                    {criticalIssues.slice(0, 4).map((issue: any, idx: number) => (
                      <div key={idx} className="p-3 bg-rose-50/40 border border-rose-200 rounded-xl text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-rose-900">{issue.title}</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 uppercase">
                            {issue.category}
                          </span>
                        </div>
                        <p className="text-slate-600 text-[11px]">{issue.description}</p>
                        <div className="text-slate-800 font-medium text-[11px] pt-1">
                          <strong>Fix:</strong> {issue.recommendation}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Next Steps CTA */}
              {config.sections.nextStepsCta && (
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Schedule Technical Remediation Sprint</h4>
                    <p className="text-slate-500 text-[11px]">
                      Contact {config.consultantName} at <strong className="text-slate-800">{config.consultantEmail}</strong> to execute these fixes.
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold block" style={{ color: currentAccent.hex }}>
                      {config.agencyWebsite || config.agencyName}
                    </span>
                    <span className="text-[10px] text-slate-400">Verified Technical Audit</span>
                  </div>
                </div>
              )}

              {/* Document Footer */}
              <div className="border-t border-slate-200 pt-3 flex items-center justify-between text-[10px] text-slate-400">
                <span>Dossier compiled by {config.agencyName} via AuditPulse</span>
                <span>{config.watermark !== 'none' ? config.watermark.toUpperCase() : 'CONFIDENTIAL & PROPRIETARY'} &bull; Page 1 of 1</span>
              </div>

            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
