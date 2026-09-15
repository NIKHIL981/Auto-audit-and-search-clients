import React, { useEffect, useState } from 'react';
import { ShieldCheck, AlertTriangle, AlertOctagon, Info, ChevronDown, ChevronUp, Scale } from 'lucide-react';
import { AuditIssue } from '../types';

interface GaugeChartProps {
  score: number;
  size?: number;
  label?: string;
  sublabel?: string;
  issues?: AuditIssue[];
  criticalCount?: number;
  warningCount?: number;
  passedCount?: number;
}

export const GaugeChart: React.FC<GaugeChartProps> = ({
  score,
  size = 230,
  label = 'SEO Health Score',
  sublabel = 'Calculated from weighted issue severity deductions',
  issues = [],
  criticalCount,
  warningCount,
  passedCount,
}) => {
  const [animatedScore, setAnimatedScore] = useState(0);
  const [showBreakdown, setShowBreakdown] = useState(false);

  // Compute issue counts from issues if not directly provided
  const errors = criticalCount ?? issues.filter((i) => i.severity === 'critical').length;
  const warnings = warningCount ?? issues.filter((i) => i.severity === 'warning').length;
  const passed = passedCount ?? Math.max(12, 25 - errors - warnings);

  // Weight formula:
  // Base = 100 points
  // Critical errors: -12 points each
  // Warnings: -4 points each
  const criticalWeight = 12;
  const warningWeight = 4;
  const criticalPenalty = errors * criticalWeight;
  const warningPenalty = warnings * warningWeight;
  const aggregateScoreFromWeights = Math.max(25, Math.min(100, 100 - criticalPenalty - warningPenalty));

  // The actual score displayed - use aggregateScoreFromWeights or score
  const targetScore = Math.round(score || aggregateScoreFromWeights);

  // Smooth numeric counter animation
  useEffect(() => {
    let startTimestamp: number | null = null;
    const duration = 1200; // 1.2 seconds

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // Ease out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(easeProgress * targetScore));

      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };

    const animId = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(animId);
  }, [targetScore]);

  // Geometry calculation for full circular gauge with top start
  const strokeWidth = 14;
  const center = size / 2;
  const radius = center - strokeWidth - 8;
  const circumference = 2 * Math.PI * radius;
  // Circular gauge progress
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

  // Grade and color status
  const getStatus = (val: number) => {
    if (val >= 90) {
      return {
        grade: 'A+',
        statusText: 'Optimal Standing',
        strokeColor: '#10b981', // emerald-500
        gradientId: 'gauge-emerald',
        gradientStart: '#34d399',
        gradientEnd: '#059669',
        glowColor: 'rgba(16, 185, 129, 0.25)',
        badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      };
    }
    if (val >= 80) {
      return {
        grade: 'A',
        statusText: 'Good Standing',
        strokeColor: '#3b82f6', // blue-500
        gradientId: 'gauge-blue',
        gradientStart: '#60a5fa',
        gradientEnd: '#2563eb',
        glowColor: 'rgba(59, 130, 246, 0.25)',
        badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
      };
    }
    if (val >= 65) {
      return {
        grade: 'B',
        statusText: 'Needs Improvement',
        strokeColor: '#f59e0b', // amber-500
        gradientId: 'gauge-amber',
        gradientStart: '#fbbf24',
        gradientEnd: '#d97706',
        glowColor: 'rgba(245, 158, 11, 0.25)',
        badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
      };
    }
    return {
      grade: 'C',
      statusText: 'Critical Attention',
      strokeColor: '#ef4444', // rose-500
      gradientId: 'gauge-rose',
      gradientStart: '#f87171',
      gradientEnd: '#dc2626',
      glowColor: 'rgba(239, 68, 68, 0.25)',
      badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
    };
  };

  const status = getStatus(targetScore);

  // Generate 40 subtle tick marks around the perimeter
  const tickCount = 36;
  const ticks = Array.from({ length: tickCount }).map((_, i) => {
    const angle = (i * 360) / tickCount - 90; // Start at top
    const radian = (angle * Math.PI) / 180;
    const innerR = radius - 13;
    const outerR = radius - 9;
    const x1 = center + innerR * Math.cos(radian);
    const y1 = center + innerR * Math.sin(radian);
    const x2 = center + outerR * Math.cos(radian);
    const y2 = center + outerR * Math.sin(radian);
    const isMajor = i % 9 === 0; // 0, 25, 50, 75%
    return { x1, y1, x2, y2, isMajor };
  });

  return (
    <div className="flex flex-col items-center text-center">
      {/* Large SVG Circular Gauge */}
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="overflow-visible"
        >
          <defs>
            <linearGradient id={status.gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={status.gradientStart} />
              <stop offset="100%" stopColor={status.gradientEnd} />
            </linearGradient>
            <filter id="gauge-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor={status.strokeColor} floodOpacity="0.3" />
            </filter>
          </defs>

          {/* Perimeter Tick Marks */}
          <g className="opacity-40">
            {ticks.map((t, idx) => (
              <line
                key={idx}
                x1={t.x1}
                y1={t.y1}
                x2={t.x2}
                y2={t.y2}
                stroke={t.isMajor ? '#94a3b8' : '#cbd5e1'}
                strokeWidth={t.isMajor ? 1.5 : 1}
              />
            ))}
          </g>

          {/* Background Circular Track */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth={strokeWidth}
            className="opacity-70"
          />

          {/* Animated Value Arc (Rotating from top 12 o'clock position) */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={`url(#${status.gradientId})`}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${center} ${center})`}
            className="transition-all duration-1000 ease-out"
            filter="url(#gauge-glow)"
          />
        </svg>

        {/* Center Content Display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
          {/* Letter Grade Pill */}
          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border shadow-2xs mb-0.5 ${status.badgeBg}`}>
            GRADE {status.grade}
          </span>

          {/* Large Animated Numerical Score */}
          <div className="flex items-baseline justify-center gap-0.5">
            <span className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight leading-none">
              {animatedScore}
            </span>
            <span className="text-sm sm:text-base font-bold text-slate-400">/100</span>
          </div>

          {/* Status Label */}
          <span className="text-[11px] font-bold text-slate-600 mt-1">
            {status.statusText}
          </span>
        </div>
      </div>

      {/* Label and Details */}
      <div className="mt-2 flex flex-col items-center">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-bold text-slate-900">{label}</span>
          <button
            type="button"
            onClick={() => setShowBreakdown(!showBreakdown)}
            className="p-0.5 rounded-md hover:bg-slate-200/60 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            title="Inspect issue weight deductions"
          >
            {showBreakdown ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
        {sublabel && <p className="text-[11px] text-slate-500 mt-0.5 max-w-xs">{sublabel}</p>}

        {/* Expandable Mathematical Weight Breakdown Panel */}
        {showBreakdown && (
          <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-left text-xs max-w-xs w-full shadow-xs animate-scaleIn">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-200 font-bold text-slate-800 text-[11px]">
              <span className="flex items-center gap-1">
                <Scale className="w-3.5 h-3.5 text-blue-600" />
                Issue Weights Breakdown
              </span>
              <span className="text-slate-500">100 Base</span>
            </div>

            <div className="mt-2 space-y-1.5 text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  Base Score:
                </span>
                <span className="font-mono font-bold text-slate-700">100 pts</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-rose-600 flex items-center gap-1">
                  <AlertOctagon className="w-3 h-3" />
                  {errors} Critical ({criticalWeight}pts ea):
                </span>
                <span className="font-mono font-bold text-rose-600">
                  {criticalPenalty > 0 ? `-${criticalPenalty} pts` : '0 pts'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-amber-600 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {warnings} Warnings ({warningWeight}pts ea):
                </span>
                <span className="font-mono font-bold text-amber-600">
                  {warningPenalty > 0 ? `-${warningPenalty} pts` : '0 pts'}
                </span>
              </div>

              <div className="pt-1.5 border-t border-slate-200 flex items-center justify-between font-bold text-slate-900">
                <span>Aggregate Health:</span>
                <span className="font-mono text-blue-700 font-extrabold">{targetScore} / 100</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const CircularHealthGauge = GaugeChart;
