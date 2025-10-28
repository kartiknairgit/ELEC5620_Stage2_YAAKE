const express = require('express');
const router = express.Router();
const { listCourses, getCourse, createCourse, updateCourse, deleteCourse } = require('../controllers/coursesController');
const { extractFromUrl } = require('../controllers/coursesController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Listing and search - only for authenticated users (returns their own courses)
router.get('/', protect, listCourses);
router.get('/:id', getCourse);

// Protected endpoints for career trainers
// Endpoint to extract metadata from a URL (authenticated users)
router.post('/extract', protect, extractFromUrl);
//
router.post('/', protect, authorize('career_trainer'), createCourse);
router.patch('/:id', protect, authorize('career_trainer'), updateCourse);
router.delete('/:id', protect, authorize('career_trainer'), deleteCourse);

module.exports = router;
