import React, { useState } from 'react';
import { 
  X, 
  Key, 
  CheckCircle2, 
  Plus, 
  ExternalLink 
} from 'lucide-react';
import api from '../services/api';

export default function SettingsModal({ 
  isOpen, 
  onClose, 
  apiStatus, 
  onStatusUpdated,
  onSubjectCreated 
}) {
  const [geminiKey, setGeminiKey] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');
  const [isSavingKeys, setIsSavingKeys] = useState(false);
  const [keySaveMsg, setKeySaveMsg] = useState('');

  // New Subject fields
  const [newSubName, setNewSubName] = useState('');
  const [newSubCode, setNewSubCode] = useState('');
  const [newSubExam, setNewSubExam] = useState('Semester 5 University Exam');
  const [newSubMarks, setNewSubMarks] = useState(100);
  const [isCreatingSub, setIsCreatingSub] = useState(false);
  const [subSuccessMsg, setSubSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleSaveKeys = async () => {
    setIsSavingKeys(true);
    setKeySaveMsg('');
    try {
      await api.updateApiKeys({
        gemini_api_key: geminiKey || undefined,
        openai_api_key: openaiKey || undefined
      });
      setKeySaveMsg('API keys saved and live in runtime!');
      if (onStatusUpdated) onStatusUpdated();
      setGeminiKey('');
      setOpenaiKey('');
    } catch (err) {
      console.error(err);
      setKeySaveMsg('Failed to update API keys.');
    } finally {
      setIsSavingKeys(false);
    }
  };

  const handleCreateSubject = async (e) => {
    e.preventDefault();
    if (!newSubName.trim()) return;

    setIsCreatingSub(true);
    setSubSuccessMsg('');
    try {
      const res = await api.createSubject({
        name: newSubName.trim(),
        code: newSubCode.trim() || undefined,
        target_exam: newSubExam.trim(),
        total_marks: parseFloat(newSubMarks) || 100
      });
      setSubSuccessMsg(`Subject "${res.data.name}" added successfully!`);
      if (onSubjectCreated) onSubjectCreated(res.data.id);
      setNewSubName('');
      setNewSubCode('');
    } catch (err) {
      console.error(err);
      setSubSuccessMsg('Failed to create subject.');
    } finally {
      setIsCreatingSub(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-xl rounded-3xl border border-gray-100 shadow-2xl p-6 sm:p-8 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <h2 className="text-xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2 mb-1">
          <Key className="w-5 h-5 text-gray-900" />
          Settings & AI Configuration
        </h2>
        <p className="text-xs text-gray-400 mb-6 font-medium">
          Configure Google GenAI & OpenAI API keys or add university courses.
        </p>

        {/* Current Connection Status */}
        <div className="p-4 rounded-2xl bg-[#F8F9FC] border border-gray-100 mb-6 grid grid-cols-2 gap-3 text-xs">
          <div>
            <p className="text-gray-400 font-medium">Google Gemini GenAI</p>
            <p className="font-extrabold text-gray-900 flex items-center gap-1.5 mt-1">
              <span className={`w-2 h-2 rounded-full ${apiStatus?.gemini_configured ? 'bg-emerald-500' : 'bg-amber-400'}`} />
              {apiStatus?.gemini_configured ? 'Live API Connected' : 'Academic Smart Fallback'}
            </p>
          </div>
          <div>
            <p className="text-gray-400 font-medium">OpenAI ChatGPT</p>
            <p className="font-extrabold text-gray-900 flex items-center gap-1.5 mt-1">
              <span className={`w-2 h-2 rounded-full ${apiStatus?.openai_configured ? 'bg-emerald-500' : 'bg-amber-400'}`} />
              {apiStatus?.openai_configured ? 'Live API Connected' : 'Academic Smart Fallback'}
            </p>
          </div>
        </div>

        {/* API Keys Inputs */}
        <div className="space-y-4 mb-6 pb-6 border-b border-gray-100">
          <h3 className="text-xs font-black uppercase tracking-wider text-gray-700">
            Set / Update Official API Keys
          </h3>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-gray-700">
                Google Gemini API Key
              </label>
              <a
                href="https://aistudio.google.com/"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-gray-500 hover:text-gray-900 font-bold flex items-center gap-1"
              >
                Get Key <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <input
              type="password"
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full bg-[#F8F9FC] border border-gray-200 rounded-xl px-3.5 py-2 text-xs font-mono text-gray-900 focus:outline-none focus:border-gray-400"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-gray-700">
                OpenAI API Key
              </label>
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-gray-500 hover:text-gray-900 font-bold flex items-center gap-1"
              >
                Get Key <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <input
              type="password"
              value={openaiKey}
              onChange={(e) => setOpenaiKey(e.target.value)}
              placeholder="sk-proj-..."
              className="w-full bg-[#F8F9FC] border border-gray-200 rounded-xl px-3.5 py-2 text-xs font-mono text-gray-900 focus:outline-none focus:border-gray-400"
            />
          </div>

          <button
            onClick={handleSaveKeys}
            disabled={isSavingKeys || (!geminiKey && !openaiKey)}
            className="w-full py-2.5 rounded-full bg-accentYellow hover:bg-accentYellowHover text-gray-950 font-extrabold text-xs transition-all shadow-sm disabled:opacity-40"
          >
            {isSavingKeys ? 'Saving...' : 'Save API Keys'}
          </button>

          {keySaveMsg && (
            <p className="text-xs text-emerald-700 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> {keySaveMsg}
            </p>
          )}
        </div>

        {/* Add New Subject Section */}
        <div>
          <h3 className="text-xs font-black uppercase tracking-wider text-gray-700 mb-3">
            Add New Curriculum / Course
          </h3>

          <form onSubmit={handleCreateSubject} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">Course Name</label>
                <input
                  type="text"
                  required
                  value={newSubName}
                  onChange={(e) => setNewSubName(e.target.value)}
                  placeholder="e.g. Computer Networks"
                  className="w-full bg-[#F8F9FC] border border-gray-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-gray-900 focus:outline-none focus:border-gray-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">Course Code</label>
                <input
                  type="text"
                  value={newSubCode}
                  onChange={(e) => setNewSubCode(e.target.value)}
                  placeholder="e.g. CS503"
                  className="w-full bg-[#F8F9FC] border border-gray-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-gray-900 focus:outline-none focus:border-gray-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isCreatingSub || !newSubName.trim()}
              className="w-full py-2.5 rounded-full bg-accentNavy hover:bg-black text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              {isCreatingSub ? 'Creating...' : 'Create Course'}
            </button>

            {subSuccessMsg && (
              <p className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> {subSuccessMsg}
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
