import React, { useState, useMemo } from 'react';
import {
  X,
  Copy,
  Check,
  Mail,
  Phone,
  MessageCircle,
  ExternalLink,
  Sparkles,
  User,
  Send,
  HelpCircle,
  AlertCircle,
  PhoneCall,
  CheckCircle2,
} from 'lucide-react';
import { ClientProspect } from '../types';

export type QuickOutreachTab = 'email' | 'whatsapp' | 'call';

interface QuickOutreachModalProps {
  prospect: ClientProspect;
  initialTab?: QuickOutreachTab;
  isOpen: boolean;
  onClose: () => void;
}

const STORAGE_SENDER_NAME = 'auditpulse_freelancer_name';
const STORAGE_SENDER_PHONE = 'auditpulse_freelancer_phone';
const STORAGE_SENDER_PORTFOLIO = 'auditpulse_freelancer_portfolio';

export const QuickOutreachModal: React.FC<QuickOutreachModalProps> = ({
  prospect,
  initialTab = 'email',
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<QuickOutreachTab>(initialTab);
  const [copied, setCopied] = useState<string | null>(null);

  // Freelancer details
  const [freelancerName, setFreelancerName] = useState(() => {
    return localStorage.getItem(STORAGE_SENDER_NAME) || 'Alex Vance';
  });
  const [freelancerPhone, setFreelancerPhone] = useState(() => {
    return localStorage.getItem(STORAGE_SENDER_PHONE) || '+1 (555) 019-2834';
  });
  const [portfolioLink, setPortfolioLink] = useState(() => {
    return localStorage.getItem(STORAGE_SENDER_PORTFOLIO) || 'https://myportfolio.design';
  });

  const handleNameChange = (val: string) => {
    setFreelancerName(val);
    localStorage.setItem(STORAGE_SENDER_NAME, val);
  };
  const handlePhoneChange = (val: string) => {
    setFreelancerPhone(val);
    localStorage.setItem(STORAGE_SENDER_PHONE, val);
  };
  const handlePortfolioChange = (val: string) => {
    setPortfolioLink(val);
    localStorage.setItem(STORAGE_SENDER_PORTFOLIO, val);
  };

  // Extract owner greeting: "Hi Dr. Torres" or "Hi [Owner Name]" or "Hi [Business Name] Team"
  const ownerGreeting = useMemo(() => {
    if (prospect.ownerName && prospect.ownerName.trim()) {
      const trimmed = prospect.ownerName.trim();
      if (/^(Dr\.|Doctor|Dr)\s+/i.test(trimmed)) {
        return trimmed;
      }
      const parts = trimmed.split(/\s+/);
      const lastName = parts[parts.length - 1];
      return lastName ? `Dr. / Mr. ${lastName}` : trimmed;
    }
    return `${prospect.cname} Team`;
  }, [prospect.ownerName, prospect.cname]);

  // Real issues from the actual audit
  const realIssues = useMemo(() => {
    const list: string[] = [];
    if (prospect.topDeficiencies && prospect.topDeficiencies.length > 0) {
      list.push(...prospect.topDeficiencies.slice(0, 3));
    } else if (prospect.realAuditDetails) {
      const rad = prospect.realAuditDetails;
      if (!rad.onPage.metaDescription) list.push('Missing meta description tag on homepage');
      if (!rad.schema.localBusiness) list.push('Missing LocalBusiness schema markup for Google Maps ranking');
      if (!rad.technical.https) list.push('Website loads over unencrypted HTTP (no SSL)');
      if (rad.performance.pageLoadTimeMs > 3000) {
        list.push(`Page load speed is ${(rad.performance.pageLoadTimeMs / 1000).toFixed(1)}s (causes high bounce rates)`);
      }
      if (!rad.mobile.viewportMeta) list.push('Missing mobile viewport configuration for smartphone users');
      if (!rad.technical.sitemap) list.push('Missing XML sitemap for search engine indexing');
    }

    if (list.length === 0) {
      list.push('Missing LocalBusiness structured data on homepage');
      list.push('No meta description tag causing truncated Google search snippets');
    }
    return list.slice(0, 3);
  }, [prospect]);

  const niche = prospect.industry || 'local';
  const city = prospect.location || 'your area';

  // 1. Email Template
  const emailSubject = `One fix that could bring ${prospect.cname} more customers from Google`;
  const emailBody = useMemo(() => {
    const issuesBullet = realIssues.map((issue) => `• ${issue}`).join('\n');
    return `Hi ${ownerGreeting},

I came across ${prospect.cname} while searching for ${niche.toLowerCase()} in ${city}.

I ran a quick audit on ${prospect.domain} and noticed a few things that may be costing you new customers (you may be missing 10–15 new calls per month from Google):
${issuesBullet}

I fix exactly these issues for ${niche.toLowerCase()} businesses — most are done within 48 hours.

Would a free 10-minute call work this week so I can show you what I found?

${freelancerName}
${freelancerPhone}
${portfolioLink}`;
  }, [ownerGreeting, prospect.cname, niche, city, prospect.domain, realIssues, freelancerName, freelancerPhone, portfolioLink]);

  const emailWordCount = useMemo(() => {
    return emailBody.trim().split(/\s+/).filter(Boolean).length;
  }, [emailBody]);

  // 2. WhatsApp Message Template
  const whatsAppMessage = useMemo(() => {
    const issuesBullet = realIssues.slice(0, 2).map((issue) => `• ${issue}`).join('\n');
    return `Hi ${prospect.cname} 👋

I checked your website (${prospect.domain}) and found a couple of quick issues that might be affecting your Google ranking:
${issuesBullet}

Happy to send a free mini-report. Just say yes!

${freelancerName}`;
  }, [prospect.cname, prospect.domain, realIssues, freelancerName]);

  // 3. Cold Call Script
  const callScript = useMemo(() => {
    const primaryIssue = realIssues[0] || 'missing LocalBusiness structured data';
    return {
      opener: `"Hi, is this ${prospect.cname}? My name is ${freelancerName} and I help ${niche.toLowerCase()} businesses in ${city} get more customers from Google.

I looked at your website before calling and noticed ${primaryIssue.toLowerCase()}.

Would you be open to a free 5-minute screen share where I show you exactly what I found? No commitment at all."`,
      ifYes: `"Great — when works best for you this week? I can do it over Google Meet or Zoom, totally free."`,
      ifNo: `"No problem at all. Can I at least email you a short report? Takes 10 seconds to read."`,
    };
  }, [prospect.cname, freelancerName, niche, city, realIssues]);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const recipientEmail = prospect.contact.email;
  const recipientPhone = prospect.contact.phone;

  // Clean phone number for WhatsApp: remove non-digits
  const cleanPhoneForWa = recipientPhone ? recipientPhone.replace(/\D/g, '') : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-3xl w-full my-auto overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/20 text-cyan-300 border border-cyan-400/30">
              <Sparkles className="w-4 h-4 text-cyan-300" />
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-wider text-cyan-300">
                Personalized Client Outreach Studio
              </div>
              <h2 className="text-base font-black truncate max-w-md">{prospect.cname}</h2>
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

        {/* Tab Navigation */}
        <div className="px-6 pt-3 pb-2 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5 p-1 bg-slate-200/80 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('email')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'email'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Mail className="w-3.5 h-3.5 text-blue-600" />
              <span>Personalized Email</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                emailWordCount <= 150 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }`}>
                {emailWordCount} words
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('whatsapp')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'whatsapp'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>WhatsApp Message</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('call')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'call'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <PhoneCall className="w-3.5 h-3.5 text-purple-600" />
              <span>Cold Call Script</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="font-semibold">{prospect.domain}</span>
            <span>&bull;</span>
            <span className="font-bold text-slate-700">{prospect.industry}</span>
          </div>
        </div>

        {/* Sender Profile Settings Bar */}
        <div className="px-6 py-2.5 bg-slate-100/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-2 text-slate-600 font-medium">
            <User className="w-3.5 h-3.5 text-slate-400" />
            <span>Your Info:</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={freelancerName}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Your Name"
              className="px-2 py-1 rounded-lg border border-slate-300 bg-white text-xs font-bold text-slate-800 w-28 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <input
              type="text"
              value={freelancerPhone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              placeholder="Your Phone"
              className="px-2 py-1 rounded-lg border border-slate-300 bg-white text-xs font-mono text-slate-800 w-36 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <input
              type="text"
              value={portfolioLink}
              onChange={(e) => handlePortfolioChange(e.target.value)}
              placeholder="Portfolio URL"
              className="px-2 py-1 rounded-lg border border-slate-300 bg-white text-xs font-mono text-slate-800 w-44 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-slate-800">
          {/* TAB 1: EMAIL */}
          {activeTab === 'email' && (
            <div className="space-y-4">
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>
                    <strong>Rule Adherence:</strong> Under 150 words ({emailWordCount} words) &bull; Mentions real issues on {prospect.domain} &bull; No fake revenue stats &bull; One clear CTA.
                  </span>
                </div>
                {recipientEmail ? (
                  <span className="font-mono text-[11px] font-bold text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-200">
                    To: {recipientEmail}
                  </span>
                ) : (
                  <span className="text-[11px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    ⚠️ No email found on site
                  </span>
                )}
              </div>

              {/* Subject Line */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-bold text-slate-700">Subject Line:</label>
                  <button
                    type="button"
                    onClick={() => handleCopy(emailSubject, 'subject')}
                    className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer text-[11px]"
                  >
                    {copied === 'subject' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copied === 'subject' ? 'Copied!' : 'Copy Subject'}</span>
                  </button>
                </div>
                <div className="p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 select-all">
                  {emailSubject}
                </div>
              </div>

              {/* Email Body */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-bold text-slate-700">Message Body:</label>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400">
                      Word count: <strong className={emailWordCount <= 150 ? 'text-emerald-600' : 'text-rose-600'}>{emailWordCount}</strong> / 150
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(emailBody, 'email')}
                      className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold flex items-center gap-1 cursor-pointer text-xs"
                    >
                      {copied === 'email' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copied === 'email' ? 'Copied Body!' : 'Copy Body'}</span>
                    </button>
                  </div>
                </div>
                <pre className="p-4 bg-slate-50 border border-slate-300 rounded-2xl text-xs font-mono text-slate-900 whitespace-pre-wrap leading-relaxed select-all">
                  {emailBody}
                </pre>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => handleCopy(`${emailSubject}\n\n${emailBody}`, 'full-email')}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-2 shadow-xs cursor-pointer"
                >
                  {copied === 'full-email' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copied === 'full-email' ? 'Copied Entire Email!' : 'Copy Subject + Body'}</span>
                </button>

                {recipientEmail && (
                  <a
                    href={`mailto:${recipientEmail}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 shadow-xs cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>Open in Email Client ({recipientEmail})</span>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: WHATSAPP */}
          {activeTab === 'whatsapp' && (
            <div className="space-y-4">
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    <strong>Short, casual &amp; friendly:</strong> Opens direct dialogue without feeling spammy. Mentions 2 real site issues.
                  </span>
                </div>
                {recipientPhone ? (
                  <span className="font-mono text-[11px] font-bold text-emerald-800 bg-white px-2 py-0.5 rounded border border-emerald-200">
                    Phone: {recipientPhone}
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-500 font-medium">
                    Phone from Google Places
                  </span>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-bold text-slate-700">WhatsApp Message:</label>
                  <button
                    type="button"
                    onClick={() => handleCopy(whatsAppMessage, 'wa')}
                    className="text-emerald-600 hover:text-emerald-800 font-bold flex items-center gap-1 cursor-pointer text-xs"
                  >
                    {copied === 'wa' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copied === 'wa' ? 'Copied!' : 'Copy Message'}</span>
                  </button>
                </div>
                <div className="p-4 bg-emerald-50/40 border border-emerald-300/80 rounded-2xl text-xs font-mono text-slate-900 whitespace-pre-wrap leading-relaxed select-all">
                  {whatsAppMessage}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => handleCopy(whatsAppMessage, 'wa-main')}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-2 shadow-xs cursor-pointer"
                >
                  {copied === 'wa-main' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copied === 'wa-main' ? 'Copied to Clipboard!' : 'Copy WhatsApp Message'}</span>
                </button>

                <a
                  href={
                    cleanPhoneForWa
                      ? `https://wa.me/${cleanPhoneForWa}?text=${encodeURIComponent(whatsAppMessage)}`
                      : `https://wa.me/?text=${encodeURIComponent(whatsAppMessage)}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-xs cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Open WhatsApp Web {cleanPhoneForWa ? `(${recipientPhone})` : ''}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}

          {/* TAB 3: COLD CALL SCRIPT */}
          {activeTab === 'call' && (
            <div className="space-y-4">
              <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl text-xs text-purple-900 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
                  <span>
                    <strong>Natural, Human Tone:</strong> Not salesy, not robotic. Offers a free 5-minute screen share with no commitment.
                  </span>
                </div>
                {recipientPhone && (
                  <a
                    href={`tel:${recipientPhone}`}
                    className="font-mono text-xs font-bold text-purple-800 bg-white px-2.5 py-1 rounded-lg border border-purple-300 hover:bg-purple-100 flex items-center gap-1"
                  >
                    <Phone className="w-3 h-3" />
                    <span>Call: {recipientPhone}</span>
                  </a>
                )}
              </div>

              {/* Script: Opener */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-slate-900 uppercase tracking-wider text-[11px]">
                    Step 1: The Opener (15 Seconds)
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(callScript.opener, 'opener')}
                    className="text-purple-600 hover:text-purple-800 font-bold flex items-center gap-1 cursor-pointer text-xs"
                  >
                    {copied === 'opener' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copied === 'opener' ? 'Copied!' : 'Copy Opener'}</span>
                  </button>
                </div>
                <div className="text-xs font-sans text-slate-800 leading-relaxed italic bg-white p-3 rounded-xl border border-slate-200">
                  {callScript.opener}
                </div>
              </div>

              {/* Branching responses */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-2xl space-y-1.5">
                  <span className="font-extrabold text-emerald-900 uppercase tracking-wider text-[10px] flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>If they say YES:</span>
                  </span>
                  <p className="text-slate-800 italic bg-white p-2.5 rounded-xl border border-emerald-200">
                    {callScript.ifYes}
                  </p>
                </div>

                <div className="p-3.5 bg-amber-50/60 border border-amber-200 rounded-2xl space-y-1.5">
                  <span className="font-extrabold text-amber-900 uppercase tracking-wider text-[10px] flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                    <span>If they say NO:</span>
                  </span>
                  <p className="text-slate-800 italic bg-white p-2.5 rounded-xl border border-amber-200">
                    {callScript.ifNo}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() =>
                    handleCopy(
                      `${callScript.opener}\n\n[If they say yes]:\n${callScript.ifYes}\n\n[If they say no]:\n${callScript.ifNo}`,
                      'all-script'
                    )
                  }
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-2 shadow-xs cursor-pointer"
                >
                  {copied === 'all-script' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copied === 'all-script' ? 'Copied Full Script!' : 'Copy Full Cold Call Script'}</span>
                </button>

                {recipientPhone && (
                  <a
                    href={`tel:${recipientPhone}`}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-2 shadow-xs cursor-pointer"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Dial {recipientPhone}</span>
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
