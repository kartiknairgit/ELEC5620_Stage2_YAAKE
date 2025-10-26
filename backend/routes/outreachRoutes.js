const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const {
  generateEmail,
  regenerateEmailContent,
  listOutreach,
  getOutreach,
  updateOutreach,
  sendOutreach,
  deleteOutreach,
  exportPDF,
  exportText
} = require('../controllers/outreachController');
const { protect, requireVerification } = require('../middleware/authMiddleware');

// Rate limiters for different operations
const generateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 generations per 15 minutes
  message: 'Too many email generations. Please try again in 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false
});

const sendLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 sends per hour to prevent spam
  message: 'Email sending limit reached. Please try again in 1 hour.',
  standardHeaders: true,
  legacyHeaders: false
});

const regenerateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 regenerations per 15 minutes
  message: 'Too many regeneration requests. Please try again in 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false
});

// All routes require authentication and email verification
router.use(protect, requireVerification);

// Generate new outreach email (with AI)
router.post('/generate', generateLimiter, generateEmail);

// Regenerate existing email with different instructions
router.post('/:id/regenerate', regenerateLimiter, regenerateEmailContent);

// Get all outreach emails for current user
router.get('/', listOutreach);

// Get single outreach email
router.get('/:id', getOutreach);

// Update outreach email manually
router.patch('/:id', updateOutreach);

// Send outreach email via Resend
router.post('/:id/send', sendLimiter, sendOutreach);

// Delete outreach email
router.delete('/:id', deleteOutreach);

// Export routes
router.get('/:id/export/pdf', exportPDF);
router.get('/:id/export/text', exportText);

module.exports = router;
