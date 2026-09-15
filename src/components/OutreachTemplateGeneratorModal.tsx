import React, { useState, useMemo } from 'react';
import {
  X,
  Copy,
  Check,
  Mail,
  Send,
  Sparkles,
  Sliders,
  ExternalLink,
  Bot,
  AlertTriangle,
  TrendingDown,
  Building2,
  Video,
  Smartphone,
  Calendar,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import {
  ClientProspect,
  ClientAuditReport,
  OutreachAngle,
  LeadStatus,
  PipelineStage,
} from '../types';

interface OutreachTemplateGeneratorModalProps {
  prospect: ClientProspect;
  report?: ClientAuditReport;
  isOpen?: boolean;
  onClose: () => void;
  onUpdateStatus?: (id: string, status: LeadStatus) => void;
  onUpdatePipelineStage?: (id: string, stage: PipelineStage) => void;
}

const OUTREACH_ANGLES: Array<{
  id: OutreachAngle;
  title: string;
  badge: string;
  icon: any;
  desc: string;
}> = [
  {
    id: 'value_audit',
    title: 'Value-First Audit Discovery',
    badge: 'Highest Response Rate',
    icon: Sparkles,
    desc: 'Consultative breakdown offering complimentary value before pitching.',
  },
  {
    id: 'competitor_stealing_traffic',
    title: 'Competitor Stealing Local Calls',
    badge: 'Urgency & FOMO',
    icon: TrendingDown,
    desc: 'Highlights how their local competitor captures the top 3-pack search traffic.',
  },
  {
    id: 'ai_search_risk',
    title: 'Google AI Overviews & GEO Gap',
    badge: 'Modern Trend',
    icon: Bot,
    desc: 'Exposes missing schema and inability for AI search engines to cite them.',
  },
  {
    id: 'revenue_leak',
    title: 'Inbound Revenue Gap & ROI Math',
    badge: 'C-Level / Financial',
    icon: Building2,
    desc: 'Quantifies missed calls and frames SEO as a revenue recovery initiative.',
  },
  {
    id: 'video_breakdown_offer',
    title: '90-Second Loom Walkthrough',
    badge: 'Low Friction',
    icon: Video,
    desc: 'Offers a brief custom screen recording showing exactly what to fix.',
  },
  {
    id: 'mobile_bounce',
    title: 'Mobile Speed & Conversion Leak',
    badge: 'Technical & UX',
    icon: Smartphone,
    desc: 'Focuses on smartphone latency causing high bounce rates for local inquiries.',
  },
];

const STORAGE_KEY_SENDER = 'auditpulse_outreach_sender_v1';

export const OutreachTemplateGeneratorModal: React.FC<OutreachTemplateGeneratorModalProps> = ({
  prospect,
  report,
  isOpen = true,
  onClose,
  onUpdateStatus,
  onUpdatePipelineStage,
}) => {
  if (isOpen === false) return null;

  const [angle, setAngle] = useState<OutreachAngle>('value_audit');
  const [tone, setTone] = useState<'consultative' | 'direct' | 'casual'>('consultative');
  const [length, setLength] = useState<'short' | 'standard' | 'in_depth'>('standard');

  const [senderInfo, setSenderInfo] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SENDER);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      senderName: 'Alex Vance',
      senderAgency: 'Apex Search Partners',
      senderTitle: 'Growth & SEO Director',
      bookingUrl: 'https://calendly.com/your-agency/15min',
    };
  });

  const availableIssues = useMemo(() => {
    const list: string[] = [];
    if (report && report.thingsWrong && report.thingsWrong.length > 0) {
      report.thingsWrong.forEach((t) => list.push(t.title));
    }
    if (prospect.topDeficiencies && prospect.topDeficiencies.length > 0) {
      prospect.topDeficiencies.forEach((d) => {
        if (!list.includes(d)) list.push(d);
      });
    }
    if (list.length === 0) {
      list.push('Missing LocalBusiness Schema.org structured data');
      list.push('Elevated Mobile LCP load latency causing high bounce rates');
      list.push('Unoptimized title tags lacking geo-targeted buyer keywords');
    }
    return list;
  }, [report, prospect]);

  const [selectedIssue, setSelectedIssue] = useState<string>(availableIssues[0] || '');
  const [copiedSubject, setCopiedSubject] = useState(false);
  const [copiedBody, setCopiedBody] = useState(false);
  const [statusUpdated, setStatusUpdated] = useState(false);

  const saveSenderInfo = (field: string, val: string) => {
    const updated = { ...senderInfo, [field]: val };
    setSenderInfo(updated);
    try {
      localStorage.setItem(STORAGE_KEY_SENDER, JSON.stringify(updated));
    } catch {}
  };

  // Generate Email Subject & Body dynamically based on actual audit data
  const emailData = useMemo(() => {
    const cname = prospect.cname;
    const domain = prospect.domain;
    const industry = prospect.industry;
    const location = prospect.location;
    const score = report?.overallScore ?? prospect.seoHealthScore;
    const topIssue = selectedIssue || availableIssues[0] || 'missing schema markup';
    const competitor = prospect.outrankingCompetitor || `${location} market leaders`;
    const revenueGap = prospect.estMonthlyRevenueGap || '$15,000 - $35,000 / mo';
    const lostCalls = prospect.estimatedLostMonthlyLeads || 12;
    const aiScore = prospect.aiReadinessScore ?? 45;
    const { senderName, senderAgency, senderTitle, bookingUrl } = senderInfo;

    let subject = '';
    let body = '';

    switch (angle) {
      case 'competitor_stealing_traffic':
        subject =
          tone === 'direct'
            ? `${competitor} is capturing ${location} ${industry.toLowerCase()} calls from ${domain}`
            : `Quick question on ${domain} vs ${competitor} search rank in ${location}`;
        if (length === 'short') {
          body = `Hi ${cname} Team,

I noticed ${competitor} currently ranks above ${domain} for high-intent ${industry.toLowerCase()} searches in ${location}.

The main technical culprit is ${topIssue.toLowerCase()}, which suppresses your position in the local 3-pack.

I put together a quick breakdown of how to outrank them and reclaim those calls:
${bookingUrl}

Best,
${senderName} · ${senderAgency}`;
        } else if (length === 'in_depth') {
          body = `Hi ${cname} Team,

While researching leading ${industry.toLowerCase()} service providers in ${location}, I noticed a significant gap between your site (${domain}) and ${competitor}.

Right now, ${competitor} is commanding the majority of local buyer intent simply because of key structural advantages:
1. ${topIssue}
2. Missing citation authority and localized semantic schema
3. Mobile page latency that drops search signals

Our performance audit ranked ${domain} at ${score}/100 SEO health. For a firm in ${industry}, this disparity typically translates to an estimated ${lostCalls} missed customer inquiries every month (approximately ${revenueGap} in billable revenue).

We've already drafted a 3-step action roadmap to fix this and move ${domain} into the top spots. Would you or your marketing lead be open to a 10-minute briefing this Thursday?

You can also grab a quick time on my calendar here:
${bookingUrl}

Best regards,
${senderName}
${senderTitle} | ${senderAgency}`;
        } else {
          body = `Hi ${cname} Team,

I was auditing local search visibility for ${industry.toLowerCase()} providers across ${location} and noticed ${competitor} is currently outranking ${domain} for high-value buyer searches.

Our audit identified ${topIssue.toLowerCase()} as the primary reason Google's algorithm is favoring them over your firm.

Given the typical customer lifetime value in ${industry}, resolving this could help you recover an estimated ${revenueGap} in organic inquiries.

Would you be open to a brief 10-minute chat this week, or would you prefer I send over the full audit PDF first?

Best regards,
${senderName}
${senderTitle} · ${senderAgency}`;
        }
        break;

      case 'ai_search_risk':
        subject =
          tone === 'direct'
            ? `Google AI Overviews readiness for ${domain} (${aiScore}/100)`
            : `How Google AI Overviews & ChatGPT are displaying ${cname}`;
        if (length === 'short') {
          body = `Hi ${cname} Team,

I recently tested ${domain} against Google's new AI Overviews and Perplexity search bots for ${industry.toLowerCase()} queries in ${location}.

Your AI Readiness score came in at ${aiScore}/100, primarily due to: ${topIssue}. When AI engines summarize local recommendations, your competitors get cited while ${domain} is overlooked.

I prepared a quick fix checklist if you'd like to take a look:
${bookingUrl}

Best,
${senderName}`;
        } else {
          body = `Hi ${cname} Team,

With Google rolling out AI Overviews and conversational answer engines taking over mobile search, I wanted to share a quick observation regarding ${domain}.

We recently audited local ${industry.toLowerCase()} websites in ${location} for AI engine readiness (schema answerability, entity graphs, and bot directives). 

${cname} scored ${aiScore}/100 because of ${topIssue.toLowerCase()}. Because search engines can't easily parse your structured data, your business is frequently excluded from zero-click AI summaries.

We created an action plan showing how to structure your knowledge graph so AI models recommend ${cname} first.

Would you be open to a 10-minute screen share to review the diagnostics?

You can book a slot here: ${bookingUrl}

Warm regards,
${senderName}
${senderTitle} · ${senderAgency}`;
        }
        break;

      case 'revenue_leak':
        subject =
          tone === 'direct'
            ? `${revenueGap} revenue gap identified for ${domain}`
            : `Estimated ${lostCalls} missed ${industry.toLowerCase()} calls/mo for ${cname}`;
        if (length === 'short') {
          body = `Hi ${cname} Team,

Our market model estimates ${domain} is missing ~${lostCalls} qualified customer calls per month in ${location}, representing roughly ${revenueGap} in unrealized revenue.

The primary issue holding your search visibility back is ${topIssue.toLowerCase()}.

Happy to share our financial analysis and the roadmap to recover these inquiries:
${bookingUrl}

Best,
${senderName} · ${senderAgency}`;
        } else {
          body = `Hi ${cname} Team,

I recently completed an organic revenue gap analysis for ${industry.toLowerCase()} businesses in ${location}, specifically examining ${domain}.

Based on current local search volumes and your site's SEO Health Score (${score}/100), we calculate that ${cname} is missing approximately ${lostCalls} qualified client inquiries per month.

In ${industry}, that represents roughly ${revenueGap} in monthly revenue that is currently being captured by competitors on Page 1.

The good news is that the root cause is technical and completely solvable:
• Root bottleneck: ${topIssue}
• Estimated time to resolve: 14-21 days
• Estimated ROI: 4.8x - 8.5x on organic recovery

We have the full financial breakdown and technical audit ready. Would you be open to a 15-minute call this week to review the numbers?

Calendar: ${bookingUrl}

Best regards,
${senderName}
${senderTitle} | ${senderAgency}`;
        }
        break;

      case 'video_breakdown_offer':
        subject = `Made a 90-second video walkthrough for ${domain}`;
        body = `Hi ${cname} Team,

I was reviewing websites in the ${location} ${industry.toLowerCase()} space and noticed a few quick technical fixes on ${domain} that could significantly boost your inbound calls.

Specifically, I spotted ${topIssue.toLowerCase()}, which is currently dragging your SEO score down to ${score}/100.

I recorded a quick 90-second Loom video showing your site and exactly what lines of code/tags need to be updated to fix it.

Would you mind if I send the video link over for you or your webmaster to review? No pitch, just genuine feedback.

Best,
${senderName}
${senderTitle} · ${senderAgency}`;
        break;

      case 'mobile_bounce':
        subject = `Mobile bounce rate & tap-to-call friction on ${domain}`;
        body = `Hi ${cname} Team,

Over 68% of local searches for ${industry.toLowerCase()} in ${location} now happen on mobile devices, but when testing ${domain}, we noticed substantial mobile friction.

Specifically: ${topIssue.toLowerCase()}, combined with uncompressed asset payloads that delay page rendering.

Every 1-second delay on mobile causes an estimated 11% drop in phone call conversions.

We compiled a mobile optimization checklist that eliminates this friction without needing a full website rebuild. 

Can I send that over to you?

Best regards,
${senderName}
${senderTitle} · ${senderAgency}`;
        break;

      case 'value_audit':
      default:
        subject =
          tone === 'casual'
            ? `Quick feedback on ${domain}`
            : tone === 'direct'
            ? `SEO audit findings & ${score}/100 health score for ${domain}`
            : `Complimentary website & SEO audit for ${cname} (${location})`;
        if (length === 'short') {
          body = `Hi ${cname} Team,

I recently ran an independent performance scan on ${domain} and noticed a couple of easily addressable issues holding back your Google rank in ${location}.

Most notably: ${topIssue.toLowerCase()}.

We put together a clean 1-page PDF proposal detailing the fix and projected traffic recovery. Would you like me to send that over?

Best,
${senderName}
${senderTitle} · ${senderAgency}`;
        } else if (length === 'in_depth') {
          body = `Hi ${cname} Team,

I hope your week is off to a productive start.

Our agency recently evaluated organic search performance for ${industry.toLowerCase()} leaders across ${location}. During our review of ${domain}, we discovered several strong foundations (including valid SSL encryption and core mobile tags), but also a few critical bottlenecks that are deflecting inquiries.

Key Findings from our Technical Audit:
• Overall SEO Health: ${score}/100
• Primary Deficiency: ${topIssue}
• Financial Impact: An estimated ${lostCalls} lost inbound inquiries/month (~${revenueGap})
• Leading Search Competitor: ${competitor}

We prepared a complete, white-labeled Audit & 90-Day Action Blueprint for ${cname}. It outlines the exact steps to remedy these issues and capture top local rankings.

Would you be open to a 10-minute briefing call this week to review the findings?

You can pick a convenient time here: ${bookingUrl}

Best regards,
${senderName}
${senderTitle}
${senderAgency}`;
        } else {
          body = `Hi ${cname} Team,

I recently ran a diagnostic search audit on ${domain} while researching ${industry.toLowerCase()} leaders in ${location}.

Your website has strong underlying authority, but our audit discovered a key technical bottleneck: ${topIssue.toLowerCase()}.

Because of this, your SEO Health Score is currently ${score}/100, which gives local competitors like ${competitor} an advantage in search rankings and map pack calls.

We put together a complete 90-day action plan that details how to fix this issue and recover an estimated ${revenueGap} in lost inquiries.

Would you be open to a 5-minute call, or should I email over the full audit PDF for your team to review?

Best regards,
${senderName}
${senderTitle} · ${senderAgency}`;
        }
        break;
    }

    return { subject, body };
  }, [prospect, report, angle, tone, length, selectedIssue, availableIssues, senderInfo]);

  const handleCopySubject = () => {
    navigator.clipboard.writeText(emailData.subject);
    setCopiedSubject(true);
    setTimeout(() => setCopiedSubject(false), 2000);
  };

  const handleCopyBody = () => {
    navigator.clipboard.writeText(emailData.body);
    setCopiedBody(true);
    setTimeout(() => setCopiedBody(false), 2000);
  };

  const handleOpenMailto = () => {
    const emailTo = prospect.contact?.email || '';
    const mailtoUrl = `mailto:${encodeURIComponent(emailTo)}?subject=${encodeURIComponent(
      emailData.subject
    )}&body=${encodeURIComponent(emailData.body)}`;
    window.location.href = mailtoUrl;
    if (onUpdateStatus) {
      onUpdateStatus(prospect.id, 'contacted');
      setStatusUpdated(true);
    }
    if (onUpdatePipelineStage) {
      onUpdatePipelineStage(prospect.id, prospect.clientAuditReport ? 'audit_sent' : 'contacted');
    }
  };

  const handleMarkContacted = () => {
    if (onUpdateStatus) {
      onUpdateStatus(prospect.id, 'contacted');
      setStatusUpdated(true);
      setTimeout(() => setStatusUpdated(false), 2500);
    }
    if (onUpdatePipelineStage) {
      onUpdatePipelineStage(prospect.id, prospect.clientAuditReport ? 'audit_sent' : 'contacted');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-5xl w-full my-auto overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-400/30">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-wider text-purple-300">
                AI Outreach Template Generator
              </div>
              <h2 className="text-sm sm:text-base font-black truncate">
                Cold Email Pitch for: <span className="text-white underline">{prospect.cname}</span>
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Split Layout */}
        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
          {/* Controls Sidebar */}
          <div className="w-full lg:w-80 p-5 border-b lg:border-b-0 lg:border-r border-slate-200 bg-slate-50/70 overflow-y-auto shrink-0 space-y-5">
            {/* Angle Selector */}
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-700">
                Outreach Strategy Angle
              </label>
              <div className="space-y-1.5">
                {OUTREACH_ANGLES.map((ang) => {
                  const Icon = ang.icon;
                  const isSelected = angle === ang.id;
                  return (
                    <button
                      key={ang.id}
                      type="button"
                      onClick={() => setAngle(ang.id)}
                      className={`w-full p-2.5 rounded-xl text-left border transition-all cursor-pointer flex items-start gap-2 ${
                        isSelected
                          ? 'bg-purple-50 border-purple-300 shadow-2xs'
                          : 'bg-white border-slate-200 hover:border-slate-300 text-slate-600'
                      }`}
                    >
                      <div className={`p-1.5 rounded-lg shrink-0 ${isSelected ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-xs font-bold truncate ${isSelected ? 'text-purple-950' : 'text-slate-800'}`}>
                            {ang.title}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 line-clamp-1">{ang.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Specific Issue Feature Selector */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-700 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-rose-500" />
                Featured Audit Deficiency
              </label>
              <select
                value={selectedIssue}
                onChange={(e) => setSelectedIssue(e.target.value)}
                className="w-full p-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-800 font-medium focus:outline-hidden focus:border-purple-500"
              >
                {availableIssues.map((iss, i) => (
                  <option key={i} value={iss}>
                    {iss}
                  </option>
                ))}
              </select>
            </div>

            {/* Tone & Length */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">Tone</label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value as any)}
                  className="w-full p-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-800 focus:outline-hidden focus:border-purple-500"
                >
                  <option value="consultative">Consultative</option>
                  <option value="direct">Direct / Results</option>
                  <option value="casual">Friendly / Casual</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">Length</label>
                <select
                  value={length}
                  onChange={(e) => setLength(e.target.value as any)}
                  className="w-full p-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-800 focus:outline-hidden focus:border-purple-500"
                >
                  <option value="short">Short (&lt;120w)</option>
                  <option value="standard">Standard (~180w)</option>
                  <option value="in_depth">In-Depth (~280w)</option>
                </select>
              </div>
            </div>

            {/* Sender Personalization */}
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <div className="text-[11px] font-black uppercase tracking-wider text-slate-700">
                Sender Signature
              </div>
              <div className="space-y-2">
                <input
                  type="text"
                  value={senderInfo.senderName}
                  onChange={(e) => saveSenderInfo('senderName', e.target.value)}
                  placeholder="Your Name"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white focus:outline-hidden"
                />
                <input
                  type="text"
                  value={senderInfo.senderAgency}
                  onChange={(e) => saveSenderInfo('senderAgency', e.target.value)}
                  placeholder="Agency Name"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white focus:outline-hidden"
                />
                <input
                  type="text"
                  value={senderInfo.bookingUrl}
                  onChange={(e) => saveSenderInfo('bookingUrl', e.target.value)}
                  placeholder="Calendly / Booking URL"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white font-mono focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Email Preview & Copy Area */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-4 bg-white flex flex-col justify-between">
            <div className="space-y-4">
              {/* Prospect context bar */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-slate-500">Recipient: </span>
                  <strong className="text-slate-900">{prospect.cname}</strong> ({prospect.domain})
                  {prospect.contact?.email && (
                    <span className="ml-2 font-mono text-blue-600">&lt;{prospect.contact.email}&gt;</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                    AI Score: {prospect.aiReadinessScore ?? 48}/100
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                    SEO Health: {report?.overallScore ?? prospect.seoHealthScore}/100
                  </span>
                </div>
              </div>

              {/* Subject Line Field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-bold text-slate-700">Subject Line</label>
                  <button
                    type="button"
                    onClick={handleCopySubject}
                    className="text-purple-600 hover:text-purple-700 font-bold flex items-center gap-1 cursor-pointer text-[11px]"
                  >
                    {copiedSubject ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedSubject ? 'Copied Subject!' : 'Copy Subject'}</span>
                  </button>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 select-all">
                  {emailData.subject}
                </div>
              </div>

              {/* Email Body Field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-bold text-slate-700">Email Body Copy</label>
                  <button
                    type="button"
                    onClick={handleCopyBody}
                    className="text-purple-600 hover:text-purple-700 font-bold flex items-center gap-1 cursor-pointer text-[11px]"
                  >
                    {copiedBody ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedBody ? 'Copied Body!' : 'Copy Body Text'}</span>
                  </button>
                </div>
                <textarea
                  readOnly
                  rows={14}
                  value={emailData.body}
                  className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-50/50 text-xs font-mono text-slate-800 leading-relaxed resize-none focus:outline-hidden"
                />
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleMarkContacted}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {statusUpdated ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Calendar className="w-3.5 h-3.5 text-slate-600" />
                  )}
                  <span>{statusUpdated ? 'Marked as Contacted!' : 'Mark Lead Contacted'}</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyBody}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Full Email</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenMailto}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Open in Mail Client</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
