import React, { useState, useEffect } from 'react';
import { 
  HelpCircle, 
  Sparkles, 
  Play, 
  History, 
  AlertCircle 
} from 'lucide-react';
import QuizCard from '../components/QuizCard';
import api from '../services/api';

export default function QuizPage({ 
  selectedSubjectId, 
  subjects, 
  initialChapterId,
  onNavigateToNotes 
}) {
  const [chapters, setChapters] = useState([]);
  const [selectedChapterId, setSelectedChapterId] = useState(initialChapterId || null);
  const [quizMode, setQuizMode] = useState('Standard');
  const [numQuestions, setNumQuestions] = useState(10);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [quizHistory, setQuizHistory] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!selectedSubjectId) return;

    api.getSubjectDetail(selectedSubjectId)
      .then(res => {
        const chs = res.data.chapters || [];
        setChapters(chs);
        if (!selectedChapterId && chs.length > 0) {
          setSelectedChapterId(chs[0].id);
        }
      })
      .catch(err => console.error(err));
  }, [selectedSubjectId]);

  useEffect(() => {
    if (initialChapterId) {
      setSelectedChapterId(initialChapterId);
    }
  }, [initialChapterId]);

  useEffect(() => {
    if (!selectedChapterId) return;

    api.getQuizHistory(selectedChapterId)
      .then(res => setQuizHistory(res.data || []))
      .catch(() => setQuizHistory([]));
  }, [selectedChapterId]);

  const handleStartQuiz = async () => {
    if (!selectedChapterId) return;

    setIsGenerating(true);
    setErrorMsg('');
    try {
      const res = await api.generateQuiz({
        subject_id: Number(selectedSubjectId),
        chapter_id: Number(selectedChapterId),
        num_questions: Number(numQuestions),
        mode: quizMode
      });
      setActiveQuiz(res.data);
    } catch (err) {
      console.error('Quiz generation error:', err);
      setErrorMsg(err.response?.data?.detail || 'Failed to generate practice quiz.');
    } finally {
      setIsGenerating(false);
    }
  };

  const currentChapter = chapters.find(c => c.id === Number(selectedChapterId));

  return (
    <div className="space-y-6">
      {/* Quiz Generator Controls */}
      <div className="student-card p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-gray-900" />
              Daily Chapter Practice Quiz
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1">
              Interactive 10-question practice test based on past PYQs and conceptual variations.
            </p>
          </div>

          <span className="text-xs px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200/80 font-bold">
            Instant Scoring + Solutions
          </span>
        </div>

        {/* Configuration Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Select Chapter
            </label>
            <select
              value={selectedChapterId || ''}
              onChange={(e) => setSelectedChapterId(Number(e.target.value))}
              className="w-full bg-[#F8F9FC] border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-gray-900 focus:outline-none focus:border-gray-400"
            >
              {chapters.map((ch) => (
                <option key={ch.id} value={ch.id}>
                  {ch.name} ({ch.weightage_percent}%)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Quiz Mode
            </label>
            <select
              value={quizMode}
              onChange={(e) => setQuizMode(e.target.value)}
              className="w-full bg-[#F8F9FC] border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-gray-900 focus:outline-none focus:border-gray-400"
            >
              <option value="Standard">Standard (PYQ + Concepts)</option>
              <option value="PYQ-Only">PYQ Only (Actual Past Papers)</option>
              <option value="Conceptual">Conceptual Variations & Traps</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleStartQuiz}
              disabled={isGenerating || !selectedChapterId}
              className="w-full py-2.5 px-5 rounded-full bg-accentYellow hover:bg-accentYellowHover text-gray-950 font-extrabold text-xs sm:text-sm shadow-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" />
                  Generating 10 Questions...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Launch Chapter Quiz
                </>
              )}
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Active Quiz Area */}
      {activeQuiz ? (
        <div className="animate-fade-in">
          <QuizCard
            quizData={activeQuiz}
            onQuizCompleted={() => {
              if (selectedChapterId) {
                api.getQuizHistory(selectedChapterId).then(r => setQuizHistory(r.data || []));
              }
            }}
            onGenerateNotes={(chId) => onNavigateToNotes(chId)}
          />
        </div>
      ) : (
        <div className="student-card p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500 mx-auto mb-3 text-2xl">
            ⚡
          </div>
          <h3 className="text-base font-extrabold text-gray-900">
            Ready to test chapter mastery?
          </h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto mt-1 mb-5 font-medium">
            Select a chapter and launch a 10-question quiz. Results will immediately calibrate your Exam Readiness Index and highlight areas needing focus.
          </p>
          <button
            onClick={handleStartQuiz}
            disabled={isGenerating || !selectedChapterId}
            className="inline-flex items-center gap-2 py-2.5 px-6 rounded-full bg-accentNavy hover:bg-black text-white text-xs font-bold shadow-sm transition-all"
          >
            <Play className="w-3.5 h-3.5" />
            Start Now for "{currentChapter?.name || 'Selected Chapter'}"
          </button>
        </div>
      )}

      {/* Past Quiz History for Chapter */}
      {quizHistory.length > 0 && (
        <div className="student-card p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-4">
            <History className="w-4 h-4 text-gray-900" />
            <h3 className="text-sm font-extrabold text-gray-900">
              Previous Quiz Attempts for "{currentChapter?.name}"
            </h3>
          </div>

          <div className="space-y-2.5">
            {quizHistory.map((q) => (
              <div
                key={q.id}
                className="p-3.5 rounded-2xl bg-[#F8F9FC] border border-gray-100 flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <p className="font-bold text-gray-900">{q.title}</p>
                  <p className="text-gray-400 text-[11px] font-medium mt-0.5">
                    Mode: {q.mode} • Date: {q.completed_at ? new Date(q.completed_at).toLocaleDateString() : 'Recent'}
                  </p>
                </div>

                <span className={`px-3 py-1 rounded-full font-extrabold text-xs ${
                  q.accuracy_percent >= 70
                    ? 'bg-emerald-100 text-emerald-900'
                    : 'bg-amber-100 text-amber-900'
                }`}>
                  {q.score} / {q.total_marks} ({q.accuracy_percent}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
