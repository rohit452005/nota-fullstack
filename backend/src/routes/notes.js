const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getNotes, getNote, createNote, updateNote, deleteNote, togglePin,
} = require('../controllers/notesController');

const noteValidation = [
  body('title').optional().trim().isLength({ max: 200 }),
  body('content').optional().isLength({ max: 50000 }),
  body('category').optional().isIn(['ideas', 'specs', 'tasks', 'research', 'personal']),
  body('tags').optional().isArray().custom((tags) => tags.every((t) => typeof t === 'string' && t.length <= 30)),
];

router.use(protect); // All note routes require auth

router.get('/', getNotes);
router.get('/:id', getNote);
router.post('/', noteValidation, createNote);
router.put('/:id', noteValidation, updateNote);
router.delete('/:id', deleteNote);
router.patch('/:id/pin', togglePin);

module.exports = router;
