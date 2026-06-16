import { useState } from 'react';

const STORAGE_KEY = 'pa_notes';

function load() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch { return []; }
}

function save(notes) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

export function useNotes() {
  const [notes, setNotes] = useState(() => load());
  const [search, setSearch] = useState('');

  function addNote(title, body = '') {
    if (!title.trim()) return;
    const note = {
      id: Date.now(),
      title: title.trim(),
      body: body.trim(),
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    setNotes(prev => {
      const next = [note, ...prev];
      save(next);
      return next;
    });
    return note.id;
  }

  function updateNote(id, patch) {
    setNotes(prev => {
      const next = prev.map(n =>
        n.id === id ? { ...n, ...patch, updatedAt: new Date().toISOString() } : n
      );
      save(next);
      return next;
    });
  }

  function deleteNote(id) {
    setNotes(prev => {
      const next = prev.filter(n => n.id !== id);
      save(next);
      return next;
    });
  }

  const filtered = notes.filter(n =>
    n.title.toLowerCase().includes(search.toLowerCase()) ||
    n.body.toLowerCase().includes(search.toLowerCase())
  );

  return { notes, filtered, search, setSearch, addNote, updateNote, deleteNote };
}
