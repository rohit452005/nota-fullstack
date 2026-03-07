const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters'],
    default: 'Untitled Note',
  },
  content: {
    type: String,
    default: '',
    maxlength: [50000, 'Note content cannot exceed 50,000 characters'],
  },
  category: {
    type: String,
    enum: ['ideas', 'specs', 'tasks', 'research', 'personal'],
    default: 'ideas',
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: 30,
  }],
  pinned: {
    type: Boolean,
    default: false,
  },
  color: {
    type: String,
    default: '#f5c842',
  },
  isArchived: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

// Compound index for fast user note queries
noteSchema.index({ user: 1, createdAt: -1 });
noteSchema.index({ user: 1, category: 1 });
noteSchema.index({ user: 1, pinned: -1, createdAt: -1 });

// Text search index
noteSchema.index({ title: 'text', content: 'text', tags: 'text' });

module.exports = mongoose.model('Note', noteSchema);
