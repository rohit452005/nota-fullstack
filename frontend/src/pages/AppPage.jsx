import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotes } from '../hooks/useNotes';
import api from '../lib/api';

const P = {
  bg: '#0e0c0a', surface: '#1a1713', surfaceHover: '#221f1b',
  border: '#2e2a24', accent: '#f5c842', text: '#e8e0d4',
  muted: '#7a7060', danger: '#ff5f5f',
};

const CATEGORIES = [
  { id: 'all', label: 'All Notes', icon: '✦', color: '#e8e0d4' },
  { id: 'ideas', label: 'Ideas', icon: '◈', color: '#f5c842' },
  { id: 'specs', label: 'Specs', icon: '⬡', color: '#5eb8ff' },
  { id: 'tasks', label: 'Tasks', icon: '◉', color: '#7ef5a0' },
  { id: 'research', label: 'Research', icon: '◎', color: '#ff8fa3' },
  { id: 'personal', label: 'Personal', icon: '◇', color: '#c084fc' },
];

function timeAgo(date) {
  const diff = Date.now() - new Date(date);
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

function NoteCard({ note, selected, onSelect, onPin, onDelete }) {
  const cat = CATEGORIES.find((c) => c.id === note.category) || CATEGORIES[1];
  const [hovered, setHovered] = useState(false);

  return (
    <div onClick={() => onSelect(note)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ background: selected ? P.surfaceHover : hovered ? P.surfaceHover : P.surface, border: `1.5px solid ${selected ? cat.color + '55' : P.border}`, borderRadius: '16px', padding: '20px', cursor: 'pointer', transition: 'all 0.18s', position: 'relative', overflow: 'hidden', boxShadow: selected ? `0 0 0 1px ${cat.color}30, 0 8px 32px rgba(0,0,0,0.4)` : 'none' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, width: '3px', height: '100%', background: note.color || cat.color, borderRadius: '3px 0 0 3px', opacity: selected || hovered ? 1 : 0.4, transition: 'opacity 0.18s' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '14px', opacity: 0.7 }}>{cat.icon}</span>
          <span style={{ fontSize: '11px', color: cat.color, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{cat.label}</span>
        </div>
        <div style={{ display: 'flex', gap: '6px', opacity: hovered ? 1 : 0, transition: 'opacity 0.15s' }}>
          <button onClick={(e) => { e.stopPropagation(); onPin(note._id); }} style={{ background: 'none', border: 'none', color: note.pinned ? P.accent : P.muted, cursor: 'pointer', fontSize: '14px' }}>
            {note.pinned ? '◈' : '◇'}
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(note._id); }} style={{ background: 'none', border: 'none', color: P.muted, cursor: 'pointer', fontSize: '14px' }}>×</button>
        </div>
      </div>
      <h3 style={{ margin: '0 0 8px', fontSize: '15px', fontWeight: 700, color: P.text, lineHeight: 1.3 }}>{note.title}</h3>
      <p style={{ margin: '0 0 12px', fontSize: '13px', color: P.muted, lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{note.content}</p>
      {note.tags?.length > 0 && (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
          {note.tags.map((t) => <span key={t} style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '100px', background: P.border, color: P.muted }}>#{t}</span>)}
        </div>
      )}
      <div style={{ fontSize: '11px', color: P.muted }}>
        {timeAgo(note.updatedAt)}
        {note.pinned && <span style={{ marginLeft: '8px', color: P.accent }}>◈ pinned</span>}
      </div>
    </div>
  );
}

function NoteEditor({ note, onSave, onClose }) {
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');
  const [category, setCategory] = useState(note?.category || 'ideas');
  const [tags, setTags] = useState(note?.tags?.join(', ') || '');
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [aiMode, setAiMode] = useState(null);
  const [error, setError] = useState('');

  const callAI = async (endpoint) => {
    setAiLoading(true);
    setAiMode(endpoint);
    setAiResult(null);
    try {
      const { data } = await api.post(`/ai/${endpoint}`, { title, content });
      setAiResult(data.result);
    } catch (e) {
      setAiResult('AI request failed. Please try again.');
    }
    setAiLoading(false);
  };

  const applyBeautified = () => { setContent(aiResult); setAiResult(null); setAiMode(null); };
  const applyCategorization = () => {
    if (aiResult.category) setCategory(aiResult.category);
    if (aiResult.tags) setTags(aiResult.tags.join(', '));
    if (aiResult.suggestedTitle) setTitle(aiResult.suggestedTitle);
    setAiResult(null); setAiMode(null);
  };

  const handleSave = async () => {
    if (!title.trim() && !content.trim()) return;
    setSaving(true); setError('');
    try {
      const tagArr = tags.split(',').map((t) => t.trim()).filter(Boolean);
      const cat = CATEGORIES.find((c) => c.id === category);
      await onSave({ title: title || 'Untitled Note', content, category, tags: tagArr, color: cat?.color });
    } catch (e) {
      setError('Failed to save note.');
    }
    setSaving(false);
  };

  const cat = CATEGORIES.find((c) => c.id === category) || CATEGORIES[1];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '24px 28px 16px', borderBottom: `1px solid ${P.border}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <span style={{ fontSize: '12px', color: P.muted, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{note?._id ? 'Edit Note' : 'New Note'}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: P.muted, cursor: 'pointer', fontSize: '20px' }}>×</button>
        </div>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Note title..."
          style={{ width: '100%', background: 'none', border: 'none', outline: 'none', fontSize: '22px', fontFamily: "'Syne', sans-serif", fontWeight: 800, color: P.text, letterSpacing: '-0.02em' }} />
      </div>

      {/* Category + Tags */}
      <div style={{ padding: '12px 28px', borderBottom: `1px solid ${P.border}`, display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        <select value={category} onChange={(e) => setCategory(e.target.value)}
          style={{ background: `${cat.color}18`, border: `1px solid ${cat.color}55`, color: cat.color, borderRadius: '100px', padding: '5px 12px', fontSize: '12px', fontFamily: "'Syne', sans-serif", fontWeight: 700, cursor: 'pointer', outline: 'none' }}>
          {CATEGORIES.filter((c) => c.id !== 'all').map((c) => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
        </select>
        <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="tags, comma separated..."
          style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: '12px', color: P.muted, fontFamily: "'Syne', sans-serif", minWidth: '120px' }} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '20px 28px' }}>
        <textarea value={content} onChange={(e) => setContent(e.target.value)}
          placeholder="Start writing... let your ideas flow."
          style={{ width: '100%', minHeight: '200px', background: 'none', border: 'none', outline: 'none', resize: 'none', fontSize: '15px', fontFamily: "'DM Serif Display', serif", color: P.text, lineHeight: 1.8 }} />

        {/* AI Panel */}
        {(aiLoading || aiResult) && (
          <div style={{ marginTop: '20px', background: P.surfaceHover, border: `1px solid ${P.border}`, borderRadius: '12px', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '12px', color: P.accent, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                ◈ AI {aiMode === 'beautify' ? 'Beautification' : aiMode === 'categorize' ? 'Categorization' : 'Ideas'}
              </span>
              {!aiLoading && <button onClick={() => { setAiResult(null); setAiMode(null); }} style={{ background: 'none', border: 'none', color: P.muted, cursor: 'pointer' }}>×</button>}
            </div>
            {aiLoading ? (
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                {[0,1,2].map((i) => <div key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: P.accent, animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />)}
                <span style={{ marginLeft: '8px', color: P.muted, fontSize: '13px' }}>Claude is thinking...</span>
              </div>
            ) : aiMode === 'categorize' && typeof aiResult === 'object' ? (
              <div>
                {aiResult.category && <div style={{ marginBottom: '8px' }}><span style={{ color: P.muted, fontSize: '12px' }}>Category: </span><span style={{ color: P.text, fontWeight: 700 }}>{aiResult.category}</span></div>}
                {aiResult.tags && <div style={{ marginBottom: '8px' }}><span style={{ color: P.muted, fontSize: '12px' }}>Tags: </span><span style={{ color: P.text }}>{aiResult.tags.join(', ')}</span></div>}
                {aiResult.suggestedTitle && <div style={{ marginBottom: '8px' }}><span style={{ color: P.muted, fontSize: '12px' }}>Title: </span><span style={{ color: P.text }}>{aiResult.suggestedTitle}</span></div>}
                {aiResult.reason && <div style={{ marginBottom: '14px', color: P.muted, fontSize: '13px', fontStyle: 'italic' }}>{aiResult.reason}</div>}
                {aiResult.category && <button onClick={applyCategorization} style={{ padding: '8px 20px', background: P.accent, color: '#0e0c0a', border: 'none', borderRadius: '100px', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}>Apply</button>}
              </div>
            ) : (
              <div>
                <pre style={{ whiteSpace: 'pre-wrap', fontSize: '14px', color: P.text, fontFamily: "'DM Serif Display', serif", lineHeight: 1.7, margin: '0 0 14px' }}>{typeof aiResult === 'string' ? aiResult : JSON.stringify(aiResult, null, 2)}</pre>
                {aiMode === 'beautify' && <button onClick={applyBeautified} style={{ padding: '8px 20px', background: P.accent, color: '#0e0c0a', border: 'none', borderRadius: '100px', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}>Apply</button>}
              </div>
            )}
          </div>
        )}

        {error && <div style={{ marginTop: '12px', color: P.danger, fontSize: '13px' }}>{error}</div>}
      </div>

      {/* AI Toolbar + Save */}
      <div style={{ padding: '16px 28px', borderTop: `1px solid ${P.border}`, display: 'flex', gap: '10px', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[['beautify','✦ Beautify'],['categorize','⬡ Categorize'],['ideas','◈ Spark Ideas']].map(([ep, label]) => (
            <button key={ep} onClick={() => callAI(ep)} disabled={aiLoading}
              style={{ padding: '8px 16px', background: 'transparent', border: `1px solid ${P.border}`, color: P.text, borderRadius: '100px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
              {label}
            </button>
          ))}
        </div>
        <button onClick={handleSave} disabled={saving}
          style={{ padding: '10px 24px', background: P.accent, color: '#0e0c0a', border: 'none', borderRadius: '100px', fontSize: '13px', fontWeight: 800, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
          {saving ? 'Saving...' : 'Save Note'}
        </button>
      </div>
    </div>
  );
}

export default function AppPage() {
  const { user, logout } = useAuth();
  const { notes, loading, categoryCounts, activeCategory, setActiveCategory, search, setSearch, createNote, updateNote, deleteNote, togglePin } = useNotes();
  const [selectedNote, setSelectedNote] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = async (data) => {
    if (selectedNote?._id) {
      const updated = await updateNote(selectedNote._id, data);
      setSelectedNote(updated);
    } else {
      const created = await createNote(data);
      setSelectedNote(created);
    }
    setIsEditing(false);
  };

  const handleDelete = async (id) => {
    await deleteNote(id);
    if (selectedNote?._id === id) { setSelectedNote(null); setIsEditing(false); }
  };

  const filtered = notes; // Already filtered server-side

  return (
    <>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:.3;transform:scale(.8)} 50%{opacity:1;transform:scale(1.2)} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        select option { background: #1a1713; color: #e8e0d4; }
        input::placeholder, textarea::placeholder { color: #7a7060; }
      `}</style>

      <div style={{ display: 'flex', height: '100vh', background: P.bg, color: P.text, overflow: 'hidden', fontFamily: "'Syne', sans-serif" }}>

        {/* SIDEBAR */}
        <div style={{ width: '220px', minWidth: '220px', borderRight: `1px solid ${P.border}`, display: 'flex', flexDirection: 'column', padding: '28px 0' }}>
          <div style={{ padding: '0 22px 20px', borderBottom: `1px solid ${P.border}` }}>
            <div style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.03em' }}>nota<span style={{ color: P.accent }}>.</span></div>
            <div style={{ fontSize: '11px', color: P.muted, marginTop: '2px' }}>AI-powered notes</div>
          </div>

          <div style={{ flex: 1, padding: '20px 12px', overflow: 'auto' }}>
            <div style={{ fontSize: '10px', letterSpacing: '0.12em', color: P.muted, textTransform: 'uppercase', marginBottom: '10px', paddingLeft: '10px' }}>Collections</div>
            {CATEGORIES.map((cat) => (
              <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
                style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px', borderRadius: '10px', border: 'none', background: activeCategory === cat.id ? `${cat.color}15` : 'transparent', color: activeCategory === cat.id ? cat.color : P.muted, cursor: 'pointer', fontSize: '13px', fontWeight: activeCategory === cat.id ? 700 : 500, transition: 'all 0.15s', marginBottom: '2px', fontFamily: "'Syne', sans-serif" }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><span>{cat.icon}</span>{cat.label}</span>
                <span style={{ fontSize: '11px', opacity: 0.6, background: activeCategory === cat.id ? `${cat.color}20` : P.border, padding: '1px 7px', borderRadius: '100px' }}>
                  {categoryCounts[cat.id] || 0}
                </span>
              </button>
            ))}
          </div>

          {/* User + logout */}
          <div style={{ padding: '12px 16px', borderTop: `1px solid ${P.border}` }}>
            <div style={{ fontSize: '12px', color: P.muted, marginBottom: '10px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.name}
            </div>
            <button onClick={logout} style={{ width: '100%', padding: '8px', background: 'transparent', border: `1px solid ${P.border}`, color: P.muted, borderRadius: '10px', fontSize: '12px', fontFamily: "'Syne', sans-serif", cursor: 'pointer' }}>
              Sign Out
            </button>
          </div>

          <div style={{ padding: '0 12px' }}>
            <button onClick={() => { setSelectedNote(null); setIsEditing(true); }}
              style={{ width: '100%', padding: '12px', background: P.accent, color: '#0e0c0a', border: 'none', borderRadius: '12px', fontWeight: 800, fontSize: '13px', cursor: 'pointer', fontFamily: "'Syne', sans-serif" }}>
              + New Note
            </button>
          </div>
        </div>

        {/* NOTE LIST */}
        <div style={{ width: '320px', minWidth: '320px', borderRight: `1px solid ${P.border}`, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '20px 18px 16px', borderBottom: `1px solid ${P.border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: P.surface, border: `1px solid ${P.border}`, borderRadius: '12px', padding: '10px 14px' }}>
              <span style={{ color: P.muted }}>⌕</span>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search notes..."
                style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: '13px', fontFamily: "'Syne', sans-serif", color: P.text }} />
            </div>
          </div>

          <div style={{ flex: 1, overflow: 'auto', padding: '14px' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: P.muted }}>
                <div style={{ fontSize: '32px', marginBottom: '12px', opacity: 0.3 }}>✦</div>
                <div style={{ fontSize: '13px' }}>Loading...</div>
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: P.muted }}>
                <div style={{ fontSize: '32px', marginBottom: '12px', opacity: 0.3 }}>◎</div>
                <div style={{ fontSize: '13px' }}>No notes here yet</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {filtered.map((note) => (
                  <div key={note._id} style={{ animation: 'fadeIn 0.2s ease' }}>
                    <NoteCard note={note} selected={selectedNote?._id === note._id}
                      onSelect={(n) => { setSelectedNote(n); setIsEditing(false); }}
                      onPin={togglePin} onDelete={handleDelete} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* MAIN PANEL */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {isEditing ? (
            <NoteEditor note={selectedNote} onSave={handleSave} onClose={() => setIsEditing(false)} />
          ) : selectedNote ? (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ padding: '24px 32px 20px', borderBottom: `1px solid ${P.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  {(() => { const cat = CATEGORIES.find((c) => c.id === selectedNote.category);
                    return <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                      <span style={{ color: cat?.color }}>{cat?.icon}</span>
                      <span style={{ color: cat?.color, fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{cat?.label}</span>
                      <span style={{ color: P.muted, fontSize: '11px' }}>· {timeAgo(selectedNote.updatedAt)}</span>
                    </div>;
                  })()}
                  <h1 style={{ fontSize: '26px', fontWeight: 800, letterSpacing: '-0.02em', color: P.text }}>{selectedNote.title}</h1>
                </div>
                <button onClick={() => setIsEditing(true)}
                  style={{ padding: '10px 22px', background: 'transparent', border: `1px solid ${P.border}`, color: P.text, borderRadius: '100px', fontWeight: 700, fontSize: '13px', cursor: 'pointer', fontFamily: "'Syne', sans-serif" }}>
                  Edit
                </button>
              </div>
              {selectedNote.tags?.length > 0 && (
                <div style={{ padding: '14px 32px', borderBottom: `1px solid ${P.border}`, display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {selectedNote.tags.map((t) => <span key={t} style={{ fontSize: '12px', padding: '3px 12px', borderRadius: '100px', background: P.surface, border: `1px solid ${P.border}`, color: P.muted }}>#{t}</span>)}
                </div>
              )}
              <div style={{ flex: 1, overflow: 'auto', padding: '28px 32px' }}>
                <div style={{ fontSize: '16px', fontFamily: "'DM Serif Display', serif", color: P.text, lineHeight: 1.85, whiteSpace: 'pre-wrap', maxWidth: '680px' }}>
                  {selectedNote.content}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: P.muted, padding: '40px' }}>
              <div style={{ fontSize: '56px', marginBottom: '20px', opacity: 0.12 }}>✦</div>
              <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>Select a note or create one</div>
              <div style={{ fontSize: '14px', opacity: 0.6, textAlign: 'center', maxWidth: '300px' }}>Use AI to beautify, categorize, and spark ideas from your notes.</div>
              <button onClick={() => { setSelectedNote(null); setIsEditing(true); }}
                style={{ marginTop: '24px', padding: '12px 28px', background: P.accent, color: '#0e0c0a', border: 'none', borderRadius: '100px', fontWeight: 800, fontSize: '13px', cursor: 'pointer', fontFamily: "'Syne', sans-serif" }}>
                + Create your first note
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
