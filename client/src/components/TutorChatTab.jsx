import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquareQuote,
  Send,
  Sparkles,
  Bot,
  User,
  Trash2,
  HelpCircle,
  BookOpen,
  ArrowRight,
  RotateCcw
} from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';
import api from '../services/api';

const DEFAULT_SUGGESTIONS = [
  "Explain this concept in simpler everyday terms with an analogy",
  "Walk me through a step-by-step worked example or derivation",
  "What are the most common exam traps professors set on this topic?",
  "How should I structure a 10-mark university answer for this?"
];

export default function TutorChatTab({
  chapterId,
  chapterName,
  subjectName,
  subjectId,
  initialQuery = '',
}) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState(initialQuery || '');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const messagesEndRef = useRef(null);

  // If initialQuery changes from outside (e.g. clicking "Ask AI Doubt" on a specific step), set it
  useEffect(() => {
    if (initialQuery) {
      setInputText(initialQuery);
    }
  }, [initialQuery]);

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend) => {
    const query = (textToSend || inputText).trim();
    if (!query || isLoading) return;

    setErrorMsg('');
    const userMsg = { role: 'user', content: query, timestamp: new Date() };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInputText('');
    setIsLoading(true);

    try {
      const payload = {
        subject_id: Number(subjectId),
        chapter_id: Number(chapterId),
        message: query,
        history: newHistory.map((m) => ({ role: m.role, content: m.content })),
      };

      const res = await api.askTutorDoubt(payload);
      const assistantMsg = {
        role: 'assistant',
        content: res.data.reply,
        suggestions: res.data.suggested_questions || [],
        timestamp: new Date(),
      };
      setMessages([...newHistory, assistantMsg]);
    } catch (err) {
      console.error('Tutor chat error:', err);
      setErrorMsg(err.response?.data?.detail || 'Failed to get answer. Please check connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setErrorMsg('');
  };

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="student-card p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center shrink-0">
            <MessageSquareQuote className="w-5 h-5 text-amber-900" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-extrabold text-gray-900">AI Concept Doubt Solver</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                Book / PPT Grounded
              </span>
            </div>
            <p className="text-xs text-gray-500 font-medium">
              Ask anything unclear in <strong className="text-gray-800">{chapterName}</strong> ({subjectName})
            </p>
          </div>
        </div>

        {messages.length > 0 && (
          <button
            onClick={clearChat}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-500 hover:text-rose-600 hover:bg-rose-50 transition-all"
            title="Clear chat history"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear
          </button>
        )}
      </div>

      {/* Chat Messages Container */}
      <div className="student-card p-5 min-h-[460px] max-h-[560px] overflow-y-auto space-y-4 flex flex-col scrollbar-thin">
        {messages.length === 0 ? (
          <div className="my-auto py-8 text-center space-y-4 max-w-lg mx-auto">
            <div className="w-14 h-14 rounded-3xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto shadow-xs">
              <Bot className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-gray-900">What concept is not clear to you?</h4>
              <p className="text-xs text-gray-500 leading-relaxed">
                I'm your 24/7 Academic Professor. Ask about derivations, theorems, state tables, or request intuitive real-world analogies.
              </p>
            </div>

            {/* Quick Suggestion Chips */}
            <div className="pt-2 text-left space-y-2">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block text-center">
                Popular Quick Prompts
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {DEFAULT_SUGGESTIONS.map((sugg, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(sugg)}
                    className="p-2.5 text-left rounded-xl bg-gray-50 hover:bg-amber-50/70 border border-gray-100 hover:border-amber-200 text-xs text-gray-700 transition-all flex items-start gap-2 group"
                  >
                    <ArrowRight className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5 group-hover:translate-x-0.5 transition-transform" />
                    <span className="line-clamp-2">{sugg}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={index}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center shrink-0 mt-1 shadow-xs">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed ${
                    isUser
                      ? 'bg-gray-900 text-white rounded-tr-xs shadow-sm'
                      : 'bg-white border border-gray-100 rounded-tl-xs shadow-xs text-gray-800'
                  }`}
                >
                  {isUser ? (
                    <p className="whitespace-pre-wrap font-medium">{msg.content}</p>
                  ) : (
                    <div className="space-y-3">
                      <MarkdownRenderer content={msg.content} />

                      {/* Follow-up question chips */}
                      {msg.suggestions && msg.suggestions.length > 0 && (
                        <div className="pt-3 border-t border-gray-100 space-y-1.5">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-amber-500" />
                            Suggested Follow-Ups:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {msg.suggestions.map((s, sIdx) => (
                              <button
                                key={sIdx}
                                onClick={() => handleSendMessage(s)}
                                className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-[11px] font-medium transition-all text-left"
                              >
                                {s}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-gray-200 text-gray-700 flex items-center justify-center shrink-0 mt-1">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Loading state indicator */}
        {isLoading && (
          <div className="flex gap-3 justify-start items-center">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center shrink-0 shadow-xs">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl p-3 shadow-xs flex items-center gap-2">
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce [animation-delay:0.4s]" />
              </div>
              <span className="text-xs text-gray-500 font-medium">
                AI Tutor is consulting prescribed syllabus, textbooks & PPT slides...
              </span>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            {errorMsg}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="student-card p-2.5 flex items-end gap-2">
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question or explain what concept feels confusing..."
          rows={2}
          className="flex-1 resize-none bg-transparent px-3 py-2 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none"
        />

        <button
          onClick={() => handleSendMessage()}
          disabled={!inputText.trim() || isLoading}
          className="p-3 rounded-xl bg-gray-900 hover:bg-black text-white font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          title="Send question"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
