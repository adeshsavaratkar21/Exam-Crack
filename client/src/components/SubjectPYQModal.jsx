import React, { useState, useEffect } from 'react';
import { 
  X, 
  FileText, 
  ExternalLink, 
  Download, 
  Search, 
  Filter, 
  Eye, 
  Calendar, 
  Sparkles,
  Award,
  BookOpen,
  ArrowRight
} from 'lucide-react';
import api from '../services/api';
import PdfViewerModal from './PdfViewerModal';

export default function SubjectPYQModal({ 
  isOpen, 
  onClose, 
  subjectCode = 'DC', 
  subjectName = 'Distributed Computing',
  onLaunchQuiz
}) {
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTag, setSelectedTag] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewPaper, setPreviewPaper] = useState(null);

  const backendOrigin = import.meta.env.VITE_API_URL 
    ? import.meta.env.VITE_API_URL.replace('/api', '') 
    : 'http://127.0.0.1:8000';

  useEffect(() => {
    if (!isOpen || !subjectCode) return;

    setLoading(true);
    api.getSubjectPapers(subjectCode)
      .then(res => {
        setPapers(res.data?.papers || []);
      })
      .catch(err => {
        console.error('Failed to load subject PYQs:', err);
        setPapers([]);
      })
      .finally(() => setLoading(false));
  }, [isOpen, subjectCode]);

  if (!isOpen) return null;

  // Filter papers
  const filteredPapers = papers.filter(p => {
    const matchesTag = selectedTag === 'All' || p.exam_tag === selectedTag;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || 
      p.title.toLowerCase().includes(q) || 
      p.filename.toLowerCase().includes(q) || 
      p.exam_year.includes(q) ||
      (p.month && p.month.toLowerCase().includes(q)) ||
      p.exam_type.toLowerCase().includes(q);
    return matchesTag && matchesSearch;
  });

  // Calculate tag counts
  const eseCount = papers.filter(p => p.exam_tag === 'ESE').length;
  const mseCount = papers.filter(p => p.exam_tag === 'MSE').length;
  const ktCount = papers.filter(p => p.exam_tag === 'KT' || p.exam_tag === 'SUMMER').length;

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-6 bg-gray-950/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div 
          className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] shadow-2xl border border-gray-100 flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-100 bg-[#FAFAFC] shrink-0">
            <div className="flex items-start sm:items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-accentYellow flex items-center justify-center font-black text-gray-950 text-xl shadow-xs shrink-0">
                  📄
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-lg bg-gray-950 text-white font-black text-xs uppercase tracking-wider">
                      {subjectCode}
                    </span>
                    <span className="text-xs font-bold text-gray-500">
                      Semester 5 Previous Year Papers
                    </span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight mt-0.5">
                    {subjectName} — PYQ Question Papers
                  </h2>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search and Filter Row */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
              {/* Exam Type Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                <button
                  onClick={() => setSelectedTag('All')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                    selectedTag === 'All' 
                      ? 'bg-gray-950 text-white shadow-xs' 
                      : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  All Papers ({papers.length})
                </button>
                <button
                  onClick={() => setSelectedTag('ESE')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                    selectedTag === 'ESE' 
                      ? 'bg-indigo-600 text-white shadow-xs' 
                      : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  End-Sem / ESE ({eseCount})
                </button>
                <button
                  onClick={() => setSelectedTag('MSE')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                    selectedTag === 'MSE' 
                      ? 'bg-amber-500 text-white shadow-xs' 
                      : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Mid-Sem / MSE ({mseCount})
                </button>
                {ktCount > 0 && (
                  <button
                    onClick={() => setSelectedTag('KT')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                      selectedTag === 'KT' 
                        ? 'bg-emerald-600 text-white shadow-xs' 
                        : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    Re-Exam / KT ({ktCount})
                  </button>
                )}
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter by year (e.g. 2025, 2024)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl py-1.5 pl-9 pr-3 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-400 shadow-2xs"
                />
              </div>
            </div>
          </div>

          {/* Paper List Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-[#F8F9FD]">
            {loading ? (
              <div className="py-12 text-center text-gray-500">
                <Sparkles className="w-6 h-6 animate-spin text-amber-500 mx-auto mb-2" />
                <p className="text-xs font-bold">Scanning and loading authentic past papers for {subjectCode}...</p>
              </div>
            ) : filteredPapers.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-gray-200 text-gray-500">
                <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-gray-800">No question papers matching this filter.</p>
                <p className="text-xs text-gray-400 mt-1">Try resetting the search filter to see all papers.</p>
              </div>
            ) : (
              filteredPapers.map((paper, idx) => {
                const fullPdfUrl = `${backendOrigin}${paper.file_url}`;
                const tagColor = 
                  paper.exam_tag === 'ESE' ? 'bg-indigo-50 text-indigo-700 border-indigo-200/80' :
                  paper.exam_tag === 'MSE' ? 'bg-amber-50 text-amber-800 border-amber-200/80' :
                  'bg-emerald-50 text-emerald-800 border-emerald-200/80';

                return (
                  <div
                    key={idx}
                    className="p-4 sm:p-5 rounded-2xl bg-white border border-gray-200/80 hover:border-gray-300 shadow-2xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    {/* Left details */}
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-700 shrink-0 font-bold text-sm">
                        {paper.is_pdf ? '📄' : '🖼️'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${tagColor}`}>
                            {paper.exam_tag === 'ESE' ? 'End-Sem (ESE)' : paper.exam_tag === 'MSE' ? 'Mid-Sem (MSE)' : 'Re-Exam / KT'}
                          </span>
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 border border-gray-200">
                            {paper.exam_year}
                          </span>
                          <span className="text-[11px] font-semibold text-gray-400">
                            {paper.file_size}
                          </span>
                        </div>
                        <h4 className="text-sm font-black text-gray-900 truncate">
                          {paper.title}
                        </h4>
                        <p className="text-xs text-gray-400 font-mono mt-0.5 truncate">
                          {paper.filename}
                        </p>
                      </div>
                    </div>

                    {/* Right action buttons */}
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      {/* In-App Preview Button */}
                      <button
                        onClick={() => setPreviewPaper(paper)}
                        className="px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs"
                        title="View paper inside the platform"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Preview</span>
                      </button>

                      {/* Open PDF in New Tab */}
                      <a
                        href={fullPdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-2 rounded-xl bg-gray-950 hover:bg-black text-white text-xs font-extrabold transition-all flex items-center gap-1.5 shadow-xs"
                        title="Open full PDF in a new tab"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-accentYellow" />
                        <span>Open PDF</span>
                      </a>

                      {/* Direct Download */}
                      <a
                        href={fullPdfUrl}
                        download={paper.filename}
                        className="w-8 h-8 rounded-xl bg-gray-50 hover:bg-accentYellow flex items-center justify-center text-gray-600 hover:text-gray-950 transition-colors"
                        title="Download PDF"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-100 bg-[#FAFAFC] flex items-center justify-between text-xs text-gray-500 shrink-0">
            <span>
              Showing <strong className="text-gray-900">{filteredPapers.length}</strong> of {papers.length} question papers
            </span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl border border-gray-200 text-gray-700 font-bold hover:bg-gray-100 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Embedded PDF Viewer Modal */}
      <PdfViewerModal
        isOpen={Boolean(previewPaper)}
        onClose={() => setPreviewPaper(null)}
        paper={previewPaper}
      />
    </>
  );
}
