// File: backend/controllers/jobPostController.js
// Job post controller - handles job post creation

const JobPostService = require('../services/jobPostService');

const jobPostService = new JobPostService();

exports.createJobPost = async (req, res) => {
  try {
    console.log('\n📨 JOB POST CREATION REQUEST RECEIVED');

    const userId = req.headers['x-user-id'] || req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: '❌ X-User-ID header or user auth required' });
    }

    console.log(`👤 User ID: ${userId}`);

    const jobDetails = req.body;

    if (!jobDetails.jobTitle) {
      return res.status(400).json({ error: '❌ Job title is required' });
    }

    console.log(`📝 Job Title: ${jobDetails.jobTitle}`);

    const result = await jobPostService.processJobPost(jobDetails, userId);

    console.log('💾 Job post created (DB integration pending)');

    return res.status(200).json(result);
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);

    return res.status(500).json({
      error: 'Server error',
      message: error.message
    });
  }
};

exports.generateQuick = async (req, res) => {
  try {
    console.log('\n⚡ QUICK GENERATION REQUEST');

    const userId = req.headers['x-user-id'] || req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: '❌ X-User-ID header or user auth required' });
    }

    const jobDetails = req.body;

    if (!jobDetails.jobTitle) {
      return res.status(400).json({ error: '❌ Job title is required' });
    }

    console.log(`📝 Quick generation for: ${jobDetails.jobTitle}`);

    const jobPost = await jobPostService.generateJobPost(jobDetails);

    return res.status(200).json({
      success: true,
      data: jobPost
    });
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);

    return res.status(500).json({
      error: 'Server error',
      message: error.message
    });
  }
};

exports.checkBias = async (req, res) => {
  try {
    console.log('\n🔍 BIAS CHECK REQUEST');

    const userId = req.headers['x-user-id'] || req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: '❌ X-User-ID header or user auth required' });
    }

    const { jobPost } = req.body;

    if (!jobPost) {
      return res.status(400).json({ error: '❌ Job post data is required' });
    }

    console.log('🛡️  Checking for bias...');

    const biasCheck = await jobPostService.checkBiasAndInclusion(jobPost);

    return res.status(200).json({
      success: true,
      data: biasCheck
    });
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);

    return res.status(500).json({
      error: 'Server error',
      message: error.message
    });
  }
};

exports.health = (req, res) => {
  res.status(200).json({
    status: '✅ Job post service is running',
    service: 'Job Post Creation & Analysis',
    ai: 'Google Gemini (FREE)',
    database: 'MongoDB (pending integration)'
  });
};

exports.test = (req, res) => {
  res.status(200).json({
    status: '✅ Job post controller working',
    instructions: 'Use POST /api/jobposts/create to create a job post'
  });
};