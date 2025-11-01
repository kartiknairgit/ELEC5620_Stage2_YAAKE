const { recommendLearningPath } = require('../services/learningRecommender.service');
const { protect } = require('../middleware/authMiddleware');

/**
 * POST /api/recommender/learning-path
 * Body: { resumeText: string, jobDescription?: string, targetRole?: string }
 */
async function learningPath(req, res) {
  try {
    const { resumeText, jobDescription, targetRole } = req.body || {};

    const result = await recommendLearningPath({
      resumeText,
      jobDescription,
      targetRole,
      requesterUserId: req.user ? String(req.user._id || req.user.id) : null
    });

    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ success: false, message: err.message || 'Failed to compute learning path' });
  }
}

module.exports = {
  learningPath
};


