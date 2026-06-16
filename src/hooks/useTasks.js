import { useState } from 'react';

const STORAGE_KEY = 'pa_tasks';

function load() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch { return []; }
}

function save(tasks) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

export function useTasks() {
  const [tasks, setTasks] = useState(() => load());

  function addTask(title) {
    if (!title.trim()) return;
    const task = {
      id: Date.now(),
      title: title.trim(),
      completed: false,
      createdAt: new Date().toISOString(),
    };
    setTasks(prev => {
      const next = [task, ...prev];
      save(next);
      return next;
    });
  }

  function toggleTask(id) {
    setTasks(prev => {
      const next = prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
      save(next);
      return next;
    });
  }

  function deleteTask(id) {
    setTasks(prev => {
      const next = prev.filter(t => t.id !== id);
      save(next);
      return next;
    });
  }

  const completedCount = tasks.filter(t => t.completed).length;
  const progress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  return { tasks, addTask, toggleTask, deleteTask, completedCount, progress };
}
