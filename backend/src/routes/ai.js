const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { beautify, categorize, sparkIdeas } = require('../controllers/aiController');

router.use(protect); // All AI routes require auth

router.post('/beautify', beautify);
router.post('/categorize', categorize);
router.post('/ideas', sparkIdeas);

module.exports = router;
