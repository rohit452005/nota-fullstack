import { useState, useCallback, useEffect } from 'react';
import api from '../lib/api';

export function useNotes() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryCounts, setCategoryCounts] = useState({});
  const [activeCategory, setActiveCategory] = useState('all');
  const [search, setSearch] = useState('');

  const fetchNotes = useCallback(async (category = 'all', q = '') => {
    setLoading(true);
    try {
      const params = {};
      if (category !== 'all') params.category = category;
      if (q) params.search = q;
      const { data } = await api.get('/notes', { params });
      setNotes(data.notes);
      setCategoryCounts(data.categoryCounts);
    } catch (err) {
      console.error('fetchNotes error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => fetchNotes(activeCategory, search), 300);
    return () => clearTimeout(timeout);
  }, [activeCategory, search, fetchNotes]);

  const createNote = useCallback(async (noteData) => {
    const { data } = await api.post('/notes', noteData);
    setNotes((prev) => [data.note, ...prev]);
    setCategoryCounts((prev) => ({
      ...prev,
      all: (prev.all || 0) + 1,
      [data.note.category]: (prev[data.note.category] || 0) + 1,
    }));
    return data.note;
  }, []);

  const updateNote = useCallback(async (id, updates) => {
    const { data } = await api.put(`/notes/${id}`, updates);
    setNotes((prev) => prev.map((n) => (n._id === id ? data.note : n)));
    return data.note;
  }, []);

  const deleteNote = useCallback(async (id) => {
    const note = notes.find((n) => n._id === id);
    await api.delete(`/notes/${id}`);
    setNotes((prev) => prev.filter((n) => n._id !== id));
    if (note) {
      setCategoryCounts((prev) => ({
        ...prev,
        all: Math.max(0, (prev.all || 0) - 1),
        [note.category]: Math.max(0, (prev[note.category] || 0) - 1),
      }));
    }
  }, [notes]);

  const togglePin = useCallback(async (id) => {
    const { data } = await api.patch(`/notes/${id}/pin`);
    setNotes((prev) => prev.map((n) => (n._id === id ? data.note : n)));
    return data.note;
  }, []);

  return {
    notes, loading, categoryCounts,
    activeCategory, setActiveCategory,
    search, setSearch,
    createNote, updateNote, deleteNote, togglePin,
    refetch: () => fetchNotes(activeCategory, search),
  };
}
