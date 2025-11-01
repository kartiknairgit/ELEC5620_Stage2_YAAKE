// File: backend/routes/resumeRoutes.js
// Routes for resume handling

const express = require('express');
const multer = require('multer');
const path = require('path');
const resumeController = require('../controllers/resumeController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
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
    fileSize: 10 * 1024 * 1024
  }
});

router.get('/health', resumeController.health);

router.get('/test', resumeController.test);

router.post('/parse', protect, upload.single('file'), resumeController.uploadResume);
router.post('/translate/pdf', protect, upload.single('file'), resumeController.translateResumePdf);

router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'FILE_TOO_LARGE') {
      return res.status(400).json({
        error: 'File too large',
        max_size: '10MB'
      });
    }
    return res.status(400).json({
      error: error.message
    });
  }

  if (error) {
    return res.status(400).json({
      error: error.message
    });
  }

  next();
});

module.exports = router;