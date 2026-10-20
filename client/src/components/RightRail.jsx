import React, { useState } from 'react';
import { 
  Edit3, 
  ChevronLeft, 
  ChevronRight, 
  Flame, 
  Calendar, 
  Mail,
  Sparkles,
  Clock,
  CalendarX2,
  CalendarCheck2
} from 'lucide-react';
import EditExamsModal, { DEFAULT_EXAMS, formatDisplayDate } from './EditExamsModal';

export default function RightRail({ 
  currentSubject, 
  subjects = [],
  selectedSubjectId,
  onSelectSubject,
  studentProfile,
  onOpenEditProfile,
  onNavigateToQuiz,
  onNavigateToNotes,
  onNavigateTab
}) {
  const [selectedDay, setSelectedDay] = useState(19);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Persisted Upcoming Exams
  const [exams, setExams] = useState(() => {
    try {
      const saved = localStorage.getItem('examprep_upcoming_exams');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load upcoming exams:', e);
    }
    return DEFAULT_EXAMS;
  });

  const handleSaveExams = (updatedExams) => {
    setExams(updatedExams);
    localStorage.setItem('examprep_upcoming_exams', JSON.stringify(updatedExams));
  };

  const handleResetDefaults = () => {
    setExams(DEFAULT_EXAMS);
    localStorage.removeItem('examprep_upcoming_exams');
  };

  const daysOfWeek = [
    { day: 'SU', date: 18 },
    { day: 'MO', date: 19 },
    { day: 'TU', date: 20 },
    { day: 'WE', date: 21 },
    { day: 'TH', date: 22 },
    { day: 'FR', date: 23 },
    { day: 'SA', date: 24 },
  ];

  // Helper: calculate days left from October 19, 2026 (or today's actual date)
  const getDaysLeft = (dateStr) => {
    if (!dateStr || !dateStr.trim()) return null;
    try {
      const referenceToday = new Date('2026-10-19T00:00:00');
      const target = new Date(`${dateStr}T00:00:00`);
      const diff = Math.ceil((target - referenceToday) / (1000 * 60 * 60 * 24));
      return diff;
    } catch {
      return null;
    }
  };

  // 1. UPCOMING EXAMS (SORTED BY NEAREST DATE FIRST ON TOP)
  const upcomingExams = exams
    .filter((e) => e.dateStr && e.dateStr.trim() !== '')
    .map((e) => ({
      ...e,
      daysLeft: getDaysLeft(e.dateStr)
    }))
    .sort((a, b) => {
      const timeA = a.time || '00:00';
      const timeB = b.time || '00:00';
      const dtA = new Date(`${a.dateStr}T${timeA}:00`).getTime() || 0;
      const dtB = new Date(`${b.dateStr}T${timeB}:00`).getTime() || 0;
      return dtA - dtB;
    });

  // 2. SUBJECTS WITH NO EXAM SCHEDULED (PLACED BELOW, WITH NO DEADLINE / DAYS LEFT)
  const unscheduledFromExams = exams.filter((e) => !e.dateStr || !e.dateStr.trim());
  const existingCodes = new Set(exams.map((e) => e.subjectCode));
  const additionalCurriculumSubjects = subjects
    .filter((s) => !existingCodes.has(s.code))
    .map((s) => ({
      id: `curriculum-${s.id}`,
      subjectCode: s.code,
      name: s.name,
      examTitle: s.target_exam || 'Semester Examination',
      time: '',
      dateStr: '',
      displayDate: '',
      borderColor: 'border-gray-300',
      bgCard: 'bg-[#F9FAFB]',
      accentColor: 'text-gray-600 bg-gray-100',
      barColor: 'bg-gray-400',
      type: 'Exam',
      totalUnits: s.chapter_count || 6,
      completedUnits: 0,
    }));

  const noExamSubjects = [...unscheduledFromExams, ...additionalCurriculumSubjects];

  return (
    <aside className="w-80 bg-white border-l border-softBorder/80 p-4 flex flex-col gap-4 shrink-0 h-screen sticky top-0 overflow-y-auto scrollbar-thin">
      {/* Header: Academic Schedule & Edit Dates Button */}
      <div className="flex items-center justify-between pb-2.5 border-b border-gray-100 shrink-0">
        <div>
          <h3 className="font-extrabold text-gray-900 text-xs tracking-tight flex items-center gap-1.5">
            <span>📅</span>
            Academic Schedule
          </h3>
          <p className="text-[10px] text-gray-400 font-medium">Semester 5 • Exam Countdown</p>
        </div>
        <button 
          onClick={() => setIsEditModalOpen(true)}
          title="Edit Upcoming Exam Dates & Times"
          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-50 hover:bg-accentYellow text-gray-600 hover:text-gray-950 font-bold text-[10px] transition-colors border border-gray-200/80 cursor-pointer"
        >
          <Edit3 className="w-3 h-3" />
          <span>Edit Dates</span>
        </button>
      </div>

      {/* Mini Calendar Widget */}
      <div className="bg-[#F8F9FC] rounded-2xl p-2.5 border border-gray-100 shrink-0">
        <div className="flex items-center justify-between mb-2 px-1">
          <button className="text-gray-400 hover:text-gray-700">
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="font-bold text-[11px] text-gray-800">October 2026</span>
          <button className="text-gray-400 hover:text-gray-700">
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center">
          {daysOfWeek.map((item) => {
            const isSelected = item.date === selectedDay;
            return (
              <div 
                key={item.date}
                onClick={() => setSelectedDay(item.date)}
                className="flex flex-col items-center gap-0.5 cursor-pointer py-0.5"
              >
                <span className="text-[9px] font-semibold text-gray-400">{item.day}</span>
                <div className={`w-6 h-6 rounded-lg flex flex-col items-center justify-center text-[11px] font-extrabold transition-all ${
                  isSelected 
                    ? 'bg-gray-950 text-white shadow-xs' 
                    : 'text-gray-700 hover:bg-gray-200/60'
                }`}>
                  <span>{item.date}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 1. UPCOMING EXAMS (COMING SOON AT THE TOP)               */}
      {/* ======================================================== */}
      <div className="space-y-2 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            <h3 className="font-black text-gray-900 text-[11px] tracking-tight uppercase">
              Upcoming Exams ({upcomingExams.length})
            </h3>
          </div>
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="text-[10px] font-bold text-amber-700 hover:text-amber-900 underline cursor-pointer"
          >
            Edit Schedule
          </button>
        </div>

        {upcomingExams.length === 0 ? (
          <div className="p-3 rounded-xl bg-gray-50 border border-dashed border-gray-200 text-center">
            <p className="text-xs font-semibold text-gray-600">No exams currently scheduled</p>
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="mt-1 text-[11px] font-bold text-amber-600 hover:underline"
            >
              + Schedule Exam Dates
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {upcomingExams.map((exam) => {
              const matchedSub = subjects.find((s) => s.code === exam.subjectCode);
              const subId = matchedSub?.id;
              const isSelected = selectedSubjectId && subId === Number(selectedSubjectId);
              const daysLeft = exam.daysLeft;

              // Real syllabus coverage calculation
              const readinessPct = Math.round(
                matchedSub?.overall_readiness || ((exam.completedUnits || 2) / (exam.totalUnits || 6)) * 100
              );
              const totalUnits = matchedSub?.chapter_count || exam.totalUnits || 6;
              const completedUnits = exam.completedUnits || 2;

              // Color highlight logic
              const isUrgent = daysLeft !== null && daysLeft <= 7;
              const isMedium = daysLeft !== null && daysLeft > 7 && daysLeft <= 14;

              return (
                <div
                  key={exam.id}
                  onClick={() => {
                    if (subId && onSelectSubject) {
                      onSelectSubject(subId);
                    }
                  }}
                  className={`p-2.5 rounded-xl ${exam.bgCard || 'bg-gray-50'} border-l-4 ${exam.borderColor || 'border-amber-400'} cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] group relative ${
                    isSelected ? 'ring-2 ring-gray-950 shadow-xs' : 'hover:shadow-3xs'
                  }`}
                  title={`Click to focus Dashboard on ${exam.name}`}
                >
                  {/* Header row: Display Date & PROMINENTLY HIGHLIGHTED DAYS LEFT BADGE */}
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[9px] font-black uppercase tracking-wider text-gray-500">
                      {exam.displayDate || exam.dateStr} {exam.time ? `• ${exam.time}` : ''}
                    </span>

                    {/* PROMINENT DAYS LEFT BADGE */}
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs tracking-tight ${
                        daysLeft === 0
                          ? 'bg-rose-600 text-white animate-pulse'
                          : isUrgent
                          ? 'bg-rose-500 text-white animate-pulse'
                          : isMedium
                          ? 'bg-amber-500 text-white'
                          : 'bg-emerald-600 text-white'
                      }`}
                    >
                      <span>⚡</span>
                      <span>
                        {daysLeft === 0
                          ? 'EXAM TODAY'
                          : daysLeft === 1
                          ? '1 DAY LEFT'
                          : `${daysLeft} DAYS LEFT`}
                      </span>
                    </span>
                  </div>

                  {/* Subject Name & Paper Title (Compact) */}
                  <div>
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-[11px] font-black text-gray-900 group-hover:text-gray-950 flex items-center gap-1 leading-snug">
                        <span>{exam.name}</span>
                        {isSelected && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                        )}
                      </p>
                      <span className="text-[9px] font-bold text-gray-400 shrink-0">
                        {isSelected ? 'Active' : 'Switch →'}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-500 font-medium truncate mt-0.5">
                      {exam.examTitle || 'Semester Examination'}
                    </p>
                  </div>

                  {/* Sleek Revision Coverage Bar (Compact height) */}
                  <div className="mt-1.5 pt-1.5 border-t border-black/5 flex items-center justify-between text-[9px] font-bold text-gray-500">
                    <span>{exam.subjectCode}: {completedUnits}/{totalUnits} Units</span>
                    <span className="font-extrabold text-gray-900">{readinessPct}% Revised</span>
                  </div>
                  <div className="w-full bg-black/10 h-1 rounded-full overflow-hidden mt-0.5">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${exam.barColor || 'bg-amber-400'}`}
                      style={{ width: `${Math.max(10, readinessPct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 2. SUBJECTS WITH NO EXAM SCHEDULED (BELOW WITH NO DAYS)  */}
      {/* ======================================================== */}
      {noExamSubjects.length > 0 && (
        <div className="pt-2.5 border-t border-gray-100 space-y-2 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <CalendarX2 className="w-3.5 h-3.5 text-gray-400" />
              <h3 className="font-black text-gray-500 text-[10px] tracking-tight uppercase">
                No Exam Scheduled ({noExamSubjects.length})
              </h3>
            </div>
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="text-[10px] font-bold text-gray-500 hover:text-gray-900 cursor-pointer"
            >
              + Schedule
            </button>
          </div>

          <div className="space-y-1.5">
            {noExamSubjects.map((sub) => {
              const matchedSub = subjects.find((s) => s.code === sub.subjectCode);
              const subId = matchedSub?.id;
              const isSelected = selectedSubjectId && subId === Number(selectedSubjectId);

              const readinessPct = Math.round(
                matchedSub?.overall_readiness || ((sub.completedUnits || 0) / (sub.totalUnits || 6)) * 100
              );
              const totalUnits = matchedSub?.chapter_count || sub.totalUnits || 6;
              const completedUnits = sub.completedUnits || 0;

              return (
                <div
                  key={sub.id}
                  onClick={() => {
                    if (subId && onSelectSubject) {
                      onSelectSubject(subId);
                    }
                  }}
                  className={`p-2 rounded-xl bg-gray-50/70 border-l-4 border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all cursor-pointer group ${
                    isSelected ? 'ring-2 ring-gray-900 bg-white' : ''
                  }`}
                  title={`Click to view ${sub.name}. No exam scheduled.`}
                >
                  {/* Top line: No Deadline & No Exam Scheduled badge (NO days left or countdown) */}
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                      No Deadline
                    </span>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-gray-200/60 text-gray-500">
                      Not Scheduled
                    </span>
                  </div>

                  {/* Subject Name */}
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-[11px] font-bold text-gray-800 group-hover:text-gray-950 truncate">
                      {sub.name}
                    </p>
                    <span className="text-[8px] font-black uppercase px-1.5 py-0.2 rounded bg-gray-200 text-gray-600 shrink-0">
                      {sub.subjectCode}
                    </span>
                  </div>

                  {/* Units & Revision % */}
                  <div className="mt-1 pt-1 border-t border-gray-200/60 flex items-center justify-between text-[9px] font-medium text-gray-500">
                    <span>{completedUnits}/{totalUnits} Units</span>
                    <span className="font-bold text-gray-700">{readinessPct}% Revised</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Daily Reminder / Practice Tips */}
      <div className="pt-2 border-t border-gray-100 shrink-0">
        <h3 className="font-black text-gray-900 text-[10px] uppercase tracking-wider mb-2">
          Daily Reminder
        </h3>
        <div className="flex items-center gap-2.5 p-2 rounded-xl bg-[#F8F9FC] border border-gray-100">
          <div className="w-7 h-7 rounded-lg bg-[#EBF5FF] text-sky-600 flex items-center justify-center shrink-0 font-bold">
            <Mail className="w-3.5 h-3.5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold text-gray-900 truncate">Daily Chapter Quiz</p>
            <p className="text-[9px] text-gray-400 font-medium">Calibrate Readiness Today, 6:00 PM</p>
          </div>
        </div>
      </div>

      {/* Edit Exams Modal */}
      <EditExamsModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        exams={exams}
        onSaveExams={handleSaveExams}
        onResetDefaults={handleResetDefaults}
      />
    </aside>
  );
}
