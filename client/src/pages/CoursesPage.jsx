import React, { useState, useEffect } from 'react';
import { 
  Folder, 
  Target, 
  FileText, 
  HelpCircle, 
  ArrowLeft, 
  CheckCircle2, 
  Clock, 
  Award, 
  BookOpen, 
  Layers, 
  Sparkles, 
  ChevronRight,
  GraduationCap,
  Calendar,
  AlertCircle
} from 'lucide-react';
import api from '../services/api';
import SubjectPYQModal from '../components/SubjectPYQModal';

export default function CoursesPage({
  selectedSubjectId,
  setSelectedSubjectId,
  subjects = [],
  onLaunchQuizForChapter,
  onViewNotesForChapter,
  onNavigateTab
}) {
  const [activeFolderId, setActiveFolderId] = useState(null);
  const [isPYQModalOpen, setIsPYQModalOpen] = useState(false);
  const [courseFilter, setCourseFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [subjectDetail, setSubjectDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Map custom metadata for subjects
  const subjectMeta = {
    'DC': { icon: '🌐', level: 'Distributed Systems', instructor: 'Prof. David Clark', color: 'text-indigo-800 bg-indigo-50 border-indigo-200' },
    'SE': { icon: '💻', level: 'Software Architecture', instructor: 'Prof. Alicia Mayer', color: 'text-emerald-800 bg-emerald-50 border-emerald-200' },
    'AISC': { icon: '🧠', level: 'AI & Soft Computing', instructor: 'Dr. Mike Dickens', color: 'text-purple-800 bg-purple-50 border-purple-200' },
    'TOC': { icon: '📐', level: 'Theory & Automata', instructor: 'Prof. Alan Turing', color: 'text-amber-800 bg-amber-50 border-amber-200' },
    'CNS': { icon: '🔐', level: 'Security & Ciphers', instructor: 'Dr. Bruce Schneier', color: 'text-rose-800 bg-rose-50 border-rose-200' },
    'MDM': { icon: '🎓', level: 'Multidisciplinary Minor', instructor: 'Prof. Mahnoor Moably', color: 'text-sky-800 bg-sky-50 border-sky-200' }
  };

  // When a folder is opened, fetch full details (including exam marking scheme & topics)
  useEffect(() => {
    if (!activeFolderId) {
      setSubjectDetail(null);
      return;
    }

    setLoadingDetail(true);
    api.getSubjectDetail(activeFolderId)
      .then(res => {
        setSubjectDetail(res.data);
      })
      .catch(err => {
        console.error('Failed to load subject detail:', err);
      })
      .finally(() => setLoadingDetail(false));
  }, [activeFolderId]);

  const filteredSubjects = subjects.filter(s => {
    const matchesFilter = 
      courseFilter === 'All' ? true :
      courseFilter === 'Active' ? (s.overall_readiness || 0) < 80 :
      (s.overall_readiness || 0) >= 80;

    const matchesSearch = searchQuery.trim() === '' ? true :
      (s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
       (s.code && s.code.toLowerCase().includes(searchQuery.toLowerCase())));

    return matchesFilter && matchesSearch;
  });

  // Handle opening a subject folder
  const handleOpenFolder = (subId) => {
    setActiveFolderId(subId);
    if (setSelectedSubjectId) setSelectedSubjectId(subId);
  };

  // -------------------------------------------------------------
  // VIEW 1: SUBJECT FOLDER DETAIL (EXAM SCHEME & SYLLABUS)
  // -------------------------------------------------------------
  if (activeFolderId && subjectDetail) {
    const code = subjectDetail.code || 'SUB';
    const meta = subjectMeta[code] || { 
      icon: '📁', 
      level: 'Core Curriculum', 
      instructor: 'Semester Faculty', 
      color: 'text-gray-800 bg-gray-50 border-gray-200' 
    };
    const examScheme = subjectDetail.exam_scheme || {
      theory_total: 75,
      lab_total: 25,
      grand_total: 100,
      components: [
        { name: "In-Semester Evaluation (ISE)", marks: 15, type: "Theory (Continuous Assessment)" },
        { name: "Mid-Semester Examination (MSE)", marks: 15, type: "Theory (Written Exam)" },
        { name: "End-Semester Examination (ESE)", marks: 45, type: "Theory (University Paper)" },
        { name: "Laboratory Evaluation", marks: 25, type: "Lab (15 Continuous + 10 ESE Oral)" }
      ],
      teaching_scheme_hours: "3L + 0T + 2P = 5 Hrs/Week",
      passing_rule: "Minimum 40% aggregate in Theory & Lab components"
    };

    const chapters = subjectDetail.chapters || [];
    const readinessPct = Math.round(subjectDetail.overall_readiness || 28);
    const completedUnits = chapters.filter(c => c.is_completed).length;

    return (
      <div className="space-y-8 animate-in fade-in duration-200">
        {/* Navigation Breadcrumb Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200/80">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveFolderId(null)}
              className="w-10 h-10 rounded-2xl bg-white border border-gray-200/90 shadow-2xs hover:bg-gray-50 flex items-center justify-center text-gray-700 hover:text-gray-950 transition-colors shrink-0"
              title="Back to All Courses"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                <span 
                  onClick={() => setActiveFolderId(null)} 
                  className="cursor-pointer hover:text-gray-700 transition-colors"
                >
                  My Courses
                </span>
                <span>/</span>
                <span className="text-gray-900 font-extrabold">{code}</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2 mt-0.5">
                <span>{meta.icon}</span>
                {subjectDetail.code === 'MDM' ? 'Multidisciplinary Minor' : subjectDetail.name}
              </h1>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                if (setSelectedSubjectId) setSelectedSubjectId(activeFolderId);
                onNavigateTab('readiness');
              }}
              className="px-4 py-2 rounded-2xl bg-white border border-gray-200/90 text-gray-700 font-bold text-xs hover:bg-gray-50 shadow-2xs transition-colors flex items-center gap-1.5"
            >
              <Target className="w-3.5 h-3.5 text-indigo-600" />
              Readiness Matrix
            </button>
            <button
              onClick={() => setIsPYQModalOpen(true)}
              className="px-4 py-2 rounded-2xl bg-gray-950 text-white font-bold text-xs hover:bg-black shadow-sm transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5 cursor-pointer"
              title="Click to view all authentic previous year question papers for this subject"
            >
              <FileText className="w-3.5 h-3.5 text-accentYellow" />
              <span>PYQ Papers ({subjectDetail.pyq_count || 0})</span>
            </button>
          </div>
        </div>

        {/* Hero Subject Header Card */}
        <div className="student-card p-6 sm:p-7 relative overflow-hidden bg-gradient-to-br from-white via-white to-amber-50/30">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-xl bg-accentYellow text-gray-950 font-black text-xs shadow-2xs">
                  {code}
                </span>
                {subjectDetail.course_code && (
                  <span className="px-2.5 py-1 rounded-xl bg-gray-100 text-gray-700 font-bold text-xs">
                    {subjectDetail.course_code}
                  </span>
                )}
                <span className="px-2.5 py-1 rounded-xl bg-indigo-50 text-indigo-700 font-bold text-xs border border-indigo-100">
                  {subjectDetail.credits || 4} Credits
                </span>
                <span className={`px-2.5 py-1 rounded-full border text-xs font-bold ${meta.color}`}>
                  {meta.level}
                </span>
                <span className="text-gray-400 text-xs font-medium">
                  {meta.instructor}
                </span>
              </div>

              <div>
                <p className="text-xs text-gray-500 font-medium leading-relaxed">
                  Target Exam: <strong className="text-gray-800 font-extrabold">{subjectDetail.target_exam || 'Semester 5 University Endsem'}</strong>
                  {examScheme.teaching_scheme_hours && (
                    <> • Teaching Scheme: <span className="text-gray-700 font-semibold">{examScheme.teaching_scheme_hours}</span></>
                  )}
                </p>
              </div>
            </div>

            {/* Overall Course Progress Widget */}
            <div className="p-4 rounded-2xl bg-white border border-gray-100 shadow-xs min-w-[240px]">
              <div className="flex items-center justify-between text-xs font-bold mb-2">
                <span className="text-gray-500">Curriculum Readiness</span>
                <span className="text-emerald-700 font-extrabold">{readinessPct}% Ready</span>
              </div>
              <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden mb-2">
                <div 
                  className="bg-accentNavy h-2.5 rounded-full transition-all duration-700"
                  style={{ width: `${Math.max(12, readinessPct)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] font-semibold text-gray-400">
                <span>{completedUnits} of {chapters.length} Units Mastered</span>
                <span>Grand Total: {examScheme.grand_total || 100}M</span>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* SECTION 1: OFFICIAL EXAM MARKING SCHEME                   */}
        {/* ========================================================= */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              <h2 className="text-lg font-black text-gray-900 tracking-tight">
                Exam Evaluation & Marking Scheme
              </h2>
            </div>
            {examScheme.passing_rule && (
              <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/70">
                Rule: {examScheme.passing_rule}
              </span>
            )}
          </div>

          {/* Scheme High-Level Score Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-4 rounded-2xl bg-white border border-gray-100 shadow-2xs">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Grand Total</span>
              <span className="text-2xl font-black text-gray-900 mt-1 block">
                {examScheme.grand_total || 100} <span className="text-xs font-bold text-gray-400">Marks</span>
              </span>
              <span className="text-[11px] text-gray-500 font-medium mt-0.5 block">100% Comprehensive</span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-gray-100 shadow-2xs">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Theory Component</span>
              <span className="text-2xl font-black text-indigo-700 mt-1 block">
                {examScheme.theory_total || 75} <span className="text-xs font-bold text-gray-400">Marks</span>
              </span>
              <span className="text-[11px] text-gray-500 font-medium mt-0.5 block">ISE + MSE + ESE Written</span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-gray-100 shadow-2xs">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Laboratory / Practical</span>
              <span className="text-2xl font-black text-emerald-700 mt-1 block">
                {examScheme.lab_total || 25} <span className="text-xs font-bold text-gray-400">Marks</span>
              </span>
              <span className="text-[11px] text-gray-500 font-medium mt-0.5 block">Continuous Lab + Oral</span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-gray-100 shadow-2xs">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Teaching Scheme</span>
              <span className="text-sm font-black text-gray-900 mt-2 block truncate">
                {examScheme.teaching_scheme_hours || '5 Hrs/Week'}
              </span>
              <span className="text-[11px] text-gray-500 font-medium mt-1 block">Lecture + Practical</span>
            </div>
          </div>

          {/* Detailed Component Breakdown Cards */}
          <div className="student-card p-5 bg-white">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-3">
              Assessment Breakdown Components
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {(examScheme.components || []).map((comp, idx) => (
                <div 
                  key={idx}
                  className="p-3.5 rounded-2xl bg-gray-50/80 border border-gray-100 flex flex-col justify-between"
                >
                  <div>
                    <span className="text-xs font-black text-gray-900 block leading-tight">
                      {comp.name}
                    </span>
                    <span className="text-[11px] text-gray-500 font-medium block mt-1">
                      {comp.type}
                    </span>
                  </div>
                  <div className="mt-3 pt-2 border-t border-gray-200/60 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Weightage</span>
                    <span className="text-sm font-black text-gray-900">
                      {comp.marks} Marks
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* SECTION 2: COMPLETE SYLLABUS & TOPIC BREAKDOWN            */}
        {/* ========================================================= */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-black text-gray-900 tracking-tight">
                Curriculum Syllabus Units ({chapters.length} Units)
              </h2>
            </div>
            <span className="text-xs text-gray-400 font-semibold">
              Click any unit to take a quiz or view revision notes
            </span>
          </div>

          <div className="space-y-4">
            {chapters.map((ch, idx) => {
              const unitNum = ch.unit_number || (idx + 1);
              const topics = ch.topics && Array.isArray(ch.topics) && ch.topics.length > 0 
                ? ch.topics 
                : [`Detailed conceptual coverage of ${ch.name}`];

              const isComp = ch.is_completed;

              return (
                <div 
                  key={ch.id}
                  className="student-card p-5 sm:p-6 bg-white hover:border-gray-300 transition-all"
                >
                  {/* Unit Top Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-gray-100">
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-lg bg-gray-950 text-white font-black text-xs">
                          Unit {unitNum}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-lg bg-amber-50 text-amber-900 border border-amber-200 text-xs font-bold">
                          {ch.weightage_percent}% Weightage
                        </span>
                        <span className="px-2.5 py-0.5 rounded-lg bg-indigo-50 text-indigo-900 border border-indigo-200 text-xs font-bold">
                          ~{ch.estimated_ese_marks || ch.weightage_marks} ESE Marks
                        </span>
                        <span className="text-xs font-medium text-gray-400 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {ch.teaching_hours || 8} Teaching Hrs
                        </span>
                      </div>

                      <h3 className="font-black text-base sm:text-lg text-gray-900 tracking-tight pt-1">
                        {ch.name.replace(/^Unit \d+:\s*/, '')}
                      </h3>
                    </div>

                    {/* Completion Tag & Action Buttons */}
                    <div className="flex items-center gap-2 shrink-0">
                      {isComp ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Completed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gray-50 text-gray-500 border border-gray-200 text-xs font-semibold">
                          In Progress
                        </span>
                      )}

                      <button
                        onClick={() => onLaunchQuizForChapter && onLaunchQuizForChapter(ch.id)}
                        className="px-3 py-1.5 rounded-xl bg-accentYellow text-gray-950 font-bold text-xs hover:bg-amber-300 shadow-2xs transition-colors flex items-center gap-1"
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                        Take Quiz
                      </button>

                      <button
                        onClick={() => onViewNotesForChapter && onViewNotesForChapter(ch.id)}
                        className="px-3 py-1.5 rounded-xl bg-gray-100 text-gray-800 font-bold text-xs hover:bg-gray-200 transition-colors flex items-center gap-1"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        Dual-AI Notes
                      </button>
                    </div>
                  </div>

                  {/* Sub-topics List */}
                  <div className="pt-3">
                    <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-wider mb-2">
                      Syllabus Topics Covered
                    </h4>
                    <ul className="space-y-1.5 pl-1">
                      {topics.map((topic, tIdx) => (
                        <li key={tIdx} className="text-xs text-gray-700 font-medium flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                          <span>{topic}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Subject PYQ Papers Gallery & PDF Viewer Modal */}
        <SubjectPYQModal
          isOpen={isPYQModalOpen}
          onClose={() => setIsPYQModalOpen(false)}
          subjectCode={subjectDetail.code}
          subjectName={subjectDetail.name}
          onLaunchQuiz={(chId) => onLaunchQuizForChapter(chId)}
        />
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW 2: ALL 6 SUBJECT FOLDERS GRID ("MY COURSES" DIRECTORY)
  // -------------------------------------------------------------
  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            My Courses & Curriculum Folders
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 font-medium mt-0.5">
            Select any course folder to explore its official marking scheme, syllabus units, and practice PYQs.
          </p>
        </div>

        {/* Filter Pills + Search Input */}
        <div className="flex items-center gap-3">
          {/* Status filters */}
          <div className="flex items-center gap-3 bg-white p-1 rounded-2xl border border-gray-200 shadow-2xs">
            {['All', 'Active', 'Completed'].map((tab) => (
              <button
                key={tab}
                onClick={() => setCourseFilter(tab)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  courseFilter === tab 
                    ? 'bg-gray-950 text-white shadow-2xs' 
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 6 Subject Course Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredSubjects.map((sub) => {
          const code = sub.code || 'SUB';
          const meta = subjectMeta[code] || { 
            icon: '📁', 
            level: 'Core Subject', 
            instructor: 'Semester Faculty', 
            color: 'text-gray-800 bg-gray-50 border-gray-200' 
          };
          const isSelected = sub.id === Number(selectedSubjectId);
          const readinessPct = Math.round(sub.overall_readiness || 25);
          const displayName = sub.code === 'MDM' ? 'Multidisciplinary Minor' : sub.name;

          return (
            <div
              key={sub.id}
              onClick={() => handleOpenFolder(sub.id)}
              className={`student-card student-card-hover p-5 flex flex-col justify-between cursor-pointer transition-all overflow-hidden relative group ${
                isSelected 
                  ? 'ring-2 ring-gray-950 shadow-md bg-[#FEFDF9]' 
                  : 'hover:border-gray-300'
              }`}
            >
              <div className="w-full min-w-0">
                {/* Top Header of Card: Icon + Subject Code Badge + Status */}
                <div className="flex items-center justify-between gap-2 mb-2 w-full">
                  <div className="w-11 h-11 rounded-2xl bg-[#F8F9FD] border border-gray-100 flex items-center justify-center text-xl shrink-0 shadow-xs">
                    {meta.icon}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="px-2.5 py-1 rounded-xl bg-accentYellow text-gray-950 font-black text-xs tracking-tight shadow-xs">
                      {code}
                    </span>
                    {isSelected ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Active
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-gray-400 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-full">
                        Sem 5
                      </span>
                    )}
                  </div>
                </div>

                {/* Course Full Name: Full card width with 2-line clamp */}
                <div className="my-2.5 min-h-[42px] flex items-center w-full min-w-0">
                  <h3 
                    title={displayName}
                    className="font-extrabold text-sm sm:text-[15px] text-gray-900 leading-snug line-clamp-2 break-words w-full"
                  >
                    {displayName}
                  </h3>
                </div>

                {/* Level Tag & Instructor */}
                <div className="flex items-center justify-between gap-2 mb-3.5 text-xs w-full min-w-0">
                  <span className={`font-bold px-2 py-0.5 rounded-full border text-[11px] truncate max-w-[130px] shrink-0 ${meta.color}`}>
                    {meta.level}
                  </span>
                  <span className="text-gray-400 font-medium text-[11px] truncate text-right">
                    {meta.instructor}
                  </span>
                </div>

                {/* Micro stats row */}
                <div className="flex items-center justify-between text-xs text-gray-500 font-medium py-2 px-3 rounded-xl bg-gray-50/80 border border-gray-100/70 mb-4 w-full">
                  <span className="flex items-center gap-1 font-semibold text-gray-600">
                    <Folder className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    {sub.chapter_count || 6} Units
                  </span>
                  <span className="text-gray-300">•</span>
                  <span className="flex items-center gap-1 font-semibold text-gray-600">
                    <Target className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    {readinessPct}% Ready
                  </span>
                  <span className="text-gray-300">•</span>
                  <span className="flex items-center gap-1 font-semibold text-gray-600">
                    <FileText className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    {sub.pyq_count || 0} PYQs
                  </span>
                </div>
              </div>

              {/* Progress bar + Open Folder footer */}
              <div className="pt-2 border-t border-gray-100 w-full">
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden mb-2">
                  <div
                    className="bg-accentNavy h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(12, readinessPct)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] font-bold text-gray-500">
                  <span className="text-gray-600">Completed: {readinessPct}%</span>
                  <span className={`flex items-center gap-1 transition-all ${
                    isSelected ? 'text-gray-950 font-extrabold' : 'text-gray-700 group-hover:text-gray-950 group-hover:translate-x-0.5'
                  }`}>
                    Open Folder →
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
