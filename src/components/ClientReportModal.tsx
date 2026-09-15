import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Printer,
  Copy,
  Check,
  ExternalLink,
  Shield,
  Zap,
  AlertTriangle,
  TrendingUp,
  CheckCircle2,
  Building2,
  Calendar,
  Globe,
  Phone,
  Mail,
  DollarSign,
  ArrowRight,
  FileText,
  Sparkles,
  Award,
  BarChart3,
  Clock,
  Send,
  Sliders,
  Bot,
  Download,
  ListChecks,
  Search,
  Eye,
  FileCheck,
} from 'lucide-react';
import { ClientAuditReport, ClientProspect } from '../types';
import { ReportCustomizerModal } from './ReportCustomizerModal';
import { OutreachTemplateGeneratorModal } from './OutreachTemplateGeneratorModal';
import { ClientIndividualAuditsView } from './ClientIndividualAuditsView';
import {
  getClientIndividualAuditChecks,
  downloadClientReportHtml,
} from '../utils/clientAuditChecks';

interface ClientReportModalProps {
  report: ClientAuditReport;
  prospect: ClientProspect;
  onClose: () => void;
  onAuditDomain?: (domain: string) => void;
  onRegenerate?: () => void;
  autoPrint?: boolean;
}

export const ClientReportModal: React.FC<ClientReportModalProps> = ({
  report,
  prospect,
  onClose,
  onAuditDomain,
  onRegenerate,
  autoPrint = false,
}) => {
  const [activeTab, setActiveTab] = useState<'report' | 'audits' | 'roadmap' | 'email'>('report');
  const [copied, setCopied] = useState<string | null>(null);
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [showOutreach, setShowOutreach] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const individualChecks = useMemo(() => {
    return getClientIndividualAuditChecks(prospect, report);
  }, [prospect, report]);

  const branding = useMemo(() => {
    try {
      const saved = localStorage.getItem('auditpulse_custom_branding_settings_v1');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {}
    return {
      agencyName: report.agencyBranding?.agencyName || 'Apex Search & Digital Advisory',
      agencyTagline: report.agencyBranding?.agencyTagline || 'Data-Driven Search Engine Optimization & Technical Advisory',
      consultantName: report.agencyBranding?.consultantName || 'Alex Vance',
      consultantTitle: report.agencyBranding?.consultantTitle || 'Director of Search Architecture & Client Growth',
      consultantEmail: report.agencyBranding?.consultantEmail || 'alex@apexsearchpartners.com',
      consultantPhone: report.agencyBranding?.consultantPhone || '(555) 234-8901',
    };
  }, [report.agencyBranding]);

  const advisory = useMemo(() => {
    return (
      report.advisoryNote || {
        title: `Confidential Search Performance Evaluation & Acquisition Blueprint`,
        content: `This independent technical evaluation was prepared directly for the leadership and operational team at ${report.cname}. Over recent weeks, our search intelligence tracking across ${prospect.location || 'your market'} revealed significant traffic distribution away from established providers toward competitors like ${prospect.outrankingCompetitor || 'the local market leader'} who maintain optimized mobile and local search signals. While your operational reputation is well-regarded, specific technical frictions on ${report.domain} are actively deflecting inquiries. This diagnostic details what was identified, what each item means in plain business terms, and our clear 90-day plan to recapture top search positions.`,
        auditorName: branding.consultantName || 'Alex Vance',
        auditorTitle: branding.consultantTitle || 'Director of Search Architecture',
        agencyName: branding.agencyName || 'Apex Search & Digital Advisory',
        certifiedStamp: 'Certified Technical SEO Diagnostic & Compliance Review',
      }
    );
  }, [report.advisoryNote, report.cname, report.domain, prospect.location, prospect.outrankingCompetitor, branding]);

  const serp = useMemo(() => {
    return (
      report.serpComparison || {
        current: {
          title: prospect.auditSummary?.titleTag || `${report.cname} - ${prospect.industry || 'Home'}`,
          url: report.websiteUrl,
          snippet: prospect.auditSummary?.metaDescription || `Welcome to ${report.cname}. Contact our team for services in ${prospect.location || 'our local area'}.`,
          rating: prospect.rating || 4.2,
          reviewCount: prospect.userRatingCount || 19,
          hasPhoneExtension: false,
        },
        optimized: {
          title: `${report.cname}™ | Top-Rated ${prospect.industry || 'Service'} in ${prospect.location || 'Local Area'} (24/7 Response)`,
          url: report.websiteUrl,
          snippet: `★ Top-rated ${prospect.industry || 'Specialist'} serving ${prospect.location || 'the area'}. Upfront transparent pricing, licensed technicians, and same-day response. Tap to call or book online!`,
          rating: Math.max(4.8, prospect.rating || 4.8),
          reviewCount: (prospect.userRatingCount || 24) + 42,
          phoneExtension: prospect.contact?.phone || '(555) 234-8900',
          sitelinks: ['Emergency Response', 'Pricing & Estimates', 'Verified Reviews', 'Book Inspection'],
        },
        ctrLiftEstimate: '+42% Projected Organic Click-Through Lift',
      }
    );
  }, [report.serpComparison, report.cname, report.websiteUrl, prospect]);

  const comp = useMemo(() => {
    return (
      report.competitorComparison || {
        competitorName: prospect.outrankingCompetitor || `${prospect.location || 'Metro'} Market Leader`,
        competitorScore: Math.min(96, Math.max(report.overallScore + 18, 86)),
        comparisonPoints: [
          {
            parameter: 'Mobile Page Speed (LCP)',
            clientStatus: '3.6s (Slow - Red)',
            competitorStatus: '1.2s (Fast - Green)',
            winner: 'competitor' as const,
            impact: '53% of smartphone visitors bounce before page renders, calling competitor instead.',
          },
          {
            parameter: 'Google Local 3-Pack Presence',
            clientStatus: 'Unranked / Page 2',
            competitorStatus: '#1 Local Map Pack',
            winner: 'competitor' as const,
            impact: 'Captures ~44% of all local phone calls and direction requests in the area.',
          },
          {
            parameter: 'LocalBusiness Schema Markup',
            clientStatus: 'Missing / Unconfigured',
            competitorStatus: 'Active JSON-LD Schema',
            winner: 'competitor' as const,
            impact: 'Google algorithms cannot verify exact service radius, coordinates, and operating hours.',
          },
          {
            parameter: 'Mobile Click-to-Call CTA Bar',
            clientStatus: 'Hidden / Requires Scrolling',
            competitorStatus: 'Persistent Floating Call Bar',
            winner: 'competitor' as const,
            impact: 'Friction in locating phone number costs estimated 12–18 direct calls per month.',
          },
          {
            parameter: 'Review Volume & Velocity',
            clientStatus: `${prospect.userRatingCount || 24} Reviews`,
            competitorStatus: '85+ Verified Reviews',
            winner: 'competitor' as const,
            impact: 'Google prioritizes businesses with steady, recent review frequency in ranking algorithms.',
          },
        ],
        takeaway: `${prospect.outrankingCompetitor || 'The leading competitor'} does not possess better craftsmanship or service; they simply present fewer digital barriers to high-intent searchers. Resolving these 5 friction points allows ${report.cname} to capture lucrative inbound leads.`,
      }
    );
  }, [report.competitorComparison, report.overallScore, report.cname, prospect]);

  const commercialTiers = useMemo(() => {
    return (
      report.commercialTiers || [
        {
          name: '30-Day Critical Recovery Sprint',
          tagline: 'Rapid technical remediation to stop lead leakage and correct Google indexing.',
          price: '$1,450 One-Time',
          deliverables: [
            'Complete Core Web Vitals speed overhaul (sub-2.0s mobile load target)',
            'Deploy Google-validated JSON-LD LocalBusiness and geo-coordinate schema',
            'Refactor title tags and high-CTR meta descriptions across top 10 commercial pages',
            'Deploy persistent mobile click-to-call navigation bar to capture smartphone callers',
            'Fix robots.txt directives and submit XML sitemaps to Google Search Console',
          ],
          timeline: '14 – 21 Days',
          isRecommended: false,
        },
        {
          name: 'Local 3-Pack Supremacy Retainer',
          tagline: 'Comprehensive organic customer acquisition engine to capture and hold top 3 Google positions.',
          price: report.financialAnalysis.suggestedRetainer || '$2,500 / mo',
          deliverables: [
            'Everything in 30-Day Critical Recovery Sprint',
            'Audit, correct, and synchronize 50+ local citations (Google, Apple Maps, Bing, Yelp)',
            'Deploy localized high-intent service area landing pages targeting top surrounding zip codes',
            'Automated 5-star customer review collection system via SMS/Email triggers',
            'Competitor backlink gap acquisition and local digital PR outreach',
            'Monthly executive KPI dashboard tracking inbound phone calls, keyword ranks, and ROI',
          ],
          timeline: 'Monthly Retainer (Cancel Anytime, No Lock-In)',
          isRecommended: true,
        },
        {
          name: 'Regional Market Dominance & AI Search',
          tagline: 'Multi-location expansion and Generative Engine Optimization (GEO) for category leadership.',
          price: '$4,800 – $6,500 / mo',
          deliverables: [
            'Everything included in Local 3-Pack Supremacy Retainer',
            'Multi-city and regional service area page architecture across entire metropolitan area',
            'AEO/GEO optimization for Google AI Overviews, Perplexity, and ChatGPT citations',
            'Dedicated monthly conversion rate optimization (CRO) split testing',
            'Direct priority Slack channel and bi-weekly strategy briefings with Lead SEO Architect',
          ],
          timeline: 'Quarterly Growth Partnership',
          isRecommended: false,
        },
      ]
    );
  }, [report.commercialTiers, report.financialAnalysis.suggestedRetainer]);

  useEffect(() => {
    if (autoPrint) {
      const timer = setTimeout(() => {
        window.print();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [autoPrint]);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadStandalone = () => {
    downloadClientReportHtml(report, prospect, individualChecks);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 2500);
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-700 bg-emerald-50 border-emerald-300';
    if (score >= 70) return 'text-blue-700 bg-blue-50 border-blue-300';
    if (score >= 50) return 'text-amber-700 bg-amber-50 border-amber-300';
    return 'text-rose-700 bg-rose-50 border-rose-300';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto print:p-0 print:bg-white">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-4xl w-full my-auto overflow-hidden flex flex-col max-h-[92vh] print:max-h-none print:border-none print:shadow-none print:rounded-none">
        {/* Modal Top Bar (Hidden on Print) */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between gap-3 shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-500/20 text-cyan-300 border border-cyan-400/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
                Client-Ready Performance &amp; SEO Audit
              </div>
              <h2 className="text-base font-black truncate max-w-md">{report.cname}</h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-xs font-black flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
              title="1-Click Print or Save as PDF"
            >
              <Printer className="w-3.5 h-3.5 text-cyan-300" />
              <span>⚡ 1-Click Print / Save PDF</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadStandalone}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border border-white/10"
              title="Download standalone client HTML file that opens in any browser or email"
            >
              <Download className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden sm:inline">
                {downloadSuccess ? 'Downloaded!' : 'Download Client Report'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setShowCustomizer(true)}
              className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border border-amber-400/30"
              title="Customize PDF sections, agency branding, and notes"
            >
              <Sliders className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden md:inline">Customize Report</span>
            </button>

            <button
              type="button"
              onClick={() => setShowOutreach(true)}
              className="px-3 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border border-purple-400/30"
              title="Draft personalized cold email and outreach pitches"
            >
              <Bot className="w-3.5 h-3.5 text-purple-300" />
              <span className="hidden md:inline">AI Outreach Pitch</span>
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

        {/* Tab Navigation (Hidden on Print) */}
        <div className="px-6 py-2.5 bg-slate-100/80 border-b border-slate-200 flex items-center gap-2 shrink-0 print:hidden text-xs overflow-x-auto">
          <button
            onClick={() => setActiveTab('report')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'report' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📋 Full Audit Proposal Report
          </button>
          <button
            onClick={() => setActiveTab('audits')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'audits' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🔍 All 12 Individual Technical Audits
          </button>
          <button
            onClick={() => setActiveTab('roadmap')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'roadmap' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🗺️ Improvement Roadmap (3 Phases)
          </button>
          <button
            onClick={() => setActiveTab('email')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'email' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ✉️ Outreach Email Template
          </button>
        </div>

        {/* Scrollable Report Content */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-8 print:p-0 print:overflow-visible text-slate-800">
          {/* Executive Agency Letterhead & Certified Seal */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:border-b-2 print:border-slate-800 print:rounded-none print:p-3 print:shadow-none">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-sm shrink-0">
                {branding.agencyName.charAt(0) || 'A'}
              </div>
              <div>
                <div className="text-sm font-black text-slate-900 leading-tight flex items-center gap-2">
                  <span>{branding.agencyName}</span>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                    Verified Auditor
                  </span>
                </div>
                <div className="text-xs text-slate-500 font-medium">{branding.agencyTagline}</div>
              </div>
            </div>

            <div className="text-right sm:border-l sm:border-slate-200 sm:pl-4 text-xs space-y-0.5">
              <div className="font-bold text-slate-800">{branding.consultantName}</div>
              <div className="text-[11px] text-slate-500">{branding.consultantTitle}</div>
              <div className="text-[11px] text-blue-600 font-mono flex items-center sm:justify-end gap-2">
                <span>{branding.consultantPhone}</span>
                <span>&bull;</span>
                <span>{branding.consultantEmail}</span>
              </div>
            </div>
          </div>

          {/* Cover Header Banner */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6 print:bg-white print:text-slate-900 print:border-b-2 print:border-slate-900 print:rounded-none print:shadow-none print:p-4">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/20 text-cyan-300 border border-cyan-400/30 print:text-slate-700 print:border-slate-300">
                <span>Independent Client Website &amp; Performance Audit</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight print:text-2xl">
                {report.cname}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 print:text-slate-600 font-medium">
                <span className="flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5 text-cyan-400" />
                  <a href={report.websiteUrl} target="_blank" rel="noopener noreferrer" className="hover:underline font-mono">
                    {report.domain}
                  </a>
                </span>
                <span>&bull;</span>
                <span>{prospect.industry}</span>
                <span>&bull;</span>
                <span>{prospect.location}</span>
                <span>&bull;</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {new Date(report.generatedAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Overall Score Card */}
            <div className="flex items-center gap-4 bg-white/10 p-4 rounded-2xl border border-white/10 shrink-0 print:bg-slate-50 print:border-slate-200">
              <div className="text-center">
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-cyan-300 print:text-slate-500">
                  Audit Grade
                </div>
                <div className="text-4xl font-black text-white print:text-slate-900">{report.grade}</div>
              </div>
              <div className="w-px h-12 bg-white/20 print:bg-slate-300" />
              <div className="text-center">
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-cyan-300 print:text-slate-500">
                  SEO Health Score
                </div>
                <div className="text-3xl font-black text-white print:text-slate-900">
                  {report.overallScore} <span className="text-sm font-normal text-slate-400">/ 100</span>
                </div>
              </div>
            </div>
          </div>

          {activeTab === 'report' && (
            <>
              {/* Confidential Advisory Memorandum */}
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-300/80 shadow-2xs space-y-3 print:bg-white print:border-slate-400">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-3 gap-2">
                  <div className="flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-blue-700" />
                    <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                      Confidential Advisory Memorandum
                    </span>
                  </div>
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Addressed to Leadership of {report.cname}
                  </div>
                </div>

                <h3 className="text-sm font-black text-slate-900">{advisory.title}</h3>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal whitespace-pre-line">
                  {advisory.content}
                </p>

                <div className="pt-2 flex flex-wrap items-center justify-between text-xs text-slate-500 border-t border-slate-200/80 gap-2">
                  <div>
                    Audited by: <strong className="text-slate-800">{advisory.auditorName}</strong> ({advisory.auditorTitle})
                  </div>
                  <div className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                    ✓ {advisory.certifiedStamp}
                  </div>
                </div>
              </div>

              {/* Category Scorecards (6 Key Audit Dimensions) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-1">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Speed &amp; Mobile</div>
                  <div className="text-lg font-black text-slate-900">{report.categoryScores.speedMobile}/100</div>
                  <div className="text-[9px] text-slate-400">Mobile Vitals</div>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-1">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">On-Page SEO</div>
                  <div className="text-lg font-black text-slate-900">{report.categoryScores.onPageSeo}/100</div>
                  <div className="text-[9px] text-slate-400">Titles &amp; Meta</div>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-1">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Local Presence</div>
                  <div className="text-lg font-black text-slate-900">{report.categoryScores.localPresence}/100</div>
                  <div className="text-[9px] text-slate-400">3-Pack Signals</div>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-1">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Technical Health</div>
                  <div className="text-lg font-black text-slate-900">{report.categoryScores.technicalHealth}/100</div>
                  <div className="text-[9px] text-slate-400">Crawl &amp; Index</div>
                </div>
                <div className="p-3 rounded-2xl bg-purple-50/60 border border-purple-200 text-center space-y-1">
                  <div className="text-[10px] font-bold text-purple-700 uppercase tracking-wider flex items-center justify-center gap-0.5">
                    <Bot className="w-2.5 h-2.5" />
                    <span>AI Readiness</span>
                  </div>
                  <div className="text-lg font-black text-purple-900">
                    {report.aiReadinessScore ?? prospect.aiReadinessScore ?? 65}/100
                  </div>
                  <div className="text-[9px] text-purple-600 font-medium">LLM &amp; Schema</div>
                </div>
                <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-200 text-center space-y-1">
                  <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider flex items-center justify-center gap-0.5">
                    <Zap className="w-2.5 h-2.5" />
                    <span>Performance</span>
                  </div>
                  <div className="text-lg font-black text-emerald-900">
                    {report.performanceScore ?? prospect.performanceScore ?? report.categoryScores.speedMobile ?? 70}/100
                  </div>
                  <div className="text-[9px] text-emerald-600 font-medium">Load &amp; TTFB</div>
                </div>
              </div>

              {/* Visual Google SERP Appearance Comparison (Current vs High-CTR Optimized) */}
              <div className="p-6 rounded-3xl bg-slate-900 text-white shadow-sm space-y-4 print:bg-white print:text-slate-900 print:border print:border-slate-300">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3 print:border-slate-200">
                  <div className="flex items-center gap-2">
                    <Search className="w-4 h-4 text-cyan-400 print:text-blue-600" />
                    <h3 className="text-sm font-black uppercase tracking-wider text-white print:text-slate-900">
                      Google Search Result Appearance Comparison
                    </h3>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-black bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 print:bg-blue-50 print:text-blue-800 print:border-blue-200">
                    {serp.ctrLiftEstimate}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Current Snippet */}
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2 print:bg-slate-50 print:border-slate-300">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-rose-500/20 text-rose-300 border border-rose-400/30 print:bg-rose-100 print:text-rose-800">
                        ❌ Current Search Snippet (Losing Clicks)
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono truncate">{serp.current.url}</div>
                    <div className="text-sm font-bold text-blue-400 hover:underline cursor-pointer line-clamp-1 print:text-blue-700">
                      {serp.current.title}
                    </div>
                    <div className="text-xs text-slate-300 leading-relaxed line-clamp-2 print:text-slate-600">
                      {serp.current.snippet}
                    </div>
                    <div className="text-[11px] text-rose-300/80 pt-1 print:text-rose-600">
                      ⚠️ Lacks review stars, direct phone extension, and verified schema data.
                    </div>
                  </div>

                  {/* High-CTR Optimized Snippet */}
                  <div className="p-4 rounded-2xl bg-blue-950/40 border border-blue-500/40 space-y-2 print:bg-blue-50/50 print:border-blue-300">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 print:bg-emerald-100 print:text-emerald-800">
                        ✅ High-CTR Engineered Snippet (Captures Clicks)
                      </span>
                    </div>
                    <div className="text-[11px] text-cyan-300 font-mono truncate print:text-blue-600">{serp.optimized.url}</div>
                    <div className="text-sm font-bold text-cyan-200 hover:underline cursor-pointer line-clamp-1 print:text-blue-800">
                      {serp.optimized.title}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-amber-400 font-bold">
                      <span>★ ★ ★ ★ ★</span>
                      <span className="text-slate-300 print:text-slate-700 font-medium">
                        Rating: {serp.optimized.rating} ({serp.optimized.reviewCount} reviews)
                      </span>
                      {serp.optimized.phoneExtension && (
                        <span className="text-emerald-300 print:text-emerald-700 font-mono text-[11px]">
                          &bull; Call: {serp.optimized.phoneExtension}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-200 leading-relaxed line-clamp-2 print:text-slate-700">
                      {serp.optimized.snippet}
                    </div>
                    {serp.optimized.sitelinks && serp.optimized.sitelinks.length > 0 && (
                      <div className="grid grid-cols-2 gap-1.5 pt-1.5 border-t border-white/10 print:border-blue-200">
                        {serp.optimized.sitelinks.map((link, idx) => (
                          <div key={idx} className="text-[10px] text-blue-300 print:text-blue-700 hover:underline cursor-pointer font-medium truncate">
                            &bull; {link}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Head-to-Head Competitor Steal Analysis */}
              <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-rose-600" />
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">
                      Head-to-Head Search Benchmark: {report.cname} vs. {comp.competitorName}
                    </h3>
                  </div>
                  <span className="text-xs font-bold text-slate-600">
                    Why Competitors Receive Calls First
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider font-extrabold text-[10px]">
                        <th className="py-2.5 px-3">Audit Vector</th>
                        <th className="py-2.5 px-3">{report.cname}</th>
                        <th className="py-2.5 px-3">{comp.competitorName}</th>
                        <th className="py-2.5 px-3">Commercial Revenue Impact</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {comp.comparisonPoints.map((pt, idx) => (
                        <tr key={idx} className="hover:bg-slate-100/60 transition-colors">
                          <td className="py-2.5 px-3 font-bold text-slate-900">{pt.parameter}</td>
                          <td className="py-2.5 px-3 font-medium text-rose-700 bg-rose-50/40">
                            {pt.clientStatus}
                          </td>
                          <td className="py-2.5 px-3 font-medium text-emerald-800 bg-emerald-50/40">
                            {pt.competitorStatus}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 leading-relaxed">
                            {pt.impact}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="p-3.5 rounded-xl bg-blue-50/80 border border-blue-200 text-xs text-blue-950 leading-relaxed font-normal">
                  💡 <strong>Strategic Leadership Takeaway:</strong> {comp.takeaway}
                </div>
              </div>

              {/* Executive Summary */}
              <div className="p-5 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-2">
                <h3 className="text-xs font-black text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-blue-600" />
                  Executive Audit Summary for Business Owners
                </h3>
                <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-normal">
                  {report.executiveSummary}
                </p>
              </div>

              {/* Section 1: What is Working Well (Strengths) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>What Is Working Well (Current Strengths)</span>
                  </h3>
                  <span className="text-[11px] text-slate-500">Foundations in place</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {report.strengths.map((st, i) => (
                    <div key={i} className="p-4 rounded-2xl bg-emerald-50/30 border border-emerald-200 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-emerald-100 text-emerald-800">
                          {st.badge}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900">{st.title}</h4>
                      <p className="text-[11px] text-slate-600 leading-relaxed">{st.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 1.5: All 12 Individual Technical Audits */}
              <div className="space-y-3 p-5 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <ListChecks className="w-4 h-4 text-indigo-600" />
                    <span>Individual Technical Audit Diagnostic Checklist</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setActiveTab('audits')}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                  >
                    View All 12 Tests In Detail &rarr;
                  </button>
                </div>
                <ClientIndividualAuditsView
                  prospect={prospect}
                  report={report}
                  compact={true}
                  defaultExpanded={false}
                />
              </div>

              {/* Section 2: Things That Are Wrong (Critical Deficiencies) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>Critical Deficiencies &amp; What Is Wrong on Website</span>
                  </h3>
                  <span className="text-[11px] text-rose-600 font-bold">
                    {report.thingsWrong.length} Issues Identified
                  </span>
                </div>
                <div className="space-y-3">
                  {report.thingsWrong.map((item) => (
                    <div
                      key={item.id}
                      className={`p-4 rounded-2xl bg-white border shadow-2xs space-y-2 hover:border-slate-300 transition-colors ${
                        item.severity === 'critical'
                          ? 'border-l-4 border-l-rose-500 border-slate-200'
                          : 'border-l-4 border-l-amber-500 border-slate-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase ${
                                item.severity === 'critical'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {item.severity === 'critical' ? '🚨 Critical Flaw' : '⚠️ Search Penalty'}
                            </span>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                              {item.category}
                            </span>
                          </div>
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900">{item.title}</h4>
                        </div>
                      </div>

                      <div className="text-xs text-slate-600">
                        <strong className="text-slate-800">What We Detected:</strong> {item.finding}
                      </div>

                      <div className="p-2.5 rounded-xl bg-rose-50/80 border border-rose-100 text-xs text-rose-900 leading-relaxed font-medium">
                        <strong>Why This Loses You Customers &amp; Revenue:</strong> {item.businessImpact}
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed">
                        <strong className="text-slate-900">How We Fix This:</strong> {item.howToFix}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 3: Financial Opportunity & Revenue Impact */}
              <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-500/10 via-amber-50 to-orange-50 border border-amber-200 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    <span>Financial Opportunity &amp; Missed Revenue Analysis</span>
                  </h3>
                  <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                    Revenue Gap Breakdown
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-white rounded-2xl border border-amber-200/80">
                    <div className="text-[10px] font-bold text-slate-500 uppercase">Lost Inbound Calls</div>
                    <div className="text-lg font-black text-rose-600">
                      ~{report.financialAnalysis.estimatedLostCallsMonthly} calls/mo
                    </div>
                    <div className="text-[10px] text-slate-400">High-intent searchers</div>
                  </div>
                  <div className="p-3 bg-white rounded-2xl border border-amber-200/80">
                    <div className="text-[10px] font-bold text-slate-500 uppercase">Monthly Revenue Gap</div>
                    <div className="text-lg font-black text-rose-600">
                      {report.financialAnalysis.estimatedMonthlyRevenueLoss}
                    </div>
                    <div className="text-[10px] text-slate-400">Lost to competitors</div>
                  </div>
                  <div className="p-3 bg-white rounded-2xl border border-amber-200/80">
                    <div className="text-[10px] font-bold text-slate-500 uppercase">Annual Potential</div>
                    <div className="text-lg font-black text-emerald-700">
                      {report.financialAnalysis.potentialAnnualRecovery}
                    </div>
                    <div className="text-[10px] text-slate-400">With Top-3 ranking</div>
                  </div>
                  <div className="p-3 bg-white rounded-2xl border border-amber-200/80">
                    <div className="text-[10px] font-bold text-slate-500 uppercase">Recommended Retainer</div>
                    <div className="text-lg font-black text-blue-700">
                      {report.financialAnalysis.suggestedRetainer}
                    </div>
                    <div className="text-[10px] text-slate-400">Full-service SEO growth</div>
                  </div>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed bg-white/70 p-3 rounded-xl border border-amber-200/60">
                  📈 <strong>ROI Guarantee Math:</strong> {report.financialAnalysis.roiSummary}
                </p>
              </div>

              {/* Section 4: Commercial Engagement Proposals & Service Tiers */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-blue-600" />
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">
                      Recommended Remediation &amp; Growth Engagement Tiers
                    </h3>
                  </div>
                  <span className="text-xs font-bold text-slate-500">
                    Transparent Investment &amp; Deliverables
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {commercialTiers.map((tier, idx) => (
                    <div
                      key={idx}
                      className={`p-5 rounded-2xl flex flex-col justify-between transition-all ${
                        tier.isRecommended
                          ? 'bg-blue-50/70 border-2 border-blue-600 shadow-md relative'
                          : 'bg-white border border-slate-200 shadow-2xs'
                      }`}
                    >
                      {tier.isRecommended && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-600 text-white shadow-xs">
                          ⭐ Recommended Strategy
                        </div>
                      )}

                      <div className="space-y-3">
                        <div className="space-y-1">
                          <h4 className="text-sm font-black text-slate-900">{tier.name}</h4>
                          <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                            {tier.tagline}
                          </p>
                        </div>

                        <div className="py-2 border-y border-slate-200/80">
                          <div className="text-xl font-black text-slate-900">{tier.price}</div>
                          <div className="text-[10px] text-slate-500 font-medium">
                            Estimated Duration: {tier.timeline}
                          </div>
                        </div>

                        <div className="space-y-1.5 pt-1">
                          <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                            Included Deliverables:
                          </div>
                          <ul className="space-y-1.5">
                            {tier.deliverables.map((del, dIdx) => (
                              <li
                                key={dIdx}
                                className="text-[11px] text-slate-700 flex items-start gap-1.5 leading-snug"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                <span>{del}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="pt-4 mt-4 border-t border-slate-200">
                        <a
                          href={`mailto:${branding.consultantEmail}?subject=${encodeURIComponent(
                            `Selecting ${tier.name} for ${report.cname}`
                          )}&body=${encodeURIComponent(
                            `Hi ${branding.consultantName},\n\nWe reviewed the independent audit for ${report.cname} (${report.domain}) and would like to move forward with the ${tier.name} (${tier.price}).\n\nPlease reply with the onboarding paperwork and calendar times for a brief kickoff.\n\nBest regards,\nLeadership Team\n${report.cname}`
                          )}`}
                          className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                            tier.isRecommended
                              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                              : 'bg-slate-900 hover:bg-slate-800 text-white'
                          }`}
                        >
                          <span>Select This Plan &rarr;</span>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Executive Walkthrough & Proposal Acceptance CTA Card */}
              <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6 print:border print:border-slate-800 print:bg-white print:text-slate-900">
                <div className="space-y-2 max-w-xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 print:text-emerald-800 print:bg-emerald-50">
                    <span>Ready for Deployment</span>
                  </div>
                  <h3 className="text-xl font-black tracking-tight">
                    Schedule a 15-Minute Screen Walkthrough &amp; Claim Territory
                  </h3>
                  <p className="text-xs text-slate-300 print:text-slate-600 leading-relaxed">
                    We only partner with one {prospect.industry || 'service'} provider per local territory ({prospect.location || 'market'}) to protect competitive exclusivity. Let's walk through your raw server data, live competitor search logs, and answer questions.
                  </p>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 print:text-slate-700 font-mono">
                    <span>Direct: {branding.consultantPhone}</span>
                    <span>&bull;</span>
                    <span>{branding.consultantEmail}</span>
                  </div>
                </div>

                <div className="shrink-0 flex flex-col sm:flex-row gap-2 print:hidden">
                  <a
                    href={`mailto:${branding.consultantEmail}?subject=${encodeURIComponent(
                      `Schedule 15-Min SEO Walkthrough for ${report.cname}`
                    )}&body=${encodeURIComponent(
                      `Hi ${branding.consultantName},\n\nWe received and reviewed your audit report for ${report.cname} (${report.domain}).\n\nWe would like to schedule a 15-minute screen share to review the findings and next steps.\n\nBest regards,\n${report.cname}`
                    )}`}
                    className="px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                  >
                    <Mail className="w-4 h-4" />
                    <span>Accept &amp; Book Walkthrough</span>
                  </a>
                  <button
                    type="button"
                    onClick={handleDownloadStandalone}
                    className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-white/20 transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-cyan-300" />
                    <span>Download Report HTML</span>
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Tab 2: Individual Audits */}
          {activeTab === 'audits' && (
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-indigo-50/60 border border-indigo-200 space-y-1">
                <h3 className="text-base font-black text-indigo-950">
                  12-Point Comprehensive Technical Audit Diagnostic
                </h3>
                <p className="text-xs text-indigo-800 leading-relaxed">
                  Every technical layer analyzed: SSL encryption, Time To First Byte (TTFB), mobile responsiveness, meta tags, schema markup, bot directives, image accessibility, and local 3-pack authority.
                </p>
              </div>

              <ClientIndividualAuditsView
                prospect={prospect}
                report={report}
                defaultExpanded={true}
              />
            </div>
          )}

          {/* Tab 3: Improvement Roadmap */}
          {activeTab === 'roadmap' && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h3 className="text-base font-black text-slate-900">
                  3-Phase Strategic Improvement Roadmap
                </h3>
                <p className="text-xs text-slate-500">
                  A structured step-by-step gameplan to resolve all critical bottlenecks and secure Google Local 3-Pack rankings.
                </p>
              </div>

              <div className="space-y-4">
                {report.improvementRoadmap.map((phase, idx) => (
                  <div key={idx} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-full text-xs font-black bg-blue-100 text-blue-800">
                        {phase.phase}
                      </span>
                      <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {phase.estimatedTimeline}
                      </span>
                    </div>

                    <h4 className="text-sm font-black text-slate-900">{phase.title}</h4>

                    <div className="space-y-1.5">
                      <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        Action Items:
                      </div>
                      <div className="space-y-1.5">
                        {phase.actions.map((act, aIdx) => (
                          <div key={aIdx} className="text-xs text-slate-700 flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0 mt-1.5" />
                            <span>{act}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
                      <strong>Expected Business Outcome:</strong> {phase.expectedOutcome}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 3: Outreach Email Draft */}
          {activeTab === 'email' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h3 className="text-base font-black text-slate-900">Outreach Email Ready to Send</h3>
                  <p className="text-xs text-slate-500">
                    Personalized cold email pitch referencing {report.cname}'s real audit data and revenue math.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(report.clientEmailSummary, 'email_tab')}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  {copied === 'email_tab' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied === 'email_tab' ? 'Copied to Clipboard!' : 'Copy Full Email'}</span>
                </button>
              </div>

              <textarea
                readOnly
                rows={16}
                value={report.clientEmailSummary}
                className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-50 font-sans text-xs sm:text-sm text-slate-800 leading-relaxed focus:outline-hidden"
              />
            </div>
          )}

          {/* Bottom Action Footer */}
          <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 print:hidden">
            <button
              type="button"
              onClick={() => {
                onClose();
                onAuditDomain(report.domain);
              }}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-2 cursor-pointer transition-all"
            >
              <span>Launch Deep Multi-Page Crawler in Suite &rarr;</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadStandalone}
                className="px-4 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                title="Download standalone client report HTML file"
              >
                <Download className="w-3.5 h-3.5 text-amber-700" />
                <span>{downloadSuccess ? 'Downloaded HTML!' : 'Download Client Report'}</span>
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-xs font-black flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-cyan-300" />
                <span>⚡ 1-Click Print / Save PDF</span>
              </button>
              <button
                type="button"
                onClick={() => setShowCustomizer(true)}
                className="px-3 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Sliders className="w-3.5 h-3.5 text-slate-500" />
                <span>Customize</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      {showCustomizer && (
        <ReportCustomizerModal
          report={report}
          prospect={prospect}
          onClose={() => setShowCustomizer(false)}
        />
      )}

      {showOutreach && (
        <OutreachTemplateGeneratorModal
          prospect={prospect}
          report={report}
          onClose={() => setShowOutreach(false)}
        />
      )}
    </div>
  );
};
