const express = require('express');
const rateLimit = require('express-rate-limit');
const { body } = require('express-validator');
const controller = require('../controllers/exportController');

const router = express.Router();
const expLimiter = rateLimit({ windowMs: 60 * 1000, max: 10 });

router.post(
  '/cover-letter',
  expLimiter,
  body('draftText').isString().isLength({ min: 50 }).withMessage('draftText required (min 50 chars)'),
  body('title').optional().isString().isLength({ max: 120 }),
  body('format').optional().isIn(['docx', 'txt']),
  body('download').optional().isBoolean(),
  controller.exportCoverLetter
);

module.exports = router;


