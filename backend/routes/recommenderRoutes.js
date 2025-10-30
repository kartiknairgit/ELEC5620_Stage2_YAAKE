const express = require('express');
const router = express.Router();
const { learningPath } = require('../controllers/recommenderController');
const { protect } = require('../middleware/authMiddleware');

// Authenticated users can request recommendations for themselves
router.post('/learning-path', protect, learningPath);

module.exports = router;


