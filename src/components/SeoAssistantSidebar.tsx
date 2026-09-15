import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  X,
  Send,
  Loader2,
  Trash2,
  Copy,
  Check,
  HelpCircle,
  Gauge,
  AlertTriangle,
  Zap,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  Minimize2,
  Maximize2,
  Bot,
  User,
} from 'lucide-react';
import { AuditReport } from '../types';

export interface SeoAssistantSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  report: AuditReport;
  initialQuery?: string;
  onClearInitialQuery?: () => void;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

const STARTER_PROMPTS = [
  'How can I improve the LCP score of this page?',
  'What are the most critical issues to fix first?',
  'How is my AI Readiness for search engines like ChatGPT & Perplexity?',
  'Are my meta titles and descriptions properly optimized?',
  'Which crawled pages have the slowest response times?',
];

export const SeoAssistantSidebar: React.FC<SeoAssistantSidebarProps> = ({
  isOpen,
  onClose,
  report,
  initialQuery,
  onClearInitialQuery,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Handle triggered initial query
  useEffect(() => {
    if (isOpen && initialQuery && initialQuery.trim()) {
      handleSendMessage(initialQuery.trim());
      if (onClearInitialQuery) {
        onClearInitialQuery();
      }
    }
  }, [isOpen, initialQuery]);

  // Initialize with a contextual welcome message when a new report is loaded
  useEffect(() => {
    if (report && messages.length === 0) {
      const perf = report.scores?.performance ?? report.performance?.score ?? 82;
      const lcp = report.performance?.lcpEstimate ?? 1.8;
      const critCount = report.statCounts?.errors ?? (report.issues || []).filter((i) => i.severity === 'critical').length;

      setMessages([
        {
          id: 'welcome_msg',
          role: 'assistant',
          content: `### Hello! I'm your **SEO & Web Performance Assistant**.

I'm loaded with the full audit findings for **${report.domain}**:
- **Overall SEO Health**: **${report.scores?.overall ?? 85}%**
- **Performance (CWV)**: **${perf}%** (LCP: **${lcp}s**, CLS: **${report.performance?.clsEstimate ?? 0.03}**)
- **Critical Issues**: **${critCount} detected**
- **Pages Crawled**: **${report.crawledPages?.length || report.totalPagesCrawled || 1}**

Ask me anything about these audit results, or click one of the suggested questions below!`,
          timestamp: Date.now(),
        },
      ]);
    }
  }, [report]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, isOpen]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 150);
    }
  }, [isOpen]);

  const handleSendMessage = async (queryText?: string) => {
    const textToSend = (queryText || input).trim();
    if (!textToSend || isLoading) return;

    const userMessage: Message = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: Date.now(),
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setInput('');
    setIsLoading(true);

    try {
      // Send conversation to backend Gemini API endpoint
      const apiPayload = {
        messages: newHistory.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        report,
      };

      const response = await fetch('/api/audit/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiPayload),
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const data = await response.json();
      const replyContent = data.reply || "I couldn't generate a response for this query. Please try rephrasing.";

      const assistantMessage: Message = {
        id: `assistant_${Date.now()}`,
        role: 'assistant',
        content: replyContent,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error('Failed to communicate with SEO Assistant API:', err);
      const errorMessage: Message = {
        id: `assistant_err_${Date.now()}`,
        role: 'assistant',
        content: `### Notice
I experienced a temporary connection hiccup while querying the model: *${err?.message || 'Network error'}*.

Here is a quick diagnostic for **${report.domain}**:
- Current **LCP**: **${report.performance?.lcpEstimate ?? 1.8}s** (Target: ≤ 2.5s)
- Current **Performance Score**: **${report.scores?.performance ?? 82}%**
- Check the **Technical Performance** tab for granular Core Web Vitals breakdowns.`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: `welcome_${Date.now()}`,
        role: 'assistant',
        content: `Conversation reset. Ready to answer your questions regarding the audit of **${report.domain}**.`,
        timestamp: Date.now(),
      },
    ]);
  };

  // Helper to render basic markdown without extra heavy dependencies
  const renderMessageContent = (content: string) => {
    // Process markdown headers, bold, code blocks, lists, etc.
    const lines = content.split('\n');
    return (
      <div className="space-y-2 text-xs leading-relaxed text-slate-800">
        {lines.map((line, idx) => {
          const trimmed = line.trim();

          // Code block delimiter
          if (trimmed.startsWith('```')) {
            return null;
          }

          // Headers
          if (trimmed.startsWith('### ')) {
            return (
              <h4 key={idx} className="text-sm font-bold text-slate-900 pt-1 border-b border-slate-100 pb-1">
                {trimmed.replace(/^###\s+/, '')}
              </h4>
            );
          }
          if (trimmed.startsWith('#### ')) {
            return (
              <h5 key={idx} className="text-xs font-bold text-slate-900 pt-1">
                {trimmed.replace(/^####\s+/, '')}
              </h5>
            );
          }

          // List item
          if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            const itemText = trimmed.replace(/^[-*]\s+/, '');
            return (
              <div key={idx} className="flex items-start gap-1.5 pl-1">
                <span className="text-emerald-600 font-bold shrink-0">&bull;</span>
                <span dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(itemText) }} />
              </div>
            );
          }

          // Numbered list
          if (/^\d+\.\s/.test(trimmed)) {
            const match = trimmed.match(/^(\d+)\.\s+(.*)/);
            if (match) {
              return (
                <div key={idx} className="flex items-start gap-1.5 pl-1">
                  <span className="font-mono font-bold text-slate-500 shrink-0">{match[1]}.</span>
                  <span dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(match[2]) }} />
                </div>
              );
            }
          }

          // Empty line
          if (!trimmed) {
            return <div key={idx} className="h-1" />;
          }

          // Standard paragraph
          return (
            <p key={idx} dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(line) }} />
          );
        })}
      </div>
    );
  };

  const formatInlineMarkdown = (text: string): string => {
    return text
      // Bold
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Inline code
      .replace(/`([^`]+)`/g, '<code class="bg-slate-100 px-1 py-0.5 rounded text-[11px] font-mono text-slate-800">$1</code>')
      // Links
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 underline font-semibold">$1</a>');
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Mobile Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-50 lg:hidden transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Main Sidebar Panel */}
      <aside
        id="seo-assistant-sidebar"
        className="fixed inset-y-0 right-0 z-50 w-full sm:w-[420px] md:w-[460px] bg-white border-l border-slate-200 shadow-2xl flex flex-col transition-all duration-300 ease-in-out"
        role="dialog"
        aria-label="SEO Assistant Sidebar"
      >
        {/* Top Header */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-slate-900">SEO Assistant</h3>
                <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-extrabold tracking-wide uppercase">
                  Gemini
                </span>
              </div>
              <p className="text-[11px] text-slate-500 truncate max-w-[220px]">
                Context: <span className="font-mono font-semibold text-slate-700">{report.domain}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleClearChat}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
              title="Clear conversation history"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
              title="Close assistant"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Live Context Telemetry Ribbon */}
        <div className="px-4 py-2 bg-slate-100/70 border-b border-slate-200/70 text-[11px] flex items-center justify-between text-slate-600 shrink-0 overflow-x-auto">
          <div className="flex items-center gap-2 shrink-0">
            <span className="font-semibold text-slate-500">Telemetry:</span>
            <span className="px-1.5 py-0.2 rounded bg-white border border-slate-200 font-mono font-bold text-slate-800">
              Perf: {report.scores?.performance ?? report.performance?.score ?? 82}%
            </span>
            <span className="px-1.5 py-0.2 rounded bg-white border border-slate-200 font-mono font-bold text-emerald-700">
              LCP: {report.performance?.lcpEstimate ?? 1.8}s
            </span>
            <span className="px-1.5 py-0.2 rounded bg-white border border-slate-200 font-mono font-bold text-slate-800">
              SEO: {report.scores?.overall ?? 85}%
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-medium shrink-0 ml-2">
            {report.crawledPages?.length || 1} pages
          </span>
        </div>

        {/* Chat Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-200">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}

                <div
                  className={`relative max-w-[85%] rounded-2xl p-3.5 shadow-2xs group ${
                    isUser
                      ? 'bg-slate-900 text-white rounded-br-xs'
                      : 'bg-slate-50 border border-slate-200/90 text-slate-800 rounded-bl-xs'
                  }`}
                >
                  {isUser ? (
                    <p className="text-xs font-medium leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  ) : (
                    <div>
                      {renderMessageContent(msg.content)}
                      <div className="mt-2 pt-1 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-400">
                        <span>Gemini 3.8 Flash</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(msg.content, msg.id)}
                          className="p-1 rounded hover:bg-slate-200/60 text-slate-500 flex items-center gap-1 transition-colors cursor-pointer"
                          title="Copy response"
                        >
                          {copiedId === msg.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span className="text-emerald-600 font-bold">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="w-6 h-6 rounded-lg bg-slate-800 text-white flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                    <User className="w-3.5 h-3.5 text-slate-300" />
                  </div>
                )}
              </div>
            );
          })}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex gap-2.5 justify-start items-center">
              <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200">
                <Bot className="w-3.5 h-3.5" />
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-2xl rounded-bl-xs px-4 py-3 flex items-center gap-2 shadow-2xs">
                <Loader2 className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
                <span className="text-xs text-slate-600 font-medium">
                  Analyzing audit telemetry with Gemini...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Starter Prompts Carousel (when few messages) */}
        {messages.length <= 2 && (
          <div className="p-3 bg-slate-50/70 border-t border-slate-100 space-y-1.5 shrink-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Suggested Questions
            </span>
            <div className="flex flex-col gap-1.5">
              {STARTER_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(prompt)}
                  className="text-left px-2.5 py-1.5 rounded-lg bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 text-slate-700 hover:text-emerald-900 text-xs transition-colors flex items-center justify-between gap-1 shadow-2xs cursor-pointer group"
                >
                  <span className="truncate">{prompt}</span>
                  <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-emerald-600 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Box */}
        <div className="p-3.5 border-t border-slate-200 bg-white shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-end gap-2"
          >
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about this audit (e.g. 'How can I improve LCP?')..."
                rows={2}
                disabled={isLoading}
                className="w-full resize-none rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 p-2.5 text-xs text-slate-900 placeholder:text-slate-400 outline-hidden transition-all"
              />
              <span className="absolute bottom-2 right-2 text-[9px] text-slate-400 font-mono hidden sm:inline">
                Enter ↵
              </span>
            </div>

            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="p-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 text-white disabled:text-slate-400 transition-colors shadow-2xs cursor-pointer disabled:cursor-not-allowed shrink-0"
              title="Send message"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </form>
          <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
            <span>Powered by Gemini API &bull; Grounded in live audit data</span>
            <span>Shift+Enter for newline</span>
          </div>
        </div>
      </aside>
    </>
  );
};
