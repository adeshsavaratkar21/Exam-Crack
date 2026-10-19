import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Layers, 
  HelpCircle, 
  FileText, 
  Target, 
  Sparkles, 
  Settings, 
  Cpu, 
  CheckCircle2, 
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import api from '../services/api';

export default function Navbar({ 
  currentTab, 
  setCurrentTab, 
  subjects, 
  selectedSubjectId, 
  setSelectedSubjectId,
  onOpenSettings,
  apiStatus,
  refreshSubjects
}) {
  const currentSubject = subjects.find(s => s.id === Number(selectedSubjectId)) || subjects[0];

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Layers },
    { id: 'pyq', label: 'PYQ Hub', icon: BookOpen },
    { id: 'quiz', label: 'Daily Quiz', icon: HelpCircle },
    { id: 'notes', label: 'Dual-AI Notes', icon: FileText },
    { id: 'readiness', label: 'Readiness Tracker', icon: Target },
  ];

  return (
    <nav className="glass-panel sticky top-0 z-50 border-b border-dark-border px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand & Subject Selector */}
        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
          <div 
            onClick={() => setCurrentTab('dashboard')} 
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-lg bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent tracking-tight">
                ExamPrep<span className="text-brand-400">AI</span>
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-300 border border-brand-500/20">
                Production v1.0
              </span>
            </div>
          </div>

          {/* Subject Dropdown */}
          {subjects.length > 0 && (
            <div className="flex items-center gap-2">
              <select
                value={selectedSubjectId || ''}
                onChange={(e) => setSelectedSubjectId(Number(e.target.value))}
                className="bg-dark-card border border-dark-border text-xs sm:text-sm text-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-brand-500 transition-colors cursor-pointer"
              >
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.code ? `[${sub.code}] ` : ''}{sub.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-600/25'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-dark-cardLight'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                {item.label}
              </button>
            );
          })}
        </div>

        {/* AI Health Indicators & Settings Button */}
        <div className="flex items-center gap-2 sm:gap-3 w-full md:w-auto justify-end">
          {/* Gemini Badge */}
          <div 
            title={apiStatus?.gemini_configured ? "Google GenAI SDK Active (Official)" : "Gemini in Academic Smart Fallback Mode"}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] bg-dark-card border border-dark-border"
          >
            <span className={`w-2 h-2 rounded-full ${apiStatus?.gemini_configured ? 'bg-emerald-400 animate-pulse' : 'bg-indigo-400'}`} />
            <span className="text-gray-300 font-medium">Gemini</span>
          </div>

          {/* OpenAI Badge */}
          <div 
            title={apiStatus?.openai_configured ? "OpenAI SDK Active (Official)" : "OpenAI in Academic Smart Fallback Mode"}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] bg-dark-card border border-dark-border"
          >
            <span className={`w-2 h-2 rounded-full ${apiStatus?.openai_configured ? 'bg-emerald-400 animate-pulse' : 'bg-cyan-400'}`} />
            <span className="text-gray-300 font-medium">ChatGPT</span>
          </div>

          {/* Settings Trigger */}
          <button
            onClick={onOpenSettings}
            title="Configure API Keys & Curriculum"
            className="p-1.5 rounded-lg text-gray-400 hover:text-white bg-dark-card hover:bg-dark-hover border border-dark-border transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </nav>
  );
}
