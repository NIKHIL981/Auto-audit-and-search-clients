import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Search,
  X,
  Target,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  Filter,
  Layers,
  HelpCircle,
  Zap,
  ShieldCheck,
  BrainCircuit,
  Database,
  Info,
} from 'lucide-react';
import { getAllGlossaryTerms, GlossaryEntry, SEO_GLOSSARY_DATABASE } from '../utils/seoGlossary';

interface SeoGlossaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTermId?: string;
}

export const SeoGlossaryModal: React.FC<SeoGlossaryModalProps> = ({
  isOpen,
  onClose,
  initialTermId,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTermId, setSelectedTermId] = useState<string | null>(initialTermId || 'eeat');

  const allTerms = useMemo(() => getAllGlossaryTerms(), []);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    allTerms.forEach((t) => cats.add(t.category));
    return Array.from(cats);
  }, [allTerms]);

  const filteredTerms = useMemo(() => {
    return allTerms.filter((term) => {
      const matchesCategory = selectedCategory === 'all' || term.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        term.shortName.toLowerCase().includes(q) ||
        term.term.toLowerCase().includes(q) ||
        term.definition.toLowerCase().includes(q) ||
        term.whyItMatters.toLowerCase().includes(q) ||
        term.aliases.some((a) => a.toLowerCase().includes(q));

      return matchesCategory && matchesSearch;
    });
  }, [allTerms, selectedCategory, searchQuery]);

  const activeTerm: GlossaryEntry = useMemo(() => {
    if (selectedTermId && SEO_GLOSSARY_DATABASE[selectedTermId]) {
      return SEO_GLOSSARY_DATABASE[selectedTermId];
    }
    return filteredTerms[0] || allTerms[0];
  }, [selectedTermId, filteredTerms, allTerms]);

  if (!isOpen) return null;

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Core Web Vitals & Speed':
        return <Zap className="w-3.5 h-3.5 text-blue-600" />;
      case 'Content & Authority (EEAT)':
        return <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />;
      case 'AI & Generative Search':
        return <BrainCircuit className="w-3.5 h-3.5 text-purple-600" />;
      case 'Structured Data & Schema':
        return <Database className="w-3.5 h-3.5 text-indigo-600" />;
      default:
        return <Layers className="w-3.5 h-3.5 text-amber-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-5xl h-[85vh] max-h-[800px] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-600 text-white shadow-xs">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-900">SEO Metric Knowledge Base &amp; Glossary</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-800 uppercase tracking-wide">
                  Global Helper
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Clear definitions, algorithmic ranking impact, benchmarks, and actionable playbooks for Core Web Vitals, EEAT, and technical standards.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
            title="Close Glossary"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar: Search and Filter Pills */}
        <div className="p-4 border-b border-slate-100 bg-white flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search terms (e.g. EEAT, LCP, Schema, INP)..."
              className="w-full pl-9 pr-4 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto scrollbar-none pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Terms ({allTerms.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Two-pane layout: List on Left, Detail on Right */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left Column: List of Terms */}
          <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-slate-200 overflow-y-auto bg-slate-50/50 p-3 space-y-1.5 shrink-0">
            {filteredTerms.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No matching SEO metrics found for &ldquo;{searchQuery}&rdquo;.
              </div>
            ) : (
              filteredTerms.map((t) => {
                const isSelected = activeTerm?.id === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedTermId(t.id)}
                    className={`w-full text-left p-3 rounded-xl transition-all cursor-pointer flex flex-col gap-1 border ${
                      isSelected
                        ? 'bg-white border-blue-400/80 shadow-xs ring-2 ring-blue-500/10'
                        : 'bg-white/60 hover:bg-white border-slate-200/80 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-black text-xs text-slate-900 flex items-center gap-1.5">
                        {getCategoryIcon(t.category)}
                        {t.shortName}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        {t.id.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 line-clamp-1 font-normal">
                      {t.term}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Right Column: Detailed Explanation & Playbook */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-white">
            {activeTerm ? (
              <>
                {/* Term Header */}
                <div className="border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1.5">
                      {getCategoryIcon(activeTerm.category)}
                      {activeTerm.category}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      ID: {activeTerm.id}
                    </span>
                  </div>

                  <h3 className="text-xl font-black text-slate-950 tracking-tight">
                    {activeTerm.term}
                  </h3>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                    Common Acronym / Alias: {activeTerm.shortName} ({activeTerm.aliases.join(', ')})
                  </div>
                </div>

                {/* Section 1: Definition */}
                <div className="space-y-1.5">
                  <div className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-blue-600" />
                    <span>Technical Definition</span>
                  </div>
                  <p className="text-sm text-slate-800 leading-relaxed font-normal bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200/70">
                    {activeTerm.definition}
                  </p>
                </div>

                {/* Section 2: Optimal Benchmark */}
                <div className="space-y-1.5">
                  <div className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Google Optimal Benchmark &amp; Pass Criteria</span>
                  </div>
                  <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-4 text-emerald-950">
                    <span className="text-xs font-bold text-emerald-900 block">
                      Target Threshold:
                    </span>
                    <span className="text-sm font-semibold text-emerald-950">
                      {activeTerm.benchmark}
                    </span>
                  </div>
                </div>

                {/* Section 3: Why Google Cares / Search Impact */}
                <div className="space-y-1.5">
                  <div className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Algorithmic &amp; SERP Ranking Impact</span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed bg-amber-50/40 p-3.5 rounded-2xl border border-amber-200/60">
                    {activeTerm.whyItMatters}
                  </p>
                </div>

                {/* Section 4: Actionable Playbook */}
                <div className="space-y-1.5">
                  <div className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                    <span>Actionable Remediation &amp; Optimization Playbook</span>
                  </div>
                  <div className="bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-white border border-blue-200 rounded-2xl p-4 text-xs text-slate-800 space-y-1">
                    <div className="font-bold text-blue-950">How to pass and optimize:</div>
                    <p className="text-slate-700 leading-relaxed">
                      {activeTerm.actionableTip}
                    </p>
                  </div>
                </div>

                {/* Reference Link */}
                {activeTerm.referenceUrl && (
                  <div className="pt-2">
                    <a
                      href={activeTerm.referenceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs"
                    >
                      <span>Read Official Google Search Central Documentation</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center p-12 text-slate-400 text-xs">
                Select a metric from the list on the left to view detailed insights.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
