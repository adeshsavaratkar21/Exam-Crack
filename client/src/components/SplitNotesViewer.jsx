import React, { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  Download, 
  Printer, 
  RefreshCw, 
  Copy, 
  Check, 
  FileText, 
  Sparkles, 
  Brain
} from 'lucide-react';
import api from '../services/api';

export default function SplitNotesViewer({ 
  notesData, 
  onRegenerate, 
  isRegenerating,
  onNavigateToQuiz 
}) {
  const [copied, setCopied] = useState(false);
  const [syncScroll, setSyncScroll] = useState(true);

  const geminiRef = useRef(null);
  const openaiRef = useRef(null);

  const handleScroll = (source) => {
    if (!syncScroll) return;
    if (source === 'gemini' && geminiRef.current && openaiRef.current) {
      const percentage = geminiRef.current.scrollTop / (geminiRef.current.scrollHeight - geminiRef.current.clientHeight);
      openaiRef.current.scrollTop = percentage * (openaiRef.current.scrollHeight - openaiRef.current.clientHeight);
    } else if (source === 'openai' && openaiRef.current && geminiRef.current) {
      const percentage = openaiRef.current.scrollTop / (openaiRef.current.scrollHeight - openaiRef.current.clientHeight);
      geminiRef.current.scrollTop = percentage * (geminiRef.current.scrollHeight - geminiRef.current.clientHeight);
    }
  };

  const handleCopy = () => {
    const combined = `=== GOOGLE GEMINI (THEORY & DERIVATIONS) ===\n\n${notesData.gemini_summary_md}\n\n=== OPENAI CHATGPT (MNEMONICS & FORMULAS) ===\n\n${notesData.openai_summary_md}`;
    navigator.clipboard.writeText(combined);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  if (!notesData) {
    return (
      <div className="student-card p-12 text-center">
        <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 mx-auto mb-3">
          <FileText className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-gray-900">
          No Dual-AI Revision Notes Generated Yet
        </h3>
        <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto font-medium">
          Complete a chapter or click below to generate parallel 1-page revision summaries via Google Gemini and OpenAI ChatGPT.
        </p>
      </div>
    );
  }

  const markdownExportUrl = api.getMarkdownExportUrl(notesData.chapter_id);
  const pdfExportUrl = api.getPdfExportUrl(notesData.chapter_id);

  return (
    <div className="space-y-5 print-page">
      {/* Action Toolbar */}
      <div className="student-card p-4 flex flex-wrap items-center justify-between gap-3 no-print">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-accentYellow flex items-center justify-center font-bold text-gray-950 text-base shadow-sm">
            📝
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-gray-900">
              {notesData.chapter_name} — Dual-AI 1-Page Summary
            </h2>
            <p className="text-[11px] text-gray-500 font-medium">
              Subject: {notesData.subject_name} • Sources: {notesData.sources_used}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setSyncScroll(!syncScroll)}
            className={`text-xs px-3 py-1.5 rounded-full font-bold transition-all ${
              syncScroll
                ? 'bg-gray-950 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {syncScroll ? '✓ Sync Scroll On' : 'Sync Scroll Off'}
          </button>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs px-3.5 py-1.5 rounded-full bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-bold transition-colors shadow-sm"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-gray-500" />}
            {copied ? 'Copied!' : 'Copy'}
          </button>

          <a
            href={markdownExportUrl}
            download
            className="flex items-center gap-1.5 text-xs px-3.5 py-1.5 rounded-full bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-bold transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-gray-500" />
            Markdown
          </a>

          <a
            href={pdfExportUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-xs px-3.5 py-1.5 rounded-full bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-bold transition-colors shadow-sm"
          >
            <Printer className="w-3.5 h-3.5 text-emerald-600" />
            PDF
          </a>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 text-xs px-3.5 py-1.5 rounded-full bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-bold transition-colors shadow-sm"
          >
            <Printer className="w-3.5 h-3.5 text-gray-500" />
            Print
          </button>

          <button
            onClick={() => onRegenerate(notesData.chapter_id)}
            disabled={isRegenerating}
            className="flex items-center gap-1.5 text-xs px-4 py-1.5 rounded-full bg-accentYellow hover:bg-accentYellowHover text-gray-950 font-extrabold shadow-sm transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
            Regenerate
          </button>
        </div>
      </div>

      {/* Side-by-Side Split Viewers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 print-columns">
        {/* LEFT COLUMN: Google Gemini */}
        <div className="student-card overflow-hidden flex flex-col h-[750px]">
          {/* Header */}
          <div className="p-4 bg-[#F8F9FD] border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700">
                <Brain className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-extrabold text-gray-900 flex items-center gap-1.5">
                  Google Gemini Edition
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100/70 text-indigo-800">
                    Theory & Proofs
                  </span>
                </h3>
                <p className="text-[11px] text-gray-500 font-medium">
                  Focus: Formal definitions, derivations, bounds & exam pitfalls
                </p>
              </div>
            </div>
          </div>

          {/* Markdown Content */}
          <div
            ref={geminiRef}
            onScroll={() => handleScroll('gemini')}
            className="p-6 overflow-y-auto space-y-4 text-xs sm:text-sm text-gray-800 leading-relaxed font-sans scrollbar-thin"
          >
            <ReactMarkdown
              components={{
                h1: ({ node, ...props }) => <h1 className="text-base sm:text-lg font-black text-gray-950 border-b border-gray-100 pb-2 mb-3" {...props} />,
                h2: ({ node, ...props }) => <h2 className="text-sm sm:text-base font-extrabold text-indigo-900 mt-4 mb-2" {...props} />,
                h3: ({ node, ...props }) => <h3 className="text-xs sm:text-sm font-bold text-gray-900 mt-3 mb-1.5" {...props} />,
                ul: ({ node, ...props }) => <ul className="list-disc pl-5 space-y-1 text-gray-700 my-2" {...props} />,
                ol: ({ node, ...props }) => <ol className="list-decimal pl-5 space-y-1 text-gray-700 my-2" {...props} />,
                li: ({ node, ...props }) => <li className="text-xs sm:text-sm leading-relaxed" {...props} />,
                strong: ({ node, ...props }) => <strong className="font-extrabold text-gray-950" {...props} />,
                blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-indigo-500 bg-indigo-50/50 pl-3 py-1 my-2 text-indigo-950 rounded-r text-xs font-medium" {...props} />,
                code: ({ node, inline, ...props }) => inline 
                  ? <code className="bg-gray-100 text-indigo-900 px-1.5 py-0.5 rounded text-xs font-mono font-semibold" {...props} />
                  : <code className="block bg-[#F8F9FD] p-3 rounded-xl text-xs font-mono text-gray-900 overflow-x-auto my-2 border border-gray-100" {...props} />,
              }}
            >
              {notesData.gemini_summary_md}
            </ReactMarkdown>
          </div>
        </div>

        {/* RIGHT COLUMN: OpenAI ChatGPT */}
        <div className="student-card overflow-hidden flex flex-col h-[750px]">
          {/* Header */}
          <div className="p-4 bg-[#FEFDF9] border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-700">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-extrabold text-gray-900 flex items-center gap-1.5">
                  OpenAI ChatGPT Edition
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
                    Mnemonics & Tables
                  </span>
                </h3>
                <p className="text-[11px] text-gray-500 font-medium">
                  Focus: Memory hooks, fast formula sheet, comparison tables & cram points
                </p>
              </div>
            </div>
          </div>

          {/* Markdown Content */}
          <div
            ref={openaiRef}
            onScroll={() => handleScroll('openai')}
            className="p-6 overflow-y-auto space-y-4 text-xs sm:text-sm text-gray-800 leading-relaxed font-sans scrollbar-thin"
          >
            <ReactMarkdown
              components={{
                h1: ({ node, ...props }) => <h1 className="text-base sm:text-lg font-black text-gray-950 border-b border-gray-100 pb-2 mb-3" {...props} />,
                h2: ({ node, ...props }) => <h2 className="text-sm sm:text-base font-extrabold text-amber-950 mt-4 mb-2" {...props} />,
                h3: ({ node, ...props }) => <h3 className="text-xs sm:text-sm font-bold text-gray-900 mt-3 mb-1.5" {...props} />,
                ul: ({ node, ...props }) => <ul className="list-disc pl-5 space-y-1 text-gray-700 my-2" {...props} />,
                ol: ({ node, ...props }) => <ol className="list-decimal pl-5 space-y-1 text-gray-700 my-2" {...props} />,
                li: ({ node, ...props }) => <li className="text-xs sm:text-sm leading-relaxed" {...props} />,
                table: ({ node, ...props }) => (
                  <div className="overflow-x-auto my-3 rounded-xl border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200 text-left text-xs" {...props} />
                  </div>
                ),
                th: ({ node, ...props }) => <th className="bg-amber-50/60 px-3 py-2 font-bold text-gray-900 border-r border-gray-200 last:border-r-0" {...props} />,
                td: ({ node, ...props }) => <td className="px-3 py-2 border-t border-gray-100 border-r last:border-r-0 text-gray-700" {...props} />,
                strong: ({ node, ...props }) => <strong className="font-extrabold text-gray-950" {...props} />,
                blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-amber-400 bg-amber-50/50 pl-3 py-1 my-2 text-amber-950 rounded-r text-xs font-medium" {...props} />,
                code: ({ node, inline, ...props }) => inline 
                  ? <code className="bg-gray-100 text-amber-900 px-1.5 py-0.5 rounded text-xs font-mono font-semibold" {...props} />
                  : <code className="block bg-[#FDFEFA] p-3 rounded-xl text-xs font-mono text-gray-900 overflow-x-auto my-2 border border-gray-100" {...props} />,
              }}
            >
              {notesData.openai_summary_md}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
}
