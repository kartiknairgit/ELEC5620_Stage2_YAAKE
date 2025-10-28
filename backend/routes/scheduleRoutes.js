const express = require('express');
const router = express.Router();
const {
  createInterview,
  getMyInterviews,
  getInterview,
  respondToInterview,
  updateInterview,
  cancelInterview,
  getAllApplicants
} = require('../controllers/scheduleController');
const { protect } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(protect);

// Get list of applicants (for recruiters)
router.get('/applicants/list', getAllApplicants);

// Create new interview schedule (recruiter only)
router.post('/', createInterview);

// Get all my interviews
router.get('/', getMyInterviews);

// Get single interview
router.get('/:id', getInterview);

// Respond to interview (applicant only)
router.post('/:id/respond', respondToInterview);

// Update interview (recruiter only)
router.patch('/:id', updateInterview);

// Cancel interview (recruiter only)
router.delete('/:id', cancelInterview);

module.exports = router;
