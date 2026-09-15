import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  HelpCircle,
  ExternalLink,
  Target,
  Sparkles,
  Info,
  CheckCircle2,
  BookOpen,
  X,
  Layers,
} from 'lucide-react';
import { getGlossaryTerm, GlossaryEntry, SEO_GLOSSARY_DATABASE } from '../utils/seoGlossary';
import { useSeoGlossary } from '../context/TooltipContext';

export interface SeoTooltipProps {
  /**
   * Term key or alias (e.g. 'eeat', 'Core Web Vitals', 'lcp', 'cls', 'inp', 'schema', 'canonical', 'robots')
   */
  term?: string;
  /**
   * Optional custom glossary entry override
   */
  customEntry?: Partial<GlossaryEntry>;
  /**
   * Content to wrap with the tooltip trigger. If omitted, uses term's shortName or term title.
   */
  children?: React.ReactNode;
  /**
   * Display variant:
   * - 'inline': wrapped with subtle dotted underline and hover cue (default)
   * - 'icon': renders only an info/help icon next to content or alone
   * - 'badge': renders as a clickable metric chip
   * - 'bare': no underline, just trigger behavior on children
   */
  variant?: 'inline' | 'icon' | 'badge' | 'bare';
  /**
   * Whether to show an info icon next to children in inline mode
   */
  showIcon?: boolean;
  /**
   * Preferred placement: 'top' | 'bottom' | 'auto'
   */
  preferredPlacement?: 'top' | 'bottom' | 'auto';
  /**
   * Optional callback when user clicks "Explore in Glossary"
   */
  onOpenGlossary?: (termId?: string) => void;
  /**
   * Custom CSS class for trigger wrapper
   */
  className?: string;
}

export const SeoTooltip: React.FC<SeoTooltipProps> = ({
  term,
  customEntry,
  children,
  variant = 'inline',
  showIcon = false,
  preferredPlacement = 'auto',
  onOpenGlossary,
  className = '',
}) => {
  const glossary = useSeoGlossary();
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number; placement: 'top' | 'bottom' }>({
    top: 0,
    left: 0,
    placement: 'top',
  });

  const triggerRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutEnterRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutLeaveRef = useRef<NodeJS.Timeout | null>(null);

  const entry: GlossaryEntry | undefined = customEntry
    ? {
        id: customEntry.id || 'custom',
        shortName: customEntry.shortName || term || 'SEO Metric',
        term: customEntry.term || term || 'SEO Metric',
        category: customEntry.category || 'Technical & Crawlability',
        definition: customEntry.definition || 'Key technical search engine metric.',
        whyItMatters: customEntry.whyItMatters || 'Directly influences search visibility and user retention.',
        benchmark: customEntry.benchmark || 'Industry standard optimal score',
        actionableTip: customEntry.actionableTip || 'Follow Google Search Central best practices.',
        aliases: customEntry.aliases || [],
        referenceUrl: customEntry.referenceUrl,
      }
    : getGlossaryTerm(term);

  // Position calculation with viewport boundaries
  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const tooltipWidth = 360; // Max card width
    const tooltipHeight = 280; // Estimated card height
    const padding = 12;

    const spaceAbove = rect.top;
    const spaceBelow = window.innerHeight - rect.bottom;

    let placement: 'top' | 'bottom' = 'top';
    if (preferredPlacement === 'top') {
      placement = spaceAbove >= tooltipHeight || spaceAbove >= spaceBelow ? 'top' : 'bottom';
    } else if (preferredPlacement === 'bottom') {
      placement = spaceBelow >= tooltipHeight || spaceBelow >= spaceAbove ? 'bottom' : 'top';
    } else {
      // Auto: prefer top unless not enough space
      placement = spaceAbove >= 260 ? 'top' : 'bottom';
    }

    let left = rect.left + rect.width / 2 - tooltipWidth / 2;

    // Viewport clamping
    if (left < padding) {
      left = padding;
    } else if (left + tooltipWidth > window.innerWidth - padding) {
      left = window.innerWidth - tooltipWidth - padding;
    }

    let top = 0;
    if (placement === 'top') {
      top = rect.top - 8;
    } else {
      top = rect.bottom + 8;
    }

    setCoords({ top, left, placement });
  }, [preferredPlacement]);

  const handleMouseEnter = () => {
    if (timeoutLeaveRef.current) {
      clearTimeout(timeoutLeaveRef.current);
      timeoutLeaveRef.current = null;
    }
    timeoutEnterRef.current = setTimeout(() => {
      updatePosition();
      setIsOpen(true);
    }, 120);
  };

  const handleMouseLeave = () => {
    if (timeoutEnterRef.current) {
      clearTimeout(timeoutEnterRef.current);
      timeoutEnterRef.current = null;
    }
    timeoutLeaveRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 180);
  };

  const handleToggleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isOpen) {
      updatePosition();
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  // Close on Escape or click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node) &&
        tooltipRef.current &&
        !tooltipRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, updatePosition]);

  if (!entry) {
    // If term not found in database, just render children gracefully
    return <>{children || term}</>;
  }

  // Category visual palette
  const getCategoryStyles = (category: string) => {
    switch (category) {
      case 'Core Web Vitals & Speed':
        return {
          pill: 'bg-blue-50 text-blue-700 border-blue-200',
          accent: 'border-l-blue-500',
          headerBg: 'from-blue-50/80 via-white to-white',
          dot: 'bg-blue-500',
        };
      case 'Content & Authority (EEAT)':
        return {
          pill: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          accent: 'border-l-emerald-500',
          headerBg: 'from-emerald-50/80 via-white to-white',
          dot: 'bg-emerald-500',
        };
      case 'AI & Generative Search':
        return {
          pill: 'bg-purple-50 text-purple-700 border-purple-200',
          accent: 'border-l-purple-500',
          headerBg: 'from-purple-50/80 via-white to-white',
          dot: 'bg-purple-500',
        };
      case 'Structured Data & Schema':
        return {
          pill: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          accent: 'border-l-indigo-500',
          headerBg: 'from-indigo-50/80 via-white to-white',
          dot: 'bg-indigo-500',
        };
      default:
        return {
          pill: 'bg-amber-50 text-amber-700 border-amber-200',
          accent: 'border-l-amber-500',
          headerBg: 'from-amber-50/80 via-white to-white',
          dot: 'bg-amber-500',
        };
    }
  };

  const style = getCategoryStyles(entry.category);

  return (
    <>
      {/* Trigger element */}
      <span
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleToggleClick}
        onFocus={handleMouseEnter}
        onBlur={handleMouseLeave}
        tabIndex={0}
        role="button"
        aria-label={`SEO Metric Help: ${entry.shortName}`}
        aria-expanded={isOpen}
        className={`inline-flex items-center gap-1 cursor-help transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded ${
          variant === 'inline'
            ? 'border-b border-dashed border-slate-400/80 hover:border-blue-600 hover:text-blue-600 font-medium'
            : variant === 'badge'
            ? 'px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-200'
            : variant === 'icon'
            ? 'p-0.5 rounded text-slate-400 hover:text-blue-600 transition-colors'
            : ''
        } ${className}`}
      >
        {variant === 'icon' ? (
          children || <HelpCircle className="w-3.5 h-3.5 inline-block text-slate-400 hover:text-blue-600" />
        ) : (
          <>
            <span>{children || entry.shortName}</span>
            {showIcon && <HelpCircle className="w-3 h-3 text-slate-400 shrink-0 inline-block" />}
          </>
        )}
      </span>

      {/* Floating Rich Tooltip Overlay */}
      {isOpen && (
        <div
          ref={tooltipRef}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          style={{
            position: 'fixed',
            top: coords.placement === 'top' ? undefined : `${coords.top}px`,
            bottom: coords.placement === 'top' ? `${window.innerHeight - coords.top}px` : undefined,
            left: `${coords.left}px`,
            zIndex: 9999,
          }}
          className="w-[360px] max-w-[calc(100vw-24px)] pointer-events-auto animate-in fade-in zoom-in-95 duration-150"
        >
          <div
            className={`bg-white rounded-2xl shadow-xl border border-slate-200/90 text-slate-800 text-left overflow-hidden ring-1 ring-black/5 ${style.accent} border-l-4`}
          >
            {/* Header with Category & Close */}
            <div className={`p-3.5 border-b border-slate-100 bg-gradient-to-r ${style.headerBg} flex items-start justify-between gap-2`}>
              <div>
                <div className="flex items-center gap-1.5 flex-wrap mb-1">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${style.pill} flex items-center gap-1`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                    {entry.category}
                  </span>
                </div>
                <h4 className="text-sm font-black text-slate-950 leading-tight">
                  {entry.shortName}{' '}
                  {entry.shortName !== entry.term && (
                    <span className="text-xs font-medium text-slate-500 block sm:inline">
                      ({entry.term})
                    </span>
                  )}
                </h4>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-200/60 text-slate-400 hover:text-slate-600 transition-colors"
                title="Close"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Body Content */}
            <div className="p-3.5 space-y-3 text-xs">
              {/* Definition */}
              <div>
                <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-0.5 flex items-center gap-1">
                  <Info className="w-3 h-3 text-blue-500" />
                  <span>What It Measures</span>
                </div>
                <p className="text-slate-700 leading-relaxed font-normal">
                  {entry.definition}
                </p>
              </div>

              {/* Target / Benchmark */}
              <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200/80">
                <div className="text-[10px] font-bold uppercase text-slate-500 tracking-wider mb-0.5 flex items-center gap-1">
                  <Target className="w-3 h-3 text-emerald-600" />
                  <span>Optimal Benchmark</span>
                </div>
                <div className="text-[11px] font-semibold text-slate-900">
                  {entry.benchmark}
                </div>
              </div>

              {/* Why Google Cares */}
              <div>
                <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-0.5 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>Search Ranking Impact</span>
                </div>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  {entry.whyItMatters}
                </p>
              </div>

              {/* Actionable Tip */}
              <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-2.5 text-[11px] text-emerald-950">
                <div className="font-bold text-emerald-900 flex items-center gap-1 mb-0.5 text-[10px] uppercase tracking-wider">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>Optimization Playbook</span>
                </div>
                <p className="text-emerald-900 leading-snug">
                  {entry.actionableTip}
                </p>
              </div>
            </div>

            {/* Footer actions */}
            <div className="px-3.5 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2 text-[11px]">
              {entry.referenceUrl ? (
                <a
                  href={entry.referenceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-1 hover:underline"
                >
                  <span>Google Docs</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              ) : (
                <span className="text-slate-400 text-[10px]">SEO Core Standard</span>
              )}

              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  if (onOpenGlossary) {
                    onOpenGlossary(entry.id);
                  } else if (glossary?.openGlossary) {
                    glossary.openGlossary(entry.id);
                  }
                }}
                className="text-slate-600 hover:text-slate-900 font-bold inline-flex items-center gap-1 hover:underline cursor-pointer"
                title="Browse full SEO Knowledge Base & Glossary"
              >
                <BookOpen className="w-3 h-3 text-slate-500" />
                <span>All Metrics Guide</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

/**
 * Drop-in inline component for placing a term with an automatic tooltip
 * Example: <SeoTerm term="eeat" /> or <SeoTerm term="cls">Cumulative Layout Shift</SeoTerm>
 */
export const SeoTerm: React.FC<{
  term: string;
  children?: React.ReactNode;
  showIcon?: boolean;
  className?: string;
  onOpenGlossary?: (termId?: string) => void;
}> = ({ term, children, showIcon, className, onOpenGlossary }) => {
  return (
    <SeoTooltip
      term={term}
      showIcon={showIcon}
      className={className}
      onOpenGlossary={onOpenGlossary}
    >
      {children}
    </SeoTooltip>
  );
};
