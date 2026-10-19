import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = {
  // Health & Settings
  checkHealth: () => client.get('/health'),
  getApiStatus: () => client.get('/settings/status'),
  updateApiKeys: (data) => client.post('/settings/keys', data),
  seedDatabase: () => client.post('/seed'),

  // Subjects
  getSubjects: () => client.get('/subjects'),
  getSubjectDetail: (id) => client.get(`/subjects/${id}`),
  createSubject: (data) => client.post('/subjects', data),

  // PYQ Management
  uploadPYQ: (formData) =>
    client.post('/pyq/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getPYQDocuments: (subjectId) =>
    client.get('/pyq/documents', { params: { subject_id: subjectId } }),
  getSubjectPapers: (codeOrId) => client.get(`/pyq/subject-papers/${codeOrId}`),
  getAllPapers: () => client.get('/pyq/all-papers'),
  getQuestions: (params) => client.get('/pyq/questions', { params }),
  deletePYQDocument: (id) => client.delete(`/pyq/documents/${id}`),

  // Chapter Practice Quizzes
  generateQuiz: (data) => client.post('/quiz/generate', data),
  getQuiz: (id) => client.get(`/quiz/${id}`),
  submitQuiz: (data) => client.post('/quiz/submit', data),
  getQuizHistory: (chapterId) => client.get(`/quiz/history/${chapterId}`),

  // Dual-AI Revision Notes
  getChapterNotes: (chapterId) => client.get(`/notes/chapter/${chapterId}`),
  generateDualNotes: (data) => client.post('/notes/generate', data),
  getMarkdownExportUrl: (chapterId) => `${API_BASE_URL}/notes/export/markdown/${chapterId}`,
  getPdfExportUrl: (chapterId) => `${API_BASE_URL}/notes/export/pdf/${chapterId}`,

  // Strategic Exam Readiness Tracker
  getReadinessReport: (subjectId) => client.get(`/analytics/subject/${subjectId}`),
  updateWeightage: (data) => client.post('/analytics/weightage', data),
  toggleChapterComplete: (chapterId) => client.post(`/syllabus/chapter/${chapterId}/toggle-complete`),
};

export default api;
