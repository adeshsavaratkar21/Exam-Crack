import React, { useMemo } from 'react';
import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  BookOpen,
  Sparkles,
  MessageSquare,
  FileText,
  BookmarkCheck,
  Compass
} from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';

export default function ConceptTutorTab({
  chapterId,
  chapterName,
  subjectName,
  tutorData,
  loading,
  isGenerating,
  errorMsg,
  isCompleted,
  onGenerate,
  onMarkComplete,
  onOpenChat,
}) {
  const fullContent = useMemo(() => {
    if (!tutorData) return '';
    return tutorData.unified_md || tutorData.gemini_summary_md || '';
  }, [tutorData]);

  // Extract H2/H3 section titles for the quick jump navigator
  const tableOfContents = useMemo(() => {
    if (!fullContent) return [];
    const sectionRegex = /^#{2,3}\s+([^#\n]+)$/gm;
    const items = [];
    let match;
    while ((match = sectionRegex.exec(fullContent)) !== null) {
      const rawTitle = match[1].trim();
      // Only keep top-level numbered or main sections
      if (rawTitle.length > 2 && rawTitle.length < 60) {
        items.push(rawTitle);
      }
    }
    return items.slice(0, 7);
  }, [fullContent]);

  if (loading) {
    return (
      <div className="student-card p-16 flex flex-col items-center justify-center gap-3 text-center">
        <div className="w-9 h-9 rounded-full border-4 border-gray-200 border-t-amber-500 animate-spin" />
        <p className="text-sm font-bold text-gray-700">Loading comprehensive notes...</p>
        <p className="text-xs text-gray-400 font-medium">Synthesizing syllabus topics &amp; prescribed book/PPT references</p>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="p-8 rounded-2xl bg-rose-50 border border-rose-200 flex flex-col items-center gap-3 text-center">
        <AlertCircle className="w-9 h-9 text-rose-500" />
        <p className="text-sm font-bold text-rose-800">{errorMsg}</p>
        <button
          onClick={() => onGenerate(false)}
          className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold rounded-xl transition-colors shadow-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Retry Generation
        </button>
      </div>
    );
  }

  if (!tutorData || !fullContent.trim()) {
    return (
      <div className="student-card p-16 flex flex-col items-center gap-5 text-center">
        <div className="w-16 h-16 rounded-3xl bg-amber-100/80 flex items-center justify-center text-3xl shadow-xs">
          📖
        </div>
        <div className="space-y-1.5 max-w-md">
          <h3 className="text-base font-extrabold text-gray-900">
            Generate Comprehensive Notes for {chapterName}
          </h3>
          <p className="text-xs text-gray-500 font-medium leading-relaxed">
            Covers in-depth theoretical explanations for every subtopic in the syllabus, grounded in prescribed textbooks and lecture PPTs.
          </p>
        </div>
        <button
          onClick={() => onGenerate(false)}
          disabled={isGenerating}
          className="inline-flex items-center gap-2 py-3 px-8 rounded-2xl bg-gray-950 hover:bg-black text-white font-extrabold text-xs shadow-sm transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
              Generating Full Notes from Syllabus &amp; Book/PPT...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-amber-400" />
              Generate Full Chapter Notes
            </>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Module Completion Banner */}
      {isCompleted && (
        <div className="flex items-center justify-between gap-3 px-5 py-3 rounded-2xl bg-emerald-50 border border-emerald-200 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <span className="text-xs font-black text-emerald-900 block">
                Module Mastered &amp; Completed!
              </span>
              <span className="text-[11px] font-semibold text-emerald-700">
                Your high-yield 1-Page Handwritten Revision Sheet is now unlocked.
              </span>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-black border border-emerald-300/80">
            ✓ 100% Ready
          </span>
        </div>
      )}

      {/* Main Document Header & Quick Actions Bar */}
      <div className="student-card p-5 bg-white border border-gray-100 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-gray-100">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-lg bg-gray-950 text-white font-black text-[11px] tracking-wide">
                Comprehensive Notes
              </span>
              <span className="px-2.5 py-0.5 rounded-lg bg-amber-50 text-amber-900 border border-amber-200 text-[11px] font-bold flex items-center gap-1">
                <BookOpen className="w-3 h-3 text-amber-700" />
                Book / PPT Grounded
              </span>
              <span className="px-2.5 py-0.5 rounded-lg bg-indigo-50 text-indigo-900 border border-indigo-200 text-[11px] font-bold">
                Exhaustive Syllabus Coverage
              </span>
            </div>

            <h2 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
              <span>{chapterName}</span>
            </h2>
            <p className="text-xs text-gray-500 font-medium">
              Subject: <strong className="text-gray-800">{subjectName}</strong> • Full single-document academic breakdown
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => onOpenChat && onOpenChat(`I have a doubt on "${chapterName}". Can you explain the core concepts simply with a real-world example?`)}
              className="px-4 py-2 rounded-xl bg-amber-50 hover:bg-amber-100/90 border border-amber-200/90 text-amber-950 text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs hover:scale-102 active:scale-98"
              title="Chat with AI Academic Professor about this chapter"
            >
              <MessageSquare className="w-3.5 h-3.5 text-amber-800" />
              <span>Ask AI Doubt</span>
            </button>

            {!isCompleted ? (
              <button
                onClick={onMarkComplete}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-all flex items-center gap-1.5 shadow-sm hover:scale-102 active:scale-98"
                title="Mark this module complete to unlock the 1-Page Revision Sheet"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Mark Module Complete</span>
              </button>
            ) : (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                <BookmarkCheck className="w-3.5 h-3.5 text-emerald-600" />
                Module Complete
              </span>
            )}

            <button
              onClick={() => onGenerate(true)}
              disabled={isGenerating}
              className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
              title="Regenerate notes"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Quick Section Jump Navigator (Smooth in-page navigation without hiding content) */}
        {tableOfContents.length > 0 && (
          <div className="pt-3 flex items-center gap-2 overflow-x-auto scrollbar-thin">
            <span className="text-[11px] font-black uppercase tracking-wider text-gray-400 flex items-center gap-1 shrink-0">
              <Compass className="w-3.5 h-3.5 text-gray-500" />
              Sections:
            </span>
            <div className="flex items-center gap-1.5 flex-nowrap">
              {tableOfContents.map((title, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-lg bg-gray-50 text-gray-700 border border-gray-200/60 text-[11px] font-semibold whitespace-nowrap shrink-0"
                >
                  {title.replace(/^[\d\.\s🎯📐💡🏆🔑—\-]+/, '') || title}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Complete Single Document Notes Body */}
      <div className="student-card p-6 sm:p-8 bg-white border border-gray-100 shadow-xs min-h-[500px]">
        <MarkdownRenderer content={fullContent} />
      </div>

      {/* Document Footer Call to Action */}
      <div className="student-card p-6 bg-gradient-to-br from-amber-50/60 via-white to-indigo-50/40 border border-amber-200/60 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center sm:text-left">
          <h4 className="text-sm font-extrabold text-gray-900 flex items-center justify-center sm:justify-start gap-1.5">
            <FileText className="w-4 h-4 text-amber-700" />
            Finished reviewing all subtopics?
          </h4>
          <p className="text-xs text-gray-500 font-medium">
            Lock in your understanding by asking any doubts or proceed to unlock your 1-Page Revision Sheet.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onOpenChat && onOpenChat(`What are the top 3 tricky exam traps professors test in ${chapterName}?`)}
            className="px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-800 font-bold text-xs hover:bg-gray-50 shadow-2xs transition-all flex items-center gap-1.5"
          >
            <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
            Ask Tricky Exam Traps
          </button>

          {!isCompleted && (
            <button
              onClick={onMarkComplete}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-sm transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              Mark Complete &amp; Unlock Sheet
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
