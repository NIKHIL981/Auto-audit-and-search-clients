import { ClientProspect, AuditReport, ClientContactDetails } from '../types';
import { resolveProspectStage } from './pipelineStages';
import { calculatePotentialRoi } from './prospectPriority';

export const CLIENT_STORAGE_KEY = 'auditpulse_prospects_leads_v2';

export interface MessageDraftOptions {
  templateId:
    | 'executive_cold'
    | 'audit_walkthrough'
    | 'ai_search_geo'
    | 'speed_conversion'
    | 'quick_wins'
    | 'proposal_quote'
    | 'follow_up_gentle'
    | 'short_dm';
  tone: 'executive' | 'consultative' | 'friendly' | 'urgent';
  senderName: string;
  senderTitle?: string;
  agencyName: string;
  recipientName?: string;
  meetingLink?: string;
  customOffer?: string;
}

export const DRAFT_TEMPLATES: {
  id: MessageDraftOptions['templateId'];
  name: string;
  badge: string;
  description: string;
}[] = [
  {
    id: 'executive_cold',
    name: 'Executive Cold Pitch',
    badge: 'High Conversion',
    description: 'Direct, pain-focused pitch highlighting organic revenue leakage and competitor advantage.',
  },
  {
    id: 'audit_walkthrough',
    name: 'Audit Findings Breakdown',
    badge: 'Diagnostic',
    description: 'Detailed analysis sharing their exact SEO score, top 3 technical flaws, and free actionable roadmap.',
  },
  {
    id: 'ai_search_geo',
    name: 'AI Search & GEO Readiness',
    badge: 'Trending (ChatGPT/Perplexity)',
    description: 'Alerts business leadership that AI search engines cannot cite or recommend their services.',
  },
  {
    id: 'speed_conversion',
    name: 'Mobile Speed & CWV Loss Alert',
    badge: 'Core Web Vitals',
    description: 'Focuses on mobile bounce rates and lost customer calls caused by slow server response & heavy assets.',
  },
  {
    id: 'quick_wins',
    name: '3 Quick Wins (Zero-Risk)',
    badge: 'Relationship Builder',
    description: 'Offers 3 high-impact immediate fixes your agency can execute in week 1 with no upfront lock-in.',
  },
  {
    id: 'proposal_quote',
    name: 'SEO Remediation Proposal',
    badge: 'Scope of Work',
    description: 'Structured 3-phase project plan with clear deliverables, timeline, and investment tiers.',
  },
  {
    id: 'follow_up_gentle',
    name: 'Gentle 3-Day Follow-Up',
    badge: 'Follow-Up',
    description: 'Polite, low-pressure check-in referencing the custom audit analysis sent previously.',
  },
  {
    id: 'short_dm',
    name: 'LinkedIn / SMS Snappy DM',
    badge: 'Short Form',
    description: 'Condensed 3-sentence message optimized for social DMs or text outreach.',
  },
];

// Seed realistic demo clients if storage is completely empty
const SEED_CLIENTS: ClientProspect[] = [
  {
    id: 'client_apex_roofing',
    cname: 'Apex Horizon Roofing & Restoration',
    domain: 'apexhorizonroofing.com',
    websiteUrl: 'https://apexhorizonroofing.com',
    industry: 'Roofing Contractors',
    location: 'Austin, TX',
    contactPersonName: 'Marcus Vance',
    contactPersonRole: 'Managing Partner',
    contact: {
      phone: '(512) 843-9201',
      email: 'marcus@apexhorizonroofing.com',
      formattedAddress: '4201 S Congress Ave, Austin, TX 78745',
      socialLinks: {
        linkedin: 'https://linkedin.com/in/marcus-vance-apex',
      },
    },
    seoHealthScore: 48,
    grade: 'C',
    opportunityLevel: 'high',
    opportunitySummary: 'Ranks #14 on Google for high-intent emergency roof repair; losing $35,000/mo in storm claims to local competitor.',
    aiReadinessScore: 32,
    performanceScore: 41,
    viabilityScore: 92,
    viabilityTier: 'high_ticket',
    clientBudgetEstimate: '$2,500 - $4,500 / mo',
    customerLifetimeValue: '$12,000 / roof replacement',
    estimatedLostMonthlyLeads: 18,
    estMonthlyRevenueGap: '$45,000 / mo',
    rankBracket: 'Page 2 Underdog (#11-20)',
    webDiscoverySource: 'Google Places (Maps)',
    buyingSignals: [
      'Currently spending on Google Local Service Ads but organic rank is #14',
      'Website takes 4.8s to load on mobile during peak storm inquiries',
      'Zero LocalBusiness JSON-LD schema or emergency service markup',
    ],
    outrankingCompetitor: 'Austin Pro Roofing (#1 on Google Maps)',
    quickWinFixes: [
      'Compress 18 unoptimized hero banner images to save 3.2MB on mobile',
      'Implement LocalBusiness + RoofingContractor schema with geo coordinates',
      'Fix missing H1 and meta description tags across 8 regional service subpages',
    ],
    topDeficiencies: [
      'LCP latency of 4.8s on 4G mobile devices causing 42% bounce rate',
      'Missing LocalBusiness JSON-LD structured data schema',
      'Meta title tags exceed 75 characters and truncate in Google SERPs',
      'Zero llms.txt or AI crawler indexing for Perplexity and ChatGPT search',
    ],
    coldPitchHook: 'Noticed Apex Horizon sits at #14 for Austin emergency roof repairs while competitors capture 80% of storm inquiries.',
    coldCallScript: 'Hi Marcus, noticed Apex Horizon is ranking right at the top of page 2 in Austin. A couple of mobile speed bottlenecks are costing you about 18 booked quotes a month.',
    linkedInPitch: 'Hi Marcus, noticed Apex Horizon is ranking at #14 for Austin emergency roof repair. A couple of mobile speed fixes could move you to top 3. Open to seeing a 2-min breakdown?',
    emailPitchDraft: '',
    status: 'audit_ready',
    pipelineStage: 'prospecting',
    notes: 'High intent prospect with substantial ticket size. Ran full crawl; ready for outreach.',
    createdAt: Date.now() - 86400000 * 3,
    lastUpdated: Date.now() - 86400000,
  },
  {
    id: 'client_summit_dental',
    cname: 'Summit Family Dental & Orthodontics',
    domain: 'summitdentalclinic.com',
    websiteUrl: 'https://summitdentalclinic.com',
    industry: 'Dentist & Orthodontics',
    location: 'Denver, CO',
    contactPersonName: 'Dr. Elena Rostova',
    contactPersonRole: 'Lead Orthodontist & Clinic Owner',
    contact: {
      phone: '(303) 555-0199',
      email: 'elena@summitdentalclinic.com',
      formattedAddress: '1800 15th St #200, Denver, CO 80202',
    },
    seoHealthScore: 61,
    grade: 'B',
    opportunityLevel: 'high',
    opportunitySummary: 'Excellent reviews (4.9 stars) but website lacks Dentist schema and Invisalign patient landing pages are unindexed.',
    aiReadinessScore: 45,
    performanceScore: 58,
    viabilityScore: 88,
    viabilityTier: 'high_ticket',
    clientBudgetEstimate: '$2,000 - $3,500 / mo',
    customerLifetimeValue: '$6,500 / Invisalign case',
    estimatedLostMonthlyLeads: 12,
    estMonthlyRevenueGap: '$30,000 / mo',
    rankBracket: 'Page 2 Underdog (#11-20)',
    webDiscoverySource: 'Google Search (Live Web)',
    buyingSignals: [
      '4.9 star rating with 140+ Google reviews but invisible on AI Search engines',
      'Invisalign landing page has canonical tag pointing to homepage by accident',
    ],
    outrankingCompetitor: 'Downtown Denver Dental Care (#2 organic)',
    quickWinFixes: [
      'Fix self-referencing canonical URL on Invisalign and implant procedure pages',
      'Embed MedicalBusiness + Dentist schema with accepted insurance markup',
      'Configure fast WebP image delivery on smile transformation gallery',
    ],
    topDeficiencies: [
      'Canonical URL mismatch on high-value orthodontic treatment pages',
      'Missing Dentist & MedicalProcedure structured schema data',
      'Render-blocking CSS files delaying First Contentful Paint by 1.9s',
    ],
    coldPitchHook: 'Your practice has 140+ 5-star reviews, yet ChatGPT and Google AI are recommending Downtown Dental for Invisalign instead.',
    coldCallScript: 'Dr. Elena, your clinic has the best reputation in LoDo, but an accidental canonical tag is hiding your Invisalign pages from Google.',
    linkedInPitch: 'Hi Dr. Elena, loved Summit Dental clinic reviews. Noticed an accidental canonical issue is preventing your Invisalign pages from showing in Google. Happy to share a quick video fix if useful.',
    emailPitchDraft: '',
    status: 'contacted',
    pipelineStage: 'contacted',
    notes: 'Sent initial audit email on Monday. Follow-up scheduled.',
    createdAt: Date.now() - 86400000 * 5,
    lastUpdated: Date.now() - 86400000 * 2,
  },
  {
    id: 'client_sterling_legal',
    cname: 'Sterling & Keller Injury Law',
    domain: 'sterlingkellerlaw.com',
    websiteUrl: 'https://sterlingkellerlaw.com',
    industry: 'Personal Injury Lawyers',
    location: 'Miami, FL',
    contactPersonName: 'Julian Keller',
    contactPersonRole: 'Managing Attorney',
    contact: {
      phone: '(305) 720-4100',
      email: 'jkeller@sterlingkellerlaw.com',
      formattedAddress: '701 Brickell Ave Suite 1500, Miami, FL 33131',
    },
    seoHealthScore: 52,
    grade: 'C',
    opportunityLevel: 'high',
    opportunitySummary: 'Massive case value niche ($50k+ avg settlement). Ranks #18 for Miami car accident attorney due to slow mobile LCP and thin subpage content.',
    aiReadinessScore: 28,
    performanceScore: 39,
    viabilityScore: 98,
    viabilityTier: 'high_ticket',
    clientBudgetEstimate: '$4,500 - $8,000 / mo',
    customerLifetimeValue: '$45,000 / retainer',
    estimatedLostMonthlyLeads: 25,
    estMonthlyRevenueGap: '$110,000 / mo',
    rankBracket: 'Page 2 Underdog (#11-20)',
    webDiscoverySource: 'Google Places (Maps)',
    buyingSignals: [
      'Ultra high-value practice area where 1 extra case yields $30k+ net fee',
      'Running Google Ads at $180 per click while organic presence is slipping',
    ],
    outrankingCompetitor: 'Morgan & Associates Miami (#1 organic)',
    quickWinFixes: [
      'Eliminate 2.4s TTFB delay with server-side page caching on Cloudflare',
      'Deploy LegalService schema with attorney profile authority links',
      'Build localized content silos for Brickell, Coral Gables, and Doral',
    ],
    topDeficiencies: [
      'Server response latency of 2,400ms under mobile testing',
      'Zero LegalService structured data linking attorney bar credentials',
      'Thin content on 12 practice area pages (under 300 words)',
    ],
    coldPitchHook: 'You are spending $180+ per click on Google Ads while your organic site is held back on Page 2 by a 2.4-second server delay.',
    coldCallScript: 'Julian, quick question regarding Sterling Keller Law: did you know your mobile site takes 5 seconds to load for accident victims searching from mobile?',
    linkedInPitch: 'Julian, noticed Sterling Keller ranks well on desktop but mobile page speed is 5s+. Put together a 90-second technical tear-down showing how to fix it without redesigning. Interested?',
    emailPitchDraft: '',
    status: 'in_discussion',
    pipelineStage: 'audit_sent',
    notes: 'Delivered audit proposal last week. Review call requested for Thursday.',
    createdAt: Date.now() - 86400000 * 8,
    lastUpdated: Date.now() - 86400000 * 1,
  },
];

/**
 * Sanitize and strictly deduplicate clients by ID, domain, and company name.
 * Resolves any key collisions by regenerating unique IDs.
 */
export function deduplicateClients(items: ClientProspect[]): ClientProspect[] {
  if (!Array.isArray(items)) return [];
  const seenIds = new Set<string>();
  const seenDomains = new Set<string>();
  const uniqueList: ClientProspect[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (!item) continue;

    // Domain normalization
    const rawDom = (item.domain || item.websiteUrl || '')
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/\/.*$/, '')
      .trim();

    // Exact duplicate business by domain or cname check
    const businessKey = rawDom || item.cname?.toLowerCase().trim();
    if (businessKey && seenDomains.has(businessKey)) {
      continue; // Skip duplicate business listing
    }
    if (businessKey) {
      seenDomains.add(businessKey);
    }

    // Enforce guaranteed unique ID
    let safeId = item.id;
    if (!safeId || seenIds.has(safeId)) {
      const prefix = safeId ? safeId.replace(/[^a-zA-Z0-9_-]/g, '') : 'prospect';
      safeId = `${prefix}-${i}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
    }
    seenIds.add(safeId);

    uniqueList.push({
      ...item,
      id: safeId,
      pipelineStage: resolveProspectStage(item),
    });
  }

  return uniqueList;
}

/**
 * Load all clients from localStorage, seeded with defaults if empty
 */
export function loadClients(): ClientProspect[] {
  try {
    const raw = localStorage.getItem(CLIENT_STORAGE_KEY);
    if (raw) {
      const parsed: ClientProspect[] = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const cleaned = deduplicateClients(parsed);
        // If duplicates or collision were sanitized, update localStorage
        if (cleaned.length !== parsed.length || cleaned.some((c, idx) => c.id !== parsed[idx]?.id)) {
          try {
            localStorage.setItem(CLIENT_STORAGE_KEY, JSON.stringify(cleaned));
          } catch {}
        }
        return cleaned;
      }
    }
  } catch (err) {
    console.error('Error loading clients from localStorage:', err);
  }

  // Seed default clients into storage
  const seeded = deduplicateClients(SEED_CLIENTS);
  try {
    localStorage.setItem(CLIENT_STORAGE_KEY, JSON.stringify(seeded));
  } catch {}
  return seeded;
}

/**
 * Save or update a single client
 */
export function saveClient(client: ClientProspect): ClientProspect[] {
  const current = loadClients();
  const existingIdx = current.findIndex((c) => c.id === client.id);

  let updated: ClientProspect[];
  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx] = {
      ...client,
      lastUpdated: Date.now(),
      pipelineStage: resolveProspectStage(client),
    };
  } else {
    updated = [
      {
        ...client,
        createdAt: client.createdAt || Date.now(),
        lastUpdated: Date.now(),
        pipelineStage: resolveProspectStage(client),
      },
      ...current,
    ];
  }

  const cleanUpdated = deduplicateClients(updated);
  try {
    localStorage.setItem(CLIENT_STORAGE_KEY, JSON.stringify(cleanUpdated));
  } catch (err) {
    console.error('Failed to save client:', err);
  }
  return cleanUpdated;
}

/**
 * Save full array of clients
 */
export function saveAllClients(clients: ClientProspect[]): void {
  const cleanClients = deduplicateClients(clients);
  try {
    localStorage.setItem(CLIENT_STORAGE_KEY, JSON.stringify(cleanClients));
  } catch (err) {
    console.error('Failed to save all clients:', err);
  }
}

/**
 * Delete client by ID
 */
export function deleteClient(id: string): ClientProspect[] {
  const current = loadClients();
  const filtered = current.filter((c) => c.id !== id);
  saveAllClients(filtered);
  return filtered;
}

/**
 * Seamlessly convert an active AuditReport into a rich ClientProspect record
 */
export function convertAuditToClient(
  report: AuditReport,
  customContact?: Partial<ClientContactDetails>,
  additionalNotes?: string
): ClientProspect {
  const domain = report.domain || (report.url ? new URL(report.url).hostname : 'client-domain.com');

  // Derive business name from title or clean domain
  let cname = domain
    .replace(/^www\./i, '')
    .split('.')[0]
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase());

  const rawTitle = (report.title || report.metaTags?.title || report.crawledPages?.[0]?.metaTitle || '') as string;
  if (rawTitle && rawTitle.length > 2 && !rawTitle.toLowerCase().includes('untitled')) {
    const titleParts = rawTitle.split(/[|\-–:]/);
    if (titleParts[0].trim().length > 2 && titleParts[0].trim().length < 45) {
      cname = titleParts[0].trim();
    }
  }

  const overallScore = Math.round(report.scores?.overall ?? report.overallScore ?? 65);
  const aiScore = Math.round(report.scores?.aiReadiness ?? report.aiReadiness?.overallAiScore ?? report.aiReadinessScore ?? 50);
  const perfScore = Math.round(report.scores?.performance ?? report.performance?.score ?? 55);

  const grade: 'A+' | 'A' | 'B' | 'C' | 'D' =
    overallScore >= 90 ? 'A+' : overallScore >= 80 ? 'A' : overallScore >= 70 ? 'B' : overallScore >= 55 ? 'C' : 'D';

  // Extract top deficiencies from actual audit issues
  const issues = Array.isArray(report.issues) ? report.issues : [];
  const topDeficiencies = issues
    .filter((i) => i.severity === 'critical' || i.severity === 'warning')
    .slice(0, 4)
    .map((i) => i.title);

  if (topDeficiencies.length === 0) {
    topDeficiencies.push(
      'Missing comprehensive schema structured data markup',
      'High mobile latency and unoptimized media assets',
      'Thin content on priority keyword landing pages'
    );
  }

  // Quick wins from low-effort high-impact items
  const quickWinFixes = issues
    .filter((i) => i.severity === 'warning' || i.category === 'technical')
    .slice(0, 3)
    .map((i) => i.recommendation || i.title);

  if (quickWinFixes.length === 0) {
    quickWinFixes.push(
      'Embed LocalBusiness schema with service offerings',
      'Optimize image payload to decrease page load by ~1.5s',
      'Update truncated title and meta tags across crawled pages'
    );
  }

  const clientId = `client_${domain.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`;

  const client: ClientProspect = {
    id: clientId,
    cname,
    domain,
    websiteUrl: report.url || `https://${domain}`,
    industry: 'Commercial Business',
    location: 'United States',
    contact: {
      email: customContact?.email || `contact@${domain}`,
      phone: customContact?.phone || '',
      formattedAddress: customContact?.formattedAddress || '',
      ...customContact,
    },
    contactPersonName: 'Marketing Director',
    contactPersonRole: 'Business Decision Maker',
    seoHealthScore: overallScore,
    grade,
    opportunityLevel: overallScore < 60 ? 'high' : overallScore < 80 ? 'medium' : 'low',
    opportunitySummary: `Audit revealed overall SEO health of ${overallScore}/100 and AI Readiness of ${aiScore}/100 across ${report.crawledPages?.length || 1} analyzed page(s).`,
    aiReadinessScore: aiScore,
    performanceScore: perfScore,
    viabilityScore: overallScore < 70 ? 88 : 74,
    viabilityTier: 'high_ticket',
    clientBudgetEstimate: '$2,000 - $4,000 / mo',
    customerLifetimeValue: '$8,000 / client',
    estimatedLostMonthlyLeads: Math.max(8, Math.round((100 - overallScore) * 0.35)),
    estMonthlyRevenueGap: `$${Math.max(15, Math.round((100 - overallScore) * 0.6))}k / mo`,
    rankBracket: overallScore < 60 ? 'Page 2 Underdog (#11-20)' : 'Page 1 Contender',
    webDiscoverySource: 'Direct Site Crawl',
    buyingSignals: [
      `Overall audit health score is ${overallScore}/100 with ${issues.filter((i) => i.severity === 'critical').length} critical issues`,
      `AI search visibility readiness is ${aiScore}/100 with incomplete semantic entity schema`,
      `Analyzed ${report.crawledPages?.length || 1} pages with diagnostic proof ready for delivery`,
    ],
    outrankingCompetitor: `Top organic ranking leader in ${domain} niche`,
    quickWinFixes,
    topDeficiencies,
    coldPitchHook: `We analyzed ${domain} and uncovered ${issues.filter((i) => i.severity === 'critical').length} high-severity search indexing bottlenecks limiting your organic inquiries.`,
    coldCallScript: `Hi, I was reviewing ${domain}'s search visibility and noticed your site is currently scoring ${overallScore}/100. A few quick technical fixes could drive 10-15 extra client inquiries monthly.`,
    linkedInPitch: `Hi, noticed ${domain}'s search footprint has strong authority but missing schema and speed bottlenecks are limiting page 1 rankings. Mind if I send a quick 2-minute overview video?`,
    emailPitchDraft: '',
    status: 'audit_ready',
    pipelineStage: 'prospecting',
    linkedAuditId: report.id,
    linkedAuditUrl: report.url,
    notes: additionalNotes || `Imported directly from live website audit on ${new Date().toLocaleDateString()}.`,
    createdAt: Date.now(),
    lastUpdated: Date.now(),
  };

  return client;
}

/**
 * Generates tailored, high-converting outreach message drafts based on client data and audit findings
 */
export function generateMessageDraft(
  client: ClientProspect,
  options: MessageDraftOptions
): { subject: string; body: string } {
  const company = client.cname || client.domain;
  const domain = client.domain;
  const contactName = client.contactPersonName || 'there';
  const sender = options.senderName || 'Alex Chen';
  const agency = options.agencyName || 'AuditPulse Growth Advisory';
  const role = options.senderTitle || 'Principal SEO Strategist';
  const meetingLink = options.meetingLink || 'https://calendly.com/your-team/15min-review';
  const score = client.seoHealthScore || 58;
  const aiScore = client.aiReadinessScore || 42;
  const competitor = client.outrankingCompetitor || 'your top regional competitor';

  const deficiencies = client.topDeficiencies && client.topDeficiencies.length > 0
    ? client.topDeficiencies
    : [
        'Render-blocking scripts causing high mobile bounce rates',
        'Incomplete schema structured data for search engine rich results',
        'Missing title and meta descriptions on high-intent service pages',
      ];

  const quickWins = client.quickWinFixes && client.quickWinFixes.length > 0
    ? client.quickWinFixes
    : [
        'Deploy LocalBusiness and Service JSON-LD schema',
        'Compress mobile asset payloads to improve LCP by ~1.6s',
        'Optimize canonical and H1 hierarchy across all core pages',
      ];

  const bulletDeficiencies = deficiencies.slice(0, 3).map((d, i) => `  ${i + 1}. ${d}`).join('\n');
  const bulletQuickWins = quickWins.slice(0, 3).map((w, i) => `  • ${w}`).join('\n');

  switch (options.templateId) {
    case 'executive_cold': {
      const subject = `Quick question regarding ${domain}'s organic search visibility`;
      const body = `Hi ${contactName},

I was reviewing ${company}'s online search presence and noticed a specific bottleneck on ${domain} that appears to be funneling high-intent customer search traffic directly to ${competitor}.

During a diagnostic crawl of your website, our technical audit flagged:
${bulletDeficiencies}

Because your site is currently scoring ${score}/100 on technical health, Google is currently placing your service pages just outside the primary click bracket (Page 2), costing you an estimated ${client.estimatedLostMonthlyLeads || 15} qualified inbound leads per month.

We put together a clean 1-page breakdown showing exactly how your team or developer can resolve these without redesigning your site.

Would you be open to a quick 10-minute walkthrough this Thursday or Friday? Alternatively, you can grab a time directly on my calendar: ${meetingLink}

Best regards,

${sender}
${role} | ${agency}
`;
      return { subject, body };
    }

    case 'audit_walkthrough': {
      const subject = `Technical SEO & AI Audit Findings for ${company} (${score}/100)`;
      const body = `Hi ${contactName},

We recently completed an automated technical crawl and AI-readiness diagnostic for ${domain}. Rather than sending a generic sales pitch, I wanted to share the exact findings and actionable fixes we documented:

Key Performance Metrics:
• Overall Search Health: ${score}/100
• AI & Perplexity Readiness: ${aiScore}/100
• Mobile Core Web Vitals: ${client.performanceScore || 52}/100

Top 3 High-Impact Technical Deficiencies:
${bulletDeficiencies}

Immediate Quick-Win Action Items (30-Day Fixes):
${bulletQuickWins}

Addressing just these three items typically recovers 25% to 40% in lost organic impressions within 4 to 6 weeks.

I have the full multi-page diagnostic report ready for your review. Would you like me to send over the PDF, or would you prefer a brief 15-minute screen share to review the recommendations?

You can book a convenient time here: ${meetingLink}

Warm regards,

${sender}
${agency}
`;
      return { subject, body };
    }

    case 'ai_search_geo': {
      const subject = `${company} is currently invisible on ChatGPT Search & Perplexity (Audit Report)`;
      const body = `Hi ${contactName},

Did you know that over 30% of high-intent searches in ${client.industry || 'your industry'} are now happening directly inside generative AI platforms like ChatGPT, Perplexity, and Google AI Overviews?

We ran an AI-readiness inspection on ${domain} and found an AI readiness score of ${aiScore}/100. 

Because ${company} currently lacks entity-level JSON-LD structured data and explicit AI crawler access directives, when potential clients ask AI tools for top recommendations in ${client.location || 'your area'}, the models are currently recommending ${competitor} instead of ${company}.

Here are the specific missing data signals preventing AI engines from citing your services:
${bulletDeficiencies}

We specialize in Generative Engine Optimization (GEO). We can configure your entity graph and schema so your business becomes the cited recommendation in modern AI searches.

Do you have 10 minutes this week for a brief review? 

Calendar: ${meetingLink}

Sincerely,

${sender}
${role} | ${agency}
`;
      return { subject, body };
    }

    case 'speed_conversion': {
      const subject = `Mobile loading delay on ${domain} causing lost inquiries`;
      const body = `Hi ${contactName},

I was running a performance audit on ${domain} and noticed that mobile visitors are experiencing a significant delay before the primary content renders.

Current Mobile Vitals:
• Mobile Performance Score: ${client.performanceScore || 45}/100
• Estimated Mobile Bounce Rate: ~40%
• Estimated Lost Leads: ${client.estimatedLostMonthlyLeads || 12} per month

When potential customers search from their smartphones, over 50% will leave if the page takes longer than 3 seconds to become interactive. 

The good news is that this is not a branding issue—it boils down to three specific technical bottlenecks:
${bulletDeficiencies}

We can typically shave 1.5 to 2.5 seconds off loading time within 5 business days without touching your website design.

Would you be open to seeing the speed benchmark report? Let me know, or feel free to pick a time here: ${meetingLink}

Best,

${sender}
${agency}
`;
      return { subject, body };
    }

    case 'quick_wins': {
      const subject = `3 quick fixes to increase ${company}'s organic calls this month`;
      const body = `Hi ${contactName},

I know you are busy, so I'll get straight to the point. 

We audited ${domain} and identified 3 quick technical fixes that require zero redesign and can be completed in just a few days:

${bulletQuickWins}

Implementing these 3 items will immediately improve your crawl indexing and help you outrank ${competitor} for local search terms.

We would be happy to implement the first fix for you completely free of charge so you can experience the impact firsthand. 

If that sounds helpful, grab 10 minutes on my calendar: ${meetingLink}

Cheers,

${sender}
${agency}
`;
      return { subject, body };
    }

    case 'proposal_quote': {
      const subject = `SEO & AI Remediation Scope of Work for ${company}`;
      const body = `Hi ${contactName},

Following our recent audit of ${domain} (Health Score: ${score}/100, AI Readiness: ${aiScore}/100), here is our recommended phased scope of work to resolve all critical indexing errors and position ${company} for sustained organic market dominance.

PHASE 1: Foundation & Critical Blocker Fixes (Week 1 - 2)
• Remediate top technical blockers:
${bulletDeficiencies}
• Deploy validated LocalBusiness and service JSON-LD schemas
• Fix broken internal links and meta hierarchy

PHASE 2: Speed & Core Web Vitals Optimization (Week 3 - 4)
• Image asset optimization and modern WebP delivery
• Script deferral and elimination of render-blocking resources
• Target Mobile Core Web Vitals score: 85+/100

PHASE 3: Generative AI (GEO) & Topical Authority Expansion (Month 2+)
• Setup llms.txt and entity citation architecture
• Target competitor keyword capture to surpass ${competitor}

Investment Options:
• Sprint Package: $1,800 (One-time technical remediation & schema implementation)
• Growth Retainer: $2,800/month (Full technical fixes + monthly organic authority building)

Let's schedule a 15-minute call to finalize the plan: ${meetingLink}

Best regards,

${sender}
${role} | ${agency}
`;
      return { subject, body };
    }

    case 'follow_up_gentle': {
      const subject = `Re: ${domain} audit & organic search findings`;
      const body = `Hi ${contactName},

Following up briefly on my note from earlier this week regarding ${domain}.

I know how busy things get running ${company}. Just wanted to see if you had a chance to review the technical search issues we uncovered (particularly the ${deficiencies[0] || 'mobile indexing delay'})?

If you would like me to forward the findings directly to your web developer or agency, just reply and let me know. 

Otherwise, if you would like to run through the 10-minute summary together, here is my link: ${meetingLink}

Best,

${sender}
${agency}
`;
      return { subject, body };
    }

    case 'short_dm': {
      const subject = `Quick question about ${domain}`;
      const body = `Hi ${contactName} — noticed ${domain} is currently scoring ${score}/100 on Google technical health due to ${deficiencies[0] || 'missing schema and slow mobile speed'}, costing you search traffic to ${competitor}. We put together a free 1-page fix guide for your team. Would you be open to taking a quick look?`;
      return { subject, body };
    }

    default: {
      const subject = `SEO audit findings for ${domain}`;
      const body = `Hi ${contactName},\n\nWe completed an audit for ${domain} with a health score of ${score}/100.\n\nBest,\n${sender}`;
      return { subject, body };
    }
  }
}
