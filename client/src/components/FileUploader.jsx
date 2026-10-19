import React, { useState, useEffect, useRef } from 'react';
import { 
  UploadCloud, 
  FileCheck, 
  AlertCircle, 
  Play, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp,
  FileText,
  ExternalLink,
  Eye,
  Download,
  Search,
  Sparkles,
  BookOpen,
  Layers,
  Filter
} from 'lucide-react';
import api from '../services/api';
import PdfViewerModal from './PdfViewerModal';

export default function FileUploader({ 
  selectedSubjectId, 
  subjects = [], 
  onQuestionsExtracted, 
  onNavigateToQuiz 
}) {
  // Papers library state
  const [allSubjectPapers, setAllSubjectPapers] = useState({});
  const [totalPapersCount, setTotalPapersCount] = useState(0);
  const [activeSubCode, setActiveSubCode] = useState('DC');
  const [loadingPapers, setLoadingPapers] = useState(false);
  const [papersSearchQuery, setPapersSearchQuery] = useState('');
  const [selectedExamTag, setSelectedExamTag] = useState('All');
  const [previewPaper, setPreviewPaper] = useState(null);

  // Upload state
  const [showUploadZone, setShowUploadZone] = useState(false);
  const [file, setFile] = useState(null);
  const [uploadSubjectId, setUploadSubjectId] = useState(selectedSubjectId || (subjects[0]?.id || 1));
  const [examYear, setExamYear] = useState('2024');
  const [examSession, setExamSession] = useState('End-Semester');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [extractedResult, setExtractedResult] = useState(null);
  const [expandedQuestionId, setExpandedQuestionId] = useState(null);
  const [selectedFilterType, setSelectedFilterType] = useState('All');

  const fileInputRef = useRef(null);

  const backendOrigin = import.meta.env.VITE_API_URL 
    ? import.meta.env.VITE_API_URL.replace('/api', '') 
    : 'http://127.0.0.1:8000';

  // Load all subject papers
  const loadPapers = () => {
    setLoadingPapers(true);
    api.getAllPapers()
      .then(res => {
        setAllSubjectPapers(res.data?.subjects || {});
        setTotalPapersCount(res.data?.total_papers_all_subjects || 0);
      })
      .catch(err => {
        console.error('Failed to load all papers:', err);
      })
      .finally(() => setLoadingPapers(false));
  };

  useEffect(() => {
    loadPapers();
  }, []);

  // Update active subject when selectedSubjectId changes
  useEffect(() => {
    if (selectedSubjectId && subjects.length > 0) {
      const match = subjects.find(s => s.id === Number(selectedSubjectId));
      if (match?.code) {
        setActiveSubCode(match.code);
        setUploadSubjectId(match.id);
      }
    }
  }, [selectedSubjectId, subjects]);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      if (!selected.name.toLowerCase().endsWith('.pdf')) {
        setErrorMsg('Please upload a PDF document (*.pdf).');
        return;
      }
      setFile(selected);
      setErrorMsg('');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selected = e.dataTransfer.files[0];
      if (!selected.name.toLowerCase().endsWith('.pdf')) {
        setErrorMsg('Please upload a PDF document (*.pdf).');
        return;
      }
      setFile(selected);
      setErrorMsg('');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setErrorMsg('Please select a PDF file first.');
      return;
    }
    if (!uploadSubjectId) {
      setErrorMsg('Please choose a valid subject.');
      return;
    }

    setIsUploading(true);
    setErrorMsg('');
    setUploadProgress(20);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('subject_id', uploadSubjectId);
    formData.append('exam_year', examYear);
    formData.append('exam_session', examSession);

    try {
      setUploadProgress(60);
      const res = await api.uploadPYQ(formData);
      setUploadProgress(100);
      setExtractedResult(res.data);
      if (onQuestionsExtracted) onQuestionsExtracted(res.data);
      loadPapers(); // Refresh library
    } catch (err) {
      console.error('Upload error:', err);
      setErrorMsg(err.response?.data?.detail || 'Failed to parse PDF document.');
    } finally {
      setIsUploading(false);
    }
  };

  // Filter current subject's papers
  const currentSubData = allSubjectPapers[activeSubCode] || { papers: [], count: 0, subject_name: activeSubCode };
  const currentPapers = (currentSubData.papers || []).filter(p => {
    const matchesTag = selectedExamTag === 'All' || p.exam_tag === selectedExamTag;
    const q = papersSearchQuery.toLowerCase().trim();
    const matchesSearch = !q ||
      p.title.toLowerCase().includes(q) ||
      p.filename.toLowerCase().includes(q) ||
      p.exam_year.includes(q) ||
      (p.month && p.month.toLowerCase().includes(q));
    return matchesTag && matchesSearch;
  });

  const eseCount = (currentSubData.papers || []).filter(p => p.exam_tag === 'ESE').length;
  const mseCount = (currentSubData.papers || []).filter(p => p.exam_tag === 'MSE').length;
  const ktCount = (currentSubData.papers || []).filter(p => p.exam_tag === 'KT' || p.exam_tag === 'SUMMER').length;

  const filteredQuestions = extractedResult?.questions.filter(q => {
    if (selectedFilterType === 'All') return true;
    return q.question_type.toLowerCase() === selectedFilterType.toLowerCase();
  }) || [];

  return (
    <div className="space-y-6">
      {/* ======================================================== */}
      {/* SECTION 1: PREVIOUS YEAR QUESTION PAPERS REPOSITORY     */}
      {/* ======================================================== */}
      <div className="student-card p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-lg bg-gray-950 text-white font-black text-xs uppercase tracking-wider">
                Exam Papers
              </span>
              <span className="text-xs font-bold text-gray-500">
                Semester 5 Authenticated Repository
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight mt-1 flex items-center gap-2">
              <span>📚</span>
              Previous Year Question Papers ({totalPapersCount} Papers)
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 font-medium mt-0.5">
              Select a subject to view, preview in-app, or download original university past papers.
            </p>
          </div>

          <button
            onClick={() => setShowUploadZone(!showUploadZone)}
            className="px-4 py-2 rounded-2xl bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 text-xs font-bold transition-all shadow-2xs flex items-center gap-2 shrink-0"
          >
            <UploadCloud className="w-4 h-4 text-amber-500" />
            <span>{showUploadZone ? 'Hide Upload Tool' : 'Upload New Paper'}</span>
          </button>
        </div>

        {/* Subject Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none mb-6">
          {Object.keys(allSubjectPapers).length > 0 ? (
            Object.entries(allSubjectPapers).map(([code, sData]) => {
              const isSelected = activeSubCode === code;
              return (
                <button
                  key={code}
                  onClick={() => {
                    setActiveSubCode(code);
                    setSelectedExamTag('All');
                  }}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all flex items-center gap-2 shrink-0 ${
                    isSelected
                      ? 'bg-accentYellow text-gray-950 shadow-xs'
                      : 'bg-[#F8F9FC] border border-gray-200/80 text-gray-600 hover:text-gray-950 hover:bg-gray-100'
                  }`}
                >
                  <span className="font-black">{code}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    isSelected ? 'bg-gray-950 text-white' : 'bg-white border border-gray-200 text-gray-600'
                  }`}>
                    {sData.count} Papers
                  </span>
                </button>
              );
            })
          ) : (
            ['DC', 'SE', 'TOC', 'CNS', 'AISC', 'MDM'].map((code) => (
              <button
                key={code}
                onClick={() => setActiveSubCode(code)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all shrink-0 ${
                  activeSubCode === code ? 'bg-accentYellow text-gray-950 shadow-xs' : 'bg-[#F8F9FC] text-gray-600'
                }`}
              >
                {code}
              </button>
            ))
          )}
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6 p-3 rounded-2xl bg-[#F8F9FC] border border-gray-100">
          {/* Exam Tag Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              onClick={() => setSelectedExamTag('All')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all shrink-0 ${
                selectedExamTag === 'All'
                  ? 'bg-gray-950 text-white shadow-2xs'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              All ({currentSubData.papers?.length || 0})
            </button>
            <button
              onClick={() => setSelectedExamTag('ESE')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all shrink-0 ${
                selectedExamTag === 'ESE'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              End-Sem ESE ({eseCount})
            </button>
            <button
              onClick={() => setSelectedExamTag('MSE')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all shrink-0 ${
                selectedExamTag === 'MSE'
                  ? 'bg-amber-500 text-white shadow-2xs'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              Mid-Sem MSE ({mseCount})
            </button>
            {ktCount > 0 && (
              <button
                onClick={() => setSelectedExamTag('KT')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  selectedExamTag === 'KT'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                Re-Exam / KT ({ktCount})
              </button>
            )}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by year (e.g. 2025, 2024)..."
              value={papersSearchQuery}
              onChange={(e) => setPapersSearchQuery(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-xl py-1.5 pl-9 pr-3 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-400 shadow-2xs"
            />
          </div>
        </div>

        {/* Papers Grid */}
        {loadingPapers ? (
          <div className="py-12 text-center text-gray-500">
            <Sparkles className="w-6 h-6 animate-spin text-amber-500 mx-auto mb-2" />
            <p className="text-xs font-bold">Scanning uploaded paper repository...</p>
          </div>
        ) : currentPapers.length === 0 ? (
          <div className="p-8 text-center bg-[#F8F9FC] rounded-2xl border border-gray-200 text-gray-500">
            <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-gray-800">No question papers matching this filter.</p>
            <p className="text-xs text-gray-400 mt-1">Try resetting the search filter or upload a new paper.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentPapers.map((paper, idx) => {
              const fullPdfUrl = `${backendOrigin}${paper.file_url}`;
              const tagColor = 
                paper.exam_tag === 'ESE' ? 'bg-indigo-50 text-indigo-700 border-indigo-200/80' :
                paper.exam_tag === 'MSE' ? 'bg-amber-50 text-amber-800 border-amber-200/80' :
                'bg-emerald-50 text-emerald-800 border-emerald-200/80';

              return (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-white border border-gray-200/80 hover:border-gray-300 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${tagColor}`}>
                        {paper.exam_tag === 'ESE' ? 'End-Sem (ESE)' : paper.exam_tag === 'MSE' ? 'Mid-Sem (MSE)' : 'Re-Exam / KT'}
                      </span>
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500">
                        <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700">{paper.exam_year}</span>
                        <span>{paper.file_size}</span>
                      </div>
                    </div>

                    <h4 className="text-xs sm:text-sm font-black text-gray-900 leading-snug line-clamp-2">
                      {paper.title}
                    </h4>
                    <p className="text-[11px] text-gray-400 font-mono mt-1 truncate">
                      {paper.filename}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="pt-3.5 mt-3.5 border-t border-gray-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => setPreviewPaper(paper)}
                      className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs"
                      title="View PDF inside the app"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Preview</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <a
                        href={fullPdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-gray-950 hover:bg-black text-white text-xs font-extrabold transition-all flex items-center gap-1.5 shadow-2xs"
                        title="Open full PDF in a new tab"
                      >
                        <ExternalLink className="w-3 h-3 text-accentYellow" />
                        <span>Open</span>
                      </a>

                      <a
                        href={fullPdfUrl}
                        download={paper.filename}
                        className="w-7 h-7 rounded-lg bg-gray-50 hover:bg-accentYellow flex items-center justify-center text-gray-600 hover:text-gray-950 transition-colors"
                        title="Download PDF"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* SECTION 2: UPLOAD & AI QUESTION EXTRACTION TOOL         */}
      {/* ======================================================== */}
      {showUploadZone && (
        <div className="student-card p-6 sm:p-8 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-100">
            <div>
              <h2 className="text-lg font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-gray-900" />
                Upload & Process Additional Question Paper
              </h2>
              <p className="text-xs text-gray-500 font-medium mt-1">
                Extracts and categorizes questions with LLM structured output by Subject, Chapter, Type, and Marks.
              </p>
            </div>

            <span className="text-xs px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200/80 font-bold">
              AI Question Extractor
            </span>
          </div>

          {/* Drag and drop zone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-3xl p-8 sm:p-10 text-center cursor-pointer transition-all ${
              file
                ? 'border-emerald-400 bg-emerald-50/40'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-white border border-gray-200 flex items-center justify-center text-gray-900 shadow-sm">
              {file ? (
                <FileCheck className="w-7 h-7 text-emerald-600 animate-bounce" />
              ) : (
                <FileText className="w-7 h-7 text-gray-600" />
              )}
            </div>

            {file ? (
              <div>
                <p className="text-sm font-bold text-gray-900">{file.name}</p>
                <p className="text-xs text-emerald-700 font-semibold mt-1">
                  Ready to process ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                </p>
              </div>
            ) : (
              <div>
                <p className="text-sm font-bold text-gray-900">
                  Drag & Drop University Question Paper PDF here
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  or click to browse files from your computer
                </p>
              </div>
            )}
          </div>

          {/* Selectors and Action */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-6">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Target Subject
              </label>
              <select
                value={uploadSubjectId || ''}
                onChange={(e) => setUploadSubjectId(Number(e.target.value))}
                className="w-full bg-[#F8F9FC] border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-gray-900 focus:outline-none focus:border-gray-400"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.code} — {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Exam Year
              </label>
              <input
                type="text"
                value={examYear}
                onChange={(e) => setExamYear(e.target.value)}
                placeholder="e.g. 2024"
                className="w-full bg-[#F8F9FC] border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-gray-900 focus:outline-none focus:border-gray-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Exam Session
              </label>
              <select
                value={examSession}
                onChange={(e) => setExamSession(e.target.value)}
                className="w-full bg-[#F8F9FC] border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-gray-900 focus:outline-none focus:border-gray-400"
              >
                <option value="End-Semester">End-Semester Examination (ESE)</option>
                <option value="Mid-Semester">Mid-Semester Examination (MSE)</option>
                <option value="Re-Examination">Re-Examination / Remedial (KT)</option>
                <option value="Summer-Exam">Summer Examination</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={handleUpload}
                disabled={isUploading || !file}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-extrabold shadow-sm transition-all ${
                  file && !isUploading
                    ? 'bg-accentYellow hover:bg-accentYellowHover text-gray-950 cursor-pointer'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                {isUploading ? `Extracting (${uploadProgress}%)...` : 'Extract & Categorize PYQ'}
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="mt-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>
      )}

      {/* Extracted Questions View */}
      {extractedResult && (
        <div className="student-card p-6 sm:p-8 animate-fade-in">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <h3 className="text-base font-extrabold text-gray-900">
                  Extraction Results: {extractedResult.total_extracted} Questions Identified
                </h3>
              </div>
              <p className="text-xs text-gray-500 mt-1 font-medium">
                Paper: <span className="font-bold text-gray-900">{extractedResult.filename}</span> ({extractedResult.exam_session} {extractedResult.exam_year})
              </p>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-1 bg-[#F8F9FC] p-1 rounded-full border border-gray-200/70">
              {['All', 'MCQ', 'Short', 'Long', 'Numerical'].map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedFilterType(type)}
                  className={`text-xs px-3 py-1 rounded-full font-bold transition-all ${
                    selectedFilterType === type
                      ? 'bg-accentNavy text-white shadow-sm'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3.5">
            {filteredQuestions.map((q, idx) => {
              const isExpanded = expandedQuestionId === q.id;
              const typeColor = 
                q.question_type === 'MCQ' ? 'bg-[#EBF5FF] text-sky-800' :
                q.question_type === 'Numerical' ? 'bg-[#FEF7DA] text-amber-900' :
                q.question_type === 'Long' ? 'bg-[#F1F3FE] text-indigo-900' :
                'bg-[#E8F8EE] text-emerald-900';

              return (
                <div
                  key={q.id || idx}
                  className="p-4 sm:p-5 rounded-2xl bg-[#F8F9FC] border border-gray-200/70 hover:border-gray-300 transition-all"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-black text-gray-900">
                        Q{idx + 1}
                      </span>
                      <span className={`text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full ${typeColor}`}>
                        {q.question_type}
                      </span>
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-gray-200/80 text-gray-700">
                        {q.marks} Marks
                      </span>
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white border border-gray-200 text-gray-700">
                        📖 {q.chapter_name || 'General Core'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {q.chapter_id && (
                        <button
                          onClick={() => onNavigateToQuiz(q.chapter_id)}
                          className="flex items-center gap-1 text-xs text-gray-900 font-bold px-3 py-1 rounded-full bg-accentYellow hover:bg-accentYellowHover transition-colors shadow-sm"
                        >
                          <Play className="w-3 h-3" />
                          Practice Quiz
                        </button>
                      )}
                      <button
                        onClick={() => setExpandedQuestionId(isExpanded ? null : q.id)}
                        className="text-xs text-gray-400 hover:text-gray-700 p-1"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-gray-800 font-bold leading-relaxed">
                    {q.text}
                  </p>

                  {/* Solution Blueprint toggle */}
                  {isExpanded && q.solution && (
                    <div className="mt-3.5 pt-3.5 border-t border-gray-200 text-xs">
                      <p className="font-extrabold text-gray-900 mb-1 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        AI Grader Solution Blueprint & Key Steps:
                      </p>
                      <p className="text-gray-600 leading-relaxed bg-white p-3.5 rounded-xl border border-gray-200 font-medium">
                        {q.solution}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Embedded PDF Viewer Modal */}
      <PdfViewerModal
        isOpen={Boolean(previewPaper)}
        onClose={() => setPreviewPaper(null)}
        paper={previewPaper}
      />
    </div>
  );
}
