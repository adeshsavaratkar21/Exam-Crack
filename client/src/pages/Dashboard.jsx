import React, { useState, useEffect } from 'react';
import { 
  Folder, 
  HelpCircle, 
  FileText, 
  Target, 
  ArrowUpRight, 
  ArrowDownRight, 
  Clock, 
  Sparkles, 
  CheckCircle2, 
  Calendar,
  Share2,
  Plus,
  BookOpen,
  Award,
  Layers,
  ChevronRight
} from 'lucide-react';
import api from '../services/api';

export default function Dashboard({ 
  selectedSubjectId, 
  setSelectedSubjectId,
  subjects = [], 
  initialLoading = false,
  initialError = null,
  onRetryInitial,
  onNavigateTab,
  onLaunchQuizForChapter,
  onViewNotesForChapter
}) {
  const [readinessData, setReadinessData] = useState(null);
  const [loading, setLoading] = useState(false);

  const currentSubject = subjects.find(s => s.id === Number(selectedSubjectId)) || subjects[0];

  useEffect(() => {
    if (!selectedSubjectId) return;

    setLoading(true);
    api.getReadinessReport(selectedSubjectId)
      .then(res => setReadinessData(res.data))
      .catch(err => console.error('Failed to load dashboard:', err))
      .finally(() => setLoading(false));
  }, [selectedSubjectId]);

  if (initialLoading && subjects.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-4 border-gray-200 border-t-amber-500 animate-spin" />
          <p className="text-xs font-semibold text-gray-500">Connecting to ExamPrep backend...</p>
        </div>
      </div>
    );
  }

  if (subjects.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px] p-6">
        <div className="max-w-md w-full bg-white rounded-2xl border border-gray-200 shadow-sm p-6 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto text-xl">
            ⚡
          </div>
          <h3 className="text-base font-bold text-gray-900">Waiting for Backend Connection</h3>
          <p className="text-xs text-gray-500">
            {initialError ? `Error: ${initialError}` : 'The frontend could not connect to the FastAPI backend at http://127.0.0.1:8000.'}
          </p>
          <button
            onClick={() => onRetryInitial && onRetryInitial()}
            className="w-full py-2.5 px-4 bg-amber-400 hover:bg-amber-500 text-gray-950 font-semibold text-xs rounded-xl transition-colors shadow-sm"
          >
            Retry Connection Now
          </button>
        </div>
      </div>
    );
  }

  const allTopics = readinessData?.all_topics || [];
  const urgentTopic = readinessData?.urgent_topics?.[0] || allTopics[1] || allTopics[0];
  const secondTopic = allTopics[2] || allTopics[0];
  const readinessPct = Math.round(readinessData?.overall_readiness_index || currentSubject?.overall_readiness || 28);
  const completedChapters = readinessData?.completed_chapters_count || 2;
  const totalChapters = readinessData?.total_chapters_count || 6;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* 1. Active Course Spotlight Hero Card */}
      <section className="student-card p-6 sm:p-7 relative overflow-hidden bg-gradient-to-br from-white via-white to-amber-50/40">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-lg bg-accentYellow text-gray-950 font-black text-xs shadow-2xs">
                {currentSubject?.code || 'DC'}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-xs font-extrabold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Current Active Subject
              </span>
              <span className="text-xs font-semibold text-gray-400">
                {currentSubject?.course_code || 'CS301 / CE301'}
              </span>
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                {currentSubject?.code === 'MDM' ? 'Multidisciplinary Minor' : (currentSubject?.name || 'Distributed Computing')}
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1">
                Target Exam: <strong className="text-gray-800 font-bold">{currentSubject?.target_exam || 'Semester 5 University Endsem'}</strong> • 4 Credits • Grand Total: 100 Marks
              </p>
            </div>

            {/* Quick action triggers */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <button
                onClick={() => onNavigateTab('courses')}
                className="px-4 py-2 rounded-xl bg-gray-950 text-white font-extrabold text-xs hover:bg-gray-800 shadow-sm transition-all flex items-center gap-1.5"
              >
                <Folder className="w-3.5 h-3.5 text-accentYellow" />
                View All Courses & Marking Scheme →
              </button>
              <button
                onClick={() => onNavigateTab('readiness')}
                className="px-4 py-2 rounded-xl bg-white border border-gray-200 text-gray-700 font-bold text-xs hover:bg-gray-50 shadow-2xs transition-all flex items-center gap-1.5"
              >
                <Target className="w-3.5 h-3.5 text-indigo-600" />
                Readiness Focus Matrix
              </button>
            </div>
          </div>

          {/* Quick Progress Bar Box */}
          <div className="p-4 rounded-2xl bg-white border border-gray-100 shadow-xs min-w-[260px] flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-bold mb-2">
              <span className="text-gray-500">Exam Readiness</span>
              <span className="text-emerald-700 font-black text-sm">{readinessPct}% Ready</span>
            </div>
            <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden mb-2">
              <div 
                className="bg-accentNavy h-2.5 rounded-full transition-all duration-700"
                style={{ width: `${Math.max(12, readinessPct)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] font-semibold text-gray-400">
              <span>{completedChapters} of {totalChapters} Units Completed</span>
              <span 
                onClick={() => onNavigateTab('courses')}
                className="text-gray-900 font-bold hover:underline cursor-pointer flex items-center gap-0.5"
              >
                Syllabus <ChevronRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. "Assignments / Urgent Exam Priority" Section (from reference image) */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">
              Assignments & Priority Focus
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-accentYellow text-gray-950 font-bold">
              {currentSubject?.code || 'Course'}
            </span>
          </div>
          <button className="flex items-center gap-1 text-xs font-semibold text-gray-400 hover:text-gray-600">
            Share <Share2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Wide White Banner Card */}
        <div className="student-card p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-xl shrink-0">
              👨‍🏫
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-gray-900">
                {urgentTopic?.chapter_name || "Unit 2: Communication in Distributed Systems"}
              </h3>
              <p className="text-xs text-gray-400 font-medium mt-0.5">
                Target Exam: <strong className="text-gray-700">{currentSubject?.target_exam || 'Semester 5 University Endsem'}</strong> • Weightage: <strong className="text-amber-800">{urgentTopic?.weightage_percent || 23.8}%</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
            <div className="text-right hidden sm:block">
              <span className="text-[11px] font-bold text-gray-400 block uppercase">Estimated Effort</span>
              <span className="text-xs font-bold text-gray-800 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-gray-400" />
                10 Questions • ~15 m
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onViewNotesForChapter && onViewNotesForChapter(urgentTopic?.chapter_id || 2)}
                className="px-4 py-2 rounded-2xl border border-gray-200/90 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Review Notes
              </button>
              <button
                onClick={() => onLaunchQuizForChapter && onLaunchQuizForChapter(urgentTopic?.chapter_id || 2)}
                className="px-5 py-2 rounded-2xl bg-[#E8F8EE] text-emerald-800 hover:bg-emerald-200/80 text-xs font-bold transition-colors shadow-2xs"
              >
                Start Quiz
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 3. "Home Tasks" Section (2 Asymmetric Cards from Reference Image) */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">
            Home Tasks & Exam Roadmap
          </h2>
          <div className="flex items-center gap-3 text-xs font-semibold text-gray-400">
            <span>Today ▾</span>
            <button 
              onClick={() => onNavigateTab('readiness')}
              className="text-gray-900 font-bold hover:underline flex items-center gap-0.5"
            >
              Add new +
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Card 1: Dark Navy Box (from reference image) */}
          <div className="bg-accentNavy text-white rounded-3xl p-6 sm:p-7 flex flex-col justify-between shadow-sm min-h-[220px]">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Unit 3 • High Focus
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-rose-300 bg-rose-950/60 border border-rose-800 px-2.5 py-1 rounded-full">
                  High Yield <ArrowUpRight className="w-3 h-3" />
                </span>
              </div>

              <h3 className="font-extrabold text-lg text-white mb-2 leading-snug">
                Process & Clock Synchronization
              </h3>
              <p className="text-xs text-gray-300 line-clamp-2 leading-relaxed">
                Lamport's Logical Clocks, Vector Timestamps & Berkeley Clock Synchronization Algorithm.
              </p>
            </div>

            <div className="pt-4 border-t border-white/10 flex items-center justify-between mt-4">
              <div>
                <span className="text-[11px] font-medium text-gray-400 block">Distributed Computing</span>
                <span className="text-xs font-bold text-gray-200 flex items-center gap-1.5 mt-0.5">
                  <Calendar className="w-3.5 h-3.5 text-accentYellow" />
                  Due: In 2 Days (21 Oct)
                </span>
              </div>

              <button
                onClick={() => onLaunchQuizForChapter && onLaunchQuizForChapter(3)}
                className="px-4 py-2 rounded-xl bg-white text-gray-950 font-bold text-xs hover:bg-gray-100 transition-colors shadow-sm"
              >
                Practice
              </button>
            </div>
          </div>

          {/* Card 2: Warm Accent Yellow Box (from reference image) */}
          <div className="bg-accentYellow text-gray-950 rounded-3xl p-6 sm:p-7 flex flex-col justify-between shadow-sm min-h-[220px]">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-900/80">
                  Unit 3 • Coordination
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-amber-950 bg-amber-300/80 border border-amber-400 px-2.5 py-1 rounded-full">
                  Medium Yield <ArrowDownRight className="w-3 h-3" />
                </span>
              </div>

              <h3 className="font-extrabold text-lg text-gray-950 mb-2 leading-snug">
                Mutual Exclusion & Election Algorithms
              </h3>
              <p className="text-xs text-amber-950/80 line-clamp-2 leading-relaxed">
                Bully Election Algorithm vs Ring Algorithm message complexity comparison.
              </p>
            </div>

            <div className="pt-4 border-t border-amber-400/60 flex items-center justify-between mt-4">
              <div>
                <span className="text-[11px] font-bold text-amber-900 block">Semester 5 Prep</span>
                <span className="text-xs font-extrabold text-gray-950 flex items-center gap-1.5 mt-0.5">
                  <Calendar className="w-3.5 h-3.5 text-gray-950" />
                  Due: In 4 Days (23 Oct)
                </span>
              </div>

              <button
                onClick={() => onViewNotesForChapter && onViewNotesForChapter(3)}
                className="px-4 py-2 rounded-xl bg-gray-950 text-white font-bold text-xs hover:bg-gray-800 transition-colors shadow-sm"
              >
                Read Notes
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
