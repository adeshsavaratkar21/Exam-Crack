import React from 'react';
import { Search, Bell, Settings } from 'lucide-react';

export default function TopHeader({ 
  studentName = "Melissa",
  studentProfile,
  onOpenSettings,
  onOpenProfile,
  searchQuery,
  setSearchQuery
}) {
  const displayName = studentProfile?.name ? studentProfile.name.split(' ')[0] : studentName;
  return (
    <header className="mb-8">
      {/* Top Row: Greeting + Search Bar + Bell + Settings */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Personalized Greeting */}
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            Hello {displayName} <span className="text-amber-400">👋</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 font-medium mt-0.5">
            Let's learn something new today !
          </p>
        </div>

        {/* Search Bar + Bell + Settings + Profile Avatar */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          {/* Pill Search Input */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery || ''}
              onChange={(e) => setSearchQuery && setSearchQuery(e.target.value)}
              placeholder="Search for classes, tasks, etc..."
              className="w-full bg-white border border-gray-200/90 rounded-full py-2.5 pl-11 pr-4 text-xs sm:text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-400 shadow-sm transition-colors"
            />
          </div>

          {/* Notification Bell Pill */}
          <button 
            title="Notifications"
            className="relative w-10 h-10 rounded-2xl bg-white border border-gray-200/90 flex items-center justify-center text-gray-600 hover:text-gray-900 shadow-sm hover:bg-gray-50 transition-colors shrink-0"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
          </button>

          {/* Settings button */}
          <button
            onClick={onOpenSettings}
            title="Settings & API Configuration"
            className="w-10 h-10 rounded-2xl bg-white border border-gray-200/90 flex items-center justify-center text-gray-600 hover:text-gray-900 shadow-sm hover:bg-gray-50 transition-colors shrink-0"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Profile Avatar Button (Clickable) */}
          {studentProfile && (
            <button
              onClick={onOpenProfile}
              title={`Edit Profile (${displayName})`}
              className="w-10 h-10 rounded-2xl p-0.5 bg-white border border-gray-200/90 shadow-sm hover:ring-2 hover:ring-accentYellow transition-all shrink-0 overflow-hidden flex items-center justify-center"
            >
              <img
                src={studentProfile.avatar}
                alt={displayName}
                className="w-full h-full object-cover rounded-[14px]"
                onError={(e) => {
                  e.currentTarget.src = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80";
                }}
              />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
