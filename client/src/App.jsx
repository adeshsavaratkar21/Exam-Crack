import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import TopHeader from './components/TopHeader';
import RightRail from './components/RightRail';
import Dashboard from './pages/Dashboard';
import CoursesPage from './pages/CoursesPage';
import FileUploader from './components/FileUploader';
import QuizPage from './pages/QuizPage';
import NotesPage from './pages/NotesPage';
import SyllabusPage from './pages/SyllabusPage';
import SettingsModal from './components/SettingsModal';
import ProfileModal from './components/ProfileModal';
import api from './services/api';

export default function App() {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);
  const [activeChapterForQuiz, setActiveChapterForQuiz] = useState(null);
  const [activeChapterForNotes, setActiveChapterForNotes] = useState(null);
  const [apiStatus, setApiStatus] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [urgentTopicsCount, setUrgentTopicsCount] = useState(0);

  // Student Profile state loaded from localStorage with default fallback
  const [studentProfile, setStudentProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('examprep_student_profile');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load student profile:', e);
    }
    return {
      name: "Adesh Savaratkar",
      email: "adesh.savaratkar24@spit.ac.in",
      program: "Semester 5 • Computer Engineering (SPIT)",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"
    };
  });

  const handleSaveProfile = (updatedProfile) => {
    setStudentProfile(updatedProfile);
    localStorage.setItem('examprep_student_profile', JSON.stringify(updatedProfile));
  };

  // Fetch subjects and API status on launch
  const loadInitialData = async () => {
    try {
      const [subjectsRes, statusRes] = await Promise.all([
        api.getSubjects(),
        api.getApiStatus()
      ]);

      const subList = subjectsRes.data || [];
      setSubjects(subList);
      if (subList.length > 0 && !selectedSubjectId) {
        setSelectedSubjectId(subList[0].id);
      }
      setApiStatus(statusRes.data);

      if (subList.length > 0) {
        api.getReadinessReport(subList[0].id)
          .then(r => setUrgentTopicsCount(r.data?.urgent_topics?.length || 0))
          .catch(() => {});
      }
    } catch (err) {
      console.error('Failed to load initial data:', err);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const handleLaunchQuizForChapter = (chapterId) => {
    setActiveChapterForQuiz(chapterId);
    setCurrentTab('quiz');
  };

  const handleViewNotesForChapter = (chapterId) => {
    setActiveChapterForNotes(chapterId);
    setCurrentTab('notes');
  };

  const currentSubject = subjects.find(s => s.id === Number(selectedSubjectId)) || subjects[0];

  return (
    <div className="min-h-screen bg-[#EEF1F6] flex justify-center p-0 sm:p-4 lg:p-6 text-gray-900 font-sans">
      {/* Main Unified App Canvas (matching reference card container) */}
      <div className="w-full max-w-[1600px] bg-white sm:rounded-[36px] shadow-sm border border-gray-200/60 overflow-hidden flex flex-col lg:flex-row min-h-[92vh]">
        
        {/* 1. Left Sidebar Navigation */}
        <Sidebar
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          urgentCount={urgentTopicsCount}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenHelp={() => setCurrentTab('notes')}
          studentProfile={studentProfile}
          onOpenProfile={() => setIsProfileOpen(true)}
        />

        {/* 2. Center Main View Area */}
        <div className="flex-1 flex flex-col p-6 sm:p-8 lg:p-10 overflow-y-auto bg-[#F8F9FD]">
          {/* Top Header with Greeting, Search Bar, Profile Avatar */}
          <TopHeader
            studentName={studentProfile.name}
            studentProfile={studentProfile}
            subjects={subjects}
            selectedSubjectId={selectedSubjectId}
            setSelectedSubjectId={setSelectedSubjectId}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenProfile={() => setIsProfileOpen(true)}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />

          {/* Active Tab View */}
          <main className="flex-1">
            {currentTab === 'dashboard' && (
              <Dashboard
                selectedSubjectId={selectedSubjectId}
                setSelectedSubjectId={setSelectedSubjectId}
                subjects={subjects}
                onNavigateTab={setCurrentTab}
                onLaunchQuizForChapter={handleLaunchQuizForChapter}
                onViewNotesForChapter={handleViewNotesForChapter}
              />
            )}

            {currentTab === 'courses' && (
              <CoursesPage
                selectedSubjectId={selectedSubjectId}
                setSelectedSubjectId={setSelectedSubjectId}
                subjects={subjects}
                onLaunchQuizForChapter={handleLaunchQuizForChapter}
                onViewNotesForChapter={handleViewNotesForChapter}
                onNavigateTab={setCurrentTab}
              />
            )}

            {currentTab === 'pyq' && (
              <FileUploader
                selectedSubjectId={selectedSubjectId}
                subjects={subjects}
                onNavigateToQuiz={handleLaunchQuizForChapter}
              />
            )}

            {currentTab === 'quiz' && (
              <QuizPage
                selectedSubjectId={selectedSubjectId}
                subjects={subjects}
                initialChapterId={activeChapterForQuiz}
                onNavigateToNotes={handleViewNotesForChapter}
              />
            )}

            {currentTab === 'notes' && (
              <NotesPage
                selectedSubjectId={selectedSubjectId}
                subjects={subjects}
                initialChapterId={activeChapterForNotes}
                onNavigateToQuiz={handleLaunchQuizForChapter}
              />
            )}

            {currentTab === 'readiness' && (
              <SyllabusPage
                selectedSubjectId={selectedSubjectId}
                subjects={subjects}
                onNavigateToQuiz={handleLaunchQuizForChapter}
                onNavigateToNotes={handleViewNotesForChapter}
                refreshSubjects={loadInitialData}
              />
            )}
          </main>
        </div>

        {/* 3. Right Rail (Profile, Mini Calendar, Schedule & Reminders) */}
        <div className="hidden xl:block">
          <RightRail
            currentSubject={currentSubject}
            subjects={subjects}
            selectedSubjectId={selectedSubjectId}
            onSelectSubject={(id) => {
              setSelectedSubjectId(id);
            }}
            studentProfile={studentProfile}
            onOpenEditProfile={() => setIsProfileOpen(true)}
            onNavigateToQuiz={handleLaunchQuizForChapter}
            onNavigateToNotes={handleViewNotesForChapter}
            onNavigateTab={setCurrentTab}
          />
        </div>
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        apiStatus={apiStatus}
        onStatusUpdated={loadInitialData}
        onSubjectCreated={(newId) => {
          loadInitialData().then(() => {
            if (newId) setSelectedSubjectId(newId);
          });
        }}
      />

      {/* Edit Profile Modal (Workable button & persistence) */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        currentProfile={studentProfile}
        onSaveProfile={handleSaveProfile}
      />
    </div>
  );
}
