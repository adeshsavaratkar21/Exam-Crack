import React, { useState, useCallback } from 'react';
import {
  ChevronRight,
  ChevronLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  BookOpen,
  FlaskConical,
  Lightbulb,
  HelpCircle,
  Award,
  Sparkles,
  ChevronDown,
  ChevronUp,
  MessageSquare
} from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';

const STEP_ICONS = [BookOpen, FlaskConical, Lightbulb, HelpCircle, Award];
const STEP_LABELS = [
  'Concept Overview',
  'Derivations',
  'Worked Examples',
  'Exam Q&As',
  'Key Takeaways'
];

function parseStepsFromContent(tutorData) {
  if (!tutorData) return [];

  if (Array.isArray(tutorData.steps) && tutorData.steps.length > 0) {
    return tutorData.steps;
  }

  // Fallback: carve up the unified_md by ### headings
  const md = tutorData.unified_md || tutorData.gemini_summary_md || '';
  if (!md) return [];

  const sectionRegex = /^###\s+(.+)$/gm;
  const positions = [];
  let m;
  while ((m = sectionRegex.exec(md)) !== null) {
    positions.push({ title: m[1].replace(/^[^a-zA-Z]+/, '').trim(), index: m.index });
  }

  if (positions.length === 0) {
    return [{ title: 'Full Content', body: md }];
  }

  return positions.map((pos, i) => ({
    title: pos.title,
    body: md.slice(
      pos.index,
      i < positions.length - 1 ? positions[i + 1].index : undefined
    ).replace(/^###\s+.+$/m, '').trim()
  }));
}

function StepProgress({ current, total, label }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
        Step {current} of {total}
      </span>
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-amber-400 rounded-full transition-all duration-500"
          style={{ width: `${(current / total) * 100}%` }}
        />
      </div>
      <span className="text-[10px] font-bold text-amber-700">{label}</span>
    </div>
  );
}

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
  const [currentStep, setCurrentStep] = useState(0);
  const [expandedQA, setExpandedQA] = useState({});

  const steps = parseStepsFromContent(tutorData);
  const totalSteps = steps.length;
  const step = steps[currentStep];
  const StepIcon = STEP_ICONS[currentStep % STEP_ICONS.length];
  const isLastStep = currentStep === totalSteps - 1;

  const goNext = useCallback(() => {
    if (currentStep < totalSteps - 1) setCurrentStep((p) => p + 1);
  }, [currentStep, totalSteps]);

  const goPrev = useCallback(() => {
    if (currentStep > 0) setCurrentStep((p) => p - 1);
  }, [currentStep]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') goNext();
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') goPrev();
    },
    [goNext, goPrev]
  );

  // Parse exam Q&As from last step if present
  const isQAStep = step?.title?.toLowerCase().includes('exam') || step?.title?.toLowerCase().includes('question');

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <div className="w-8 h-8 rounded-full border-4 border-gray-200 border-t-amber-500 animate-spin" />
        <p className="text-xs font-semibold text-gray-500">Loading tutor content...</p>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 flex flex-col items-center gap-3 text-center">
        <AlertCircle className="w-8 h-8 text-rose-500" />
        <p className="text-sm font-bold text-rose-700">{errorMsg}</p>
        <button
          onClick={() => onGenerate(false)}
          className="flex items-center gap-2 px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold rounded-xl transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Retry Generation
        </button>
      </div>
    );
  }

  if (!tutorData) {
    return (
      <div className="flex flex-col items-center gap-5 py-16 text-center px-6">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center text-3xl shadow-xs">
          🧠
        </div>
        <div>
          <h3 className="text-base font-extrabold text-gray-900 mb-1">
            No Concept Tutor Content Yet
          </h3>
          <p className="text-xs text-gray-500 max-w-sm font-medium">
            Generate a step-by-step guided breakdown of <strong>{chapterName}</strong>. Includes concept explanations,
            derivations, worked examples, and exam Q&As.
          </p>
        </div>
        <button
          onClick={() => onGenerate(false)}
          disabled={isGenerating}
          className="inline-flex items-center gap-2 py-3 px-8 rounded-2xl bg-gray-900 hover:bg-black text-white font-extrabold text-xs shadow-sm transition-all disabled:opacity-50"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating Tutor Content...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-amber-400" />
              Generate Concept Tutor
            </>
          )}
        </button>
      </div>
    );
  }

  return (
    <div
      className="space-y-4 outline-none"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      role="region"
      aria-label="Concept tutor stepper"
    >
      {/* Completion banner */}
      {isCompleted && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-50 border border-emerald-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="text-xs font-bold text-emerald-800">
            Module Complete! Your Revision Sheet is now unlocked.
          </span>
        </div>
      )}

      {/* Step navigation header */}
      <div className="student-card p-4 space-y-3">
        <StepProgress current={currentStep + 1} total={totalSteps} label={STEP_LABELS[currentStep % STEP_LABELS.length]} />

        {/* Step tabs */}
        <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-thin" role="tablist">
          {steps.map((s, idx) => {
            const Icon = STEP_ICONS[idx % STEP_ICONS.length];
            return (
              <button
                key={idx}
                role="tab"
                aria-selected={currentStep === idx}
                onClick={() => setCurrentStep(idx)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold whitespace-nowrap transition-all shrink-0 ${
                  currentStep === idx
                    ? 'bg-gray-900 text-white shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Icon className="w-3 h-3" />
                {s.title.slice(0, 22)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Step content */}
      <div className="student-card p-6 min-h-[400px]" role="tabpanel" aria-live="polite">
        <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-gray-100">
          <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center">
            <StepIcon className="w-4 h-4 text-amber-900" />
          </div>
          <h3 className="text-sm font-extrabold text-gray-900">{step?.title}</h3>
        </div>

        {step?.body ? (
          <MarkdownRenderer content={step.body} />
        ) : (
          <p className="text-xs text-gray-400 font-medium text-center py-8">No content for this step.</p>
        )}
      </div>

      {/* Navigation footer */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={goPrev}
          disabled={currentStep === 0}
          aria-label="Previous step"
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenChat && onOpenChat(`I have a doubt regarding "${step?.title || chapterName}". Can you explain it simply with a concrete example?`)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-bold transition-all shadow-2xs"
            title="Ask AI Doubt about this concept"
          >
            <MessageSquare className="w-3.5 h-3.5 text-amber-700" />
            Ask AI Doubt
          </button>

          {isLastStep && !isCompleted && (
            <button
              onClick={onMarkComplete}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold transition-all shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4" />
              Mark Module Complete & Unlock Sheet
            </button>
          )}

          {!isLastStep && (
            <button
              onClick={goNext}
              aria-label="Next step"
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gray-900 hover:bg-black text-white text-xs font-bold transition-all"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
