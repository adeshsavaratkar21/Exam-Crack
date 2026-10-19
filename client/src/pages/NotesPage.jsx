import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Sparkles, 
  AlertCircle, 
  HelpCircle 
} from 'lucide-react';
import SplitNotesViewer from '../components/SplitNotesViewer';
import api from '../services/api';

export default function NotesPage({ 
  selectedSubjectId, 
  subjects, 
  initialChapterId,
  onNavigateToQuiz 
}) {
  const [chapters, setChapters] = useState([]);
  const [selectedChapterId, setSelectedChapterId] = useState(initialChapterId || null);
  const [notesData, setNotesData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
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

    setLoading(true);
    setErrorMsg('');
    api.getChapterNotes(selectedChapterId)
      .then(res => {
        setNotesData(res.data);
      })
      .catch(err => {
        if (err.response?.status === 404) {
          setNotesData(null);
        } else {
          setErrorMsg('Failed to fetch existing notes.');
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, [selectedChapterId]);

  const handleGenerateNotes = async (force = false) => {
    if (!selectedChapterId || !selectedSubjectId) return;

    setIsGenerating(true);
    setErrorMsg('');
    try {
      const res = await api.generateDualNotes({
        subject_id: Number(selectedSubjectId),
        chapter_id: Number(selectedChapterId),
        force_regenerate: force
      });
      setNotesData(res.data);
    } catch (err) {
      console.error('Error generating dual notes:', err);
      setErrorMsg(err.response?.data?.detail || 'Failed to generate dual notes.');
    } finally {
      setIsGenerating(false);
    }
  };

  const currentChapter = chapters.find(c => c.id === Number(selectedChapterId));

  return (
    <div className="space-y-6">
      {/* Top Controller */}
      <div className="student-card p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
              <FileText className="w-5 h-5 text-gray-900" />
              Dual-AI 1-Page Summary Revision Notes
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1">
              Parallel structured syntheses: Gemini (Theory, Proofs & Pitfalls) alongside OpenAI (Mnemonics & Comparison Tables).
            </p>
          </div>

          <span className="text-xs px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200/80 font-bold">
            Side-by-Side Dual Engine
          </span>
        </div>

        {/* Chapter Selection & Action Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex-1 max-w-md">
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Select Chapter to Review
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

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigateToQuiz(selectedChapterId)}
              className="py-2.5 px-4 rounded-full border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
            >
              <HelpCircle className="w-3.5 h-3.5 text-gray-500" />
              Test with Quiz
            </button>

            <button
              onClick={() => handleGenerateNotes(true)}
              disabled={isGenerating || !selectedChapterId}
              className="py-2.5 px-6 rounded-full bg-accentYellow hover:bg-accentYellowHover text-gray-950 font-extrabold text-xs shadow-sm transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {isGenerating ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" />
                  Generating Dual Notes...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  {notesData ? 'Regenerate Dual Notes' : 'Generate Dual-AI Notes'}
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

      {/* Main Dual Notes Viewer */}
      {loading ? (
        <div className="student-card p-12 text-center">
          <div className="w-8 h-8 rounded-full border-4 border-gray-200 border-t-gray-950 animate-spin mx-auto mb-3" />
          <p className="text-xs font-semibold text-gray-500">Retrieving Dual-AI revision notes...</p>
        </div>
      ) : notesData ? (
        <SplitNotesViewer
          notesData={notesData}
          onRegenerate={() => handleGenerateNotes(true)}
          isRegenerating={isGenerating}
          onNavigateToQuiz={onNavigateToQuiz}
        />
      ) : (
        <div className="student-card p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500 mx-auto mb-3 text-2xl">
            📝
          </div>
          <h3 className="text-base font-extrabold text-gray-900">
            No revision sheet generated for "{currentChapter?.name}" yet
          </h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto mt-1 mb-5 font-medium">
            Generate two complementary 1-page summaries in parallel: Google Gemini for theoretical rigor and proofs, and OpenAI for mnemonics and comparison tables.
          </p>
          <button
            onClick={() => handleGenerateNotes(false)}
            disabled={isGenerating}
            className="inline-flex items-center gap-2 py-2.5 px-6 rounded-full bg-accentNavy hover:bg-black text-white font-bold text-xs shadow-sm transition-all"
          >
            <Sparkles className="w-4 h-4 text-accentYellow" />
            Generate Dual-AI 1-Page Summary Now
          </button>
        </div>
      )}
    </div>
  );
}
