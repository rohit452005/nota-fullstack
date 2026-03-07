const { validationResult } = require('express-validator');
const Note = require('../models/Note');

// GET /api/notes
exports.getNotes = async (req, res) => {
  try {
    const { category, search, pinned, page = 1, limit = 50 } = req.query;
    const query = { user: req.user._id, isArchived: false };

    if (category && category !== 'all') query.category = category;
    if (pinned === 'true') query.pinned = true;
    if (search) {
      query.$text = { $search: search };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [notes, total] = await Promise.all([
      Note.find(query)
        .sort({ pinned: -1, updatedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Note.countDocuments(query),
    ]);

    // Category counts
    const counts = await Note.aggregate([
      { $match: { user: req.user._id, isArchived: false } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]);
    const categoryCounts = counts.reduce((acc, c) => { acc[c._id] = c.count; return acc; }, {});
    categoryCounts.all = await Note.countDocuments({ user: req.user._id, isArchived: false });

    res.json({ notes, total, page: parseInt(page), categoryCounts });
  } catch (err) {
    console.error('getNotes error:', err);
    res.status(500).json({ error: 'Failed to fetch notes.' });
  }
};

// GET /api/notes/:id
exports.getNote = async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, user: req.user._id });
    if (!note) return res.status(404).json({ error: 'Note not found.' });
    res.json({ note });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch note.' });
  }
};

// POST /api/notes
exports.createNote = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { title, content, category, tags, color, pinned } = req.body;
    const note = await Note.create({
      user: req.user._id,
      title: title || 'Untitled Note',
      content: content || '',
      category: category || 'ideas',
      tags: tags || [],
      color,
      pinned: pinned || false,
    });
    res.status(201).json({ note });
  } catch (err) {
    console.error('createNote error:', err);
    res.status(500).json({ error: 'Failed to create note.' });
  }
};

// PUT /api/notes/:id
exports.updateNote = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { title, content, category, tags, color, pinned, isArchived } = req.body;
    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { title, content, category, tags, color, pinned, isArchived },
      { new: true, runValidators: true }
    );
    if (!note) return res.status(404).json({ error: 'Note not found.' });
    res.json({ note });
  } catch (err) {
    console.error('updateNote error:', err);
    res.status(500).json({ error: 'Failed to update note.' });
  }
};

// DELETE /api/notes/:id
exports.deleteNote = async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!note) return res.status(404).json({ error: 'Note not found.' });
    res.json({ message: 'Note deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete note.' });
  }
};

// PATCH /api/notes/:id/pin
exports.togglePin = async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, user: req.user._id });
    if (!note) return res.status(404).json({ error: 'Note not found.' });
    note.pinned = !note.pinned;
    await note.save();
    res.json({ note });
  } catch (err) {
    res.status(500).json({ error: 'Failed to toggle pin.' });
  }
};
