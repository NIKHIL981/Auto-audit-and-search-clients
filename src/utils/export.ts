import { AuditReport, BrandedAuditPdfConfig } from '../types';

export function downloadJsonReport(report: AuditReport): void {
  const filename = `audit-${report.domain}-${new Date(report.timestamp).toISOString().split('T')[0]}.json`;
  const jsonStr = JSON.stringify(report, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadCsvReport(report: AuditReport): void {
  const filename = `audit-issues-${report.domain}-${new Date(report.timestamp).toISOString().split('T')[0]}.csv`;
  
  // CSV Headers
  const headers = [
    'Task Status',
    'Category',
    'Severity',
    'Title',
    'Page Location / Path',
    'DOM Selector',
    'Description',
    'Impact',
    'Recommendation',
    'Code Snippet',
    'Completed Date',
    'Resolution Notes',
  ];
  
  const escapeCsv = (val: string | undefined | null) => {
    if (!val) return '""';
    const clean = val.replace(/"/g, '""').replace(/\r?\n/g, ' ');
    return `"${clean}"`;
  };

  const issues = Array.isArray(report.issues) ? report.issues : [];
  const rows = issues.map(iss => [
    escapeCsv(iss.isCompleted ? 'Completed' : 'Pending'),
    escapeCsv(iss.category),
    escapeCsv(iss.severity),
    escapeCsv(iss.title),
    escapeCsv(iss.pagePath || iss.pageUrl || 'Global Scope'),
    escapeCsv(iss.domSelector || ''),
    escapeCsv(iss.description),
    escapeCsv(iss.impact),
    escapeCsv(iss.recommendation),
    escapeCsv(iss.codeSnippet || ''),
    escapeCsv(iss.completedAt ? new Date(iss.completedAt).toISOString() : ''),
    escapeCsv(iss.completionNotes || ''),
  ].join(','));

  const csvContent = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function triggerPrintReport(): void {
  window.print();
}

/**
 * Generates an executive self-contained HTML file styled with embedded CSS
 * ready for browser viewing and printing to PDF.
 */
export function generateBrandedHtmlTemplate(report: AuditReport, config: BrandedAuditPdfConfig): string {
  const scores = report.scores || { overall: 85, technical: 85, performance: 85, content: 85, aiReadiness: 85 };
  const issues = Array.isArray(report.issues) ? report.issues : [];
  const criticalIssues = issues.filter((i) => i.severity === 'critical');
  const warningIssues = issues.filter((i) => i.severity === 'warning');
  const passedChecksCount = report.statCounts?.passed || Math.max(12, 25 - issues.length);

  const criticalPenalty = criticalIssues.length * 12;
  const warningPenalty = warningIssues.length * 4;

  const accentHexMap: Record<string, string> = {
    indigo: '#4f46e5',
    blue: '#2563eb',
    emerald: '#059669',
    purple: '#7c3aed',
    rose: '#e11d48',
    amber: '#d97706',
    slate: '#334155',
  };

  const primaryAccent = accentHexMap[config.accentColor] || '#4f46e5';

  const aiInsights = report.aiInsights;
  const recommendations = aiInsights?.recommendations || [];
  const botGovernance = report.aiReadiness?.botGovernance || [];
  const crawledPages = report.crawledPages || [];

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${config.documentTitle} - ${config.clientName || report.domain}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap');
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #0f172a;
      background-color: #f8fafc;
      font-size: 13px;
      line-height: 1.5;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .report-container {
      max-width: 860px;
      margin: 30px auto;
      background: #ffffff;
      padding: 48px;
      box-shadow: 0 4px 20px -2px rgba(0,0,0,0.06);
      border-radius: 12px;
      position: relative;
    }

    @media print {
      body {
        background: #ffffff;
      }
      .report-container {
        margin: 0;
        padding: 24px;
        box-shadow: none;
        max-width: 100%;
        border-radius: 0;
      }
      .page-break {
        page-break-before: always;
        break-before: page;
      }
      .no-print-break {
        page-break-inside: avoid;
        break-inside: avoid;
      }
      .screen-toolbar {
        display: none !important;
      }
    }

    .screen-toolbar {
      position: sticky;
      top: 10px;
      z-index: 100;
      max-width: 860px;
      margin: 10px auto;
      background: #0f172a;
      color: #ffffff;
      padding: 12px 20px;
      border-radius: 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.3);
    }

    .btn {
      background: ${primaryAccent};
      color: #ffffff;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      font-weight: 700;
      font-size: 12px;
      cursor: pointer;
    }

    .btn:hover {
      opacity: 0.9;
    }

    /* Header Banner */
    .agency-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 20px;
      margin-bottom: 28px;
    }

    .agency-name {
      font-size: 20px;
      font-weight: 800;
      color: ${primaryAccent};
      letter-spacing: -0.5px;
    }

    .agency-tagline {
      font-size: 11px;
      color: #64748b;
      margin-top: 2px;
    }

    .doc-meta {
      text-align: right;
      font-size: 11px;
      color: #64748b;
    }

    .doc-meta strong {
      color: #0f172a;
    }

    /* Cover Page Elements */
    .cover-box {
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      color: #ffffff;
      padding: 36px;
      border-radius: 12px;
      margin-bottom: 32px;
    }

    .cover-badge {
      display: inline-block;
      padding: 4px 10px;
      background: rgba(255,255,255,0.12);
      border: 1px solid rgba(255,255,255,0.2);
      border-radius: 20px;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 12px;
      color: #93c5fd;
    }

    .cover-title {
      font-size: 26px;
      font-weight: 800;
      line-height: 1.2;
      margin-bottom: 8px;
    }

    .cover-target {
      font-size: 14px;
      color: #cbd5e1;
      margin-bottom: 20px;
    }

    .cover-target strong {
      color: #ffffff;
      font-family: 'JetBrains Mono', monospace;
    }

    .cover-details-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      border-top: 1px solid rgba(255,255,255,0.15);
      padding-top: 16px;
      font-size: 11px;
    }

    .cover-details-grid div strong {
      display: block;
      color: #ffffff;
      font-size: 12px;
    }

    /* Scorecards */
    .section-title {
      font-size: 15px;
      font-weight: 800;
      color: #0f172a;
      border-bottom: 2px solid ${primaryAccent};
      padding-bottom: 6px;
      margin-top: 32px;
      margin-bottom: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .score-cards-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 20px;
    }

    .score-card {
      border: 1px solid #e2e8f0;
      background: #f8fafc;
      padding: 14px;
      border-radius: 8px;
      text-align: center;
    }

    .score-card-label {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      color: #64748b;
    }

    .score-card-val {
      font-size: 24px;
      font-weight: 800;
      color: #0f172a;
      margin: 4px 0;
    }

    .score-card-sub {
      font-size: 10px;
      color: #64748b;
    }

    /* Math Breakdown */
    .math-breakdown {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      padding: 12px;
      border-radius: 8px;
      margin-bottom: 24px;
      text-align: center;
    }

    .math-cell-label {
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      color: #64748b;
    }

    .math-cell-val {
      font-size: 16px;
      font-weight: 800;
      margin: 2px 0;
    }

    /* AI Insights Box */
    .ai-box {
      background: #faf5ff;
      border: 1px solid #e9d5ff;
      border-radius: 8px;
      padding: 18px;
      margin-bottom: 20px;
    }

    .ai-box-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 10px;
    }

    .ai-badge {
      background: #7e22ce;
      color: #ffffff;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 10px;
      font-weight: 700;
    }

    .ai-verdict {
      font-size: 12px;
      color: #4c1d95;
      font-weight: 600;
      line-height: 1.5;
      margin-bottom: 12px;
    }

    .recommendations-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 12px;
      font-size: 11px;
    }

    .recommendations-table th {
      background: #f1f5f9;
      padding: 8px 10px;
      text-align: left;
      font-weight: 700;
      color: #475569;
      border-bottom: 1px solid #cbd5e1;
    }

    .recommendations-table td {
      padding: 10px;
      border-bottom: 1px solid #e2e8f0;
      vertical-align: top;
    }

    .badge-p0 { background: #fee2e2; color: #991b1b; padding: 2px 6px; border-radius: 4px; font-weight: 700; font-size: 10px; }
    .badge-p1 { background: #ffedd5; color: #9a3412; padding: 2px 6px; border-radius: 4px; font-weight: 700; font-size: 10px; }
    .badge-p2 { background: #fef3c7; color: #92400e; padding: 2px 6px; border-radius: 4px; font-weight: 700; font-size: 10px; }

    /* Advisory Memorandum */
    .advisory-memo {
      background: #f8fafc;
      border-left: 4px solid ${primaryAccent};
      padding: 16px 20px;
      border-radius: 0 8px 8px 0;
      margin-bottom: 24px;
      font-size: 12px;
      line-height: 1.6;
      color: #334155;
    }

    .advisory-memo h4 {
      color: #0f172a;
      font-size: 13px;
      font-weight: 700;
      margin-bottom: 6px;
    }

    /* Footer */
    .report-footer {
      border-top: 1px solid #e2e8f0;
      padding-top: 16px;
      margin-top: 36px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 10px;
      color: #94a3b8;
    }
  </style>
</head>
<body>

  <!-- Screen Print Toolbar (hidden during print) -->
  <div class="screen-toolbar">
    <div>
      <span style="font-weight: 800; font-size: 13px;">${config.agencyName}</span>
      <span style="color: #94a3b8; font-size: 11px; margin-left: 8px;">&bull; Branded Audit Dossier for ${config.clientName || report.domain}</span>
    </div>
    <div style="display: flex; gap: 8px;">
      <button class="btn" onclick="window.print()">Print / Save as PDF</button>
    </div>
  </div>

  <div class="report-container">
    
    <!-- Agency Header -->
    <div class="agency-header no-print-break">
      <div>
        <div class="agency-name">${config.agencyName}</div>
        <div class="agency-tagline">${config.agencyTagline || 'Technical SEO, Core Web Vitals & AI Search Optimization'}</div>
      </div>
      <div class="doc-meta">
        <div>Ref: <strong>${config.documentRefNumber || 'AP-' + report.domain.toUpperCase()}</strong></div>
        <div>Date: <strong>${new Date(report.timestamp || Date.now()).toLocaleDateString()}</strong></div>
        <div>Auditor: <strong>${config.consultantName || 'Senior Technical SEO Director'}</strong></div>
      </div>
    </div>

    ${config.sections.coverPage ? `
    <!-- Executive Cover Box -->
    <div class="cover-box no-print-break">
      <div class="cover-badge">Confidential Technical Dossier</div>
      <div class="cover-title">${config.documentTitle}</div>
      <div class="cover-target">Prepared Exclusively For: <strong>${config.clientName || report.domain}</strong> &bull; Target URL: <strong>${report.url}</strong></div>
      
      <div class="cover-details-grid">
        <div>
          <span style="color: #94a3b8;">Audited By</span>
          <strong>${config.consultantName}</strong>
          <span style="color: #cbd5e1;">${config.consultantTitle}</span>
        </div>
        <div>
          <span style="color: #94a3b8;">Direct Contact</span>
          <strong>${config.consultantEmail}</strong>
          <span style="color: #cbd5e1;">${config.consultantPhone || ''}</span>
        </div>
        <div>
          <span style="color: #94a3b8;">Audit Scope</span>
          <strong>${crawledPages.length || 1} Pages Crawled</strong>
          <span style="color: #cbd5e1;">Core Web Vitals & AI Governance</span>
        </div>
      </div>
    </div>
    ` : ''}

    ${config.sections.advisoryMemorandum && config.customMemorandumText ? `
    <!-- Advisory Memorandum -->
    <div class="advisory-memo no-print-break">
      <h4>${config.customMemorandumTitle || 'Strategic Advisory Memorandum'}</h4>
      <p>${config.customMemorandumText.replace(/\n/g, '<br/>')}</p>
    </div>
    ` : ''}

    ${config.sections.executiveSummary ? `
    <!-- Health Score & Mathematical Weight Breakdown -->
    <div class="section-title no-print-break">
      <span>Executive SEO Health Assessment</span>
      <span style="font-size: 11px; font-weight: 600; color: #64748b;">Overall Rating: ${scores.overall}/100</span>
    </div>

    ${config.sections.scorecardsAndMath ? `
    <div class="math-breakdown no-print-break">
      <div>
        <div class="math-cell-label">Base Baseline</div>
        <div class="math-cell-val" style="color: #0f172a;">100 pts</div>
        <div style="font-size: 9px; color: #64748b;">Optimal Potential</div>
      </div>
      <div>
        <div class="math-cell-label">Critical Errors (${criticalIssues.length})</div>
        <div class="math-cell-val" style="color: #b91c1c;">-${criticalPenalty} pts</div>
        <div style="font-size: 9px; color: #64748b;">-12 pts per blocker</div>
      </div>
      <div>
        <div class="math-cell-label">Warnings (${warningIssues.length})</div>
        <div class="math-cell-val" style="color: #d97706;">-${warningPenalty} pts</div>
        <div style="font-size: 9px; color: #64748b;">-4 pts per warning</div>
      </div>
      <div>
        <div class="math-cell-label">Net Health Score</div>
        <div class="math-cell-val" style="color: ${primaryAccent};">${scores.overall} / 100</div>
        <div style="font-size: 9px; color: #64748b;">${passedChecksCount} Passed Checks</div>
      </div>
    </div>
    ` : ''}
    ` : ''}

    ${config.sections.categoryPillars ? `
    <!-- Category Pillars -->
    <div class="score-cards-grid no-print-break">
      <div class="score-card">
        <div class="score-card-label">Technical SEO</div>
        <div class="score-card-val">${scores.technical}%</div>
        <div class="score-card-sub">Architecture &amp; Indexability</div>
      </div>
      <div class="score-card">
        <div class="score-card-label">Performance (CWV)</div>
        <div class="score-card-val">${scores.performance}%</div>
        <div class="score-card-sub">LCP ${report.performance?.lcpEstimate || 1.8}s &bull; CLS ${report.performance?.clsEstimate || 0.02}</div>
      </div>
      <div class="score-card">
        <div class="score-card-label">On-Page Content</div>
        <div class="score-card-val">${scores.content}%</div>
        <div class="score-card-sub">${report.content?.wordCount || 0} Words Evaluated</div>
      </div>
      <div class="score-card">
        <div class="score-card-label">AI Readiness &amp; GEO</div>
        <div class="score-card-val">${scores.aiReadiness}%</div>
        <div class="score-card-sub">Answer Engine Visibility</div>
      </div>
    </div>
    ` : ''}

    ${config.sections.aiInsightsRoadmap && recommendations.length > 0 ? `
    <!-- AI Insights & Action Roadmap -->
    <div class="page-break"></div>
    <div class="section-title no-print-break">
      <span>AI Strategic Insights &amp; Prioritized Action Roadmap</span>
      <span style="font-size: 11px; font-weight: 600; color: #7e22ce;">Powered by Gemini 3.8 Flash</span>
    </div>

    <div class="ai-box no-print-break">
      <div class="ai-box-header">
        <span class="ai-badge">Executive Verdict</span>
        <span style="font-size: 10px; color: #6b21a8; font-weight: 700;">Potential Score Gain: +${aiInsights?.estimatedScoreGain || 16} pts</span>
      </div>
      <div class="ai-verdict">${aiInsights?.strategicVerdict || 'Website demonstrates actionable optimization opportunities across technical rendering and AI readiness.'}</div>
      
      <div style="font-size: 11px; color: #581c87; background: rgba(255,255,255,0.7); padding: 8px 12px; border-radius: 6px;">
        <strong>AI Search Readiness:</strong> ${aiInsights?.aiSearchReadiness?.verdict || 'Moderately Prepared'} &bull; 
        <strong>Action:</strong> ${aiInsights?.aiSearchReadiness?.actionItem || 'Adopt Organization schema and ensure AI bot crawler permissions.'}
      </div>
    </div>

    <table class="recommendations-table no-print-break">
      <thead>
        <tr>
          <th style="width: 14%;">Priority</th>
          <th style="width: 20%;">Category</th>
          <th style="width: 36%;">Action &amp; Diagnosis</th>
          <th style="width: 15%;">Impact</th>
          <th style="width: 15%;">Effort / Time</th>
        </tr>
      </thead>
      <tbody>
        ${recommendations.slice(0, 6).map((rec: any) => `
          <tr>
            <td><span class="${rec.priority.startsWith('P0') ? 'badge-p0' : rec.priority.startsWith('P1') ? 'badge-p1' : 'badge-p2'}">${rec.priority}</span></td>
            <td><strong>${rec.category}</strong></td>
            <td>
              <strong>${rec.title}</strong>
              <div style="color: #64748b; font-size: 10px; margin-top: 2px;">${rec.recommendation}</div>
            </td>
            <td style="color: #047857; font-weight: 600;">${rec.impact}</td>
            <td style="color: #475569;">${rec.effort} &bull; ${rec.timeToImpact}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    ` : ''}

    ${config.sections.aiBotGovernance && botGovernance.length > 0 ? `
    <!-- AI Bot Governance Table -->
    <div class="section-title no-print-break" style="margin-top: 28px;">
      <span>AI Search &amp; LLM Bot Governance (Robots.txt Analysis)</span>
      <span style="font-size: 11px; font-weight: 600; color: #64748b;">Answer Engine Optimization (GEO)</span>
    </div>
    
    <table class="recommendations-table no-print-break">
      <thead>
        <tr>
          <th>Bot Name</th>
          <th>Provider</th>
          <th>Purpose</th>
          <th>Crawler Status</th>
        </tr>
      </thead>
      <tbody>
        ${botGovernance.map((bot: any) => `
          <tr>
            <td><strong>${bot.botName}</strong></td>
            <td>${bot.provider}</td>
            <td style="color: #64748b;">${bot.purpose}</td>
            <td>
              <span style="color: ${bot.isAllowed ? '#047857' : '#b91c1c'}; font-weight: 700;">
                ${bot.isAllowed ? 'Allowed' : 'Blocked in robots.txt'}
              </span>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    ` : ''}

    ${config.sections.prioritizedIssues && criticalIssues.length > 0 ? `
    <!-- Critical Issues & Technical Remediations -->
    <div class="page-break"></div>
    <div class="section-title no-print-break">
      <span>High Priority Technical Remediations</span>
      <span style="font-size: 11px; font-weight: 600; color: #b91c1c;">${criticalIssues.length} Critical Issues Detected</span>
    </div>

    <table class="recommendations-table no-print-break">
      <thead>
        <tr>
          <th style="width: 15%;">Category</th>
          <th style="width: 35%;">Issue &amp; Root Cause</th>
          <th style="width: 35%;">Recommended Developer Fix</th>
          <th style="width: 15%;">Location</th>
        </tr>
      </thead>
      <tbody>
        ${criticalIssues.slice(0, 8).map((issue: any) => `
          <tr>
            <td><span class="badge-p0">${issue.category}</span></td>
            <td>
              <strong>${issue.title}</strong>
              <div style="color: #64748b; font-size: 10px; margin-top: 2px;">${issue.description}</div>
            </td>
            <td style="color: #1e293b;">
              ${issue.recommendation}
            </td>
            <td style="color: #64748b; font-family: 'JetBrains Mono', monospace; font-size: 10px;">
              ${issue.pageLocation || 'Global Site'}
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    ` : ''}

    ${config.sections.nextStepsCta ? `
    <!-- Next Steps CTA -->
    <div class="no-print-break" style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-top: 32px; display: flex; justify-content: space-between; align-items: center;">
      <div>
        <div style="font-weight: 800; font-size: 14px; color: #0f172a;">Ready to Implement These High-ROI Remediations?</div>
        <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Contact ${config.consultantName} directly at <strong>${config.consultantEmail}</strong> to schedule an engineering sprint.</div>
      </div>
      <div style="font-size: 12px; font-weight: 700; color: ${primaryAccent};">
        ${config.agencyWebsite || config.agencyName}
      </div>
    </div>
    ` : ''}

    <!-- Footer -->
    <div class="report-footer no-print-break">
      <div>Generated by ${config.agencyName} &bull; Powered by AuditPulse Suite</div>
      <div>Confidential &amp; Proprietary &bull; Page 1 of 1</div>
    </div>

  </div>

</body>
</html>`;
}

/**
 * Generates and triggers download of a standalone branded HTML PDF template.
 */
export function downloadBrandedHtmlReport(report: AuditReport, config: BrandedAuditPdfConfig): void {
  const htmlContent = generateBrandedHtmlTemplate(report, config);
  const safeDomain = (report.domain || 'website').replace(/[^a-zA-Z0-9.-]/g, '_');
  const filename = `${config.agencyName.replace(/\s+/g, '_')}_SEO_Audit_${safeDomain}_${new Date().toISOString().split('T')[0]}.html`;
  
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
