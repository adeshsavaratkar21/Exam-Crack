import React, { useState, useRef } from 'react';
import { X, Camera, Upload, Check, User, Mail, GraduationCap, Image as ImageIcon } from 'lucide-react';

const PRESET_AVATARS = [
  {
    name: 'Melissa (Default)',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
  },
  {
    name: 'Alex',
    url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=200&q=80'
  },
  {
    name: 'Priya',
    url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80'
  },
  {
    name: 'Jordan',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80'
  },
  {
    name: 'Elena',
    url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80'
  },
  {
    name: 'David',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80'
  }
];

export default function ProfileModal({
  isOpen,
  onClose,
  currentProfile,
  onSaveProfile
}) {
  if (!isOpen) return null;

  const [name, setName] = useState(currentProfile?.name || 'Adesh Savaratkar');
  const [email, setEmail] = useState(currentProfile?.email || 'adesh.savaratkar24@spit.ac.in');
  const [program, setProgram] = useState(currentProfile?.program || 'Semester 5 • Computer Engineering (SPIT)');
  const [avatar, setAvatar] = useState(currentProfile?.avatar || PRESET_AVATARS[0].url);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [customUrl, setCustomUrl] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const fileInputRef = useRef(null);

  // Handle uploading local image file
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (JPG, PNG, WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Image size exceeds 5MB limit. Please choose a smaller photo.');
      return;
    }

    setErrorMessage('');
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setAvatar(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleApplyCustomUrl = () => {
    if (!customUrl.trim()) return;
    setAvatar(customUrl.trim());
    setShowUrlInput(false);
    setCustomUrl('');
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }

    const updated = {
      name: name.trim(),
      email: email.trim() || 'student@university.edu',
      program: program.trim() || 'Semester 5 • Engineering',
      avatar: avatar
    };

    onSaveProfile(updated);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-gray-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-[#FAFAFC]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-accentYellow flex items-center justify-center text-gray-950 font-black shadow-xs">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-gray-900 tracking-tight">Edit Student Profile</h2>
              <p className="text-xs text-gray-400 font-medium">Update your name, email & profile avatar</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-6">
          {errorMessage && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {errorMessage}
            </div>
          )}

          {/* Photo Selection Section */}
          <div className="flex flex-col items-center">
            {/* Live Avatar Preview */}
            <div className="relative group mb-4">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-amber-300/80 shadow-md bg-gray-100 flex items-center justify-center">
                <img
                  src={avatar}
                  alt="Profile Preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = PRESET_AVATARS[0].url;
                  }}
                />
              </div>

              {/* Upload trigger button overlay */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Upload Photo from Device"
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-gray-950 text-white flex items-center justify-center border-2 border-white shadow-md hover:bg-gray-800 transition-all hover:scale-105"
              >
                <Camera className="w-4 h-4" />
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {/* Quick Action Buttons for Photo */}
            <div className="flex items-center gap-2 mb-4">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors"
              >
                <Upload className="w-3.5 h-3.5 text-gray-500" />
                Upload Photo
              </button>
              <button
                type="button"
                onClick={() => setShowUrlInput(!showUrlInput)}
                className="px-3 py-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors"
              >
                <ImageIcon className="w-3.5 h-3.5 text-gray-500" />
                Image URL
              </button>
            </div>

            {/* URL Input Form if toggled */}
            {showUrlInput && (
              <div className="w-full flex items-center gap-2 mb-4 bg-gray-50 p-2 rounded-2xl border border-gray-200/80">
                <input
                  type="url"
                  placeholder="Paste image URL (https://...)"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs text-gray-800 placeholder-gray-400 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleApplyCustomUrl}
                  className="px-3 py-1.5 bg-gray-950 text-white rounded-xl text-xs font-bold hover:bg-gray-800 transition-colors"
                >
                  Apply
                </button>
              </div>
            )}

            {/* Curated Preset Avatars Grid */}
            <div className="w-full">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 text-center">
                Or pick a student avatar
              </p>
              <div className="flex items-center justify-center gap-2.5 flex-wrap">
                {PRESET_AVATARS.map((p, idx) => {
                  const isCurrent = avatar === p.url;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAvatar(p.url)}
                      title={p.name}
                      className={`relative w-11 h-11 rounded-full overflow-hidden border-2 transition-all p-0.5 ${
                        isCurrent 
                          ? 'border-gray-950 ring-2 ring-accentYellow scale-105 shadow-sm' 
                          : 'border-transparent hover:border-gray-300 opacity-80 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={p.url}
                        alt={p.name}
                        className="w-full h-full object-cover rounded-full"
                      />
                      {isCurrent && (
                        <div className="absolute inset-0 bg-gray-950/20 rounded-full flex items-center justify-center">
                          <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Text Fields */}
          <div className="space-y-4 pt-2 border-t border-gray-100">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Melissa Anderson"
                  className="w-full bg-white border border-gray-200 rounded-2xl py-2.5 pl-10 pr-4 text-sm text-gray-900 font-semibold focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-300 shadow-2xs"
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-1.5">
                University Email / Student ID
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. mel.anderson@university.edu"
                  className="w-full bg-white border border-gray-200 rounded-2xl py-2.5 pl-10 pr-4 text-sm text-gray-900 font-semibold focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-300 shadow-2xs"
                />
              </div>
            </div>

            {/* Program / Semester */}
            <div>
              <label className="block text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-1.5">
                Academic Program & Semester
              </label>
              <div className="relative">
                <GraduationCap className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={program}
                  onChange={(e) => setProgram(e.target.value)}
                  placeholder="e.g. Semester 5 • Computer Engineering"
                  className="w-full bg-white border border-gray-200 rounded-2xl py-2.5 pl-10 pr-4 text-sm text-gray-900 font-semibold focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-300 shadow-2xs"
                />
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-2xl border border-gray-200 text-gray-600 font-bold text-xs hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-2xl bg-gray-950 text-white font-extrabold text-xs hover:bg-gray-800 transition-all shadow-sm flex items-center gap-2"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  Saved!
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
