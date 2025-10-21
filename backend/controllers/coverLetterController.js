const { validationResult } = require('express-validator');
const { generateCoverLetters, refineCoverLetter } = require('../services/coverLetter.service');

async function generate(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { resumeText, jobDescriptionText = '', style = 'formal', length = 'standard', userNotes = '' } = req.body;
    const data = await generateCoverLetters({ resumeText, jobDescriptionText, style, length, userNotes });
    return res.status(200).json({ success: true, ...data });
  } catch (err) {
    return next(err);
  }
}

async function refine(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    const { draftText, editInstructions = '', newTone = '', length = 'standard' } = req.body;
    const data = await refineCoverLetter({ draftText, editInstructions, newTone, length });
    return res.status(200).json({ success: true, ...data });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  generate,
  refine
};


