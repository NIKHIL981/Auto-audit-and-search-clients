import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { crawlWebsite } from './src/server/crawler';
import { prospectClients } from './src/server/prospector';
import { generateClientAuditReport } from './src/server/clientReportGenerator';
import { generateAiAuditInsights, generateHeuristicAiInsights } from './src/server/aiInsights';
import { generateAiBrandToneSentiment, generateHeuristicBrandToneSentiment } from './src/server/aiSentiment';
import { handleAssistantChat } from './src/server/seoAssistant';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

function normalizeUrl(inputUrl: string): { valid: boolean; normalized: string; domain: string } {
  let url = inputUrl.trim();
  if (!url) return { valid: false, normalized: '', domain: '' };
  if (!/^https?:\/\//i.test(url)) {
    url = 'https://' + url;
  }
  try {
    const parsed = new URL(url);
    return {
      valid: true,
      normalized: parsed.toString(),
      domain: parsed.hostname,
    };
  } catch {
    return { valid: false, normalized: '', domain: '' };
  }
}

// POST: /api/audit/analyze
app.post('/api/audit/analyze', async (req, res) => {
  try {
    const { url, maxPages = 50 } = req.body;
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'A valid website URL is required.' });
    }

    const { valid, normalized, domain } = normalizeUrl(url);
    if (!valid) {
      return res.status(400).json({ error: 'The provided URL is invalid. Please check the domain format.' });
    }

    const pagesToCrawl = Math.min(1000, Math.max(1, Number(maxPages) || 50));
    const report = await crawlWebsite(normalized, domain, pagesToCrawl);

    return res.json(report);
  } catch (error: any) {
    console.error('Audit analysis failed:', error);
    return res.status(500).json({
      error: error.message || 'An unexpected error occurred while analyzing the website.',
    });
  }
});

// POST: /api/audit/ai-insights
// Generates deep prioritized recommendations and strategic diagnostics using Gemini API
app.post('/api/audit/ai-insights', async (req, res) => {
  try {
    const { report } = req.body;
    if (!report || !report.domain) {
      return res.status(400).json({ error: 'Valid audit report data is required for AI Insights generation.' });
    }

    const insights = await generateAiAuditInsights(report);
    return res.json({
      success: true,
      insights,
    });
  } catch (error: any) {
    const fallbackReport = req.body?.report;
    const fallbackInsights = fallbackReport ? generateHeuristicAiInsights(fallbackReport, 'AI service unavailable; presenting local heuristic diagnostic.') : null;
    if (fallbackInsights) {
      return res.json({
        success: true,
        insights: fallbackInsights,
      });
    }
    return res.status(500).json({
      error: error.message || 'Failed to generate AI insights for the audit report.',
    });
  }
});

// POST: /api/audit/content-sentiment
// Evaluates brand tone consistency and content sentiment across crawled pages using Gemini
app.post('/api/audit/content-sentiment', async (req, res) => {
  try {
    const { report, targetArchetypeGoal } = req.body;
    if (!report || !report.domain) {
      return res.status(400).json({ error: 'Valid audit report data is required for Brand Tone & Sentiment evaluation.' });
    }

    const sentimentAudit = await generateAiBrandToneSentiment(report, targetArchetypeGoal);
    return res.json({
      success: true,
      sentiment: sentimentAudit,
    });
  } catch (error: any) {
    console.error('AI Content Sentiment route error:', error);
    const fallbackReport = req.body?.report;
    const fallbackSentiment = fallbackReport
      ? generateHeuristicBrandToneSentiment(
          fallbackReport,
          req.body?.targetArchetypeGoal,
          'AI service temporarily busy; displaying deterministic semantic tone evaluation.'
        )
      : null;

    if (fallbackSentiment) {
      return res.json({
        success: true,
        sentiment: fallbackSentiment,
      });
    }

    return res.status(500).json({
      error: error.message || 'Failed to evaluate brand tone sentiment for the crawled pages.',
    });
  }
});

// POST: /api/audit/assistant/chat
// Context-aware SEO Assistant powered by Gemini API
app.post('/api/audit/assistant/chat', async (req, res) => {
  try {
    const { messages, report } = req.body;
    if (!report || !report.domain) {
      return res.status(400).json({ error: 'Valid audit report context is required for the SEO Assistant.' });
    }
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'At least one message is required in the conversation history.' });
    }

    const chatResponse = await handleAssistantChat(messages, report);
    return res.json(chatResponse);
  } catch (error: any) {
    console.error('SEO Assistant endpoint error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to process assistant message.',
    });
  }
});

// POST: /api/prospector/scan
// Scans Google Places / Local businesses, extracts contact details & audits SEO health
app.post('/api/prospector/scan', async (req, res) => {
  try {
    const {
      niche = 'Dentist',
      location = 'Austin, TX',
      targetCount = 20,
      apiKey,
      strategy,
      urls,
      highTicketOnly,
      minViabilityScore,
      sources,
    } = req.body;
    const count = Math.min(20, Math.max(5, Number(targetCount) || 20));

    const result = await prospectClients({
      niche: String(niche).trim() || 'Dentist',
      location: String(location).trim() || 'Austin, TX',
      targetCount: count,
      apiKey: typeof apiKey === 'string' ? apiKey.trim() : undefined,
      strategy: strategy || 'autonomous_pipeline',
      urls: Array.isArray(urls) ? urls : undefined,
      highTicketOnly: Boolean(highTicketOnly),
      minViabilityScore: minViabilityScore ? Number(minViabilityScore) : undefined,
      sources: Array.isArray(sources) ? sources : undefined,
    });

    return res.json({
      success: true,
      totalFound: result.prospects.length,
      rawPlacesFound: result.rawPlacesFound,
      hotLeadsCount: result.hotLeadsCount,
      goodLeadsCount: result.goodLeadsCount,
      filteredCount: result.filteredCount,
      qualifiedCount: result.qualifiedCount,
      suggestions: result.suggestions,
      message: result.message,
      source: result.source,
      niche,
      location,
      strategy,
      prospects: result.prospects,
    });
  } catch (error: any) {
    console.error('Prospector scan failed:', error);
    return res.status(500).json({
      error: error.message || 'Failed to complete client prospecting scan.',
    });
  }
});

// POST: /api/prospector/audit-urls
// Rapid bulk batch audit for a list of URLs or pasted competitor/client domains
app.post('/api/prospector/audit-urls', async (req, res) => {
  try {
    const { urls = [], location = 'Local Market', niche = 'Services' } = req.body;
    if (!Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({ error: 'Please provide an array of website URLs to audit.' });
    }

    const result = await prospectClients({
      niche: String(niche).trim() || 'Services',
      location: String(location).trim() || 'Local Market',
      targetCount: urls.length,
      strategy: 'direct_urls',
      urls,
    });

    return res.json({
      success: true,
      totalAudited: result.prospects.length,
      prospects: result.prospects,
      rawPlacesFound: result.rawPlacesFound,
      filteredCount: result.filteredCount,
    });
  } catch (error: any) {
    console.error('Bulk URLs audit failed:', error);
    return res.status(500).json({
      error: error.message || 'Failed to complete batch URLs audit.',
    });
  }
});

// POST: /api/prospector/generate-report
// Runs automated audit of a client's website and generates an elegant client-facing report
app.post('/api/prospector/generate-report', async (req, res) => {
  try {
    const { prospectId, cname, websiteUrl, domain, industry, location, existingProspect } = req.body;

    if (!websiteUrl || !cname) {
      return res.status(400).json({ error: 'websiteUrl and cname are required to generate a client audit report.' });
    }

    const report = await generateClientAuditReport({
      prospectId: prospectId || `prospect_${Date.now()}`,
      cname,
      websiteUrl,
      domain: domain || cname.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com',
      industry: industry || 'Local Business',
      location: location || 'United States',
      existingProspect,
    });

    return res.json({
      success: true,
      report,
    });
  } catch (error: any) {
    console.error('Client report generation failed:', error);
    return res.status(500).json({
      error: error.message || 'Failed to generate client audit report.',
    });
  }
});

// POST: /api/crm/sync
// Pushes qualified leads to simulated external CRM (HubSpot, GoHighLevel, Salesforce, Pipedrive, or Custom Webhook)
app.post('/api/crm/sync', async (req, res) => {
  try {
    const {
      platform = 'hubspot',
      leads = [],
      webhookUrl,
      customDealStage = 'Lead - Ready for Outreach',
    } = req.body;

    if (!Array.isArray(leads) || leads.length === 0) {
      return res.status(400).json({ error: 'At least one lead is required for CRM synchronization.' });
    }

    // Simulate realistic API push latency
    await new Promise((r) => setTimeout(r, 450));

    const syncTimestamp = Date.now();
    const syncedRecords = leads.map((lead: any, idx: number) => {
      const prefix =
        platform === 'hubspot'
          ? 'hs_contact_'
          : platform === 'gohighlevel'
          ? 'ghl_contact_'
          : platform === 'salesforce'
          ? '00Q5g00000'
          : platform === 'pipedrive'
          ? 'pd_deal_'
          : 'hook_';

      return {
        leadId: lead.id,
        cname: lead.cname,
        domain: lead.domain,
        crmRecordId: `${prefix}${Math.floor(100000 + Math.random() * 900000)}`,
        status: 'synced',
        dealStage: customDealStage,
        syncedAt: syncTimestamp,
      };
    });

    const log = [
      `[${new Date(syncTimestamp).toLocaleTimeString()}] Authenticated with ${platform.toUpperCase()} API endpoint.`,
      `[${new Date(syncTimestamp).toLocaleTimeString()}] Mapped ${leads.length} qualified leads with contact records & deal pipeline.`,
      `[${new Date(syncTimestamp).toLocaleTimeString()}] Custom properties synced: seo_health_score, client_viability, estimated_revenue_gap, pitch_script.`,
      `[${new Date(syncTimestamp).toLocaleTimeString()}] Successfully synced ${leads.length} contacts into stage: "${customDealStage}".`,
    ];

    if (platform === 'webhook' && webhookUrl) {
      log.push(`[${new Date(syncTimestamp).toLocaleTimeString()}] Webhook payload dispatched to: ${webhookUrl}`);
    }

    return res.json({
      success: true,
      platform,
      totalSynced: syncedRecords.length,
      syncedAt: syncTimestamp,
      syncedRecords,
      log,
    });
  } catch (error: any) {
    console.error('CRM sync failed:', error);
    return res.status(500).json({
      error: error.message || 'Failed to sync leads to CRM.',
    });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
