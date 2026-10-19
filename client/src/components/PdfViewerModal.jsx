import React from 'react';
import { X, ExternalLink, Download, FileText, ZoomIn } from 'lucide-react';

export default function PdfViewerModal({ isOpen, onClose, paper }) {
  if (!isOpen || !paper) return null;

  const backendOrigin = import.meta.env.VITE_API_URL 
    ? import.meta.env.VITE_API_URL.replace('/api', '') 
    : 'http://127.0.0.1:8000';

  const fullUrl = paper.file_url?.startsWith('http') 
    ? paper.file_url 
    : `${backendOrigin}${paper.file_url}`;

  const isImage = paper.file_ext === '.jpg' || paper.file_ext === '.jpeg' || paper.file_ext === '.png';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-gray-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl w-full max-w-5xl h-[92vh] shadow-2xl border border-gray-100 flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-100 bg-[#FAFAFC] shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-700 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-extrabold text-gray-900 truncate">
                {paper.title || paper.filename}
              </h3>
              <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                <span className="font-bold text-gray-600 uppercase tracking-wider">{paper.subject_code}</span>
                <span>•</span>
                <span>{paper.exam_session}</span>
                <span>•</span>
                <span>{paper.file_size}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Open in New Tab */}
            <a
              href={fullUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold transition-colors flex items-center gap-1.5"
              title="Open full PDF in a new browser tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Open in Tab</span>
            </a>

            {/* Download Button */}
            <a
              href={fullUrl}
              download={paper.filename}
              className="px-3.5 py-2 rounded-xl bg-accentYellow hover:bg-accentYellowHover text-gray-950 text-xs font-extrabold transition-colors flex items-center gap-1.5 shadow-2xs"
              title="Download question paper to your computer"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download</span>
            </a>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Embedded Viewer Content */}
        <div className="flex-1 bg-gray-100 relative overflow-hidden flex items-center justify-center p-2 sm:p-4">
          {isImage ? (
            <div className="w-full h-full overflow-auto flex items-center justify-center bg-gray-900 rounded-2xl p-2">
              <img 
                src={fullUrl} 
                alt={paper.title} 
                className="max-w-full max-h-full object-contain rounded-lg shadow-md"
              />
            </div>
          ) : (
            <iframe
              src={`${fullUrl}#toolbar=1&navpanes=0`}
              title={paper.title || paper.filename}
              className="w-full h-full rounded-2xl bg-white border border-gray-200 shadow-sm"
            />
          )}
        </div>
      </div>
    </div>
  );
}
