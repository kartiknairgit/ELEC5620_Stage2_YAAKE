const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const {
  generateQuestions,
  getMyQuestionSets,
  getPublicSamples,
  getCompanyTemplates,
  getQuestionSetById,
  updateQuestionSet,
  deleteQuestionSet,
  updateVisibility,
  provideFeedback,
  exportQuestionSetPDF
} = require('../controllers/questionController');
const { protect, requireVerification, authorize } = require('../middleware/authMiddleware');

// Rate limiter for question generation (AI operations)
const generateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // 15 generations per 15 minutes
  message: 'Too many question generation requests. Please try again in 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false
});

// PUBLIC ROUTES (for applicants to browse samples)
// These routes are accessible without authentication or with basic authentication
router.get('/samples', protect, getPublicSamples); // Protected to track usage
router.get('/templates', protect, getCompanyTemplates); // Protected to track usage

// PROTECTED ROUTES - Require authentication only (verification optional for testing)
router.use(protect);

// RECRUITER-ONLY ROUTES (must be before /:id to avoid route collision)
// Get all question sets for current recruiter
router.get('/my-sets', authorize('recruiter'), getMyQuestionSets);

// Generate new question set using AI
router.post('/generate', authorize('recruiter'), generateLimiter, generateQuestions);

// Get single question set (role-based access control in controller)
// This MUST come after specific routes like /my-sets
router.get('/:id', getQuestionSetById);

// Export question set as PDF (role-based access control in controller)
router.get('/:id/export/pdf', exportQuestionSetPDF);

// Update question set (edit questions, change details)
router.patch('/:id', authorize('recruiter'), updateQuestionSet);

// Delete question set
router.delete('/:id', authorize('recruiter'), deleteQuestionSet);

// Update visibility (make public/template/private)
router.post('/:id/visibility', authorize('recruiter'), updateVisibility);

// Provide feedback on AI-generated questions
router.post('/:id/feedback', authorize('recruiter'), provideFeedback);

module.exports = router;
