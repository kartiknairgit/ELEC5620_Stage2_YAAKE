// File: backend/routes/jobPostRoutes.js
// Routes for job post handling

const express = require('express');
const jobPostController = require('../controllers/jobPostController');
const { protect, authorize, optional } = require('../middleware/authMiddleware');

const router = express.Router();

// Health check endpoint
router.get('/health', jobPostController.health);

// Test endpoint
router.get('/test', jobPostController.test);

// Create job post with full analysis
router.post('/create', protect, authorize('recruiter'), jobPostController.createJobPost);

// Quick generation without full analysis
router.post('/generate', protect, authorize('recruiter'), jobPostController.generateQuick);

// Check bias only
router.post('/check-bias', protect, authorize('recruiter'), jobPostController.checkBias);

// Recruiter dashboard listings
router.get('/mine', protect, authorize('recruiter'), jobPostController.getRecruiterJobPosts);

// Public listings for applicants
router.get('/public', jobPostController.getPublicJobPosts);

// Job post detail (optional auth to allow owner access to drafts)
router.get('/:id', optional, jobPostController.getJobPostById);

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
