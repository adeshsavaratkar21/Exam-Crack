import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import MasteryRevisionSuite from '../components/MasteryRevisionSuite';
import ReferenceBooksModal from '../components/ReferenceBooksModal';
import api from '../services/api';

export default function NotesPage({
  selectedSubjectId,
  subjects,
  initialChapterId,
  onNavigateToQuiz
}) {
  const [chapters, setChapters] = useState([]);
  const [selectedChapterId, setSelectedChapterId] = useState(initialChapterId || null);
  const [chaptersLoading, setChaptersLoading] = useState(false);
  const [chaptersError, setChaptersError] = useState('');
  const [isBooksModalOpen, setIsBooksModalOpen] = useState(false);

  // Derive names from state
  const subject = subjects?.find(s => String(s.id) === String(selectedSubjectId));
  const currentChapter = chapters.find(c => c.id === Number(selectedChapterId));

  /* ── Load chapters on subject change ── */
  useEffect(() => {
    if (!selectedSubjectId) return;

    setChaptersLoading(true);
    setChaptersError('');
    api
      .getSubjectDetail(selectedSubjectId)
      .then(res => {
        const chs = res.data.chapters || [];
        setChapters(chs);
        if (!selectedChapterId && chs.length > 0) {
          setSelectedChapterId(chs[0].id);
        }
      })
      .catch(err => {
        console.error(err);
        setChaptersError('Failed to load chapters.');
      })
      .finally(() => setChaptersLoading(false));
  }, [selectedSubjectId]);

  /* ── Sync initialChapterId from parent navigation ── */
  useEffect(() => {
    if (initialChapterId) {
      setSelectedChapterId(initialChapterId);
    }
  }, [initialChapterId]);

  return (
    <div className="space-y-5">
      {/* Header + chapter selector */}
      <div className="student-card p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5 pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-gray-900" />
              Mastery &amp; Revision Suite
            </h2>
            <p className="text-xs text-gray-500 font-medium mt-1">
              Step-by-step concept tutor → unlock your personal 1-page handwritten revision sheet.
            </p>
          </div>
          <span className="text-xs px-3 py-1 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200/80 font-bold">
            Gemini AI · Single-Engine
          </span>
        </div>

        {/* Chapter selector & Reference Materials */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-end justify-between gap-4">
          <div className="flex-1 max-w-md">
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Select Chapter
            </label>
            {chaptersLoading ? (
              <div className="h-10 bg-gray-100 rounded-xl animate-pulse" />
            ) : (
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
            )}
          </div>

          {/* Book / PPT Quick Action Button */}
          {subject && (
            <button
              onClick={() => setIsBooksModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-amber-400 text-gray-950 font-black text-xs hover:bg-amber-300 shadow-sm transition-all hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer self-stretch sm:self-end"
              title="View or upload syllabus textbooks & PPT slides for this subject"
            >
              <BookOpen className="w-4 h-4 text-gray-950" />
              <span>Book / PPT</span>
            </button>
          )}
        </div>

        {chaptersError && (
          <div className="mt-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{chaptersError}</span>
          </div>
        )}
      </div>

      {/* Main content */}
      {selectedChapterId ? (
        <MasteryRevisionSuite
          key={selectedChapterId}
          selectedSubjectId={selectedSubjectId}
          selectedChapterId={selectedChapterId}
          chapterName={currentChapter?.name || 'Chapter'}
          subjectName={subject?.name || 'Subject'}
          onNavigateToQuiz={onNavigateToQuiz}
        />
      ) : (
        <div className="student-card p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-2xl mx-auto mb-3">
            📚
          </div>
          <h3 className="text-base font-extrabold text-gray-900">No Chapter Selected</h3>
          <p className="text-xs text-gray-500 mt-1 font-medium">
            Select a subject and chapter to start the Mastery &amp; Revision Suite.
          </p>
        </div>
      )}

      {/* Reference Textbooks & Lecture PPTs Modal */}
      {subject && (
        <ReferenceBooksModal
          isOpen={isBooksModalOpen}
          onClose={() => setIsBooksModalOpen(false)}
          subjectId={subject.id}
          subjectCode={subject.code}
          subjectName={subject.name}
        />
      )}
    </div>
  );
}
