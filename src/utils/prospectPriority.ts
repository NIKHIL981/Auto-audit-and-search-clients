import { ClientProspect } from '../types';

export interface PotentialRoiBreakdown {
  score: number; // 0 - 100
  aiReadinessScore: number;
  aiOpportunityGap: number; // 100 - aiReadinessScore
  technicalSeverityScore: number; // 0 - 100
  deficiencyCount: number;
  seoHealthDeficit: number; // 100 - seoHealthScore
  performanceDeficit: number; // 100 - performanceScore
  tier: 'Elite Priority' | 'High Priority' | 'Moderate' | 'Standard';
  tierColor: string;
  badgeBg: string;
  summary: string;
}

/**
 * Calculates the combined Potential ROI score based on existing AI Readiness scores
 * and discovered technical severity.
 * 
 * - AI Opportunity Gap: Lower AI readiness (0-50) means the business is invisible on Perplexity,
 *   ChatGPT, and Gemini — optimizing this delivers transformative client upside.
 * - Technical Severity: Derived from SEO health deficits, Core Web Vitals/speed latency, and
 *   critical technical deficiencies (missing titles, broken tags, lack of schema).
 * 
 * When combined, businesses with high technical severity and low AI readiness provide
 * the highest possible ROI for an agency engagement.
 */
export function calculatePotentialRoi(prospect: ClientProspect): PotentialRoiBreakdown {
  const aiReadiness = prospect.aiReadinessScore ?? prospect.clientAuditReport?.aiReadinessScore ?? 50;
  const seoHealth = prospect.seoHealthScore ?? 60;
  const performance = prospect.performanceScore ?? prospect.clientAuditReport?.performanceScore ?? 55;
  const deficiencies = prospect.topDeficiencies || [];

  // 1. AI Opportunity Gap (0 - 100): Lower readiness = higher optimization upside
  const aiOpportunityGap = Math.max(0, 100 - aiReadiness);

  // 2. Discovered Technical Severity (0 - 100):
  const seoHealthDeficit = Math.max(0, 100 - seoHealth);
  const performanceDeficit = Math.max(0, 100 - performance);
  const deficiencySeverity = Math.min(100, deficiencies.length * 16);

  const technicalSeverityScore = Math.min(
    100,
    Math.round(
      seoHealthDeficit * 0.45 +
      performanceDeficit * 0.35 +
      deficiencySeverity * 0.20
    )
  );

  // 3. Combined Potential ROI Score (0 - 100):
  // 50% AI Search Opportunity Gap + 50% Discovered Technical Severity
  const rawScore = Math.round(aiOpportunityGap * 0.50 + technicalSeverityScore * 0.50);
  const score = Math.min(100, Math.max(15, rawScore));

  let tier: PotentialRoiBreakdown['tier'] = 'Standard';
  let tierColor = 'text-slate-600';
  let badgeBg = 'bg-slate-100 text-slate-700 border-slate-200';
  let summary = 'Standard optimization upside across technical and AI visibility.';

  if (score >= 80) {
    tier = 'Elite Priority';
    tierColor = 'text-purple-700';
    badgeBg = 'bg-purple-50 text-purple-700 border-purple-300';
    summary = 'Immediate transformative upside: severe technical bottlenecks combined with zero AI search presence.';
  } else if (score >= 65) {
    tier = 'High Priority';
    tierColor = 'text-emerald-700';
    badgeBg = 'bg-emerald-50 text-emerald-700 border-emerald-300';
    summary = 'High client ROI: notable technical defects and significant AI readiness gap.';
  } else if (score >= 50) {
    tier = 'Moderate';
    tierColor = 'text-amber-700';
    badgeBg = 'bg-amber-50 text-amber-700 border-amber-300';
    summary = 'Moderate ROI potential with selective technical and AI quick wins.';
  }

  return {
    score,
    aiReadinessScore: aiReadiness,
    aiOpportunityGap,
    technicalSeverityScore,
    deficiencyCount: deficiencies.length,
    seoHealthDeficit,
    performanceDeficit,
    tier,
    tierColor,
    badgeBg,
    summary,
  };
}
