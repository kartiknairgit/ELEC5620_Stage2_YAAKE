// File: backend/routes/jobPostRoutes.js
// Routes for job post handling

const express = require('express');
const jobPostController = require('../controllers/jobPostController');

const router = express.Router();

// Health check endpoint
router.get('/health', jobPostController.health);

// Test endpoint
router.get('/test', jobPostController.test);

// Create job post with full analysis
router.post('/create', jobPostController.createJobPost);

// Quick generation without full analysis
router.post('/generate', jobPostController.generateQuick);

// Check bias only
router.post('/check-bias', jobPostController.checkBias);

// Error handling middleware (matches resume routes pattern)
router.use((error, req, res, next) => {
  if (error) {
    return res.status(400).json({
      error: error.message
    });
  }

  next();
});

module.exports = router;