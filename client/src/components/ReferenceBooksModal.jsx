import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  BookOpen,
  Folder,
  Copy,
  Check,
  Upload,
  Download,
  ExternalLink,
  FileText,
  AlertCircle,
  Loader2,
  Trash2,
  Sparkles,
  Info,
  Presentation
} from 'lucide-react';
import api from '../services/api';

export default function ReferenceBooksModal({
  isOpen,
  onClose,
  subjectId,
  subjectCode,
  subjectName
}) {
  const [loading, setLoading] = useState(true);
  const [booksData, setBooksData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [copiedPath, setCopiedPath] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [targetBookId, setTargetBookId] = useState(null);
  const fileInputRef = useRef(null);

  const fetchBooks = async () => {
    if (!subjectCode && !subjectId) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.getSubjectBooks(subjectCode || subjectId);
      setBooksData(res.data);
    } catch (err) {
      console.error('Failed to load reference books:', err);
      setErrorMsg('Could not fetch reference books list. Please ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchBooks();
      setUploadSuccess('');
    }
  }, [isOpen, subjectCode, subjectId]);

  if (!isOpen) return null;

  const handleCopyPath = () => {
    if (!booksData?.books_folder_path) return;
    navigator.clipboard.writeText(booksData.books_folder_path);
    setCopiedPath(true);
    setTimeout(() => setCopiedPath(false), 2500);
  };

  const handleTriggerUpload = (bookId = null) => {
    setTargetBookId(bookId);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.toLowerCase();
    if (!ext.endsWith('.pdf') && !ext.endsWith('.ppt') && !ext.endsWith('.pptx')) {
      alert('Please upload a PDF textbook or PowerPoint presentation (.ppt, .pptx).');
      return;
    }

    const formData = new FormData();
    formData.append('subject_id', subjectId || booksData?.subject_id);
    formData.append('file', file);
    if (targetBookId) {
      formData.append('book_id', targetBookId);
    }

    setUploading(true);
    setErrorMsg('');
    setUploadSuccess('');

    try {
      const res = await api.uploadBook(formData);
      setUploadSuccess(res.data.message || 'File uploaded successfully!');
      await fetchBooks();
    } catch (err) {
      console.error('Upload failed:', err);
      setErrorMsg(err.response?.data?.detail || 'Failed to upload file.');
    } finally {
      setUploading(false);
      setTargetBookId(null);
    }
  };

  const handleDeleteBook = async (filename) => {
    if (!window.confirm(`Are you sure you want to delete "${filename}" from the materials folder?`)) return;

    try {
      await api.deleteBook(booksData.subject_code, filename);
      await fetchBooks();
    } catch (err) {
      console.error('Failed to delete file:', err);
      alert('Failed to delete file.');
    }
  };

  const API_HOST = 'http://127.0.0.1:8000';
  const getFullFileUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${API_HOST}${url}`;
  };

  const prescribed = booksData?.prescribed_books || [];
  const additionalPdfs = booksData?.additional_pdfs || [];
  const totalPdfs = booksData?.total_pdfs_available || 0;
  const totalPpts = booksData?.total_ppts_available || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl max-h-[92vh] rounded-3xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden">
        
        {/* Hidden file input supporting both PDF and PPT/PPTX */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".pdf,.ppt,.pptx"
          className="hidden"
        />

        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-amber-50/60 via-white to-indigo-50/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400/20 text-amber-700 flex items-center justify-center font-black shadow-2xs">
              <BookOpen className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-lg bg-gray-900 text-white font-black text-[11px] tracking-wide">
                  {booksData?.subject_code || subjectCode}
                </span>
                <h2 className="text-lg font-black text-gray-900 tracking-tight">
                  Reference Textbooks &amp; Lecture PPTs (Book / PPT)
                </h2>
              </div>
              <p className="text-xs text-gray-500 font-medium mt-0.5">
                Official college recommended textbooks and lecture PPT slides for {booksData?.subject_name || subjectName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleTriggerUpload(null)}
              disabled={uploading}
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gray-900 text-white font-bold text-xs hover:bg-black transition-all hover:scale-105 active:scale-95 shadow-sm cursor-pointer"
              title="Upload textbook PDF or lecture PPT"
            >
              {uploading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
              ) : (
                <Upload className="w-3.5 h-3.5 text-amber-400" />
              )}
              <span>Upload Book / PPT</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">

          {/* Feedback Alerts */}
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {uploadSuccess && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{uploadSuccess}</span>
            </div>
          )}

          {/* How to add PDF files Guide Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-indigo-50/70 via-indigo-50/30 to-amber-50/40 border border-indigo-100/80">
            <div className="flex items-start justify-between gap-3 flex-wrap sm:flex-nowrap">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Folder className="w-4 h-4 text-indigo-700" />
                  <h4 className="text-xs font-black uppercase tracking-wider text-indigo-950">
                    How to add your textbook PDFs:
                  </h4>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed max-w-2xl">
                  You can <strong>drop any PDF file directly into this subject's folder on your computer</strong>, and it will immediately show up here. Or click the <strong>Upload</strong> button to pick a file from your browser.
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <code className="text-[11px] font-mono bg-white px-2.5 py-1 rounded-lg border border-indigo-200 text-indigo-900 select-all font-semibold max-w-full break-all">
                    {booksData?.books_folder_path || `...\\backend\\uploads\\${subjectCode || 'DC'}\\books`}
                  </code>
                  <button
                    onClick={handleCopyPath}
                    className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] transition-colors flex items-center gap-1 shrink-0 shadow-2xs"
                    title="Copy local folder path to clipboard"
                  >
                    {copiedPath ? (
                      <>
                        <Check className="w-3 h-3" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy Path</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="sm:self-center shrink-0">
                <span className="px-3 py-1.5 rounded-xl bg-white border border-gray-200 text-gray-800 font-extrabold text-xs shadow-2xs flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-amber-500" />
                  <span>{totalPdfs} PDF{totalPdfs === 1 ? '' : 's'} in Folder</span>
                </span>
              </div>
            </div>
          </div>

          {/* Loading Skeleton */}
          {loading ? (
            <div className="space-y-4 py-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              {/* Prescribed Syllabus Books Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    Prescribed Syllabus Textbooks &amp; References
                  </h3>
                  <span className="text-[11px] text-gray-400 font-medium">
                    {prescribed.length} college prescribed books
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-3.5">
                  {prescribed.map((book) => {
                    const hasPdf = Boolean(book.pdf_file);
                    const isPrimary = book.type === 'Primary Textbook';

                    return (
                      <div
                        key={book.id}
                        className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                          hasPdf
                            ? 'bg-white border-emerald-200/80 shadow-2xs hover:shadow-xs'
                            : 'bg-white border-gray-200/80 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                          <div className="space-y-1.5 flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`px-2.5 py-0.5 rounded-md font-black text-[10px] tracking-wide uppercase ${
                                  isPrimary
                                    ? 'bg-amber-100 text-amber-900 border border-amber-200'
                                    : 'bg-indigo-50 text-indigo-800 border border-indigo-100'
                                }`}
                              >
                                {book.type}
                              </span>
                              <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 font-bold text-[10px]">
                                {book.edition}
                              </span>
                              <span className="text-gray-400 text-xs">
                                • {book.publisher}
                              </span>
                            </div>

                            <h4 className="text-sm sm:text-base font-black text-gray-950 leading-snug">
                              {book.title}
                            </h4>

                            <p className="text-xs font-semibold text-gray-600">
                              By <span className="text-gray-800">{book.authors}</span>
                            </p>

                            {book.syllabus_coverage && (
                              <p className="text-[11px] text-gray-500 leading-relaxed pt-1">
                                <strong className="text-gray-700">Exam Scope:</strong> {book.syllabus_coverage}
                              </p>
                            )}

                            {/* PDF Available Meta */}
                            {hasPdf && (
                              <div className="pt-2 flex items-center gap-2 text-xs">
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-[11px]">
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  PDF Ready ({book.pdf_file.file_size})
                                </span>
                                <span className="text-[11px] font-mono text-gray-400 truncate max-w-xs">
                                  {book.pdf_file.filename}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center sm:flex-col gap-2 shrink-0 sm:min-w-[130px]">
                            {hasPdf ? (
                              <>
                                <a
                                  href={getFullFileUrl(book.pdf_file.file_url)}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex-1 sm:w-full py-2 px-3 rounded-xl bg-gray-950 text-white font-bold text-xs hover:bg-black transition-all flex items-center justify-center gap-1.5 shadow-2xs"
                                >
                                  <ExternalLink className="w-3.5 h-3.5 text-accentYellow" />
                                  <span>Open PDF</span>
                                </a>
                                <a
                                  href={getFullFileUrl(book.pdf_file.file_url)}
                                  download={book.pdf_file.filename}
                                  className="py-1.5 px-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                                  title="Download to computer"
                                >
                                  <Download className="w-3 h-3" />
                                  <span>Download</span>
                                </a>
                              </>
                            ) : (
                              <button
                                onClick={() => handleTriggerUpload(book.id)}
                                disabled={uploading}
                                className="w-full py-2 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/90 font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                              >
                                <Upload className="w-3 h-3 text-amber-600" />
                                <span>Upload PDF</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Additional / Detected PDFs and PPTs in Folder */}
              {additionalPdfs.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Folder className="w-3.5 h-3.5 text-indigo-600" />
                      Additional Books &amp; Lecture PPTs in Folder ({additionalPdfs.length})
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {additionalPdfs.map((f, idx) => {
                      const isPpt = f.is_ppt || f.filename?.toLowerCase().endsWith('.ppt') || f.filename?.toLowerCase().endsWith('.pptx');
                      return (
                        <div
                          key={idx}
                          className="p-3.5 rounded-xl border border-gray-200 bg-white hover:border-gray-300 flex items-center justify-between gap-3 shadow-2xs"
                        >
                          <div className="min-w-0 flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                              isPpt ? 'bg-amber-100 text-amber-900' : 'bg-red-50 text-red-600'
                            }`}>
                              {isPpt ? <Presentation className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className="text-xs font-bold text-gray-900 truncate" title={f.filename}>
                                  {f.filename}
                                </p>
                                <span className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider shrink-0 ${
                                  isPpt ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-gray-100 text-gray-600'
                                }`}>
                                  {isPpt ? 'PPT' : 'PDF'}
                                </span>
                              </div>
                              <p className="text-[10px] text-gray-400 font-medium">
                                {f.file_size}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <a
                              href={getFullFileUrl(f.file_url)}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-700 transition-colors"
                              title="Open File"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                            <a
                              href={getFullFileUrl(f.file_url)}
                              download={f.filename}
                              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-700 transition-colors"
                              title="Download File"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </a>
                            <button
                              onClick={() => handleDeleteBook(f.filename)}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                              title="Delete File"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-gray-400" />
            <span>Files are stored safely in local storage under <code className="font-mono text-gray-700">backend/uploads/{booksData?.subject_code || subjectCode}/books/</code></span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white border border-gray-200 text-gray-800 font-bold hover:bg-gray-100 transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
