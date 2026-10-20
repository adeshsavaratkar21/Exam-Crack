import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Award, 
  ArrowRight, 
  ArrowLeft, 
  Sparkles, 
  Clock, 
  FileText
} from 'lucide-react';
import confetti from 'canvas-confetti';
import api from '../services/api';

export default function QuizCard({ 
  quizData, 
  onQuizCompleted, 
  onGenerateNotes 
}) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quizResult, setQuizResult] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const questions = quizResult?.questions || quizData?.questions || [];
  const currentQuestion = questions[currentQuestionIndex];
  const isCompleted = Boolean(quizResult || quizData?.is_completed);

  // Timer
  useEffect(() => {
    if (isCompleted) return;
    const timer = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isCompleted]);

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins}:${rem < 10 ? '0' : ''}${rem}`;
  };

  const handleSelectOption = (optionLetter) => {
    if (isCompleted) return;
    setSelectedAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: optionLetter
    }));
  };

  const handleSubmitQuiz = async () => {
    setIsSubmitting(true);
    try {
      const answersPayload = Object.entries(selectedAnswers).map(([qId, ans]) => ({
        question_id: Number(qId),
        answer: ans
      }));

      const res = await api.submitQuiz({
        quiz_id: quizData.quiz_id,
        answers: answersPayload
      });

      setQuizResult(res.data);
      if (onQuizCompleted) onQuizCompleted(res.data);

      if (res.data.accuracy_percent >= 70) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    } catch (err) {
      console.error('Quiz submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentQuestion) {
    return (
      <div className="student-card p-8 text-center text-gray-500">
        No questions loaded for this quiz.
      </div>
    );
  }

  const answeredCount = Object.keys(selectedAnswers).length;

  return (
    <div className="student-card p-6 sm:p-8 relative">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-5 mb-6 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200/60">
              {quizData.mode || 'Standard'} Mode
            </span>
            <span className="text-xs text-gray-400 font-medium">
              {quizData.chapter_name}
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold text-gray-900 mt-1">
            {quizData.title}
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gray-50 border border-gray-200/80 text-xs text-gray-700 font-semibold">
            <Clock className="w-3.5 h-3.5 text-gray-500" />
            <span className="font-mono">{formatTime(elapsedSeconds)}</span>
          </div>

          <div className="text-xs font-bold px-3.5 py-1.5 rounded-full bg-gray-950 text-white">
            {answeredCount} / {questions.length} Answered
          </div>
        </div>
      </div>

      {/* Quiz Results Banner when Completed */}
      {isCompleted && quizResult && (
        <div className="mb-6 p-5 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-sm ${
              quizResult.accuracy_percent >= 70
                ? 'bg-emerald-500 text-white'
                : 'bg-amber-400 text-gray-950'
            }`}>
              {quizResult.accuracy_percent}%
            </div>
            <div>
              <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-1.5">
                Quiz Evaluation Completed
                <Award className="w-5 h-5 text-amber-500" />
              </h3>
              <p className="text-xs text-gray-600 mt-0.5 font-medium">
                Score: <strong className="text-gray-950">{quizResult.score} / {quizResult.total_marks} Marks</strong> • Exam Readiness updated to <strong className="text-emerald-700">{quizResult.readiness_index_updated}%</strong>
              </p>
            </div>
          </div>

          <button
            onClick={() => onGenerateNotes(quizData.chapter_id)}
            className="w-full md:w-auto py-2.5 px-5 rounded-full bg-accentNavy hover:bg-black text-white font-bold text-xs transition-colors shadow-sm"
          >
            Review Notes
          </button>
        </div>
      )}

      {/* Progress Pills */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 scrollbar-none">
        {questions.map((q, idx) => {
          const isCurrent = idx === currentQuestionIndex;
          const isAnswered = Boolean(selectedAnswers[q.id]);
          let pillStyle = 'bg-gray-100 text-gray-700 border-gray-200';

          if (isCompleted) {
            pillStyle = q.is_correct 
              ? 'bg-emerald-600 text-white font-extrabold border-emerald-600 shadow-sm' 
              : 'bg-rose-600 text-white font-extrabold border-rose-600 shadow-sm';
          } else if (isCurrent && isAnswered) {
            pillStyle = 'bg-accentYellow text-gray-950 font-black border-2 border-gray-950 ring-2 ring-amber-300 shadow-sm';
          } else if (isCurrent) {
            pillStyle = 'bg-gray-950 text-white font-black border-gray-950 shadow-sm';
          } else if (isAnswered) {
            pillStyle = 'bg-amber-100 text-amber-950 font-bold border-amber-300';
          }

          return (
            <button
              key={q.id || idx}
              onClick={() => setCurrentQuestionIndex(idx)}
              className={`w-8 h-8 shrink-0 rounded-xl text-xs font-bold flex items-center justify-center border transition-all ${pillStyle}`}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>

      {/* Question Content */}
      <div className="mb-6">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400">
            Question {currentQuestionIndex + 1} of {questions.length}
          </span>
          <span className="text-xs font-bold text-gray-700 bg-gray-100 px-2.5 py-0.5 rounded-full border border-gray-200/80">
            {currentQuestion.marks} Mark{currentQuestion.marks > 1 ? 's' : ''}
          </span>
        </div>

        <p className="text-base sm:text-lg font-bold text-gray-900 leading-relaxed mb-6">
          {currentQuestion.question_text}
        </p>

        {/* Options List with uniform sizing and clear status badges */}
        <div className="grid grid-cols-1 gap-3.5">
          {currentQuestion.options.map((opt, oIdx) => {
            const letter = String(opt.trim().substring(0, 1)).toUpperCase();
            const isUserChoice = selectedAnswers[currentQuestion.id] === letter || currentQuestion.user_answer === letter;
            const isCorrectOption = currentQuestion.correct_answer === letter;

            let cardStyle = 'bg-white border-gray-200/90 hover:border-gray-300 hover:bg-gray-50/60 text-gray-800';
            let badgeComponent = null;

            if (isCompleted) {
              if (isUserChoice && isCorrectOption) {
                // Correctly chosen by student
                cardStyle = 'bg-emerald-50/80 border-emerald-500 text-emerald-950 font-bold shadow-2xs ring-1 ring-emerald-500/30';
                badgeComponent = (
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-300 font-extrabold text-[11px] flex items-center gap-1 shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Your Answer (Correct)</span>
                  </span>
                );
              } else if (isUserChoice && !isCorrectOption) {
                // Wrong choice chosen by student
                cardStyle = 'bg-rose-50/80 border-rose-400 text-rose-950 font-bold shadow-2xs ring-1 ring-rose-400/30';
                badgeComponent = (
                  <span className="px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800 border border-rose-300 font-extrabold text-[11px] flex items-center gap-1 shrink-0">
                    <XCircle className="w-3.5 h-3.5 text-rose-600" />
                    <span>Your Choice (Incorrect)</span>
                  </span>
                );
              } else if (isCorrectOption) {
                // Correct answer that student missed
                cardStyle = 'bg-emerald-50/40 border-emerald-400 border-dashed text-emerald-900 font-bold';
                badgeComponent = (
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-100/70 text-emerald-800 border border-emerald-300 font-bold text-[11px] flex items-center gap-1 shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Correct Answer</span>
                  </span>
                );
              } else {
                // Other options
                cardStyle = 'bg-gray-50/50 border-gray-200 text-gray-500 opacity-80';
              }
            } else if (isUserChoice) {
              cardStyle = 'bg-amber-50/90 border-amber-400 text-gray-950 font-bold shadow-sm ring-2 ring-amber-300/70';
              badgeComponent = (
                <span className="px-2 py-0.5 rounded-md bg-amber-200/80 text-amber-900 font-extrabold text-[10px] uppercase tracking-wider shrink-0">
                  Selected
                </span>
              );
            }

            return (
              <div
                key={oIdx}
                onClick={() => handleSelectOption(letter)}
                className={`p-4 rounded-2xl border min-h-[64px] flex items-center justify-between gap-3 cursor-pointer transition-all ${cardStyle}`}
              >
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black border transition-colors shrink-0 ${
                    isUserChoice 
                      ? 'bg-gray-950 text-white border-gray-950' 
                      : (isCompleted && isCorrectOption 
                          ? 'bg-emerald-600 text-white border-emerald-600' 
                          : 'bg-white text-gray-700 border-gray-300')
                  }`}>
                    {letter}
                  </span>
                  <span className="text-sm font-semibold leading-relaxed break-words">
                    {opt.replace(/^[A-Da-d]\)\s*/, '')}
                  </span>
                </div>

                {badgeComponent && (
                  <div className="shrink-0 ml-2">
                    {badgeComponent}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Detailed Explanation upon submission */}
        {isCompleted && currentQuestion.explanation && (
          <div className="mt-5 p-4 rounded-2xl bg-[#F8F9FC] border border-gray-200/70">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-600 block mb-1">
              Step-by-Step AI Solution & Reference:
            </span>
            <p className="text-xs sm:text-sm text-gray-700 leading-relaxed font-medium">
              {currentQuestion.explanation}
            </p>
          </div>
        )}
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between pt-5 border-t border-gray-100 min-h-[58px]">
        {/* Previous Button */}
        <button
          onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
          disabled={currentQuestionIndex === 0}
          className={`py-2 px-4 rounded-full border text-xs font-bold flex items-center gap-1.5 transition-all ${
            currentQuestionIndex === 0
              ? 'opacity-30 cursor-not-allowed border-gray-200 text-gray-400'
              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          Previous
        </button>

        {/* Actions Area */}
        <div className="flex items-center gap-3">
          {/* Skip option when question is not yet ticked */}
          {!isCompleted && !selectedAnswers[currentQuestion.id] && currentQuestionIndex < questions.length - 1 && (
            <button
              onClick={() => setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))}
              className="py-2 px-3.5 rounded-full text-xs font-semibold text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-1"
            >
              Skip Question
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {/* NEXT BUTTON: Rendered clearly when the MCQ question option is ticked */}
          {(Boolean(selectedAnswers[currentQuestion.id]) || isCompleted) && (
            currentQuestionIndex < questions.length - 1 ? (
              <button
                onClick={() => setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))}
                className="py-2.5 px-6 rounded-full bg-gray-950 hover:bg-black text-white text-xs font-extrabold flex items-center gap-2 shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <span>Next Question</span>
                <ArrowRight className="w-4 h-4 text-accentYellow" />
              </button>
            ) : !isCompleted ? (
              <button
                onClick={handleSubmitQuiz}
                disabled={isSubmitting}
                className="py-2.5 px-7 rounded-full bg-accentYellow hover:bg-accentYellowHover text-gray-950 font-black text-xs flex items-center gap-2 shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                {isSubmitting ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin text-gray-950" />
                    <span>Scoring Quiz...</span>
                  </>
                ) : (
                  <>
                    <span>Submit & Finish Quiz</span>
                    <CheckCircle2 className="w-4 h-4 text-gray-950" />
                  </>
                )}
              </button>
            ) : null
          )}
        </div>
      </div>
    </div>
  );
}
