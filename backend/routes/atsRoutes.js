// File: backend/routes/atsRoutes.js
// Routes for ATS scoring functionality

const express = require('express');
const multer = require('multer');
const path = require('path');
const atsController = require('../controllers/atsController');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `ats-${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedExtensions = ['.pdf', '.docx', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();

    if (!allowedExtensions.includes(ext)) {
      return cb(new Error(`File type not allowed. Allowed: ${allowedExtensions.join(', ')}`));
    }

    cb(null, true);
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Routes
router.get('/health', atsController.health);

router.get('/criteria', atsController.getCriteria);

router.post('/score', upload.single('resume'), atsController.scoreResume);

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'FILE_TOO_LARGE') {
      return res.status(400).json({
        success: false,
        error: 'File too large',
        message: 'Maximum file size is 10MB'
      });
    }
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }

  if (error) {
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }

  next();
});

module.exports = router;
