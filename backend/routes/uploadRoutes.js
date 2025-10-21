const express = require('express');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const { uploadResume } = require('../controllers/uploadController');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });
const upLimiter = rateLimit({ windowMs: 60 * 1000, max: 8 });

router.post('/resume', upLimiter, upload.single('file'), uploadResume);

module.exports = router;


