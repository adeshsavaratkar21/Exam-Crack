import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, BookOpen, RotateCcw, Check, Plus, Trash2, Ban } from 'lucide-react';

export const DEFAULT_EXAMS = [
  {
    id: 'dc-endsem',
    subjectCode: 'DC',
    name: 'Distributed Computing',
    examTitle: 'University Endsem (100 Marks)',
    time: '10:00',
    dateStr: '2026-10-25',
    displayDate: '25 October',
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
    borderColor: 'border-rose-400',
    bgCard: 'bg-[#FFF1F2]',
    accentColor: 'text-rose-900 bg-rose-100/90',
    barColor: 'bg-rose-500',
    type: 'Endsem (ESE)',
    totalUnits: 6,
    completedUnits: 2,
  }
];

export const formatDisplayDate = (dateStr) => {
  if (!dateStr || !dateStr.trim()) return '';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'long' });
    }
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'long' });
  } catch {
    return dateStr;
  }
};

export default function EditExamsModal({
  isOpen,
  onClose,
  exams,
  onSaveExams,
  onResetDefaults
}) {
  const [examList, setExamList] = useState(() => JSON.parse(JSON.stringify(exams || DEFAULT_EXAMS)));
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setExamList(JSON.parse(JSON.stringify(exams || DEFAULT_EXAMS)));
    }
  }, [isOpen, exams]);

  if (!isOpen) return null;

  const handleFieldChange = (index, field, value) => {
    setExamList((prev) => {
      const next = [...prev];
      const updatedExam = { ...next[index], [field]: value };
      if (field === 'dateStr') {
        updatedExam.displayDate = formatDisplayDate(value);
      }
      next[index] = updatedExam;
      return next;
    });
  };

  const handleClearExamDate = (index) => {
    setExamList((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        dateStr: '',
        displayDate: '',
        time: '',
      };
      return next;
    });
  };

  const handleSave = (e) => {
    e.preventDefault();
    onSaveExams(examList);
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      onClose();
    }, 400);
  };

  const handleReset = () => {
    if (window.confirm('Reset all exam dates to default semester schedule?')) {
      const resetList = JSON.parse(JSON.stringify(DEFAULT_EXAMS));
      setExamList(resetList);
      if (onResetDefaults) onResetDefaults();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-gray-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-gray-900">Edit Upcoming Exam Dates</h2>
              <p className="text-xs text-gray-500">
                Set dates for upcoming exams (will appear on top). Leave blank if no exam scheduled.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body - Scrollable */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="space-y-3.5">
            {examList.map((exam, idx) => {
              const hasDate = Boolean(exam.dateStr && exam.dateStr.trim());

              return (
                <div 
                  key={exam.id || idx}
                  className={`p-3.5 rounded-2xl border transition-all space-y-2.5 ${
                    hasDate 
                      ? 'border-gray-200 bg-[#FAFBFD] hover:bg-white hover:border-amber-300' 
                      : 'border-dashed border-gray-300 bg-gray-50/50 opacity-90'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black px-2 py-0.5 rounded-lg bg-gray-900 text-white">
                        {exam.subjectCode}
                      </span>
                      <span className="text-xs font-bold text-gray-800">{exam.name}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {hasDate ? (
                        <>
                          <span className="text-[11px] font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md">
                            {exam.displayDate || exam.dateStr}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleClearExamDate(idx)}
                            className="text-[10px] font-bold text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2 py-0.5 rounded-md transition-colors"
                            title="Remove exam date for this subject"
                          >
                            Clear Date
                          </button>
                        </>
                      ) : (
                        <span className="text-[10px] font-bold text-gray-500 bg-gray-200/70 px-2 py-0.5 rounded-md">
                          No Exam Scheduled
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[10px] font-bold text-gray-500 uppercase">
                          Exam Date
                        </label>
                      </div>
                      <input
                        type="date"
                        value={exam.dateStr || ''}
                        onChange={(e) => handleFieldChange(idx, 'dateStr', e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs text-gray-800 font-semibold focus:outline-none focus:border-amber-400"
                        placeholder="dd-mm-yyyy"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                        Time
                      </label>
                      <input
                        type="time"
                        value={exam.time || ''}
                        onChange={(e) => handleFieldChange(idx, 'time', e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs text-gray-800 font-semibold focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                        Exam Type / Paper
                      </label>
                      <input
                        type="text"
                        value={exam.examTitle || ''}
                        onChange={(e) => handleFieldChange(idx, 'examTitle', e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs text-gray-800 font-medium focus:outline-none focus:border-amber-400"
                        placeholder="e.g. Endsem, ISE, Midsem"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action buttons */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-between shrink-0">
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-rose-600 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to Defaults</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-900 rounded-xl hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2 text-xs font-extrabold bg-accentYellow hover:bg-accentYellowHover text-gray-950 rounded-xl shadow-xs transition-colors"
              >
                {success ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-700" />
                    <span>Saved!</span>
                  </>
                ) : (
                  <span>Save Schedule</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
