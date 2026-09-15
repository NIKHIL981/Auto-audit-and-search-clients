import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Tag,
  Network,
  Link2,
  Image,
  Database,
  Gauge,
  BrainCircuit,
  ListChecks,
  AlertCircle,
  Loader2,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Layers,
  BarChart3,
  MapPin,
  Users,
} from 'lucide-react';
import { AuditReport } from './types';
import { loadAuditHistory, saveAuditReport, deleteAuditReport, clearAuditHistory, createSampleAuditReport, sanitizeReport } from './utils/storage';
import { downloadJsonReport, downloadCsvReport, triggerPrintReport } from './utils/export';
import { convertAuditToClient, saveClient } from './utils/clientStorage';
import { Navbar } from './components/Navbar';
import { ExecutiveSummary } from './components/ExecutiveSummary';
import { ClientOutreachDashboard } from './components/ClientOutreachDashboard';
import { CrawledPagesTab } from './components/CrawledPagesTab';
import { ContentAnalysisTab } from './components/ContentAnalysisTab';
import { OnPageTab } from './components/OnPageTab';
import { ArchitectureTab } from './components/ArchitectureTab';
import { LinksMediaTab } from './components/LinksMediaTab';
import { SchemaTab } from './components/SchemaTab';
import { TechnicalPerformanceTab } from './components/TechnicalPerformanceTab';
import { AiReadinessTab } from './components/AiReadinessTab';
import { IssuesAccordion } from './components/IssuesAccordion';
import { AuditHistoryModal } from './components/AuditHistoryModal';
import { CompareModal } from './components/CompareModal';
import { PrintReportView } from './components/PrintReportView';
import { ClientProspectorTab } from './components/ClientProspectorTab';
import { BrandedPdfGeneratorModal } from './components/BrandedPdfGeneratorModal';
import { SeoAssistantSidebar } from './components/SeoAssistantSidebar';
import { SeoGlossaryProvider, useSeoGlossary } from './context/TooltipContext';

export function App() {
  return (
    <SeoGlossaryProvider>
      <AppContent />
    </SeoGlossaryProvider>
  );
}

function AppContent() {
  const { openGlossary } = useSeoGlossary();
  const [report, setReport] = useState<AuditReport | null>(null);
  const [history, setHistory] = useState<AuditReport[]>([]);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [targetCrawlLimit, setTargetCrawlLimit] = useState<number>(50);
  const [error, setError] = useState<string | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [showCompareModal, setShowCompareModal] = useState<boolean>(false);
  const [showBrandedPdfModal, setShowBrandedPdfModal] = useState<boolean>(false);
  const [showAssistantSidebar, setShowAssistantSidebar] = useState<boolean>(false);
  const [assistantInitialQuery, setAssistantInitialQuery] = useState<string | undefined>(undefined);

  const handleAskAssistant = (query: string) => {
    setAssistantInitialQuery(query);
    setShowAssistantSidebar(true);
  };

  // Load audit history on initial mount
  useEffect(() => {
    const saved = loadAuditHistory();
    if (saved.length > 0) {
      setHistory(saved);
      setReport(saved[0]);
    } else {
      const sample = createSampleAuditReport();
      const updated = saveAuditReport(sample);
      setHistory(updated);
      setReport(sample);
    }
  }, []);

  const handleAudit = async (targetUrl: string, maxPages: number = 50) => {
    if (!targetUrl.trim() || isLoading) return;

    setIsLoading(true);
    setTargetCrawlLimit(maxPages);
    setError(null);

    try {
      const response = await fetch('/api/audit/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl.trim(), maxPages }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP error ${response.status}`);
      }

      const data: AuditReport = await response.json();
      const sanitized = sanitizeReport(data);
      setReport(sanitized);
      const updatedHistory = saveAuditReport(sanitized);
      setHistory(updatedHistory);
    } catch (err: any) {
      console.error('Audit execution error:', err);
      setError(err.message || 'Failed to complete website audit. Please check the URL and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteReport = (id: string) => {
    const updated = deleteAuditReport(id);
    setHistory(updated);
    if (report?.id === id) {
      setReport(updated.length > 0 ? updated[0] : null);
    }
  };

  const handleClearAllHistory = () => {
    clearAuditHistory();
    setHistory([]);
  };

  // Nav tabs including dedicated multi-page Crawled Pages directory & Content Analysis
  const navTabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    {
      id: 'client_hub',
      label: 'Client CRM & Outreach',
      icon: Users,
      badge: 'Pitch Drafts',
    },
    {
      id: 'places_prospector',
      label: 'Client Prospector',
      icon: MapPin,
      badge: 'Google Places',
    },
    {
      id: 'crawled_pages',
      label: 'Crawled Pages',
      icon: Layers,
      count: report?.crawledPages?.length || 0,
      badge: 'All Pages',
    },
    { id: 'content_analysis', label: 'Content Analysis', icon: BarChart3, badge: 'Top 20' },
    { id: 'on-page', label: 'On-Page Meta & Content', icon: Tag },
    { id: 'architecture', label: 'Architecture & Indexability', icon: Network },
    { id: 'links-nav', label: 'Links & Navigation', icon: Link2 },
    { id: 'media-assets', label: 'Media & Assets', icon: Image },
    { id: 'schema', label: 'Schema & Structured Data', icon: Database },
    { id: 'technical', label: 'Technical & Performance', icon: Gauge },
    { id: 'ai_readiness', label: 'AI Readiness (GEO)', icon: BrainCircuit, badge: 'AI' },
    {
      id: 'issues',
      label: 'Issues & Fixes Checklist',
      icon: ListChecks,
      count: report?.issues?.length,
      badge:
        (report?.issues?.filter((i) => i.isCompleted).length || 0) > 0
          ? `${report?.issues?.filter((i) => i.isCompleted).length} Resolved`
          : undefined,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-blue-500/20 selection:text-blue-900">
      
      {/* Top Navbar */}
      <Navbar
        currentUrl={report?.url || ''}
        onAudit={handleAudit}
        isLoading={isLoading}
        historyCount={history.length}
        onOpenHistory={() => setShowHistoryModal(true)}
        onOpenCompare={() => setShowCompareModal(true)}
        onOpenGlossary={() => openGlossary()}
        onExportJson={() => report && downloadJsonReport(report)}
        onExportCsv={() => report && downloadCsvReport(report)}
        onPrint={() => triggerPrintReport()}
        onOpenBrandedPdfGenerator={() => setShowBrandedPdfModal(true)}
        activeReport={report}
        activeModule={
          activeTab === 'places_prospector'
            ? 'prospector'
            : activeTab === 'client_hub'
            ? 'clients'
            : 'audit'
        }
        onSelectModule={(mode) => {
          if (mode === 'prospector') {
            setActiveTab('places_prospector');
          } else if (mode === 'clients') {
            setActiveTab('client_hub');
          } else {
            setActiveTab('overview');
          }
        }}
        onToggleAssistant={() => setShowAssistantSidebar((prev) => !prev)}
        isAssistantOpen={showAssistantSidebar}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 no-print">
        
        {/* Error Notification */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              className="px-3 py-1 rounded-lg bg-white border border-rose-200 hover:bg-rose-100 text-rose-800 font-semibold cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Loading Overlay / State */}
        {isLoading && (
          <div className="my-12 p-12 rounded-2xl bg-white border border-slate-200 text-center space-y-4 shadow-xs">
            <div className="inline-flex p-3 rounded-2xl bg-blue-50 border border-blue-100 animate-bounce">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Crawling Website (Target Scope: Up to {targetCrawlLimit === 1000 ? 'Whole Website' : `${targetCrawlLimit} pages`})...
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                Recursively discovering internal links, inspecting HTML meta tags, heading hierarchies, images, schemas, and extracting per-element diagnostic errors across pages.
              </p>
            </div>
          </div>
        )}

        {/* Audit Content View */}
        {!isLoading && (report || activeTab === 'places_prospector' || activeTab === 'client_hub') && (
          <div className="space-y-6">
            
            {/* Primary Clean Navigation Tab Bar (Stripe/Vercel Style) */}
            <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-white border border-slate-200 overflow-x-auto scrollbar-none shadow-2xs">
              {navTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    id={`tab-${tab.id}`}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      isActive
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                    <span>{tab.label}</span>
                    {tab.badge && (
                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                        isActive ? 'bg-blue-500 text-white' : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}>
                        {tab.badge}
                      </span>
                    )}
                    {tab.count !== undefined && (
                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                        isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Active Tab View */}
            <div>
              {activeTab === 'client_hub' && (
                <ClientOutreachDashboard
                  activeReport={report}
                  auditHistory={history}
                  onNavigateToAudit={(targetDomain) => {
                    if (targetDomain) {
                      handleAudit(targetDomain);
                    }
                    setActiveTab('overview');
                  }}
                  onAuditDomain={(targetDomain) => {
                    setActiveTab('overview');
                    handleAudit(targetDomain);
                  }}
                />
              )}
              {activeTab === 'places_prospector' && (
                <ClientProspectorTab
                  onAuditDomain={(targetDomain) => {
                    setActiveTab('overview');
                    handleAudit(targetDomain);
                  }}
                />
              )}
              {report && activeTab === 'overview' && (
                <ExecutiveSummary
                  report={report}
                  history={history}
                  onNavigateToTab={(t) => setActiveTab(t)}
                  onConvertToClient={() => {
                    const newClient = convertAuditToClient(report);
                    saveClient(newClient);
                    setActiveTab('client_hub');
                  }}
                  onOpenBrandedPdfGenerator={() => setShowBrandedPdfModal(true)}
                  onSaveSnapshot={() => {
                    const snap: AuditReport = {
                      ...report,
                      id: `audit_snap_${Date.now()}`,
                      timestamp: Date.now(),
                    };
                    const updated = saveAuditReport(snap);
                    setHistory(updated);
                    setReport(snap);
                  }}
                  onSelectReport={(selected) => setReport(selected)}
                />
              )}
              {report && activeTab === 'crawled_pages' && (
                <CrawledPagesTab
                  report={report}
                  onUpdatePages={(updatedPages) => {
                    setReport((prev) => (prev ? { ...prev, crawledPages: updatedPages } : null));
                  }}
                />
              )}
              {report && activeTab === 'content_analysis' && (
                <ContentAnalysisTab
                  report={report}
                  onUpdateReportSentiment={(sentiment) => {
                    setReport((prev) => (prev ? { ...prev, contentSentiment: sentiment } : null));
                  }}
                />
              )}
              {report && activeTab === 'on-page' && <OnPageTab report={report} />}
              {report && activeTab === 'architecture' && <ArchitectureTab report={report} />}
              {report && activeTab === 'links-nav' && <LinksMediaTab report={report} subCategory="links" />}
              {report && activeTab === 'media-assets' && <LinksMediaTab report={report} subCategory="media" />}
              {report && activeTab === 'schema' && <SchemaTab report={report} />}
              {report && activeTab === 'technical' && (
                <TechnicalPerformanceTab
                  report={report}
                  onAskAssistant={handleAskAssistant}
                />
              )}
              {report && activeTab === 'ai_readiness' && <AiReadinessTab report={report} />}
              {report && activeTab === 'issues' && (
                <IssuesAccordion
                  issues={report.issues}
                  report={report}
                  onUpdateReport={(updatedReport) => {
                    setReport(updatedReport);
                    saveAuditReport(updatedReport);
                    setHistory(loadAuditHistory());
                  }}
                />
              )}
            </div>

          </div>
        )}

        {/* Empty State */}
        {!isLoading && !report && activeTab !== 'places_prospector' && activeTab !== 'client_hub' && (
          <div className="my-16 p-12 text-center rounded-2xl bg-white border border-slate-200 max-w-lg mx-auto space-y-4 shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto text-blue-600">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Enter a Website to Begin Audit</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Analyze SEO health, Core Web Vitals, and generative search AI readiness for any public domain or landing page.
            </p>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500 no-print mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-medium text-slate-700">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>AuditPulse &bull; Technical SEO &amp; AI Engine Optimization Suite</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Live Crawl Verified &bull; Real-Time DOM Inspection &bull; Gemini Semantic Analysis
          </div>
        </div>
      </footer>

      {/* Audit History Drawer / Modal */}
      <AuditHistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        reports={history}
        activeReportId={report?.id || null}
        onSelectReport={(r) => setReport(r)}
        onDeleteReport={handleDeleteReport}
        onClearAll={handleClearAllHistory}
        onRerunAudit={(url) => handleAudit(url)}
        onOpenCompare={() => setShowCompareModal(true)}
      />

      {/* Comparison Modal */}
      <CompareModal
        isOpen={showCompareModal}
        onClose={() => setShowCompareModal(false)}
        reports={history}
      />

      {/* Print View for PDF generation */}
      {report && <PrintReportView report={report} />}

      {/* Branded PDF Template Generator Studio Modal */}
      {report && (
        <BrandedPdfGeneratorModal
          isOpen={showBrandedPdfModal}
          onClose={() => setShowBrandedPdfModal(false)}
          report={report}
        />
      )}

      {/* Floating SEO Assistant Trigger Button */}
      {report && (
        <button
          type="button"
          id="floating-seo-assistant-trigger"
          onClick={() => setShowAssistantSidebar((prev) => !prev)}
          title="Open SEO Assistant: Ask specific questions about this audit"
          className="fixed bottom-6 right-6 z-40 px-4 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-xl hover:shadow-2xl flex items-center gap-2 text-xs font-bold transition-all duration-200 hover:scale-105 cursor-pointer group no-print"
        >
          <Sparkles className="w-4 h-4 text-emerald-200 group-hover:rotate-12 transition-transform" />
          <span>Ask SEO Assistant</span>
          <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping" />
        </button>
      )}

      {/* SEO Assistant Sidebar Drawer */}
      {report && (
        <SeoAssistantSidebar
          isOpen={showAssistantSidebar}
          onClose={() => setShowAssistantSidebar(false)}
          report={report}
          initialQuery={assistantInitialQuery}
          onClearInitialQuery={() => setAssistantInitialQuery(undefined)}
        />
      )}

    </div>
  );
}

export default App;
