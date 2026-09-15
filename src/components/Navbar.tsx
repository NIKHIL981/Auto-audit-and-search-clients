import React, { useState, useEffect } from 'react';
import {
  Globe,
  Sparkles,
  Search,
  Download,
  History,
  GitCompare,
  FileText,
  FileSpreadsheet,
  Printer,
  ChevronDown,
  Loader2,
  RefreshCw,
  Sliders,
  MapPin,
  BookOpen,
  Users,
} from 'lucide-react';
import { AuditReport } from '../types';

interface NavbarProps {
  currentUrl: string;
  onAudit: (url: string, maxPages: number) => void;
  isLoading: boolean;
  historyCount: number;
  onOpenHistory: () => void;
  onOpenCompare: () => void;
  onOpenGlossary?: () => void;
  onExportJson: () => void;
  onExportCsv: () => void;
  onPrint: () => void;
  onOpenBrandedPdfGenerator?: () => void;
  activeReport: AuditReport | null;
  activeModule?: 'audit' | 'prospector' | 'clients';
  onSelectModule?: (module: 'audit' | 'prospector' | 'clients') => void;
  onToggleAssistant?: () => void;
  isAssistantOpen?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUrl,
  onAudit,
  isLoading,
  historyCount,
  onOpenHistory,
  onOpenCompare,
  onOpenGlossary,
  onExportJson,
  onExportCsv,
  onPrint,
  onOpenBrandedPdfGenerator,
  activeReport,
  activeModule = 'audit',
  onSelectModule,
  onToggleAssistant,
  isAssistantOpen,
}) => {
  const [inputUrl, setInputUrl] = useState(currentUrl || '');
  const [crawlLimit, setCrawlLimit] = useState<number>(50);
  const [showExportMenu, setShowExportMenu] = useState(false);

  useEffect(() => {
    if (currentUrl) {
      setInputUrl(currentUrl);
    }
  }, [currentUrl]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputUrl.trim() && !isLoading) {
      onAudit(inputUrl.trim(), crawlLimit);
    }
  };

  const handleQuickSelect = (sampleUrl: string) => {
    setInputUrl(sampleUrl);
    onAudit(sampleUrl, crawlLimit);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md no-print shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3 sm:gap-4">
          
          {/* Brand Logo & Tagline */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-xs">
              <Sparkles className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-slate-900">
                  AuditPulse
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-wide">
                  Multi-Crawl
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Recursive Multi-Page Crawler &amp; Granular Technical SEO Engine
              </p>
            </div>
          </div>

          {/* Module Mode Switcher: Website Audit vs Places Client Prospector */}
          <div className="hidden lg:flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold shrink-0">
            <button
              type="button"
              onClick={() => onSelectModule?.('audit')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeModule === 'audit'
                  ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-blue-600" />
              <span>Site Audit</span>
            </button>
            <button
              type="button"
              onClick={() => onSelectModule?.('prospector')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeModule === 'prospector'
                  ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MapPin className="w-3.5 h-3.5 text-rose-600" />
              <span>Places Prospector</span>
            </button>
            <button
              type="button"
              id="navbar-clients-module-btn"
              onClick={() => onSelectModule?.('clients')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeModule === 'clients'
                  ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-emerald-600" />
              <span>Client CRM &amp; Pitch</span>
              <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-emerald-100 text-emerald-800 font-black tracking-tight">
                DRAFTS
              </span>
            </button>
          </div>

          {/* Center: Search & Audit Input Bar with Crawl Depth Option */}
          <form
            onSubmit={handleSubmit}
            className="flex-1 max-w-2xl mx-2 sm:mx-4 flex items-center gap-2"
          >
            <div className="relative flex-1 flex items-center">
              <div className="absolute left-3 text-slate-400 pointer-events-none flex items-center">
                <Globe className="w-4 h-4" />
              </div>
              <input
                id="navbar-url-input"
                type="text"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="Enter base domain (e.g. example.com)..."
                disabled={isLoading}
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 bg-slate-50/50 hover:bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-medium"
              />
            </div>

            {/* Crawl Limit Selector: 50, 100, 200, 500, Whole Website */}
            <div className="relative shrink-0">
              <select
                id="crawl-pages-limit-select"
                value={crawlLimit}
                onChange={(e) => setCrawlLimit(Number(e.target.value))}
                disabled={isLoading}
                title="Choose maximum pages to crawl"
                aria-label="Crawl limit"
                className="px-2.5 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer transition-colors shadow-2xs"
              >
                <option value={50}>50 pages</option>
                <option value={100}>100 pages</option>
                <option value={200}>200 pages</option>
                <option value={500}>500 pages</option>
                <option value={1000}>Whole website</option>
              </select>
            </div>

            {/* Audit Trigger Button */}
            <button
              type="submit"
              disabled={isLoading || !inputUrl.trim()}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:cursor-not-allowed shrink-0"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                  <span className="hidden sm:inline">Crawling...</span>
                </>
              ) : (
                <>
                  <Search className="w-3.5 h-3.5" />
                  <span>Crawl &amp; Audit</span>
                </>
              )}
            </button>
          </form>

          {/* Right Action Tools: Compare, History, Export */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Quick Test Sites dropdown or chips on desktop */}
            <div className="hidden lg:flex items-center gap-1 text-[11px] text-slate-500 mr-1">
              <span className="text-slate-400">Try:</span>
              <button
                type="button"
                onClick={() => handleQuickSelect('synthetix-cloud.dev')}
                className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium cursor-pointer transition-colors"
              >
                Synthetix
              </button>
              <button
                type="button"
                onClick={() => handleQuickSelect('linear.app')}
                className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium cursor-pointer transition-colors"
              >
                Linear
              </button>
            </div>

            {/* Compare Button */}
            <button
              type="button"
              onClick={onOpenCompare}
              disabled={historyCount < 2}
              title={historyCount < 2 ? 'Audit at least 2 websites to compare' : 'Compare audit results'}
              className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:pointer-events-none transition-colors shadow-2xs flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
            >
              <GitCompare className="w-4 h-4 text-slate-600" />
              <span className="hidden md:inline">Compare</span>
            </button>

            {/* History Button */}
            <button
              type="button"
              onClick={onOpenHistory}
              className="relative p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors shadow-2xs flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
            >
              <History className="w-4 h-4 text-slate-600" />
              <span className="hidden md:inline">History</span>
              {historyCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-slate-900 text-white text-[10px] font-bold">
                  {historyCount}
                </span>
              )}
            </button>

            {/* SEO Glossary / Metric Helper Button */}
            {onOpenGlossary && (
              <button
                type="button"
                onClick={onOpenGlossary}
                title="SEO Metric Knowledge Base: Learn about EEAT, Core Web Vitals, and technical signals"
                className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 transition-colors shadow-2xs flex items-center gap-1.5 text-xs font-semibold cursor-pointer group"
              >
                <BookOpen className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
                <span className="hidden lg:inline">SEO Glossary</span>
              </button>
            )}

            {/* SEO Assistant Button */}
            {onToggleAssistant && (
              <button
                type="button"
                id="header-seo-assistant-button"
                onClick={onToggleAssistant}
                title="Open context-aware SEO Assistant powered by Gemini API"
                className={`px-3 py-2 rounded-xl transition-all shadow-2xs flex items-center gap-1.5 text-xs font-bold cursor-pointer shrink-0 border ${
                  isAssistantOpen
                    ? 'bg-emerald-600 text-white border-emerald-600 ring-2 ring-emerald-400/30'
                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                }`}
              >
                <Sparkles className={`w-3.5 h-3.5 ${isAssistantOpen ? 'text-white' : 'text-emerald-600 animate-pulse'}`} />
                <span>SEO Assistant</span>
              </button>
            )}

            {/* Prominent Download PDF Button in Header */}
            <button
              type="button"
              id="header-download-pdf-button"
              onClick={() => {
                if (onOpenBrandedPdfGenerator) {
                  onOpenBrandedPdfGenerator();
                } else {
                  onPrint();
                }
              }}
              disabled={!activeReport}
              title="Open Branded PDF Template Generator for custom styling and export"
              className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 text-white disabled:text-slate-400 transition-colors shadow-2xs flex items-center gap-1.5 text-xs font-bold cursor-pointer disabled:cursor-not-allowed shrink-0 group"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300 group-hover:rotate-12 transition-transform" />
              <span className="hidden sm:inline">Branded PDF</span>
            </button>

            {/* Export Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowExportMenu(!showExportMenu)}
                disabled={!activeReport}
                className="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 transition-colors shadow-2xs flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
              >
                <Download className="w-4 h-4 text-slate-600" />
                <span className="hidden sm:inline">Export</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {showExportMenu && activeReport && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowExportMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl z-50 text-xs animate-scaleIn">
                    {onOpenBrandedPdfGenerator && (
                      <>
                        <button
                          type="button"
                          id="export-menu-branded-pdf"
                          onClick={() => {
                            onOpenBrandedPdfGenerator();
                            setShowExportMenu(false);
                          }}
                          className="w-full flex items-start gap-2.5 p-2 rounded-xl text-left bg-indigo-50/70 hover:bg-indigo-50 text-indigo-950 font-semibold cursor-pointer transition-colors border border-indigo-100"
                        >
                          <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-extrabold text-indigo-900">Branded PDF Generator</span>
                              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-indigo-200 text-indigo-800 font-extrabold">STUDIO</span>
                            </div>
                            <p className="text-[10px] text-indigo-700 font-normal mt-0.5">
                              Custom agency logo, colors &amp; executive themes
                            </p>
                          </div>
                        </button>
                        <div className="my-1 border-t border-slate-100" />
                      </>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        onExportJson();
                        setShowExportMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-50 font-medium text-left cursor-pointer"
                    >
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span>Download JSON</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onExportCsv();
                        setShowExportMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-50 font-medium text-left cursor-pointer"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                      <span>Export Issues (CSV)</span>
                    </button>
                    <div className="my-1 border-t border-slate-100" />
                    <button
                      type="button"
                      onClick={() => {
                        onPrint();
                        setShowExportMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-50 font-medium text-left cursor-pointer"
                    >
                      <Printer className="w-4 h-4 text-purple-600" />
                      <span>Quick Print Report</span>
                    </button>
                  </div>
                </>
              )}
            </div>

          </div>

        </div>
      </div>
    </header>
  );
};
