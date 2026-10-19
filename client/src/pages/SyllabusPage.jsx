import React, { useState, useEffect } from 'react';
import { 
  Sliders, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  Percent 
} from 'lucide-react';
import ReadinessChart from '../components/ReadinessChart';
import api from '../services/api';

export default function SyllabusPage({ 
  selectedSubjectId, 
  subjects, 
  onNavigateToQuiz, 
  onNavigateToNotes,
  refreshSubjects
}) {
  const [report, setReport] = useState(null);
  const [totalMarks, setTotalMarks] = useState(100);
  const [chapterWeights, setChapterWeights] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(true);

  const currentSubject = subjects.find(s => s.id === Number(selectedSubjectId)) || subjects[0];

  const loadData = async () => {
    if (!selectedSubjectId) return;
    setLoading(true);
    try {
      const res = await api.getReadinessReport(selectedSubjectId);
      setReport(res.data);
      setTotalMarks(res.data.total_marks || 100);
      setChapterWeights(
        (res.data.all_topics || []).map(t => ({
          chapter_id: t.chapter_id,
          name: t.chapter_name,
          weightage_marks: t.weightage_marks
        }))
      );
    } catch (err) {
      console.error('Failed to load readiness report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedSubjectId]);

  const handleWeightChange = (chapterId, val) => {
    const num = Math.max(0, parseFloat(val) || 0);
    setChapterWeights(prev =>
      prev.map(c => (c.chapter_id === chapterId ? { ...c, weightage_marks: num } : c))
    );
  };

  const handleDistributeEvenly = () => {
    if (chapterWeights.length === 0) return;
    const evenMarks = Math.round((totalMarks / chapterWeights.length) * 10) / 10;
    setChapterWeights(prev =>
      prev.map(c => ({ ...c, weightage_marks: evenMarks }))
    );
  };

  const handleSaveWeights = async () => {
    setIsSaving(true);
    setErrorMsg('');
    setSaveSuccess(false);

    try {
      const payload = {
        subject_id: Number(selectedSubjectId),
        total_marks: parseFloat(totalMarks) || 100.0,
        chapters: chapterWeights.map(c => ({
          chapter_id: c.chapter_id,
          weightage_marks: c.weightage_marks
        }))
      };

      const res = await api.updateWeightage(payload);
      setReport(res.data);
      setSaveSuccess(true);
      if (refreshSubjects) refreshSubjects();
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Save weightage error:', err);
      setErrorMsg(err.response?.data?.detail || 'Failed to update weightage distributions.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleComplete = async (chapterId) => {
    try {
      await api.toggleChapterComplete(chapterId);
      await loadData();
    } catch (err) {
      console.error('Failed to toggle completion:', err);
    }
  };

  const sumMarks = chapterWeights.reduce((acc, c) => acc + (parseFloat(c.weightage_marks) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Weightage & Marks Distribution Editor */}
      <div className="student-card p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
              <Sliders className="w-5 h-5 text-gray-900" />
              Strategic Exam Weightage Distribution
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1">
              Configure total exam marks and chapter weightages. The system dynamically computes the Exam Readiness Index.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDistributeEvenly}
              className="text-xs px-3.5 py-1.5 rounded-full border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition-colors shadow-sm"
            >
              Distribute Evenly
            </button>
            <button
              onClick={handleSaveWeights}
              disabled={isSaving}
              className="flex items-center gap-1.5 text-xs font-extrabold px-4 py-1.5 rounded-full bg-accentYellow hover:bg-accentYellowHover text-gray-950 shadow-sm transition-all"
            >
              <Save className="w-3.5 h-3.5" />
              {isSaving ? 'Saving...' : 'Save Blueprint'}
            </button>
          </div>
        </div>

        {/* Global Total Marks Input */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-[#F8F9FC] p-4 rounded-2xl border border-gray-100 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-sm">
              %
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900">Subject Maximum Exam Marks</p>
              <p className="text-[11px] text-gray-400 font-medium">
                Semester theory exam target marks (e.g., 100, 70, 80)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 font-medium">Allocated Sum:</span>
            <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
              Math.abs(sumMarks - totalMarks) < 0.1 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                : 'bg-amber-50 text-amber-800 border-amber-200'
            }`}>
              {sumMarks.toFixed(1)} / {totalMarks} Marks
            </span>

            <input
              type="number"
              value={totalMarks}
              onChange={(e) => setTotalMarks(parseFloat(e.target.value) || 0)}
              className="w-24 bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-sm font-bold text-gray-900 text-right focus:outline-none focus:border-gray-400 shadow-sm"
            />
          </div>
        </div>

        {/* Chapter Weight Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mb-4">
          {chapterWeights.map((ch) => {
            const calculatedPct = totalMarks > 0 ? ((ch.weightage_marks / totalMarks) * 100).toFixed(1) : 0;
            return (
              <div
                key={ch.chapter_id}
                className="p-4 rounded-2xl bg-[#F8F9FC] border border-gray-100 flex items-center justify-between gap-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-gray-900 truncate">
                    {ch.name}
                  </p>
                  <p className="text-[11px] text-amber-700 font-bold mt-0.5">
                    {calculatedPct}% of Total Paper
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.5"
                    value={ch.weightage_marks}
                    onChange={(e) => handleWeightChange(ch.chapter_id, e.target.value)}
                    className="w-20 bg-white border border-gray-200 rounded-xl px-2.5 py-1 text-xs font-bold text-gray-900 text-right focus:outline-none focus:border-gray-400 shadow-sm"
                  />
                  <span className="text-xs text-gray-500 font-semibold">Marks</span>
                </div>
              </div>
            );
          })}
        </div>

        {saveSuccess && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Exam weightage blueprint updated and Readiness Index recalculated!</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Strategic Focus Matrix & Comprehensive Report */}
      <ReadinessChart
        report={report}
        onNavigateToQuiz={onNavigateToQuiz}
        onNavigateToNotes={onNavigateToNotes}
        onToggleComplete={handleToggleComplete}
      />
    </div>
  );
}
