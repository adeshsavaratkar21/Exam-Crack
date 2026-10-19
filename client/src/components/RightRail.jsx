import React, { useState, useEffect } from 'react';
import { 
  Edit3, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Mail, 
  CheckCircle2, 
  Calendar, 
  Sparkles, 
  BookOpen,
  CheckSquare,
  Plus,
  Trash2,
  Check,
  Flame,
  ArrowRight,
  Filter
} from 'lucide-react';
import confetti from 'canvas-confetti';

const DEFAULT_TASKS = [
  { id: 1, text: "Revise DC Unit 2 Message Passing & Socket IPC", subject: "DC", completed: true },
  { id: 2, text: "Practice 10-Question Daily Chapter Quiz for AISC", subject: "AISC", completed: true },
  { id: 3, text: "Solve 2023 Endsem Lamport Clock numerical", subject: "DC", completed: false },
  { id: 4, text: "Practice DFA State Minimization proofs", subject: "TOC", completed: false }
];

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

  // Daily Tasks state persisted in localStorage
  const [tasks, setTasks] = useState(() => {
    try {
      const saved = localStorage.getItem('examprep_daily_tasks');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load daily tasks:', e);
    }
    return DEFAULT_TASKS;
  });

  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskSubject, setNewTaskSubject] = useState('DC');

  const daysOfWeek = [
    { day: 'SU', date: 18 },
    { day: 'MO', date: 19 },
    { day: 'TU', date: 20 },
    { day: 'WE', date: 21 },
    { day: 'TH', date: 22 },
    { day: 'FR', date: 23 },
    { day: 'SA', date: 24 },
  ];

  // Exam schedule definitions with fixed reference date (October 19, 2026)
  const exams = [
    {
      id: 'dc-endsem',
      subjectCode: 'DC',
      name: 'Distributed Computing',
      examTitle: 'University Endsem (100 Marks)',
      time: '10:00',
      dateStr: '2026-10-25',
      displayDate: '25 October',
      dayNum: 25,
      borderColor: 'border-amber-400',
      bgCard: 'bg-[#FEF9E7]',
      accentColor: 'text-amber-900 bg-amber-100/90',
      barColor: 'bg-amber-400',
      type: 'Endsem (ESE)',
      totalUnits: 6,
      completedUnits: 2,
    },
    {
      id: 'toc-midsem',
      subjectCode: 'TOC',
      name: 'Theory of Computation',
      examTitle: 'Automata & Grammars Midsem',
      time: '14:30',
      dateStr: '2026-10-28',
      displayDate: '28 October',
      dayNum: 28,
      borderColor: 'border-emerald-400',
      bgCard: 'bg-[#E8F8EE]',
      accentColor: 'text-emerald-900 bg-emerald-100/90',
      barColor: 'bg-emerald-500',
      type: 'Midsem (MSE)',
      totalUnits: 9,
      completedUnits: 2,
    },
    {
      id: 'cns-assessment',
      subjectCode: 'CNS',
      name: 'Cryptography & Security',
      examTitle: 'RSA & Ciphers Assessment',
      time: '11:00',
      dateStr: '2026-10-31',
      displayDate: '31 October',
      dayNum: 31,
      borderColor: 'border-sky-400',
      bgCard: 'bg-[#EBF5FF]',
      accentColor: 'text-sky-900 bg-sky-100/90',
      barColor: 'bg-sky-500',
      type: 'Theory (ISE)',
      totalUnits: 6,
      completedUnits: 2,
    },
    {
      id: 'se-endsem',
      subjectCode: 'SE',
      name: 'Software Engineering',
      examTitle: 'Software Testing & Agile ESE',
      time: '10:00',
      dateStr: '2026-11-04',
      displayDate: '04 November',
      dayNum: 4,
      borderColor: 'border-purple-400',
      bgCard: 'bg-[#FAF5FF]',
      accentColor: 'text-purple-900 bg-purple-100/90',
      barColor: 'bg-purple-500',
      type: 'Endsem (ESE)',
      totalUnits: 6,
      completedUnits: 2,
    },
    {
      id: 'aisc-endsem',
      subjectCode: 'AISC',
      name: 'AI & Soft Computing',
      examTitle: 'Neural Networks & Fuzzy Systems',
      time: '14:00',
      dateStr: '2026-11-08',
      displayDate: '08 November',
      dayNum: 8,
      borderColor: 'border-rose-400',
      bgCard: 'bg-[#FFF1F2]',
      accentColor: 'text-rose-900 bg-rose-100/90',
      barColor: 'bg-rose-500',
      type: 'Endsem (ESE)',
      totalUnits: 6,
      completedUnits: 2,
    }
  ];

  // Helper: calculate days left from October 19, 2026
  const getDaysLeft = (dateStr) => {
    const today = new Date('2026-10-19T00:00:00');
    const target = new Date(`${dateStr}T00:00:00`);
    const diff = Math.ceil((target - today) / (1000 * 60 * 60 * 24));
    return diff;
  };

  // Handle To-Do list operations
  const handleToggleTask = (taskId) => {
    setTasks(prev => {
      const next = prev.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t);
      const willBeAllDone = next.length > 0 && next.every(t => t.completed);
      if (willBeAllDone) {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.7 }
        });
      }
      localStorage.setItem('examprep_daily_tasks', JSON.stringify(next));
      return next;
    });
  };

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;

    const newTask = {
      id: Date.now(),
      text: newTaskText.trim(),
      subject: newTaskSubject,
      completed: false
    };

    const next = [newTask, ...tasks];
    setTasks(next);
    localStorage.setItem('examprep_daily_tasks', JSON.stringify(next));
    setNewTaskText('');
  };

  const handleDeleteTask = (taskId) => {
    const next = tasks.filter(t => t.id !== taskId);
    setTasks(next);
    localStorage.setItem('examprep_daily_tasks', JSON.stringify(next));
  };

  const completedCount = tasks.filter(t => t.completed).length;

  return (
    <aside className="w-80 bg-white border-l border-softBorder/80 p-5 flex flex-col gap-5 shrink-0 h-screen sticky top-0 overflow-y-auto scrollbar-thin">
      {/* Header: Academic Schedule */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-100 shrink-0">
        <div>
          <h3 className="font-extrabold text-gray-900 text-sm tracking-tight flex items-center gap-1.5">
            <span>📅</span>
            Academic Schedule
          </h3>
          <p className="text-[11px] text-gray-400 font-medium">Semester 5 • Exam Countdown</p>
        </div>
        <button 
          onClick={onOpenEditProfile}
          title="Edit Student Profile Settings"
          className="w-8 h-8 rounded-xl bg-gray-50 hover:bg-accentYellow flex items-center justify-center text-gray-500 hover:text-gray-950 transition-colors"
        >
          <Edit3 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Mini Calendar Widget */}
      <div className="bg-[#F8F9FC] rounded-2xl p-3.5 border border-gray-100 shrink-0">
        <div className="flex items-center justify-between mb-2.5 px-1">
          <button className="text-gray-400 hover:text-gray-700">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-bold text-xs text-gray-800">October 2026</span>
          <button className="text-gray-400 hover:text-gray-700">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center">
          {daysOfWeek.map((item) => {
            const isSelected = item.date === selectedDay;
            return (
              <div 
                key={item.date}
                onClick={() => setSelectedDay(item.date)}
                className="flex flex-col items-center gap-1 cursor-pointer py-0.5"
              >
                <span className="text-[10px] font-semibold text-gray-400">{item.day}</span>
                <div className={`w-7 h-7 rounded-xl flex flex-col items-center justify-center text-xs font-bold transition-all ${
                  isSelected 
                    ? 'bg-gray-950 text-white shadow-sm' 
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
      {/* EXAM COUNTDOWN CARDS WITH REVISION HEALTH BAR            */}
      {/* ======================================================== */}
      <div className="space-y-3 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-amber-500" />
            <h3 className="font-black text-gray-900 text-xs tracking-tight uppercase">
              Upcoming Exams
            </h3>
          </div>
          <span className="text-[10px] font-bold text-gray-400">Click to switch subject</span>
        </div>

        <div className="space-y-2.5">
          {exams.map((exam) => {
            const matchedSub = subjects.find(s => s.code === exam.subjectCode);
            const subId = matchedSub?.id;
            const isSelected = selectedSubjectId && subId === Number(selectedSubjectId);
            const daysLeft = getDaysLeft(exam.dateStr);

            // Real syllabus coverage calculation
            const readinessPct = Math.round(matchedSub?.overall_readiness || (exam.completedUnits / exam.totalUnits * 100));
            const totalUnits = matchedSub?.chapter_count || exam.totalUnits;
            const completedUnits = exam.completedUnits;

            return (
              <div
                key={exam.id}
                onClick={() => {
                  if (subId && onSelectSubject) {
                    onSelectSubject(subId);
                  }
                }}
                className={`p-3 rounded-2xl ${exam.bgCard} border-l-4 ${exam.borderColor} cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] group relative ${
                  isSelected ? 'ring-2 ring-gray-950 shadow-xs' : 'hover:shadow-2xs'
                }`}
                title={`Click to focus Dashboard & Quizzes on ${exam.name}`}
              >
                {/* Header row: Display Date & Dynamic Countdown Badge */}
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-gray-500">
                    {exam.displayDate} • {exam.time}
                  </span>

                  {/* DYNAMIC COUNTDOWN PILL */}
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${exam.accentColor} flex items-center gap-1 shadow-3xs`}>
                    ⏳ {daysLeft} Days to {exam.subjectCode} {exam.type.split(' ')[0]}
                  </span>
                </div>

                {/* Subject Name & Paper Title */}
                <div>
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-xs font-black text-gray-900 group-hover:text-gray-950 flex items-center gap-1">
                      <span>{exam.name}</span>
                      {isSelected && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                      )}
                    </p>
                    <span className="text-[10px] font-bold text-gray-500">
                      {isSelected ? 'Active' : 'Switch →'}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-600 font-medium mt-0.5">
                    {exam.examTitle}
                  </p>
                </div>

                {/* REVISION HEALTH BAR & SYLLABUS COVERAGE */}
                <div className="mt-2.5 pt-2 border-t border-black/5">
                  <div className="flex items-center justify-between text-[10px] font-bold text-gray-600 mb-1">
                    <span>{exam.subjectCode}: {completedUnits}/{totalUnits} Units</span>
                    <span className="font-extrabold text-gray-900">{readinessPct}% Revised</span>
                  </div>
                  <div className="w-full bg-black/10 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${exam.barColor}`}
                      style={{ width: `${Math.max(10, readinessPct)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ======================================================== */}
      {/* SECTION 2: DAILY STUDY TO-DO LIST & TASK TRACKER         */}
      {/* ======================================================== */}
      <div className="pt-2 border-t border-gray-100 shrink-0">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-1.5">
            <CheckSquare className="w-4 h-4 text-gray-900" />
            <h3 className="font-black text-gray-900 text-xs tracking-tight uppercase">
              Today's Study To-Do
            </h3>
          </div>
          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
            {completedCount}/{tasks.length} Done
          </span>
        </div>

        {/* Progress Bar of Daily Tasks */}
        <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden mb-3">
          <div 
            className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0}%` }}
          />
        </div>

        {/* Quick Add Task Input */}
        <form onSubmit={handleAddTask} className="mb-3 space-y-2">
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              placeholder="Add study task..."
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              className="flex-1 bg-[#F8F9FC] border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-400 font-medium"
            />
            <select
              value={newTaskSubject}
              onChange={(e) => setNewTaskSubject(e.target.value)}
              className="bg-[#F8F9FC] border border-gray-200 rounded-xl px-2 py-1.5 text-[10px] font-black text-gray-700 focus:outline-none"
            >
              <option value="DC">DC</option>
              <option value="TOC">TOC</option>
              <option value="CNS">CNS</option>
              <option value="SE">SE</option>
              <option value="AISC">AISC</option>
              <option value="MDM">MDM</option>
            </select>
            <button
              type="submit"
              disabled={!newTaskText.trim()}
              className="w-7 h-7 rounded-xl bg-accentYellow hover:bg-accentYellowHover text-gray-950 font-black text-xs flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs shrink-0 cursor-pointer"
              title="Add Task"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>

        {/* Task List */}
        <div className="space-y-2 max-h-52 overflow-y-auto pr-0.5 scrollbar-thin">
          {tasks.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-4 font-medium">
              No tasks added yet. Add your study goals above!
            </p>
          ) : (
            tasks.map((task) => (
              <div
                key={task.id}
                className={`p-2.5 rounded-xl border transition-all flex items-start justify-between gap-2 group ${
                  task.completed 
                    ? 'bg-gray-50/70 border-gray-200/60 opacity-80' 
                    : 'bg-white border-gray-200 hover:border-gray-300 shadow-2xs'
                }`}
              >
                <div 
                  onClick={() => handleToggleTask(task.id)}
                  className="flex items-start gap-2 flex-1 min-w-0 cursor-pointer"
                >
                  <button
                    type="button"
                    className={`w-4 h-4 mt-0.5 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                      task.completed 
                        ? 'bg-emerald-500 border-emerald-500 text-white shadow-2xs' 
                        : 'border-gray-300 hover:border-emerald-500 bg-white'
                    }`}
                  >
                    {task.completed && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className={`text-xs leading-snug break-words ${
                      task.completed ? 'line-through text-gray-400 font-medium' : 'text-gray-800 font-semibold'
                    }`}>
                      {task.text}
                    </p>
                    <span className="inline-block mt-0.5 text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-gray-100 text-gray-600">
                      {task.subject}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteTask(task.id)}
                  className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-rose-500 p-0.5 transition-opacity"
                  title="Delete task"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Reminders / Practice Tips */}
      <div className="pt-2 border-t border-gray-100 shrink-0">
        <h3 className="font-black text-gray-900 text-xs uppercase tracking-wider mb-2.5">
          Daily Reminder
        </h3>
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#F8F9FC] border border-gray-100">
          <div className="w-8 h-8 rounded-xl bg-[#EBF5FF] text-sky-600 flex items-center justify-center shrink-0 font-bold">
            <Mail className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-gray-900 truncate">Daily Chapter Quiz</p>
            <p className="text-[11px] text-gray-400 font-medium">Calibrate Readiness Today, 6:00 PM</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
