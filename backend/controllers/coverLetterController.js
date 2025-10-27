const { validationResult } = require('express-validator');
const { generateCoverLetters, refineCoverLetter } = require('../services/coverLetter.service');

async function generate(req, res, next) {
  try {
    console.log('\n📨 COVER LETTER GENERATION REQUEST RECEIVED');
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { resumeText, jobDescriptionText = '', style = 'formal', length = 'standard', userNotes = '', maxWords } = req.body;
    console.log('\n📝 Inputs:', { resumeChars: resumeText?.length || 0, jdChars: jobDescriptionText?.length || 0, style, length, maxWords });
    const t0 = Date.now();
    let data;
    try {
      data = await generateCoverLetters({ resumeText, jobDescriptionText, style, length, userNotes, maxWords });
    } catch (e) {
      console.error('⚠️  First attempt failed, retrying once…', e?.message || e);
      data = await generateCoverLetters({ resumeText, jobDescriptionText, style, length, userNotes, maxWords });
    }
    const t1 = Date.now();
    console.log(`\n✅ Generated ${data.drafts?.length || 0} draft(s) in ${t1 - t0}ms`);
    if (data.drafts && data.drafts[0]) {
      console.log('\n📏 Draft[0] metrics:', {
        wordCount: data.drafts[0].wordCount,
        alignmentScore: data.drafts[0].alignmentScore,
        tone: data.drafts[0].tone
      });
    }
    return res.status(200).json({ success: true, ...data });
  } catch (err) {
    console.error('❌ Cover letter generation failed:', err?.message || err);
    return next(err);
  }
}

async function refine(req, res, next) {
  try {
    console.log('\n✏️  COVER LETTER REFINEMENT REQUEST RECEIVED');
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    const { draftText, editInstructions = '', newTone = '', length = 'standard', maxWords } = req.body;
    console.log('📝 Inputs:', { draftChars: draftText?.length || 0, editInstructions: editInstructions?.slice(0, 80), newTone, length, maxWords });
    const t0 = Date.now();
    let data;
    try {
      data = await refineCoverLetter({ draftText, editInstructions, newTone, length, maxWords });
    } catch (e) {
      console.error('⚠️  First refine attempt failed, retrying once…', e?.message || e);
      data = await refineCoverLetter({ draftText, editInstructions, newTone, length, maxWords });
    }
    const t1 = Date.now();
    console.log(`✅ Refined draft in ${t1 - t0}ms`);
    return res.status(200).json({ success: true, ...data });
  } catch (err) {
    console.error('❌ Cover letter refinement failed:', err?.message || err);
    return next(err);
  }
}

module.exports = {
  generate,
  refine
};


