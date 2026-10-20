import React, { useRef } from 'react';
import {
  Lock,
  Printer,
  Download,
  RefreshCw,
  Loader2,
  Sparkles,
  AlertCircle,
  Sigma,
  Lightbulb,
  AlertTriangle,
  Table2,
  CheckCircle2
} from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';

/* ─── Sticky Note callout component ──────────────────────────────────── */
function StickyNote({ icon: Icon, color, label, items }) {
  const palette = {
    yellow: 'bg-amber-50 border-amber-300 text-amber-900',
    pink: 'bg-rose-50 border-rose-300 text-rose-900',
    blue: 'bg-indigo-50 border-indigo-300 text-indigo-900',
    green: 'bg-emerald-50 border-emerald-300 text-emerald-900',
  };
  return (
    <div
      className={`rounded-xl border-l-4 p-4 ${palette[color] || palette.yellow}`}
      style={{ fontFamily: 'var(--font-kalam, "Kalam", cursive)' }}
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 shrink-0" />
        <span className="text-xs font-extrabold uppercase tracking-wide">{label}</span>
      </div>
      {Array.isArray(items) ? (
        <ul className="list-disc pl-5 space-y-1">
          {items.slice(0, 6).map((item, i) => (
            <li key={i} className="text-xs leading-snug">
              {typeof item === 'string' ? item : JSON.stringify(item)}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs leading-snug">{items}</p>
      )}
    </div>
  );
}

/* ─── Ruled paper wrapper ─────────────────────────────────────────────── */
function RuledPaper({ children }) {
  return (
    <div
      className="relative bg-white rounded-2xl overflow-hidden shadow-xs border border-gray-200"
      style={{
        backgroundImage: `
          linear-gradient(to right, #fce4e4 1px, transparent 1px),
          linear-gradient(#e8ecf5 1px, transparent 1px)`,
        backgroundSize: '100% 28px',
        backgroundPosition: '48px 0, 0 0',
      }}
    >
      {/* Red margin line */}
      <div
        className="absolute top-0 left-12 bottom-0 w-px bg-rose-300/60 pointer-events-none"
        aria-hidden="true"
      />
      <div className="pl-14 pr-6 py-6">{children}</div>
    </div>
  );
}

/* ─── Main RevisionSheetTab ───────────────────────────────────────────── */
export default function RevisionSheetTab({
  chapterId,
  chapterName,
  subjectName,
  revisionData,
  loading,
  isGenerating,
  errorMsg,
  isModuleCompleted,
  onGenerate,
}) {
  const printRef = useRef(null);

  const handlePrint = () => {
    window.print();
  };

  /* 1 — Locked state */
  if (!isModuleCompleted) {
    return (
      <div className="flex flex-col items-center gap-6 py-20 text-center px-6">
        <div className="relative">
          <div className="w-20 h-20 rounded-3xl bg-gray-100 flex items-center justify-center">
            <Lock className="w-8 h-8 text-gray-400" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-gray-900" />
          </div>
        </div>
        <div>
          <h3 className="text-base font-extrabold text-gray-900 mb-2">
            Revision Sheet Locked
          </h3>
          <p className="text-xs text-gray-500 max-w-sm font-medium leading-relaxed">
            Work through all steps in the <strong>Concept Tutor</strong> tab and mark the module as complete to
            unlock your personalized 1-page handwritten revision sheet.
          </p>
        </div>
        <div className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gray-50 border border-dashed border-gray-300">
          <span className="text-xs text-gray-400 font-medium">→ Complete the Concept Tutor first</span>
        </div>
      </div>
    );
  }

  /* 2 — Loading */
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <div className="w-8 h-8 rounded-full border-4 border-gray-200 border-t-amber-500 animate-spin" />
        <p className="text-xs font-semibold text-gray-500">Loading revision sheet...</p>
      </div>
    );
  }

  /* 3 — Error */
  if (errorMsg) {
    return (
      <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 flex flex-col items-center gap-3 text-center">
        <AlertCircle className="w-8 h-8 text-rose-500" />
        <p className="text-sm font-bold text-rose-700">{errorMsg}</p>
        <button
          onClick={() => onGenerate(false)}
          className="flex items-center gap-2 px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold rounded-xl"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Retry
        </button>
      </div>
    );
  }

  /* 4 — Not yet generated */
  if (!revisionData) {
    return (
      <div className="flex flex-col items-center gap-5 py-16 text-center px-6">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center text-3xl">
          📜
        </div>
        <div>
          <h3 className="text-base font-extrabold text-gray-900 mb-1">
            Generate Your 1-Page Handwritten Sheet
          </h3>
          <p className="text-xs text-gray-500 max-w-sm font-medium">
            Create a beautifully styled, printable revision sheet for <strong>{chapterName}</strong> with all key
            formulas, mnemonics, and exam traps.
          </p>
        </div>
        <button
          onClick={() => onGenerate(false)}
          disabled={isGenerating}
          className="inline-flex items-center gap-2 py-3 px-8 rounded-2xl bg-amber-400 hover:bg-amber-500 text-gray-950 font-extrabold text-xs shadow-sm transition-all disabled:opacity-50"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating Sheet...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Generate Revision Sheet
            </>
          )}
        </button>
      </div>
    );
  }

  /* 5 — Render the sheet */
  const sheet = revisionData;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 no-print">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-amber-400 flex items-center justify-center text-base shadow-xs">
            📜
          </div>
          <div>
            <h3 className="text-xs font-extrabold text-gray-900">{chapterName} — Revision Sheet</h3>
            <p className="text-[10px] text-gray-500 font-medium">{subjectName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onGenerate(true)}
            disabled={isGenerating}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
            Regenerate
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-900 hover:bg-black text-white text-xs font-bold transition-all"
          >
            <Printer className="w-3.5 h-3.5" />
            Print PDF
          </button>
        </div>
      </div>

      {/* The revision sheet itself */}
      <div ref={printRef} id="revision-sheet-print">
        <RuledPaper>
          {/* Title */}
          <div className="mb-5" style={{ fontFamily: 'var(--font-caveat, "Caveat", cursive)' }}>
            <h1 className="text-2xl font-bold text-gray-900 leading-tight">{chapterName}</h1>
            <p className="text-sm text-gray-500 font-semibold">{subjectName} · 1-Page Revision Sheet</p>
          </div>

          {/* Quick-hit formulas */}
          {sheet.formulas?.length > 0 && (
            <div className="mb-5">
              <StickyNote
                icon={Sigma}
                color="blue"
                label="Key Formulas & Relations"
                items={sheet.formulas}
              />
            </div>
          )}

          {/* Main body md */}
          {sheet.summary_md && (
            <div
              className="mb-5"
              style={{ fontFamily: 'var(--font-kalam, "Kalam", cursive)' }}
            >
              <MarkdownRenderer
                content={sheet.summary_md}
                components={{
                  h2: ({ node, ...props }) => (
                    <h2
                      className="text-lg font-bold text-gray-900 mt-5 mb-2 border-b border-gray-200 pb-1"
                      style={{ fontFamily: 'var(--font-caveat, "Caveat", cursive)' }}
                      {...props}
                    />
                  ),
                  h3: ({ node, ...props }) => (
                    <h3
                      className="text-base font-bold text-indigo-800 mt-4 mb-1.5"
                      style={{ fontFamily: 'var(--font-caveat, "Caveat", cursive)' }}
                      {...props}
                    />
                  ),
                  p: ({ node, ...props }) => (
                    <p
                      className="text-sm leading-relaxed text-gray-800 my-1"
                      style={{ fontFamily: 'var(--font-kalam, "Kalam", cursive)' }}
                      {...props}
                    />
                  ),
                  li: ({ node, ...props }) => (
                    <li
                      className="text-sm leading-relaxed"
                      style={{ fontFamily: 'var(--font-kalam, "Kalam", cursive)' }}
                      {...props}
                    />
                  ),
                }}
              />
            </div>
          )}

          {/* Mnemonics */}
          {sheet.mnemonics?.length > 0 && (
            <div className="mb-5">
              <StickyNote icon={Lightbulb} color="yellow" label="Mnemonics & Memory Hooks" items={sheet.mnemonics} />
            </div>
          )}

          {/* Pitfalls */}
          {sheet.pitfalls?.length > 0 && (
            <div className="mb-5">
              <StickyNote icon={AlertTriangle} color="pink" label="Common Exam Traps" items={sheet.pitfalls} />
            </div>
          )}

          {/* High-yield exam questions */}
          {sheet.exam_questions?.length > 0 && (
            <div className="mb-2">
              <StickyNote
                icon={CheckCircle2}
                color="green"
                label="High-Probability Exam Questions"
                items={sheet.exam_questions}
              />
            </div>
          )}
        </RuledPaper>
      </div>
    </div>
  );
}
