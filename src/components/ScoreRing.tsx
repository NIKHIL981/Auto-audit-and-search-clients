import React from 'react';

interface ScoreRingProps {
  score: number;
  label: string;
  size?: 'sm' | 'md' | 'lg';
  showGrade?: boolean;
  sublabel?: string;
  id?: string;
}

export const ScoreRing: React.FC<ScoreRingProps> = ({
  score,
  label,
  size = 'md',
  showGrade = false,
  sublabel,
  id,
}) => {
  const getGrade = (s: number) => {
    if (s >= 90) return 'A+';
    if (s >= 80) return 'A';
    if (s >= 70) return 'B';
    if (s >= 60) return 'C';
    if (s >= 50) return 'D';
    return 'F';
  };

  const getColor = (s: number) => {
    if (s >= 85) return { stroke: '#10b981', text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' };
    if (s >= 70) return { stroke: '#3b82f6', text: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' };
    if (s >= 50) return { stroke: '#f59e0b', text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' };
    return { stroke: '#ef4444', text: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/30' };
  };

  const dim = size === 'lg' ? 140 : size === 'md' ? 104 : 76;
  const strokeWidth = size === 'lg' ? 10 : size === 'md' ? 8 : 6;
  const radius = (dim - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const colors = getColor(score);

  return (
    <div id={id} className="flex flex-col items-center text-center">
      <div className="relative flex items-center justify-center" style={{ width: dim, height: dim }}>
        <svg className="transform -rotate-90" width={dim} height={dim}>
          {/* Track */}
          <circle
            cx={dim / 2}
            cy={dim / 2}
            r={radius}
            stroke="#1e293b"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Animated Value */}
          <circle
            cx={dim / 2}
            cy={dim / 2}
            r={radius}
            stroke={colors.stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`font-extrabold tracking-tight ${size === 'lg' ? 'text-3xl' : size === 'md' ? 'text-2xl' : 'text-lg'} ${colors.text}`}>
            {score}
          </span>
          {showGrade && (
            <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${colors.bg} ${colors.text} border ${colors.border}`}>
              Grade {getGrade(score)}
            </span>
          )}
        </div>
      </div>

      <span className={`mt-2 font-semibold tracking-wide text-slate-200 ${size === 'lg' ? 'text-sm' : 'text-xs'}`}>
        {label}
      </span>
      {sublabel && (
        <span className="text-[11px] text-slate-400 mt-0.5 max-w-[120px] leading-tight">
          {sublabel}
        </span>
      )}
    </div>
  );
};
