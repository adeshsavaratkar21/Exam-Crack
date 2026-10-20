import React, { useState, useEffect } from 'react';
import { CheckSquare, Plus, Trash2, Check, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

const DEFAULT_TASKS = [
  { id: 1, text: "Revise DC Unit 2 Message Passing & Socket IPC", subject: "DC", completed: true },
  { id: 2, text: "Practice 10-Question Daily Chapter Quiz for AISC", subject: "AISC", completed: true },
  { id: 3, text: "Solve 2023 Endsem Lamport Clock numerical", subject: "DC", completed: false },
  { id: 4, text: "Practice DFA State Minimization proofs", subject: "TOC", completed: false }
];

export default function SidebarTodoList() {
  const [tasks, setTasks] = useState(() => {
    try {
      const saved = localStorage.getItem('examprep_daily_tasks');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load daily tasks:', e);
    }
    return DEFAULT_TASKS;
  });

  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskSubject, setNewTaskSubject] = useState('DC');

  const handleToggleTask = (taskId) => {
    setTasks((prev) => {
      const next = prev.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t));
      const willBeAllDone = next.length > 0 && next.every((t) => t.completed);
      if (willBeAllDone) {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 }
        });
      }
      localStorage.setItem('examprep_daily_tasks', JSON.stringify(next));
      return next;
    });
  };

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;

    const newTask = {
      id: Date.now(),
      text: newTaskText.trim(),
      subject: newTaskSubject,
      completed: false
    };

    const next = [newTask, ...tasks];
    setTasks(next);
    localStorage.setItem('examprep_daily_tasks', JSON.stringify(next));
    setNewTaskText('');
  };

  const handleDeleteTask = (taskId) => {
    const next = tasks.filter((t) => t.id !== taskId);
    setTasks(next);
    localStorage.setItem('examprep_daily_tasks', JSON.stringify(next));
  };

  const completedCount = tasks.filter((t) => t.completed).length;

  return (
    <div className="pt-4 border-t border-gray-100 flex flex-col min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <CheckSquare className="w-3.5 h-3.5 text-gray-900" />
          <h4 className="font-extrabold text-[11px] text-gray-900 uppercase tracking-wider">
            Study To-Do
          </h4>
        </div>
        <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
          {completedCount}/{tasks.length} Done
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-100 h-1 rounded-full overflow-hidden mb-2.5">
        <div
          className="bg-emerald-500 h-1 rounded-full transition-all duration-300"
          style={{ width: `${tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0}%` }}
        />
      </div>

      {/* Quick Add Form */}
      <form onSubmit={handleAddTask} className="mb-2.5">
        <div className="flex items-center gap-1">
          <input
            type="text"
            placeholder="New task..."
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            className="flex-1 min-w-0 bg-[#F8F9FC] border border-gray-200 rounded-lg px-2 py-1 text-[11px] text-gray-800 placeholder-gray-400 focus:outline-none focus:border-amber-400"
          />
          <select
            value={newTaskSubject}
            onChange={(e) => setNewTaskSubject(e.target.value)}
            className="bg-[#F8F9FC] border border-gray-200 rounded-lg px-1 py-1 text-[10px] font-bold text-gray-700 focus:outline-none shrink-0"
          >
            <option value="DC">DC</option>
            <option value="TOC">TOC</option>
            <option value="CNS">CNS</option>
            <option value="SE">SE</option>
            <option value="AISC">AISC</option>
            <option value="MDM">MDM</option>
          </select>
          <button
            type="submit"
            disabled={!newTaskText.trim()}
            className="w-6 h-6 rounded-lg bg-accentYellow hover:bg-accentYellowHover text-gray-950 font-black flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            title="Add task"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>
      </form>

      {/* Scrollable Tasks List */}
      <div className="space-y-1.5 overflow-y-auto max-h-48 pr-0.5 scrollbar-thin">
        {tasks.length === 0 ? (
          <p className="text-[10px] text-gray-400 text-center py-2 font-medium">
            No pending tasks. Add one above!
          </p>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className={`p-1.5 rounded-lg border text-left transition-all flex items-start justify-between gap-1.5 group ${
                task.completed
                  ? 'bg-gray-50/60 border-gray-200/50 opacity-75'
                  : 'bg-white border-gray-200 hover:border-gray-300 shadow-3xs'
              }`}
            >
              <div
                onClick={() => handleToggleTask(task.id)}
                className="flex items-start gap-1.5 flex-1 min-w-0 cursor-pointer"
              >
                <div
                  className={`w-3.5 h-3.5 mt-0.5 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                    task.completed
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : 'border-gray-300 hover:border-emerald-500 bg-white'
                  }`}
                >
                  {task.completed && <Check className="w-2 h-2 stroke-[3]" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className={`text-[11px] leading-tight break-words ${
                      task.completed ? 'line-through text-gray-400 font-medium' : 'text-gray-800 font-semibold'
                    }`}
                  >
                    {task.text}
                  </p>
                  <span className="inline-block mt-0.5 text-[8px] font-black uppercase px-1 py-0.2 rounded bg-gray-100 text-gray-600">
                    {task.subject}
                  </span>
                </div>
              </div>

              <button
                onClick={() => handleDeleteTask(task.id)}
                className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-rose-500 p-0.5 transition-opacity shrink-0"
                title="Delete task"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
