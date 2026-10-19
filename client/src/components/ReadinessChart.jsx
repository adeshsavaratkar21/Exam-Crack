import React from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  Play, 
  FileText, 
  ShieldAlert, 
  Target,
  Clock,
  Award
} from 'lucide-react';

export default function ReadinessChart({ 
  report, 
  onNavigateToQuiz, 
  onNavigateToNotes,
  onToggleComplete 
}) {
  if (!report) {
    return (
      <div className="student-card p-8 text-center text-gray-400">
        Loading Strategic Exam Readiness data...
      </div>
    );
  }

  const {
    overall_readiness_index,
    urgent_topics = [],
    all_topics = [],
    total_marks,
    completed_chapters_count,
    total_chapters_count,
    recommendation
  } = report;

  // Quadrant groupings
  const urgentQuadrant = all_topics.filter(t => t.priority_quadrant === 'URGENT FOCUS');
  const strengthQuadrant = all_topics.filter(t => t.priority_quadrant === 'STRENGTH');
  const reviewQuadrant = all_topics.filter(t => t.priority_quadrant === 'REVIEW LATER');
  const maintainQuadrant = all_topics.filter(t => t.priority_quadrant === 'MAINTAIN');

  return (
    <div className="space-y-6">
      {/* Top Banner: Global Score & Tactical Recommendation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Readiness Index Dial Card */}
        <div className="student-card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400">
              Exam Readiness Index
            </span>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200/80 font-bold">
              Weighted Formula
            </span>
          </div>

          <div className="flex items-center gap-5 my-2">
            <div className="w-20 h-20 rounded-full bg-[#F8F9FC] border-4 border-accentNavy flex flex-col items-center justify-center font-black text-2xl text-gray-950 shadow-sm">
              {overall_readiness_index}%
            </div>

            <div>
              <p className="text-base font-extrabold text-gray-900">
                {overall_readiness_index >= 75 ? 'Exam Ready 🚀' : overall_readiness_index >= 50 ? 'Steady Progress 📈' : 'High Focus Needed ⚠️'}
              </p>
              <p className="text-xs text-gray-500 font-medium mt-1">
                Completed {completed_chapters_count} of {total_chapters_count} Chapters ({Math.round((completed_chapters_count / (total_chapters_count || 1)) * 100)}% coverage)
              </p>
            </div>
          </div>

          <div className="w-full bg-gray-100 rounded-full h-2 mt-4 overflow-hidden">
            <div
              className="bg-accentNavy h-2 rounded-full transition-all duration-700"
              style={{ width: `${Math.min(100, overall_readiness_index)}%` }}
            />
          </div>
        </div>

        {/* AI Tactical Recommendation Card */}
        <div className="lg:col-span-2 student-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
                <span>🎯</span> Study Focus Advisory
              </h3>
              <span className="text-xs font-bold text-gray-500">
                Total Exam Weight: {total_marks} Marks
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-[#F8F9FC] border border-gray-100 mb-3">
              <p className="text-xs sm:text-sm text-gray-700 leading-relaxed font-semibold">
                {recommendation}
              </p>
            </div>
          </div>

          {/* Urgent Warning Highlight if high-weightage topics exist */}
          {urgent_topics.length > 0 ? (
            <div className="p-4 rounded-2xl bg-[#FEE8E8] border border-rose-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
                <div>
                  <p className="text-xs font-black text-rose-950">
                    URGENT REVISION: "{urgent_topics[0].chapter_name}"
                  </p>
                  <p className="text-[11px] text-rose-800 font-medium">
                    Accounts for {urgent_topics[0].weightage_percent}% of the exam with only {urgent_topics[0].accuracy_score}% quiz accuracy.
                  </p>
                </div>
              </div>

              <button
                onClick={() => onNavigateToQuiz(urgent_topics[0].chapter_id)}
                className="w-full sm:w-auto py-2 px-4 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-sm transition-colors flex items-center justify-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5" />
                Fix in Quiz
              </button>
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-[#E8F8EE] border border-emerald-200 text-xs text-emerald-900 font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>All high-yield chapters are currently performing above the 70% accuracy threshold!</span>
            </div>
          )}
        </div>
      </div>

      {/* 4-Quadrant Priority Matrix */}
      <div className="student-card p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-6 pb-4 border-b border-gray-100">
          <div>
            <h3 className="text-base sm:text-lg font-black text-gray-900 tracking-tight flex items-center gap-2">
              <Target className="w-5 h-5 text-gray-900" />
              Strategic 4-Quadrant Focus Matrix
            </h3>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Maps chapters by Exam Weightage (Y-axis) versus Quiz Mastery Accuracy (X-axis).
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Q1: Urgent Focus (Top-Left) */}
          <div className="p-5 rounded-2xl bg-[#FEE8E8]/70 border border-rose-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black uppercase tracking-wider text-rose-950 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
                Quadrant 1: Urgent Focus
              </span>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-900 font-bold">
                High Weightage + Low Accuracy
              </span>
            </div>
            <p className="text-xs text-rose-800 mb-3 font-medium">
              Direct threat to final grades. Prioritize studying these chapters first!
            </p>

            <div className="space-y-2">
              {urgentQuadrant.length === 0 ? (
                <p className="text-xs text-gray-500 italic py-2">No critical chapters in danger zone.</p>
              ) : (
                urgentQuadrant.map(t => (
                  <div key={t.chapter_id} className="p-3.5 rounded-xl bg-white border border-rose-100 shadow-sm flex items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-extrabold text-gray-900">{t.chapter_name}</p>
                      <p className="text-[11px] text-gray-500 font-medium">
                        Weight: <strong className="text-rose-700">{t.weightage_percent}%</strong> • Accuracy: <strong className="text-rose-700">{t.accuracy_score}%</strong>
                      </p>
                    </div>
                    <button
                      onClick={() => onNavigateToQuiz(t.chapter_id)}
                      className="px-3 py-1 text-xs bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-full transition-colors flex items-center gap-1 shadow-sm"
                    >
                      <Play className="w-3 h-3" /> Quiz
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Q2: Strength Zone (Top-Right) */}
          <div className="p-5 rounded-2xl bg-[#E8F8EE]/70 border border-emerald-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-emerald-700" />
                Quadrant 2: Core Strength
              </span>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-bold">
                High Weightage + High Accuracy
              </span>
            </div>
            <p className="text-xs text-emerald-800 mb-3 font-medium">
              Guaranteed marks bank. Maintain with periodic light revision.
            </p>

            <div className="space-y-2">
              {strengthQuadrant.length === 0 ? (
                <p className="text-xs text-gray-500 italic py-2">Score &gt;= 70% in high-yield quizzes to promote chapters here.</p>
              ) : (
                strengthQuadrant.map(t => (
                  <div key={t.chapter_id} className="p-3.5 rounded-xl bg-white border border-emerald-100 shadow-sm flex items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-extrabold text-gray-900">{t.chapter_name}</p>
                      <p className="text-[11px] text-gray-500 font-medium">
                        Weight: <strong className="text-emerald-700">{t.weightage_percent}%</strong> • Accuracy: <strong className="text-emerald-700">{t.accuracy_score}%</strong>
                      </p>
                    </div>
                    <button
                      onClick={() => onNavigateToNotes(t.chapter_id)}
                      className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-full transition-colors flex items-center gap-1"
                    >
                      <FileText className="w-3 h-3 text-emerald-700" /> Notes
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Q3: Review Later (Bottom-Left) */}
          <div className="p-5 rounded-2xl bg-[#FEF9E7]/80 border border-amber-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black uppercase tracking-wider text-amber-950 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-700" />
                Quadrant 3: Review Later
              </span>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold">
                Low Weightage + Low Accuracy
              </span>
            </div>
            <p className="text-xs text-amber-800 mb-3 font-medium">
              Lower ROI right now. Review only after Quadrant 1 is resolved.
            </p>

            <div className="space-y-2">
              {reviewQuadrant.length === 0 ? (
                <p className="text-xs text-gray-500 italic py-2">No chapters currently in this quadrant.</p>
              ) : (
                reviewQuadrant.map(t => (
                  <div key={t.chapter_id} className="p-3.5 rounded-xl bg-white border border-amber-100 shadow-sm flex items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-extrabold text-gray-900">{t.chapter_name}</p>
                      <p className="text-[11px] text-gray-500 font-medium">
                        Weight: {t.weightage_percent}% • Accuracy: {t.accuracy_score}%
                      </p>
                    </div>
                    <button
                      onClick={() => onNavigateToQuiz(t.chapter_id)}
                      className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-full transition-colors"
                    >
                      Practice
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Q4: Maintain (Bottom-Right) */}
          <div className="p-5 rounded-2xl bg-[#EBF5FF]/70 border border-sky-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black uppercase tracking-wider text-sky-950 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-sky-700" />
                Quadrant 4: Maintain
              </span>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-900 font-bold">
                Low Weightage + High Accuracy
              </span>
            </div>
            <p className="text-xs text-sky-800 mb-3 font-medium">
              Solid understanding on auxiliary topics. Quick skimming is sufficient.
            </p>

            <div className="space-y-2">
              {maintainQuadrant.length === 0 ? (
                <p className="text-xs text-gray-500 italic py-2">No low-weight chapters currently mastered.</p>
              ) : (
                maintainQuadrant.map(t => (
                  <div key={t.chapter_id} className="p-3.5 rounded-xl bg-white border border-sky-100 shadow-sm flex items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-extrabold text-gray-900">{t.chapter_name}</p>
                      <p className="text-[11px] text-gray-500 font-medium">
                        Weight: {t.weightage_percent}% • Accuracy: {t.accuracy_score}%
                      </p>
                    </div>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-800 border border-sky-200 font-bold">
                      Mastered
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Chapter Breakdown Details Table */}
      <div className="student-card p-6 sm:p-8 overflow-hidden">
        <h3 className="text-base font-extrabold text-gray-900 mb-4">
          Detailed Chapter Weightage & Accuracy Tracker
        </h3>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100 text-left text-xs">
            <thead>
              <tr className="text-gray-400 bg-gray-50/60">
                <th className="px-4 py-3 font-extrabold">Status</th>
                <th className="px-4 py-3 font-extrabold">Chapter Name</th>
                <th className="px-4 py-3 font-extrabold">Weightage</th>
                <th className="px-4 py-3 font-extrabold">Quiz Accuracy</th>
                <th className="px-4 py-3 font-extrabold">Readiness Index</th>
                <th className="px-4 py-3 font-extrabold">Quadrant</th>
                <th className="px-4 py-3 font-extrabold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {all_topics.map((item) => (
                <tr key={item.chapter_id} className="hover:bg-gray-50/70 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <button
                      onClick={() => onToggleComplete(item.chapter_id)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors ${
                        item.is_completed
                          ? 'bg-[#E8F8EE] border-emerald-300 text-emerald-900'
                          : 'bg-gray-50 border-gray-200 text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {item.is_completed ? 'Completed' : 'Mark Done'}
                    </button>
                  </td>
                  <td className="px-4 py-3 font-bold text-gray-900 max-w-xs truncate">
                    {item.chapter_name}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-700">
                    <strong className="text-gray-950">{item.weightage_marks} Marks</strong> ({item.weightage_percent}%)
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-1.5 rounded-full ${
                            item.accuracy_score >= 70 ? 'bg-emerald-500' : item.accuracy_score >= 40 ? 'bg-amber-400' : 'bg-rose-500'
                          }`}
                          style={{ width: `${item.accuracy_score}%` }}
                        />
                      </div>
                      <span className="font-bold text-gray-900">{item.accuracy_score}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="px-2.5 py-1 rounded-full font-extrabold text-[11px] bg-gray-100 text-gray-900">
                      {item.readiness_index} / 100
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2.5 py-0.5 rounded-full font-extrabold text-[10px] uppercase ${
                      item.priority_quadrant === 'URGENT FOCUS' ? 'bg-rose-100 text-rose-900' :
                      item.priority_quadrant === 'STRENGTH' ? 'bg-emerald-100 text-emerald-900' :
                      item.priority_quadrant === 'REVIEW LATER' ? 'bg-amber-100 text-amber-900' :
                      'bg-sky-100 text-sky-900'
                    }`}>
                      {item.priority_quadrant}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right space-x-2">
                    <button
                      onClick={() => onNavigateToQuiz(item.chapter_id)}
                      className="px-3 py-1 text-xs bg-accentNavy hover:bg-black text-white font-bold rounded-full transition-colors inline-flex items-center gap-1 shadow-sm"
                    >
                      <Play className="w-3 h-3" /> Quiz
                    </button>
                    <button
                      onClick={() => onNavigateToNotes(item.chapter_id)}
                      className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-full transition-colors inline-flex items-center gap-1"
                    >
                      <FileText className="w-3 h-3" /> Notes
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
