import React from 'react';
import { 
  LayoutDashboard, 
  FolderGit2, 
  HelpCircle, 
  FileText, 
  Target, 
  BookOpen, 
  Settings, 
  GraduationCap,
  Sparkles,
  HelpCircle as HelpIcon,
  Bell,
  Edit3,
  User
} from 'lucide-react';

export default function Sidebar({ 
  currentTab, 
  setCurrentTab, 
  urgentCount = 0,
  onOpenSettings,
  onOpenHelp,
  studentProfile,
  onOpenProfile
}) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'courses', label: 'My Courses', icon: FolderGit2 },
    { id: 'quiz', label: 'Daily Quiz', icon: HelpCircle, badge: urgentCount > 0 ? urgentCount : null },
    { id: 'notes', label: 'Dual-AI Notes', icon: FileText },
    { id: 'readiness', label: 'Readiness Tracker', icon: Target },
    { id: 'pyq', label: 'PYQ Papers', icon: BookOpen },
  ];

  return (
    <aside className="w-64 bg-white border-r border-softBorder/80 flex flex-col justify-between p-6 shrink-0 min-h-screen">
      <div>
        {/* Brand Logo */}
        <div 
          onClick={() => setCurrentTab('dashboard')}
          className="flex items-center gap-3 cursor-pointer mb-8 px-2 group"
        >
          <div className="w-10 h-10 rounded-xl bg-accentYellow flex items-center justify-center font-black text-gray-950 text-xl shadow-sm group-hover:scale-105 transition-transform">
            ⚡
          </div>
          <div>
            <span className="font-extrabold text-base tracking-tight text-gray-900 block leading-tight">
              EXAM<br /><span className="text-gray-950">ACADEMY</span>
            </span>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-accentYellow text-gray-950 shadow-sm'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-gray-950' : 'text-gray-400'}`} />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[11px] font-bold flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Auxiliary Menu */}
        <div className="mt-6 pt-6 border-t border-gray-100 space-y-1.5">
          <button
            onClick={onOpenSettings}
            className="w-full flex items-center gap-3.5 px-4 py-2.5 rounded-2xl text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors"
          >
            <Settings className="w-5 h-5 text-gray-400" />
            <span>Settings</span>
          </button>
        </div>
      </div>

      {/* Student Profile Button at Bottom of Sidebar (from user request) */}
      <div className="pt-4 border-t border-gray-100 mt-6">
        <button
          onClick={onOpenProfile}
          title="Click to edit profile name or photo"
          className="w-full flex items-center gap-3 p-2.5 rounded-2xl hover:bg-gray-50 border border-gray-200/80 hover:border-gray-300 transition-all group text-left shadow-2xs"
        >
          {/* Avatar with status indicator */}
          <div className="relative shrink-0">
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-emerald-400 p-0.5 bg-gradient-to-tr from-emerald-100 to-teal-50 flex items-center justify-center group-hover:ring-2 group-hover:ring-gray-950 transition-all">
              <img 
                src={studentProfile?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"} 
                alt={studentProfile?.name || 'Adesh'} 
                className="w-full h-full object-cover rounded-full"
                onError={(e) => {
                  e.currentTarget.src = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80";
                }}
              />
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white shadow-xs" />
          </div>

          {/* Student Info */}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-gray-900 truncate group-hover:text-gray-950">
              {studentProfile?.name || 'Adesh Savaratkar'}
            </p>
            <p className="text-[11px] text-gray-400 truncate font-medium">
              {studentProfile?.email || 'adesh.savaratkar24@spit.ac.in'}
            </p>
          </div>

          {/* Edit Icon Indicator */}
          <div className="w-7 h-7 rounded-xl bg-gray-100 group-hover:bg-accentYellow flex items-center justify-center text-gray-400 group-hover:text-gray-950 transition-colors shrink-0">
            <Edit3 className="w-3.5 h-3.5" />
          </div>
        </button>
      </div>
    </aside>
  );
}
