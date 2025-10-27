const express = require('express');
const rateLimit = require('express-rate-limit');
const { body } = require('express-validator');
const controller = require('../controllers/coverLetterController');

const router = express.Router();

const genLimiter = rateLimit({ windowMs: 60 * 1000, max: 6 });

router.post(
  '/generate',
  genLimiter,
  body('resumeText').isString().isLength({ min: 50 }).withMessage('resumeText required (min 50 chars)'),
  body('jobDescriptionText').optional().isString().isLength({ max: 20000 }),
  body('style').optional().isIn(['formal', 'conversational', 'persuasive']),
  body('length').optional().isIn(['short', 'standard']),
  body('maxWords').optional().isInt({ min: 120, max: 800 }).toInt(),
  body('userNotes').optional().isString().isLength({ max: 1000 }),
  controller.generate
);

router.post(
  '/refine',
  genLimiter,
  body('draftText').isString().isLength({ min: 50 }).withMessage('draftText required (min 50 chars)'),
  body('editInstructions').optional().isString().isLength({ max: 1000 }),
  body('newTone').optional().isIn(['formal', 'conversational', 'persuasive']),
  body('length').optional().isIn(['short', 'standard']),
  body('maxWords').optional().isInt({ min: 120, max: 800 }).toInt(),
  controller.refine
);

module.exports = router;


