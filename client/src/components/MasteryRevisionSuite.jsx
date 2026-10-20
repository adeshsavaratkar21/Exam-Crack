import React, { useState, useEffect, useCallback } from 'react';
import {
  Brain,
  MessageSquareQuote,
  ScrollText,
  Lock,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import ConceptTutorTab from './ConceptTutorTab';
import TutorChatTab from './TutorChatTab';
import RevisionSheetTab from './RevisionSheetTab';
import api from '../services/api';

const TABS = [
  { id: 'tutor', label: 'Concept Tutor', icon: Brain },
  { id: 'chat', label: 'AI Doubt Solver', icon: MessageSquareQuote },
  { id: 'sheet', label: 'Revision Sheet', icon: ScrollText },
];

export default function MasteryRevisionSuite({
  selectedSubjectId,
  selectedChapterId,
  chapterName,
  subjectName,
  onNavigateToQuiz,
}) {
  const [activeTab, setActiveTab] = useState('tutor');

  /* ── Tutor state ── */
  const [tutorData, setTutorData] = useState(null);
  const [tutorLoading, setTutorLoading] = useState(false);
  const [tutorGenerating, setTutorGenerating] = useState(false);
  const [tutorError, setTutorError] = useState('');
  const [isModuleCompleted, setIsModuleCompleted] = useState(false);

  /* ── Revision sheet state ── */
  const [revisionData, setRevisionData] = useState(null);
  const [sheetLoading, setSheetLoading] = useState(false);
  const [sheetGenerating, setSheetGenerating] = useState(false);
  const [sheetError, setSheetError] = useState('');

  /* ── Load existing tutor content on chapter change ── */
  useEffect(() => {
    if (!selectedChapterId) return;

    setTutorData(null);
    setRevisionData(null);
    setIsModuleCompleted(false);
    setTutorError('');
    setSheetError('');
    setActiveTab('tutor');

    // Fetch existing tutor notes
    setTutorLoading(true);
    api
      .getChapterNotes(selectedChapterId)
      .then((res) => {
        const d = res.data;
        // Support both old DualNotesResponse and new unified structure
        const unifiedMd = d.unified_md || d.gemini_summary_md || '';
        if (unifiedMd) {
          setTutorData(buildTutorFromResponse(d));
          setIsModuleCompleted(d.module_completed || false);
        }
      })
      .catch((err) => {
        if (err.response?.status !== 404) {
          setTutorError('Failed to fetch notes. You can generate new ones below.');
        }
      })
      .finally(() => setTutorLoading(false));
  }, [selectedChapterId]);

  /* ── Load revision sheet when module is completed ── */
  useEffect(() => {
    if (!selectedChapterId || !isModuleCompleted) return;

    setSheetLoading(true);
    api
      .getRevisionSheet(selectedChapterId)
      .then((res) => setRevisionData(res.data))
      .catch((err) => {
        // 404 means not generated yet — that's OK
        if (err.response?.status !== 404) {
          setSheetError('Failed to load revision sheet.');
        }
      })
      .finally(() => setSheetLoading(false));
  }, [selectedChapterId, isModuleCompleted]);

  /* ── Generate tutor ── */
  const handleGenerateTutor = useCallback(
    async (force = false) => {
      if (!selectedChapterId || !selectedSubjectId) return;
      setTutorGenerating(true);
      setTutorError('');
      try {
        const res = await api.generateMasteryNotes({
          subject_id: Number(selectedSubjectId),
          chapter_id: Number(selectedChapterId),
          force_regenerate: force,
        });
        setTutorData(buildTutorFromResponse(res.data));
        setIsModuleCompleted(res.data.module_completed || false);
      } catch (err) {
        console.error('Tutor generation error:', err);
        setTutorError(err.response?.data?.detail || 'Failed to generate tutor content.');
      } finally {
        setTutorGenerating(false);
      }
    },
    [selectedChapterId, selectedSubjectId]
  );

  /* ── Mark module complete ── */
  const handleMarkComplete = useCallback(async () => {
    if (!selectedChapterId) return;
    try {
      await api.markModuleComplete(selectedChapterId);
      setIsModuleCompleted(true);
      setActiveTab('sheet');
    } catch (err) {
      console.error('Mark complete error:', err);
      // Optimistically unlock anyway
      setIsModuleCompleted(true);
      setActiveTab('sheet');
    }
  }, [selectedChapterId]);

  /* ── Generate revision sheet ── */
  const handleGenerateRevisionSheet = useCallback(
    async (force = false) => {
      if (!selectedChapterId || !selectedSubjectId) return;
      setSheetGenerating(true);
      setSheetError('');
      try {
        const res = await api.generateRevisionSheet({
          subject_id: Number(selectedSubjectId),
          chapter_id: Number(selectedChapterId),
          force_regenerate: force,
        });
        setRevisionData(res.data);
      } catch (err) {
        console.error('Sheet generation error:', err);
        setSheetError(err.response?.data?.detail || 'Failed to generate revision sheet.');
      } finally {
        setSheetGenerating(false);
      }
    },
    [selectedChapterId, selectedSubjectId]
  );

  /* ── Chat initial query ── */
  const [chatInitialQuery, setChatInitialQuery] = useState('');

  const handleOpenChat = useCallback((query = '') => {
    setChatInitialQuery(query);
    setActiveTab('chat');
  }, []);

  return (
    <div className="space-y-5">
      {/* Tab bar */}
      <div className="student-card p-2 flex items-center gap-1.5">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isSheet = tab.id === 'sheet';
          const locked = isSheet && !isModuleCompleted;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => !locked && setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? 'bg-gray-900 text-white shadow-sm'
                  : locked
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              aria-selected={isActive}
              role="tab"
              disabled={locked}
              title={locked ? 'Complete the Concept Tutor module to unlock' : undefined}
            >
              {locked ? (
                <Lock className="w-3.5 h-3.5" />
              ) : (
                <Icon className="w-3.5 h-3.5" />
              )}
              {tab.label}
              {isSheet && isModuleCompleted && (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              )}
            </button>
          );
        })}

        {/* Quiz shortcut */}
        <div className="w-px h-7 bg-gray-100 mx-1" />
        <button
          onClick={() => onNavigateToQuiz && onNavigateToQuiz(selectedChapterId)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-gray-600 hover:bg-gray-100 text-xs font-bold transition-all"
          title="Test yourself with a quiz"
        >
          <HelpCircle className="w-3.5 h-3.5 text-gray-500" />
          Quiz
        </button>
      </div>

      {/* Tab content */}
      <div role="tabpanel">
        {activeTab === 'tutor' && (
          <ConceptTutorTab
            chapterId={selectedChapterId}
            chapterName={chapterName}
            subjectName={subjectName}
            tutorData={tutorData}
            loading={tutorLoading}
            isGenerating={tutorGenerating}
            errorMsg={tutorError}
            isCompleted={isModuleCompleted}
            onGenerate={handleGenerateTutor}
            onMarkComplete={handleMarkComplete}
            onOpenChat={handleOpenChat}
          />
        )}

        {activeTab === 'chat' && (
          <TutorChatTab
            chapterId={selectedChapterId}
            chapterName={chapterName}
            subjectName={subjectName}
            subjectId={selectedSubjectId}
            initialQuery={chatInitialQuery}
          />
        )}

        {activeTab === 'sheet' && (
          <RevisionSheetTab
            chapterId={selectedChapterId}
            chapterName={chapterName}
            subjectName={subjectName}
            revisionData={revisionData}
            loading={sheetLoading}
            isGenerating={sheetGenerating}
            errorMsg={sheetError}
            isModuleCompleted={isModuleCompleted}
            onGenerate={handleGenerateRevisionSheet}
          />
        )}
      </div>
    </div>
  );
}

/* ── Helper: normalise the notes API response into tutor shape ── */
function buildTutorFromResponse(d) {
  if (!d) return null;

  // If backend returns structured steps array, use it directly
  if (Array.isArray(d.steps) && d.steps.length > 0) {
    return d;
  }

  // Backward-compat: convert flat md to steps by H3 sections
  const md = d.unified_md || d.gemini_summary_md || '';
  return {
    ...d,
    unified_md: md,
    steps: null, // parser in ConceptTutorTab handles null
  };
}
