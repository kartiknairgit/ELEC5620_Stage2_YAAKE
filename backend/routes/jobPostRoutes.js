const express = require('express');
const jobPostController = require('../controllers/jobPostController');
const { protect, authorize, optionalAuth } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/health', jobPostController.health);

router.post('/', protect, authorize('recruiter'), jobPostController.create);
router.get('/mine', protect, authorize('recruiter'), jobPostController.listMine);
router.get('/public', jobPostController.listPublic);
router.get('/insights/career', protect, authorize('career_trainer'), jobPostController.getCareerInsights);
router.get('/:id', optionalAuth, jobPostController.getById);

module.exports = router;

